
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('test_mode') === 'true';

    const container = document.getElementById('timetable-container');
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const SLOTS_PER_HOUR = 4;
    const TOTAL_SLOTS = 24 * SLOTS_PER_HOUR;
    let currentProfile = 'default';
    let profilesData = {};

    // Create time headers
    let timeHeader = '<div class="day-header"></div>';
    for (let i = 0; i < 24; i++) {
        timeHeader += `<div class="time-header">${i}:00</div>`;
    }
    container.innerHTML += timeHeader;

    // Create timetable grid
    for (let day of days) {
        let dayHeader = `<div class="day-header">${day.toUpperCase()}</div>`;
        container.innerHTML += dayHeader;
        for (let i = 0; i < TOTAL_SLOTS; i++) {
            let timeSlot = `<div class="time-slot" data-day="${day}" data-slot="${i}"></div>`;
            container.innerHTML += timeSlot;
        }
    }

    // UI Elements
    const profileSelector = document.getElementById('profile-selector');
    const newProfileInput = document.getElementById('new-profile-name');
    const addProfileButton = document.getElementById('add-profile-button');
    const saveButton = document.getElementById('save-button');
    const devicesList = document.getElementById('devices-list');
    const deviceSelect = document.getElementById('device-select');
    const addDeviceButton = document.getElementById('add-device-button');

    // Load initial data
    loadProfiles();
    loadDevices();

    // Event listeners
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-slot')) {
            e.target.classList.toggle('allowed');
        }
    });

    addProfileButton.addEventListener('click', function() {
        const newProfileName = newProfileInput.value.trim();
        if (newProfileName) {
            createProfile(newProfileName);
        }
    });

    profileSelector.addEventListener('change', function() {
        currentProfile = this.value;
        loadProfile(currentProfile);
    });

    saveButton.addEventListener('click', saveProfile);

    addDeviceButton.addEventListener('click', addDevice);

    devicesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-device-button')) {
            const mac = e.target.dataset.mac;
            removeDevice(mac);
        }
    });

    function loadDevices() {
        const url = isTestMode ? '/mock_devices.json' : '/cgi-bin/luci/admin/network/parental_control/get_devices';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                deviceSelect.innerHTML = '';
                data.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.mac;
                    option.textContent = `${device.name} (${device.mac})`;
                    deviceSelect.appendChild(option);
                });
            });
    }

    function loadProfiles() {
        const url = isTestMode ? '/mock_profiles.json' : '/cgi-bin/luci/admin/network/parental_control/get_profiles';
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                profilesData = data;
                profileSelector.innerHTML = '';
                let firstProfile = true;
                for (const profileName in data) {
                    const option = document.createElement('option');
                    option.value = profileName;
                    option.textContent = data[profileName].name;
                    profileSelector.appendChild(option);
                    if(firstProfile) {
                        currentProfile = profileName;
                        firstProfile = false;
                    }
                }
                loadProfile(currentProfile);
            });
    }

    function loadProfile(profileName) {
        const profile = profilesData[profileName];
        if(!profile) return;

        const timetable = JSON.parse(profile.timetable || '{}');

        // Reset all time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('allowed');
        });

        // Set allowed time slots
        for (const day of days) {
            if (timetable[day] && Array.isArray(timetable[day]) && timetable[day].length === TOTAL_SLOTS) {
                for (let i = 0; i < TOTAL_SLOTS; i++) {
                    if (timetable[day][i]) {
                        const slot = document.querySelector(`.time-slot[data-day="${day}"][data-slot="${i}"]`);
                        if (slot) {
                            slot.classList.add('allowed');
                        }
                    }
                }
            }
        }

        // Load devices
        devicesList.innerHTML = '';
        const devices = (profile.devices && profile.devices.trim() !== '') ? profile.devices.split(' ') : [];
        devices.forEach(mac => {
            const deviceEntry = document.createElement('div');
            deviceEntry.className = 'device-entry';
            deviceEntry.innerHTML = `
                <span>${mac}</span>
                <span class="remove-device-button" data-mac="${mac}">X</span>
            `;
            devicesList.appendChild(deviceEntry);
        });
    }

    function saveProfile() {
        const timetable = {};
        days.forEach(day => {
            timetable[day] = [];
            for (let i = 0; i < TOTAL_SLOTS; i++) {
                const slot = document.querySelector(`.time-slot[data-day="${day}"][data-slot="${i}"]`);
                timetable[day].push(slot.classList.contains('allowed'));
            }
        });

        const devices = [];
        document.querySelectorAll('.device-entry span:first-child').forEach(span => {
            devices.push(span.textContent);
        });

        const profileData = {
            name: currentProfile,
            timetable: JSON.stringify(timetable),
            devices: devices
        };

        if (isTestMode) {
            console.log('Saving profile:', profileData);
            return;
        }

        fetch('/cgi-bin/luci/admin/network/parental_control/set_profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'data=' + encodeURIComponent(JSON.stringify(profileData))
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                alert(data.message);
            }
        });
    }

    function createProfile(profileName) {
        const profileData = {
            name: profileName,
            timetable: '{}',
            devices: []
        };

        if (isTestMode) {
            console.log('Creating profile:', profileData);
            profilesData[profileName] = profileData;
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            profileSelector.appendChild(option);
            newProfileInput.value = '';
            return;
        }

        fetch('/cgi-bin/luci/admin/network/parental_control/set_profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'data=' + encodeURIComponent(JSON.stringify(profileData))
        }).then(() => {
            newProfileInput.value = '';
            loadProfiles().then(() => {
                profileSelector.value = profileName;
                currentProfile = profileName;
                loadProfile(currentProfile);
            });
        });
    }

    function addDevice() {
        const newMac = deviceSelect.value;
        const devices = [];
        document.querySelectorAll('.device-entry span:first-child').forEach(span => {
            devices.push(span.textContent);
        });

        if(!devices.includes(newMac)) {
            devices.push(newMac);

            const deviceEntry = document.createElement('div');
            deviceEntry.className = 'device-entry';
            deviceEntry.innerHTML = `
                <span>${newMac}</span>
                <span class="remove-device-button" data-mac="${newMac}">X</span>
            `;
            devicesList.appendChild(deviceEntry);
        }
    }

    function removeDevice(mac) {
        const deviceEntry = document.querySelector(`.remove-device-button[data-mac="${mac}"]`).parentNode;
        deviceEntry.remove();
    }
});
