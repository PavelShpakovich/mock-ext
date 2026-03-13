# Changelog

All notable changes to Moq Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.15.2] - 2026-03-13

### Fixed
- **Folder-Aware Import/Export**: Rules organized in folders are no longer lost during import
  - Export now uses a versioned wrapper format (`{ version: 2, rules, folders }`) that includes all referenced folders and their ancestor chain
  - Import detects the format automatically: v2 files restore folder structure alongside rules; legacy v1 plain-array files have `folderId` stripped to prevent orphaned invisible rules
  - Both **Merge** and **Replace** import modes now correctly handle folders
  - `Storage.exportAll()` now includes folders in the exported data

## [2.15.1] - 2026-03-12

### Fixed
- **Ungrouped Rules Label Position**: "Ungrouped Rules" heading now appears directly above the ungrouped rule items instead of at the very top of the list before all folders

## [2.15.0] - 2026-03-11

### Added
- **Proxy Tab Import/Export**: Backup and restore proxy rules via JSON file
  - Export all proxy rules to a dated file (`moq-proxy-rules-YYYY-MM-DD.json`)
  - Import with smart merge strategy — duplicate IDs are skipped automatically
  - Security warning displayed when importing proxy rules containing response hooks
- **Proxy Compact View**: Toggle between detailed and compact layouts in the Proxy tab
  - Compact view shows each rule as a single row with name, match count, method badge, and action buttons
  - View preference persists for the session
  - Toolbar icons for switching views (matches Rules tab UX)
- **Path Rewrite for Proxy Rules**: Optionally rewrite the URL path when proxying
  - Configure a `from` pattern (plain string or regex) and a `to` replacement in the Proxy rule editor
  - Path rewrite is shown inline on the proxy rule card

### Changed
- **Controls Menu**: Replaced inline header toggles with a compact dropdown (⧉ icon)
  - Single entry point for Enable/Disable Moq, CORS Auto Fix (with live status text), Record, and Stop
  - Icon border turns red during recording and green when the extension is enabled
  - Reduces visual clutter in the header for small panel widths
- **ProxyRuleItem Redesign**: Proxy rule cards now match the layout and visual language of mock rule cards
  - Green card border when enabled, faded when disabled
  - URL displayed in a monospace code box
  - Proxy target shown with ArrowRightLeft icon in purple
  - Conflict warnings styled as amber bordered pills (matching validation warnings)
  - Match count and last-matched timestamp displayed consistently
- **ProxyEditor Collapsible Sections**: Section open/closed defaults now driven by `PROXY_EDITOR_SECTIONS_CONFIG` in `editorSections.ts` — same pattern as the Rule editor

### Fixed
- **Proxy Import Toast**: Success message now correctly shows the imported rule count instead of the literal `{count}` placeholder

## [2.14.1] - 2026-03-05

### Fixed
- **Group Enable/Disable Persistence**: Fixed issue where disabling all rules in a group would revert on page refresh
  - Group enable/disable operations now properly save to storage using `saveRules()` instead of `setRulesDirectly()`
  - Changes are now persisted across page refreshes and browser restarts

## [2.14.0] - 2026-02-28

### Changed
- **WXT Migration Cleanup**: Removed all legacy build configuration and entry point files
  - Removed old entry point files: `background.ts`, `content-script.ts`, `interceptor.ts`, `devtools-prompt.ts`, `devtools.ts`, `popup.tsx` (now in `entrypoints/` directory)
  - Removed `webpack.config.js` (replaced by `wxt.config.ts`)
  - Removed `public/manifest.json` (now generated from `wxt.config.ts`)
  - Updated all test mocks to support WXT's cross-browser `browser` API
  - All 283 tests passing after migration cleanup

### Fixed
- **Type Safety Improvements**: Resolved all TypeScript compilation errors (40 errors fixed)
  - Fixed Browser namespace type annotations throughout codebase
  - Improved type narrowing in I18nContext for translation lookups
  - Enhanced type safety in message response handlers
- **Code Quality**: Eliminated all ESLint warnings (50 warnings fixed)
  - Replaced all `any` types with `unknown` or proper type annotations
  - Added proper type guards for discriminated unions
  - Improved React hooks dependencies validation
  - Enhanced type safety in test files and validation helpers

## [2.13.0] - 2026-02-26

