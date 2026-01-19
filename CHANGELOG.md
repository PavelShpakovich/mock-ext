# Changelog

All notable changes to Moq Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.2] - 2026-01-19

### Changed
- **Rebranding**: Extension renamed from "MockAPI" to "Moq"
  - Updated extension name across all UI, documentation, and code
  - Updated custom header from `X-MockAPI` to `X-Moq`
  - Updated export filename prefix from `mockapi-rules-` to `moq-rules-`
  - Updated all console log prefixes from `[MockAPI]` to `[Moq]`
  - Updated package name from `mockapi-extension` to `moq-extension`
  - Updated message type constants (e.g., `MOCKAPI_INTERCEPTED` to `MOQ_INTERCEPTED`)
  - Updated window property from `__MOCKAPI_INTERCEPTOR__` to `__MOQ_INTERCEPTOR__`
- **Description**: Updated extension description to better highlight key features

## [2.7.1] - 2026-01-18

### Changed
- **Code Architecture**: Major refactoring of App component following React best practices
  - Extracted business logic into 5 custom hooks for better separation of concerns
  - Created `useRulesManager` for all rule CRUD operations and validation
  - Created `useFoldersManager` for folder management logic
  - Created `useRecording` for recording, settings, and request log management
  - Created `useCrossContextSync` for cross-context message handling
  - Created `useStandaloneWindowStatus` for standalone window status polling
  - Reduced App.tsx from 570 to ~350 lines with clearer organization
  - Improved code maintainability, readability, and testability
  - All handlers properly memoized with useCallback for better performance
  - Added comprehensive JSDoc comments for all custom hooks
  - Single Responsibility Principle applied throughout

## [2.7.0] - 2026-01-18

### Added
- **View Mode Switcher**: Open Moq in standalone window or DevTools panel
  - **"Open in Window" button** in DevTools header with ExternalLink icon
  - **Standalone window mode**: 800×600 popup window for multi-monitor setups
  - **Single instance enforcement**: Overlay blocks DevTools when window is open
  - **Full state synchronization**: Changes in one context instantly reflect in the other
    - Rules, folders, settings, and request log all sync automatically
    - Recording state syncs (start/stop in either context)
    - Enable/disable all, CORS toggle sync across contexts
  - **Context detection utilities**: Automatic detection of DevTools, standalone window, or popup
  - **Window management**: Automatic focus if window already open, cleanup on close
  - **Internationalization**: Full EN/RU translations for all window-related UI
- **Dynamic Variables Hint**: Added tooltip in Response Body field
  - Shows available dynamic variables: `{{timestamp}}`, `{{uuid}}`, `{{random_number}}`, `{{random_string}}`
  - Helps users discover this previously undocumented feature
  - Info icon with hover tooltip for better discoverability

### Changed
- **Cross-context messaging**: Enhanced message broadcasting for complete state sync
  - Added `rulesUpdated`, `settingsUpdated`, `foldersUpdated`, `requestLogUpdated` actions
  - All state changes now broadcast to other contexts automatically
  - Ensures DevTools and standalone window stay perfectly in sync

### Technical
- Created `/public/window.html` for standalone window entry point
- Added `openStandaloneWindow` and `getStandaloneWindowStatus` to background.js
- Created `/src/helpers/context.ts` with context detection utilities
- Created `StandaloneWindowOverlay` component for blocking DevTools when window open
- Enhanced `TextArea` component with `labelHint` prop for inline tooltips

## [2.6.1] - 2026-01-17

### Fixed
- **HTTP Method Detection**: Fixed critical bug where all fetch requests with Request objects were logged as GET
  - Now correctly extracts method from Request object's `.method` property
  - Methods are normalized to uppercase for consistency (POST, PUT, DELETE, etc.)
  - Fixes matching rules by HTTP method for non-GET requests
- **Relative URL Handling**: Fixed crash when clicking "Mock This" on requests with relative URLs
  - Safe pathname extraction with fallback for relative URLs like `/api/endpoint`
  - No longer requires absolute URLs for mock rule creation
- **Empty Folders Display**: Fixed bug where empty folders weren't shown when no rules exist
  - Empty state now only displays when both rules and folders are absent
  - Folders without rules are now properly displayed
- **Rule Item Overflow**: Fixed action buttons overflowing outside card on long URLs
  - Added `min-w-0` to flex container to properly constrain content width
  - Long URL patterns now limited to 2 lines with ellipsis (`line-clamp-2`)
  - Changed `break-all` to `break-words` for better text wrapping

