# Changelog

All notable changes to MockAPI Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2026-01-14

### Fixed
- **Chrome Web Store Compliance**: Removed unused `scripting` permission that caused extension rejection
- **Removed Unused Permissions**: Removed `webRequest` permission (obsolete after v2.0.0 architecture migration)
- **Updated Documentation**: Updated PRIVACY.md to accurately reflect only the permissions currently in use

### Changed
- **Permissions**: Reduced from 6 to 4 permissions (`storage`, `activeTab`, `tabs`, `contextMenus`)
- Extension now uses only the minimum required permissions for its functionality

## [2.0.1] - 2026-01-14

### Fixed
- **Duplicate Request Logging**: Removed redundant webRequest.onCompleted listener that caused requests to appear twice in the recording tab
- **Request Log Cleanup**: Request logging now exclusively handled by interceptor for better accuracy

### Changed
- **UUID Generation**: Migrated from custom UUID implementation to industry-standard `uuid` library (v4)
  - Updated ID generation in background.ts, App.tsx, and RuleEditor.tsx
  - Better RFC 4122 compliance and uniqueness guarantees
- **Code Cleanup**: Removed obsolete responseGenerator.ts and unused utility functions
  - Deleted: generateUUID(), isValidURL(), debounce() from utils.ts
  - Removed: responseGenerator.ts and its test file
  - Result: ~150 lines of dead code removed

### Added
- **Test Coverage**: Added 56 new unit tests across 3 new test suites
  - contextHandler.test.ts (7 tests) - Extension context invalidation handling
  - urlMatching.test.ts (36 tests) - URL matching logic (exact, wildcard, regex)
  - i18n.test.ts (20 tests) - Translation validation and language parity
- **Total Test Count**: 78 tests (up from 22)
- **Coverage**: utils.ts (100%), contextHandler.ts (100%), storage.ts (85%)

### Dependencies
- Added: uuid@^11.0.2
- Added: @types/uuid@^10.0.0

## [2.0.0] - 2026-01-13

### 🚀 Major Architecture Change: Client-Side Interception

**BREAKING CHANGE**: Completely redesigned the mocking architecture from Chrome's `declarativeNetRequest` API to client-side JavaScript interception. This is a major version bump due to fundamental changes in how requests are intercepted.

### Added

- **✅ Custom Status Codes**: Now correctly returns any HTTP status code (200, 404, 500, etc.)
  - Previously always returned 200 OK due to declarativeNetRequest limitations
  - Full control over status codes in both fetch() and XMLHttpRequest
- **✅ Response Delays**: Fully functional response delay simulation
  - Accurately simulates network latency for testing loading states
  - Works with both fetch() and XMLHttpRequest
- **✅ Client-Side Interception**: Intercepts requests at JavaScript level before they reach the network
  - `interceptor.ts`: Runs in MAIN world, intercepts fetch() and XMLHttpRequest
  - `content-script.ts`: Runs in ISOLATED world, bridges communication between page and extension
  - Real-time rule updates without page reload
- **🎨 Visual UI Improvements**: Enhanced visual design without text labels
  - Blue accent (border-left) for request matching section
  - Green accent (border-left) for response configuration section
  - Clean, professional appearance with pure visual separation
- **🐛 Comprehensive Debugging**: Added detailed logging for troubleshooting
  - Request matching logs with emoji indicators
  - Rule reception and update confirmations
  - Interception success/failure tracking

### Changed

- **Architecture**: Migrated from `declarativeNetRequest` to client-side interception
  - Removed dependency on Chrome's declarativeNetRequest API
  - Requests are now intercepted in page context before network calls
  - More reliable and powerful mocking capabilities
- **Permissions**: Updated manifest permissions
  - Removed `declarativeNetRequest` and `declarativeNetRequestFeedback`
  - Added content scripts with web_accessible_resources
- **Build System**: Added new webpack entry points
  - `interceptor.js`: MAIN world script
  - `content-script.js`: ISOLATED world bridge

### Fixed

- **NaN Errors**: Fixed multiple NaN parsing issues
  - Validated numeric values (delay, statusCode) before use
  - Proper Blob.size calculation for ProgressEvent
  - Safe defaults for invalid numeric values
- **Timing Issues**: Fixed race conditions in rule delivery
  - Content script now waits for interceptor to load
  - Rules are sent after interceptor initialization completes

### Technical Details

**Why This Change Was Necessary:**

Chrome's `declarativeNetRequest` API with REDIRECT action has fundamental limitations:
- Redirects to data URLs always return 200 OK status
- No mechanism for response delays
- Cannot capture response bodies
- Limited header control

**New Architecture:**