### Added
- **Collapsible Editor Sections**: Rule Editor sections are now collapsible to save screen space
  - 5 independent sections: Request Matching, Response Configuration, Response Headers, Response Body, and Response Hooks
  - Click section headers to expand/collapse with smooth chevron icon animations
  - Centralized configuration for default open/closed states (`editorSections.ts`)
  - Response Headers section defaults to closed to save space
  - Cursor pointer on headers for clear interaction affordance
  - Response Hooks section displays Enabled/Disabled badge in the header
  - Consistent visual design with color-coded accents (blue for request, green for response)
  - Fully internationalized with English and Russian translations

### Changed
- **Response Hook Section**: Removed nested collapsible, now integrates directly with main section
  - Section description displayed at the top for better visibility
  - Status badge moved to section header for at-a-glance state awareness
  - Simplified structure for more intuitive interaction

## [2.12.0] - 2026-02-26

### Added
- **Expanded Editor Search**: Full-featured search functionality in expanded editor (response body/hook editor)
  - Press Cmd/Ctrl+F to open search, prefills with selected text if available
  - Whole-word matching: queries with only word characters match complete words only
  - Navigate with Enter (next), Shift+Enter (previous), F3, or Cmd/Ctrl+G
  - Auto-scroll to center matches in viewport
  - Match counter shows current position (e.g., "3 of 12")
  - Press Esc to close search and return focus to editor
  - Intercepts browser's native find dialog to keep search within the editor
  - Fully internationalized (i18n) with English and Russian translations

### Changed
- **Code Quality**: Refactored ExpandedEditor component for better maintainability
  - Eliminated magic numbers - all numeric values now use descriptive named constants
  - Removed redundant comments, keeping only meaningful documentation
  - Improved code structure with clear separation of concerns
  - Enhanced type safety throughout the component

## [2.11.2] - 2026-02-26

### Fixed
- **Folder Deletion Behavior**: Deleting a folder now preserves nested content instead of making it disappear
  - Rules from the deleted folder are moved to its parent folder (or ungrouped at root)
  - Direct child folders are reparented to the deleted folder's parent
- **Rule Editor UX**: Improved update flow reliability so the editor closes consistently after save
- **Drag & Drop Feedback**: Restored visible drop-target highlighting when moving items into folders

### Changed
- **Folder Naming Policy**: Enforced globally unique folder names to avoid ambiguity in flat folder selectors

## [2.11.1] - 2026-02-26

### Fixed
- **Drag & Drop UI**: Fixed light/square corner artifacts visible on dragged cards
  - Switched sortable rule/folder items to use a custom native drag preview
  - Enforced rounded clipping and card background in drag preview rendering

### Changed
- **Internal Refactoring**: Simplified drag preview setup for maintainability
  - Extracted shared helper logic into `dragPreview.ts`
  - Removed duplicated preview setup code in sortable components

## [2.11.0] - 2026-02-26

### Changed
- **Internal Refactoring**: Eliminated hardcoded string types across the codebase
  - Introduced strongly-typed enums (`MessageActionType`, `ValidationSeverity`, `EditMode`) for Chrome runtime messaging, UI components, and state management
  - Improved code readability, maintainability, and type safety
  - Refactored all React hooks, background scripts, and content scripts to use the new enum-based messaging system

## [2.10.9] - 2026-02-12

### Fixed
- **UI Consistency**: Improved button styling consistency across the extension
  - Updated record button to use ghost button styling for consistent appearance with other controls
  - Aligned settings menu button colors with secondary button variant for better visual consistency
  - All buttons now follow consistent color and hover state patterns

## [2.10.8] - 2026-02-05

### Added
- **Import Security Warning**: Added security dialog when importing rules containing response hooks (executable JavaScript code)
  - Warns users before importing rules with executable code
  - Supports both English and Russian translations
  - Helps prevent accidental execution of untrusted code

### Improved
- **Performance**: Implemented regex pattern caching in request interceptor
  - Compiles regex patterns once and caches them for subsequent requests
  - Significantly reduces overhead for frequently matched URL patterns
  - Cache automatically clears when rules are updated
- **Storage Stability**: Added 5MB byte-size limit for session storage request logs
  - Prevents storage quota errors when capturing large responses
  - Removes oldest log entries when limit is exceeded
  - Maintains up to 1000 recent log entries

### Fixed
- **XHR Fidelity**: Added missing `responseURL` property to mocked XMLHttpRequest objects
  - Mocked XHR responses now include proper `responseURL` property
  - Matches real XMLHttpRequest behavior more accurately
  - Fixes compatibility issues with libraries that rely on `responseURL`

## [2.10.7] - 2026-02-04

### Fixed
- **Response Body Capture**: Removed the 100KB truncation limit for captured response bodies
  - Response bodies are now captured in full regardless of size
  - Eliminates `...[truncated]` markers that were causing issues for customers
  - Improves reliability when working with large API responses
  - Removed unnecessary truncation checks in content type detection

