module("luci.controller.parental_control", package.seeall)

local json = require "luci.jsonc"
local sys = require "luci.sys"

function index()
    entry({"admin", "network", "parental_control"}, view("parental_control"), _("Parental Control"), 60).dependent = true
    entry({"admin", "network", "parental_control", "get_profiles"}, call("get_profiles"))
    entry({"admin", "network", "parental_control", "set_profile"}, call("set_profile"))
    entry({"admin", "network", "parental_control", "delete_profile"}, call("delete_profile"))
    entry({"admin", "network", "parental_control", "get_devices"}, call("get_devices"))
    entry({"admin", "network", "parental_control", "set_enabled"}, call("set_enabled"))
end

function set_enabled()
    local uci = require("luci.model.uci").cursor()
    local enabled = luci.http.formvalue("enabled")
    
    sys.exec("logger 'set_enabled called: " .. tostring(enabled) .. "'")
    
    -- Delete existing global section if it exists
    uci:foreach("parental_control", "global", function(s)
        uci:delete("parental_control", s[".name"])
    end)
    
    -- Create fresh global section
    uci:section("parental_control", "global", "global", {
        enabled = enabled
    })
    
    uci:commit("parental_control")
    
    sys.exec("logger 'Config updated to: " .. tostring(enabled) .. "'")
    
    if enabled == "1" then
        sys.exec("grep -q 'parental-control/tracker.sh' /etc/crontabs/root || echo '*/5 * * * * /usr/share/parental-control/tracker.sh' >> /etc/crontabs/root")
        sys.exec("/etc/init.d/cron restart")
    else
        sys.exec("sed -i '/parental-control\\/tracker.sh/d' /etc/crontabs/root")
        sys.exec("/etc/init.d/cron restart")
    end
    
    luci.http.prepare_content("application/json")
    luci.http.write_json({status = "ok"})
end

function get_devices()
    local devices = {}
    local leases = sys.exec("cat /tmp/dhcp.leases")
    for line in leases:gmatch("[^\r\n]+") do
        local parts = {}
        for part in line:gmatch("%S+") do
            table.insert(parts, part)
        end
        if #parts >= 4 then
            table.insert(devices, {
                mac = parts[2],
                ip = parts[3],
                name = parts[4]
            })
        end
    end
    luci.http.prepare_content("application/json")
    luci.http.write_json(devices)
end

function get_profiles()
    local uci = require("luci.model.uci").cursor()
    local profiles = {}
    
    -- Include global settings - check both section types
    local enabled = "0"
    uci:foreach("parental_control", "global", function(s)
        enabled = s.enabled or "0"
    end)
    profiles.global = { enabled = enabled }
    
    -- Include profiles
    uci:foreach("parental_control", "profile", function(s)
        profiles[s[".name"]] = {
            name = s.name,
            timetable = s.timetable,
            devices = s.devices,
            day_hours = s.day_hours or "{}"
        }
    end)
    
    luci.http.prepare_content("application/json")
    luci.http.write_json(profiles)
end

function set_profile()
    local uci = require("luci.model.uci").cursor()
    local data = luci.http.formvalue("data")
    if data then
        local profile = json.parse(data)
        local profile_name = profile.name

        -- Validation: Check if any device is already in another profile
        local all_profiles = {}
        uci:foreach("parental_control", "profile", function(s)
            all_profiles[s[".name"]] = {
                devices = s.devices or ""
            }
        end)

        for _, mac in ipairs(profile.devices or {}) do
            for name, p in pairs(all_profiles) do
                if name ~= profile_name then
                    if (" " .. p.devices .. " "):find(" " .. mac .. " ", 1, true) then
                        luci.http.prepare_content("application/json")
                        luci.http.write_json({status = "error", message = "Device " .. mac .. " is already assigned to profile " .. name})
                        return
                    end
                end
            end
        end

        uci:set("parental_control", profile_name, "profile")
        uci:set("parental_control", profile_name, "name", profile.name)
        uci:set("parental_control", profile_name, "timetable", profile.timetable)
        uci:set("parental_control", profile_name, "devices", table.concat(profile.devices or {}, " "))
        if profile.day_hours then
            uci:set("parental_control", profile_name, "day_hours", json.stringify(profile.day_hours))
        end
        uci:delete("parental_control", profile_name, "time_budget")
        uci:delete("parental_control", profile_name, "time_codes")
        uci:commit("parental_control")

        apply_firewall_rules(profile_name, profile)

        luci.http.prepare_content("application/json")
        luci.http.write_json({status = "ok"})
    else
        luci.http.prepare_content("application/json")
        luci.http.write_json({status = "error", message = "No data received"})
    end
