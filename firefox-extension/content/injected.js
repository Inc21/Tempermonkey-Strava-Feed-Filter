// Strava Feed Filter - injected page script for Firefox WebExtension
// This is derived from userscript/userscript/strava-feed-filter-clean.js (header removed)
// A small GM_addStyle shim is provided so existing CSS injection works.
(function() {
  if (typeof window.GM_addStyle !== 'function') {
    window.GM_addStyle = function(cssText) {
      try {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(cssText));
        (document.head || document.documentElement).appendChild(style);
        return style;
      } catch (e) {
        console.error('GM_addStyle shim failed:', e);
        return null;
      }
    };
  }
})();

// ===== Begin original script body =====
(function() {
    'use strict';

    /*
     * Copyright (c) 2025 Inc21
     * Licensed under the MIT License. See LICENSE file in the project root for full license text.
     */

    // Debug mode removed: keep console.log default behavior

    // Storage shim: uses browser.storage.local if available (content script),
    // falls back to localStorage when not available.
    const ext = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : null);
    const Storage = {
        async get(key, defaults) {
            try {
                if (ext && ext.storage && ext.storage.local) {
                    // Race against a timeout to avoid hanging if the background service worker is asleep
                    const p = ext.storage.local.get(key);
                    const timeout = new Promise((_, reject) => setTimeout(() => reject('timeout'), 300));
                    const obj = await Promise.race([p, timeout]);
                    return (obj && Object.prototype.hasOwnProperty.call(obj, key)) ? obj[key] : defaults;
                }
            } catch (e) {
                // Fallback to localStorage on timeout or error
            }
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : defaults;
            } catch (_) {
                return defaults;
            }
        },
        async set(key, value) {
            // Always save to localStorage as a synchronous fallback cache
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('Fallback save to localStorage failed:', e);
            }
            // Also save to extension storage
            try {
                if (ext && ext.storage && ext.storage.local) {
                    await ext.storage.local.set({ [key]: value });
                }
            } catch (_) {}
        }
    };

    console.log('🚀 Clean Filter: Script starting...');

    const STORAGE_KEY = "stravaFeedFilter";
    const POS_KEY = "stravaFeedFilterPos";

    const DEFAULTS = {
        keywords: [],
        allowedAthletes: [],
        ignoredAthletes: [],
        types: {},
        hideNoMap: false,
        hideGiveGift: true,
        hideStartTrial: true,
        hideClubPosts: false,
        hideChallenges: false,
        hideJoinedChallenges: false,
        hideSuggestedFriends: false,
        hideYourClubs: false,
        hideMyWindsock: false,
        hideSummitbag: false,
        hideRunHealth: false,
        hideWandrer: false,
        hideBandok: false,
        hideCoros: false,
        hideJoinWorkout: false,
        hideCoachCat: false,
        hideAthleteJoinedClub: false,
        hideFooter: false,
        showKudosButton: true,
        showSeeMoreButton: true,
        seeMoreButtonMode: 'always',
        showNotifications: true,
        minKm: "",
        maxKm: "",
        minMins: "",
        maxMins: "",
        minElevM: "",
        maxElevM: "",
        minPace: "",
        maxPace: "",
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

    const normalizeTypeLabel = (str = '') => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const condenseTypeLabel = (str = '') => normalizeTypeLabel(str).replace(/[^a-z0-9]/g, '');
    const TYPE_LABEL_METADATA = TYPES.map(t => ({
        ...t,
        normalized: normalizeTypeLabel(t.label),
        condensed: condenseTypeLabel(t.label)
    }));

    const TYPE_SYNONYMS = {
        VirtualRide: /\b(virtual\s*ride)\b/i,
        VirtualRun: /\b(virtual\s*run)\b/i,
        VirtualRow: /\b(virtual\s*row|virtual\s*rowing)\b/i,
        MountainBikeRide: /\b(mountain\s*bike|mtb|mountain\s*ride|mountain\s*biking)\b/i,
        GravelRide: /\b(gravel\s*(ride|spin|ride))\b/i,
        EBikeRide: /\b(e-bike|ebike|electric\s*bike)\b/i,
        EMountainBikeRide: /\b(e-mtb|e-mountain\s*bike)\b/i,
        TrailRun: /\b(trail\s*run|trail-run|trailrun)\b/i,
        Ride: /\b(ride|rode|riding|cycle|cycling|cycled|bike|biked|biking|spin)\b/i,
        Run: /\b(run|ran|running|jog|jogged|jogging)\b/i,
        Walk: /\b(walk|walked|walking|stroll|strolling)\b/i,
        Hike: /\b(hike|hiked|hiking|trek|trekking)\b/i,
        Swim: /\b(swim|swam|swimming)\b/i,
        Workout: /\b(workout|strength\s*training|gym)\b/i,
        Yoga: /\b(yoga)\b/i
    };

    function matchActivityType(rawType) {
        const normalized = normalizeTypeLabel(rawType);
        if (!normalized) return null;

        const exact = TYPE_LABEL_METADATA.find(t => t.normalized === normalized);
        if (exact) return exact;

        const condensed = condenseTypeLabel(rawType);
        const compactMatch = TYPE_LABEL_METADATA.find(t => t.condensed === condensed);
        if (compactMatch) return compactMatch;

        const partialMatches = TYPE_LABEL_METADATA
            .filter(t => normalized.includes(t.normalized))
            .sort((a, b) => b.normalized.length - a.normalized.length);

        if (partialMatches[0]) return partialMatches[0];

        return matchTypeBySynonym(rawType);
    }

    function matchTypeBySynonym(rawType = '') {
        if (!rawType) return null;
        for (const [key, regex] of Object.entries(TYPE_SYNONYMS)) {
            if (regex.test(rawType)) {
                return TYPE_LABEL_METADATA.find(t => t.key === key) || null;
            }
        }
        return null;
    }

    function collectActivityTypeCandidates(activity) {
        const texts = new Set();
        const push = (txt) => {
            if (!txt) return;
            const value = txt.trim();
            if (value) texts.add(value);
        };

        push(activity.querySelector('svg[data-testid="activity-icon"] title, svg[data-testid="activity_icon"] title')?.textContent);
        const icon = activity.querySelector('svg[data-testid="activity-icon"], svg[data-testid="activity_icon"]');
        if (icon) {
            push(icon.getAttribute('aria-label'));
            push(icon.getAttribute('title'));
        }
        push(activity.querySelector('[data-testid="tag"]')?.textContent);
        push(activity.querySelector('.entry-head, .activity-type')?.textContent);
        push(activity.querySelector('[data-testid="entry-header"] button')?.textContent);
        push(activity.querySelector('[data-testid="entry-header"]')?.textContent);
        push(activity.querySelector('[data-testid="activity_name"]')?.textContent);
        push(activity.getAttribute('data-activity-type'));

        return Array.from(texts);
    }

    function resolveActivityType(activity) {
        const candidates = collectActivityTypeCandidates(activity);
        for (const candidate of candidates) {
            const match = matchActivityType(candidate);
            if (match) {
                return { match, raw: candidate };
            }
        }
        return { match: null, raw: candidates[0] || '' };
    }



    // CSS Module - Step 1 of modular refactoring
    function injectStyles() {
        GM_addStyle(`
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
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
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
        padding: 3px 6px !important;
        margin-left: 6px !important;
      }

      .sff-clean-btn .sff-btn-sub {
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
        width: 380px !important;
        min-width: 280px !important;
        max-width: 600px !important;
        min-height: 180px !important;
        max-height: 70vh !important;
        background: white !important;
        border: 2px solid #fc5200 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
        overflow: visible !important;
        display: none !important;
        visibility: visible !important;
        opacity: 1 !important;
        transition: none !important;
      }
      
      .sff-resize-handle {
        position: absolute !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 20px !important;
        height: 20px !important;
        cursor: ew-resize !important;
        z-index: 10 !important;
        background: linear-gradient(135deg, transparent 50%, #fc5200 50%) !important;
        border-radius: 0 0 6px 0 !important;
      }
      
      .sff-resize-handle:hover {
        background: linear-gradient(135deg, transparent 50%, #e04800 50%) !important;
      }
      
      .sff-resize-handle-left {
        position: absolute !important;
        left: 0 !important;
        bottom: 0 !important;
        width: 20px !important;
        height: 20px !important;
        cursor: ew-resize !important;
        z-index: 10 !important;
        background: linear-gradient(225deg, transparent 50%, #fc5200 50%) !important;
        border-radius: 0 0 0 6px !important;
      }
      
      .sff-resize-handle-left:hover {
        background: linear-gradient(225deg, transparent 50%, #e04800 50%) !important;
      }
      
      @media (max-width: 768px) {
        .sff-clean-panel {
          width: 320px !important;
        }
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
        font-size: 14px !important;
        user-select: none !important;
        color: white !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
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

      .sff-toggle-section {
        display: flex !important;
        align-items: center !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid #eee !important;
        background: #f8f9fa !important;
      }

      .sff-switch {
        position: relative !important;
        display: inline-block !important;
        width: 34px !important;
        height: 20px !important;
        margin-right: 10px !important;
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
        grid-template-columns: repeat(auto-fill, minmax(max(80px, calc((100% - 24px) / 4)), 1fr)) !important;
        gap: 4px 8px !important; /* Increased gap */
        margin-top: 3px !important;
      }
      
      @media (max-width: 400px) {
        .sff-types {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }

      .sff-clean-panel .sff-chip {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
        font-weight: 400 !important;
        font-size: 14px !important; /* Increased for readability */
        display: flex !important;
        align-items: flex-start !important;
        padding: 4px 0 !important;
        border: none !important;
        border-radius: 0 !important;
        line-height: 1.3 !important;
        background: transparent !important;
        cursor: pointer !important;
        transition: none !important;
        user-select: none !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
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
        margin-right: 6px !important;
        margin-left: 0 !important;
        margin-top: 2px !important;
        transform: scale(0.85) !important;
        flex-shrink: 0 !important;
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
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        line-height: 1.2 !important;
        transition: background-color 0.15s ease !important;
      }

      .sff-header-kudos-btn:hover {
        background: #e04a00 !important;
      }

      .sff-see-more-btn {
        padding: 4px 10px !important;
        font-size: 11px !important;
        background: #fc5200 !important;
        color: white !important;
        border: none !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        font-weight: 600 !important;
        transition: background-color 0.15s ease !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
        line-height: 1.2 !important;
      }

      .sff-see-more-btn:hover {
        background: #e04a00 !important;
      }

      .sff-see-more-btn:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
      }

      .sff-expanded-stats {
        background: #f8f9fa !important;
        border: 1px solid #e1e4e8 !important;
        border-radius: 6px !important;
        padding: 16px !important;
        margin: 12px 0 !important;
        animation: sff-slide-down 0.3s ease-out !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      @keyframes sff-slide-down {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .sff-stats-section-header {
        font-size: 13px !important;
        font-weight: 700 !important;
        color: #242428 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        margin: 20px 0 12px 0 !important;
        padding-bottom: 8px !important;
        border-bottom: 2px solid #fc5200 !important;
      }

      .sff-stats-grid {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
        gap: 16px 12px !important;
      }

      .sff-stat-item {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
      }

      .sff-stat-label {
        font-size: 15px !important;
        color: #242428 !important;
        font-weight: 700 !important;
        line-height: 1.3 !important;
        margin-bottom: 4px !important;
      }

      .sff-stat-value {
        font-size: 13px !important;
        color: #666 !important;
        font-weight: 400 !important;
        line-height: 1.3 !important;
      }

      .sff-stat-subvalue {
        font-size: 13px !important;
        color: #666 !important;
        font-weight: 400 !important;
        margin-top: 2px !important;
        line-height: 1.3 !important;
      }
      
      .sff-expanded-stats .sff-stat-value span.sff-stat-prefix,
      .sff-expanded-stats .sff-stat-subvalue span.sff-stat-prefix {
        font-weight: 700 !important;
      }

      .sff-no-stats {
        color: #666 !important;
        font-size: 13px !important;
        font-style: italic !important;
        margin: 0 !important;
      }

      @media (max-width: 768px) {
        .sff-stats-grid {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
        }
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

      .sff-footer {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-top: 12px !important;
        padding: 8px 12px !important;
        background: #f8f9fa !important;
        border: 1px solid #e9ecef !important;
        border-radius: 6px !important;
        gap: 8px !important;
      }

      .sff-credits {
        text-align: left !important;
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
        border: none !important;
        border-radius: 0 !important;
        font-size: 11px !important;
        color: #666 !important;
        flex: 1 !important;
      }

      .sff-credits p {
        margin: 0 !important;
        line-height: 1.3 !important;
      }

      .sff-credits p:first-child {
        font-weight: 600 !important;
        color: #333 !important;
      }

      .sff-credits a {
        color: #fc5200 !important;
        text-decoration: none !important;
        font-weight: 700 !important;
        transition: color 0.2s ease !important;
      }

      .sff-credits a:hover {
        color: #e04a00 !important;
        text-decoration: underline !important;
      }

      .sff-bmc {
        text-align: right !important;
        margin: 0 !important;
        padding: 0 !important;
        border-top: none !important;
        flex-shrink: 0 !important;
      }

      .sff-bmc a {
        display: inline-block !important;
        padding: 8px 16px !important;
        background: #FC5200 !important;
        color: #fff !important;
        text-decoration: none !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        transition: all 0.2s !important;
      }

      .sff-bmc a:hover {
        background: #e04a00 !important;
      }

      .sff-copyright {
        text-align: center !important;
        margin-top: 6px !important;
        padding-top: 6px !important;
        border-top: 1px solid #eee !important;
        font-size: 9px !important;
        color: #aaa !important;
      }

      .sff-copyright p {
        margin: 0 !important;
        line-height: 1.2 !important;
      }

      /* Secondary navigation row for smaller screens */
      .sff-secondary-nav {
        position: fixed !important;
        top: 55px !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 10 !important;
        background: white !important;
        border-bottom: 1px solid #e5e5e5 !important;
        padding: 8px 16px !important;
        display: none !important;
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 12px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
      }

      /* Show secondary nav on smaller screens ONLY on dashboard */
      @media (max-width: 1479px) {
        body[data-sff-dashboard="true"] .sff-secondary-nav {
          display: flex !important;
        }

        /* Hide main filter button on smaller screens ONLY on dashboard */
        body[data-sff-dashboard="true"] .sff-clean-btn {
          display: none !important;
        }

        /* Hide main header kudos button on smaller screens ONLY on dashboard */
        body[data-sff-dashboard="true"] #gj-kudos-li {
          display: none !important;
        }

        /* Adjust page content to account for secondary nav ONLY on dashboard */
        body[data-sff-dashboard="true"] {
          padding-top: 60px !important;
        }

        /* Additional margin for main content area to ensure no overlap */
        body[data-sff-dashboard="true"] main,
        body[data-sff-dashboard="true"] .view {
          margin-top: 8px !important;
        }
      }

      /* Secondary nav filter button */
      .sff-secondary-filter-btn {
        padding: 6px 12px !important;
        background: #fc5200 !important;
        color: white !important;
        border: 1px solid transparent !important;
        cursor: pointer !important;
        font-weight: 700 !important;
        border-radius: 4px !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
        text-align: center !important;
        transition: background-color 0.15s ease !important;
        font-size: 14px !important;
        line-height: 1.2 !important;
        text-transform: uppercase !important;
        position: relative !important;
        z-index: 1000 !important;
      }

      .sff-secondary-filter-btn:hover {
        background: #e04a00 !important;
      }

      .sff-secondary-filter-btn .sff-btn-sub {
        font-weight: 500 !important;
        text-transform: uppercase !important;
        color: white !important;
        opacity: 1 !important;
        line-height: 1 !important;
      }

      /* Secondary nav kudos button */
      .sff-secondary-kudos-btn {
        padding: 6px 12px !important;
        background: #fc5200 !important;
        color: white !important;
        border: 1px solid transparent !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        text-decoration: none !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        line-height: 1.2 !important;
        transition: background-color 0.15s ease !important;
        position: relative !important;
        z-index: 1000 !important;
      }

      .sff-secondary-kudos-btn:hover {
        background: #e04a00 !important;
      }

      /* Settings View Styles */
      .sff-settings-toggle {
        background: none !important;
        border: none !important;
        cursor: pointer !important;
        font-size: 18px !important;
        padding: 4px !important;
        margin-left: auto !important; /* Pushes it to the right of flex container */
        opacity: 0.8 !important;
        transition: opacity 0.2s !important;
        color: #666 !important; /* Updated to match gray theme of toggle section */
        line-height: 1 !important;
      }
      .sff-settings-toggle:hover {
        opacity: 1 !important;
      }
      
      .sff-view-settings {
        display: none;
        padding: 16px;
      }
      .sff-view-settings.active {
        display: block !important;
      }
      .sff-view-filters.hidden {
        display: none !important;
      }
      
      .sff-settings-btn {
        width: 100% !important;
        padding: 12px !important;
        margin-bottom: 12px !important;
        background: #f8f9fa !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-weight: 600 !important;
        text-align: center !important;
        color: #333 !important;
        font-size: 14px !important;
        transition: background-color 0.2s !important;
      }
      .sff-settings-btn:hover {
        background: #e9ecef !important;
      }
      .sff-settings-btn.danger {
        color: #dc3545 !important;
        border-color: #dc3545 !important;
        background: #fff !important;
      }
      .sff-settings-btn.danger:hover {
        background: #dc3545 !important;
        color: white !important;
      }
      
      .sff-file-input {
        display: none !important;
      }
      
      .sff-settings-desc {
        font-size: 13px !important;
        color: #666 !important;
        margin-bottom: 20px !important;
        line-height: 1.4 !important;
      }

      .sff-toast {
        position: absolute !important;
        bottom: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(20px) !important;
        background: #333 !important;
        color: white !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        font-size: 13px !important;
        opacity: 0 !important;
        visibility: hidden !important;
        transition: all 0.3s ease !important;
        z-index: 100 !important;
        white-space: nowrap !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      }
      .sff-toast.show {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateX(-50%) translateY(0) !important;
      }
      .sff-toast.error {
        background: #dc3545 !important;
      }

      /* Notification Bell Icon - Orange Outline Style */
      .sff-notification-bell {
        display: none;
        padding: 0 !important;
        background: white !important;
        color: #fc5200 !important;
        border: 1px solid #fc5200 !important;
        cursor: pointer !important;
        font-weight: 700 !important;
        border-radius: 4px !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif !important;
        text-align: center !important;
        transition: all 0.15s ease !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
        font-size: 14px !important;
        position: relative !important;
        z-index: 1000 !important;
        width: 32px !important;
        height: 32px !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }

      @media (max-width: 990px) {
        .sff-notification-bell {
          display: inline-flex;
        }
      }

      .sff-notification-bell:hover {
        background: rgba(252, 82, 0, 0.05) !important;
        border-color: #e04a00 !important;
      }

      .sff-notification-bell svg {
        width: 18px !important;
        height: 18px !important;
      }
      
      .sff-notification-bell svg path {
        fill: #fc5200 !important;
      }

      .sff-notification-badge {
        position: absolute !important;
        top: -6px !important;
        right: -6px !important;
        min-width: 18px !important;
        height: 18px !important;
        background: #dc3545 !important;
        color: white !important;
        border-radius: 9px !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 5px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        border: 2px solid white !important;
      }
      
      .sff-notification-bell .sff-notification-badge.show {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* Notification Dropdown - Strava Style */
      .sff-notification-overlay {
        position: fixed !important;
        top: 56px !important;
        right: 10px !important;
        width: 420px !important;
        max-width: calc(100vw - 20px) !important;
        max-height: 600px !important;
        background: white !important;
        z-index: 2147483644 !important;
        overflow: hidden !important;
        display: none !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
      }

      .sff-notification-overlay.show {
        display: flex !important;
        flex-direction: column !important;
      }

      .sff-notification-list-container {
        padding: 0 !important;
        margin: 0 !important;
        overflow-y: auto !important;
        max-height: 540px !important;
      }

      .sff-notification-item {
        display: flex !important;
        align-items: flex-start !important;
        padding: 16px 20px !important;
        border-bottom: 1px solid #e5e5e5 !important;
        background: white !important;
        text-decoration: none !important;
        color: #333 !important;
        transition: background-color 0.15s ease !important;
        cursor: pointer !important;
      }

      .sff-notification-item:last-child {
        border-bottom: none !important;
      }

      .sff-notification-item:hover {
        background: #f7f7f7 !important;
      }

      .sff-notification-item.notification-unread {
        background: #fef9f5 !important;
      }

      .sff-notification-item.notification-unread:hover {
        background: #fef5ed !important;
      }

      .sff-notification-icon {
        width: 44px !important;
        height: 44px !important;
        border-radius: 50% !important;
        margin-right: 12px !important;
        object-fit: cover !important;
        flex-shrink: 0 !important;
      }

      .sff-notification-content {
        flex: 1 !important;
        min-width: 0 !important;
      }

      .sff-notification-content h4 {
        margin: 0 0 2px 0 !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        line-height: 1.4 !important;
        color: #242428 !important;
      }

      .sff-notification-content p {
        margin: 0 0 4px 0 !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        color: #606060 !important;
      }

      .sff-notification-content p strong {
        font-weight: 600 !important;
        color: #242428 !important;
      }

      .sff-notification-date {
        font-size: 12px !important;
        color: #999 !important;
        margin-top: 2px !important;
        display: block !important;
      }

      .sff-notification-loading {
        padding: 40px 20px !important;
        text-align: center !important;
        color: #666 !important;
        font-size: 14px !important;
      }

      .sff-notification-error {
        padding: 20px !important;
        text-align: center !important;
        color: #dc3545 !important;
        font-size: 14px !important;
      }

      .sff-notification-empty {
        padding: 40px 20px !important;
        text-align: center !important;
        color: #999 !important;
        font-size: 14px !important;
      }

      /* Responsive adjustments for notification dropdown */
      @media (max-width: 1479px) {
        .sff-notification-overlay {
          top: 110px !important;
          right: 10px !important;
        }
      }

      @media (max-width: 760px) {
        .sff-notification-overlay {
          width: calc(100vw - 20px) !important;
          max-width: 420px !important;
          left: 10px !important;
          right: auto !important;
        }
      }
        `);
    }

    // Initialize CSS Module
    injectStyles();

    // Utilities Module - Step 2 of modular refactoring
    const UtilsModule = {
        // Settings management
        async loadSettings() {
            const s = await Storage.get(STORAGE_KEY, DEFAULTS);
            const merged = { ...DEFAULTS, ...(s || {}) };
            // Migration: convert stored zeros to empty strings so placeholders show
            const numKeys = ['minKm','maxKm','minMins','maxMins','minElevM','maxElevM','minPace','maxPace'];
            for (const k of numKeys) {
                if (merged[k] === 0 || merged[k] === '0') merged[k] = '';
            }

            // Migration: derive seeMoreButtonMode from legacy boolean if not set
            if (!merged.seeMoreButtonMode) {
                if (merged.showSeeMoreButton === false) {
                    merged.seeMoreButtonMode = 'never';
                } else {
                    merged.seeMoreButtonMode = 'always';
                }
            }

            return merged;
        },

        async saveSettings(s) {
            try {
                await Storage.set(STORAGE_KEY, s);
            } catch(e) {
                console.error('Error saving settings:', e);
            }
        },

        // Debounce helper
        debounce(fn, wait) {
            let t;
            return function(...args) {
                clearTimeout(t);
                t = setTimeout(() => fn.apply(this, args), wait);
            };
        },

        // Page detection
        isOnDashboard() {
            return window.location.pathname === '/dashboard' || window.location.pathname === '/';
        },

        // Data parsing utilities
        parseDurationSeconds(activityEl) {
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
        },

        parseDistanceKm(activityEl) {
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
        },

        parseElevationM(activityEl) {
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
    };

    // UI Module - Step 3 of modular refactoring
    const UIModule = {
        updateActivityCount(panel) {
            const countEl = panel.querySelector('.sff-activity-count');
            if (!countEl) return;

            const total = TYPES.length;
            const hidden = panel.querySelectorAll('.sff-types input[type="checkbox"]:checked').length;
            countEl.textContent = `(${hidden} hidden / ${total} total)`;
        },

        updateFilterLabels(panel, unitSystem) {
            const isMetric = unitSystem === 'metric';
            panel.querySelector('[data-label-type="distance"]').textContent = `Distance (${isMetric ? 'km' : 'mi'}):`;
            panel.querySelector('[data-label-type="elevation"]').textContent = `Elevation Gain (${isMetric ? 'm' : 'ft'}):`;
            panel.querySelector('[data-label-type="pace"]').textContent = `Pace for Runs (${isMetric ? 'min/km' : 'min/mi'}):`;
        },

        showToast(panel, message, type = 'success') {
            const toast = panel.querySelector('.sff-toast');
            if (!toast) return;
            
            toast.textContent = message;
            toast.className = `sff-toast ${type} show`;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        },

        applySettings(panel) {
            settings.keywords = panel.querySelector('.sff-keywords').value
                .split(',')
                .map(x => x.trim())
                .filter(Boolean);

            settings.allowedAthletes = panel.querySelector('.sff-allowed-athletes').value
                .split(',')
                .map(x => x.trim())
                .filter(Boolean);

            settings.ignoredAthletes = panel.querySelector('.sff-ignored-athletes').value
                .split(',')
                .map(x => x.trim())
                .filter(Boolean);

            const getNumOrEmpty = (selector) => {
                const v = panel.querySelector(selector).value.trim();
                return v === '' ? '' : +v;
            };

            settings.minKm = getNumOrEmpty('.sff-minKm');
            settings.maxKm = getNumOrEmpty('.sff-maxKm');
            settings.minMins = getNumOrEmpty('.sff-minMins');
            settings.maxMins = getNumOrEmpty('.sff-maxMins');
            settings.minElevM = getNumOrEmpty('.sff-minElevM');
            settings.maxElevM = getNumOrEmpty('.sff-maxElevM');
            settings.minPace = getNumOrEmpty('.sff-minPace');
            settings.maxPace = getNumOrEmpty('.sff-maxPace');
            settings.unitSystem = panel.querySelector('.sff-unit-btn.active').dataset.unit;
            settings.hideNoMap = panel.querySelector('.sff-hideNoMap').checked;
            settings.hideClubPosts = panel.querySelector('.sff-hideClubPosts').checked;
            settings.hideChallenges = panel.querySelector('.sff-hideChallenges').checked;
            settings.hideJoinedChallenges = panel.querySelector('.sff-hideJoinedChallenges') ? panel.querySelector('.sff-hideJoinedChallenges').checked : settings.hideJoinedChallenges;
            settings.hideSuggestedFriends = panel.querySelector('.sff-hideSuggestedFriends').checked;
            settings.hideYourClubs = panel.querySelector('.sff-hideYourClubs').checked;
            settings.hideMyWindsock = panel.querySelector('.sff-hideMyWindsock').checked;
            settings.hideSummitbag = panel.querySelector('.sff-hideSummitbag').checked;
            settings.hideRunHealth = panel.querySelector('.sff-hideRunHealth').checked;
            settings.hideWandrer = panel.querySelector('.sff-hideWandrer') ? panel.querySelector('.sff-hideWandrer').checked : settings.hideWandrer;
            settings.hideBandok = panel.querySelector('.sff-hideBandok') ? panel.querySelector('.sff-hideBandok').checked : settings.hideBandok;
            settings.hideCoros = panel.querySelector('.sff-hideCoros') ? panel.querySelector('.sff-hideCoros').checked : settings.hideCoros;
            settings.hideJoinWorkout = panel.querySelector('.sff-hideJoinWorkout') ? panel.querySelector('.sff-hideJoinWorkout').checked : settings.hideJoinWorkout;
            settings.hideCoachCat = panel.querySelector('.sff-hideCoachCat') ? panel.querySelector('.sff-hideCoachCat').checked : settings.hideCoachCat;
            settings.hideFooter = panel.querySelector('.sff-hideFooter') ? panel.querySelector('.sff-hideFooter').checked : settings.hideFooter;
            settings.hideAthleteJoinedClub = panel.querySelector('.sff-hideAthleteJoinedClub') ? panel.querySelector('.sff-hideAthleteJoinedClub').checked : settings.hideAthleteJoinedClub;
            const giftChk = panel.querySelector('.sff-hideGift');
            settings.hideGiveGift = giftChk ? giftChk.checked : settings.hideGiveGift;
            const startTrialChk = panel.querySelector('.sff-hideStartTrial');
            settings.hideStartTrial = startTrialChk ? startTrialChk.checked : settings.hideStartTrial;
            const kudosBtn = panel.querySelector('.sff-showKudosButton');
            settings.showKudosButton = kudosBtn ? kudosBtn.checked : settings.showKudosButton;
            const notifBell = panel.querySelector('.sff-showNotifications');
            settings.showNotifications = notifBell ? notifBell.checked : settings.showNotifications;

            settings.types = {};
            panel.querySelectorAll('input[type=checkbox][data-typ]').forEach(input => {
                settings.types[input.dataset.typ] = input.checked;
            });

            // Persist current see-more mode from the select, if present
            const modeSelect = panel.querySelector('.sff-seeMoreMode');
            if (modeSelect) {
                const value = modeSelect.value;
                if (value === 'always' || value === 'smallOnly' || value === 'never') {
                    settings.seeMoreButtonMode = value;
                } else {
                    settings.seeMoreButtonMode = 'always';
                }
                // Maintain legacy boolean for compatibility
                settings.showSeeMoreButton = settings.seeMoreButtonMode !== 'never';
            }

            UtilsModule.saveSettings(settings);
            console.log('💾 Settings saved:', settings);
        },

        createElements() {
            // Creating UI elements

            // Remove existing
            document.querySelectorAll('.sff-clean-btn, .sff-clean-panel, .sff-secondary-nav').forEach(el => el.remove());

            // Only create elements on dashboard
            const isDashboardPage = UtilsModule.isOnDashboard();

            // Set dashboard attribute for CSS targeting
            if (isDashboardPage) {
                document.body.setAttribute('data-sff-dashboard', 'true');
            } else {
                document.body.removeAttribute('data-sff-dashboard');
                // On non-dashboard pages, apply global and embed settings
                LogicModule.updateGiftVisibility();
                LogicModule.updateStartTrialVisibility();
                LogicModule.updateChallengesVisibility();
                LogicModule.updateSuggestedFriendsVisibility();
                LogicModule.updateYourClubsVisibility();
                LogicModule.updateMyWindsockVisibility();
                LogicModule.updateSummitbagVisibility();
                LogicModule.updateRunHealthVisibility();
                LogicModule.updateBandokVisibility();
                LogicModule.updateCorosVisibility();
                LogicModule.updateJoinWorkoutVisibility();
                LogicModule.updateCoachCatVisibility();
                LogicModule.updateAthleteJoinedClubVisibility();
                return; // Exit early, no UI elements needed on non-dashboard pages
            }

            // Create secondary navigation row
            const secondaryNav = document.createElement('div');
            secondaryNav.className = 'sff-secondary-nav';

            // Create secondary filter button
            const secondaryFilterElement = document.createElement('button');
            secondaryFilterElement.className = 'sff-secondary-filter-btn';
            secondaryFilterElement.innerHTML = 'Filter <span class="sff-btn-sub">(0)</span>';

            // Create secondary kudos button (will be shown/hidden based on settings)
            const secondaryKudosElement = document.createElement('a');
            secondaryKudosElement.className = 'sff-secondary-kudos-btn';
            secondaryKudosElement.href = 'javascript:void(0);';
            secondaryKudosElement.textContent = 'Give 👍 to Everyone';
            // Use setProperty with !important to override CSS rules
            secondaryKudosElement.style.setProperty('display', settings.showKudosButton ? 'inline-flex' : 'none', 'important');

            // Create notification bell with new JSON endpoint approach
            const notificationBell = this._createNotificationBell();
            
            secondaryNav.appendChild(secondaryKudosElement);
            secondaryNav.appendChild(notificationBell);
            secondaryNav.appendChild(secondaryFilterElement);
            document.body.appendChild(secondaryNav);

            this.syncSecondaryKudosVisibility();
            this.toggleNotificationBell(); // Set initial visibility based on settings

            // Create button
            const btn = document.createElement('button');
            btn.className = 'sff-clean-btn';
            btn.innerHTML = '<span class="sff-btn-title">Filter <span class="sff-btn-sub">(0)</span></span>';
            btn.style.position = 'fixed';
            btn.style.top = '10px';
            btn.style.right = '10px';
            btn.style.zIndex = '2147483647';

            // Create panel using helper method
            const panel = this._createPanel();

            document.body.appendChild(btn);
            document.body.appendChild(panel);

            // UI elements added

            // Get secondary elements (we're only on dashboard at this point)
            const secondaryFilterBtn = document.querySelector('.sff-secondary-filter-btn');
            const secondaryKudosBtn = document.querySelector('.sff-secondary-kudos-btn');

            this.setupEvents(btn, panel, secondaryFilterBtn, secondaryKudosBtn);
            return { btn, panel, secondaryFilterBtn, secondaryKudosBtn };
        },

        // Synchronize secondary kudos button visibility with settings
        syncSecondaryKudosVisibility() {
            const secondaryKudosBtn = document.querySelector('.sff-secondary-kudos-btn');
            if (secondaryKudosBtn) {
                const shouldShow = settings.enabled && settings.showKudosButton;
                // Use setProperty with !important to override CSS rules
                secondaryKudosBtn.style.setProperty('display', shouldShow ? 'inline-flex' : 'none', 'important');
                // Kudos button visibility updated
            }
        },

        // Toggle notification bell visibility
        toggleNotificationBell() {
            const notificationBell = document.querySelector('.sff-notification-bell');
            if (notificationBell) {
                const shouldShow = settings.enabled && settings.showNotifications;
                // Remove inline style to let CSS media query control visibility based on viewport
                if (shouldShow) {
                    notificationBell.style.removeProperty('display');
                } else {
                    notificationBell.style.setProperty('display', 'none', 'important');
                }
                // Also hide/show the overlay if it's open
                const overlay = document.querySelector('.sff-notification-overlay');
                if (overlay && !shouldShow) {
                    overlay.classList.remove('show');
                }
            }
        },

        _createPanel() {
            const panel = document.createElement('div');
            panel.className = 'sff-clean-panel';

            // Set initial styles - ensure it's hidden by default
            panel.style.position = 'fixed';
            panel.style.display = 'none';
            panel.style.visibility = 'hidden';
            panel.style.opacity = '0';
            panel.style.zIndex = '2147483646';
            panel.style.right = '10px';
            panel.style.top = '60px';
            panel.style.transition = 'opacity 0.2s ease, visibility 0.2s';

            // Load position (async from extension storage)
            Storage.get('sffPanelPos', {}).then((savedPos) => {
                if (savedPos && (savedPos.left || savedPos.top)) {
                    panel.style.left = savedPos.left || '';
                    panel.style.right = savedPos.left ? 'auto' : '10px';
                    panel.style.top = savedPos.top || '60px';
                }
            });

            // Build panel content sections
            const header = this._createPanelHeader();
            const content = this._createPanelContent();
            const resizeHandleRight = this._createResizeHandle('right');
            const resizeHandleLeft = this._createResizeHandle('left');

            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(resizeHandleRight);
            panel.appendChild(resizeHandleLeft);

            return panel;
        },

        _createPanelHeader() {
            const header = document.createElement('div');
            header.className = 'sff-panel-header';
            header.innerHTML = `
                <div class="sff-header-main">
                    <h3>Strava Feed Filter</h3>
                </div>
                <button class="sff-close">×</button>
            `;
            return header;
        },

        _createPanelContent() {
            const content = document.createElement('div');
            content.className = 'sff-panel-content';
            content.innerHTML = this._getPanelHTML();
            return content;
        },

        _createResizeHandle(side = 'right') {
            const handle = document.createElement('div');
            handle.className = side === 'left' ? 'sff-resize-handle-left' : 'sff-resize-handle';
            handle.title = 'Drag to resize';
            handle.dataset.side = side;
            return handle;
        },

        _createNotificationBell() {
            console.log('🔔 Creating notification bell with JSON endpoint');
            
            const button = document.createElement('button');
            button.className = 'sff-notification-bell';
            button.title = 'Notifications';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                <span class="sff-notification-badge">0</span>
            `;

            const overlay = document.createElement('div');
            overlay.className = 'sff-notification-overlay';
            overlay.innerHTML = `
                <div class="sff-notification-list-container">
                    <div class="sff-notification-loading">Loading notifications...</div>
                </div>
            `;

            document.body.appendChild(button);
            document.body.appendChild(overlay);

            // Setup click handlers
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openNotificationOverlay(button, overlay);
            });


            // Close overlay when clicking outside
            document.addEventListener('click', (e) => {
                if (!button.contains(e.target) && !overlay.contains(e.target)) {
                    this.closeNotificationOverlay(overlay);
                }
            });

            // Initial fetch to update badge
            this.updateNotificationBadge(button);

            return button;
        },

        openNotificationOverlay(button, overlay) {
            const isOpen = overlay.classList.contains('show');
            if (isOpen) {
                this.closeNotificationOverlay(overlay);
            } else {
                overlay.classList.add('show');
                this.fetchAndRenderNotifications(button, overlay);
                
                // Mark all notifications as read when opening (like Strava does)
                this.markAllNotificationsAsRead(button);
            }
        },

        closeNotificationOverlay(overlay) {
            overlay.classList.remove('show');
        },
        
        async markAllNotificationsAsRead(button) {
            try {
                console.log('📬 Marking all notifications as read...');
                
                // Get CSRF token from meta tag
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (!csrfToken) {
                    console.warn('⚠️ No CSRF token found');
                    return;
                }
                
                // Use Strava's actual endpoint
                const response = await fetch('/frontend/athlete/notifications/mark_all_read', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-Token': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Mark-all-read response status:', response.status);
                
                if (response.ok) {
                    console.log('✅ All notifications marked as read');
                    // Update badge to show 0
                    const badge = button.querySelector('.sff-notification-badge');
                    if (badge) {
                        badge.textContent = '0';
                        badge.classList.remove('show');
                    }
                    button.title = 'Notifications';
                } else {
                    console.warn('⚠️ Failed to mark all as read:', response.status);
                    const text = await response.text();
                    console.warn('Response:', text.substring(0, 200));
                }
            } catch (error) {
                console.error('❌ Error marking all as read:', error);
            }
        },
        
        formatNotificationTime(displayDate) {
            // If it's a relative time like "2h ago", "Yesterday", etc., return as-is
            if (!displayDate.includes('at') && !displayDate.includes('AM') && !displayDate.includes('PM')) {
                return displayDate;
            }
            
            // Try to parse times with AM/PM format
            const timeMatch = displayDate.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                const period = timeMatch[3].toUpperCase();
                
                // Convert to 24-hour format
                if (period === 'PM' && hours !== 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }
                
                // Format according to user's locale
                const date = new Date();
                date.setHours(hours, parseInt(minutes), 0);
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Replace the time in the original string
                return displayDate.replace(/\d{1,2}:\d{2}\s*(AM|PM)/i, timeString);
            }
            
            return displayDate;
        },

        async updateNotificationBadge(button) {
            try {
                const response = await fetch('/frontend/athlete/notifications', {
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    console.warn('⚠️ Failed to fetch notifications for badge:', response.status);
                    return;
                }
                
                const data = await response.json();
                console.log('✅ Badge data received:', data.length, 'notifications');
                
                // More robust unread check - handle both boolean and string values
                const unreadCount = data.filter(item => item.read === false || item.read === 'false' || !item.read).length;
                console.log('📊 Unread count:', unreadCount);
                
                const badge = button.querySelector('.sff-notification-badge');
                if (badge) {
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    console.log('🔴 Setting badge text to:', badge.textContent);
                    if (unreadCount > 0) {
                        badge.classList.add('show');
                        console.log('🔴 Badge should now be visible');
                    } else {
                        badge.classList.remove('show');
                        console.log('⚪ Badge hidden (no unread)');
                    }  
                } else {
                    console.error('❌ Badge element not found!');
                }
                
                button.title = unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications';
            } catch (error) {
                console.error('❌ Error updating notification badge:', error);
            }
        },

        async fetchAndRenderNotifications(button, overlay) {
            const listContainer = overlay.querySelector('.sff-notification-list-container');
            const badge = button.querySelector('.sff-notification-badge');
            
            // Show loading state
            listContainer.innerHTML = '<div class="sff-notification-loading">Loading notifications...</div>';
            
            try {
                console.log('📡 Fetching notifications from: /frontend/athlete/notifications');
                
                const response = await fetch('/frontend/athlete/notifications', {
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                console.log('📡 Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Response error:', errorText.substring(0, 500));
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                console.log('📡 Content-Type:', contentType);
                
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('❌ Not JSON response:', text.substring(0, 200));
                    throw new Error('Response is not JSON');
                }
                
                const data = await response.json();
                console.log(`✅ Fetched ${data.length} notifications`);
                console.log('📋 Sample notification:', data[0]);
                
                if (data.length === 0) {
                    listContainer.innerHTML = '<div class="sff-notification-empty">No notifications</div>';
                    return;
                }
                
                // Count unread - more robust check
                const unreadCount = data.filter(item => item.read === false || item.read === 'false' || !item.read).length;
                console.log(`📊 Unread count: ${unreadCount}`);
                
                // Update badge
                if (badge) {
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    if (unreadCount > 0) {
                        badge.classList.add('show');
                    } else {
                        badge.classList.remove('show');
                    }
                }
                
                button.title = unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications';
                
                // Render notifications
                listContainer.innerHTML = '';
                
                data.forEach(item => {
                    const fullLink = `https://www.strava.com${item.actionable_link}`;
                    // More robust unread check
                    const isUnread = item.read === false || item.read === 'false' || !item.read;
                    const formattedTime = this.formatNotificationTime(item.display_date);
                    
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'sff-notification-item' + (isUnread ? ' notification-unread' : '');
                    itemDiv.innerHTML = `
                        <img src="${item.icon}" class="sff-notification-icon" alt="Notification icon">
                        <div class="sff-notification-content">
                            <h4>${item.title}</h4>
                            <p>${item.text}</p>
                            <span class="sff-notification-date">${formattedTime}</span>
                        </div>
                    `;
                    
                    // Make the entire item clickable
                    itemDiv.addEventListener('click', () => {
                        // Just navigate - notifications are already marked as read when overlay opened
                        window.location.href = fullLink;
                    });
                    
                    listContainer.appendChild(itemDiv);
                });
                
            } catch (error) {
                console.error('❌ Error fetching notifications:', error);
                console.error('❌ Error stack:', error.stack);
                listContainer.innerHTML = `
                    <div class="sff-notification-error">
                        Error loading notifications.<br>
                        ${error.message}<br>
                        <small>Check browser console for details</small>
                    </div>
                `;
            }
        },

        _getPanelHTML() {
            return `
                <div class="sff-toast"></div>
                <div class="sff-view-filters">
                    <div class="sff-toggle-section">
                        <label class="sff-switch">
                            <input type="checkbox" class="sff-enabled-toggle" ${settings.enabled ? 'checked' : ''}>
                            <span class="sff-slider"></span>
                        </label>
                        <span class="sff-label">
                            <span class="sff-toggle-text">FILTER ${settings.enabled ? 'ON' : 'OFF'}</span>
                        </span>
                        <button class="sff-settings-toggle" title="Settings" style="margin-left: auto; color: #666; font-size: 20px; border: none; background: none; cursor: pointer; padding: 4px; line-height: 1; opacity: 0.8; transition: opacity 0.2s;">⚙️</button>
                    </div>
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
                            <span class="sff-label">Ignore Athletes</span>
                            <div class="sff-dropdown-right">
                                <span class="sff-dropdown-indicator">▼</span>
                            </div>
                        </div>
                        <div class="sff-dropdown-content">
                            <textarea class="sff-input sff-ignored-athletes" placeholder="e.g. John Doe, Jane Smith">${settings.ignoredAthletes.join(', ')}</textarea>
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
                            <div class="sff-types-actions">
                                <button type="button" class="sff-types-select" data-action="select-all">Select All</button>
                                <button type="button" class="sff-types-select" data-action="clear-all">Clear All</button>
                            </div>
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
                                    <input type="number" class="sff-input sff-maxElevM" min="0" step="0.1" value="${settings.maxElevM}" placeholder="Max">
                                </div>
                            </div>
                            <div class="sff-row">
                                <label class="sff-label" data-label-type="pace">Pace for Runs (min/km):</label>
                                <div class="sff-input-group">
                                    <input type="number" class="sff-input sff-minPace" min="0" step="0.1" value="${settings.minPace}" placeholder="Min (Slowest)">
                                    <input type="number" class="sff-input sff-maxPace" min="0" step="0.1" value="${settings.maxPace}" placeholder="Max (Fastest)">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="sff-row sff-dropdown">
                        <div class="sff-dropdown-header">
                            <span class="sff-label">External Service Embeds</span>
                            <div class="sff-dropdown-right">
                                <span class="sff-dropdown-indicator">▼</span>
                            </div>
                        </div>
                        <div class="sff-dropdown-content">
                            <label class="sff-chip ${settings.hideMyWindsock ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideMyWindsock" ${settings.hideMyWindsock ? 'checked' : ''}>
                                Hide "myWindsock Report"
                            </label>
                            <label class="sff-chip ${settings.hideSummitbag ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideSummitbag" ${settings.hideSummitbag ? 'checked' : ''}>
                                Hide "summitbag.com"
                            </label>
                            <label class="sff-chip ${settings.hideRunHealth ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideRunHealth" ${settings.hideRunHealth ? 'checked' : ''}>
                                Hide "Run Health"
                            </label>
                            <label class="sff-chip ${settings.hideWandrer ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideWandrer" ${settings.hideWandrer ? 'checked' : ''}>
                                Hide "Wandrer" embeds
                            </label>
                            <label class="sff-chip ${settings.hideBandok ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideBandok" ${settings.hideBandok ? 'checked' : ''}>
                                Hide "Bandok.com"
                            </label>
                            <label class="sff-chip ${settings.hideCoros ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideCoros" ${settings.hideCoros ? 'checked' : ''}>
                                Hide "COROS"
                            </label>
                            <label class="sff-chip ${settings.hideJoinWorkout ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideJoinWorkout" ${settings.hideJoinWorkout ? 'checked' : ''}>
                                Hide "JOIN workout"
                            </label>
                            <label class="sff-chip ${settings.hideCoachCat ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideCoachCat" ${settings.hideCoachCat ? 'checked' : ''}>
                                Hide "CoachCat Training Summary"
                            </label>
                        </div>
                    </div>
                    <div class="sff-row sff-dropdown">
                        <div class="sff-dropdown-header">
                            <span class="sff-label">Sidebar</span>
                            <div class="sff-dropdown-right">
                                <span class="sff-dropdown-indicator">▼</span>
                            </div>
                        </div>
                        <div class="sff-dropdown-content">
                            <label class="sff-chip ${settings.hideChallenges ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideChallenges" ${settings.hideChallenges ? 'checked' : ''}>
                                Hide your challenges section
                            </label>
                            <label class="sff-chip ${settings.hideSuggestedFriends ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideSuggestedFriends" ${settings.hideSuggestedFriends ? 'checked' : ''}>
                                Hide "Suggested Friends" section
                            </label>
                            <label class="sff-chip ${settings.hideYourClubs ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideYourClubs" ${settings.hideYourClubs ? 'checked' : ''}>
                                Hide "Your Clubs" section
                            </label>
                            <label class="sff-chip ${settings.hideFooter ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideFooter" ${settings.hideFooter ? 'checked' : ''}>
                                Hide Strava footer
                            </label>
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
                            <label class="sff-chip ${settings.hideJoinedChallenges ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideJoinedChallenges" ${settings.hideJoinedChallenges ? 'checked' : ''}>
                                Hide "Athlete joined a challenge"
                            </label>
                            <label class="sff-chip ${settings.hideAthleteJoinedClub ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideAthleteJoinedClub" ${settings.hideAthleteJoinedClub ? 'checked' : ''}>
                                Hide "Athlete joined a club"
                            </label>
                            <label class="sff-chip ${settings.hideClubPosts ? 'checked' : ''}">
                                <input type="checkbox" class="sff-hideClubPosts" ${settings.hideClubPosts ? 'checked' : ''}>
                                Hide club posts
                            </label>
                        </div>
                    </div>
                    <div class="sff-buttons">
                        <button class="sff-btn-action sff-save">Apply & Refresh</button>
                    </div>
                    <div class="sff-footer">
                        <div class="sff-credits">
                            <p>Developed By: <a href="https://github.com/Inc21" target="_blank">Inc21</a></p>
                        </div>
                        <div class="sff-bmc">
                            <a href="https://www.buymeacoffee.com/inc21" target="_blank">☕ Buy me a coffee</a>
                        </div>
                    </div>
                    <div class="sff-copyright">
                        <p>Report a bug or dead filter: <a href="https://github.com/Inc21/Tempermonkey-Strava-Feed-Filter/issues" target="_blank">HERE</a></p>
                        <p id="sff-version" style="opacity: 0.7; margin-top: 5px;">Version</p>
                    </div>
                </div>

                <div class="sff-view-settings">
                    <button class="sff-back-btn" style="background: none; border: none; cursor: pointer; color: #fc5200; font-weight: 600; font-size: 14px; padding: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 4px;">
                        ← Back to Filters
                    </button>
                    <p class="sff-settings-desc">
                        Manage your Strava Feed Filter settings.
                    </p>
                    
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">Header Settings</h4>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="sff-chip ${settings.hideGiveGift ? 'checked' : ''}">
                            <input type="checkbox" class="sff-hideGift" ${settings.hideGiveGift ? 'checked' : ''}>
                            Hide "Give a Gift" button
                        </label>
                        <p class="sff-desc">Hides the orange "Give a Gift" button from the header navigation.</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="sff-chip ${settings.hideStartTrial ? 'checked' : ''}">
                            <input type="checkbox" class="sff-hideStartTrial" ${settings.hideStartTrial ? 'checked' : ''}>
                            Hide "Start Trial" button
                        </label>
                        <p class="sff-desc">Hides the orange "Start Trial" subscription button from the header navigation.</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="sff-chip ${settings.showKudosButton ? 'checked' : ''}">
                            <input type="checkbox" class="sff-showKudosButton" ${settings.showKudosButton ? 'checked' : ''}>
                            Show "Give 👍 to Everyone" button
                        </label>
                        <p class="sff-desc">Adds a button to the header to give kudos to all visible activities.</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="sff-chip ${settings.showNotifications ? 'checked' : ''}">
                            <input type="checkbox" class="sff-showNotifications" ${settings.showNotifications ? 'checked' : ''}>
                            Show notifications bell (mobile)
                        </label>
                        <p class="sff-desc">Displays a notification bell on mobile screens (≤990px) to view your Strava notifications.</p>
                    </div>
                    
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
                    
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">Activity Settings</h4>
                    
                    <div style="margin-bottom: 20px;">
                        <label class="sff-chip">
                            Show "Show more stats" button
                        </label>
                        <select class="sff-seeMoreMode" style="margin-left: 22px; padding: 4px 8px; font-size: 13px;">
                            <option value="always" ${settings.seeMoreButtonMode === 'always' ? 'selected' : ''}>Always show</option>
                            <option value="smallOnly" ${settings.seeMoreButtonMode === 'smallOnly' ? 'selected' : ''}>Only on small screens (≤ 990px)</option>
                            <option value="never" ${settings.seeMoreButtonMode === 'never' ? 'selected' : ''}>Never show</option>
                        </select>
                        <p class="sff-desc">Controls when the extra stats button appears on each activity.</p>
                    </div>
                    
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
                    
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">Backup & Restore</h4>
                    <p class="sff-settings-desc" style="margin-bottom: 12px;">
                        Export your configuration to back it up, or import a previously saved backup.
                    </p>
                    <button class="sff-settings-btn sff-action-export">Export Settings</button>
                    <button class="sff-settings-btn sff-action-import">Import Settings</button>
                    <input type="file" class="sff-file-input sff-file-import" accept=".json">
                    
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
                    
                    <button class="sff-settings-btn danger sff-action-reset">Reset to Defaults</button>
                </div>
            `;
        },

        setupEvents(btn, panel, secondaryFilterBtn, secondaryKudosBtn) {
            // Setting up event handlers

            // --- New Settings UI Events ---
            const settingsToggle = panel.querySelector('.sff-settings-toggle');
            const filtersView = panel.querySelector('.sff-view-filters');
            const settingsView = panel.querySelector('.sff-view-settings');
            
            if (settingsToggle) {
                settingsToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filtersView.classList.add('hidden');
                    settingsView.classList.add('active');
                    settingsToggle.style.opacity = '0';
                    settingsToggle.style.pointerEvents = 'none';
                });
            }

            const backBtn = panel.querySelector('.sff-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    settingsView.classList.remove('active');
                    filtersView.classList.remove('hidden');
                    if (settingsToggle) {
                        settingsToggle.style.opacity = '0.8';
                        settingsToggle.style.pointerEvents = 'auto';
                    }
                });
            }

            // Export Settings
            panel.querySelector('.sff-action-export').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent panel closing
                try {
                    const exportData = {
                        version: '2.3.2', 
                        exportDate: new Date().toISOString(),
                        settings: settings
                    };
                    
                    try {
                         // Try to get version from manifest if possible
                         if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getManifest) {
                             const manifest = browser.runtime.getManifest();
                             if (manifest && manifest.version) exportData.version = manifest.version;
                         }
                    } catch(e) {}

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const date = new Date().toISOString().split('T')[0];
                    a.href = url;
                    a.download = `strava-feed-filter-settings-${date}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    UIModule.showToast(panel, 'Settings exported successfully!', 'success');
                } catch(e) {
                    console.error('Export failed:', e);
                    UIModule.showToast(panel, 'Export failed. See console.', 'error');
                }
            });

            // Import Settings
            const fileInput = panel.querySelector('.sff-file-import');
            panel.querySelector('.sff-action-import').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent panel closing
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (ev) => {
                    try {
                        const imported = JSON.parse(ev.target.result);
                        let newSettings = imported.settings || imported;
                        
                        if (typeof newSettings !== 'object' || newSettings === null) {
                            throw new Error('Invalid settings format');
                        }

                        const merged = { ...DEFAULTS, ...newSettings };
                        
                        await UtilsModule.saveSettings(merged);
                        
                        UIModule.showToast(panel, 'Settings imported! Reloading...', 'success');
                        
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    } catch(err) {
                        console.error('Import error:', err);
                        UIModule.showToast(panel, 'Import failed: Invalid file.', 'error');
                    }
                };
                reader.readAsText(file);
                e.target.value = ''; 
            });

            // Reset Logic (New Location)
            panel.querySelector('.sff-action-reset').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to reset all filters to their default values? This cannot be undone.')) {
                    const resetSettings = {...DEFAULTS};
                    UtilsModule.saveSettings(resetSettings).then(() => {
                        UIModule.showToast(panel, 'Settings reset! Reloading...', 'success');
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    });
                }
            });
            // -----------------------------

            // Set dynamic version from manifest
            try {
                const manifest = browser.runtime.getManifest();
                const versionEl = panel.querySelector('#sff-version');
                if (manifest && manifest.version && versionEl) {
                    versionEl.textContent = `Version ${manifest.version}`;
                }
            } catch (error) {
                console.log('Could not get manifest version:', error);
            }

            // Initialize draggable and resizable
            const cleanupDraggable = this.makeDraggable(panel);
            const cleanupResizable = this.makeResizable(panel);

            // Load saved position
            Storage.get('sffPanelPos', {}).then((savedPos) => {
                if (savedPos && (savedPos.left || savedPos.top)) {
                    panel.style.left = savedPos.left || '';
                    panel.style.top = savedPos.top || '';
                    panel.style.right = savedPos.left ? 'auto' : '10px';
                }
            });

            // Ensure panel is in viewport on load
            setTimeout(() => this.keepInViewport(panel), 100);

            // Handle window resize
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const wasVisible = panel.style.display === 'block';
                    if (wasVisible) {
                        panel.style.display = 'none';
                    }

                    // Sync secondary kudos button visibility on resize
                    this.syncSecondaryKudosVisibility();

                    // Force reflow to ensure proper measurements
                    void panel.offsetHeight;

                    // Update position to stay in viewport
                    this.keepInViewport(panel);

                    if (wasVisible) {
                        panel.style.display = 'block';
                    }

                    // Save new position
                    Storage.set('sffPanelPos', {
                        left: panel.style.left,
                        top: panel.style.top
                    });
                }, 100);
            };

            window.addEventListener('resize', handleResize);

            // Handle click outside (define first)
            const handleClickOutside = (e) => {
                // Don't close panel if it's being resized or dragged
                if (panel.dataset.resizing === 'true' || panel.dataset.dragging === 'true') {
                    return;
                }
                
                const clickedSecondaryBtn = secondaryFilterBtn && secondaryFilterBtn.contains(e.target);
                if (!panel.contains(e.target) && !btn.contains(e.target) && !clickedSecondaryBtn) {
                    const isVisible = panel.style.display === 'block' && panel.style.visibility !== 'hidden';
                    if (isVisible) {
                        togglePanel();
                    }
                }
            };

            // Toggle panel function
            const togglePanel = () => {
                const isVisible = panel.style.display === 'block' && panel.style.visibility !== 'hidden';
                console.log('🔄 Toggle panel called. Currently visible:', isVisible);

                if (!isVisible) {
                    console.log('📁 Showing panel...');
                    // Close all dropdowns before showing the panel
                    panel.querySelectorAll('.sff-dropdown.open').forEach(dropdown => {
                        dropdown.classList.remove('open');
                        const content = dropdown.querySelector('.sff-dropdown-content');
                        if (content) content.style.display = 'none';
                    });

                    // Position panel directly under the active button
                    const activeBtn = (window.innerWidth <= 1479 && secondaryFilterBtn) ? secondaryFilterBtn : btn;
                    const btnRect = activeBtn.getBoundingClientRect();
                    const gap = 5; // Small gap between button and panel

                    panel.style.left = btnRect.left + 'px';
                    panel.style.top = (btnRect.bottom + gap) + 'px';
                    panel.style.right = 'auto';

                    // Show panel
                    panel.style.display = 'block';
                    panel.style.visibility = 'visible';
                    panel.style.opacity = '1';
                    panel.classList.add('show');

                    // Ensure panel stays within viewport after positioning
                    this.keepInViewport(panel);
                    console.log('✅ Panel should now be visible');

                    // Add click outside handler
                    setTimeout(() => {
                        document.addEventListener('click', handleClickOutside);
                    }, 0);
                } else {
                    console.log('😫 Hiding panel...');
                    // Hide panel
                    panel.classList.remove('show');
                    panel.style.opacity = '0';
                    panel.style.visibility = 'hidden';
                    document.removeEventListener('click', handleClickOutside);

                    // After transition completes, update display
                    setTimeout(() => {
                        if (panel.style.visibility === 'hidden') {
                            panel.style.display = 'none';
                        }
                    }, 200);
                }
            };

            // Toggle panel on button click
            btn.addEventListener('click', (e) => {
                console.log('🔥 Filter button clicked!');
                e.stopPropagation();
                togglePanel();
            });

            // Setup secondary filter button event (only if exists)
            if (secondaryFilterBtn) {
                secondaryFilterBtn.addEventListener('click', (e) => {
                    console.log('🔥 Secondary filter button clicked!');
                    e.stopPropagation();
                    togglePanel();
                });
            }

            // Setup secondary kudos button event (only if exists)
            if (secondaryKudosBtn) {
                secondaryKudosBtn.addEventListener('click', () => {
                    let kudosGiven = 0;
                    const kudosButtons = document.querySelectorAll("button[data-testid='kudos_button']");

                    kudosButtons.forEach(button => {
                        const feedEntry = button.closest('.activity, .feed-entry, [data-testid="web-feed-entry"]');
                        if (feedEntry && feedEntry.style.display !== 'none' && button.title !== 'View all kudos') {
                            button.click();
                            kudosGiven++;
                        }
                    });

                    const originalText = secondaryKudosBtn.textContent;
                    secondaryKudosBtn.textContent = `Gave ${kudosGiven} 👍`;
                    secondaryKudosBtn.style.pointerEvents = 'none';

                    setTimeout(() => {
                        secondaryKudosBtn.textContent = originalText;
                        secondaryKudosBtn.style.pointerEvents = 'auto';
                    }, 3000);
                });
            }

            // Close button
            panel.querySelector('.sff-close').addEventListener('click', (e) => {
                e.stopPropagation();
                togglePanel();
            });

            // Toggle all dropdowns
            panel.querySelectorAll('.sff-dropdown-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    const dropdown = e.currentTarget.closest('.sff-dropdown');
                    if (!dropdown) return;

                    const content = dropdown.querySelector('.sff-dropdown-content');
                    const isVisible = content.style.display === 'block';

                    // Close all other dropdowns first
                    if (!isVisible) {
                        panel.querySelectorAll('.sff-dropdown.open').forEach(otherDropdown => {
                            if (otherDropdown !== dropdown) {
                                otherDropdown.classList.remove('open');
                                const otherContent = otherDropdown.querySelector('.sff-dropdown-content');
                                if (otherContent) otherContent.style.display = 'none';
                            }
                        });
                    }

                    content.style.display = isVisible ? 'none' : 'block';
                    dropdown.classList.toggle('open', !isVisible);
                });
            });

            // Checkbox styling and real-time updates
            panel.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    const chip = e.target.closest('.sff-chip');
                    if (chip) chip.classList.toggle('checked', e.target.checked);

                    // Master enable toggle
                    if (e.target.classList.contains('sff-enabled-toggle')) {
                        settings.enabled = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        const toggleText = document.querySelector('.sff-toggle-text');
                        if (toggleText) toggleText.textContent = `FILTER ${settings.enabled ? 'ON' : 'OFF'}`;
                        LogicModule.applyAllFilters();
                        return; // Other toggles not relevant when flipping master
                    }

                    // Header kudos toggle
                    if (e.target.classList.contains('sff-showKudosButton')) {
                        settings.showKudosButton = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        LogicModule.manageHeaderKudosButton();
                        UIModule.syncSecondaryKudosVisibility();
                    }

                    // Notification bell toggle
                    if (e.target.classList.contains('sff-showNotifications')) {
                        settings.showNotifications = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        UIModule.toggleNotificationBell();
                    }

                    // Gift button
                    if (e.target.classList.contains('sff-hideGift')) {
                        settings.hideGiveGift = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        LogicModule.updateGiftVisibility();
                    }

                    // Start Trial button
                    if (e.target.classList.contains('sff-hideStartTrial')) {
                        settings.hideStartTrial = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        LogicModule.updateStartTrialVisibility();
                    }

                    // Your challenges section
                    if (e.target.classList.contains('sff-hideChallenges')) {
                        UtilsModule.saveSettings(settings);
                        LogicModule.filterActivities();
                    }
                    if (e.target.classList.contains('sff-hideClubPosts')) {
                        settings.hideClubPosts = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        LogicModule.filterActivities();
                    }

                    // Activity type chips
                    if (e.target.hasAttribute('data-typ')) {
                        const typ = e.target.getAttribute('data-typ');
                        settings.types[typ] = e.target.checked;
                        UtilsModule.saveSettings(settings);
                        LogicModule.filterActivities();
                    }

                    // Update count display
                    UIModule.updateActivityCount(panel);
                }

                // See more button mode (select, not a checkbox)
                if (e.target.classList.contains('sff-seeMoreMode')) {
                    const value = e.target.value;
                    if (value === 'always' || value === 'smallOnly' || value === 'never') {
                        settings.seeMoreButtonMode = value;
                    } else {
                        settings.seeMoreButtonMode = 'always';
                    }
                    // Maintain legacy boolean for compatibility
                    settings.showSeeMoreButton = settings.seeMoreButtonMode !== 'never';

                    // Persist all current settings just like Apply, but without reloading
                    try {
                        UIModule.applySettings(panel);
                    } catch (e2) {}
                    UtilsModule.saveSettings(settings);

                    // Re-apply see-more buttons immediately
                    LogicModule.manageSeeMoreButtons();
                }
            });

            const typesActions = panel.querySelector('.sff-types-actions');
            if (typesActions) {
                typesActions.addEventListener('click', (event) => {
                    const button = event.target instanceof Element ? event.target.closest('button[data-action]') : null;
                    if (!button) return;
                    event.preventDefault();
                    event.stopPropagation();

                    const shouldCheck = button.dataset.action === 'select-all';
                    const checkboxes = [...panel.querySelectorAll('.sff-types input[type="checkbox"][data-typ]')];
                    if (!checkboxes.length) {
                        console.warn('⚠️ No activity type checkboxes found for bulk toggle');
                        return;
                    }

                    checkboxes.forEach(cb => {
                        const typ = cb.dataset.typ;
                        cb.checked = shouldCheck;
                        settings.types[typ] = shouldCheck;
                        cb.closest('.sff-chip')?.classList.toggle('checked', shouldCheck);
                    });

                    UtilsModule.saveSettings(settings);
                    UIModule.updateActivityCount(panel);
                    LogicModule.filterActivities();
                });
            }

            // Apply button
            panel.querySelector('.sff-save').addEventListener('click', async () => {
                console.log('💾 Applying and refreshing...');
                this.applySettings(panel);
                try {
                    await UtilsModule.saveSettings(settings);
                } catch(e) {}
                location.reload();
            });


            // Unit system toggle
            panel.querySelector('.sff-unit-toggle').addEventListener('click', (e) => {
                if (e.target.matches('.sff-unit-btn')) {
                    const newUnit = e.target.dataset.unit;
                    if (newUnit !== settings.unitSystem) {
                        settings.unitSystem = newUnit;
                        panel.querySelectorAll('.sff-unit-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.updateFilterLabels(panel, newUnit);
                    }
                }
            });

            // Setup responsive behavior
            this.setupWindowResize(panel);
            this.setupButtonResponsive(btn);
            this.updateActivityCount(panel);
            this.updateFilterLabels(panel, settings.unitSystem);

            // Events attached

            // Return cleanup function for when the script is unloaded
            return () => {
                window.removeEventListener('resize', handleResize);
                cleanupDraggable && cleanupDraggable();
                cleanupResizable && cleanupResizable();
                document.removeEventListener('click', handleClickOutside);
            };
        },

        makeDraggable(panel) {
            const header = panel.querySelector('.sff-panel-header');
            if (!header) return () => {}; // Return empty cleanup if no header

            let isDragging = false;
            let startX, startY, startLeft, startTop;

            const onMouseDown = (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                if (panel.style.visibility !== 'visible') return; // Only drag when visible

                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                // Get current position without forcing reflow
                const rect = panel.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;

                // Mark panel as being dragged to prevent click-outside from closing it
                panel.dataset.dragging = 'true';

                header.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none'; // Prevent text selection
                e.preventDefault();
                e.stopPropagation();
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                // Calculate new position - allow free movement in all directions
                let newLeft = startLeft + dx;
                let newTop = startTop + dy;

                // Get viewport and panel dimensions
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const panelRect = panel.getBoundingClientRect();

                // Keep panel within viewport bounds with margins from memory: 6px left, 20px right, 6px top/bottom
                const leftMargin = 6;
                const rightMargin = 20;
                const topBottomMargin = 6;
                newLeft = Math.max(leftMargin, Math.min(newLeft, viewportWidth - panelRect.width - rightMargin));
                newTop = Math.max(topBottomMargin, Math.min(newTop, viewportHeight - panelRect.height - topBottomMargin));

                // Apply new position with !important to override CSS (from memory: avoid style conflicts)
                panel.style.setProperty('left', newLeft + 'px', 'important');
                panel.style.setProperty('top', newTop + 'px', 'important');
                panel.style.setProperty('right', 'auto', 'important');
                panel.style.setProperty('bottom', 'auto', 'important');

                // Save position
                Storage.set('sffPanelPos', {
                    left: panel.style.left,
                    top: panel.style.top
                });
            };

            const onMouseUp = (e) => {
                if (isDragging) {
                    isDragging = false;
                    header.style.cursor = '';
                    document.body.style.userSelect = ''; // Restore text selection
                    
                    // Remove dragging flag after a short delay to prevent click-outside from triggering
                    setTimeout(() => {
                        delete panel.dataset.dragging;
                    }, 50);
                }
            };

            header.addEventListener('mousedown', onMouseDown, { passive: false });
            document.addEventListener('mousemove', onMouseMove, { passive: false });
            document.addEventListener('mouseup', onMouseUp, { passive: false });

            // Cleanup function
            return () => {
                header.removeEventListener('mousedown', onMouseDown);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                // Save final position
                Storage.set('sffPanelPos', {
                    left: panel.style.left,
                    top: panel.style.top
                });
            };
        },

        makeResizable(panel) {
            const handleRight = panel.querySelector('.sff-resize-handle');
            const handleLeft = panel.querySelector('.sff-resize-handle-left');
            if (!handleRight && !handleLeft) return () => {};

            let isResizing = false;
            let resizeSide = null;
            let startX, startWidth, startLeft;

            const onMouseDown = (e) => {
                const target = e.target;
                if (!target.classList.contains('sff-resize-handle') && !target.classList.contains('sff-resize-handle-left')) {
                    return;
                }

                isResizing = true;
                resizeSide = target.dataset.side || 'right';
                startX = e.clientX;
                startWidth = parseInt(getComputedStyle(panel).width, 10);
                
                // For left resize, we also need to track the starting left position
                if (resizeSide === 'left') {
                    const rect = panel.getBoundingClientRect();
                    startLeft = rect.left;
                }
                
                document.body.style.userSelect = 'none';
                
                // Mark panel as being resized to prevent click-outside from closing it
                panel.dataset.resizing = 'true';
                
                e.preventDefault();
                e.stopPropagation();
            };

            const onMouseMove = (e) => {
                if (!isResizing) return;

                const minWidth = 280;
                const maxWidth = 600;

                if (resizeSide === 'right') {
                    // Right resize: expand to the right
                    const dx = e.clientX - startX;
                    let newWidth = startWidth + dx;
                    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
                    panel.style.setProperty('width', newWidth + 'px', 'important');
                } else {
                    // Left resize: expand to the left
                    const dx = startX - e.clientX; // Reversed direction
                    let newWidth = startWidth + dx;
                    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
                    
                    // Calculate new left position
                    const widthDiff = newWidth - startWidth;
                    const newLeft = startLeft - widthDiff;
                    
                    panel.style.setProperty('width', newWidth + 'px', 'important');
                    panel.style.setProperty('left', newLeft + 'px', 'important');
                    panel.style.setProperty('right', 'auto', 'important');
                    
                    // Save position during resize
                    Storage.set('sffPanelPos', {
                        left: panel.style.left,
                        top: panel.style.top
                    });
                }
                
                e.preventDefault();
            };

            const onMouseUp = (e) => {
                if (isResizing) {
                    isResizing = false;
                    resizeSide = null;
                    document.body.style.userSelect = '';
                    
                    // Remove resizing flag after a short delay to prevent click-outside from triggering
                    setTimeout(() => {
                        delete panel.dataset.resizing;
                    }, 50);
                    
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            if (handleRight) handleRight.addEventListener('mousedown', onMouseDown);
            if (handleLeft) handleLeft.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            return () => {
                if (handleRight) handleRight.removeEventListener('mousedown', onMouseDown);
                if (handleLeft) handleLeft.removeEventListener('mousedown', onMouseDown);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
        },

        keepInViewport(panel) {
            const rect = panel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const panelWidth = rect.width;
            const panelHeight = rect.height;

            let left = parseInt(panel.style.left) || 0;
            let top = parseInt(panel.style.top) || 0;

            // Adjust if panel is outside viewport with margins from memory: 6px left, 20px right, 6px top/bottom
            const leftMargin = 6;
            const rightMargin = 20;
            const topBottomMargin = 6;

            if (left + panelWidth > viewportWidth) {
                left = viewportWidth - panelWidth - rightMargin;
            }

            if (top + panelHeight > viewportHeight) {
                top = viewportHeight - panelHeight - topBottomMargin;
            }

            if (left < 0) {
                left = leftMargin;
            }

            if (top < 0) {
                top = topBottomMargin;
            }

            // Apply new position
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.right = 'auto';

            // Save adjusted position
            Storage.set('sffPanelPos', {
                left: panel.style.left,
                top: panel.style.top
            });
        },

        setupWindowResize(panel) {
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

                Storage.set('sffPanelPos', {
                    top: panel.style.top,
                    right: panel.style.right
                });

                // Re-evaluate visibility of "Show more stats" buttons on viewport changes
                try {
                    LogicModule.manageSeeMoreButtons();
                } catch (e) {}
            });
        },

        setupButtonResponsive(btn) {
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
    };

    // Logic Module - Step 6 of modular refactoring
    const LogicModule = {
        // Determine if a feed node is a club post
        isClubPost(node) {
            if (!node) return false;
            const el = (node.matches?.('[data-testid="web-feed-entry"]') ? node : node.closest?.('[data-testid="web-feed-entry"]')) || node;
            try {
                if (el.querySelector?.('.clubMemberPostHeaderLinks a.clubLink[href^="/clubs/"]')) return true;
                if (el.querySelector?.('a[data-testid="club-avatar"][href^="/clubs/"]')) return true;
                const postLink = el.querySelector?.('a[data-testid="post-details-url"]');
                if (postLink && /^\/clubs\//.test(postLink.getAttribute('href') || '')) return true;
                if (el.querySelector?.('a[href^="/clubs/"]')) return true;
                return false;
            } catch (_) {
                return false;
            }
        },
        // Determine if a feed node is a challenge card ("joined a challenge")
        isChallengeEntry(node) {
            if (!node) return false;
            const el = (node.matches?.('[data-testid="web-feed-entry"]') ? node : node.closest?.('[data-testid="web-feed-entry"]')) || node;
            // Common markers for challenges
            if (el.matches?.('[data-testid="challenge-card"], .challenge-card')) return true;
            // Join Challenge button present
            const hasJoinBtn = el.querySelector?.('button, a') && Array.from(el.querySelectorAll('button, a')).some(b => (b.textContent || '').trim().toLowerCase().includes('join challenge'));
            if (hasJoinBtn) return true;
            // Links to /challenges/... without an owners-name (no athlete owner)
            const hasChallengeLink = !!el.querySelector?.('a[href^="/challenges/"]');
            const hasOwnerName = !!el.querySelector?.('[data-testid="owners-name"], .entry-athlete');
            if (hasChallengeLink && !hasOwnerName) return true;
            return false;
        },

        // Determine if a feed node is a real activity entry (not a challenge or club post)
        isActivityEntry(node) {
            if (!node) return false;
            const el = (node.matches?.('[data-testid="web-feed-entry"]') ? node : node.closest?.('[data-testid="web-feed-entry"]')) || node;
            // Must have activity icon or activity container
            const hasIcon = !!el.querySelector?.('svg[data-testid="activity-icon"]');
            const hasActivityContainer = !!el.querySelector?.('[data-testid="activity_entry_container"], .activity-name, .entry-title');
            // Exclude challenge entries explicitly
            return (hasIcon || hasActivityContainer) && !this.isChallengeEntry(el);
        },

        updateJoinedChallengesVisibility() {
            try {
                const entries = document.querySelectorAll('[data-testid="web-feed-entry"], .feed-entry, .activity');
                entries.forEach(entry => {
                    if (this.isChallengeEntry(entry)) {
                        if (settings.enabled && settings.hideJoinedChallenges) {
                            if (entry.dataset.sffHiddenChallenge !== 'sff') {
                                entry.dataset.sffHiddenChallenge = 'sff';
                                entry.style.display = 'none';
                            }
                        } else if (entry.dataset.sffHiddenChallenge === 'sff') {
                            entry.style.display = '';
                            delete entry.dataset.sffHiddenChallenge;
                        }
                    }
                });
            } catch (e) {
                console.warn('updateJoinedChallengesVisibility error:', e);
            }
        },
        updateGiftVisibility() {
            try {
                const links = document.querySelectorAll('a[href*="/gift"][href*="origin=global_nav"]');
                links.forEach(a => {
                    if (settings.enabled && settings.hideGiveGift) {
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
        },

        updateStartTrialVisibility() {
            try {
                // Target: <li class="nav-item upgrade"><a class="experiment btn btn-sm btn-primary" href="/subscribe?cta=free-trial&element=link&origin=global_nav">Start Trial</a></li>
                const links = document.querySelectorAll('li.nav-item.upgrade a[href*="/subscribe"][href*="cta=free-trial"][href*="origin=global_nav"]');
                links.forEach(a => {
                    const li = a.closest('li.nav-item.upgrade');
                    const targetElement = li || a;
                    
                    if (settings.enabled && settings.hideStartTrial) {
                        if (targetElement.dataset.sffHiddenBy !== 'sff') {
                            targetElement.dataset.sffHiddenBy = 'sff';
                            targetElement.style.display = 'none';
                        }
                    } else if (targetElement.dataset.sffHiddenBy === 'sff') {
                        targetElement.style.display = '';
                        delete targetElement.dataset.sffHiddenBy;
                    }
                });
            } catch (e) {
                console.warn('updateStartTrialVisibility error:', e);
            }
        },

        updateChallengesVisibility() {
            try {
                const challengesSection = document.querySelector('#your-challenges');
                if (challengesSection) {
                    if (settings.enabled && settings.hideChallenges) {
                        if (challengesSection.dataset.sffHiddenBy !== 'sff') {
                            challengesSection.dataset.sffHiddenBy = 'sff';
                            challengesSection.style.display = 'none';
                        }
                    } else if (challengesSection.dataset.sffHiddenBy === 'sff') {
                        challengesSection.style.display = '';
                        delete challengesSection.dataset.sffHiddenBy;
                    }
                }
            } catch (e) {
                console.warn('updateChallengesVisibility error:', e);
            }
        },

        updateSuggestedFriendsVisibility() {
            try {
                const suggestedFriendsSection = document.querySelector('#suggested-follows');
                if (suggestedFriendsSection) {
                    if (settings.enabled && settings.hideSuggestedFriends) {
                        if (suggestedFriendsSection.dataset.sffHiddenBy !== 'sff') {
                            suggestedFriendsSection.dataset.sffHiddenBy = 'sff';
                            suggestedFriendsSection.style.display = 'none';
                        }
                    } else if (suggestedFriendsSection.dataset.sffHiddenBy === 'sff') {
                        suggestedFriendsSection.style.display = '';
                        delete suggestedFriendsSection.dataset.sffHiddenBy;
                    }
                }
            } catch (e) {
                console.warn('updateSuggestedFriendsVisibility error:', e);
            }
        },

        updateYourClubsVisibility() {
            try {
                const yourClubsSection = document.querySelector('#your-clubs');
                if (yourClubsSection) {
                    if (settings.enabled && settings.hideYourClubs) {
                        if (yourClubsSection.dataset.sffHiddenBy !== 'sff') {
                            yourClubsSection.dataset.sffHiddenBy = 'sff';
                            yourClubsSection.style.display = 'none';
                        }
                    } else if (yourClubsSection.dataset.sffHiddenBy === 'sff') {
                        yourClubsSection.style.display = '';
                        delete yourClubsSection.dataset.sffHiddenBy;
                    }
                }
            } catch (e) {
                console.warn('updateYourClubsVisibility error:', e);
            }
        },

        updateFooterVisibility() {
            try {
                // Find ONLY the footer section that includes footer-specific markers
                const markerSelector = 'a[href*="/legal/terms"], a[href*="/legal/privacy"], a[href*="/legal/cookie_policy"], #language-picker, #cpra-compliance-cta';
                let footerSection = Array.from(document.querySelectorAll('div.FvXwlgEO > section._01jT9FUf, section._01jT9FUf'))
                    .find(sec => sec.querySelector(markerSelector) || /©\s*\d{4}\s*Strava/i.test(sec.textContent || '')) || null;
                if (!footerSection) {
                    // Fallback to canonical footer elements
                    footerSection = document.querySelector('footer, [data-testid="footer"], .global-footer, .site-footer');
                }
                if (!footerSection) return;

                if (settings.enabled && settings.hideFooter) {
                    if (footerSection.dataset.sffHiddenBy !== 'sff') {
                        footerSection.dataset.sffHiddenBy = 'sff';
                        footerSection.style.setProperty('display', 'none', 'important');
                        footerSection.style.setProperty('margin', '0', 'important');
                        footerSection.style.setProperty('padding', '0', 'important');
                        footerSection.style.setProperty('height', '0', 'important');
                    }
                } else if (footerSection.dataset.sffHiddenBy === 'sff') {
                    footerSection.style.removeProperty('display');
                    footerSection.style.removeProperty('margin');
                    footerSection.style.removeProperty('padding');
                    footerSection.style.removeProperty('height');
                    delete footerSection.dataset.sffHiddenBy;
                }
            } catch (e) {
                console.warn('updateFooterVisibility error:', e);
            }
        },

        updateMyWindsockVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    // Find only text-containing elements (paragraphs and spans) that specifically contain myWindsock content
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        // Only hide if this element specifically contains the myWindsock report and not other content
                        if (text.includes('-- myWindsock Report --') && text.length < 500) { // Limit to avoid hiding large containers
                            if (settings.enabled && settings.hideMyWindsock) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                    console.log('🔮 myWindsock text content hidden:', element);
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateMyWindsockVisibility error:', e);
            }
        },

        updateWandrerVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text, [data-testid="activity_description_wrapper"]');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        const hasWandrer = /\bfrom\s+wandrer\b/i.test(text) || /\bwandrer\b/i.test(text);
                        if (hasWandrer && text.length < 800) {
                            if (settings.enabled && settings.hideWandrer) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateWandrerVisibility error:', e);
            }
        },

        updateBandokVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text, [data-testid="activity_description_wrapper"]');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        // Match "Activity name auto generated by Bandok.com"
                        const hasBandok = /activity\s+name\s+auto\s+generated\s+by\s+bandok\.com/i.test(text);
                        if (hasBandok && text.length < 200) {
                            if (settings.enabled && settings.hideBandok) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                    console.log('🎯 Bandok.com description hidden:', element);
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateBandokVisibility error:', e);
            }
        },

        updateCorosVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text, [data-testid="activity_description_wrapper"]');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        // Match "-- from COROS" or similar patterns
                        const hasCoros = /--\s*from\s+coros/i.test(text) || /--\s*coros/i.test(text);
                        if (hasCoros && text.length < 500) {
                            if (settings.enabled && settings.hideCoros) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                    console.log('⌚ COROS description hidden:', element);
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateCorosVisibility error:', e);
            }
        },

        updateSummitbagVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    // Find only text-containing elements (paragraphs and spans) that specifically contain summitbag content
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        // Only hide if this element specifically contains summitbag and not other content
                        if (text.includes('summitbag.com') && text.length < 500) { // Limit to avoid hiding large containers
                            if (settings.enabled && settings.hideSummitbag) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                    console.log('🏔️ summitbag text content hidden:', element);
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateSummitbagVisibility error:', e);
            }
        },

        updateRunHealthVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    // Find only text-containing elements (paragraphs and spans) that specifically contain Run Health content
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        // Only hide if this element specifically contains Run Health and not other content
                        if (text.includes('www.myTF.run') && text.length < 500) { // Limit to avoid hiding large containers
                            if (settings.enabled && settings.hideRunHealth) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                    console.log('🏃 Run Health text content hidden:', element);
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateRunHealthVisibility error:', e);
            }
        },

        updateJoinWorkoutVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    // Find only text-containing elements (paragraphs and spans) that specifically contain JOIN workout content
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text, [data-testid="activity_description_wrapper"]');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        // Detect JOIN workout embeds
                        const hasJoin = /\bJOIN workout\b/i.test(text) || text.includes('strava.com/clubs/join-cycling');
                        if (hasJoin && text.length < 800) { // Limit to avoid hiding large containers
                            if (settings.enabled && settings.hideJoinWorkout) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                    console.log('🧩 JOIN workout text content hidden:', element);
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateJoinWorkoutVisibility error:', e);
            }
        },

        updateCoachCatVisibility() {
            try {
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

                activities.forEach(activity => {
                    const textElements = activity.querySelectorAll('p, span, .text-content, .description-text, .activity-text, [data-testid="activity_description_wrapper"]');

                    textElements.forEach(element => {
                        const text = element.textContent?.trim() || '';
                        const hasCoachCat = /\bCoachCat Training Summary\b/i.test(text) || text.includes('fascatcoaching.com/app');
                        if (hasCoachCat && text.length < 800) {
                            if (settings.enabled && settings.hideCoachCat) {
                                if (element.dataset.sffHiddenBy !== 'sff') {
                                    element.dataset.sffHiddenBy = 'sff';
                                    element.style.display = 'none';
                                }
                            } else if (element.dataset.sffHiddenBy === 'sff') {
                                element.style.display = '';
                                delete element.dataset.sffHiddenBy;
                            }
                        }
                    });
                });
            } catch (e) {
                console.warn('updateCoachCatVisibility error:', e);
            }
        },

        updateAthleteJoinedClubVisibility() {
            try {
                const toHide = new Set();

                // 1) Header-based detection
                const headers = document.querySelectorAll('[data-testid="group-header"]');
                headers.forEach(header => {
                    const text = header.textContent?.trim() || '';
                    if (/joined a club/i.test(text)) {
                        const entry = header.closest('[data-testid="web-feed-entry"], .feed-entry, .activity');
                        if (!entry) return;
                        const container = entry.closest('[id^="feed-entry-"]') || entry;
                        toHide.add(container);
                    }
                });

                // 2) Button-based detection: entries containing a "Join Club" button/CTA
                const entries = document.querySelectorAll('[data-testid="web-feed-entry"], .feed-entry, .activity');
                entries.forEach(entry => {
                    const hasJoinCta = !![...(entry.querySelectorAll('button, a[role="button"], a'))]
                        .some(el => /\bjoin club\b/i.test(el.textContent?.trim() || ''));
                    if (hasJoinCta) {
                        const container = entry.closest('[id^="feed-entry-"]') || entry;
                        toHide.add(container);
                    }
                });

                // Apply or restore
                toHide.forEach(container => {
                    if (settings.enabled && settings.hideAthleteJoinedClub) {
                        if (container.dataset.sffHiddenJoinedClub !== 'sff') {
                            container.dataset.sffHiddenJoinedClub = 'sff';
                            container.style.setProperty('display', 'none', 'important');
                        }
                    } else if (container.dataset.sffHiddenJoinedClub === 'sff') {
                        container.style.removeProperty('display');
                        delete container.dataset.sffHiddenJoinedClub;
                    }
                });
            } catch (e) {
                console.warn('updateAthleteJoinedClubVisibility error:', e);
            }
        },

        // Count hidden sections for display in filter button
        countHiddenSections() {
            let hiddenSectionsCount = 0;

            // Count hidden sections
            const sectionsToCheck = [
                { selector: '#your-challenges', setting: 'hideChallenges' },
                { selector: '#suggested-follows', setting: 'hideSuggestedFriends' },
                { selector: '#your-clubs', setting: 'hideYourClubs' },
                { selector: 'div.FvXwlgEO', setting: 'hideFooter' }
            ];

            sectionsToCheck.forEach(({ selector, setting }) => {
                const section = document.querySelector(selector);
                if (section && settings[setting] && section.dataset.sffHiddenBy === 'sff') {
                    hiddenSectionsCount++;
                }
            });

            return hiddenSectionsCount;
        },

        filterSingleActivity(activity) {
            // Immediate filter for a single activity to prevent flickering
            if (!settings.enabled) return;

            const title = activity.querySelector('.entry-title, .activity-name, [data-testid="entry-title"], [data-testid="activity_name"]')?.textContent || '';
            const { match: resolvedType, raw: resolvedRawType } = resolveActivityType(activity);
            const typeText = resolvedRawType || '';
            const normalizedTypeText = normalizeTypeLabel(typeText);

            // Debug logging
            if (!resolvedType && typeText) {
                console.log('🔍 Unresolved activity:', { title, typeText, normalizedTypeText });
            }

            let shouldHide = false;

            // Quick type check for immediate hiding
            if (resolvedType && settings.types[resolvedType.key]) {
                shouldHide = true;
                // Hiding activity by type
            } else if (!resolvedType && typeText) {
                // Fallback detection for common types
                const isWalk = normalizedTypeText.includes('walk') || /\b(walked|walking)\b/i.test(title);
                const isRun = normalizedTypeText.includes('run') || /\b(ran|running)\b/i.test(title);
                const isHike = normalizedTypeText.includes('hike') || /\b(hiked|hiking)\b/i.test(title);
                const isSwim = normalizedTypeText.includes('swim') || /\b(swam|swimming)\b/i.test(title);
                const isRide = normalizedTypeText.includes('ride') || /\b(rode|cycling|cycle)\b/i.test(title);

                if (isWalk && settings.types['Walk']) {
                    shouldHide = true;
                    console.log('✅ Hiding walk (fallback):', title);
                } else if (isRun && settings.types['Run']) {
                    shouldHide = true;
                    console.log('✅ Hiding run (fallback):', title);
                } else if (isHike && settings.types['Hike']) {
                    shouldHide = true;
                    console.log('✅ Hiding hike (fallback):', title);
                } else if (isSwim && settings.types['Swim']) {
                    shouldHide = true;
                    console.log('✅ Hiding swim (fallback):', title);
                } else if (isRide && settings.types['Ride']) {
                    shouldHide = true;
                    console.log('✅ Hiding ride (fallback):', title);
                }
            }

            if (shouldHide) {
                activity.style.display = 'none';
            }
        },

        filterActivities() {
            const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');

            if (!settings.enabled) {
                activities.forEach(activity => {
                    activity.style.display = '';
                });

                // Update button to show "OFF" when filtering is disabled
                const btn = document.querySelector('.sff-clean-btn .sff-btn-sub');
                const secondaryBtn = document.querySelector('.sff-secondary-filter-btn .sff-btn-sub');
                if (btn) btn.textContent = 'OFF';
                if (secondaryBtn) secondaryBtn.textContent = 'OFF';
                return;
            }
            let hiddenCount = 0;

            activities.forEach(activity => {
                // Get the primary owner of the activity
                const ownerLink = activity.querySelector('.entry-athlete a, [data-testid="owners-name"]');
                let athleteName = ownerLink?.textContent || '';
                
                // For "joined a club" and similar entries, check group-header
                if (!athleteName) {
                    const groupHeader = activity.querySelector('[data-testid="group-header"]');
                    if (groupHeader) {
                        const headerLink = groupHeader.querySelector('a');
                        athleteName = headerLink?.textContent || '';
                    }
                }

                // Check if the PRIMARY athlete should be ignored (applies to ALL entry types)
                // Skip group activities (detected by "rode with" or similar text in buttons)
                if (settings.ignoredAthletes.length > 0 && athleteName) {
                    // Check if this is a group activity
                    const isGroupActivity = Array.from(activity.querySelectorAll('button')).some(btn => 
                        /\b(rode|ran|walked|hiked|swam)\s+with\b/i.test(btn.textContent || '')
                    );
                    
                    // Only apply ignore filter to non-group activities
                    if (!isGroupActivity) {
                        const nameParts = athleteName.toLowerCase().split(/\s+/);
                        const isIgnored = settings.ignoredAthletes.some(ignoredName => {
                            if (!ignoredName) return false;
                            const ignoredNameParts = ignoredName.toLowerCase().split(/\s+/);
                            return ignoredNameParts.every(part => nameParts.includes(part));
                        });

                        if (isIgnored) {
                            activity.style.display = 'none';
                            hiddenCount++;
                            return;
                        }
                    }
                }

                // Hide commute-tagged activities early
                try {
                    const tags = Array.from(activity.querySelectorAll('[data-testid="tag"]')).map(el => (el.textContent || '').trim().toLowerCase());
                    const hasCommute = tags.some(t => t === 'commute');
                    if (hasCommute && settings.hideCommuteTag) {
                        activity.style.display = 'none';
                        hiddenCount++;
                        return;
                    }
                } catch (_) {}

                // Handle club posts (robust detection)
                const isClub = this.isClubPost(activity) || (ownerLink && ownerLink.getAttribute('href')?.includes('/clubs/'));
                if (isClub) {
                    if (settings.hideClubPosts) {
                        activity.style.display = 'none';
                        hiddenCount++;
                    } else {
                        activity.style.display = '';
                    }
                    return; // Club posts are not subject to other filters
                }

                // Handle joined challenge cards separately
                if (this.isChallengeEntry(activity)) {
                    if (settings.hideJoinedChallenges) {
                        activity.style.display = 'none';
                        hiddenCount++;
                    } else {
                        activity.style.display = '';
                    }
                    return; // Do not apply activity filters to challenge cards
                }

                const title = activity.querySelector('.entry-title, .activity-name, [data-testid="entry-title"], [data-testid="activity_name"]')?.textContent || '';
                const { match: resolvedType, raw: resolvedRawType } = resolveActivityType(activity);
                const typeText = resolvedRawType || '';
                const normalizedTypeText = normalizeTypeLabel(typeText);
                const isRunActivity = resolvedType ? /run$/i.test(resolvedType.key) : normalizedTypeText.includes('run');

                let shouldHide = false;

                // Keywords, Activity types, Distance, Duration, Elevation, Pace, Map, Athletes logic...
                // [Filtering logic implementation here]
                if (!shouldHide && settings.keywords.length > 0 && title) {
                    const hasKeyword = settings.keywords.some(keyword => keyword && title.toLowerCase().includes(keyword.toLowerCase()));
                    if (hasKeyword) shouldHide = true;
                }

                if (!shouldHide && (resolvedType || typeText)) {
                    if (resolvedType) {
                        if (settings.types[resolvedType.key]) {
                            shouldHide = true;
                        }
                        // If resolvedType exists and is NOT hidden, we do NOT fall through to generic checks.
                        // This protects "VirtualRide" from being hidden by the generic "Ride" logic below.
                    } else {
                        // Fallback for group activities or unresolved types
                        const isVirtual = normalizedTypeText.includes('virtual');
                        
                        if (isVirtual) {
                            const hideAnyVirtual = TYPE_LABEL_METADATA.filter(t => t.normalized.includes('virtual')).some(t => settings.types[t.key]);
                            if (hideAnyVirtual) shouldHide = true;
                        } else {
                            // Check for specific activity types in fallback
                            const isWalk = normalizedTypeText.includes('walk') || /\b(walked|walking)\b/i.test(title);
                            const isRun = normalizedTypeText.includes('run') || /\b(ran|running)\b/i.test(title);
                            const isHike = normalizedTypeText.includes('hike') || /\b(hiked|hiking)\b/i.test(title);
                            const isSwim = normalizedTypeText.includes('swim') || /\b(swam|swimming)\b/i.test(title);
                            
                            if (isWalk && settings.types['Walk']) {
                                shouldHide = true;
                            } else if (isRun && settings.types['Run']) {
                                shouldHide = true;
                            } else if (isHike && settings.types['Hike']) {
                                shouldHide = true;
                            } else if (isSwim && settings.types['Swim']) {
                                shouldHide = true;
                            } else {
                                // Only check for generic ride if it's NOT virtual and not another specific type
                                // Check for group ride indicators:
                                const hasGroupAvatars = !!activity.querySelector('[data-testid="avatar_group"]');
                                const isRide = normalizedTypeText.includes('ride') || 
                                             /\b(rode|cycling|cycle)\b/i.test(title) || 
                                             (activity.querySelector('[data-testid="group-header"]') && /rode/i.test(activity.textContent || '')) ||
                                             (hasGroupAvatars && !normalizedTypeText.includes('run')); // Assume group activity is a ride if not explicitly a run
                                
                                if (isRide && settings.types['Ride']) {
                                    shouldHide = true;
                                }
                            }
                        }
                    }
                }

                if (!shouldHide && (settings.minKm > 0 || settings.maxKm > 0)) {
                    const km = UtilsModule.parseDistanceKm(activity);
                    if (km !== null) {
                        const val = settings.unitSystem === 'metric' ? km : km * 0.621371;
                        if (settings.minKm > 0 && val < settings.minKm) shouldHide = true;
                        if (!shouldHide && settings.maxKm > 0 && val > settings.maxKm) shouldHide = true;
                    }
                }

                if (!shouldHide && (settings.minMins > 0 || settings.maxMins > 0)) {
                    const secs = UtilsModule.parseDurationSeconds(activity);
                    if (secs !== null) {
                        const mins = secs / 60;
                        if (settings.minMins > 0 && mins < settings.minMins) shouldHide = true;
                        if (!shouldHide && settings.maxMins > 0 && mins > settings.maxMins) shouldHide = true;
                    }
                }

                if (!shouldHide && (settings.minElevM > 0 || settings.maxElevM > 0)) {
                    const elevM = UtilsModule.parseElevationM(activity);
                    if (elevM !== null) {
                        const val = settings.unitSystem === 'metric' ? elevM : elevM * 3.28084;
                        if (settings.minElevM > 0 && val < settings.minElevM) shouldHide = true;
                        if (!shouldHide && settings.maxElevM > 0 && val > settings.maxElevM) shouldHide = true;
                    }
                }

                {
                    // Robust userscript-based pace parsing
                    const hasMinPace = (typeof settings.minPace === 'number' && settings.minPace > 0);
                    const hasMaxPace = (typeof settings.maxPace === 'number' && settings.maxPace > 0);
                    if (!shouldHide && (hasMinPace || hasMaxPace) && isRunActivity) {
                        let valueDiv = null;
                        const paceLabel = [...activity.querySelectorAll('span')]
                            .find(s => /(^|\b)pace(\b|$)/i.test(s.textContent || ''));
                        if (paceLabel) {
                            const metricContainer = paceLabel.closest('div');
                            valueDiv = metricContainer?.querySelector('div') || null;
                            if (metricContainer) {
                                const specific = metricContainer.querySelector('[data-testid="metric_value"], .vNsSU');
                                if (specific) valueDiv = specific;
                            }
                        }
                        // Fallbacks to older selectors
                        if (!valueDiv) valueDiv = activity.querySelector('.pace .value, [data-testid="pace"] .value');

                        if (valueDiv) {
                            const timeText = (valueDiv.childNodes[0]?.textContent || valueDiv.textContent || '').trim();
                            const match = timeText.match(/(\d{1,2}):(\d{2})/);
                            if (match) {
                                const mm = parseInt(match[1], 10);
                                const ss = parseInt(match[2], 10);
                                if (!isNaN(mm) && !isNaN(ss)) {
                                    let paceMinPerUnit = mm + ss / 60;
                                    const abbr = valueDiv.querySelector('abbr');
                                    const abbrTxt = (abbr?.textContent || '').trim().toLowerCase();
                                    const abbrTitle = (abbr?.getAttribute('title') || '').toLowerCase();
                                    const isPerMile = abbrTxt.includes('/mi') || abbrTitle.includes('mile');
                                    // Convert to min/km if necessary
                                    const paceVal = isPerMile ? paceMinPerUnit * 1.60934 : paceMinPerUnit;
                                    // Option B: Min = Slowest (hide if slower), Max = Fastest (hide if faster)
                                    if (hasMinPace && paceVal > settings.minPace) shouldHide = true;
                                    if (!shouldHide && hasMaxPace && paceVal < settings.maxPace) shouldHide = true;
                                }
                            }
                        }
                    }
                }

                if (!shouldHide && settings.hideNoMap) {
                    // Only apply no-map rule to real activity entries
                    if (this.isActivityEntry(activity)) {
                        const map = activity.querySelector('img[data-testid="map"], svg.map, .activity-map, [data-testid="activity-map"]');
                        if (!map) shouldHide = true;
                    }
                }

                if (shouldHide && settings.allowedAthletes.length > 0 && athleteName) {
                    const nameParts = athleteName.toLowerCase().split(/\s+/);
                    const isAllowed = settings.allowedAthletes.some(allowedName => {
                        if (!allowedName) return false;
                        const allowedNameParts = allowedName.toLowerCase().split(/\s+/);
                        return allowedNameParts.every(part => nameParts.includes(part));
                    });

                    if (isAllowed) {
                        shouldHide = false;
                    }
                }

                if (shouldHide) {
                    activity.style.display = 'none';
                    hiddenCount++;
                } else {
                    // Only show if it's currently hidden - prevents unnecessary reflows
                    if (activity.style.display === 'none') {
                        activity.style.display = '';
                    }
                }
            });

            console.log(`🎯 Filtered ${hiddenCount}/${activities.length} activities`);
            const btn = document.querySelector('.sff-clean-btn .sff-btn-sub');
            const secondaryBtn = document.querySelector('.sff-secondary-filter-btn .sff-btn-sub');
            if (btn) btn.textContent = `(${hiddenCount})`;
            if (secondaryBtn) secondaryBtn.textContent = `(${hiddenCount})`;
        },

        manageHeaderKudosButton() {
            let attempts = 0;
            const maxAttempts = 10;
            const interval = 500;

            const placeButton = () => {
                const kudosListItem = document.getElementById('gj-kudos-li');

                if (!settings.enabled || !settings.showKudosButton) {
                    if (kudosListItem) kudosListItem.remove();
                    // Also ensure secondary button is hidden
                    UIModule.syncSecondaryKudosVisibility();
                    return;
                }

                if (kudosListItem) {
                    // Button exists, ensure secondary is also synced
                    UIModule.syncSecondaryKudosVisibility();
                    return;
                }

                const navList = document.querySelector('.user-nav.nav-group');

                if (navList) {
                    const newListItem = document.createElement('li');
                    newListItem.id = 'gj-kudos-li';
                    newListItem.className = 'nav-item';
                    newListItem.dataset.addedByScript = 'true';
                    newListItem.style.paddingRight = '10px';
                    newListItem.style.display = 'flex';
                    newListItem.style.alignItems = 'center';

                    const kudosBtn = document.createElement('a');
                    kudosBtn.className = 'sff-header-kudos-btn';
                    kudosBtn.href = 'javascript:void(0);';
                    kudosBtn.textContent = 'Give 👍 to Everyone';

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
                        kudosBtn.textContent = `Gave ${kudosGiven} 👍`;
                        kudosBtn.style.pointerEvents = 'none';

                        setTimeout(() => {
                            kudosBtn.textContent = originalText;
                            kudosBtn.style.pointerEvents = 'auto';
                        }, 3000);
                    });

                    newListItem.appendChild(kudosBtn);
                    navList.prepend(newListItem);

                    // Sync secondary button visibility after creating main button
                    UIModule.syncSecondaryKudosVisibility();
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(placeButton, interval);
                    }
                }
            };

            placeButton();
        },

        manageSeeMoreButtons() {
            // Determine visibility based on 3-way mode + screen width, with legacy fallback
            let mode = settings.seeMoreButtonMode;
            if (!mode) {
                mode = settings.showSeeMoreButton === false ? 'never' : 'always';
            }

            const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
            const isSmall = width <= 990;

            let shouldShow = false;
            if (mode === 'always') {
                shouldShow = true;
            } else if (mode === 'smallOnly') {
                shouldShow = isSmall;
            } else if (mode === 'never') {
                shouldShow = false;
            }

            if (!settings.enabled || !shouldShow) {
                // Remove all existing buttons if feature is disabled or should not show for this mode/viewport
                document.querySelectorAll('.sff-see-more-btn').forEach(btn => btn.remove());
                document.querySelectorAll('.sff-expanded-stats').forEach(stats => stats.remove());
                return;
            }
            
            // Get all main feed entries
            const mainActivities = document.querySelectorAll('[data-testid="web-feed-entry"]');
            
            // Also get individual activities within group activities
            // Group activities have nested list items with activity containers
            const groupActivityContainers = [];
            mainActivities.forEach(mainActivity => {
                const groupList = mainActivity.querySelector('ul > li > div[data-testid="entry-header"]');
                if (groupList) {
                    // This is a group activity, find all individual activity containers
                    const individualActivities = mainActivity.querySelectorAll('ul > li');
                    individualActivities.forEach(li => groupActivityContainers.push(li));
                }
            });
            
            // Combine both main activities and individual activities from groups
            const allActivityContainers = [...mainActivities, ...groupActivityContainers];
            
            allActivityContainers.forEach(activity => {
                // Skip if button already exists
                if (activity.querySelector('.sff-see-more-btn')) return;
                
                const activityNameLink = activity.querySelector('a[href*="/activities/"][data-testid="activity_name"]');
                if (!activityNameLink) return;
                
                const href = activityNameLink.getAttribute('href');
                const activityId = href?.match(/\/activities\/(\d+)/)?.[1];
                if (!activityId) return;

                // Create "See more" button
                const seeMoreBtn = document.createElement('button');
                seeMoreBtn.className = 'sff-see-more-btn';
                seeMoreBtn.textContent = 'Show more stats';
                seeMoreBtn.dataset.activityId = activityId;
                seeMoreBtn.dataset.expanded = 'false';

                // Insert button after activity title
                const titleContainer = activityNameLink.closest('.oJVfx, .UDqjM');
                if (titleContainer) {
                    titleContainer.style.display = 'flex';
                    titleContainer.style.alignItems = 'center';
                    titleContainer.style.gap = '8px';
                    titleContainer.appendChild(seeMoreBtn);
                }

                // Add click handler
                seeMoreBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const isExpanded = seeMoreBtn.dataset.expanded === 'true';
                    
                    if (isExpanded) {
                        // Collapse
                        const statsContainer = activity.querySelector('.sff-expanded-stats');
                        if (statsContainer) statsContainer.remove();
                        seeMoreBtn.textContent = 'Show more stats';
                        seeMoreBtn.dataset.expanded = 'false';
                    } else {
                        // Expand
                        seeMoreBtn.textContent = 'Loading...';
                        seeMoreBtn.disabled = true;
                        
                        try {
                            const stats = await this.fetchActivityStats(activityId);
                            const statsContainer = this.displayExpandedStats(activity, stats);
                            
                            if (statsContainer) {
                                // Stats were displayed
                                seeMoreBtn.textContent = 'Hide stats';
                                seeMoreBtn.dataset.expanded = 'true';
                            } else {
                                // No stats available (only device/bike)
                                seeMoreBtn.textContent = 'No extra stats';
                                setTimeout(() => {
                                    seeMoreBtn.textContent = 'Show more stats';
                                }, 2000);
                            }
                        } catch (error) {
                            console.error('Failed to fetch activity stats:', error);
                            seeMoreBtn.textContent = 'Error - Try again';
                        } finally {
                            seeMoreBtn.disabled = false;
                        }
                    }
                });
            });
        },

        async fetchActivityStats(activityId) {
            const response = await fetch(`/activities/${activityId}`);
            if (!response.ok) throw new Error('Failed to fetch activity');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const stats = {};
            
            // Method 1: Extract from inline-stats (ul li structure)
            // Structure: <li><strong>VALUE</strong><div class="label">LABEL</div></li>
            doc.querySelectorAll('.inline-stats li').forEach(li => {
                const strong = li.querySelector('strong');
                const labelDiv = li.querySelector('.label');
                
                if (strong && labelDiv) {
                    const value = strong.textContent?.trim().replace(/\s+/g, ' ');
                    const label = labelDiv.textContent?.trim().replace(/\s+/g, ' ');
                    
                    if (label && value) {
                        stats[label] = value;
                    }
                }
            });
            
            // Method 2: Extract from table (avg/max stats) - used in Rides
            // Structure: <tr><th>LABEL</th><td>AVG</td><td>MAX</td></tr>
            doc.querySelectorAll('.more-stats table tbody tr').forEach(row => {
                const th = row.querySelector('th');
                const tds = row.querySelectorAll('td');
                
                if (th && tds.length > 0) {
                    const label = th.textContent?.trim().replace(/\s+/g, ' ');
                    
                    if (tds.length === 2 && tds[0].getAttribute('colspan') !== '2') {
                        // Avg and Max columns
                        const avg = tds[0].textContent?.trim().replace(/\s+/g, ' ');
                        const max = tds[1].textContent?.trim().replace(/\s+/g, ' ');
                        
                        if (label && avg && max) {
                            stats[label + ' Avg'] = avg;
                            stats[label + ' Max'] = max;
                        }
                    } else if (tds.length >= 1) {
                        // Single value (colspan=2)
                        const value = tds[0].textContent?.trim().replace(/\s+/g, ' ');
                        if (label && value) {
                            stats[label] = value;
                        }
                    }
                }
            });
            
            // Method 2b: Extract from row/spans structure - used in Runs
            // Structure: <div class="row"><div class="spans5">LABEL</div><div class="spans3"><strong>VALUE</strong></div></div>
            doc.querySelectorAll('.more-stats .row').forEach(row => {
                const spans5 = row.querySelector('.spans5');
                const spans3 = row.querySelector('.spans3');
                
                if (spans5 && spans3) {
                    const label = spans5.textContent?.trim().replace(/\s+/g, ' ');
                    const value = spans3.textContent?.trim().replace(/\s+/g, ' ');
                    
                    if (label && value) {
                        stats[label] = value;
                    }
                }
            });
            
            // Method 3: Extract weather stats and icon
            // Structure: <div class="weather-stat"><div class="weather-label">LABEL</div><div class="weather-value">VALUE</div></div>
            const weatherIcon = doc.querySelector('.weather-icon');
            if (weatherIcon) {
                const iconClass = weatherIcon.className;
                stats['__weatherIcon'] = iconClass; // Store icon class with special prefix
            }
            
            doc.querySelectorAll('.weather-stat').forEach(stat => {
                const labelDiv = stat.querySelector('.weather-label');
                const valueDiv = stat.querySelector('.weather-value');
                
                if (labelDiv) {
                    const label = labelDiv.textContent?.trim().replace(/\s+/g, ' ');
                    
                    if (valueDiv) {
                        const value = valueDiv.textContent?.trim().replace(/\s+/g, ' ');
                        if (label && value) {
                            stats[label] = value;
                        }
                    } else {
                        // Weather condition without value (e.g., "Windy")
                        if (label) {
                            stats[label] = '✓';
                        }
                    }
                }
            });

            // Extract device info
            const deviceEl = doc.querySelector('.device');
            if (deviceEl) {
                const deviceText = deviceEl.textContent?.trim();
                if (deviceText) {
                    stats['Device'] = deviceText;
                }
            }

            // Extract bike/gear info - Method 1: from links
            const gearLinks = doc.querySelectorAll('a[href*="/bikes/"], a[href*="/shoes/"]');
            if (gearLinks.length > 0) {
                const gearText = gearLinks[0].textContent?.trim();
                if (gearText) {
                    const href = gearLinks[0].getAttribute('href') || '';
                    if (href.includes('/bikes/')) {
                        stats['Bike'] = gearText;
                    } else if (href.includes('/shoes/')) {
                        stats['Shoes'] = gearText;
                    }
                }
            }

            // Extract bike/gear info - Method 2: from .gear div (newer format)
            const gearDiv = doc.querySelector('.gear');
            if (gearDiv && !stats['Bike'] && !stats['Shoes']) {
                const gearText = gearDiv.textContent?.trim();
                if (gearText) {
                    // Format: "Bike: Orange Pinarello" or "Shoes: Nike Pegasus"
                    if (gearText.toLowerCase().includes('bike:')) {
                        const bikeName = gearText.replace(/^bike:\s*/i, '').trim();
                        if (bikeName) stats['Bike'] = bikeName;
                    } else if (gearText.toLowerCase().includes('shoes:')) {
                        const shoesName = gearText.replace(/^shoes:\s*/i, '').trim();
                        if (shoesName) stats['Shoes'] = shoesName;
                    }
                }
            }

            return stats;
        },

        displayExpandedStats(activity, stats) {
            // Remove existing stats container if any
            const existing = activity.querySelector('.sff-expanded-stats');
            if (existing) existing.remove();

            // Organize stats into structured format
            const organizedStats = this.organizeStats(stats);

            // If no stats available (only device/bike), don't show anything
            if (organizedStats.length === 0) {
                return null;
            }

            // Create stats container
            const statsContainer = document.createElement('div');
            statsContainer.className = 'sff-expanded-stats';

            // Build stats HTML
            let statsHTML = '<div class="sff-stats-grid">';
            
            organizedStats.forEach(stat => {
                if (stat.isHeader) {
                    // Close current grid and add section header
                    statsHTML += '</div>';
                    if (stat.weatherIcon && stat.weatherCondition) {
                        // Weather header with icon and condition: "Weather: [icon] Clear"
                        statsHTML += `<div class="sff-stats-section-header">${stat.label}: <div class="${stat.weatherIcon}" style="display: inline-block; width: 24px; height: 24px; margin: 0 4px; vertical-align: middle;"></div>${stat.weatherCondition}</div>`;
                    } else if (stat.weatherIcon) {
                        // Weather header with icon only
                        statsHTML += `<div class="sff-stats-section-header">${stat.label}: <div class="${stat.weatherIcon}" style="display: inline-block; width: 24px; height: 24px; margin-left: 4px; vertical-align: middle;"></div></div>`;
                    } else {
                        statsHTML += `<div class="sff-stats-section-header">${stat.label}</div>`;
                    }
                    statsHTML += '<div class="sff-stats-grid">';
                } else {
                    statsHTML += '<div class="sff-stat-item">';
                    statsHTML += `<span class="sff-stat-label">${stat.label}</span>`;
                    
                    if (stat.avg && stat.max) {
                        // Has both avg and max
                        statsHTML += `<span class="sff-stat-value"><b>Avg:</b> ${stat.avg}</span>`;
                        statsHTML += `<span class="sff-stat-subvalue"><b>Max:</b> ${stat.max}</span>`;
                    } else {
                        // Single value
                        statsHTML += `<span class="sff-stat-value">${stat.value}</span>`;
                    }
                    
                    statsHTML += '</div>';
                }
            });
            
            statsHTML += '</div>';
            statsContainer.innerHTML = statsHTML;

            // Find the best insertion point - should be as wide as the map/images
            // Look for the wider container that holds both content and images
            const achievementSummary = activity.querySelector('[data-testid="achievement_summary"]');
            const contentSection = activity.querySelector('.hWGNo, .ZbtW4');
            const imagesSection = activity.querySelector('[data-testid="entry-images"]');
            const kudosSection = activity.querySelector('[data-testid="kudos_comments_container"]');
            
            // Find the parent that contains both content and images (for full width)
            let insertionPoint = null;
            
            if (kudosSection) {
                // Insert before kudos section (after images/map) - best position for full width
                insertionPoint = kudosSection.parentElement;
                if (insertionPoint) {
                    kudosSection.before(statsContainer);
                }
            } else if (imagesSection) {
                // Insert after images section
                imagesSection.after(statsContainer);
            } else if (achievementSummary) {
                // Insert after achievement summary
                const parentSection = achievementSummary.closest('.hWGNo, .ZbtW4');
                if (parentSection) {
                    parentSection.after(statsContainer);
                } else {
                    achievementSummary.after(statsContainer);
                }
            } else if (contentSection) {
                // Insert after content section
                contentSection.after(statsContainer);
            } else {
                // Last resort: find the activity container
                const activityContainer = activity.querySelector('[data-testid="activity_entry_container"]');
                if (activityContainer) {
                    activityContainer.appendChild(statsContainer);
                }
            }

            return statsContainer;
        },

        organizeStats(rawStats) {
            // Use all stats (including Device, Bike, Shoes, Gear)
            const filtered = { ...rawStats };

            const organized = [];
            const weatherStats = [];
            const gearStats = [];
            const processed = new Set();
            
            // Extract and store weather icon separately
            const weatherIcon = filtered['__weatherIcon'];
            delete filtered['__weatherIcon']; // Remove from stats to avoid displaying it
            
            // Extract weather condition (Clear, Cloudy, etc.) for header
            let weatherCondition = null;
            const conditionKeywords = ['Partly Cloudy', 'Mostly Cloudy', 'Overcast', 'Clear', 'Cloudy', 'Sunny', 'Rainy', 'Windy'];
            for (const keyword of conditionKeywords) {
                // Check both exact match and lowercase match
                if (filtered[keyword]) {
                    weatherCondition = keyword;
                    delete filtered[keyword]; // Remove from stats to avoid duplication
                    break;
                } else if (filtered[keyword.toLowerCase()]) {
                    weatherCondition = filtered[keyword.toLowerCase()];
                    delete filtered[keyword.toLowerCase()];
                    break;
                }
            }

            // Define weather-related keywords (excluding condition keywords since they're in header)
            const weatherKeywords = ['temperature', 'humidity', 'wind', 'feels like', 'weather'];

            // Normalize "Heartrate" to "Heart Rate" to avoid duplicates
            if (filtered['Heartrate Avg'] && !filtered['Heart Rate Avg']) {
                filtered['Heart Rate Avg'] = filtered['Heartrate Avg'];
                delete filtered['Heartrate Avg'];
            }
            if (filtered['Heartrate Max'] && !filtered['Heart Rate Max']) {
                filtered['Heart Rate Max'] = filtered['Heartrate Max'];
                delete filtered['Heartrate Max'];
            }

            // Define stat groups that should be combined (avg/max pairs)
            const statGroups = [
                { base: 'Speed', label: 'Speed' },
                { base: 'Heart Rate', label: 'Heart Rate' },
                { base: 'Cadence', label: 'Cadence' },
                { base: 'Power', label: 'Power' },
                { base: 'Pace', label: 'Pace' },
                { base: 'Grade', label: 'Grade' },
                { base: 'VAM', label: 'VAM' }
            ];

            // Process grouped stats (avg/max pairs)
            // Now stats come in as "Speed Avg" and "Speed Max" format
            statGroups.forEach(group => {
                const avgKey = group.label + ' Avg';
                const maxKey = group.label + ' Max';
                
                const avgValue = filtered[avgKey];
                const maxValue = filtered[maxKey];

                if (avgValue || maxValue) {
                    if (avgValue && maxValue) {
                        organized.push({
                            label: group.label,
                            avg: avgValue,
                            max: maxValue
                        });
                        processed.add(avgKey);
                        processed.add(maxKey);
                    } else if (avgValue) {
                        organized.push({
                            label: group.label,
                            value: avgValue
                        });
                        processed.add(avgKey);
                    } else if (maxValue) {
                        organized.push({
                            label: group.label,
                            value: maxValue
                        });
                        processed.add(maxKey);
                    }
                }
            });

            // Group time-related stats together
            const timeStats = [];
            const timeKeywords = ['moving time', 'elapsed time'];
            
            // Define gear-related keywords
            const gearKeywords = ['device', 'bike', 'shoes', 'gear'];
            
            // Separate weather stats, time stats, and gear stats from regular stats
            Object.keys(filtered).forEach(key => {
                if (!processed.has(key)) {
                    const lowerKey = key.toLowerCase();
                    const isWeather = weatherKeywords.some(keyword => lowerKey.includes(keyword));
                    const isTime = timeKeywords.some(keyword => lowerKey.includes(keyword));
                    const isGear = gearKeywords.some(keyword => lowerKey === keyword);
                    
                    const stat = {
                        label: key,
                        value: filtered[key]
                    };
                    
                    if (isWeather) {
                        weatherStats.push(stat);
                    } else if (isTime) {
                        timeStats.push(stat);
                    } else if (isGear) {
                        gearStats.push(stat);
                    } else {
                        organized.push(stat);
                    }
                    processed.add(key);
                }
            });
            
            // Calculate Time stopped (Elapsed - Moving)
            const movingTimeStat = timeStats.find(s => s.label.toLowerCase().includes('moving time'));
            const elapsedTimeStat = timeStats.find(s => s.label.toLowerCase().includes('elapsed time'));
            
            if (movingTimeStat && elapsedTimeStat) {
                const movingSeconds = this.parseTimeToSeconds(movingTimeStat.value);
                const elapsedSeconds = this.parseTimeToSeconds(elapsedTimeStat.value);
                
                if (movingSeconds !== null && elapsedSeconds !== null && elapsedSeconds > movingSeconds) {
                    const stoppedSeconds = elapsedSeconds - movingSeconds;
                    const stoppedTime = this.formatSecondsToTime(stoppedSeconds);
                    
                    // Insert Time stopped after Elapsed Time
                    const elapsedIndex = timeStats.indexOf(elapsedTimeStat);
                    timeStats.splice(elapsedIndex + 1, 0, {
                        label: 'Time stopped',
                        value: stoppedTime
                    });
                }
            }
            
            // Add time stats after the grouped stats but before other stats
            // Insert them at the beginning of the organized array
            organized.unshift(...timeStats);

            // Add weather section header and stats at the end if we have weather data
            if (weatherStats.length > 0) {
                organized.push({
                    isHeader: true,
                    label: 'Weather',
                    weatherIcon: weatherIcon, // Pass icon class to header
                    weatherCondition: weatherCondition // Pass condition (Clear, Cloudy, etc.)
                });
                organized.push(...weatherStats);
            }

            // Add gear section header and stats at the end if we have gear data
            if (gearStats.length > 0) {
                organized.push({
                    isHeader: true,
                    label: 'Equipment'
                });
                organized.push(...gearStats);
            }

            return organized;
        },

        parseTimeToSeconds(timeString) {
            // Parse time strings like "1h 23m 45s", "45m 30s", "2h 15m", "30s", "1:37:39", "43:48", etc.
            if (!timeString) return null;
            
            let totalSeconds = 0;
            
            // Check for colon-separated format first (HH:MM:SS or MM:SS)
            if (timeString.includes(':')) {
                const parts = timeString.split(':').map(p => parseInt(p.trim()));
                if (parts.length === 3) {
                    // HH:MM:SS format
                    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                    // MM:SS format
                    totalSeconds = parts[0] * 60 + parts[1];
                }
                return totalSeconds;
            }
            
            // Otherwise check for h/m/s suffix format
            const hourMatch = timeString.match(/(\d+)h/);
            const minMatch = timeString.match(/(\d+)m/);
            const secMatch = timeString.match(/(\d+)s/);
            
            if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
            if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
            if (secMatch) totalSeconds += parseInt(secMatch[1]);
            
            return totalSeconds;
        },

        formatSecondsToTime(seconds) {
            // Format seconds back to "Xh Ym Zs" format
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            let result = '';
            if (hours > 0) result += `${hours}h `;
            if (minutes > 0) result += `${minutes}m `;
            if (secs > 0 || result === '') result += `${secs}s`;
            
            return result.trim();
        },

        setupAutoFilter() {
            let isFiltering = false;
            const debouncedFilter = UtilsModule.debounce(() => {
                if (isFiltering) return; // Prevent concurrent filter runs
                isFiltering = true;
                try {
                    this.filterActivities();
                    this.updateGiftVisibility();
                    this.updateStartTrialVisibility();
                    this.updateChallengesVisibility();
                    this.updateSuggestedFriendsVisibility();
                    this.updateYourClubsVisibility();
                    this.updateMyWindsockVisibility();
                    this.updateWandrerVisibility();
                    this.updateSummitbagVisibility();
                    this.updateRunHealthVisibility();
                    this.updateBandokVisibility();
                    this.updateCorosVisibility();
                    this.updateJoinWorkoutVisibility();
                    this.updateCoachCatVisibility();
                    this.updateAthleteJoinedClubVisibility();
                    this.manageSeeMoreButtons();
                } catch (e) {
                    console.error('Auto-filter error:', e);
                } finally {
                    isFiltering = false;
                }
            }, 500); // Increased debounce to reduce filter frequency

            const observer = new MutationObserver((mutations) => {
                let hasNewActivities = false;
                
                for (const m of mutations) {
                    if (!m.addedNodes || m.addedNodes.length === 0) continue;
                    for (const node of m.addedNodes) {
                        if (!(node instanceof HTMLElement)) continue;
                        
                        // Immediately hide new activity nodes if they match filter criteria
                        // This prevents flickering before debounced filter runs
                        if (settings.enabled && node.matches && node.matches('.activity, .feed-entry, [data-testid="web-feed-entry"]')) {
                            this.filterSingleActivity(node);
                            hasNewActivities = true;
                        } else if (node.querySelector?.('.activity, .feed-entry, [data-testid="web-feed-entry"]')) {
                            // If container has activities, filter them immediately
                            const activities = node.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');
                            activities.forEach(act => this.filterSingleActivity(act));
                            hasNewActivities = true;
                        }
                    }
                }
                
                // Only trigger debounced filter if we actually found new activities
                if (hasNewActivities) {
                    debouncedFilter();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Don't filter on scroll - only when new activities are added
            // window.addEventListener('scroll', debouncedFilter, { passive: true });
            window.__sffObserver = observer;
        },

        // Master function to apply all filters (activities and sections) based on enabled state
        applyAllFilters() {
            if (settings.enabled) {
                // When filter is enabled, apply all filtering
                this.filterActivities();
                this.updateGiftVisibility();
                this.updateStartTrialVisibility();
                this.updateChallengesVisibility();
                this.updateFooterVisibility();
                this.updateJoinedChallengesVisibility();
                this.updateSuggestedFriendsVisibility();
                this.updateYourClubsVisibility();
                this.updateMyWindsockVisibility();
                this.updateWandrerVisibility();
                this.updateSummitbagVisibility();
                this.updateRunHealthVisibility();
                this.updateBandokVisibility();
                this.updateCorosVisibility();
                this.updateJoinWorkoutVisibility();
                this.updateCoachCatVisibility();
                this.updateAthleteJoinedClubVisibility();
                this.manageHeaderKudosButton();
                this.manageSeeMoreButtons();
                UIModule.syncSecondaryKudosVisibility();
            } else {
                // When filter is disabled, show all activities and reset sections
                const activities = document.querySelectorAll('.activity, .feed-entry, [data-testid="web-feed-entry"]');
                activities.forEach(activity => {
                    activity.style.display = '';
                });

                // Reset all sections to visible
                const challengesSection = document.querySelector('#your-challenges');
                if (challengesSection && challengesSection.dataset.sffHiddenBy === 'sff') {
                    challengesSection.style.display = '';
                    delete challengesSection.dataset.sffHiddenBy;
                }

                const suggestedFriendsSection = document.querySelector('#suggested-follows');
                if (suggestedFriendsSection && suggestedFriendsSection.dataset.sffHiddenBy === 'sff') {
                    suggestedFriendsSection.style.display = '';
                    delete suggestedFriendsSection.dataset.sffHiddenBy;
                }

                const yourClubsSection = document.querySelector('#your-clubs');
                if (yourClubsSection && yourClubsSection.dataset.sffHiddenBy === 'sff') {
                    yourClubsSection.style.display = '';
                    delete yourClubsSection.dataset.sffHiddenBy;
                }

                const giftLinks = document.querySelectorAll('a[href*="/gift"][href*="origin=global_nav"]');
                giftLinks.forEach(a => {
                    if (a.dataset.sffHiddenBy === 'sff') {
                        a.style.display = '';
                        delete a.dataset.sffHiddenBy;
                    }
                });
                
                // Reset Start Trial button visibility
                const startTrialLinks = document.querySelectorAll('li.nav-item.upgrade a[href*="/subscribe"][href*="cta=free-trial"]');
                startTrialLinks.forEach(a => {
                    const li = a.closest('li.nav-item.upgrade');
                    const targetElement = li || a;
                    if (targetElement.dataset.sffHiddenBy === 'sff') {
                        targetElement.style.display = '';
                        delete targetElement.dataset.sffHiddenBy;
                    }
                });
                // Reset footer visibility
                this.updateFooterVisibility();
                // Reset joined challenges
                const entries = document.querySelectorAll('[data-testid="web-feed-entry"], .feed-entry, .activity');
                entries.forEach(entry => {
                    if (entry.dataset.sffHiddenChallenge === 'sff') {
                        entry.style.display = '';
                        delete entry.dataset.sffHiddenChallenge;
                    }
                });

                const btn = document.querySelector('.sff-clean-btn .sff-btn-sub');
                const secondaryBtn = document.querySelector('.sff-secondary-filter-btn .sff-btn-sub');
                if (btn) btn.textContent = '(0)';
                if (secondaryBtn) secondaryBtn.textContent = '(0)';
            }
        }
    };

    // Initialize utilities and update settings references
    let settings = null;












    // Observe DOM for new activities and re-apply filters automatically

    // ==== SFF SECTION: INIT BOOTSTRAP ====
    // Setup global features that work on all pages
    let globalFeaturesInitialized = false;
    function setupGlobalFeatures() {
        if (globalFeaturesInitialized) return;
        globalFeaturesInitialized = true;

        // Apply gift button hiding immediately
        LogicModule.updateGiftVisibility();
        
        // Apply Start Trial button hiding immediately
        LogicModule.updateStartTrialVisibility();

        // Apply challenges section hiding immediately
        LogicModule.updateChallengesVisibility();

        // Apply suggested friends section hiding immediately
        LogicModule.updateSuggestedFriendsVisibility();

        // Apply your clubs section hiding immediately
        LogicModule.updateYourClubsVisibility();

        // Apply footer hiding immediately
        LogicModule.updateFooterVisibility();

        // Apply external service embed hiding immediately
        LogicModule.updateMyWindsockVisibility();
        LogicModule.updateWandrerVisibility();
        LogicModule.updateSummitbagVisibility();
        LogicModule.updateRunHealthVisibility();
        LogicModule.updateBandokVisibility();
        LogicModule.updateCorosVisibility();
        LogicModule.updateJoinWorkoutVisibility();
        LogicModule.updateCoachCatVisibility();

        // Setup observer for dynamically loaded content to hide gift buttons and challenges
        const observer = new MutationObserver(() => {
            LogicModule.updateGiftVisibility();
            LogicModule.updateStartTrialVisibility();
            LogicModule.updateChallengesVisibility();
            LogicModule.updateFooterVisibility();
            LogicModule.updateJoinedChallengesVisibility();
            LogicModule.updateSuggestedFriendsVisibility();
            LogicModule.updateYourClubsVisibility();
            LogicModule.updateMyWindsockVisibility();
            LogicModule.updateWandrerVisibility();
            LogicModule.updateSummitbagVisibility();
            LogicModule.updateRunHealthVisibility();
            LogicModule.updateBandokVisibility();
            LogicModule.updateCorosVisibility();
            LogicModule.updateJoinWorkoutVisibility();
            LogicModule.updateCoachCatVisibility();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Store observer for cleanup if needed
        window.__sffGlobalObserver = observer;

        // Popup-based controls are handled via browser action; no content panel needed
    }

    // Initialize
    async function init() {
        console.log('🔧 Clean Filter: Initializing...');
        console.log('📍 Current URL:', window.location.pathname);

        // Load settings before any feature uses them
        if (!settings) {
            try {
                settings = await UtilsModule.loadSettings();
                console.log('✅ Settings loaded:', settings.enabled);
            } catch (e) {
                console.error('Failed to load settings, using defaults:', e);
                settings = { ...DEFAULTS };
            }
        }

        // Always setup global features on all pages
        setupGlobalFeatures();

        // Only create UI elements and run filtering on dashboard
        const isDashboard = UtilsModule.isOnDashboard();
        console.log('📊 Is dashboard:', isDashboard);
        
        if (isDashboard) {
            // Mark body as dashboard for responsive CSS that relies on this flag
            document.body.setAttribute('data-sff-dashboard', 'true');
            console.log('🏷️ Dashboard attribute set');
            
            // Always create UI elements so users can toggle filtering on/off
            const existingPanel = document.querySelector('.sff-clean-panel');
            console.log('🔍 Existing panel:', existingPanel ? 'Found' : 'Not found');
            
            if (!existingPanel) {
                console.log('🔨 Creating UI elements...');
                UIModule.createElements();
            }
            
            // Ensure secondary kudos button is properly synchronized
            UIModule.syncSecondaryKudosVisibility();
            // Ensure header kudos button is created/removed according to settings immediately
            LogicModule.manageHeaderKudosButton();
            // Inject "See more" buttons on activities
            LogicModule.manageSeeMoreButtons();
            LogicModule.filterActivities();
            LogicModule.setupAutoFilter();
        }
    }

    // Listen for popup toggle messages to enable/disable and re-apply filters
    try {
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
            browser.runtime.onMessage.addListener((msg) => {
                if (msg && msg.type === 'SFF_TOGGLE_ENABLED') {
                    settings.enabled = !!msg.enabled;
                    try { UtilsModule.saveSettings(settings); } catch (e) {}
                    // On dashboard: ensure UI exists and update toggle state
                    if (UtilsModule.isOnDashboard()) {
                        if (!document.querySelector('.sff-clean-panel')) {
                            try { UIModule.createElements(); } catch (e) {}
                        }
                        // Update toggle checkbox and text to reflect new state
                        const toggleCheckbox = document.querySelector('.sff-enabled-toggle');
                        const toggleText = document.querySelector('.sff-toggle-text');
                        if (toggleCheckbox) toggleCheckbox.checked = settings.enabled;
                        if (toggleText) toggleText.textContent = `FILTER ${settings.enabled ? 'ON' : 'OFF'}`;
                        
                        try { UIModule.syncSecondaryKudosVisibility(); } catch (e) {}
                        try { LogicModule.filterActivities(); } catch (e) {}
                        try { LogicModule.setupAutoFilter(); } catch (e) {}
                    }
                    try { LogicModule.applyAllFilters(); } catch (e) {}
                }
                // Handle settings import/update
                if (msg && msg.type === 'SFF_SETTINGS_UPDATED') {
                    // Reload settings from storage and refresh everything
                    UtilsModule.loadSettings().then(newSettings => {
                        settings = newSettings;
                        // Reload the page to apply new settings
                        location.reload();
                    }).catch(e => {
                        console.error('Failed to reload settings:', e);
                        location.reload(); // Reload anyway
                    });
                }
            });
        }
    } catch (e) {
        console.warn('Failed to attach runtime message listener:', e);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle navigation changes in SPA
    let currentPath = window.location.pathname;
    const checkPageChange = () => {
        if (window.location.pathname !== currentPath) {
            currentPath = window.location.pathname;

            if (UtilsModule.isOnDashboard()) {
                // We navigated to dashboard, initialize dashboard-specific features
                document.body.setAttribute('data-sff-dashboard', 'true');
                if (!document.querySelector('.sff-secondary-nav')) {
                    // Create dashboard elements if they don't exist
                    const existingElements = document.querySelectorAll('.sff-clean-btn, .sff-clean-panel');
                    if (existingElements.length === 0) {
                        init();
                    }
                }
                // Ensure secondary kudos button visibility is synchronized after navigation
                setTimeout(() => UIModule.syncSecondaryKudosVisibility(), 100);
            } else {
                // We navigated away from dashboard, cleanup dashboard-specific elements
                document.body.removeAttribute('data-sff-dashboard');
                document.querySelectorAll('.sff-clean-btn, .sff-clean-panel, .sff-secondary-nav').forEach(el => el.remove());
                // Remove header kudos button if it exists
                const kudosLi = document.getElementById('gj-kudos-li');
                if (kudosLi && kudosLi.dataset.addedByScript) {
                    kudosLi.remove();
                }
            }
        }
    };

    // Check for page changes periodically
    setInterval(checkPageChange, 500);

    console.log('✅ Clean Filter: Setup complete');

})();
// ===== End original script body =====