## [2.10.6] - 2026-02-02

### Fixed
- **CORS Auto Fix UI State**: Fixed race condition where CORS toggle could appear enabled in UI even when extension was disabled
  - Background script now reloads settings from storage before processing toggle to ensure consistency
  - Resolves visual inconsistency between actual CORS state and UI display

## [2.10.5] - 2026-02-02

### Fixed
- **CORS Auto Fix**: Fixed bug where network-level CORS rules could remain active even when the extension was disabled.
- **Reliability**: Refactored background script to strictly tie CORS auto-fix to the extension's master toggle state.
- **Initialization**: Improved ruleset synchronization during extension startup.

## [2.10.4] - 2026-01-29

### Fixed
- **Multi-Window Recording**: Fixed recording functionality to properly scope tab selection to the current browser window
  - Recording now correctly identifies and records tabs only within the active window
  - Prevents accidentally recording tabs from other browser windows
  - Resolves issues where recording would work "weirdly" with multiple Chrome windows open

## [2.10.3] - 2026-01-29

### Enhanced
- **CORS Auto Fix**: Significantly improved CORS handling using Chrome's `declarativeNetRequest` API
  - Network-level header modification bypasses browser CORS checks entirely
  - CORS headers now appear in browser Network tab (not just JavaScript responses)
  - Works for **all** HTTP requests (fetch/XMLHttpRequest) across any website
  - No longer requires creating mock rules for CORS-restricted endpoints
  - Instant, reliable CORS resolution for development and testing scenarios

## [2.10.2] - 2026-01-26

### Fixed
- **Standalone Window**: Fixed language synchronization issue
  - Language preference is now correctly passed when opening the standalone window
  - Added real-time synchronization between DevTools panel and Standalone Window
  - Changing language in one context immediately updates the other
- **Type Safety**: Cleaned up unused message types in `types.ts`

## [2.10.1] - 2026-01-26

### Security
- **ReDoS Protection**: Implemented defense-in-depth regex validation
  - Static analysis for nested quantifiers (e.g. `(a+)+`)
  - Runtime timeout protection (100ms) for regex execution of rules
- **Response Hook Sandboxing**: Hardened security for custom hooks
  - Blocked access to dangerous globals (`window`, `document`, `fetch`, `eval`)
  - Implemented `Proxy`-based global scope restriction
- **XSS Prevention**: Refactored internal UI injection
  - Replaced `innerHTML` usage with safer DOM `createElement` APIs in content scripts

### Fixed
- **Type Safety**: Improved TypeScript definitions for `MessageAction` discriminated unions
- **Build**: Fixed specific build errors related to `setTimeout` types
- **Tests**: Add comprehensive Service Worker test suite

### Changed
- **Simplified Content-Types**: Removed experimental XML/HTML support to focus on JSON/Text stability

## [2.10.0] - 2026-01-26

