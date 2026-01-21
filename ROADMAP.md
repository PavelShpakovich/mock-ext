# Moq Extension - Roadmap

This document outlines potential features and improvements for future releases.

## Active Priorities

### 1. Custom Response Headers ✅

**Estimated effort:** 30 minutes  
**Value:** High  
**Status:** ✅ **COMPLETED in v2.1.0**

- Add custom headers to mocked responses
- **Use cases:**
  - CORS headers for cross-origin requests
  - Authentication tokens in response headers
  - Content-Disposition for file downloads
  - Cache-Control directives
- **Implementation:**
  - ✅ Added `headers` field to `MockRule` interface
  - ✅ Updated interceptor to include custom headers in Response
  - ✅ Added header editor UI in rule editor
  - ✅ Auto-population from captured response headers
  - ✅ Response headers capture in request log

### 2. Rule Hit Counter ✅

**Estimated effort:** 1 hour  
**Value:** High  
**Status:** ✅ **COMPLETED in v2.1.1**

- Track how many times each rule has been matched
- Display "Last matched: X minutes ago" in UI
- **Benefits:**
  - Identify unused rules for cleanup
  - Debug which rules are actually triggering
  - Usage analytics
- **Implementation:**
  - ✅ Added `matchCount` and `lastMatched` to `MockRule`
  - ✅ Increment counter on each match in interceptor
  - ✅ Display counter badge and relative time in rules list UI
  - ✅ Real-time updates via message passing
  - ✅ Counter preservation through rule edits
  - ✅ Full internationalization support for time formatting

### 3. Import/Export Enhancement ✅

**Estimated effort:** 30 minutes  
**Value:** Medium  
**Status:** ✅ **COMPLETED in v2.5.0**

- **Implementation:**
  - ✅ Export all rules (implemented in v2.0.0)
  - ✅ Export selected rules with checkbox selection mode
  - ✅ Import rules from JSON file with merge strategy
  - ✅ Import with user choice: merge or replace all modes
  - ✅ Import preview/confirmation dialog with statistics
  - ✅ Duplicate detection by rule ID
  - ✅ Validation of required fields
  - ✅ Full internationalization support

### 4. Rule Groups/Folders ✅

**Estimated effort:** 3-4 hours  
**Value:** High  
**Status:** ✅ **COMPLETED in v2.6.0**

- ✅ Organize rules into folders
- **Features:**
  - ✅ Create folders (e.g., "User API", "Payment API", "Auth")
  - ✅ Rename and delete folders
  - ✅ Bulk enable/disable entire folders
  - ✅ Collapse/expand folders with visual indicators
  - ✅ Ungrouped rules section for rules without folders
  - ✅ Rule count and enabled count badges per folder
  - ✅ Search filtering works across folders
- **Implementation:**
  - ✅ Added `folderId` field to `MockRule`
  - ✅ Created `Folder` interface with collapse state
  - ✅ Updated UI with folder tree view
  - ✅ Added folder management (create, rename, delete)
  - ✅ Folder validation (name uniqueness, length limits)
  - ✅ Full internationalization support (EN/RU)
  - ✅ 20 comprehensive unit tests for folder helpers

### 5. CORS Auto-Fix ✅

**Estimated effort:** 1 hour  
**Value:** Medium  
**Status:** ✅ **COMPLETED in v2.2.0**

- Automatically inject CORS headers when needed
- **Features:**
  - ✅ Global toggle: "Enable CORS bypass for mocked responses"
  - ✅ Auto-inject headers:
    - `Access-Control-Allow-Origin: *`
    - `Access-Control-Allow-Methods: *`
    - `Access-Control-Allow-Headers: *`
    - `Access-Control-Allow-Credentials: true`
- **Implementation:**
  - ✅ Add setting in Settings interface
  - ✅ Inject headers in interceptor when enabled
  - ✅ UI toggle in header with tooltip
  - ✅ Settings propagated to all tabs

### 6. Dark/Light Theme ✅

**Estimated effort:** 2 hours  
**Value:** Low-Medium  
**Status:** ✅ **COMPLETED in v2.4.0**

- ✅ Theme toggle in settings (System/Light/Dark)
- ✅ Respect system preference with auto-detection
- ✅ Full component coverage across all UI elements
- ✅ Optimized color scheme for visibility in both themes
- ✅ Persistent storage with instant switching
- ✅ Settings menu integration to reduce header clutter

### 7. Rule Validation & Warnings ✅

