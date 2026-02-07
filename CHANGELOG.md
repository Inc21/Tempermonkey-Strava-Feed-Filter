# Changelog

## [v2.7.0] - 31.01.2026 (Firefox & Chrome Extensions)

### v2.7.0 New Features

- **In-Panel Update Notification Banner**
  - Both Chrome and Firefox extensions now read their installed version from the manifest and compare it against a remote `version.json` hosted on GitHub.
  - When a newer version is available, a compact banner appears inside the filter panel with "Update Extension" and "View Changelog" buttons plus a square red dismiss [×] that matches the existing UI.
  - Banner respects dark mode, can be dismissed per-version, and never auto-redirects or adds permissions.
  - Version checks are cached for 24 hours and also fall back to a bundled `version.json` so local/dev builds can test without publishing first.
- **Keyword Preset Buttons**
  - Added Warm Up and Cool Down preset chips above the Keywords field.
  - Each preset inserts multiple spelling variations (warm-up, cooldown, etc.) without overwriting existing entries and works in dark mode.
- **Compact Header Buttons**
  - New "Compact Buttons" toggle in Appearance settings replaces the full-size Filter and Kudos header buttons with 32×32px icon+label squares that match the notification bell size.
  - Filter button shows a funnel icon with "SFF" label; Kudos button shows a thumbs-up icon with "ALL" label. Both use inline SVG for consistent white icon rendering.
  - Filter count badge (dark gray with white bold text) appears on the compact SFF button when filters are active.
  - Setting applies immediately without page reload and respects dark mode.
- **Share Button**
  - Shortened "Share extension" to "Share" and prevented text wrapping on narrow panels.

### v2.7.0 Improvements

- Added Firefox-specific metadata (manifest version bump to 2.7.0 and AMO link) so update parity matches Chrome.
- Introduced FORCE toggle for local testing (disabled in production) and ensured dismiss clicks don’t close the panel.

---

## [v2.6.1] - 11.01.2026 (Firefox & Chrome Extensions)

### v2.6.1 Bug Fixes

- **Climbing Index Icon**: Fixed case-sensitive filename issue for "Very Hilly" icon in Firefox extension (was preventing icon display on case-sensitive filesystems)

## [v2.6.0] - 11.01.2026 (Firefox & Chrome Extensions)

### v2.6.0 Features Added

