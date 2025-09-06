# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

- Work in progress features and fixes not yet released.

---

## [v0.2.1] - 2025-09-06

### Added

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
- **Challenge Filtering**: Hide challenge announcements and related posts
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

### Improved

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

### Enhanced

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

### Technical

- **Code Organization**: Split monolithic script into functional modules
- **Memory Efficiency**: Reduced memory footprint through optimized algorithms
- **Maintainability**: Improved code structure for easier feature additions
- **Documentation**: Comprehensive inline documentation and architecture guides

---

## [v0.1.0] - 2025-09-06

### Added

- First working **Tampermonkey userscript**
- Basic floating, draggable filter panel with:
  - Simple keyword filter
  - Minimum distance filter
  - Basic activity type checkboxes
- Save & load filter preferences
- Hidden posts counter with unhide option
