# LuCI Parental Control

A LuCI web interface application for managing parental controls on OpenWrt routers using the `apk` package manager.

## Features

- **Profile Management**: Create, edit, and delete multiple parental control profiles
- **Device Assignment**: Assign devices (by MAC address) to specific profiles
- **Time-Based Access**: Configure allowed time slots using an interactive timetable grid
- **Time Allowance**: Set maximum hours per day for each profile (per day of week)
- **Drag Selection**: Easily select/deselect multiple time slots by dragging
- **Copy Schedules**: Copy time slots between days, weekdays, or weekends
- **Enable/Disable Toggle**: Quickly enable or disable parental control from the web UI

## Requirements

- OpenWrt with `apk` package manager
- LuCI web interface
- `iptables` for firewall rules
- `uci` for configuration management

## Installation

1. Build the APK package:
   ```bash
   ./build-apk.sh
   ```

2. Install on OpenWrt:
   ```bash
   apk add /path/to/luci-app-parental-control-X.X.X-rX.apk
   ```

3. Restart uhttpd:
   ```bash
   /etc/init.d/uhttpd restart
   ```

4. Access the web interface at **Network > Parental Control**

## Configuration

### UCI Configuration

The package uses `/etc/config/parental_control`:

```
config global 'global'
    option enabled '1'

config profile 'profile_name'
    option name 'Profile Name'
    option timetable '{"mon":[...],"tue":[...]}'  # 96 slots per day (15-min intervals)
    option day_hours '{"mon":2,"tue":4}'  # Max hours per day
    list devices 'AA:BB:CC:DD:EE:FF'  # MAC addresses
```

### Time Slot Format

Each day has 96 time slots (15-minute intervals, 24 hours × 4 = 96).

- `true` = access allowed
- `false` = access blocked

Example: Block 22:00-06:00 (11 PM to 6 AM):
```json
{
  "mon": [false, false, ..., false, true, true, ..., true, false, false]
}
```

## How It Works

1. **Web Interface**: Configure profiles, devices, and schedules via LuCI
2. **Firewall Rules**: Creates iptables rules based on the timetable to block devices during restricted times
3. **Time Tracker** (optional): A cron-based script that tracks device usage and enforces daily time budgets

### Firewall Rules

The app creates firewall rules in `/etc/config/firewall` with the naming pattern:
```
parental_control_{profile}_{mac}_{day}_{index}
```

Rules are automatically created/updated when profiles are saved.

## File Structure

```
├── build-apk.sh                      # Build script
├── htdocs/
│   └── luci-static/resources/
│       ├── view/parental_control.js  # Main view
│       └── parental-control/
│           └── style.css            # Styling
├── luasrc/
│   └── controller/parental_control.lua  # API endpoints
├── root/
│   ├── etc/
│   │   ├── config/parental_control  # Default UCI config
│   │   └── init.d/parental-control # Init script
│   └── usr/
│       └── share/
│           └── parental-control/
│               └── tracker.sh       # Time budget tracker
└── root/usr/share/
    ├── luci/menu.d/                # Menu configuration
    ├── rpcd/acl.d/                 # ACL permissions
    └── rpcd/ucode/                 # RPC handlers
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cgi-bin/luci/admin/network/parental_control/get_profiles` | GET | Get all profiles and settings |
| `/cgi-bin/luci/admin/network/parental_control/set_profile` | POST | Create/update a profile |
| `/cgi-bin/luci/admin/network/parental_control/delete_profile` | POST | Delete a profile |
| `/cgi-bin/luci/admin/network/parental_control/get_devices` | GET | Get connected devices from DHCP |
| `/cgi-bin/luci/admin/network/parental_control/set_enabled` | POST | Enable/disable parental control |

## Usage

### Creating a Profile

1. Navigate to **Network > Parental Control**
2. Enter a profile name and click **Add**
3. Select the new profile from the dropdown

### Assigning Devices

1. Select a profile
2. Choose a device from the dropdown
3. Click **Add Device**
4. Repeat for all devices to include

### Setting Time Schedule

1. Click and drag on the timetable to select allowed hours
2. Green slots = allowed, white slots = blocked
3. Or use **Copy** buttons to copy schedules between days

### Setting Time Allowance

1. Enter hours in the input below each day name
2. `0` = unlimited
3. `2` = maximum 2 hours per day

### Saving

Click **Save Changes** to apply the configuration.

## Troubleshooting

### Check Service Status
```bash
/etc/init.d/parental-control status
```

### View Logs
```bash
logread | grep parental
```

### Manually Toggle Enable/Disable
```bash
uci set parental_control.global.enabled='1'
uci commit parental_control
/etc/init.d/parental-control start
```

### Check Firewall Rules
```bash
uci show firewall | grep parental
```

## License

This project is licensed under the same terms as LuCI.

## Contributing

Contributions welcome! Please submit issues and pull requests on GitHub.
