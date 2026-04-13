#!/bin/sh
# Parental Control Time Tracker
# Run via cron every 5 minutes
# Usage: /usr/share/parental-control/tracker.sh

LOG_TAG="parental-control"
STATE_DIR="/tmp/parental-control"
CONFIG_FILE="/etc/config/parental_control"
BLOCKED_FILE="$STATE_DIR/blocked"

log() {
    logger -t "$LOG_TAG" "$1"
}

# Check if parental control is enabled
ENABLED=$(uci get parental_control.global.enabled 2>/dev/null)
if [ "$ENABLED" != "1" ]; then
    exit 0
fi

# Create state directory
mkdir -p "$STATE_DIR"

# Get current day of week (lowercase)
CURRENT_DAY=$(date +%a | tr '[:upper:]' '[:lower:]')

# Get current date for daily reset
CURRENT_DATE=$(date +%Y-%m-%d)
LAST_DATE=""
if [ -f "$STATE_DIR/last_date" ]; then
    LAST_DATE=$(cat "$STATE_DIR/last_date")
fi

# Daily reset - if day changed, reset all counters
if [ "$CURRENT_DATE" != "$LAST_DATE" ]; then
    log "New day detected, resetting time counters"
    echo "$CURRENT_DATE" > "$STATE_DIR/last_date"
    rm -f "$STATE_DIR"/usage_*.json
fi

# Check if parental_control config exists
if [ ! -f "$CONFIG_FILE" ]; then
    log "No parental control config found"
    exit 0
fi

# Parse profiles and check time budgets
. /usr/share/libubox/jshn.sh 2>/dev/null || {
    # Fallback parsing if json.sh not available
    log "json.sh not available, using basic parsing"
}

# Get active DHCP leases (devices currently connected)
get_active_devices() {
    local active=""
    if [ -f /tmp/dhcp.leases ]; then
        active=$(awk '{print $2}' /tmp/dhcp.leases 2>/dev/null | tr '\n' ' ')
    fi
    echo "$active"
}

# Get devices from ARP table (alternative)
get_arp_devices() {
    local active=""
    if command -v ip >/dev/null 2>&1; then
        active=$(ip neigh show | awk '{print $5}' | sort -u | tr '\n' ' ')
    fi
    echo "$active"
}

# Load usage data from JSON
load_usage() {
    local profile="$1"
    local mac="$2"
    local usage_file="$STATE_DIR/usage_${profile}.json"
    
    if [ -f "$usage_file" ]; then
        # Simple JSON parsing for this specific value
        grep -o "\"$mac\":[0-9.]*" "$usage_file" 2>/dev/null | cut -d: -f2
    else
        echo "0"
    fi
}

# Save usage data to JSON
save_usage() {
    local profile="$1"
    local mac="$2"
    local minutes="$3"
    local usage_file="$STATE_DIR/usage_${profile}.json"
    
    # Create or update JSON file
    if [ -f "$usage_file" ]; then
        # Use sed to update or add the entry
        if grep -q "\"$mac\":" "$usage_file" 2>/dev/null; then
            sed -i "s/\"$mac\":[0-9.]*/\"$mac\":$minutes/" "$usage_file"
        else
            sed -i 's/}$/,"'"$mac"'":'"$minutes"'}/' "$usage_file"
        fi
    else
        echo '{"'"$mac"'":'"$minutes"'}' > "$usage_file"
    fi
}

