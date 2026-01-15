# MockAPI Extension - Roadmap

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

### 3. Import/Export Enhancement ⏳

**Estimated effort:** 30 minutes  
**Value:** Medium  
**Status:** ⏳ **PARTIALLY COMPLETED**

- **Current implementation:**
  - ✅ Export all rules (implemented)
  - ✅ Import rules from JSON file (implemented with merge strategy)
  - ✅ Duplicate detection by rule ID
  - ✅ Validation of required fields
- **Remaining enhancements:**
  - ⏳ Export selected rules (not just all)
  - ⏳ Import with user choice: merge or replace all
  - ⏳ Import preview/confirmation dialog

### 4. Rule Groups/Folders

**Estimated effort:** 3-4 hours  
**Value:** High  
**Status:** Ready to implement

- Organize rules into folders
- **Features:**
  - Create folders (e.g., "User API", "Payment API", "Auth")
  - Drag-and-drop rules between folders
  - Bulk enable/disable entire folders
  - Collapse/expand folders
- **Implementation:**
  - Add `folder` field to `MockRule`
  - Update UI with folder tree view
  - Add folder management (create, rename, delete)

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

### 6. Dark/Light Theme

**Estimated effort:** 2 hours  
**Value:** Low-Medium  
**Status:** Ready to implement

- Theme toggle in settings
- Respect system preference
- Currently using dark theme only

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

## Recommended Implementation Order

### Sprint 1 (Current Week) ✅ Completed

1. ✅ Custom Response Headers (30 min) - **COMPLETED v2.1.0**
2. ✅ Rule Hit Counter (1 hour) - **COMPLETED v2.1.1**
3. ✅ CORS Auto-Fix (1 hour) - **COMPLETED v2.2.0**
4. ✅ Rule Validation & Warnings (2 hours) - **COMPLETED v2.3.0 (Unreleased)**

### Sprint 2 (Next Week)

5. Dark/Light Theme (2 hours) - **NEXT**
6. Rule Groups/Folders (3-4 hours)

### Sprint 3 (Week 3-4)

7. Import/Export Enhancements (30 min):
   - Export selected rules
   - Import mode choice (merge/replace)

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

## Contributing

Suggestions for new features? Open an issue on GitHub with:

- Feature description
- Use case / problem it solves
- Proposed implementation (optional)

---

**Last Updated:** January 15, 2026  
**Current Version:** 2.2.0  
**Next Milestone:** 2.3.0 (Rule Validation & Warnings + Dark/Light Theme)

### 1. Custom Response Headers

**Estimated effort:** 30 minutes  
**Value:** High

- Add custom headers to mocked responses
- **Use cases:**
  - CORS headers for cross-origin requests
  - Authentication tokens in response headers
  - Content-Disposition for file downloads
  - Cache-Control directives
- **Implementation:**
  - Add `headers` field to `MockRule` interface
  - Update interceptor to include custom headers in Response
  - Add header editor UI in rule editor

### 2. Request Body Matching (Skip as for now)

**Estimated effort:** 1-2 hours  
**Value:** High

- Match rules based on POST/PUT request body content
- **Use cases:**
  - Different responses for different login credentials
  - Conditional responses based on form data
  - GraphQL query-specific mocking
- **Implementation:**
  - Add `bodyPattern` and `bodyMatchType` to rule criteria
  - Support: exact match, contains, regex, JSON path
  - Update interceptor to read request body

### 3. Rule Hit Counter

**Estimated effort:** 1 hour  
**Value:** High

- Track how many times each rule has been matched
- Display "Last matched: X minutes ago" in UI
- **Benefits:**
  - Identify unused rules for cleanup
  - Debug which rules are actually triggering
  - Usage analytics
- **Implementation:**
  - Add `matchCount` and `lastMatched` to `MockRule`
  - Increment counter on each match
  - Display in rules list UI

### 4. Import/Export Enhancement

**Estimated effort:** 1 hour  
**Value:** Medium

- Improve current export functionality
- **Features:**
  - Import rules from JSON file (Should be implemented already, please check)
  - Export selected rules (not just all)
  - Import/export with merge or replace option
  - Share rule collections with team members (Skip as for now)

## Medium Priority (High Value)

### 5. Sequential Responses (Skip as for now)

