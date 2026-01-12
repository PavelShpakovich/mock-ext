# MockAPI Extension - Implementation Roadmap

**Last Updated:** January 12, 2026

This document outlines all planned improvements for the MockAPI extension, organized by priority and implementation complexity.

---

## Phase 1: Code Quality & Foundation (Week 1)

### 1.1 Setup ESLint & Prettier ✅ (Completed: Jan 12, 2026)

- [x] Install dependencies: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier`
- [x] Create `.eslintrc.json` configuration
- [x] Create `.prettierrc` configuration
- [x] Add `.eslintignore` and `.prettierignore`
- [x] Update `package.json` with lint scripts: `lint`, `lint:fix`, `format`
- [x] Run linter and fix all existing issues
- [ ] Add pre-commit hook with husky (deferred)

**Files created:**

- `.eslintrc.json` ✅
- `.prettierrc` ✅
- `.eslintignore` ✅
- `.prettierignore` ✅

**Actual time:** 1 hour

---

### 1.2 Setup Testing Infrastructure ✅ (Completed: Jan 12, 2026)

- [x] Install dependencies: `jest`, `@testing-library/react@16.1.0` (React 19 compatible), `@testing-library/jest-dom`, `@types/jest`, `ts-jest`, `jest-environment-jsdom`
- [x] Create `jest.config.js`
- [x] Add test script to `package.json`
- [x] Create `src/__tests__` directory
- [x] Write unit tests for:
  - `utils.ts` (14 tests - generateUUID, isValidJSON, escapeRegExp, formatDate, debounce)
  - `ruleMatcher.ts` (12 tests - wildcardMatch, matchURL, findMatchingRule, findAllMatchingRules)
  - `storage.ts` (11 tests - getRules, saveRules, getSettings, addToRequestLog, clearRequestLog, exportAll)
  - `responseGenerator.ts` (6 tests - applyDynamicVariables, createDataURL, toDeclarativeRule)

**Files created:**

- `jest.config.js` ✅
- `src/__tests__/setup.ts` ✅ (Chrome API mocks)
- `src/__tests__/utils.test.ts` ✅ (14 tests)
- `src/__tests__/ruleMatcher.test.ts` ✅ (12 tests)
- `src/__tests__/storage.test.ts` ✅ (17 tests)
- `src/__tests__/responseGenerator.test.ts` ✅ (7 tests)

**Total:** 58 tests, all passing

**Actual time:** 2.5 hours

---

### 1.3 Add Pre-commit Hooks ✅ (Completed: Jan 12, 2026)

- [x] Install: `husky@9.1.7`, `lint-staged@16.2.7`
- [x] Configure husky: `npx husky init`
- [x] Add pre-commit hook for linting and formatting
- [x] Add pre-push hook for tests
- [x] Update `package.json` with lint-staged configuration

**Files created:**

- `.husky/pre-commit` ✅ (runs lint-staged on staged files)
- `.husky/pre-push` ✅ (runs test suite)

**Actual time:** 30 minutes

---

### 1.4 GitHub Actions CI/CD

- [ ] Create `.github/workflows/ci.yml`
- [ ] Setup workflow: lint → test → build
- [ ] Add build artifact upload
- [ ] Add status badge to README.md
- [ ] Optional: Auto-release workflow

**Files to create:**

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml` (optional)

**Estimated time:** 2 hours

---

## Phase 2: Quick Wins & UX Improvements (Week 2)

### 2.1 Response Headers UI (Backend Already Exists)

- [ ] Add headers section to `RuleEditor.tsx`
- [ ] Create `HeadersInput` component (key-value pairs)
- [ ] Update `ResponseGenerator.toDeclarativeRule()` to include headers
- [ ] Add visual indicator when headers are present in `RuleItem.tsx`
- [ ] Update form validation
- [ ] Add to i18n translations (en.json, ru.json)

**Files to modify:**