# Block a device by MAC
block_device() {
    local mac="$1"
    local profile="$2"
    
    # Check if already blocked
    if [ -f "$BLOCKED_FILE" ] && grep -q "^${mac}$" "$BLOCKED_FILE"; then
        return 0
    fi
    
    log "Blocking device $mac (profile: $profile)"
    
    # Add iptables rule to block this MAC
    iptables -I FORWARD -m mac --mac-source "$mac" -j DROP 2>/dev/null
    
    # Record blocked device
    echo "$mac" >> "$BLOCKED_FILE"
    
    # Also add to UCI firewall rules for persistence
    uci set firewall.blocked_${profile}_${mac//:/}=rule
    uci set firewall.blocked_${profile}_${mac//:/}.name="parental_block_${mac//:/}"
    uci set firewall.blocked_${profile}_${mac//:/}.src="lan"
    uci set firewall.blocked_${profile}_${mac//:/}.dest="wan"
    uci set firewall.blocked_${profile}_${mac//:/}.src_mac="$mac"
    uci set firewall.blocked_${profile}_${mac//:/}.target="REJECT"
    uci commit firewall
    
    # Reload firewall to apply changes
    /etc/init.d/firewall reload >/dev/null 2>&1
}

# Unblock a device by MAC
unblock_device() {
    local mac="$1"
    local profile="$2"
    
    log "Unblocking device $mac (profile: $profile)"
    
    # Remove iptables rule
    iptables -D FORWARD -m mac --mac-source "$mac" -j DROP 2>/dev/null
    
    # Remove from blocked file
    if [ -f "$BLOCKED_FILE" ]; then
        grep -v "^${mac}$" "$BLOCKED_FILE" > "$BLOCKED_FILE.tmp" 2>/dev/null
        mv "$BLOCKED_FILE.tmp" "$BLOCKED_FILE"
    fi
    
    # Remove UCI firewall rule
    local rule_name="blocked_${profile}_${mac//:/}"
    uci delete firewall."$rule_name" 2>/dev/null
    uci commit firewall
}

# Process each profile
process_profiles() {
    local active_devices
    active_devices=$(get_active_devices)
    
    # Use uci to iterate profiles
    config_load parental_control
    
    config_foreach process_profile profile
}

process_profile() {
    local cfg="$1"
    local name timetable devices day_hours
    local mac minutes_used
    
    config_get name "$cfg" name ""
    config_get timetable "$cfg" timetable "{}"
    config_get devices "$cfg" devices ""
    config_get day_hours "$cfg" day_hours ""
    
    # Skip 'default' profile - it always allows
    if [ "$name" = "default" ] || [ "$cfg" = "default" ]; then
        return 0
    fi
    
    # Check if any allowed time slots exist for today
    local day_max_hours=0
    local current_day=$(date +%a | tr '[:upper:]' '[:lower:]')
    
    # Parse day_hours JSON to get hours for current day
    if [ -n "$day_hours" ]; then
        day_max_hours=$(echo "$day_hours" | grep -o "\"$current_day\":[0-9.]*" 2>/dev/null | cut -d: -f2)
        day_max_hours=${day_max_hours:-0}
    fi
    
    # Skip if day_max_hours is 0 (no limit for this day)
    if [ "$day_max_hours" = "0" ] || [ -z "$day_max_hours" ]; then
        # Check if any previously blocked devices should be unblocked
        if [ -f "$STATE_DIR/profile_${name}_blocked" ]; then
            for mac in $(cat "$STATE_DIR/profile_${name}_blocked" 2>/dev/null); do
                unblock_device "$mac" "$name"
            done
            rm -f "$STATE_DIR/profile_${name}_blocked"
        fi
        return 0
    fi
    
    local max_minutes=$((day_max_hours * 60))
    
    # Track each device in this profile
    for mac in $devices; do
        [ -z "$mac" ] && continue
        
        # Check if device is active (simplified - in production use better detection)
        local is_active=0
        
        # Load current usage
        local current_usage
        current_usage=$(load_usage "$name" "$mac")
        current_usage=${current_usage:-0}
        
        # Add 5 minutes (one cron interval) if device is active
        # This is approximate - in production use connection tracking
        new_usage=$((current_usage + 5))
        
        # Save updated usage
        save_usage "$name" "$mac" "$new_usage"
        
        # Check if budget exceeded
        if [ "$new_usage" -ge "$max_minutes" ]; then
            block_device "$mac" "$name"
            echo "$mac" >> "$STATE_DIR/profile_${name}_blocked"
        fi
    done
}

# Initialize
log "Parental control tracker started"

# Run main processing
process_profiles

log "Parental control tracker completed"