**Estimated effort:** 2-3 hours  
**Value:** High

- Return different responses on successive calls to same URL
- **Pattern:** `[response1, response2, response3]` → cycles or stops at last
- **Use cases:**
  - Testing pagination (different pages on each call)
  - State changes (pending → processing → complete)
  - Retry logic testing (error → error → success)
- **Implementation:**
  - Add `responseSequence` array to `MockRule`
  - Add `sequenceMode`: 'cycle' | 'stop-at-last'
  - Track current sequence position per rule

### 6. Request Headers Matching (Skip as for now)

**Estimated effort:** 2 hours  
**Value:** Medium

- Match rules based on request headers
- **Use cases:**
  - Different responses for different authorization levels
  - Content negotiation (Accept header)
  - API versioning (custom version headers)
- **Implementation:**
  - Add `headerMatchers` array to rule criteria
  - Support: exact match, contains, regex
  - Update interceptor to check headers

### 7. Response Templates Library (Skip as for now)

**Estimated effort:** 2 hours  
**Value:** Medium

- Pre-built templates for common scenarios
- **Templates:**
  - 404 Not Found
  - 500 Internal Server Error
  - Paginated list response
  - Empty array/object
  - Authentication error (401)
  - Validation error (422)
- **Implementation:**
  - Create templates.ts with predefined responses
  - Add "Use Template" button in rule editor
  - Allow customization after template insertion

### 8. Rule Groups/Folders

**Estimated effort:** 3-4 hours  
**Value:** High

- Organize rules into folders
- **Features:**
  - Create folders (e.g., "User API", "Payment API", "Auth")
  - Drag-and-drop rules between folders
  - Bulk enable/disable entire folders
  - Collapse/expand folders
- **Implementation:**
  - Add `folder` field to `MockRule`
  - Update UI with folder tree view
  - Add folder management (create, rename, delete)

## Advanced Features

### 9. GraphQL Support (Skip as for now)

**Estimated effort:** 4-5 hours  
**Value:** Medium (high for GraphQL projects)

- Parse GraphQL queries
- Match based on operation name or query structure
- **Features:**
  - Detect GraphQL requests automatically
  - Match by operation name (query/mutation name)
  - Match by fields requested
  - Return typed responses
- **Implementation:**
  - Add GraphQL query parser
  - New match type: 'graphql'
  - Update interceptor to parse GraphQL from body

### 10. Response Delay Ranges (Skip as for now)

**Estimated effort:** 1 hour  
**Value:** Medium

- Random delay between min-max values
- **Use case:** Simulate real-world network variance
- **Example:** 100-500ms random delay
- **Implementation:**
  - Change `delay` to `{ min: number, max: number }` or keep single number
  - Add toggle for "random delay"
  - Calculate random value on each request

### 11. Conditional Logic (Skip as for now)

**Estimated effort:** 5-6 hours  
**Value:** High (for advanced users)

- JavaScript expressions for advanced matching
- **Examples:**
  - `request.headers['User-Agent'].includes('Mobile')`
  - `request.url.includes('premium') && request.headers['Authorization']`
  - `JSON.parse(request.body).userId === 123`
- **Implementation:**
  - Add `conditionalExpression` field (optional)
  - Safe evaluation with limited scope
  - Provide context object with request details

### 12. CORS Auto-Fix

**Estimated effort:** 1 hour  
**Value:** Medium

- Automatically inject CORS headers when needed
- **Features:**
  - Global toggle: "Enable CORS bypass for mocked responses"
  - Auto-inject headers:
    - `Access-Control-Allow-Origin: *`
    - `Access-Control-Allow-Methods: *`
    - `Access-Control-Allow-Headers: *`
- **Implementation:**
  - Add setting in Settings interface
  - Inject headers in interceptor when enabled

### 13. WebSocket Mocking (Skip as for now)

**Estimated effort:** 8-10 hours  
**Value:** Medium (high for real-time apps)

- Mock WebSocket connections
- **Features:**
  - Match WebSocket URLs
  - Send predefined messages at intervals
  - Respond to incoming messages
- **Implementation:**
  - Intercept `new WebSocket()`
  - Create mock WebSocket object
  - Message sequence configuration

### 14. Response Transformation (Remove)

**Estimated effort:** 3-4 hours  
**Value:** Medium