### Changed
- **UI Polish**:
  - ConfirmDialog: Refactored to use flexbox with `gap-6` for cleaner spacing
  - Toast: Replaced HTML entity `×` with lucide-react X icon for consistency
  - Toast: Changed from transparent to solid opaque backgrounds for better visibility
  - Toggle: Added highlighted green ring border when enabled for better visual feedback
  - Toggle: Added separate dark mode green color variant (`dark:peer-checked:bg-green-500`)

## [2.6.0] - 2026-01-16

### Added
- **Rule Groups/Folders**: Complete folder organization system for managing mock rules
  - **Create Folders**: Organize rules into logical groups (e.g., "User API", "Payment API")
  - **Folder Management**: Create, rename, and delete folders with validation
    - Name uniqueness validation (case-insensitive)
    - Length limits (max 50 characters)
    - Modal dialog for folder creation and renaming
  - **Bulk Operations**: Enable/disable all rules in a folder with one click
  - **Collapse/Expand**: Minimize folders to save screen space
    - Visual indicators (chevron icons) for collapsed/expanded state
    - Folder icon changes when collapsed
    - Click anywhere on folder card to expand/collapse
  - **Ungrouped Rules**: Special section for rules without folders
  - **Visual Badges**: 
    - Rule count badge per folder shown inline with folder name
    - Enabled rules count badge (green)
  - **Smart Delete**: Deleting a folder ungroups its rules instead of deleting them
  - **Search Integration**: Search works seamlessly across all folders
  - **Hover Actions**: Folder action buttons appear on hover for cleaner UI
  - **Full i18n Support**: All folder features translated in English and Russian
  - **Folder Assignment in Rule Editor**: Select folder when creating or editing rules
    - Dropdown selector with "No folder (ungrouped)" option
    - Optional field clearly marked

### Added - Technical
- **New Components**:
  - `FolderItem.tsx`: Display folder with collapse/expand, badges, and bulk actions
  - `FolderEditor.tsx`: Modal dialog for creating/renaming folders with validation
  - `RulesSearchBar.tsx`: Extracted search input component
  - `RulesToolbar.tsx`: Compact toolbar with icon buttons for actions
  - `SelectableRuleItem.tsx`: Rule item with selection checkbox
  - `RulesEmptyState.tsx`: Empty state display component
  - `RulesList.tsx`: Folder tree and rules list display
- **New Helper Module**: `helpers/folderManagement.ts` with 10+ utility functions
  - `createFolder()`, `renameFolder()`, `toggleFolderCollapse()`
  - `getRulesGroupedByFolder()`, `getFolderRuleCounts()`
  - `moveRuleToFolder()`, `deleteFolderAndUngroup()`
  - `toggleFolderRules()`, `validateFolderName()`
- **Storage**: Added `folders` array to chrome.storage.local
- **Types**: Extended `MockRule` with optional `folderId`, added `Folder` interface
- **Tests**: 20 comprehensive unit tests for all folder management helpers
  - Total test count increased from 194 to 214
  - All tests passing with 100% coverage of folder helpers

### Changed
- **RulesTab**: Completely refactored into atomic components for better maintainability
  - Main component reduced from ~370 lines to ~195 lines
  - Split into 5 focused components (SearchBar, Toolbar, EmptyState, SelectableRuleItem, RulesList)
  - Improved readability and testability
- **RulesToolbar**: Redesigned for more compact layout
  - Icon-only buttons for secondary actions (import, export, select, create folder)
  - Prominent "Add Rule" button on the right
  - Uses `justify-between` layout instead of centered button row
  - Significantly reduced visual clutter and vertical space usage
- **FolderItem UI**: Enhanced visual design and interactions
  - Toggle button changes variant: Ghost when all enabled, Primary when some disabled
  - Better visual hierarchy with conditional button styling
  - Action buttons have proper spacing (gap-2)
  - Entire card clickable for expand/collapse
- **RuleItem Display**: Hit count now shown inline with rule name
  - Format: "Rule Name (5)" instead of separate badge
  - Cleaner, more compact visual design
- **Selection Checkboxes**: Improved styling with smaller size and no outline
  - Changed from medium to small IconButton size
  - Removed focus ring and outline for cleaner appearance
  - Icon size reduced from 5x5 to 6x6 for better balance
- **Internationalization**: Fixed hardcoded "Mocked" text in RequestItem
  - Added `requests.mocked` translation key
  - Fully translated in English and Russian
- **App.tsx**: Added folder state management and 6 new handler functions
- **UI Layout**: Rule list now shows hierarchical folder structure instead of flat list

## [2.5.0] - 2026-01-16