end

function delete_profile()
    local uci = require("luci.model.uci").cursor()
    local name = luci.http.formvalue("name")
    if name then
        -- Delete associated firewall rules
        uci:foreach("firewall", "rule", function(s)
            if s.name and s.name:match("^parental_control_" .. name) then
                uci:delete("firewall", s[".name"])
            end
        end)
        uci:commit("firewall")

        -- Delete the profile
        uci:delete("parental_control", name)
        uci:commit("parental_control")

        luci.http.prepare_content("application/json")
        luci.http.write_json({status = "ok"})
    else
        luci.http.prepare_content("application/json")
        luci.http.write_json({status = "error", message = "No name provided"})
    end
end

-- Helper function to merge contiguous blocked slots into time ranges
function merge_slots_to_time_ranges(slots)
    local ranges = {}
    local start_slot = -1
    local total_slots = 96

    for i = 1, total_slots + 1 do
        local is_blocked = (i <= total_slots) and (not slots[i])

        if is_blocked and start_slot == -1 then
            start_slot = i
        elseif not is_blocked and start_slot ~= -1 then
            local end_slot = i - 1

            local start_total_minutes = (start_slot - 1) * 15
            local start_hour = math.floor(start_total_minutes / 60)
            local start_minute = start_total_minutes % 60

            local stop_total_minutes_inclusive = (end_slot * 15) - 1
            local stop_hour = math.floor(stop_total_minutes_inclusive / 60)
            local stop_minute = stop_total_minutes_inclusive % 60

            table.insert(ranges, {
                start_time = string.format("%02d:%02d:00", start_hour, start_minute),
                stop_time = string.format("%02d:%02d:59", stop_hour, stop_minute)
            })

            start_slot = -1
        end
    end
    return ranges
end


function apply_firewall_rules(profile_name, profile)
    -- Remove existing rules for this profile
    uci:foreach("firewall", "rule", function(s)
        if s.name and s.name:match("^parental_control_" .. profile_name) then
            uci:delete("firewall", s[".name"])
        end
    end)

    -- Add new rules based on the timetable
    local timetable = json.parse(profile.timetable or '{}')
    local devices = profile.devices or {}

    for _, mac in ipairs(devices) do
        for day, slots in pairs(timetable) do
            if type(slots) == "table" then
                local blocked_ranges = merge_slots_to_time_ranges(slots)
                local range_index = 1
                for _, time_range in ipairs(blocked_ranges) do
                    local rule_name = "parental_control_" .. profile_name .. "_" .. mac:gsub(":", "") .. "_" .. day .. "_" .. range_index
                    uci:set("firewall", rule_name, "rule")
                    uci:set("firewall", rule_name, "name", rule_name)
                    uci:set("firewall", rule_name, "src", "lan")
                    uci:set("firewall", rule_name, "dest", "wan")
                    uci:set("firewall", rule_name, "src_mac", mac)
                    uci:set("firewall", rule_name, "weekdays", day:sub(1,1):upper()..day:sub(2))
                    uci:set("firewall", rule_name, "start_time", time_range.start_time)
                    uci:set("firewall", rule_name, "stop_time", time_range.stop_time)
                    uci:set("firewall", rule_name, "target", "REJECT")
                    range_index = range_index + 1
                end
            end
        end
    end

    uci:commit("firewall")
    luci.sys.call("/etc/init.d/firewall reload >/dev/null 2>&1")
end