- Modify real responses before they reach the page
- **Use cases:**
  - Add/remove fields from real API responses
  - Change values in production API for testing
  - Combine real + mock data
- **Implementation:**
  - New mode: 'passthrough-transform'
  - JavaScript function to transform response
  - Apply after real fetch completes

## Quality of Life Improvements

### 15. Dark/Light Theme

**Estimated effort:** 2 hours  
**Value:** Low-Medium

- Theme toggle in settings
- Respect system preference
- Currently using dark theme only

### 16. Keyboard Shortcuts (Skip as for now)

**Estimated effort:** 2-3 hours  
**Value:** Medium

- Global shortcuts:
  - `Cmd/Ctrl + K`: Quick add rule
  - `Cmd/Ctrl + /`: Search rules
  - `Cmd/Ctrl + E`: Enable/disable extension
  - `Cmd/Ctrl + R`: Toggle recording
- Rule editor shortcuts:
  - `Cmd/Ctrl + S`: Save rule
  - `Esc`: Cancel
  - `Cmd/Ctrl + B`: Beautify JSON

### 17. Rule Validation & Warnings

**Estimated effort:** 2 hours  
**Value:** Medium

- Warn about:
  - Overlapping rules (multiple rules match same URL)
  - Invalid regex patterns
  - Malformed JSON responses
  - Unused rules (never matched in 30 days)
- Display warnings in rules list

### 18. Performance Optimization (Skip as for now)

**Estimated effort:** 3-4 hours  
**Value:** Medium

- Optimize for large rule sets (100+ rules)
- Features:
  - Virtual scrolling for rules list
  - Lazy loading of rule details
  - Memoization of URL matching
  - IndexedDB for storage (instead of chrome.storage for large data)

## Documentation & Developer Experience

### 19. Interactive Tutorial (Skip as for now)

**Estimated effort:** 4-5 hours  
**Value:** Medium

- First-time user onboarding
- Step-by-step guide:
  1. Create your first rule
  2. Test the rule
  3. View request log
  4. Export rules
- Highlight UI elements during tutorial

### 20. API Documentation (Skip as for now)

**Estimated effort:** 3 hours  
**Value:** Low-Medium

- Document rule structure
- Provide examples for common scenarios
- Add to README or create docs site

### 21. Feature Flag System

**Estimated effort:** 4-5 hours  
**Value:** High (for monetization)  
**Priority:** Low (infrastructure for future)

- Centralized feature flag management for monetization
- **Use cases:**
  - Freemium model: hide premium features for free users
  - A/B testing: test feature adoption
  - Gradual rollouts: enable for specific users
  - Quick toggles: disable problematic features
- **Implementation:**
  - Create `FeatureFlags` enum for all features
  - Add `featureFlags.ts` service:
    ```typescript
    enum Feature {
      CUSTOM_HEADERS = 'custom_headers',
      RULE_GROUPS = 'rule_groups',
      GRAPHQL_SUPPORT = 'graphql_support',
      CONDITIONAL_LOGIC = 'conditional_logic',
      // ... etc
    }
    ```
  - Add `isFeatureEnabled(feature: Feature): boolean` check
  - Store user tier in settings (free/pro/enterprise)
  - Feature gate UI components with flag checks
  - Add visual indicators for premium features
- **Benefits:**
  - Clean separation of free vs paid features
  - Easy to test monetization strategies
  - No code changes needed to enable/disable features
  - Foundation for subscription model

## Recommended Implementation Order

### Phase 1: Quick Wins (Week 1)

1. Custom Response Headers
2. Rule Hit Counter
3. Import/Export Enhancement

### Phase 2: High Value Features (Week 2-3)

4. Request Body Matching
5. Sequential Responses
6. Rule Groups/Folders

### Phase 3: Advanced Features (Week 4+)

7. Conditional Logic
8. Response Templates Library
9. Request Headers Matching
10. GraphQL Support

### Phase 4: Quality of Life (Ongoing)

- Keyboard Shortcuts
- Rule Validation & Warnings
- Performance Optimization

## Contributing

Suggestions for new features? Open an issue on GitHub with:

- Feature description
- Use case / problem it solves
- Proposed implementation (optional)

---

**Last Updated:** January 14, 2026  
**Current Version:** 2.0.3