### Changed
- **Code Architecture Refactoring**: Comprehensive modular redesign for better maintainability
  - **Helper Modules**: Extracted business logic into dedicated helper files
    - `recording.ts`: Recording functionality (tab validation, message sending, settings management)
    - `importExport.ts`: Import/export logic (validation, merging, statistics, file operations)
    - `headers.ts`: HTTP header utilities (conversion, extraction, filtering)
    - `ruleForm.ts`: Form data initialization from rules and captured requests
    - `ruleValidation.ts`: Enhanced with detailed JSON validation and form validation
  - **Atomic UI Components**: Reusable components following atomic design principles
    - `RadioOption`: Radio button with label and description
    - `StatItem`: Icon + label + value statistics display
    - `DialogHeader`: Consistent modal header with close button
    - `InfoPanel`: Contextual information panels with variants (info, warning, danger)
    - `HeadersEditor`: Reusable HTTP headers editor component
  - **Component Size Reduction**: Major components refactored for better readability
    - `App.tsx`: Reduced from 400 to 280 lines (-30%)
    - `RuleEditor.tsx`: Reduced from 400 to 280 lines (-30%)
    - `ImportDialog.tsx`: Reduced from 155 to 129 lines (-18%)
  - **Comprehensive Testing**: Added 81 unit tests for all helper modules
    - Test coverage: recording, importExport, headers, ruleForm, ruleValidation
    - Total tests: 194 (was 113)
    - All tests passing with proper mocking

### Added
- **Import/Export Enhancement**: Advanced rule management with user control
  - **Export Selected Rules**: Select specific rules to export, not just all rules
    - Selection mode with checkbox UI
    - Select All / Deselect All functionality
    - Export selected button showing count
  - **Import Preview Dialog**: Review and confirm imports before applying
    - Shows number of rules found in import file
    - Visual statistics with icons and color coding
    - Cancel option to abort import
  - **Import Modes**: User choice between merge and replace
    - **Merge Mode**: Add new rules and skip duplicates (safe, preserves existing)
      - Shows count of new rules to add
      - Shows count of duplicates that will be skipped
      - Shows total rule count after merge
    - **Replace Mode**: Delete all existing rules and import new ones
      - Warning banner with alert icon
      - Shows count of rules to remove
      - Shows count of rules to add
      - Red color coding for danger awareness
  - **Duplicate Detection**: Intelligent matching by rule ID
  - **Validation**: Import files checked for required fields
  - **Full i18n Support**: All import/export features translated in EN/RU

### Technical
- ImportDialog component with radio button mode selection
- Selection mode state management with Set<string>
- Checkbox overlays with z-index positioning
- Conditional preview sections based on mode
- Type-safe optional selectedIds parameter
- Helper functions: validateImportedRules, mergeImportedRules

## [2.4.0] - 2026-01-15

### Added
- **Dark/Light Theme Support**: Complete theme system with automatic system preference detection
  - **Three Theme Options**: System (auto), Light, and Dark modes
  - **System Preference Detection**: Automatically detects and follows OS theme preference
  - **Settings Menu**: New gear icon dropdown for theme and language selection
  - **Optimized Color Scheme**: Enhanced visibility across both themes
    - Light theme: Darker green shades (green-600+) for better readability
    - Dark theme: Lighter green shades (green-400-500) for contrast
  - **Full Component Coverage**: All UI components updated with theme support
    - Buttons, Cards, Inputs, Selects, TextAreas, Toggles
    - Rules, Requests, Filters, Badges, Tabs
    - Headers, Modals, Dropdowns, Menus
  - **Persistent Storage**: Theme preference saved in chrome.storage.local
  - **Instant Switching**: Theme changes apply immediately without reload
  - **Full i18n Support**: All theme-related text translated in EN/RU

### Changed
- **Header Redesign**: Moved language selector to Settings menu to reduce clutter
- **Component Architecture**: Created reusable atomic components
  - MenuOption and MenuSection for dropdown menus
  - FilterButton and FilterSection for filter panels
  - useClickOutside hook for outside-click detection
- **Tailwind CSS 4.x**: Upgraded dark mode configuration using CSS @variant

### Technical
- Tailwind CSS 4.x dark mode: `@variant dark (&:is(.dark, .dark *))`
- ThemeContext with system preference listener
- Atomic component pattern for improved maintainability
- Consistent cursor-pointer on all interactive elements

## [2.3.0] - 2026-01-15