```
┌─────────────────────────────────────────────┐
│          Extension Background               │
│  - Manages rules in chrome.storage          │
│  - Sends updates to all tabs                │
└──────────────┬──────────────────────────────┘
               │ chrome.tabs.sendMessage
               ▼
┌─────────────────────────────────────────────┐
│       Content Script (ISOLATED world)       │
│  - Injects interceptor into page            │
│  - Forwards rule updates via postMessage    │
│  - Logs mocked requests to background       │
└──────────────┬──────────────────────────────┘
               │ window.postMessage
               ▼
┌─────────────────────────────────────────────┐
│        Interceptor (MAIN world)             │
│  - Wraps window.fetch()                     │
│  - Wraps window.XMLHttpRequest              │
│  - Matches URLs, returns mock responses     │
│  - Applies delays, status codes, headers    │
└─────────────────────────────────────────────┘
```

**Migration Note:**
Existing rules will continue to work. No user action required. The extension automatically uses the new interception method.

## [1.2.0] - 2026-01-13

### Fixed

- **HTTP Method Matching**: Rules now correctly filter by HTTP method (GET, POST, etc.) instead of matching all methods
- **Regex Pattern Support**: Regex match type now properly uses `regexFilter` instead of `urlFilter` in declarativeNetRequest rules

### Improved

- **Logging Performance**: Request logging is now significantly faster
  - Uses `chrome.storage.session` (in-memory) instead of `local` storage
  - Implements batched writes every 500ms instead of per-request writes
  - Reduces CPU/IO usage during high network activity
- **Extension Reliability**: Added graceful handling for extension context invalidation
  - Prevents crashes when service worker is terminated or extension is reloaded
  - Implements fallback values for Chrome API calls
  - Better error recovery for long-lived popup windows

### Removed

- Removed redundant `RuleMatcher` class - URL matching logic is now handled natively by the browser's declarativeNetRequest API
- The internal helper functions for matching are only used for log filtering, not rule processing

## [1.1.0] - 2026-01-12

### Added

- **Advanced Request Filtering**: New filtering system for request logs
  - Filter by HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS)
  - Filter by status code range (2xx, 3xx, 4xx, 5xx)
  - Collapsible filter panel with active filter count badge
  - Filters button positioned in header for easy access
- **Export/Import Rules**: Export rules to JSON file and import them back
  - Downloads as `mockapi-rules-YYYY-MM-DD.json`
  - Validates imported rules structure
  - Merges with existing rules avoiding duplicates
- **Duplicate Rule Feature**: Quick copy of existing rules
  - Creates new rule with "(Copy)" suffix
  - Generates new UUID automatically
- **Code Quality Tools**: Development infrastructure improvements
  - ESLint and Prettier configuration
  - Pre-commit hooks with husky and lint-staged
  - Pre-push hook runs full test suite
  - Comprehensive test suite with 58 passing tests

### Improved

- Cleaner request log UI with better filter organization
- All filter buttons have proper cursor-pointer styling
- Consistent button heights across the interface
- Better UX for managing large numbers of logged requests

### Technical

- New `FilterPanel` component with `FilterState` interface
- Enhanced `RequestsTab` with integrated filter logic
- Test coverage for utils, ruleMatcher, storage, and responseGenerator
- Jest testing infrastructure with React Testing Library
- Automated code formatting and linting on commit

## [1.0.1] - 2026-01-10

### Fixed

- Theme switching now works correctly - clicking theme button properly cycles through System/Light/Dark modes
- Create Rule button now properly adds new rules to the list instead of closing the editor
- Settings initialization error in background script that could prevent extension from loading
- Mock request data no longer persists when clicking "Add Rule" - prefilling only occurs when using "Mock This" button
- TypeScript type definitions for Theme and Settings interface

### Improved

- All UI text now uses proper internationalization (i18n)
- Added translated tooltips for all buttons (Edit, Delete, Mock This, Expand Editor)
- Language switcher tooltip now translates correctly
- Better error handling in background script initialization

### Technical

- Fixed Settings type to include theme property
- Improved RulesTab state management for mockRequest data
- Enhanced handleSaveRule logic to differentiate between new and existing rules

## [1.0.0] - 2026-01-10

### Added

- Initial release
- Mock API requests directly in Chrome DevTools
- Create custom mock rules with flexible URL pattern matching (wildcard, exact, regex)
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- Request recording and logging functionality
- Custom response status codes and content types
- Response delay simulation for testing loading states
- Dark theme with light theme support
- System theme detection and auto-switching
- Full internationalization support (English and Russian)
- DevTools panel integration
- Rule enable/disable toggle
- Search and filter rules
- Search and filter logged requests
- Create mock rules directly from logged requests
- JSON response validation and beautification
- Import/Export functionality for sharing rule configurations

### Features

- **Visual Rule Management**: Intuitive interface for creating and managing mock rules
- **Flexible Pattern Matching**: Wildcard, exact match, and regex support
- **Request Recording**: Capture and inspect HTTP requests in real-time
- **DevTools Integration**: Native Chrome DevTools panel experience
- **Multi-language Support**: English and Russian translations
- **Theme Support**: System, light, and dark themes with auto-detection
- **Quick Mock Creation**: One-click rule creation from logged requests
- **Response Customization**: Configure status codes, headers, delays, and content types
