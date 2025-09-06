// ==UserScript==
// @name         Strava Feed Filter
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @author       inc21
// @match        https://www.strava.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 Clean Filter: Script starting...');
    
    // Ensure script runs in the correct context
    if (window.self !== window.top) return;

    const STORAGE_KEY = "stravaFeedFilter";
    const POS_KEY = "stravaFeedFilterPos";

    const DEFAULTS = {
        keywords: [],
        allowedAthletes: [],
        types: {},
        hideNoMap: false,
        hideGiveGift: false,
        hideClubPosts: false,
        hideChallenges: false,
        showKudosButton: false,
        minKm: 0,
        maxKm: 0,
        minMins: 0,
        maxMins: 0,
        minElevM: 0,
        maxElevM: 0,
        minPace: 0,
        maxPace: 0,
        unitSystem: 'metric', // 'metric' or 'imperial'
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
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
      .sff-clean-btn {
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 2147483647 !important;
        padding: 5px 12px !important;
        background: #fc5200 !important;
        color: white !important;
        border: 1px solid transparent !important;
        cursor: pointer !important;
        font-weight: 700 !important;
        border-radius: 4px !important;
        font-family: 'Roboto', sans-serif !important;
        text-align: center !important;
        transition: background-color 0.15s ease !important;
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 1px !important;
        line-height: 1.2 !important;
      }

      .sff-clean-btn:hover {
        background: #e04a00 !important;
      }

      .sff-btn-title {
        font-size: 14px !important;
        line-height: 1.1 !important;
        text-transform: uppercase !important;
      }

      .sff-clean-btn .sff-btn-sub {
        font-size: 10px !important;
        font-weight: 500 !important;
        text-transform: uppercase !important;
        color: white !important;
        opacity: 1 !important;
        line-height: 1 !important;
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
        border: 1px solid white !important;
        font-size: 22px !important;
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

      .sff-input-group {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 8px !important;
      }

      .sff-unit-toggle {
        display: flex !important;
        border: 1px solid #ddd !important;
        border-radius: 6px !important;
        overflow: hidden !important;
      }

      .sff-unit-btn {
        flex: 1 !important;
        padding: 8px !important;
        border: none !important;
        background: #f7f7f7 !important;
        cursor: pointer !important;
        font-size: 13px !important;
        transition: background-color 0.2s ease !important;
      }

      .sff-unit-btn:not(.active) {
        background: white !important;
        color: #555 !important;
      }

      .sff-unit-btn.active {
        background: #fc5200 !important;
        color: white !important;
        font-weight: 600 !important;
      }

      .sff-unit-btn.metric {
        border-right: 1px solid #ddd !important;
      }

      .sff-dropdown-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: pointer !important;
        padding: 8px 12px !important;
        border: 1px solid #ddd !important;
        border-radius: 6px !important;
        background: #f7f7f7 !important;
        transition: background-color 0.2s ease !important;
      }

      .sff-dropdown-header:hover {
          background: #eee !important;
      }

      .sff-dropdown.open .sff-dropdown-header {
          border-bottom-left-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
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
        padding: 12px !important;
        border: 1px solid #ddd !important;
        border-top: none !important;
        border-radius: 0 0 6px 6px !important;
        margin-top: -1px !important;
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
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important; /* Increased min width */
        gap: 4px 8px !important; /* Increased gap */
        margin-top: 3px !important;
      }

      .sff-clean-panel .sff-chip {
        font-family: 'Roboto', sans-serif !important;
        font-weight: 400 !important;
        font-size: 14px !important; /* Increased for readability */
        display: flex !important;
        align-items: center !important;
        padding: 4px 0 !important;
        border: none !important;
        border-radius: 0 !important;
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
        font-weight: 400 !important; /* Ensure it's not bold when checked */
      }

      .sff-clean-panel .sff-chip input {
        margin-right: 4px !important;
        margin-left: 0 !important;
        transform: scale(0.85) !important;
      }

      .sff-switch {
        position: relative !important;
        display: inline-block !important;
        width: 40px !important;
        height: 22px !important;
      }

      .sff-switch input { 
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
        border-radius: 22px !important;
      }

      .sff-slider:before {
        position: absolute !important;
        content: "" !important;
        height: 16px !important;
        width: 16px !important;
        left: 3px !important;
        bottom: 3px !important;
        background-color: white !important;
        transition: .4s !important;
        border-radius: 50% !important;
      }

      input:checked + .sff-slider {
        background-color: #fc5200 !important;
      }

      input:checked + .sff-slider:before {
        transform: translateX(18px) !important;
      }

      .sff-toggle-section {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 16px !important;
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

      .sff-header-kudos-btn {
        padding: 6px 12px !important; /* Align with gift button */
        background: #fc5200 !important;
        color: white !important;
        border: 1px solid transparent !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        text-decoration: none !important;
        font-family: 'Roboto', sans-serif !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        line-height: 1.2 !important;
        transition: background-color 0.15s ease !important;
      }

      .sff-header-kudos-btn:hover {
        background: #e04a00 !important;
      }

      .sff-desc {
        font-size: 11px !important;
        color: #666 !important;
        margin: -2px 0 8px 22px !important;
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
        btn.title = 'Filter Activities';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.alignItems = 'center';
        btn.innerHTML = `
            <span class="sff-btn-title">FILTER ${settings.enabled ? 'ON' : 'OFF'}</span>
            <span class="sff-btn-sub">HIDDEN 0</span>
        `;
        
        // Ensure button is added to the body
        document.body.appendChild(btn);

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
            </div>
            <button class="sff-close">×</button>
        `;

        const content = document.createElement('div');
        content.className = 'sff-panel-content';
        content.innerHTML = `
            <div class="sff-toggle-section">
                <label class="sff-switch">
                    <input type="checkbox" class="sff-enabled-toggle" ${settings.enabled ? 'checked' : ''}>
                    <span class="sff-slider"></span>
                </label>
                <span class="sff-label">
                    <span class="sff-toggle-text">Filter ${settings.enabled ? 'on' : 'off'}</span>
                </span>
            </div>
        ` + `
            <div class="sff-row sff-dropdown">
                <div class="sff-dropdown-header">
                    <span class="sff-label">Keywords to Hide</span>
                    <div class="sff-dropdown-right">
                        <span class="sff-dropdown-indicator">▼</span>
                    </div>
                </div>
                <div class="sff-dropdown-content">
                    <textarea class="sff-input sff-keywords" placeholder="e.g. warm up, cool down">${settings.keywords.join(', ')}</textarea>
                </div>
            </div>

            <div class="sff-row sff-dropdown">
                <div class="sff-dropdown-header">
                    <span class="sff-label">Allowed Athletes</span>
                    <div class="sff-dropdown-right">
                        <span class="sff-dropdown-indicator">▼</span>
                    </div>
                </div>
                <div class="sff-dropdown-content">
                    <textarea class="sff-input sff-allowed-athletes" placeholder="e.g. John Doe, Jane Smith">${settings.allowedAthletes.join(', ')}</textarea>
                </div>
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

            <div class="sff-row sff-dropdown">
                <div class="sff-dropdown-header">
                    <span class="sff-label">Min/Max Filters</span>
                    <div class="sff-dropdown-right">
                        <span class="sff-dropdown-indicator">▼</span>
                    </div>
                </div>
                <div class="sff-dropdown-content">
                    <div class="sff-row">
                        <label class="sff-label">Unit System</label>
                        <div class="sff-unit-toggle">
                            <button class="sff-unit-btn metric ${settings.unitSystem === 'metric' ? 'active' : ''}" data-unit="metric">Metric</button>
                            <button class="sff-unit-btn imperial ${settings.unitSystem === 'imperial' ? 'active' : ''}" data-unit="imperial">Imperial</button>
                        </div>
                    </div>
                    <div class="sff-row">
                        <label class="sff-label" data-label-type="distance">Distance (km):</label>
                        <div class="sff-input-group">
                            <input type="number" class="sff-input sff-minKm" min="0" step="0.1" value="${settings.minKm}" placeholder="Min">
                            <input type="number" class="sff-input sff-maxKm" min="0" step="0.1" value="${settings.maxKm}" placeholder="Max">
                        </div>
                    </div>
                    <div class="sff-row">
                        <label class="sff-label" data-label-type="duration">Duration (minutes):</label>
                        <div class="sff-input-group">
                            <input type="number" class="sff-input sff-minMins" min="0" value="${settings.minMins}" placeholder="Min">
                            <input type="number" class="sff-input sff-maxMins" min="0" value="${settings.maxMins}" placeholder="Max">
                        </div>
                    </div>
                    <div class="sff-row">
                        <label class="sff-label" data-label-type="elevation">Elevation Gain (m):</label>
                        <div class="sff-input-group">
                            <input type="number" class="sff-input sff-minElevM" min="0" value="${settings.minElevM}" placeholder="Min">
                            <input type="number" class="sff-input sff-maxElevM" min="0" value="${settings.maxElevM}" placeholder="Max">
                        </div>
                    </div>
                    <div class="sff-row">
                        <label class="sff-label" data-label-type="pace">Pace for Runs (min/km):</label>
                        <div class="sff-input-group">
                            <input type="number" class="sff-input sff-minPace" min="0" step="0.1" value="${settings.minPace}" placeholder="Min (Fastest)">
                            <input type="number" class="sff-input sff-maxPace" min="0" step="0.1" value="${settings.maxPace}" placeholder="Max (Slowest)">
                        </div>
                    </div>
                </div>
            </div>

            <div class="sff-row sff-dropdown">
                <div class="sff-dropdown-header">
                    <span class="sff-label">Other</span>
                    <div class="sff-dropdown-right">
                        <span class="sff-dropdown-indicator">▼</span>
                    </div>
                </div>
                <div class="sff-dropdown-content">
                    <label class="sff-chip ${settings.hideNoMap ? 'checked' : ''}">
                        <input type="checkbox" class="sff-hideNoMap" ${settings.hideNoMap ? 'checked' : ''}>
                        Hide activities without map
                    </label>
                    <label class="sff-chip ${settings.hideClubPosts ? 'checked' : ''}">
                        <input type="checkbox" class="sff-hideClubPosts" ${settings.hideClubPosts ? 'checked' : ''}>
                        Hide club posts
                    </label>
                    <label class="sff-chip ${settings.hideChallenges ? 'checked' : ''}">
                        <input type="checkbox" class="sff-hideChallenges" ${settings.hideChallenges ? 'checked' : ''}>
                        Hide challenges
                    </label>
                    <label class="sff-chip ${settings.hideGiveGift ? 'checked' : ''}">
                        <input type="checkbox" class="sff-hideGift" ${settings.hideGiveGift ? 'checked' : ''}>
                        Hide "Give a Gift" button
                    </label>
                    <label class="sff-chip ${settings.showKudosButton ? 'checked' : ''}">
                        <input type="checkbox" class="sff-showKudosButton" ${settings.showKudosButton ? 'checked' : ''}>
                        Show "Give Kudos to Everyone"
                    </label>
                    <p class="sff-desc">Adds a button to the header to give kudos to all visible activities.</p>
                </div>
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
                // Close all dropdowns before showing the panel
                panel.querySelectorAll('.sff-dropdown.open').forEach(dropdown => {
                    dropdown.classList.remove('open');
                    const content = dropdown.querySelector('.sff-dropdown-content');
                    if (content) content.style.display = 'none';
                });

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

        // Toggle all dropdowns
        panel.querySelectorAll('.sff-dropdown-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const dropdown = e.currentTarget.closest('.sff-dropdown');
                if (!dropdown) return;

                const content = dropdown.querySelector('.sff-dropdown-content');
                const isVisible = content.style.display === 'block';

                content.style.display = isVisible ? 'none' : 'block';
                dropdown.classList.toggle('open', !isVisible);
            });
        });

        // Checkbox styling
        panel.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const chip = e.target.closest('.sff-chip');
                if (chip) {
                    chip.classList.toggle('checked', e.target.checked);
                }

                // Handle real-time updates for specific toggles
                if (e.target.classList.contains('sff-enabled-toggle')) {
                    settings.enabled = e.target.checked;
                    saveSettings(settings);
                    // Update toggle text and button
                    const toggleText = document.querySelector('.sff-toggle-text');
                    const mainBtn = document.querySelector('.sff-clean-btn .sff-btn-sub');
                    if (toggleText) {
                        toggleText.textContent = `Filter ${settings.enabled ? 'on' : 'off'}`;
                    }
                    if (mainBtn) {
                        mainBtn.textContent = `FILTER ${settings.enabled ? 'ON' : 'OFF'}`;
                    }
                    filterActivities();
                } else if (e.target.classList.contains('sff-showKudosButton')) {
                    settings.showKudosButton = e.target.checked;
                    manageHeaderKudosButton();
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
            if (confirm('Are you sure you want to reset all filters to their default values?')) {
                settings = {...DEFAULTS};
                saveSettings(settings);
                location.reload();
            }
        });

        // Dragging
        setupDragging(panel);
        setupWindowResize(panel);
        setupButtonResponsive(btn);
        updateActivityCount(panel);
        updateFilterLabels(panel, settings.unitSystem);


        // Unit system toggle
        panel.querySelector('.sff-unit-toggle').addEventListener('click', (e) => {
            if (e.target.matches('.sff-unit-btn')) {
                const newUnit = e.target.dataset.unit;
                if (newUnit !== settings.unitSystem) {
                    settings.unitSystem = newUnit;
                    panel.querySelectorAll('.sff-unit-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    const isMetric = newUnit === 'metric';
                    panel.querySelector('[data-label-type="elevation"]').textContent = `Elevation Gain (${isMetric ? 'm' : 'ft'}):`;
                    panel.querySelector('[data-label-type="pace"]').textContent = `Pace for Runs (${isMetric ? 'min/km' : 'min/mi'}):`;
                    saveSettings(settings);
                }
            }
        });

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

        settings.allowedAthletes = panel.querySelector('.sff-allowed-athletes').value
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

        settings.minKm = +panel.querySelector('.sff-minKm').value || 0;
        settings.maxKm = +panel.querySelector('.sff-maxKm').value || 0;
        settings.minMins = +panel.querySelector('.sff-minMins').value || 0;
        settings.maxMins = +panel.querySelector('.sff-maxMins').value || 0;
        settings.minElevM = +panel.querySelector('.sff-minElevM').value || 0;
        settings.maxElevM = +panel.querySelector('.sff-maxElevM').value || 0;
        settings.minPace = +panel.querySelector('.sff-minPace').value || 0;
        settings.maxPace = +panel.querySelector('.sff-maxPace').value || 0;
        settings.unitSystem = panel.querySelector('.sff-unit-btn.active').dataset.unit;
        settings.hideNoMap = panel.querySelector('.sff-hideNoMap').checked;
        settings.hideClubPosts = panel.querySelector('.sff-hideClubPosts').checked;
        settings.hideChallenges = panel.querySelector('.sff-hideChallenges').checked;
        settings.showKudosButton = panel.querySelector('.sff-showKudosButton').checked;
        manageHeaderKudosButton(); // Update button immediately on apply
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

    // Parse elevation (m) from the Elev Gain row
    function parseElevationM(activityEl) {
        const elevLi = [...activityEl.querySelectorAll('li')].find(li => {
            const label = li.querySelector('span');
            return label && (label.textContent.trim().toLowerCase() === 'elev gain' || label.textContent.trim().toLowerCase() === 'elevation gain');
        });
        if (!elevLi) return null;

        const value = elevLi.querySelector('.vNsSU') || elevLi;
        if (!value) return null;

        const text = (value.textContent || '').trim().replace(/,/g, ''); // remove commas from thousands
        let num = parseFloat(text);

        if (!Number.isFinite(num)) return null;

        const abbr = value.querySelector('abbr.unit');
        const unitTitle = (abbr && abbr.getAttribute('title')) ? abbr.getAttribute('title').toLowerCase() : '';

        if (unitTitle.includes('foot') || unitTitle.includes('feet')) return num * 0.3048;
        // assume meters if no unit or meters
        return num;
    }

    // Main filtering logic
    function filterActivities() {
        const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

        if (!settings.enabled) {
            activities.forEach(activity => {
                activity.style.display = '';
            });
            const btn = document.querySelector('.sff-clean-btn .sff-btn-sub');
            if (btn) btn.textContent = 'HIDDEN 0';
            return;
        }
        let hiddenCount = 0;

        activities.forEach(activity => {
            const ownerLink = activity.querySelector('.entry-athlete a, [data-testid="owners-name"]');

            // Handle club posts
            if (ownerLink && ownerLink.getAttribute('href')?.includes('/clubs/')) {
                if (settings.hideClubPosts) {
                    activity.style.display = 'none';
                    hiddenCount++;
                }
                return; // Club posts are not subject to other filters
            }

            // Handle challenges (assuming a selector)
            const isChallenge = activity.querySelector('[data-testid="challenge-card"], .challenge-card');
            if (isChallenge) {
                if (settings.hideChallenges) {
                    activity.style.display = 'none';
                    hiddenCount++;
                }
                return; // Challenges are not subject to other filters
            }

            const title = activity.querySelector('.entry-title, .activity-name, [data-testid="entry-title"], [data-testid="activity_name"]')?.textContent || '';
            const athleteName = ownerLink?.textContent || '';
            const svgIcon = activity.querySelector('svg[data-testid="activity-icon"] title');
            const typeEl = activity.querySelector('[data-testid="tag"]') || activity.querySelector('.entry-head, .activity-type');
            const type = svgIcon?.textContent || typeEl?.textContent || '';

            let shouldHide = false;

            // Keywords
            if (!shouldHide && settings.keywords.length > 0 && title) {
                const hasKeyword = settings.keywords.some(keyword => keyword && title.toLowerCase().includes(keyword.toLowerCase()));
                if (hasKeyword) shouldHide = true;
            }

            // Activity types
            if (!shouldHide && type) {
                const typeLower = type.toLowerCase();
                const matched = TYPES.find(t => typeLower.includes(t.label.toLowerCase()));
                if (matched && settings.types[matched.key]) {
                    shouldHide = true;
                } else if (typeLower.includes('virtual')) {
                    const hideAnyVirtual = TYPES.filter(t => t.label.toLowerCase().includes('virtual')).some(t => settings.types[t.key]);
                    if (hideAnyVirtual) shouldHide = true;
                }
            }

            // Distance
            if (!shouldHide && (settings.minKm > 0 || settings.maxKm > 0)) {
                const km = parseDistanceKm(activity);
                if (km !== null) {
                    const val = settings.unitSystem === 'metric' ? km : km * 0.621371;
                    if (settings.minKm > 0 && val < settings.minKm) shouldHide = true;
                    if (!shouldHide && settings.maxKm > 0 && val > settings.maxKm) shouldHide = true;
                }
            }

            // Duration (minutes)
            if (!shouldHide && (settings.minMins > 0 || settings.maxMins > 0)) {
                const secs = parseDurationSeconds(activity);
                if (secs !== null) {
                    const mins = secs / 60;
                    if (settings.minMins > 0 && mins < settings.minMins) shouldHide = true;
                    if (!shouldHide && settings.maxMins > 0 && mins > settings.maxMins) shouldHide = true;
                }
            }

            // Elevation Gain
            if (!shouldHide && (settings.minElevM > 0 || settings.maxElevM > 0)) {
                const elevM = parseElevationM(activity);
                if (elevM !== null) {
                    const val = settings.unitSystem === 'metric' ? elevM : elevM * 3.28084;
                    if (settings.minElevM > 0 && val < settings.minElevM) shouldHide = true;
                    if (!shouldHide && settings.maxElevM > 0 && val > settings.maxElevM) shouldHide = true;
                }
            }

            // Pace for runs
            if (!shouldHide && (settings.minPace > 0 || settings.maxPace > 0) && type && type.toLowerCase().includes('run')) {
                const paceEl = activity.querySelector('.pace .value, [data-testid="pace"] .value');
                if (paceEl) {
                    const paceText = paceEl.textContent || '';
                    const paceParts = paceText.split(':').map(Number);
                    if (paceParts.length === 2 && !isNaN(paceParts[0]) && !isNaN(paceParts[1])) {
                        const paceInMinutes = paceParts[0] + paceParts[1] / 60;
                        const km = parseDistanceKm(activity);
                        if (km !== null && km > 0) {
                            const pacePerKm = paceInMinutes / km;
                            const paceVal = settings.unitSystem === 'metric' ? pacePerKm : pacePerKm * 1.60934;
                            if (settings.minPace > 0 && paceVal < settings.minPace) shouldHide = true; // Faster than min
                            if (!shouldHide && settings.maxPace > 0 && paceVal > settings.maxPace) shouldHide = true; // Slower than max
                        }
                    }
                }
            }

            // Hide activities without a map
            if (!shouldHide && settings.hideNoMap) {
                const map = activity.querySelector('img[data-testid="map"], svg.map, .activity-map, [data-testid="activity-map"]');
                if (!map) shouldHide = true;
            }

            // Allowed Athletes override
            if (shouldHide && settings.allowedAthletes.length > 0 && athleteName) {
                const nameParts = athleteName.toLowerCase().split(/\s+/);
                const isAllowed = settings.allowedAthletes.some(allowedName => {
                    if (!allowedName) return false;
                    const allowedNameParts = allowedName.toLowerCase().split(/\s+/);
                    return allowedNameParts.every(part => nameParts.includes(part));
                });

                if (isAllowed) {
                    shouldHide = false; // It's an allowed athlete, so don't hide it
                }
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

    function manageHeaderKudosButton() {
        let attempts = 0;
        const maxAttempts = 10; // Try for 5 seconds
        const interval = 500; // 0.5 seconds

        const placeButton = () => {
            const kudosListItem = document.getElementById('gj-kudos-li');

            // If button should be hidden, remove it and stop.
            if (!settings.showKudosButton) {
                if (kudosListItem) kudosListItem.remove();
                return;
            }

            // If button already exists, do nothing.
            if (kudosListItem) return;

            const navList = document.querySelector('.user-nav.nav-group');

            if (navList) {
                const newListItem = document.createElement('li');
                newListItem.id = 'gj-kudos-li';
                newListItem.className = 'nav-item';
                newListItem.style.paddingRight = '10px';
                newListItem.style.display = 'flex';
                newListItem.style.alignItems = 'center';
                newListItem.style.display = 'flex';
                newListItem.style.alignItems = 'center';

                const kudosBtn = document.createElement('a');
                kudosBtn.className = 'sff-header-kudos-btn';
                kudosBtn.href = 'javascript:void(0);';
                kudosBtn.textContent = '👍 Give Kudos to Everyone';

                kudosBtn.addEventListener('click', () => {
                    let kudosGiven = 0;
                    const kudosButtons = document.querySelectorAll("button[data-testid='kudos_button']");

                    kudosButtons.forEach(button => {
                        const feedEntry = button.closest('.activity, .feed-entry, [data-testid="web-feed-entry"]');
                        if (feedEntry && feedEntry.style.display !== 'none' && button.title !== 'View all kudos') {
                            button.click();
                            kudosGiven++;
                        }
                    });

                    const originalText = kudosBtn.textContent;
                    kudosBtn.textContent = `Gave ${kudosGiven}!`;
                    kudosBtn.style.pointerEvents = 'none';

                    setTimeout(() => {
                        kudosBtn.textContent = originalText;
                        kudosBtn.style.pointerEvents = 'auto';
                    }, 3000);
                });

                newListItem.appendChild(kudosBtn);
                navList.prepend(newListItem);
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(placeButton, interval);
                }
            }
        };

        placeButton();
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
        console.log('Document readyState:', document.readyState);
        console.log('Document body:', document.body ? 'exists' : 'not found');
        
        const initScript = () => {
            console.log('🚀 Clean Filter: Running initialization script...');
            const elements = createElements();
            console.log('Created elements:', elements ? 'success' : 'failed');
            updateGiftVisibility();
            manageHeaderKudosButton();
            if (settings.enabled) {
                filterActivities();
                setupAutoFilter();
            }
            // Check if button exists in DOM
            const button = document.querySelector('.sff-clean-btn');
            console.log('Button in DOM:', button ? 'found' : 'not found');
            if (button) {
                console.log('Button styles:', window.getComputedStyle(button));
            }
        };

        // Try to initialize immediately
        try {
            initScript();
        } catch (e) {
            console.error('Initial initialization failed, retrying...', e);
            // Fallback to setTimeout
            setTimeout(initScript, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ Clean Filter: Setup complete');

})();