### Added
- **Rule Validation & Warnings**: Intelligent validation system that detects and displays potential issues with mock rules
  - **Invalid Regex Detection**: Shows error when regex pattern is malformed with specific error message
  - **Invalid JSON Detection**: Highlights JSON syntax errors in response body
  - **Overlapping Rules Detection**: Warns when multiple enabled rules could match the same URL (shows count and related rule IDs)
  - **Unused Rule Detection**: Flags rules that haven't been matched in 30+ days (info level)
  - **Visual Indicators**: Color-coded warning badges in rule cards
    - Red: Errors (invalid regex, invalid JSON) - requires immediate attention
    - Yellow: Warnings (overlapping rules) - suggests review
    - Blue: Info (unused rules) - informational only
  - **Smart Icons**: Context-appropriate icons (AlertCircle, AlertTriangle, Info)
  - **Auto-Validation**: Runs automatically on:
    - Extension load
    - Rule creation/update
    - Rule deletion
    - Rule enable/disable toggle
  - **Method-Aware Overlap Detection**: Rules with different HTTP methods don't trigger overlap warnings
  - **Disabled Rule Filtering**: Only enabled rules are checked for overlaps
  - **Full i18n Support**: All warnings translated in English and Russian with plural forms
  - **Comprehensive Testing**: 20 new tests covering all validation scenarios

## [2.2.0] - 2026-01-15

### Added
- **CORS Auto-Fix**: Global toggle to automatically inject CORS headers for all mocked responses
  - One-click toggle in header with visual indicator (green when active)
  - Auto-injects required CORS headers:
    - `Access-Control-Allow-Origin: *`
    - `Access-Control-Allow-Methods: *`
    - `Access-Control-Allow-Headers: *`
    - `Access-Control-Allow-Credentials: true`
  - Works with both `fetch()` and `XMLHttpRequest`
  - Settings propagate instantly to all tabs
  - Automatically disabled when extension is turned off
  - Custom headers can still override auto-injected CORS headers if needed
  - Tooltip explains functionality: "Auto-inject CORS headers to bypass cross-origin restrictions"
  - Full internationalization support (English/Russian)
- **useBodyScrollLock Hook**: Reusable React hook for locking body scroll in modals
  - Prevents background page scroll when modals/overlays are open
  - Properly cleans up on unmount
  - Used in RuleEditor expanded view

### Changed
- **Improved Type Safety**: Removed all `any` types from content-script.ts
  - Added `RuntimeMessage` interface for background messages
  - Added `MessageResponse` interface for response structure
  - Added `PageMessageData` interface for page messages
  - Proper type checking for all message handlers
- **CORS Toggle Behavior**: Automatically turns off CORS when extension is disabled
  - Maintains clean state management
  - Prevents confusion about active features
- **Settings Propagation**: New `updateSettings` action for instant settings updates
  - Settings changes now propagate immediately to all tabs
  - No page refresh required for CORS toggle to take effect
  - Background script properly syncs settings state

### Fixed
- Delay text in rule items now uses translations instead of hardcoded "Delay: Xms"
  - English: "Delay: 500ms"
  - Russian: "Задержка: 500мс"
- CORS toggle color changed from blue to green for consistency with enabled state
- Background page scroll now properly locked when rule editor is in expanded mode

## [2.1.1] - 2026-01-15

### Added
- **Rule Hit Counter**: Track rule usage with match counts and last matched timestamps
  - Display hit count badge on each rule card
  - Show relative time since last match ("just now", "5 minutes ago", etc.)
  - Real-time updates when rules are matched
  - Counter persists through rule edits
  - Helps identify unused rules and debug which rules are triggering
- **Internationalized Time Formatting**: Full i18n support for relative time display
  - Proper plural forms for English ("1 minute", "2 minutes")
  - Correct Russian grammar ("1 минуту", "2 минуты", "5 минут")
  - Comprehensive plural form handling in translation context

### Fixed
- Plural form parsing in i18n context for nested curly braces
- Time formatting now fully respects language settings

### Tests
- Added 5 comprehensive tests for time formatting utilities
- Added 2 tests for time translation keys and plural forms
- Total test count: 93 tests (all passing)

## [2.1.0] - 2026-01-15

### Added
- **Custom Response Headers**: Full support for custom HTTP response headers in mock rules
  - Add, edit, and remove custom headers with key-value pairs
  - Headers automatically populate when mocking logged requests
  - Auto-filters standard headers (Content-Type, X-Moq) to show only relevant custom headers
  - UI includes convenient add/remove buttons for managing headers
- **Response Headers Capture**: Interceptor now captures all response headers from real requests
  - Captured headers stored in request log for reference
  - Headers available when creating mock rules from logged requests
  - Helps replicate real API behavior accurately