- **Panel Dark Mode**: Full dark mode support matching Strava's theme
  - Dark background (#111111) with orange accents (#fc5200)
  - Secondary navigation bar with transparent background and dark buttons
  - Notification bell with proper dark mode styling
- **Climbing Index**: Added climbing index display with colored icons
  - Located in the "Show More Stats" panel for each activity
  - Visual representation of climbing difficulty based on meters per km (m/km):
    - 🟩 **Flat** (<3 m/km): Gray icon, minimal climbing
    - 🟩 **Gentle** (3-6 m/km): Green icon, mild rolling hills
    - 🟩 **Rolling** (6-9 m/km): Green icon, moderate climbing
    - 🟨 **Hilly** (9-13 m/km): Yellow icon, significant elevation gain
    - 🟧 **Very Hilly** (13-18 m/km): Yellow icon, steep and challenging
    - 🔴 **Mountainous** (18-25 m/km): Red icon, very steep
    - 🔴 **Extreme** (25+ m/km): Red icon, extreme elevation gain
  - Displays exact m/km value for precise climbing intensity assessment
- **Rouvy Filtering**: Added support for filtering Rouvy activities with "Hide Rouvy" option in External Services section

### v2.6.0 UI Enhancements

- **Visual Refresh**:
  - **Settings Icon**: Updated to a modern gear icon
  - **Navigation**: Added "Back to Filter" button for better navigation flow
  - **Close Button**: Updated to a distinct red [X] button style
  - **Filter Button Positioning**: Moved main filter button to Strava's header navigation (right after notification bell) on larger screens, with responsive fallback to fixed positioning on smaller screens

### v2.6.0 Bug Fixes

- **Dark Mode Styling**: Fixed CSS cascade order for notification bell dark mode rule to properly override base styles
- **Secondary Navigation**: Corrected dark mode background to white with proper button styling
- **Navigation Spacing**: Adjusted spacing between notification bell and filter button for consistent alignment with other nav items

### v2.6.0 Improvements

- **External Service Detection**: Enhanced detection logic for external services to look for domain names in activity text

---

## [v2.5.1] - 13.12.2025 (Firefox & Chrome Extensions)

### v2.5.1 Features Added

- **Enhanced Info Icons**: Changed blue ℹ icons to ? for better UX
- **More Compact Settings**: Reduced vertical spacing between settings by 62.5% for a more compact panel
- **Improved Pace Entry**: Users can now type 5.51 and it automatically converts to 5:51 format
- **COROS Embed Fix**: Fixed filtering for COROS external service embeds in activity descriptions

### v2.5.1 Show More Stats Improvements

- **Time of Day Field**: Added new "Time of the day" section with Start and End times as the first item in stats display
- **Hide Stats Button**: Added "Hide stats" button at the bottom of the stats panel to close the stats view
- **Scroll Position Restoration**: When hiding stats, the UI smoothly scrolls back to the previous position in the feed

### v2.5.1 Bug Fixes

- **Immediate Settings Updates**: Fixed issue where text-based settings (keywords, custom devices, numeric filters) required Apply & Refresh to take effect. Now all settings update immediately when the user leaves the input field or presses Enter.

---

## [v2.5.0] - 09.12.2025 (Firefox & Chrome Extensions)

### v2.5.0 Features Added

- **Compact Settings Panel with Info Icons**: Helper text moved to clickable info icons
  - All settings now have blue ℹ icons for explanations
  - Tooltips appear below icons with close button
  - Click outside tooltip to dismiss automatically
  - Saves significant UI space while maintaining accessibility
- **Recording Devices Filter**: New filter for hiding activities by device type
  - Predefined devices: Apple, Bryton, COROS, Elite, Fitbit, Garmin, Hammerhead, MyWhoosh, Peloton, Polar, Rouvy, Samsung, Stages, Strava, Suunto, Tacx, TrainerRoad, Wahoo, Wahoo SYSTM, Whoop, Zwift
  - Custom device text field for user-defined devices
  - Select All / Clear All quick actions
  - **Full support for group activities** - properly detects and filters based on devices used by all participants

### v2.5.0 UI/UX Improvements

- Settings panel now more compact with info icons replacing verbose helper text
- Tooltip positioning optimized for panel boundaries and screen space
- Better icon alignment with settings labels
- Consistent spacing and visual hierarchy throughout settings
- Recording devices displayed in multi-column grid layout (4 columns, responsive to 2 on mobile)

### v2.5.0 Bug Fixes

- Fixed info icon tooltip positioning to stay within viewport
- **Fixed device filter for group activities** - now properly checks all participants' devices
- Improved device detection to prioritize reliable metadata over user-editable activity names
  - Checks Virtual tag first (most reliable indicator)
  - Searches activity description and stats sections
  - Falls back to activity title only as last resort

---

All notable changes to this project will be documented in this file.

The format is based on [Semantic Versioning](https://semver.org/).

---

## [v2.4.7] - 30.11.2025 (Firefox & Chrome Extensions)

### v2.4.7 Bug Fixes

- **Chrome Extension**: Fixed message listener not working for popup communication
  - Changed from Firefox-only `browser.runtime.onMessage` to cross-browser compatible approach
  - Now properly checks for both `chrome.runtime.onMessage` and `browser.runtime.onMessage`
  - Ensures filter button loads immediately without needing to open popup first

### v2.4.7 Enhancements

- **Popup**: Added "See what's new in v{version}" link to both Chrome and Firefox extension popups
  - Links directly to GitHub CHANGELOG.md
  - Version number dynamically pulled from manifest
  - Positioned after the helper text for better visibility

---

## [v2.4.6] - 30.11.2025 (Firefox & Chrome Extensions)

### v2.4.6 Bug Fixes

- **Notification Badge**: Fixed notification badge not clearing when viewing notifications
  - Badge now properly marks all notifications as read when notification panel is opened
  - Implemented correct Strava API endpoint (`/frontend/athlete/notifications/mark_all_read`)
  - Added CSRF token authentication for API requests
  - Behavior now matches Strava's native notification system exactly
- **Badge Styling**: Fixed notification badge appearance in Chrome
  - Changed color from orange to red to match Strava's design
  - Adjusted size and positioning for better visual consistency
  - Badge now properly positioned at top-right corner with white border and shadow

### v2.4.6 Technical Improvements

- **"Hide Start Trial" Button**: Added missing functionality in Firefox extension
  - Feature now works correctly in both Chrome and Firefox extensions
  - Hides the orange "Start Trial" subscription button from header navigation
  - Specifically for Strava free users who haven't purchased a premium subscription yet
  - Users can enable this in Settings > Header Settings
  - Bug reported by Reddit user: andreasbeer1981
- Improved notification read state detection with more robust checking
- Enhanced error logging for notification API calls

---

## [v2.4.5] - 30.11.2025 (Firefox & Chrome Extensions)

### v2.4.5 Mobile-First Improvements

- **Mobile Notification System**: New notification bell button for mobile screens (≤990px)
  - Real-time notification badge with unread count
  - Tap to view dropdown with all notifications
  - Proper positioning below secondary nav bar
  - Auto-hides on desktop screens for cleaner UI
- **Responsive Panel Resizing**: Filter panel can now be resized from both left and right edges
  - Drag left handle to expand panel leftward
  - Drag right handle to expand panel rightward
  - Width constraints (280px - 600px) for optimal usability
  - Panel position persists across sessions
- **Viewport-Aware UI**: All mobile features respect screen width breakpoints
  - Notification bell: Only visible ≤990px
  - Secondary nav: Shows ≤1479px on dashboard
  - Automatic button repositioning based on viewport

### v2.4.5 Feature Parity Achieved

- **Chrome Extension**: Complete feature match with Firefox extension
  - "Show More Stats" button with full statistics display
  - Notification bell system
  - Bidirectional panel resizing
  - All responsive behaviors matched
- **Consistent Behavior**: Both extensions now have identical functionality across all screen sizes

### v2.4.5 Technical Improvements

- CSS media queries properly control notification bell visibility
- JavaScript no longer overrides responsive styles with inline `!important` rules
- Improved resize handle detection and event handling
- Better separation of concerns between CSS and JavaScript for responsive behavior

---

## [v2.4.2] - 24.11.2025 (Firefox Extension ALPHA)

### v2.4.2 Features Added - Firefox Extension Only

- **Group Activity Stats**: "Show More Stats" button now appears on individual activities within group rides
  - Each participant's activity in a group ride gets their own stats button
  - Stats are fetched and displayed for each individual activity
  - Proper positioning ensures stats appear below each activity's content

### v2.4.2 Bug Fixes - Firefox Extension Only

- Fixed duplicate Heart Rate entries in stats display
- Fixed Walk activity filtering - walks are now properly hidden when filtered
- Eliminated flickering during scroll by optimizing filter execution
- Fixed stats container width to match map/images width
- Improved stats container positioning for consistent display

---

## [v2.4.1] - 24.11.2025 (Firefox Extension ALPHA)

### v2.4.1 Features Added - Firefox Extension Only

- **Show More Stats**: New button on each activity to display detailed statistics including:
  - Time stats (Moving Time, Elapsed Time, Time Stopped)
  - Performance metrics (Speed, Heart Rate, Cadence, Power, Pace, etc.)
  - Weather conditions with icon display (Temperature, Humidity, Wind Speed/Direction, Feels Like)
  - Equipment tracking (Device, Bike, Shoes, Gear)
- **Weather Icon Integration**: Weather section header displays Strava's native weather icon alongside condition (e.g., "Weather: ☀️ Clear")
- **Resizable Panel**: Filter panel can now be resized horizontally by dragging the resize handle
- **Text Wrapping**: Long activity type names now wrap properly instead of being cut off
- **Auto-collapse Dropdowns**: Opening one dropdown section automatically closes others for cleaner UI

### v2.4.1 Improvements - Firefox Extension Only

- Enhanced stat extraction to handle multiple HTML formats from Strava
- Improved time parsing to support both "HH:MM:SS" and "1h 23m 45s" formats
- Weather conditions properly categorized and displayed with icons
- Panel width optimized for desktop (380px) vs mobile (320px) screens

### v2.4.1 Notes

- This is an ALPHA release for testing on AMO before bringing "Show More Stats" to Chrome

---

## [v2.3.3] - 24.11.2025 (Chrome Extension & Userscripts)

### v2.3.3 Features Added

- **New External Service Filters**:
  - Hide "Bandok.com" auto-generated activity names
  - Hide "COROS" device descriptions (e.g., "-- from COROS")
- **Athlete Ignore List**: Hide all activities from specific athletes
- **Settings Management**:
  - Import/Export settings as JSON
  - Reset settings to defaults
  - Improved settings panel organization

### v2.3.3 Improvements

- Enhanced external service embed filtering system
- Better athlete management with separate allowed/ignored lists
- Improved settings persistence and backup capabilities

---

## [v2.3.2] - 10.11.2025 (All Platforms)

### v2.3.2 Improvements

- Improved activity type detection to prioritise the most specific Strava label, preventing broad filters (e.g. "Run") from hiding specialised activities like "Trail Run".
- Added synonym and multi-source matching so group posts such as "rode with…" are classified correctly before applying filters.
- Synced the enhanced detection logic across the Tampermonkey userscript, Safari iOS variant, Chrome extension, and Firefox extension for consistent behaviour.
- Added quick Select All / Clear All toggles to the Activity Types panel in every build for rapid bulk filtering adjustments.

---

## [v2.3.1] - 26.10.2025 (Userscript)

### v2.3.1 Features Added

- Safari iOS–compatible userscript: `userscript/sff-safari.user.js`
- New filter: Hide activities tagged as "Commute"
- External service embeds: Added Wandrer to the hide list
- Preference to show/hide the "Give Kudos to Everyone" button; synced visibility for secondary nav button on smaller screens

### v2.3.1 Other Updates

- Minor responsive/UI tweaks for the settings panel and secondary navigation

---

## [v1.2.5] - 29.09.2025

### v1.2.5 Fixed

- Firefox Extension (Desktop & Android)
  - "Give Kudos to Everyone" header button now displays immediately on first load when enabled. The initialization now calls `manageHeaderKudosButton()` during dashboard startup in `firefox-extension/content/injected.js`.
  - ON/OFF toolbar badge now reflects the saved state on browser startup without opening the popup. Implemented `firefox-extension/background.js` and wired it in the manifest.

### v1.2.5 Changed

- Firefox manifest now uses `background.scripts` (instead of `background.service_worker`) to support temporary add-on installation during development.
- Dashboard `<body>` is marked with `data-sff-dashboard` on init to ensure responsive CSS applies immediately.
- Minor stability and synchronization improvements for secondary kudos button visibility.

---

## [v2.2.5] - 29.09.2025 (Chrome)

### v2.2.5 Added

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

### v2.2.5 Technical Details

- Cross-browser compatibility layer using `ext` shim for Chrome/Firefox APIs
- Message passing between popup and content script for real-time updates
- Complete CSS injection with responsive breakpoints and secondary nav support
- Modular architecture with UtilsModule, UIModule, and LogicModule separation

### v2.2.5 Installation Notes

- Test locally via Chrome → Extensions → Enable Developer mode → Load unpacked → select `chrome-extension/`.
- All Firefox features now available in Chrome with identical UI and functionality.

---

## [v1.2.4] - 27.09.2025

### v1.2.4 Added Features

- Firefox Extension (Desktop)
  - Toolbar popup with Enable/Disable toggle
  - ON/OFF toolbar badge (green/red)
  - Quick link to GitHub issues and an informational disclaimer
- Firefox for Android support for the Firefox extension (tested)
- New feed filters
  - Hide "JOIN workout" embed in activity descriptions
  - Hide "CoachCat Training Summary" embed in activity descriptions
  - Hide "Athlete joined a club" feed entries

### v1.2.4 Changed Behavior

- Userscript and extension now share consistent external-embed detection logic
- More robust detection for "joined a club" (uses group header anchor and CTA detection)
- UI copy and placement adjustments for the new filters

### v1.2.4 Important Notes

- Disclaimer: Strava occasionally changes the site. If something breaks, please report it on GitHub Issues before leaving a negative review so we can address it quickly.

---

## [v0.2.3] - 21.09.2025

### v0.2.3 New Features

- New dropdown in the separate sidebar to improve navigation and organization
- New filter: Hide athletes' joined challenges from the feed

### v0.2.3 UI Improvements

- Settings panel slightly widened for better readability
- Panel content scrollbar is now always visible to prevent layout flicker
- Replaced "All rights reserved" footer text with a link to report issues: [GitHub Issues](https://github.com/Inc21/Tempermonkey-Strava-Feed-Filter/issues)

---

## [v0.2.2] - 07.09.2025

### v0.2.2 Major Features Added

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

### v0.2.2 Logic Improvements

- **Granular Hiding Logic**: External service filters target only specific
  text elements (paragraphs, spans) with size limitations to avoid hiding
  important activity information
- **Master Toggle Integration**: External service filters respect the main
  filter toggle and are properly integrated with the master control system
- **Real-time Section Hiding**: Both new options take effect immediately
  without requiring page refresh
- **Global Section Management**: Section hiding works across all Strava
  pages where these sections appear

### v0.2.2 Filter Changes

- **Improved Challenge Filtering**: Updated "Hide challenges" to
  "Hide your challenges" for better clarity and now targets the specific
  "Your Challenges" section instead of individual challenge activities

---

## [v0.2.1] - 06.09.2025

### v0.2.1 Core Features Added

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

### v0.2.1 Performance Improvements

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

### v0.2.1 UI Enhancements

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

### v0.2.1 Technical Architecture

- **Code Organization**: Split monolithic script into functional modules
- **Memory Efficiency**: Reduced memory footprint through optimized algorithms
- **Maintainability**: Improved code structure for easier feature additions
- **Documentation**: Comprehensive inline documentation and architecture guides

---

## [v0.1.0] - 06.09.2025

### v0.1.0 Initial Release

- First working **Tampermonkey userscript**
- Basic floating, draggable filter panel with:
  - Simple keyword filter
  - Minimum distance filter
  - Basic activity type checkboxes
- Save & load filter preferences
- Hidden posts counter with unhide option
- Basic floating, draggable filter panel with:
  - Simple keyword filter
  - Minimum distance filter
  - Basic activity type checkboxes
- Save & load filter preferences
- Hidden posts counter with unhide option
