// ==UserScript==
// @name         Strava Feed Filter Clean
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Clean version with requested fixes only
// @author       You
// @match        https://www.strava.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 Clean Filter: Script starting...');

    const STORAGE_KEY = "stravaFeedFilter";
    const POS_KEY = "stravaFeedFilterPos";

    const DEFAULTS = {
        keywords: [],
        types: {},
        hideNoMap: false,
        hideGiveGift: false,
        minKm: 0,
        minMins: 0,
        minElevM: 0,
        minPace: 0,
        enabled: true
    };

    const TYPES = [
        { key: "Ride", label: "Ride" },
        { key: "Walk", label: "Walk" },
        { key: "VirtualRide", label: "Virtual Ride" },
        { key: "Run", label: "Run" },
        { key: "Swim", label: "Swim" },
        { key: "Hike", label: "Hike" },
        { key: "TrailRun", label: "Trail Run" },
        { key: "MountainBikeRide", label: "Mountain Bike Ride" },
        { key: "GravelRide", label: "Gravel Ride" },
        { key: "EBikeRide", label: "E-Bike Ride" },
        { key: "EMountainBikeRide", label: "E-Mountain Bike Ride" },
        { key: "AlpineSki", label: "Alpine Ski" },
        { key: "Badminton", label: "Badminton" },
        { key: "BackcountrySki", label: "Backcountry Ski" },
        { key: "Canoeing", label: "Canoe" },
        { key: "Crossfit", label: "Crossfit" },
        { key: "Elliptical", label: "Elliptical" },
        { key: "Golf", label: "Golf" },
        { key: "IceSkate", label: "Ice Skate" },
        { key: "InlineSkate", label: "Inline Skate" },
        { key: "Handcycle", label: "Handcycle" },
        { key: "HighIntensityIntervalTraining", label: "HIIT" },
        { key: "Kayaking", label: "Kayaking" },
        { key: "Kitesurf", label: "Kitesurf" },
        { key: "NordicSki", label: "Nordic Ski" },
        { key: "Pickleball", label: "Pickleball" },
        { key: "Pilates", label: "Pilates" },
        { key: "Racquetball", label: "Racquetball" },
        { key: "RockClimbing", label: "Rock Climb" },
        { key: "RollerSki", label: "Roller Ski" },
        { key: "Rowing", label: "Rowing" },
        { key: "Sail", label: "Sail" },
        { key: "Skateboard", label: "Skateboard" },
        { key: "Snowboard", label: "Snowboard" },
        { key: "Snowshoe", label: "Snowshoe" },
        { key: "Soccer", label: "Football (Soccer)" },
        { key: "Squash", label: "Squash" },
        { key: "StandUpPaddling", label: "Stand Up Paddling" },
        { key: "StairStepper", label: "Stair-Stepper" },
        { key: "Surfing", label: "Surfing" },
        { key: "TableTennis", label: "Table Tennis" },
        { key: "Tennis", label: "Tennis" },
        { key: "Velomobile", label: "Velomobile" },
        { key: "VirtualRun", label: "Virtual Run" },
        { key: "VirtualRow", label: "Virtual Rowing" },
        { key: "WeightTraining", label: "Weight Training" },
        { key: "Windsurf", label: "Windsurf" },
        { key: "Wheelchair", label: "Wheelchair" },
        { key: "Workout", label: "Workout" },
        { key: "Yoga", label: "Yoga" }
    ];

    function loadSettings() {
        let s;
        try {
            s = JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch(e) {}
        return s ? {...DEFAULTS, ...s} : {...DEFAULTS};
    }

    function saveSettings(s) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch(e) {
            console.error('Error saving settings:', e);
        }
    }

    let settings = loadSettings();

    GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Poppins:wght@800&display=swap');
      .sff-clean-btn {
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 2147483647 !important;
        padding: 6px 0px !important;
        background: #fc5200 !important;
        color: white !important;
        border: none !important;
        cursor: pointer !important;
        font-weight: 800 !important;
        border-radius: 6px !important;
        box-shadow: none !important;
        font-family: 'Poppins', 'Montserrat', sans-serif !important;
        min-width: 120px !important;
        text-align: center !important;
        transition: background-color 0.15s ease !important;
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 1px !important;
      }

      .sff-clean-btn:hover {
        background: #e04700 !important;
      }

      .sff-btn-title {
        font-size: 14px !important;
        line-height: 1.1 !important;
        text-transform: uppercase !important;
      }

      .sff-btn-sub {
        font-size: 9px !important;
        line-height: 1 !important;
        letter-spacing: 0.5px !important;
        opacity: 1 !important;
        color: #000 !important;
        font-weight: 800 !important;
      }

      /* Drop the button earlier to avoid covering header buttons */
      @media (max-width: 1460px) {
        .sff-clean-btn {
          top: 56px !important; /* drop below header a bit */
        }
      }

      /* Switch button to left and up; move panel to left as well */
      @media (max-width: 985px) {
        .sff-clean-btn {
          top: 10px !important;
          right: auto !important;
          left: 280px !important; /* shift by roughly button width to clear logo */
        }

        .sff-clean-panel {
          right: auto !important;
          left: 10px !important;
        }
      }

      /* Even smaller screens: keep at top, but push further right to avoid burger */
      @media (max-width: 760px) {
        .sff-clean-btn {
          top: 10px !important; /* remain at top */
          left: 340px !important; /* push further right to clear burger */
          right: auto !important;
        }
      }



      .sff-clean-panel {
        position: fixed !important;
        top: 60px !important;
        right: 10px !important;
        z-index: 2147483646 !important;
        width: 320px !important;
        min-height: 180px !important;
        max-height: 70vh !important;
        background: white !important;
        border: 2px solid #fc5200 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
        font-family: Arial, sans-serif !important;
        overflow: visible !important;
        display: none !important;
      }

      .sff-clean-panel.show {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      .sff-panel-header {
        background: #fc5200 !important;
        padding: 12px 16px !important;
        border-bottom: none !important;
        cursor: move !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-radius: 6px 6px 0 0 !important;
      }

      .sff-panel-header h3 {
        margin: 0 !important;
        font-size: 16px !important;
        color: white !important;
        font-family: 'Poppins', 'Montserrat', sans-serif !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
      }

      .sff-header-main {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100%;
        margin-right: 16px !important;
      }

      .sff-toggle-switch {
        position: relative !important;
        display: inline-block !important;
        width: 34px !important;
        height: 20px !important;
      }

      .sff-toggle-switch input {
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
      }

      .sff-slider {
        position: absolute !important;
        cursor: pointer !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background-color: #ccc !important;
        transition: .4s !important;
        border-radius: 20px !important;
      }

      .sff-slider:before {
        position: absolute !important;
        content: "" !important;
        height: 14px !important;
        width: 14px !important;
        left: 3px !important;
        bottom: 3px !important;
        background-color: white !important;
        transition: .4s !important;
        border-radius: 50% !important;
      }

      input:checked + .sff-slider {
        background-color: #4CAF50 !important;
      }

      input:checked + .sff-slider:before {
        transform: translateX(14px) !important;
      }

      .sff-clean-panel .sff-section h4 {
        margin: 0 0 10px 0 !important;
        font-size: 13px !important;
        color: #333 !important;
        font-weight: 600 !important;
      }

      .sff-panel-header .sff-close {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        color: white !important;
        cursor: pointer !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        line-height: 1 !important;
      }

      .sff-panel-header .sff-close:hover {
        background: rgba(255,255,255,0.2) !important;
        color: #fc5200 !important;
      }

      .sff-panel-content {
        padding: 16px !important;
        max-height: calc(70vh - 100px) !important;
        overflow-y: auto !important;
      }

      .sff-clean-panel .sff-row {
        margin: 0 0 16px 0 !important;
        display: block !important;
      }

      .sff-clean-panel .sff-label {
        display: block !important;
        font-size: 14px !important;
        margin-bottom: 6px !important;
        font-weight: 500 !important;
        color: #333 !important;
      }

      .sff-clean-panel .sff-input {
        width: 100% !important;
        padding: 8px 12px !important;
        border: 1px solid #ddd !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        box-sizing: border-box !important;
        background: white !important;
        color: #333 !important;
      }

      .sff-clean-panel .sff-input:focus {
        outline: none !important;
        border-color: #fc5200 !important;
        box-shadow: 0 0 0 2px rgba(252, 82, 0, 0.1) !important;
      }

      .sff-dropdown-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: pointer !important;
        padding-bottom: 6px !important;
      }

      .sff-dropdown-header .sff-label {
        margin-bottom: 0 !important;
      }

      .sff-activity-count {
        font-size: 12px !important;
        color: #666 !important;
      }

      .sff-dropdown-content {
        display: none; /* Initially hidden */
      }

      .sff-dropdown-right {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }

      .sff-dropdown-indicator {
        transition: transform 0.2s ease !important;
      }

      .sff-dropdown.open .sff-dropdown-indicator {
        transform: rotate(180deg) !important;
      }

      .sff-clean-panel .sff-keywords {
        min-height: 40px !important;
        max-height: 120px !important;
        resize: vertical !important;
        line-height: 1.4 !important;
      }

      .sff-types {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)) !important;
        gap: 2px 2px !important;
        margin-top: 3px !important;
      }

      .sff-clean-panel .sff-chip {
        display: inline-flex !important;
        align-items: center !important;
        padding: 0 2px !important;
        border: none !important;
        border-radius: 0 !important;
        font-size: 9px !important;
        line-height: 1 !important;
        background: transparent !important;
        cursor: pointer !important;
        transition: none !important;
        user-select: none !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      .sff-clean-panel .sff-chip:hover {
        background: transparent !important;
      }

      .sff-clean-panel .sff-chip.checked {
        background: transparent !important;
        color: #333 !important;
      }

      .sff-clean-panel .sff-chip input {
        margin-right: 4px !important;
        margin-left: 0 !important;
        transform: scale(0.85) !important;
      }

      .sff-clean-panel .sff-section {
        margin-bottom: 16px !important;
      }

      .sff-clean-panel .sff-buttons {
        display: flex !important;
        gap: 8px !important;
        justify-content: center !important;
        margin-top: 16px !important;
        padding-top: 12px !important;
        border-top: 1px solid #eee !important;
      }

      .sff-clean-panel .sff-buttons button {
        padding: 6px 12px !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }

      .sff-clean-panel .sff-save {
        background: #fc5200 !important;
        color: white !important;
        border-color: #fc5200 !important;
      }

      .sff-clean-panel .sff-save:hover {
        background: #e04700 !important;
        border-color: #e04700 !important;
      }

      .sff-clean-panel .sff-reset {
        background: white !important;
        color: #fc5200 !important;
        border-color: #fc5200 !important;
      }

      .sff-clean-panel .sff-reset:hover {
        background: rgba(252, 82, 0, 0.05) !important;
        color: #e04700 !important;
        border-color: #e04700 !important;
      }

      .sff-bmc {
        text-align: center !important;
        margin-top: 16px !important;
        padding-top: 16px !important;
        border-top: 1px solid #eee !important;
      }

      .sff-bmc a {
        display: inline-block !important;
        padding: 8px 16px !important;
        background: #FFDD00 !important;
        color: #000 !important;
        text-decoration: none !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        transition: all 0.2s !important;
      }

      .sff-bmc a:hover {
        background: #FFD700 !important;
        transform: translateY(-1px) !important;
      }
    `);

    function createElements() {
        console.log('🔧 Clean Filter: Creating elements...');

        // Remove existing
        document.querySelectorAll('.sff-clean-btn, .sff-clean-panel').forEach(el => el.remove());

        // Create button
        const btn = document.createElement('button');
        btn.className = 'sff-clean-btn';
        btn.innerHTML = '<span class="sff-btn-title">Filter</span><span class="sff-btn-sub">HIDDEN 0</span>';

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'sff-clean-panel';

        // Load position
        let pos = JSON.parse(localStorage.getItem(POS_KEY) || "null");
        if (pos) {
            panel.style.top = pos.top;
            panel.style.right = pos.right || '10px';
        }

        // Build panel content
        const header = document.createElement('div');
        header.className = 'sff-panel-header';
        header.innerHTML = `
            <div class="sff-header-main">
                <h3>Strava Feed Filter</h3>
                <label class="sff-toggle-switch">
                    <input type="checkbox" class="sff-enabled-toggle" ${settings.enabled ? 'checked' : ''}>
                    <span class="sff-slider"></span>
                </label>
            </div>
            <button class="sff-close">×</button>
        `;

        const content = document.createElement('div');
        content.className = 'sff-panel-content';
        content.innerHTML = `
            <div class="sff-row">
                <label class="sff-label">Keywords to hide (comma separated):</label>
                <textarea class="sff-input sff-keywords" placeholder="e.g. warm up, cool down">${settings.keywords.join(', ')}</textarea>
            </div>

            <div class="sff-row sff-dropdown">
                <div class="sff-dropdown-header">
                    <span class="sff-label">Activity Types</span>
                    <div class="sff-dropdown-right">
                        <span class="sff-activity-count"></span>
                        <span class="sff-dropdown-indicator">▼</span>
                    </div>
                </div>
                <div class="sff-dropdown-content">
                    <div class="sff-types">
                        ${TYPES.map(t => `
                            <label class="sff-chip ${settings.types[t.key] ? 'checked' : ''}">
                                <input type="checkbox" data-typ="${t.key}" ${settings.types[t.key] ? 'checked' : ''}>
                                ${t.label}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="sff-row">
                <label class="sff-label">Min Distance (km):</label>
                <input type="number" class="sff-input sff-minKm" min="0" step="0.1" value="${settings.minKm}">
            </div>

            <div class="sff-row">
                <label class="sff-label">Min Duration (minutes):</label>
                <input type="number" class="sff-input sff-minMins" min="0" value="${settings.minMins}">
            </div>

            <div class="sff-row">
                <label class="sff-label">Min Elevation Gain (m):</label>
                <input type="number" class="sff-input sff-minElevM" min="0" value="${settings.minElevM}">
            </div>

            <div class="sff-row">
                <label class="sff-label">Max Pace for Runs (min/km):</label>
                <input type="number" class="sff-input sff-minPace" min="0" step="0.1" value="${settings.minPace}">
            </div>

            <div class="sff-row">
                <label class="sff-chip ${settings.hideNoMap ? 'checked' : ''}">
                    <input type="checkbox" class="sff-hideNoMap" ${settings.hideNoMap ? 'checked' : ''}>
                    Hide activities without map
                </label>
            </div>

            <div class="sff-row">
                <label class="sff-chip ${settings.hideGiveGift ? 'checked' : ''}">
                    <input type="checkbox" class="sff-hideGift" ${settings.hideGiveGift ? 'checked' : ''}>
                    Hide "Give a Gift" button
                </label>
            </div>

            <div class="sff-buttons">
                <button class="sff-btn-action sff-save">Apply & Refresh</button>
                <button class="sff-btn-action sff-reset">Reset</button>
            </div>

            <div class="sff-bmc">
                <a href="https://www.buymeacoffee.com/inc21" target="_blank">☕ Buy me a coffee</a>
            </div>
        `;

        panel.appendChild(header);
        panel.appendChild(content);

        document.body.appendChild(btn);
        document.body.appendChild(panel);

        console.log('✅ Clean Filter: Elements added');

        setupEvents(btn, panel);
        return { btn, panel };
    }

    function setupEvents(btn, panel) {
        console.log('🎯 Clean Filter: Setting up events...');

        // Toggle panel
        const togglePanel = () => {
            console.log('🖱️ Toggle panel clicked');
            const isVisible = panel.classList.contains('show');

            if (!isVisible) {
                panel.classList.add('show');
                panel.style.display = 'block';
                console.log('✅ Panel shown');
            } else {
                panel.classList.remove('show');
                panel.style.display = 'none';
                console.log('❌ Panel hidden');
            }
        };

        btn.addEventListener('click', togglePanel);

        // Close button
        panel.querySelector('.sff-close').addEventListener('click', () => {
            panel.classList.remove('show');
            panel.style.display = 'none';
        });

        // Main toggle switch
        panel.querySelector('.sff-enabled-toggle').addEventListener('change', (e) => {
            settings.enabled = e.target.checked;
            saveSettings(settings);
            filterActivities();
        });

        // Toggle activity dropdown
        panel.querySelector('.sff-dropdown-header').addEventListener('click', (e) => {
            const dropdown = e.currentTarget.closest('.sff-dropdown');
            if (!dropdown) return;

            const content = dropdown.querySelector('.sff-dropdown-content');
            const isVisible = content.style.display === 'block';

            content.style.display = isVisible ? 'none' : 'block';
            dropdown.classList.toggle('open', !isVisible);
        });

        // Checkbox styling
        panel.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const chip = e.target.closest('.sff-chip');
                if (chip) {
                    chip.classList.toggle('checked', e.target.checked);
                }
                updateActivityCount(panel);
                // Live apply for Give a Gift toggle
                if (e.target.classList.contains('sff-hideGift')) {
                    settings.hideGiveGift = e.target.checked;
                    saveSettings(settings);
                    updateGiftVisibility();
                }
            }
        });

        // Apply button
        panel.querySelector('.sff-save').addEventListener('click', () => {
            console.log('💾 Applying and refreshing...');
            applySettings(panel);
            location.reload();
        });

        // Reset button
        panel.querySelector('.sff-reset').addEventListener('click', () => {
            settings = {...DEFAULTS};
            saveSettings(settings);
            location.reload();
        });

        // Dragging
        setupDragging(panel);
        setupWindowResize(panel);
        setupButtonResponsive(btn);
        updateActivityCount(panel);

        console.log('✅ Events attached');
    }

    function updateActivityCount(panel) {
        const countEl = panel.querySelector('.sff-activity-count');
        if (!countEl) return;

        const total = TYPES.length;
        const hidden = panel.querySelectorAll('.sff-types input[type="checkbox"]:checked').length;
        countEl.textContent = `(${hidden} hidden / ${total} total)`;
    }

    function setupDragging(panel) {
        const header = panel.querySelector('.sff-panel-header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(panel).right, 10);
            startTop = parseInt(window.getComputedStyle(panel).top, 10);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = startX - e.clientX;
            const deltaY = e.clientY - startY;

            const newRight = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, startLeft + deltaX));
            const newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, startTop + deltaY));

            panel.style.right = newRight + 'px';
            panel.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                localStorage.setItem(POS_KEY, JSON.stringify({
                    top: panel.style.top,
                    right: panel.style.right
                }));
            }
            isDragging = false;
        });
    }

    // Hide/show the Strava header "Give a Gift" button based on settings
    function updateGiftVisibility() {
        try {
            const links = document.querySelectorAll('a[href*="/gift"][href*="origin=global_nav"]');
            links.forEach(a => {
                if (settings.hideGiveGift) {
                    if (a.dataset.sffHiddenBy !== 'sff') {
                        a.dataset.sffHiddenBy = 'sff';
                        a.style.display = 'none';
                    }
                } else if (a.dataset.sffHiddenBy === 'sff') {
                    a.style.display = '';
                    delete a.dataset.sffHiddenBy;
                }
            });
        } catch (e) {
            console.warn('updateGiftVisibility error:', e);
        }
    }

    function setupWindowResize(panel) {
        window.addEventListener('resize', () => {
            const rect = panel.getBoundingClientRect();

            if (rect.right > window.innerWidth) {
                panel.style.right = '10px';
            }
            if (rect.bottom > window.innerHeight) {
                panel.style.top = Math.max(20, window.innerHeight - panel.offsetHeight - 20) + 'px';
            }
            if (rect.left < 0) {
                panel.style.right = Math.max(0, window.innerWidth - panel.offsetWidth - 10) + 'px';
            }
            if (rect.top < 0) {
                panel.style.top = '20px';
            }

            localStorage.setItem(POS_KEY, JSON.stringify({
                top: panel.style.top,
                right: panel.style.right
            }));
        });
    }

    // Dynamically adjust button position when in left mode to avoid overlapping the burger
    function setupButtonResponsive(btn) {
        const adjust = () => {
            const w = window.innerWidth;
            // When width <= 985px, button is on the left; adjust its left offset smoothly
            if (w <= 985) {
                const minW = 760; // at and below this, we want the MIN left offset (closest to logo)
                const maxW = 985; // at this width, we want the MAX left offset
                const minLeft = 180; // px (closest to logo on very small widths)
                const maxLeft = 265; // px (more to the right when there's space)

                let leftPx;
                if (w <= minW) {
                    leftPx = minLeft; // smallest left when width is smallest
                } else {
                    const t = (maxW - w) / (maxW - minW); // 0..1 as width shrinks
                    // As width shrinks, move left toward logo (decrease left value)
                    leftPx = Math.round(maxLeft - t * (maxLeft - minLeft));
                }

                btn.style.setProperty('left', leftPx + 'px', 'important');
                btn.style.setProperty('right', 'auto', 'important');
                btn.style.setProperty('top', '10px', 'important');
            } else {
                // Clear inline overrides so CSS media queries control right-mode positioning
                btn.style.removeProperty('left');
                btn.style.removeProperty('right');
                btn.style.removeProperty('top');
            }
        };

        // Run once now and on resize
        adjust();
        window.addEventListener('resize', adjust);
        // Also run after a short delay to allow page header to stabilize
        setTimeout(adjust, 250);
    }

    function applySettings(panel) {
        settings.keywords = panel.querySelector('.sff-keywords').value
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

        settings.minKm = +panel.querySelector('.sff-minKm').value || 0;
        settings.minMins = +panel.querySelector('.sff-minMins').value || 0;
        settings.minElevM = +panel.querySelector('.sff-minElevM').value || 0;
        settings.minPace = +panel.querySelector('.sff-minPace').value || 0;
        settings.hideNoMap = panel.querySelector('.sff-hideNoMap').checked;
        const giftChk = panel.querySelector('.sff-hideGift');
        settings.hideGiveGift = giftChk ? giftChk.checked : settings.hideGiveGift;

        settings.types = {};
        panel.querySelectorAll('input[type=checkbox][data-typ]').forEach(input => {
            settings.types[input.dataset.typ] = input.checked;
        });

        saveSettings(settings);
        console.log('💾 Settings saved:', settings);
    }

    // Parse duration from an activity card by reading abbr[title] units in the Time row
    function parseDurationSeconds(activityEl) {
        const timeLi = [...activityEl.querySelectorAll('li')].find(li => {
            const label = li.querySelector('span');
            return label && label.textContent.trim().toLowerCase() === 'time';
        });
        if (!timeLi) return null;

        const value = timeLi.querySelector('.vNsSU') || timeLi;
        if (!value) return null;

        let h = 0, m = 0, s = 0;
        const abbrs = value.querySelectorAll('abbr.unit');
        if (!abbrs.length) {
            const t = (value.textContent || '').trim();
            if (!t) return null;
            if (t.includes(':')) {
                const parts = t.split(':').map(x => parseInt(x.trim(), 10));
                if (parts.every(n => Number.isFinite(n))) {
                    if (parts.length === 3) [h, m, s] = parts;
                    else if (parts.length === 2) [m, s] = parts;
                    else if (parts.length === 1) m = parts[0];
                    return h * 3600 + m * 60 + s;
                }
            }
            const maybe = parseFloat(t);
            return Number.isFinite(maybe) ? Math.round(maybe * 60) : null;
        }

        abbrs.forEach(abbr => {
            const unit = (abbr.getAttribute('title') || '').toLowerCase();
            const numText = (abbr.previousSibling && abbr.previousSibling.textContent) ? abbr.previousSibling.textContent.trim() : '';
            const num = parseInt(numText, 10);
            if (!Number.isFinite(num)) return;
            if (unit.includes('hour')) h = num;
            else if (unit.includes('minute')) m = num;
            else if (unit.includes('second')) s = num;
        });
        return h * 3600 + m * 60 + s;
    }

    // Parse distance (km) from the Distance row using abbr[title]
    function parseDistanceKm(activityEl) {
        const distLi = [...activityEl.querySelectorAll('li')].find(li => {
            const label = li.querySelector('span');
            return label && label.textContent.trim().toLowerCase() === 'distance';
        });
        if (!distLi) return null;

        const value = distLi.querySelector('.vNsSU') || distLi;
        if (!value) return null;

        const abbr = value.querySelector('abbr.unit');
        const text = (value.textContent || '').trim();
        let num = NaN;
        if (abbr && abbr.previousSibling && abbr.previousSibling.textContent) {
            num = parseFloat(abbr.previousSibling.textContent.trim());
        }
        if (!Number.isFinite(num)) {
            const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
            if (m) num = parseFloat(m[1]);
        }
        if (!Number.isFinite(num)) return null;

        const unitTitle = (abbr && abbr.getAttribute('title')) ? abbr.getAttribute('title').toLowerCase() : '';
        if (unitTitle.includes('kilometer')) return num;
        if (unitTitle.includes('mile')) return num * 1.60934;
        if (unitTitle.includes('meter')) return num / 1000;
        if (unitTitle.includes('yard')) return num * 0.0009144;
        if (unitTitle.includes('foot') || unitTitle.includes('feet')) return num * 0.0003048;
        return num; // assume km if unknown
    }

    // Main filtering logic
    function filterActivities() {
        const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');
        if (!settings.enabled) {
            activities.forEach(activity => {
                activity.style.display = '';
            });
            const btn = document.querySelector('.sff-clean-btn .sff-btn-sub');
            if (btn) btn.textContent = 'FILTER OFF';
            return;
        }
        let hiddenCount = 0;

        activities.forEach(activity => {
            const title = activity.querySelector('.entry-title, .activity-name, [data-testid="entry-title"], [data-testid="activity_name"]')?.textContent || '';
            const svgIcon = activity.querySelector('svg[data-testid="activity-icon"] title');
            const typeEl = activity.querySelector('[data-testid="tag"]') || activity.querySelector('.entry-head, .activity-type');
            const type = svgIcon?.textContent || typeEl?.textContent || '';

            let shouldHide = false;

            // Keywords
            if (settings.keywords.length > 0 && title) {
                const hasKeyword = settings.keywords.some(keyword => keyword && title.toLowerCase().includes(keyword.toLowerCase()));
                if (hasKeyword) shouldHide = true;
            }

            // Activity types
            if (type) {
                const typeLower = type.toLowerCase();
                const matched = TYPES.find(t => typeLower.includes(t.label.toLowerCase()));
                if (matched && settings.types[matched.key]) {
                    shouldHide = true;
                } else if (typeLower.includes('virtual')) {
                    const hideAnyVirtual = TYPES.filter(t => t.label.toLowerCase().includes('virtual')).some(t => settings.types[t.key]);
                    if (hideAnyVirtual) shouldHide = true;
                }
            }

            // Min distance (km)
            if (settings.minKm > 0) {
                const km = parseDistanceKm(activity);
                if (km !== null && km < settings.minKm) shouldHide = true;
            }

            // Min duration (minutes)
            if (settings.minMins > 0) {
                const secs = parseDurationSeconds(activity);
                if (secs !== null && secs / 60 < settings.minMins) shouldHide = true;
            }

            // Max pace for runs (min/km) — basic fallback parsing
            if (settings.minPace > 0 && type && type.toLowerCase().includes('run')) {
                const paceEl = activity.querySelector('.pace .value, [data-testid="pace"] .value');
                if (paceEl) {
                    const pace = parseFloat(paceEl.textContent) || 0;
                    if (pace > settings.minPace) shouldHide = true;
                }
            }

            // Hide activities without a map
            if (settings.hideNoMap) {
                const map = activity.querySelector('img[data-testid="map"], svg.map, .activity-map, [data-testid="activity-map"]');
                if (!map) shouldHide = true;
            }

            if (shouldHide) {
                activity.style.display = 'none';
                hiddenCount++;
            } else {
                activity.style.display = '';
            }
        });

        console.log(`🎯 Filtered ${hiddenCount}/${activities.length} activities`);
        const btn = document.querySelector('.sff-clean-btn .sff-btn-sub');
        if (btn) btn.textContent = `HIDDEN ${hiddenCount}`;
    }

    // Debounce helper to limit how often filtering runs on rapid DOM changes/scroll
    function debounce(fn, wait) {
        let t;
        return function(...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    // Observe DOM for new activities and re-apply filters automatically
    function setupAutoFilter() {
        const debouncedFilter = debounce(() => {
            try {
                filterActivities();
                updateGiftVisibility();
            } catch (e) {
                console.error('Auto-filter error:', e);
            }
        }, 250);

        // Initial filter
        filterActivities();

        // MutationObserver for dynamically inserted feed entries
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (!m.addedNodes || m.addedNodes.length === 0) continue;
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    // If the added node is an activity or contains one, trigger filtering
                    if (
                        (node.matches && node.matches('.activity, .feed-entry, [data-testid="web-feed-entry"]')) ||
                        node.querySelector?.('.activity, .feed-entry, [data-testid="web-feed-entry"]')
                    ) {
                        debouncedFilter();
                        break;
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Fallback: when user scrolls and Strava lazy-loads content, re-run filtering
        window.addEventListener('scroll', debouncedFilter, { passive: true });

        // Store on window for potential debugging/cleanup
        window.__sffObserver = observer;
    }

    // ==== SFF SECTION: INIT BOOTSTRAP ====
    // Initialize
    function init() {
        console.log('🚀 Clean Filter: Initializing...');
        setTimeout(() => {
            createElements();
            updateGiftVisibility();
            if (settings.enabled) {
                filterActivities();
                setupAutoFilter();
            }
        }, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ Clean Filter: Setup complete');

})();