- **GitHub Copilot Instructions**: Comprehensive coding guidelines in `.github/copilot-instructions.md`
  - Complete project architecture documentation
  - Code style and pattern guidelines
  - TypeScript, React, and Tailwind CSS best practices
  - Chrome Extension specific patterns
  - Testing and error handling conventions

### Changed
- **Major Code Refactoring**: Improved codebase maintainability and readability
  - **interceptor.ts**: Extracted 15+ helper methods for better organization
    - Response capture: `notifyInterception()`, `captureResponseHeaders()`, `captureResponse()`
    - Mock response: `applyDelay()`, `prepareResponseBody()`, `buildResponseHeaders()`
    - URL matching: `matchesExact()`, `matchesWildcard()`, `matchesRegex()`
    - XHR handling: `createXHRResponseHeaders()`, `setupXHRResponse()`, `triggerXHREvents()`
  - **background.ts**: Extracted 10+ helper functions
    - Tab management: `isValidTab()`, `sendRulesToTab()`, `getEnabledRules()`
    - Badge management: `setBadge()`
    - Logging: `handleCapturedResponse()`, `handleMockedRequest()`
  - **content-script.ts**: Extracted 8 helper methods
    - Message routing: `handleRuntimeMessage()`, `handlePageMessage()`
    - UI prompt: `getTranslations()`, `getPromptStyles()`, `getPromptHTML()`
  - **storage.ts**: Extracted 6 helper methods with clear section organization
    - Buffer management: `scheduleLogFlush()`, `cancelLogFlush()`, `getStoredLog()`
  - **App.tsx**: Extracted 10+ helper functions
    - Recording: `isValidRecordingTab()`, `findValidWebTab()`, `startRecording()`
    - Rule operations: `updateRulesEverywhere()` eliminates code duplication
    - Import/Export: `validateImportedRules()`, `mergeImportedRules()`
  - **RuleEditor.tsx**: Extracted 8+ helper functions
    - Header utilities: `convertHeadersToArray()`, `convertArrayToHeaders()`
    - Form data: `getInitialFormData()`
    - Validation: `validateFormData()`, `buildMockRule()`
- **Code Quality Improvements**:
  - Applied Single Responsibility Principle throughout
  - Reduced function complexity by ~60%
  - Reduced code duplication by ~30%
  - Added section comments for better code organization
  - Extracted complex logic into named, testable functions
  - Flattened nested code with early returns

### Technical Details
- Total of 50+ helper functions/methods extracted across 6 files
- All refactoring maintains 100% test coverage (86 tests passing)
- No breaking changes or functionality regressions
- Build time remains stable at ~2.5s
- Improved developer experience with clearer code structure

## [2.0.3] - 2026-01-14

### Fixed
- **Query Parameter Matching**: URL matching now ignores query parameters for exact and wildcard matches
  - Exact match: Strips query params from both URL and pattern before comparing
  - Wildcard match: Strips query params unless pattern explicitly includes them
  - Fixes issue where requests with query params (e.g., `?includeCertificates=true`) wouldn't match rules
- **Extension Context Errors**: Eliminated "Extension context invalidated" errors during reload
  - Added context validation in `withContextCheck` before attempting chrome API calls
  - Removed problematic retry logic that caused additional errors
  - Content script now uses `withContextCheck` for all Storage operations

### Added
- **Match Type Descriptions**: Added helpful descriptions for each match type in the rule editor
  - Wildcard: "Use * for any characters. Example: https://api.example.com/users/*"
  - Exact Match: "Match exact URL path (ignores query parameters)"
  - Regex: "Use regular expressions. Example: https://api\\.example\\.com/users/\\d+"
  - Descriptions dynamically update based on selected match type

### Changed
- **CSP Compatibility**: Migrated to declarative MAIN world content script injection
  - Interceptor now injected via `manifest.json` content_scripts with `"world": "MAIN"`
  - Removed dynamic script injection code from content-script.ts
  - Extension now works on all websites including those with strict CSP (GitHub, Google, banking sites)
  - Removed `web_accessible_resources` (no longer needed with declarative injection)

### Technical Details
- Chrome Manifest V3's declarative MAIN world scripts are exempt from CSP restrictions
- Added sync warnings to duplicated code (interceptor.ts and helpers/) to prevent future mismatches
- URL matching logic is duplicated between interceptor.ts (MAIN world) and helpers/urlMatching.ts (extension context)

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
  - Downloads as `moq-rules-YYYY-MM-DD.json`
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