- `src/components/RuleEditor.tsx`
- `src/components/ui/HeadersInput.tsx` (create new)
- `src/responseGenerator.ts`
- `src/components/RuleItem.tsx`
- `src/locales/en.json`
- `src/locales/ru.json`

**Estimated time:** 3-4 hours

---

### 2.2 Export/Import Rules

- [ ] Add "Export" button to RulesTab
- [ ] Implement `exportRules()` function (download JSON)
- [ ] Add "Import" button with file picker
- [ ] Implement `importRules()` function (parse and merge)
- [ ] Add validation for imported JSON structure
- [ ] Add success/error toast notifications
- [ ] Update i18n translations

**Files to modify:**

- `src/components/RulesTab.tsx`
- `src/components/App.tsx`
- `src/storage.ts` (already has importRules method)
- `src/locales/en.json`
- `src/locales/ru.json`

**Estimated time:** 3-4 hours

---

### 2.3 Duplicate Rule Feature ✅ (Completed: Jan 12, 2026)

- [x] Add "Duplicate" button to `RuleItem.tsx`
- [x] Implement `handleDuplicateRule()` in `App.tsx`
- [x] Generate new UUID and append " (Copy)" to name
- [x] Add icon (Copy/Clone) from lucide-react
- [x] Update i18n translations

**Files modified:**

- `src/components/RuleItem.tsx` ✅
- `src/components/RulesTab.tsx` ✅
- `src/components/App.tsx` ✅
- `src/locales/en.json` ✅
- `src/locales/ru.json` ✅

**Actual time:** 30 minutes

---

### 2.4 Rule Hit Counter

- [ ] Add `hits: number` field to `MockRule` interface in `types.ts`
- [ ] Track hits in `background.ts` when rule matches
- [ ] Display hit count in `RuleItem.tsx` with badge
- [ ] Add "Reset Hits" option
- [ ] Update storage migration for existing rules

**Files to modify:**

- `src/types.ts`
- `src/background.ts`
- `src/components/RuleItem.tsx`
- `src/storage.ts`

**Estimated time:** 2-3 hours

---

### 2.5 Copy URL Feature in Request Log

- [ ] Add "Copy URL" button to `RequestItem.tsx`
- [ ] Implement clipboard API integration
- [ ] Add visual feedback (toast or icon change)
- [ ] Update i18n translations

**Files to modify:**

- `src/components/RequestItem.tsx`
- `src/locales/en.json`
- `src/locales/ru.json`

**Estimated time:** 1 hour

---

### 2.6 Enhanced Performance Monitoring

- [ ] Make `isDevelopment` configurable in `performance.ts`
- [ ] Add performance toggle to Settings
- [ ] Track rule matching duration
- [ ] Track render counts for optimization
- [ ] Add performance panel (optional)

**Files to modify:**

- `src/performance.ts`
- `src/types.ts` (add to Settings)
- `src/background.ts`

**Estimated time:** 2 hours

---

## Phase 3: Advanced Features (Week 3-4)

### 3.1 Keyboard Shortcuts

- [ ] Create `useKeyboardShortcuts` hook
- [ ] Implement shortcuts:
  - `Cmd/Ctrl + K`: Focus search
  - `Cmd/Ctrl + N`: New rule
  - `Cmd/Ctrl + S`: Save rule
  - `Cmd/Ctrl + R`: Toggle recording
  - `Escape`: Close editor
- [ ] Add shortcuts help modal (?)
- [ ] Update README with shortcuts documentation

**Files to create:**

- `src/hooks/useKeyboardShortcuts.ts`

**Files to modify:**

- `src/components/App.tsx`
- `src/components/RuleEditor.tsx`
- `README.md`

**Estimated time:** 3-4 hours

---

### 3.2 Rule Groups/Folders

- [ ] Add `group?: string` field to MockRule
- [ ] Create group management UI
- [ ] Add group filter/dropdown
- [ ] Collapsible groups in rules list
- [ ] Drag & drop between groups
- [ ] Bulk enable/disable by group