**Estimated effort:** 2 hours  
**Value:** Medium  
**Status:** ✅ **COMPLETED in v2.3.0 (Unreleased)**

- Warn about:
  - ✅ Overlapping rules (multiple rules match same URL)
  - ✅ Invalid regex patterns (with specific error message)
  - ✅ Malformed JSON responses
  - ✅ Unused rules (never matched in 30 days)
- ✅ Display warnings in rules list with color-coded badges
- ✅ Smart icons based on severity (error/warning/info)
- ✅ Auto-validation on rule changes
- ✅ Method-aware overlap detection
- ✅ Full internationalization support
- ✅ Comprehensive test coverage (20 tests)

### 8. Dynamic Variables Support ✅

**Estimated effort:** Built-in  
**Value:** High  
**Status:** ✅ **COMPLETED** (feature exists but was undocumented)

- Use dynamic variables in mock responses
- **Available variables:**
  - `{{timestamp}}` - Current timestamp in milliseconds
  - `{{uuid}}` - Generated UUID v4
  - `{{random_number}}` - Random number (0-999999)
  - `{{random_string}}` - Random alphanumeric string
- **Implementation:**
  - ✅ Variables are automatically replaced in response body
  - ✅ Works with JSON and text responses
  - ✅ Applied at runtime for each request
  - ✅ Added UI tooltip to inform users (v2.6.2)

### 9. View Mode Switcher ✅

**Estimated effort:** 3-4 hours  
**Value:** Medium  
**Status:** ✅ **COMPLETED in v2.7.0**

- Switch between DevTools panel and standalone window
- **Features:**
  - ✅ "Open in Window" button in DevTools header
  - ✅ Standalone window (800x600 popup)
  - ✅ Context menu option on extension icon
  - ✅ Automatic window focus if already open
  - ✅ State synchronization across contexts
  - ✅ Full internationalization support (EN/RU)
- **Implementation:**
  - ✅ Created window.html for standalone mode
  - ✅ Added window management in background.js
  - ✅ Context detection utility (DevTools/Window/Popup)
  - ✅ ExternalLink icon button in header (DevTools only)
  - ✅ Window reference cleanup on close
- **Use cases:**
  - Multi-monitor setup: detach to separate screen
  - Work without DevTools open
  - Better for side-by-side testing workflow

### 10. Code Architecture Refactoring ✅

**Estimated effort:** 4-5 hours  
**Value:** High  
**Status:** ✅ **COMPLETED in v2.7.1**

- Refactor App component following React best practices
- **Goals:**
  - Improve code maintainability and readability
  - Better separation of concerns
  - Enhanced testability
  - Reduced component complexity
- **Implementation:**
  - ✅ Extracted 5 custom hooks for feature separation:
    - `useRulesManager` - All rule CRUD operations and validation
    - `useFoldersManager` - Folder management logic
    - `useRecording` - Recording, settings, and request log
    - `useCrossContextSync` - Cross-context message handling
    - `useStandaloneWindowStatus` - Window status polling
  - ✅ Reduced App.tsx from 570 to ~350 lines
  - ✅ Proper memoization with useCallback throughout
  - ✅ Clear code organization with section comments
  - ✅ Comprehensive JSDoc comments for all hooks
  - ✅ Single Responsibility Principle applied
  - ✅ Type safety improvements
- **Benefits:**
  - Each feature isolated in its own hook
  - Easier to locate and fix bugs
  - Improved performance (proper memoization)
  - Better developer experience
  - Future-proof architecture for scaling

### 11. Response Hook / Custom Modifier ✅

**Estimated effort:** 3-4 hours  
**Value:** High  
**Status:** ✅ **COMPLETED in v2.8.0**

- Allow custom JavaScript to modify mock responses before returning
- **Use cases:**
  - Dynamic data generation (timestamps, random IDs, UUIDs)
  - Response templating with variables
  - Computed fields based on request context
  - Add request-specific data to responses
- **Implementation:**
  - ✅ Added optional `responseHook` field to `MockRule` (JavaScript code as string)
  - ✅ Safe evaluation context with `response`, `request`, `helpers` objects
  - ✅ Helper functions: `randomId()`, `uuid()`, `timestamp()`, `randomNumber(min, max)`, `randomString(length)`
  - ✅ Executes before returning response in both fetch and XHR interceptors
  - ✅ Error handling with fallback to original response
  - ✅ Syntax validation with dangerous pattern detection
  - ✅ Collapsible UI section in rule editor with code examples
  - ✅ Hook validation integrated into form validation
