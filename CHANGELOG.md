# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Semantic Versioning](https://semver.org/).

---

## [v2.3.2] - 10.11.2025 (All Platforms)

### Improvements

- Improved activity type detection to prioritise the most specific Strava label, preventing broad filters (e.g. "Run") from hiding specialised activities like "Trail Run".
- Added synonym and multi-source matching so group posts such as "rode with…" are classified correctly before applying filters.
- Synced the enhanced detection logic across the Tampermonkey userscript, Safari iOS variant, Chrome extension, and Firefox extension for consistent behaviour.
- Added quick Select All / Clear All toggles to the Activity Types panel in every build for rapid bulk filtering adjustments.

---

## [v2.3.1] - 26.10.2025 (Userscript)

### Features Added

- Safari iOS–compatible userscript: `userscript/sff-safari.user.js`
- New filter: Hide activities tagged as "Commute"
- External service embeds: Added Wandrer to the hide list
- Preference to show/hide the "Give Kudos to Everyone" button; synced visibility for secondary nav button on smaller screens

### Other Updates

- Minor responsive/UI tweaks for the settings panel and secondary navigation

---

## [v1.2.5] - 29.09.2025

### Fixed

- Firefox Extension (Desktop & Android)
  - "Give Kudos to Everyone" header button now displays immediately on first load when enabled. The initialization now calls `manageHeaderKudosButton()` during dashboard startup in `firefox-extension/content/injected.js`.
  - ON/OFF toolbar badge now reflects the saved state on browser startup without opening the popup. Implemented `firefox-extension/background.js` and wired it in the manifest.

### Changed

- Firefox manifest now uses `background.scripts` (instead of `background.service_worker`) to support temporary add-on installation during development.
- Dashboard `<body>` is marked with `data-sff-dashboard` on init to ensure responsive CSS applies immediately.
- Minor stability and synchronization improvements for secondary kudos button visibility.

---

## [v2.2.5] - 29.09.2025 (Chrome)

### Added

- **Complete feature parity with Firefox extension**:
  - Full filter UI panel with all sections (keywords, allowed athletes, activity types, distance/duration/elevation/pace ranges, map filtering, section hiding, external embeds filtering)
  - Draggable panel with position memory and responsive design
  - Secondary navigation for smaller screens with filter and kudos buttons
  - "Give Kudos to Everyone" header button with first-load visibility when enabled
  - Real-time activity counting and filter result updates
  - Unit system toggle (Metric/Imperial) with proper conversions
  - Auto-filtering with MutationObserver and scroll debounce
  - SPA navigation handling and page change detection
  - Popup toggle updates badge and notifies content script
  - Background script initializes and maintains badge state

### Technical Details

- Cross-browser compatibility layer using `ext` shim for Chrome/Firefox APIs
- Message passing between popup and content script for real-time updates
- Complete CSS injection with responsive breakpoints and secondary nav support
- Modular architecture with UtilsModule, UIModule, and LogicModule separation

### Installation Notes

- Test locally via Chrome → Extensions → Enable Developer mode → Load unpacked → select `chrome-extension/`.
- All Firefox features now available in Chrome with identical UI and functionality.

---

## [v1.2.4] - 27.09.2025

### Added Features

- Firefox Extension (Desktop)
  - Toolbar popup with Enable/Disable toggle
  - ON/OFF toolbar badge (green/red)
  - Quick link to GitHub issues and an informational disclaimer
- Firefox for Android support for the Firefox extension (tested)
- New feed filters
  - Hide "JOIN workout" embed in activity descriptions
  - Hide "CoachCat Training Summary" embed in activity descriptions
  - Hide "Athlete joined a club" feed entries

### Changed Behavior

- Userscript and extension now share consistent external-embed detection logic
- More robust detection for "joined a club" (uses group header anchor and CTA detection)
- UI copy and placement adjustments for the new filters

### Important Notes

- Disclaimer: Strava occasionally changes the site. If something breaks, please report it on GitHub Issues before leaving a negative review so we can address it quickly.

---

## [v0.2.3] - 21.09.2025

### New Features

- New dropdown in the separate sidebar to improve navigation and organization
- New filter: Hide athletes' joined challenges from the feed

### UI Improvements

