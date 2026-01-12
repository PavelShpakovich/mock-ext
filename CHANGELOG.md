# Changelog

All notable changes to MockAPI Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