- **Security:**
  - Sandboxed execution with Function constructor
  - Dangerous pattern detection (eval, import, require, fetch, etc.)
  - Isolated context (no window/document access)
  - Timeout protection via synchronous execution
  - Error catching with console logging
- **Example:**

  ```javascript
  // Add current timestamp to response
  response.timestamp = helpers.timestamp();

  // Generate dynamic ID
  response.id = helpers.uuid();

  // Echo request data in response
  response.requestedBy = request.headers['User-Agent'];

  // Modify array items
  if (response.items) {
    response.items.forEach((item, index) => {
      item.id = helpers.uuid();
      item.position = index + 1;
    });
  }
  ```

## Deferred Features

These features are valuable but deprioritized for now:

### Request Body Matching

**Estimated effort:** 1-2 hours

- Match rules based on POST/PUT request body content
- Use cases: Different responses for login credentials, form data
- **Reason for deferral:** Can be added later when needed

### Sequential Responses

**Estimated effort:** 2-3 hours

- Return different responses on successive calls
- Use cases: Testing pagination, state changes, retry logic
- **Reason for deferral:** Nice to have, not critical

### Request Headers Matching

**Estimated effort:** 2 hours

- Match rules based on request headers
- Use cases: Authorization levels, content negotiation
- **Reason for deferral:** Custom headers feature covers most use cases

### Response Templates Library

**Estimated effort:** 2 hours

- Pre-built templates (404, 500, pagination, etc.)
- **Reason for deferral:** Can be added as enhancement

### GraphQL Support

**Estimated effort:** 4-5 hours

- Parse GraphQL queries, match by operation name
- **Reason for deferral:** Specialized use case

### Response Delay Ranges

**Estimated effort:** 1 hour

- Random delay between min-max values
- **Reason for deferral:** Current fixed delay is sufficient

### Conditional Logic

**Estimated effort:** 5-6 hours

- JavaScript expressions for advanced matching
- **Reason for deferral:** Complex feature, needs careful design

### WebSocket Mocking

**Estimated effort:** 8-10 hours

- Mock WebSocket connections
- **Reason for deferral:** Specialized use case, significant effort

### Keyboard Shortcuts

**Estimated effort:** 2-3 hours

- Global shortcuts for common actions
- **Reason for deferral:** Nice to have, not essential

### Performance Optimization

**Estimated effort:** 3-4 hours

- Optimize for large rule sets (100+ rules)
- **Reason for deferral:** Not needed until user reports issues

### Interactive Tutorial

**Estimated effort:** 4-5 hours

- First-time user onboarding
- **Reason for deferral:** Documentation can serve this purpose

### API Documentation

**Estimated effort:** 3 hours

- Document rule structure, provide examples
- **Reason for deferral:** README is sufficient for now

## Next Phase Considerations

With all active priorities completed, here are potential areas for future development:

### High-Value Features

- **Request Body Matching**: Match rules based on POST/PUT body content (1-2 hours)
- **Sequential Responses**: Return different responses on successive calls for testing pagination/state changes (2-3 hours)
- **Response Templates Library**: Pre-built templates for common scenarios (404, 500, etc.) (2 hours)

### Advanced Capabilities

- **GraphQL Support**: Parse queries and match by operation name (4-5 hours)
- **Conditional Logic**: JavaScript expressions for advanced matching (5-6 hours)
- ✅ **Response Hook/Custom Modifier**: Allow JavaScript to dynamically modify responses **COMPLETED in v2.8.0**

### Developer Experience

- **Keyboard Shortcuts**: Quick actions via keyboard (2-3 hours)
- **Interactive Tutorial**: First-time user onboarding (4-5 hours)
- **Performance Optimization**: Optimize for 100+ rules with virtual scrolling (3-4 hours)

### Specialized Use Cases

- **WebSocket Mocking**: Mock WebSocket connections (8-10 hours)
- **Response Delay Ranges**: Random delays for realistic network simulation (1 hour)
- **Request Headers Matching**: Match based on specific headers (2 hours)

These features will be considered based on user feedback and demand.

## Contributing

Suggestions for new features? Open an issue on GitHub with:

- Feature description
- Use case / problem it solves
- Proposed implementation (optional)

---

**Last Updated:** January 20, 2026  
**Current Version:** 2.8.0  
**Status:** ✅ All active priorities completed + Response Hook feature