**Files to modify:**

- `src/types.ts`
- `src/components/RulesTab.tsx`
- `src/components/RuleEditor.tsx`
- `src/components/ui/GroupManager.tsx` (create new)

**Estimated time:** 6-8 hours

---

### 3.3 Drag & Drop Rule Reordering

- [ ] Install `@dnd-kit/core` and `@dnd-kit/sortable`
- [ ] Wrap rules list with DnD context
- [ ] Make RuleItem draggable
- [ ] Update rule order in storage
- [ ] Add visual drag indicators
- [ ] Update rule priority based on order

**Files to modify:**

- `src/components/RulesTab.tsx`
- `src/components/RuleItem.tsx`
- `src/background.ts` (priority calculation)
- `package.json`

**Estimated time:** 4-5 hours

---

### 3.4 Request Body Capture (POST/PUT/PATCH)

- [ ] Research Chrome extension limitations for request body capture
- [ ] Implement content script for fetch/XHR interception (if possible)
- [ ] Store request body in RequestLog
- [ ] Display request body in RequestItem (expandable)
- [ ] Use request body when creating mock from logged request

**Files to modify:**

- `src/background.ts`
- `src/types.ts`
- `src/components/RequestItem.tsx`
- `src/components/RuleEditor.tsx`

**Estimated time:** 6-8 hours (complex, may not be feasible)

---

### 3.5 Copy as cURL Feature

- [ ] Create `generateCurl()` utility function
- [ ] Add "Copy as cURL" button to RequestItem
- [ ] Include headers, method, URL, body
- [ ] Test with various request types

**Files to create:**

- `src/utils/curlGenerator.ts`

**Files to modify:**

- `src/components/RequestItem.tsx`

**Estimated time:** 2-3 hours

---

### 3.6 Advanced Filtering

- [ ] Add status code filter dropdown in RequestsTab
- [ ] Add method filter checkboxes
- [ ] Add date range filter
- [ ] Combined filter state management
- [ ] Clear all filters button

**Files to modify:**

- `src/components/RequestsTab.tsx`
- `src/components/ui/FilterPanel.tsx` (create new)

**Estimated time:** 4-5 hours

---

### 3.7 Conditional Responses

- [ ] Design conditional rule structure
- [ ] Add conditions UI (if request body contains X, return Y)
- [ ] Update RuleMatcher to evaluate conditions
- [ ] Support multiple response variants per rule
- [ ] Add UI for managing conditions

**Files to modify:**

- `src/types.ts` (add ConditionalRule interface)
- `src/ruleMatcher.ts`
- `src/components/RuleEditor.tsx`
- `src/background.ts`

**Estimated time:** 8-10 hours (complex feature)

---

## Phase 4: Polish & Documentation (Week 5)

### 4.1 Error Boundaries

- [ ] Create `ErrorBoundary` component
- [ ] Wrap main app sections
- [ ] Add error logging
- [ ] User-friendly error messages
- [ ] Add "Report Issue" button

**Files to create:**

- `src/components/ErrorBoundary.tsx`

**Files to modify:**

- `src/popup.tsx`
- `src/components/App.tsx`

**Estimated time:** 2 hours

---

### 4.2 Accessibility Improvements

- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation for lists
- [ ] Add focus indicators
- [ ] Test with screen reader
- [ ] Add skip links
- [ ] Ensure proper heading hierarchy

**Files to modify:**

- All component files
- `src/styles.css`

**Estimated time:** 4-6 hours

---

### 4.3 Onboarding Tutorial

- [ ] Create welcome screen for first-time users
- [ ] Add interactive tutorial overlay
- [ ] Highlight key features
- [ ] Add "Skip" and "Next" buttons
- [ ] Store tutorial completion state

**Files to create:**

- `src/components/Onboarding.tsx`
- `src/components/ui/TutorialOverlay.tsx`

