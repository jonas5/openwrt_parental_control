'use strict';
'require view';

return view.extend({
	load: function() {
		return Promise.resolve();
	},

	render: function() {
		var self = this;
		var days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
		var TOTAL_SLOTS = 96;

		var viewEl = document.createElement('div');
		viewEl.className = 'cbi-map';

		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '/luci-static/resources/parental-control/style.css';
		viewEl.appendChild(link);

		// Enable section - shown first
		var enableSection = document.createElement('div');
		enableSection.id = 'enable-section';
		enableSection.style.textAlign = 'center';
		enableSection.style.padding = '50px';
		enableSection.style.border = '2px dashed #ccc';
		enableSection.style.borderRadius = '10px';
		enableSection.style.margin = '20px 0';

		var enableTitle = document.createElement('h2');
		enableTitle.textContent = 'Parental Control';
		enableTitle.style.marginBottom = '20px';
		enableSection.appendChild(enableTitle);

		var enableDesc = document.createElement('p');
		enableDesc.textContent = 'Enable parental control to start managing device access schedules.';
		enableDesc.style.marginBottom = '20px';
		enableDesc.style.color = '#666';
		enableSection.appendChild(enableDesc);

		var enableButton = document.createElement('button');
		enableButton.id = 'enable-button';
		enableButton.className = 'btn cbi-button-apply';
		enableButton.style.fontSize = '18px';
		enableButton.style.padding = '15px 40px';
		enableButton.textContent = 'Enable Parental Control';
		enableSection.appendChild(enableButton);

		viewEl.appendChild(enableSection);

		// Main content - hidden until enabled
		var mainContent = document.createElement('div');
		mainContent.id = 'main-content';
		mainContent.style.display = 'none';

		// Enable/disable toggle
		var toggleSection = document.createElement('div');
		toggleSection.style.marginBottom = '20px';
		toggleSection.style.display = 'flex';
		toggleSection.style.alignItems = 'center';
		toggleSection.style.gap = '15px';

		var toggleStatus = document.createElement('span');
		toggleStatus.id = 'toggle-status';
		toggleStatus.style.fontWeight = 'bold';
		toggleStatus.style.fontSize = '14px';
		toggleSection.appendChild(toggleStatus);

		var toggleButton = document.createElement('button');
		toggleButton.id = 'toggle-button';
		toggleButton.className = 'btn';
		toggleSection.appendChild(toggleButton);

		mainContent.appendChild(toggleSection);

		// Profile section
		var profileSection = document.createElement('div');
		profileSection.className = 'profile-section';

		var profileLabel = document.createElement('label');
		profileLabel.htmlFor = 'profile-selector';
		profileLabel.textContent = 'Profile:';
		profileSection.appendChild(profileLabel);

		var profileSelector = document.createElement('select');
		profileSelector.id = 'profile-selector';
		profileSection.appendChild(profileSelector);

		var newProfileInput = document.createElement('input');
		newProfileInput.type = 'text';
		newProfileInput.id = 'new-profile-name';
		newProfileInput.placeholder = 'New profile name';
		profileSection.appendChild(newProfileInput);

		var addProfileButton = document.createElement('button');
		addProfileButton.id = 'add-profile-button';
		addProfileButton.className = 'btn';
		addProfileButton.textContent = 'Add';
		profileSection.appendChild(addProfileButton);

		var deleteProfileButton = document.createElement('button');
		deleteProfileButton.id = 'delete-profile-button';
		deleteProfileButton.className = 'btn';
		deleteProfileButton.style.backgroundColor = '#dc3545';
		deleteProfileButton.style.color = 'white';
		deleteProfileButton.textContent = 'Delete';
		profileSection.appendChild(deleteProfileButton);

		mainContent.appendChild(profileSection);

		// Timetable
		var timetableContainer = document.createElement('div');
		timetableContainer.id = 'timetable-container';

		// Time headers
		var spacer = document.createElement('div');
		spacer.className = 'day-header';
		timetableContainer.appendChild(spacer);

		for (var i = 0; i < 24; i++) {
			var timeHeader = document.createElement('div');
			timeHeader.className = 'time-header';
			timeHeader.textContent = i + ':00';
			timetableContainer.appendChild(timeHeader);
		}

		// Day rows with hours input
		var dayHoursInputs = {};
		for (var d = 0; d < days.length; d++) {
			var day = days[d];
			var dayRow = document.createElement('div');
			dayRow.className = 'day-row';
			dayRow.style.display = 'contents';

			var dayHeader = document.createElement('div');
			dayHeader.className = 'day-header';
			dayHeader.innerHTML = day.charAt(0).toUpperCase() + day.slice(1) + '<br><div class="time-allowance"><input type="number" class="day-hours-input" data-day="' + day + '" min="0" max="24" step="0.5" value="0" style="width:45px;padding:2px;background:#fff"><span style="font-size:10px">hrs</span></div>';
			timetableContainer.appendChild(dayHeader);

			for (var s = 0; s < TOTAL_SLOTS; s++) {
				var slot = document.createElement('div');
				slot.className = 'time-slot';
				slot.dataset.day = day;
				slot.dataset.slot = s;
				timetableContainer.appendChild(slot);
			}
		}
		mainContent.appendChild(timetableContainer);

		// Copy buttons
		var copySection = document.createElement('div');
		copySection.style.margin = '10px 0';

		var copyLabel = document.createElement('span');
		copyLabel.textContent = 'Copy: ';
		copySection.appendChild(copyLabel);

		var copyMonBtn = document.createElement('button');
		copyMonBtn.className = 'btn';
		copyMonBtn.textContent = 'Mon';
		copyMonBtn.dataset.day = 'mon';
		copySection.appendChild(copyMonBtn);

		var copyTueBtn = document.createElement('button');
		copyTueBtn.className = 'btn';
		copyTueBtn.style.marginLeft = '5px';
		copyTueBtn.textContent = 'Tue';
		copyTueBtn.dataset.day = 'tue';
		copySection.appendChild(copyTueBtn);

		var copyWedBtn = document.createElement('button');
		copyWedBtn.className = 'btn';
		copyWedBtn.style.marginLeft = '5px';
		copyWedBtn.textContent = 'Wed';
		copyWedBtn.dataset.day = 'wed';
		copySection.appendChild(copyWedBtn);

		var copyThuBtn = document.createElement('button');
		copyThuBtn.className = 'btn';
		copyThuBtn.style.marginLeft = '5px';
		copyThuBtn.textContent = 'Thu';
		copyThuBtn.dataset.day = 'thu';
		copySection.appendChild(copyThuBtn);

		var copyFriBtn = document.createElement('button');
		copyFriBtn.className = 'btn';
		copyFriBtn.style.marginLeft = '5px';
		copyFriBtn.textContent = 'Fri';
		copyFriBtn.dataset.day = 'fri';
		copySection.appendChild(copyFriBtn);

		var copySatBtn = document.createElement('button');
		copySatBtn.className = 'btn';
		copySatBtn.style.marginLeft = '5px';
		copySatBtn.textContent = 'Sat';
		copySatBtn.dataset.day = 'sat';
		copySection.appendChild(copySatBtn);

		var copySunBtn = document.createElement('button');
		copySunBtn.className = 'btn';
		copySunBtn.style.marginLeft = '5px';
		copySunBtn.textContent = 'Sun';
		copySunBtn.dataset.day = 'sun';
		copySection.appendChild(copySunBtn);

		copySection.appendChild(document.createTextNode(' → '));

		var copyToLabel = document.createElement('span');
		copyToLabel.textContent = 'Weekdays';
		copyToLabel.style.fontWeight = 'bold';
		copyToLabel.id = 'copy-to-label';
		copySection.appendChild(copyToLabel);

		var copyTargetSelect = document.createElement('select');
		copyTargetSelect.id = 'copy-target';
		copyTargetSelect.style.marginLeft = '5px';
		var weekdaysOpt = document.createElement('option');
		weekdaysOpt.value = 'weekdays';
		weekdaysOpt.textContent = 'Weekdays';
		copyTargetSelect.appendChild(weekdaysOpt);
		var weekendOpt = document.createElement('option');
		weekendOpt.value = 'weekend';
		weekendOpt.textContent = 'Weekend';
		copyTargetSelect.appendChild(weekendOpt);
		var allOpt = document.createElement('option');
		allOpt.value = 'all';
		allOpt.textContent = 'All Days';
		copyTargetSelect.appendChild(allOpt);
		var copyOpt = document.createElement('option');
		copyOpt.value = 'copy';
		copyOpt.textContent = 'Copy to...';
		copyTargetSelect.appendChild(copyOpt);
		copySection.appendChild(copyTargetSelect);

		var clearBtn = document.createElement('button');
		clearBtn.className = 'btn';
		clearBtn.style.marginLeft = '15px';
		clearBtn.style.backgroundColor = '#dc3545';
		clearBtn.style.color = 'white';
		clearBtn.textContent = 'Clear All';
		copySection.appendChild(clearBtn);

		mainContent.appendChild(copySection);

		// Devices section
		var devicesSection = document.createElement('div');
		devicesSection.className = 'devices-section';
		devicesSection.style.marginTop = '20px';

		var devicesTitle = document.createElement('h4');
		devicesTitle.textContent = 'Assigned Devices';
		devicesSection.appendChild(devicesTitle);

		var devicesList = document.createElement('div');
		devicesList.id = 'devices-list';
		devicesSection.appendChild(devicesList);

		var deviceRow = document.createElement('div');
		deviceRow.style.display = 'flex';
		deviceRow.style.gap = '10px';
		deviceRow.style.alignItems = 'center';

		var deviceSelect = document.createElement('select');
		deviceSelect.id = 'device-select';
		deviceRow.appendChild(deviceSelect);

		var addDeviceBtn = document.createElement('button');
		addDeviceBtn.className = 'btn';
		addDeviceBtn.textContent = 'Add Device';
		deviceRow.appendChild(addDeviceBtn);

		devicesSection.appendChild(deviceRow);
		mainContent.appendChild(devicesSection);

		// Save button
		var saveButton = document.createElement('button');
		saveButton.id = 'save-button';
		saveButton.className = 'btn cbi-button-apply';
		saveButton.style.marginTop = '20px';
		saveButton.textContent = 'Save Changes';
		mainContent.appendChild(saveButton);

		// Add main content to view
		viewEl.appendChild(mainContent);

		// DRAG HANDLING - using document-level events for reliability
		var isDragging = false;
		var dragMode = null; // 'select' or 'deselect'

		document.addEventListener('mousedown', function(e) {
			if (e.target.classList.contains('time-slot')) {
				e.preventDefault();
				isDragging = true;
				dragMode = e.target.classList.contains('allowed') ? 'deselect' : 'select';
				console.log('mousedown on slot', e.target.dataset.day, e.target.dataset.slot, 'mode:', dragMode);
				e.target.classList.add(dragMode === 'select' ? 'allowed' : '');
				if (dragMode === 'deselect') {
					e.target.classList.remove('allowed');
				}
			}
		});

		document.addEventListener('mousemove', function(e) {
			if (isDragging && e.target.classList.contains('time-slot')) {
				e.preventDefault();
				console.log('mousemove on slot', e.target.dataset.day, e.target.dataset.slot);
				if (dragMode === 'select') {
					e.target.classList.add('allowed');
				} else {
					e.target.classList.remove('allowed');
				}
			}
		});

		document.addEventListener('mouseup', function() {
			isDragging = false;
			dragMode = null;
		});

		// Copy day buttons handler
		var dayCopyBtns = [copyMonBtn, copyTueBtn, copyWedBtn, copyThuBtn, copyFriBtn, copySatBtn, copySunBtn];
		dayCopyBtns.forEach(function(btn) {
			btn.addEventListener('click', function() {
				var fromDay = btn.dataset.day;
				var target = copyTargetSelect.value;
				var targets = [];
				if (target === 'weekdays') targets = ['mon', 'tue', 'wed', 'thu', 'fri'];
				else if (target === 'weekend') targets = ['sat', 'sun'];
				else if (target === 'all') targets = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
				else return;

				var fromSlots = timetableContainer.querySelectorAll('.time-slot[data-day="' + fromDay + '"]');
				targets.forEach(function(toDay) {
					if (toDay === fromDay) return;
					var toSlots = timetableContainer.querySelectorAll('.time-slot[data-day="' + toDay + '"]');
					for (var si = 0; si < fromSlots.length && si < toSlots.length; si++) {
						if (fromSlots[si].classList.contains('allowed')) {
							toSlots[si].classList.add('allowed');
						} else {
							toSlots[si].classList.remove('allowed');
						}
					}
				});
			});
		});

		// Clear all
		clearBtn.addEventListener('click', function() {
			if (confirm('Clear all time slots?')) {
				var allSlots = timetableContainer.querySelectorAll('.time-slot');
				for (var si = 0; si < allSlots.length; si++) {
					allSlots[si].classList.remove('allowed');
				}
			}
		});

		// Add profile
		addProfileButton.addEventListener('click', function() {
			var name = newProfileInput.value.trim();
			if (name) {
				self.createProfile(name, newProfileInput, profileSelector);
			}
		});

		// Delete profile
		deleteProfileButton.addEventListener('click', function() {
			var name = profileSelector.value;
			if (name && confirm('Delete profile "' + name + '"?')) {
				self.deleteProfile(name, profileSelector);
			}
		});

		// Profile change
		profileSelector.addEventListener('change', function() {
			self.loadProfile(this.value);
		});

		// Save
		saveButton.addEventListener('click', function() {
			self.saveProfile(profileSelector, timetableContainer, devicesList);
		});

		// Add device
		addDeviceBtn.addEventListener('click', function() {
			self.addDevice(deviceSelect, devicesList);
		});

		// Remove device
		devicesList.addEventListener('click', function(e) {
			if (e.target.classList.contains('remove-device-button')) {
				e.target.parentNode.remove();
			}
		});

		// Enable button handler
		enableButton.addEventListener('click', function() {
			self.setEnabled(true, function() {
				enableSection.style.display = 'none';
				mainContent.style.display = 'block';
				self.loadProfiles(profileSelector);
				self.loadDevices(deviceSelect);
				self.updateToggleStatus();
			});
		});

		// Toggle button handler
		toggleButton.addEventListener('click', function(e) {
			e.preventDefault();
			
			var currentEnabled = toggleButton.dataset.enabled === 'true';
			var newEnabled = !currentEnabled;
			
			// Update UI immediately
			toggleButton.disabled = true;
			if (!newEnabled) {
				toggleStatus.textContent = 'Status: Disabled';
				toggleStatus.style.color = 'red';
				toggleButton.textContent = 'Enable';
				toggleButton.dataset.enabled = 'false';
			} else {
				toggleStatus.textContent = 'Status: Enabled';
				toggleStatus.style.color = 'green';
				toggleButton.textContent = 'Disable';
				toggleButton.dataset.enabled = 'true';
			}
			
			self.setEnabled(newEnabled, function() {
				toggleButton.disabled = false;
			});
		});

		// Check if already enabled
		this.checkEnabled(function(enabled) {
			if (enabled) {
				enableSection.style.display = 'none';
				mainContent.style.display = 'block';
				self.loadProfiles(profileSelector);
				self.loadDevices(deviceSelect);
			}
			self.updateToggleStatus();
		});

		return viewEl;
	},

	updateToggleStatus: function() {
		var toggleStatus = document.getElementById('toggle-status');
		var toggleButton = document.getElementById('toggle-button');
		if (!toggleStatus || !toggleButton) return;

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/cgi-bin/luci/admin/network/parental_control/get_profiles', true);
		xhr.onload = function() {
			if (xhr.status === 200) {
				try {
					var profiles = JSON.parse(xhr.responseText);
					if (profiles.global && profiles.global.enabled === '1') {
						toggleStatus.textContent = 'Enabled';
						toggleStatus.style.color = 'green';
						toggleButton.textContent = 'Disable';
						toggleButton.dataset.enabled = 'true';
					} else {
						toggleStatus.textContent = 'Disabled';
						toggleStatus.style.color = 'red';
						toggleButton.textContent = 'Enable';
						toggleButton.dataset.enabled = 'false';
					}
				} catch (e) {}
			}
		};
		xhr.send();
	},

	setEnabled: function(enabled, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/cgi-bin/luci/admin/network/parental_control/set_enabled', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status === 200 && callback) {
				callback();
			}
		};
		xhr.send('enabled=' + (enabled ? '1' : '0'));
	},

	checkEnabled: function(callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/cgi-bin/luci/admin/network/parental_control/get_profiles', true);
		xhr.onload = function() {
			if (xhr.status === 200) {
				try {
					var profiles = JSON.parse(xhr.responseText);
					var enabled = profiles.global && profiles.global.enabled === '1';
					if (callback) callback(enabled);
				} catch (e) {
					if (callback) callback(false);
				}
			} else {
				if (callback) callback(false);
			}
		};
		xhr.send();
	},

	loadProfiles: function(select) {
		var self = this;
		select.innerHTML = '';

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/cgi-bin/luci/admin/network/parental_control/get_profiles', true);
		xhr.onload = function() {
			if (xhr.status === 200) {
				try {
					var profiles = JSON.parse(xhr.responseText);
					if (profiles.error) {
						console.error('API error:', profiles.error);
						return;
					}
					var first = true;
					for (var profileName in profiles) {
						if (profileName === 'default') continue;
						var opt = document.createElement('option');
						opt.value = profileName;
						opt.textContent = profiles[profileName].name || profileName;
						select.appendChild(opt);
						if (first) {
							self.loadProfile(profileName);
							first = false;
						}
					}
				} catch (e) {
					console.error('Error parsing profiles:', e);
				}
			}
		};
		xhr.send();
	},

	loadDevices: function(select) {
		select.innerHTML = '';

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/cgi-bin/luci/admin/network/parental_control/get_devices', true);
		xhr.onload = function() {
			if (xhr.status === 200) {
				try {
					var devices = JSON.parse(xhr.responseText);
					if (devices.error) {
						console.error('API error:', devices.error);
						return;
					}
					for (var i = 0; i < devices.length; i++) {
						var device = devices[i];
						var opt = document.createElement('option');
						opt.value = device.mac;
						opt.textContent = device.name + ' (' + device.mac + ')';
						select.appendChild(opt);
					}
				} catch (e) {
					console.error('Error parsing devices:', e);
				}
			}
		};
		xhr.send();
	},

	loadProfile: function(profileName) {
		var self = this;
		var container = document.getElementById('timetable-container');
		var devicesList = document.getElementById('devices-list');
		if (!container) return;

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/cgi-bin/luci/admin/network/parental_control/get_profiles', true);
		xhr.onload = function() {
			if (xhr.status === 200) {
				var profiles = JSON.parse(xhr.responseText);
				var profile = profiles[profileName];
				if (!profile) return;

				// Load timetable
				var timetable = {};
				try {
					timetable = JSON.parse(profile.timetable || '{}');
				} catch (e) {}

				var allSlots = container.querySelectorAll('.time-slot');
				for (var i = 0; i < allSlots.length; i++) {
					allSlots[i].classList.remove('allowed');
				}

				var days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
				var dayHours = {};
				try {
					dayHours = JSON.parse(profile.day_hours || '{}');
				} catch (e) {}
				for (var d = 0; d < days.length; d++) {
					var day = days[d];
					if (timetable[day] && timetable[day].length === 96) {
						for (var s = 0; s < 96; s++) {
							if (timetable[day][s]) {
								var slot = container.querySelector('.time-slot[data-day="' + day + '"][data-slot="' + s + '"]');
								if (slot) slot.classList.add('allowed');
							}
						}
					}
					var hoursInput = container.querySelector('.day-hours-input[data-day="' + day + '"]');
					if (hoursInput) {
						hoursInput.value = dayHours[day] || 0;
					}
				}

				// Load devices
				if (devicesList) {
					devicesList.innerHTML = '';
					var devices = profile.devices;
					if (typeof devices === 'string') {
						devices = devices.split(' ').filter(function(d) { return d && d.trim(); });
					} else if (!Array.isArray(devices)) {
						devices = [];
					}
					for (var i = 0; i < devices.length; i++) {
						var mac = devices[i];
						var entry = document.createElement('div');
						entry.className = 'device-entry';
						entry.style.display = 'flex';
						entry.style.justifyContent = 'space-between';
						entry.style.padding = '5px';
						entry.style.border = '1px solid #ccc';
						entry.style.marginBottom = '5px';

						var span = document.createElement('span');
						span.textContent = mac;
						entry.appendChild(span);

						var removeBtn = document.createElement('span');
						removeBtn.className = 'remove-device-button';
						removeBtn.textContent = 'X';
						removeBtn.style.cursor = 'pointer';
						removeBtn.style.color = 'red';
						removeBtn.dataset.mac = mac;
						entry.appendChild(removeBtn);

						devicesList.appendChild(entry);
					}
				}
			}
		};
		xhr.send();
	},

	saveProfile: function(select, container, devicesList) {
		var days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
		var profileName = select.value;

		var timetable = {};
		var dayHours = {};
		for (var d = 0; d < days.length; d++) {
			var day = days[d];
			timetable[day] = [];
			for (var s = 0; s < 96; s++) {
				var slot = container.querySelector('.time-slot[data-day="' + day + '"][data-slot="' + s + '"]');
				timetable[day].push(slot ? slot.classList.contains('allowed') : false);
			}
			var hoursInput = container.querySelector('.day-hours-input[data-day="' + day + '"]');
			dayHours[day] = hoursInput ? parseFloat(hoursInput.value) || 0 : 0;
		}

		var devices = [];
		var deviceSpans = devicesList.querySelectorAll('.device-entry span:first-child');
		for (var i = 0; i < deviceSpans.length; i++) {
			devices.push(deviceSpans[i].textContent);
		}

		var profile = {
			name: profileName,
			timetable: JSON.stringify(timetable),
			devices: devices,
			day_hours: dayHours
		};

		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/cgi-bin/luci/admin/network/parental_control/set_profile', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status === 200) {
				var result = JSON.parse(xhr.responseText);
				if (result.status === 'error') {
					alert(result.message);
				} else {
					alert('Saved successfully!');
				}
			}
		};
		xhr.send('data=' + encodeURIComponent(JSON.stringify(profile)));
	},

	createProfile: function(name, input, select) {
		var self = this;

		var profile = {
			name: name,
			timetable: '{}',
			devices: [],
			day_hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
		};

		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/cgi-bin/luci/admin/network/parental_control/set_profile', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status === 200) {
				input.value = '';
				self.loadProfiles(select);
			}
		};
		xhr.send('data=' + encodeURIComponent(JSON.stringify(profile)));
	},

	deleteProfile: function(name, select) {
		var self = this;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/cgi-bin/luci/admin/network/parental_control/delete_profile', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status === 200) {
				self.loadProfiles(select);
			}
		};
		xhr.send('name=' + encodeURIComponent(name));
	},

	addDevice: function(select, devicesList) {
		var newMac = select.value;
		if (!newMac) return;

		var exists = false;
		var existing = devicesList.querySelectorAll('.device-entry span:first-child');
		for (var i = 0; i < existing.length; i++) {
			if (existing[i].textContent === newMac) {
				exists = true;
				break;
			}
		}

		if (!exists) {
			var entry = document.createElement('div');
			entry.className = 'device-entry';
			entry.style.display = 'flex';
			entry.style.justifyContent = 'space-between';
			entry.style.padding = '5px';
			entry.style.border = '1px solid #ccc';
			entry.style.marginBottom = '5px';

			var span = document.createElement('span');
			span.textContent = newMac;
			entry.appendChild(span);

			var removeBtn = document.createElement('span');
			removeBtn.className = 'remove-device-button';
			removeBtn.textContent = 'X';
			removeBtn.style.cursor = 'pointer';
			removeBtn.style.color = 'red';
			removeBtn.dataset.mac = newMac;
			entry.appendChild(removeBtn);

			devicesList.appendChild(entry);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