### Added
- **Google Chunked Response Support**: Full support for Google's chunked transfer format
  - Handles `)]}'` XSSI protection prefix automatically
  - Strips chunk size indicators (e.g., `144\n`, `25\n`) for proper parsing
  - Supports JavaScript code in responses (bare identifiers like `i` that aren't valid JSON)
  - New validation message: "Valid Google response format (JavaScript) ✓"
  - Added `parseGoogleJSON()` helper in response hooks for automatic chunk parsing
  - Added `stripGooglePrefix()` helper to clean XSSI-protected responses
- **Enhanced Content-Type Support**: Extended beyond JSON to handle multiple response formats
  - Added XML validation with `validateXMLDetailed()` using DOMParser
  - Added HTML content-type option in editor dropdown
  - Added JavaScript content-type option for script responses
  - Content-type auto-detection now recognizes XML, HTML, and JavaScript
  - Response editor validates both JSON and XML with detailed error messages
- **XML Response Hook Helpers**: New helpers for XML manipulation in response hooks
  - `parseXML(xmlString)` - Parse XML strings into DOM Document
  - `serializeXML(xmlDoc)` - Convert XML Document back to string
  - `DOMParser` and `XMLSerializer` now allowed in response hook validation
- **Automatic Page Reload on Recording Start**: Seamless recording initialization
  - Extension automatically reloads page if interceptor scripts aren't detected
  - Ensures all requests are captured from page load, including early network calls
  - User feedback via toast: "Page reloaded to activate request interceptor"
  - No manual refresh needed when starting recording on already-loaded pages
- **Content-Type Detection Helper**: Centralized and improved detection logic
  - New `detectContentType()` helper in `formatting.ts`
  - Detects Google chunked format: `/^\)\]\}'\s*\d+\n/`
  - Handles truncated responses intelligently
  - Smart fallback from `application/octet-stream` to `text/plain`
  - Reduced code duplication by ~55 lines

### Improved
- **XHR Logging Enhancements**: Complete XHR request capture
  - Added `captureXHRResponse()` method with proper `responseType` handling
  - XHR responses now logged even when not mocked
  - Request headers tracked and forwarded in passthrough mode
  - Fixed `responseText` access for different `responseType` values
  - Added support for `javascript` and `form-urlencoded` content types
- **Recording Infrastructure**: More robust script injection
  - Added `ping` handler for script presence detection
  - Improved `sendRulesToTab()` to return boolean status
  - Background service injects scripts to existing tabs on extension reload
  - Better error handling for restricted tabs (chrome://, extensions)
- **Validation Improvements**: More accurate and helpful feedback
  - Strengthened Google format detection (requires prefix + chunk sizes + array start)
  - Prevents false positives on regular JSON containing numbers
  - Line-by-line parsing for nested arrays in chunked responses
  - Handles partially valid chunked responses (shows X/Y valid chunks)
- **Toast Notifications**: Better UX with auto-dismiss
  - Toast messages now auto-close after 3 seconds
  - Stable `onClose` callback prevents timer resets
  - Clean animation and fade-out

### Fixed
- **Storage Race Condition**: Fixed log buffer flush timing
  - Captured buffer snapshot before clearing to prevent data loss
  - Eliminated race condition when multiple logs arrive simultaneously
- **Timestamp Tracking**: Accurate request timing
  - Added `timestamp` field to all intercepted requests
  - Mocked requests now include exact interception time
  - Improved chronological ordering in request log
- **Nested Array Parsing**: Robust Google response handling
  - Replaced fragile regex with line-by-line parsing
  - Correctly handles deeply nested arrays like `[[1,[2,3]]]`
  - Skips unparseable lines gracefully

### Developer Experience
- **Code Organization**: Better maintainability
  - Extracted content-type detection to reusable helper
  - Added comprehensive test coverage (43 tests passing)
  - Tests for Google prefix, chunked responses, false positive prevention
  - All builds successful with no errors

## [2.9.4] - 2026-01-24

### Fixed
- **Recording Tab Title Update**: Tab title now dynamically updates when navigating to different websites during recording
  - Added `chrome.tabs.onUpdated` listener in background script to detect tab navigation
  - Extension now broadcasts `recordingTabUpdated` message when recording tab title changes
  - Frontend automatically updates displayed tab title without requiring recording restart
  - Fixes issue where stale website title remained visible after navigation

## [2.9.3] - 2026-01-22

### Performance
- **Bundle Size Optimization**: Reduced initial popup bundle size by 65% (1.04 MB → 364 KB)
  - Implemented lazy loading for Prettier (~301 KB) - loads only when "Beautify" is clicked
  - Implemented lazy loading for validation dependencies (~74 KB) - loads only when validating response hooks
  - Created `lazyValidation.ts` wrapper for CSP-compliant async module loading
  - Updated webpack configuration to exclude lazy-loaded modules from vendor bundle
  - Heavy dependencies now load on-demand, significantly improving initial popup render time
- **Code Quality**: Eliminated code duplication in RuleEditor save logic
  - Extracted common validation and save logic into shared `saveRule` function
  - Improved maintainability and consistency across form submission handlers

## [2.9.2] - 2026-01-21

### Added
- **Theme-Aware Header Icon**: Extension logo now adapts to light/dark themes
  - Uses `icon128light.png` for light theme, `icon128.png` for dark theme
  - Automatically switches based on resolved theme (including system preference)
- **Quick Save Button**: Added check icon button in rule editor header for faster saving
  - Positioned next to close button for easy access
  - Shows validation errors when clicked (same as main save button)
  - Disabled state when response hook has validation errors

### Improved
- **Accessibility & Focus States**: Enhanced keyboard navigation across all interactive components
  - Replaced `focus:` with `focus-visible:` on Button, IconButton, TabButton, and Toggle
  - Focus rings now only appear for keyboard navigation, not mouse clicks
  - Cleaner visual experience while maintaining full accessibility compliance
- **Settings Menu UX**: Moved "Open Window" control from header toolbar to settings dropdown
  - Cleaner, less cluttered header layout
  - Logical grouping with other context management settings
  - Added smooth rotation animation to settings icon (90° when open)
- **Tab Design**: Simplified tab button styling for consistency with design system
  - Reduced padding and removed excessive shadows
  - Cleaner active state with green accent color
  - Better visual hierarchy and modern appearance
- **Validation Error Display**: Standardized error message styling across all form inputs
  - Consistent font weight (semibold) and sizing (text-sm)
  - Removed warning emoji for cleaner presentation
  - Removed HTML5 `required` attributes to prevent browser popups
  - Custom validation now works consistently from both save buttons

### Fixed
- **Validation Trigger**: Rule editor validation now properly triggers from icon button clicks
  - Created separate `handleSaveClick` handler for non-form submissions
  - Validation errors display correctly regardless of save method used

## [2.9.1] - 2026-01-21

### Fixed
- **Chrome Web Store Compatibility**: Fixed "Could not decode image" error preventing extension download
  - Converted extension icons from SVG to PNG format (required by Chrome Web Store)
  - Updated manifest.json to reference PNG icons (16x16, 48x48, 128x128)
  - Extension now properly displays in Chrome Web Store and extensions page

### Changed
- **Header Icon**: Updated to use extension's branded icon instead of generic network icon
  - Displays 128px PNG icon with rounded corners
  - Better brand recognition and visual consistency

## [2.9.0] - 2026-01-21

### Added
- **Response Hook Enable/Disable Toggle**: Added toggle control to enable/disable response hooks without deleting code
  - Toggle appears only when hook code exists (smart UI)
  - Visual status indicator shows enabled/disabled state with color-coded badges
  - Rules remember enable/disable state across sessions
  - Hooks are only executed when explicitly enabled via toggle
  - `responseHookEnabled` field added to rule interface (defaults to true for backward compatibility)

### Changed
- **Response Hook Validation**: Upgraded to comprehensive validation using eslint-scope
  - Now catches undefined variables (e.g., `sdawdaws` is properly flagged as error)
  - Correctly handles property accesses (e.g., `response.email` doesn't trigger false positives)
  - Proper scope analysis for local variables, function parameters, and closures
  - CSP-safe implementation using static analysis (no code execution)
  - Available globals: `response`, `request`, `helpers`, and JavaScript built-ins
  - Real-time validation with 500ms debounce for better UX
- **UI Improvements**:
  - Response hook validation error now displayed below textarea (was above)
  - Error display area now reserves space (52px min-height) to prevent layout shift
  - Passthrough mode note only shows when response hook is enabled
  - Status Code and Content Type fields aligned horizontally using flexbox
  - Select component gap changed from `gap-1` to `gap-2` for consistent height with Input

### Fixed
- Validation false positives for object property accesses in response hooks
- Layout shift when validation errors appear/disappear in response hook editor
- Passthrough mode note displaying even when response hook is disabled

## [2.8.0] - 2026-01-20

### Added
- **Response Mode Selection**: Choose how response hooks modify responses
  - **Mock Mode** (default): Apply hook to configured mock response body
  - **Passthrough Mode**: Forward real request to server and apply hook to real response
  - Mode selector only appears when response hook code exists (smart UI)
  - Enables powerful use cases like modifying real API responses on-the-fly
  - Uses atomic `RadioOption` component for consistent styling
  - Supports both `fetch()` and `XMLHttpRequest` interception
  - Backward compatible with existing rules (defaults to Mock mode)
- **ResponseMode Enum**: Added to project enums following code standards
  - Values: `ResponseMode.Mock` and `ResponseMode.Passthrough`
  - Used throughout codebase instead of string literals

### Changed
- **UI Improvements**:
  - Added close button (X icon) to Rule Editor header for better UX
  - Response Hook section title now uses subtle styling matching `labelHint` pattern
  - All components follow flexbox + gap layout pattern (no margin/space classes)
- **Type Safety**: All response mode references now use enum instead of string literals
- **Interceptor**: Enhanced to support both mock and passthrough response modes
  - `createPassthroughResponse()` forwards requests and modifies real responses
  - `handleXHRPassthrough()` handles XMLHttpRequest passthrough mode
  - Preserves original status codes and headers in passthrough mode
  - Applies CORS fixes when enabled in passthrough mode

## [2.7.3] - 2026-01-19

### Fixed
- **Theme Sync**: Theme changes now properly synchronize between DevTools and standalone window
  - ThemeContext now listens for `settingsUpdated` messages from other contexts
  - Theme changes in one context immediately reflect in the other
  - Fixes issue where theme remained out of sync when switching between contexts
- **UI Consistency**: All placeholder texts now start with a capital letter in both English and Russian

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