**Files to modify:**

- `src/components/App.tsx`
- `src/storage.ts`

**Estimated time:** 4-5 hours

---

### 4.4 Documentation Enhancements

- [ ] Create `CONTRIBUTING.md`
- [ ] Add architecture diagram (draw.io or mermaid)
- [ ] Record demo video/GIF
- [ ] Expand troubleshooting section
- [ ] Add code examples for common patterns
- [ ] Update README with new features

**Files to create:**

- `CONTRIBUTING.md`
- `docs/architecture.md`
- `docs/examples.md`

**Files to modify:**

- `README.md`

**Estimated time:** 4-6 hours

---

### 4.5 Theme Toggle Implementation

- [ ] Fix theme implementation (currently not fully working)
- [ ] Add theme toggle button to Header
- [ ] Implement system theme detection
- [ ] Persist theme preference
- [ ] Add theme transition animations

**Files to modify:**

- `src/components/Header.tsx`
- `src/types.ts`
- `src/storage.ts`
- `src/styles.css`

**Estimated time:** 2-3 hours

---

## Phase 5: Future Considerations

### 5.1 GraphQL Support

- [ ] Research GraphQL mocking patterns
- [ ] Add GraphQL content type
- [ ] Support operation name matching
- [ ] GraphQL schema validation

**Estimated time:** 8-10 hours

---

### 5.2 Proxy Mode

- [ ] Add proxy option to rules
- [ ] Forward requests to different URL
- [ ] Optional response transformation
- [ ] Maintain headers

**Estimated time:** 6-8 hours

---

### 5.3 HAR File Export

- [ ] Generate HAR format from request logs
- [ ] Export button in RequestsTab
- [ ] Include timing information

**Estimated time:** 4-5 hours

---

### 5.4 Rule Templates Library

- [ ] Create common mock templates
- [ ] Template marketplace/sharing
- [ ] Import from template
- [ ] User-contributed templates

**Estimated time:** 10-12 hours

---

### 5.5 Response Body Templates

- [ ] More dynamic variables (date, name, email generators)
- [ ] Faker.js integration
- [ ] Custom variable system
- [ ] Template syntax documentation

**Estimated time:** 6-8 hours

---

## Summary

**Total Estimated Time:** 100-130 hours

**Priority Order:**

1. ✅ Phase 1: Code Quality (Week 1) - Foundation
2. ✅ Phase 2: Quick Wins (Week 2) - User value
3. ✅ Phase 3: Advanced Features (Week 3-4) - Differentiation
4. ✅ Phase 4: Polish (Week 5) - Production ready
5. 🔮 Phase 5: Future - Long-term vision

**Recommended Start:**

1. ESLint & Prettier (2-3 hours)
2. Response Headers UI (3-4 hours)
3. Export/Import Rules (3-4 hours)
4. Duplicate Rule (1 hour)

These four items will immediately improve code quality and add high-value user features with minimal effort.

---

## Notes

- Some features (like request body capture) may have Chrome extension API limitations
- Testing should be written alongside each feature
- Update i18n translations for all new features
- Update CHANGELOG.md after each phase
- Consider user feedback before implementing Phase 5 features

---

## Progress Tracking

Mark items as completed with [x] and add completion date.
In Progress (1.1 ✅)  
**Phase 2 Status:** In Progress (2.3 ✅)  
**Phase 3 Status:** Not started  
**Phase 4 Status:** Not started  
**Phase 5 Status:** Planning

---

## Completed Features (Jan 12, 2026)

### ✅ ESLint & Prettier Setup

- Full linting and formatting configuration
- 5 new npm scripts added
- All code formatted and errors fixed
- Zero TypeScript errors

### ✅ Duplicate Rule Feature

- Copy icon button on each rule
- Automatic ID generation and name suffix
- Full i18n support (EN/RU)
- Seamless integration with existing UIted  
  **Phase 5 Status:** Planning