- Settings panel slightly widened for better readability
- Panel content scrollbar is now always visible to prevent layout flicker
- Replaced "All rights reserved" footer text with a link to report issues: [GitHub Issues](https://github.com/Inc21/Tempermonkey-Strava-Feed-Filter/issues)

---

## [v0.2.2] - 07.09.2025

### Major Features Added

- **External Service Embeds Filtering**: New dedicated section for hiding
  third-party service embeds within activity descriptions
  - **Hide "myWindsock Report"**: Filter out myWindsock weather impact
    reports from activity descriptions
  - **Hide "summitbag.com"**: Remove summitbag.com elevation tracking
    embeds from activities
  - **Hide "Run Health"**: Filter out Run Health analysis content
    (`www.myTF.run`) from activities
- **Hide "Suggested Friends" Section**: Option to hide the "Suggested Friends"
  section from Strava pages
- **Hide "Your Clubs" Section**: Option to hide the "Your Clubs" section
  from Strava pages
- **Precise Content Filtering**: External service filters only hide the
  specific text content, preserving activity icons, titles, and stats
- **Real-time External Service Filtering**: All external service filters
  take effect immediately without requiring page refresh
- **Enhanced Debugging**: Comprehensive console logging for external
  service filter troubleshooting

### Logic Improvements

- **Granular Hiding Logic**: External service filters target only specific
  text elements (paragraphs, spans) with size limitations to avoid hiding
  important activity information
- **Master Toggle Integration**: External service filters respect the main
  filter toggle and are properly integrated with the master control system
- **Real-time Section Hiding**: Both new options take effect immediately
  without requiring page refresh
- **Global Section Management**: Section hiding works across all Strava
  pages where these sections appear

### Filter Changes

- **Improved Challenge Filtering**: Updated "Hide challenges" to
  "Hide your challenges" for better clarity and now targets the specific
  "Your Challenges" section instead of individual challenge activities

---

## [v0.2.1] - 06.09.2025

### Core Features Added

- **Comprehensive Activity Type Filtering**: Expanded from basic checkboxes to
  40+ activity types including Virtual activities, E-bikes, Winter sports,
  Water sports, and more
- **Advanced Distance/Duration/Elevation Filtering**: Min/Max range controls
  with unit conversion support
- **Pace Filtering for Runs**: Filter running activities by pace (min/km or
  min/mi) with intelligent pace calculation
- **Map Presence Filtering**: Option to hide activities without GPS maps
- **Allowed Athletes Override**: Whitelist specific athletes whose activities
  always show regardless of filters
- **Club Posts Filtering**: Option to hide club-related posts
- **Challenge Filtering**: Hide your challenges section
- **Unit System Support**: Switch between Metric (km, m, min/km) and Imperial
  (mi, ft, min/mi) units
- **"Give Kudos to Everyone" Button**: Convenience button to kudos all visible
  activities
- **Global Settings**: Hide "Give a Gift" button across all Strava pages
- **Responsive Design**: Adaptive layout for desktop, tablet, and mobile screens
- **Real-time Activity Counting**: Display "(X hidden / Y total)" counts for
  activity types
- **Enhanced UI**: Collapsible dropdown sections with organized filter
  categories

### Performance Improvements

- **Modular Architecture**: Complete refactoring into CSS, UI, Logic, and Utils modules
- **Performance Optimization**: Debounced filtering (250ms), efficient DOM
  queries, and throttled MutationObserver
- **Memory Management**: Optimized event handling and DOM manipulation
- **Panel Dragging**: Enhanced draggable functionality with viewport
  constraints and position memory
- **SPA Navigation Support**: Seamless integration with Strava's single-page
  application
- **Error Handling**: Robust error handling with graceful fallbacks
- **Cross-browser Compatibility**: Improved compatibility across major
  browsers

### UI Enhancements

- **Settings Panel**: Reorganized into logical sections with improved visual
  hierarchy
- **Filter Logic**: Short-circuiting filters with proper precedence and
  override handling
- **Data Parsing**: Robust parsing functions for distance, duration,
  elevation, and pace data
- **UI Responsiveness**: Smart button positioning that adapts to different
  screen sizes
- **Auto-filtering**: Automatically processes new activities as they load in
  the feed

### Technical Architecture

- **Code Organization**: Split monolithic script into functional modules
- **Memory Efficiency**: Reduced memory footprint through optimized algorithms
- **Maintainability**: Improved code structure for easier feature additions
- **Documentation**: Comprehensive inline documentation and architecture guides

---

## [v0.1.0] - 06.09.2025

### Initial Release

- First working **Tampermonkey userscript**
- Basic floating, draggable filter panel with:
  - Simple keyword filter
  - Minimum distance filter
  - Basic activity type checkboxes
- Save & load filter preferences
- Hidden posts counter with unhide option
