# Moq

A powerful Chrome DevTools extension for mocking API requests during development and testing. Intercepts HTTP requests at the JavaScript level and responds with custom data, status codes, and delays without modifying your application code.

## What's New in v2.10.0

🎉 **Major Feature Release** - Enhanced response format support and improved user experience:

- **Google Response Support**: Full handling of Google's specialized response formats
  - Automatic `)]}'` XSSI protection prefix removal
  - Chunked transfer encoding with size indicators
  - JavaScript code validation (not pure JSON)
  - New helpers: `parseGoogleJSON()`, `stripGooglePrefix()`
- **Multi-Format Content Support**: Beyond JSON
  - **XML**: Full validation, parsing, and serialization helpers
  - **HTML**: Mock HTML pages and fragments
  - **JavaScript**: JSONP callbacks, dynamic scripts, modules
  - Smart auto-detection with intelligent content-type inference
- **Seamless Recording**: No more manual page reloads
  - Automatic reload when starting recording
  - Interceptor scripts inject seamlessly
  - User feedback via toast notification
- **Enhanced XHR Logging**: Complete request capture
  - All XHR requests logged (mocked and unmocked)
  - Proper responseType handling for binary data
  - Improved error resilience
- **Code Quality**: Better maintainability
  - Extracted content-type detection helper
  - Strengthened validation (no false positives)
  - Robust Google format parsing
- **UX Improvements**:
  - Toast notifications auto-dismiss after 3 seconds
  - Clear validation messages for complex formats
  - Better error handling throughout

For complete details, see [CHANGELOG.md](CHANGELOG.md).

## Features

### Request Interception

- **URL Pattern Matching**: Use wildcards (`*`), exact match, or regex patterns to match URLs
- **HTTP Method Filtering**: Mock specific methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD) or all methods
- **Custom Responses**: Define JSON, XML, HTML, JavaScript, or text responses
- **Status Code Control**: Set any HTTP status code (200, 404, 500, etc.)
- **Response Delay**: Simulate network latency for testing loading states
- **Custom Response Headers**: Add custom HTTP headers to mock responses
  - Define multiple key-value header pairs
  - Auto-populates from captured real responses
  - Perfect for testing CORS, authentication, caching behaviors
- **Client-Side Interception**: Intercepts fetch() and XMLHttpRequest before they reach the network

### Google Response Support

Full support for Google's specialized response formats:

- **XSSI Protection Handling**: Automatically strips `)]}'` security prefix
- **Chunked Response Format**: Handles Google's chunked transfer encoding
  - Automatically removes chunk size indicators (e.g., `144\n`, `25\n`)
  - Validates JavaScript code responses (not pure JSON)
  - Shows clear validation: "Valid Google response format (JavaScript) ✓"
- **Response Hook Helpers**: Built-in utilities for Google responses
  - `parseGoogleJSON(responseBody)` - Strips prefix and parses chunks
  - `stripGooglePrefix(responseBody)` - Removes `)]}'` prefix
- **Examples**: Works perfectly with Google Translate, Gmail API, Google Maps, etc.

### Enhanced Content-Type Support

Beyond JSON - handle multiple response formats:

- **XML Responses**: Full XML validation and manipulation
  - Real-time validation with detailed error messages
  - Response hook helpers: `parseXML()`, `serializeXML()`
  - Perfect for SOAP APIs and RSS feeds
- **HTML Responses**: Mock HTML pages or fragments
  - Useful for testing SSR applications
  - Validate HTML structure in editor
- **JavaScript Responses**: Handle script responses
  - JSONP callbacks
  - Dynamic script loading
  - Module responses
- **Auto-Detection**: Smart content-type detection from response body
  - Recognizes JSON, XML, HTML, JavaScript formats
  - Handles truncated responses intelligently
  - Fallback logic for ambiguous content

### Dynamic Variables

Generate dynamic data in responses using built-in variables:

- `{{timestamp}}` - Current Unix timestamp
- `{{uuid}}` - Random UUID v4
- `{{random_number}}` - Random number between 0-999999

Example:

```json
{
  "id": "{{uuid}}",
  "timestamp": {{timestamp}},
  "order_number": {{random_number}}
}
```

### Request Logging & Filtering

- **Page-Specific Recording**: Record XMLHttpRequest/fetch requests from a specific browser tab
- **Automatic Reload**: Page automatically reloads when starting recording to ensure all requests are captured
  - Interceptor scripts inject seamlessly
  - User feedback via toast notification
  - No manual refresh needed
- **Manual Control**: Start/stop recording with button controls
- **Advanced Filtering**: Filter logged requests by HTTP method and status code range
  - Method filters: GET, POST, PUT, DELETE, PATCH, OPTIONS
  - Status code filters: 2xx Success, 3xx Redirect, 4xx Client Error, 5xx Server Error
- **Search & Filter**: Quickly find requests with text search and multiple filters
- **Request Details**: View URL, method, status code, content type, and timestamp
- **Response Headers Capture**: All response headers captured and stored with logged requests
- **XHR Support**: Complete XMLHttpRequest logging including non-mocked requests
- **Up to 1000 Requests**: Automatic log rotation keeps recent requests
- **Quick Mocking**: Create mock rules directly from logged requests with "Mock This" button
  - Auto-populates all fields including captured response headers
  - Smart content-type detection from response body

### Rule Management

- **Rule Groups/Folders**: Organize rules into logical groups
  - Create folders to organize rules (e.g., "User API", "Payment API", "Auth")
  - Rename and delete folders with validation
  - Collapse/expand folders to save screen space
  - Bulk enable/disable all rules in a folder
  - Visual badges showing rule count and enabled count per folder
  - Search works seamlessly across all folders
  - Ungrouped rules section for rules without folders
- **Rule Hit Counter**: Track rule usage in real-time
  - See how many times each rule has been matched
  - View "Last matched: X minutes ago" timestamps
  - Identify unused rules for cleanup
  - Debug which rules are actually triggering
- **Export/Import**: Backup rules to JSON file and restore them later
  - Export all rules or selected rules
  - Import with merge or replace strategy
  - Duplicate detection and validation
- **Duplicate Rules**: Quickly copy existing rules to create variations
- **Enable/Disable**: Toggle rules on/off without deleting them
- **Search Rules**: Find rules by name or URL pattern

### DevTools Integration

- **Native DevTools Panel**: Integrated as a dedicated panel in Chrome DevTools
- **Developer-Focused**: Designed for seamless integration into your development workflow
- **Keyboard Shortcut Access**: Quick access via Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
- **Visual Prompt**: Helpful notification when extension icon is clicked, guiding you to open DevTools

### User Interface

- **Clean Dark Theme**: Modern, minimalist design optimized for developer workflows
- **Two Tabs**: "Rules" for managing mocks, "Requests" for viewing captured requests
- **Toggle Controls**: Enable/disable individual rules or global mocking
- **Visual Feedback**: Clear indicators for enabled/disabled rules and recording status
- **Real-time JSON Validation**: Instant feedback on JSON syntax with throttled validation
- **JSON Beautifier**: One-click JSON formatting
- **Search**: Filter rules and requests instantly
- **Cursor Pointer**: All interactive elements have proper cursor styling

## Installation

### From Source

1. **Clone this repository**

   ```bash
   git clone https://github.com/PavelShpakovich/mock-ext.git
   cd mock-ext
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run build
   ```

   This creates a `dist` folder with the compiled extension.

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Mode

For development with auto-rebuild on changes:

```bash
npm run dev
```

## Quick Start

### Opening Moq

1. **Open Chrome DevTools** on any webpage:
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `Ctrl + Shift + I`
   - Right-click anywhere and select "Inspect"
2. **Look for the "Moq" tab** in the DevTools panel (usually at the top or under >> menu)
3. **Alternative**: Click the extension icon to see a helpful prompt with the keyboard shortcut

### Creating Your First Mock Rule

1. **Open Moq in DevTools**
2. **Go to "Rules" tab**
3. **Click "+ Add Rule"**
4. **Fill in the form**:
   - **Rule Name**: "Mock User API"
   - **URL Pattern**: `https://api.example.com/users/*`
   - **Match Type**: Wildcard
   - **Method**: GET
   - **Status Code**: 200
   - **Content Type**: JSON
   - **Response Body**:
     ```json
     {
       "id": "{{uuid}}",
       "name": "Test User",
       "email": "test@example.com"
     }
     ```
5. **Click "Create Rule"** (button will be disabled if JSON is invalid)
6. **Toggle the rule ON** using the switch

Now all GET requests to `https://api.example.com/users/*` will return your mock data!

### Recording and Mocking Requests

1. **Open DevTools** on the website you want to test
2. **Navigate to Moq panel**
3. **Go to "Requests" tab**
4. **Click "Record" button** (red circle icon)
5. **Interact with the website** to generate fetch/XHR requests
6. **View logged requests** in the list (mocked requests are automatically filtered out)
7. **Click "Mock This"** on any request to create a mock rule instantly
8. **Click "Stop" button** (red square icon) when done recording

## Usage Examples

### Mock API Endpoint

```
URL Pattern: https://api.github.com/users/*
Method: GET
Response:
{
  "login": "testuser",
  "id": {{random_number}},
  "created_at": "{{timestamp}}"
}
```

### Mock Error Response

```
URL Pattern: https://api.example.com/checkout
Method: POST
Status Code: 500
Response:
{
  "error": "Payment service unavailable",
  "code": "SERVICE_ERROR"
}
```

### Simulate Slow Network

```
URL Pattern: https://api.example.com/data
Delay: 3000 (3 seconds)
Response: {"data": "slow response"}
```

### Regex Pattern Matching

```
URL Pattern: https://api\.example\.com/(users|customers)/\d+
Match Type: Regex
Response: {"id": {{random_number}}, "type": "entity"}
```

## URL Pattern Matching

### Wildcard Pattern

- `*` matches any characters
- Examples:
  - `https://api.example.com/*` - matches all requests to this domain
  - `https://*/users` - matches /users on any domain
  - `*://api.example.com/v*/users` - matches any protocol and version

### Exact Match

- Matches the URL exactly as specified
- No wildcards or regex interpretation

### Regex Pattern

- Full regex support with JavaScript syntax
- Don't include leading/trailing slashes
- Examples:
  - `https://api\.example\.com/users/\d+` - matches /users/123
  - `https://.*\.example\.com/.*` - matches all subdomains

## Project Structure

```
mock-ext/
├── src/
│   ├── background.ts           # Service worker (request interception)
│   ├── content-script.ts       # Bridge between page and extension
│   ├── interceptor.ts          # Client-side fetch/XHR interception (MAIN world)
│   ├── popup.tsx               # Main React app entry point
│   ├── devtools.ts             # DevTools panel registration
│   ├── devtools-prompt.ts      # Content script for DevTools prompt notification
│   ├── types.ts                # TypeScript type definitions
│   ├── enums.ts                # Centralized enums (MatchType, HttpMethod, etc.)
│   ├── utils.ts                # Utility functions
│   ├── storage.ts              # Chrome storage API wrapper (with batched logging)
│   ├── contextHandler.ts       # Extension context validation
│   ├── performance.ts          # Performance monitoring utilities
│   ├── styles.css              # Global styles with Tailwind CSS 4.x
│   ├── helpers/                # Business logic helpers (modular architecture)
│   │   ├── recording.ts        # Recording functionality (tab validation, messages)
│   │   ├── importExport.ts     # Import/export logic (validation, merging, stats)
│   │   ├── headers.ts          # HTTP header utilities (conversion, extraction)
│   │   ├── ruleForm.ts         # Form data initialization
│   │   ├── ruleValidation.ts   # Form & JSON validation
│   │   ├── urlMatching.ts      # URL pattern matching logic
│   │   ├── filtering.ts        # Request filtering logic
│   │   ├── formatting.ts       # Data formatting utilities
│   │   ├── time.ts             # Time formatting utilities
│   │   ├── string.ts           # String manipulation utilities
│   │   └── validation.ts       # General validation functions
│   ├── components/
│   │   ├── App.tsx             # Main app component with tabs (280 lines)
│   │   ├── Header.tsx          # Extension header
│   │   ├── RulesTab.tsx        # Rules management tab
│   │   ├── RequestsTab.tsx     # Request logging tab
│   │   ├── RuleEditor.tsx      # Form for creating/editing rules (280 lines)
│   │   ├── RuleItem.tsx        # Individual rule display
│   │   ├── RequestItem.tsx     # Individual request display
│   │   └── ui/                 # Reusable UI components (atomic design)
│   │       ├── Badge.tsx       # Status badges
│   │       ├── Button.tsx      # Primary UI button
│   │       ├── Card.tsx        # Container cards
│   │       ├── Input.tsx       # Form inputs
│   │       ├── Select.tsx      # Dropdown selects
│   │       ├── TabButton.tsx   # Tab navigation
│   │       ├── TextArea.tsx    # Multi-line inputs
│   │       ├── Toggle.tsx      # On/off switches
│   │       ├── IconButton.tsx  # Icon-only buttons
│   │       ├── FilterPanel.tsx # Filter UI panel
│   │       ├── ImportDialog.tsx # Import preview modal (129 lines)
│   │       ├── HeadersEditor.tsx # HTTP headers editor (72 lines)
│   │       ├── RadioOption.tsx  # Atomic: Radio with label/description
│   │       ├── StatItem.tsx     # Atomic: Icon + label + value
│   │       ├── DialogHeader.tsx # Atomic: Modal header with close
│   │       └── InfoPanel.tsx    # Atomic: Contextual info panels
│   ├── contexts/
│   │   └── I18nContext.tsx     # Internationalization context (EN/RU)
│   ├── locales/
│   │   ├── en.json             # English translations
│   │   └── ru.json             # Russian translations
│   └── __tests__/              # Unit tests (Jest + Testing Library)
│       ├── setup.ts            # Test configuration
│       ├── recording.test.ts   # Recording helpers tests (12 tests)
│       ├── importExport.test.ts # Import/export tests (22 tests)
│       ├── headers.test.ts     # Headers utilities tests (11 tests)
│       ├── ruleForm.test.ts    # Form initialization tests (12 tests)
│       ├── ruleValidation.test.ts # Validation tests (enhanced with 19 tests)
│       ├── urlMatching.test.ts # URL matching tests
│       ├── filtering.test.ts   # Filtering logic tests
│       ├── time.test.ts        # Time formatting tests
│       ├── utils.test.ts       # Utility functions tests
│       ├── storage.test.ts     # Storage tests
│       ├── contextHandler.test.ts # Context validation tests
│       └── i18n.test.ts        # I18n tests
├── public/
│   ├── manifest.json           # Extension manifest (Manifest V3)
│   ├── popup.html              # UI HTML structure
│   ├── devtools.html           # DevTools panel entry point
│   └── icons/                  # Extension icons (SVG)
├── dist/                       # Build output (generated)
├── webpack.config.js           # Webpack configuration
├── tailwind.config.js          # Tailwind CSS 4.x configuration
├── postcss.config.js           # PostCSS configuration
├── tsconfig.json               # TypeScript 5.3.3 configuration
├── jest.config.js              # Jest test configuration
└── package.json                # Project dependencies
```

## Technical Details

### Architecture

- **Modular Design**: Business logic extracted into dedicated helper modules for maintainability
- **Atomic UI Components**: Small, reusable components following atomic design principles
- **Manifest V3**: Uses the latest Chrome Extension APIs
- **DevTools Integration**: Native panel integrated into Chrome DevTools
- **TypeScript 5.3.3**: Fully typed codebase with strict mode enabled
- **React 19.2.3**: Modern React with hooks for UI components
- **Webpack 5.104.1**: Module bundler with multiple entry points
- **Tailwind CSS 4.x**: Utility-first CSS framework with @tailwindcss/postcss
- **Client-Side Interception**: MAIN world interceptor for fetch/XHR before network
- **Service Worker**: Background script for cross-tab messaging and storage
- **Chrome Storage**: Persistent data storage for rules and logs
- **Comprehensive Testing**: 214 unit tests with Jest and Testing Library

### Performance Optimizations

- **In-Memory Request Logging**: Uses `chrome.storage.session` (fast in-memory storage) instead of persistent storage for logs
- **Batched Write Operations**: Logs are batch written every 500ms instead of on every request, reducing CPU/IO usage
- **DevTools-Only Architecture**: No popup window management overhead
- **Lightweight Content Script**: Minimal 2.8KB script only for showing prompts
- **Request Filtering**: Only logs XMLHttpRequest/fetch, excludes images, CSS, fonts
- **Smart Deduplication**: Prevents duplicate request logging within 100ms window
- **Mocked Request Filtering**: Automatically excludes mocked requests from logs
- **Throttled Validation**: JSON validation debounced to 500ms for better UX
- **Continuous Polling**: Request count updates on all tabs when recording is active
- **Efficient DevTools Integration**: Panel uses same React app as popup, no duplication

### Key Features Removed for Performance

- **Response Body Capture**: Not available due to Chrome security limitations and performance impact
  - Users manually enter response bodies when creating mock rules
  - Focus on fast, non-intrusive request logging
- **Floating Window Mode**: Removed in favor of native DevTools integration
  - Better developer workflow integration
  - Reduced complexity and maintenance overhead

### Permissions

- `storage`: Save rules and settings
- `activeTab`: Access current tab information
- `tabs`: Access tab information for recording
- `contextMenus`: Right-click menu integration
- `host_permissions`: `<all_urls>` - Access to all URLs for interception

### Data Storage

All data is stored locally using `chrome.storage.local`:

- Mock rules with complete configuration
- Request logs (up to 1000 entries, oldest removed first)
- Settings and preferences (global mocking toggle, recording state per tab)

## Development

### Building

```bash
npm run build      # Production build
npm run dev        # Development build with watch mode
```

### Code Quality

- **Strict TypeScript**: All code fully typed with strict mode enabled
- **Modern React**: Functional components with hooks
- **Tailwind CSS**: Utility-first styling for consistent design
- **Clean Architecture**: DevTools-focused design with minimal overhead
- **Multiple Entry Points**: Webpack configured for background, popup, devtools, and devtools-prompt

### Recent Architectural Changes

#### v2.9.x - Performance & UX Improvements (Current)

Major performance optimizations and user experience enhancements:

- **Bundle Size Optimization**: Reduced initial bundle by 65% (1.04 MB → 364 KB)
  - Lazy loading for Prettier and validation dependencies
  - On-demand loading of heavy dependencies
- **Response Hook Toggle**: Enable/disable response hooks without deleting code
  - Smart UI that only shows toggle when hook code exists
  - Visual status indicators with color-coded badges
- **Enhanced Validation**: Comprehensive response hook validation using eslint-scope
  - Catches undefined variables and proper scope analysis
  - CSP-safe static analysis
- **UI Polish**: Theme-aware icons, quick save button, improved accessibility
  - Focus rings only for keyboard navigation
  - Standardized error message styling

#### v2.8.x - Response Modes & Custom Hooks

Powerful response modification capabilities:

- **Response Mode Selection**: Choose between Mock and Passthrough modes
  - Mock Mode: Apply hooks to configured mock responses
  - Passthrough Mode: Forward real requests and modify actual responses
- **Response Hooks**: JavaScript code to dynamically modify responses
  - Access to `response`, `request`, and `helpers` objects
  - Built-in helper functions for IDs, timestamps, and random data
  - **XML Helpers**: `parseXML()`, `serializeXML()` for XML manipulation
  - **Google Helpers**: `parseGoogleJSON()`, `stripGooglePrefix()` for Google responses
  - Sandboxed execution with dangerous pattern detection

#### v2.7.x - Multi-Context Support

Flexible viewing modes and architecture improvements:

- **Standalone Window Mode**: Open Moq in a separate 800×600 window
  - Perfect for multi-monitor setups
  - Full state synchronization across DevTools and window
  - Single instance enforcement
- **Code Architecture Refactoring**: Major cleanup for maintainability
  - Extracted 5 custom hooks for feature separation
  - Reduced App.tsx from 570 to 350 lines
  - Improved performance with proper memoization

## Troubleshooting

### Extension Not Working

- Ensure **DevTools is open** - the extension only works in DevTools panel
- Check if "Enable Mocking" toggle is ON (in header)
- Verify individual rule toggles are enabled
- Check URL pattern matches your request
- Verify HTTP method matches (or leave empty for all methods)
- Check JSON syntax is valid (error will prevent rule creation)

### Can't Find Moq Panel

- Open Chrome DevTools (Cmd+Option+I or Ctrl+Shift+I)
- Look for "Moq" tab in the top panel
- If not visible, click the **>>** menu and select "Moq"
- **Reload the extension** if panel doesn't appear
- Close and reopen DevTools after reloading extension

### Requests Not Being Logged

- Ensure **DevTools is open** on the tab you want to monitor
- Click "Record" button in Moq panel (red circle icon)
- Recording is tab-specific
- Only fetch/XHR requests are logged (not images, CSS, fonts)
- Mocked requests are automatically filtered out
- Check that the page is making actual network requests
- Recording status shows the current tab title

### JSON Validation Errors

- Wait 500ms after typing for validation to run (throttled)
- Use "Beautify" button to auto-format valid JSON
- Empty response body is valid
- Error message shows specific JSON syntax issue
- Cannot create/update rule while JSON is invalid

### DevTools Prompt Not Appearing

- The prompt only shows when clicking the extension icon
- Content script must be loaded on the page (HTTP/HTTPS pages only)
- Won't appear on chrome:// pages or other restricted pages
- Reload the page if prompt doesn't show

### Slow Page Loading

- **This should not happen** - only a lightweight content script is injected
- Content script is 2.8KB and runs at document_idle
- If you experience slowness, try disabling other extensions
- Check browser console for unrelated errors

## Testing

Moq has comprehensive test coverage for critical business logic:

### Test Suites

- **214 unit tests** covering URL matching, storage, utilities, context handling, translations, folder management, and more
- **Coverage highlights**:
  - URL matching logic: 100%
  - Context handler: 100%
  - Utils: 100%
  - Storage: 85%

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Test Structure

- `src/__tests__/utils.test.ts` - Utility functions
- `src/__tests__/storage.test.ts` - Storage operations
- `src/__tests__/contextHandler.test.ts` - Extension context handling
- `src/__tests__/urlMatching.test.ts` - URL pattern matching (exact, wildcard, regex)
- `src/__tests__/folderManagement.test.ts` - Folder management operations
- `src/__tests__/ruleValidation.test.ts` - Rule and response hook validation
- `src/__tests__/i18n.test.ts` - Translation validation

### Mock Not Applied

- Verify the URL pattern exactly matches
- Check HTTP method matches (or set to "Any")
- Ensure Content Type is correct
- Test with wildcard pattern first for debugging

### Performance Issues

- Clear request log regularly (1000+ entries can slow down UI)
- Disable rules you're not using
- Use specific URL patterns instead of `*` when possible

## FAQ

**Q: Can I mock requests on any website?**  
A: Yes, the extension has host_permissions for all URLs.

**Q: How do I access Moq?**  
A: Open Chrome DevTools (Cmd+Option+I or Ctrl+Shift+I) and look for the "Moq" tab. Click the extension icon for a helpful prompt.

**Q: Are my mock rules shared across devices?**  
A: No, rules are stored locally in Chrome storage. Use the export/import feature to transfer rules between devices.

**Q: Can I mock WebSocket connections?**  
A: No, currently only HTTP/HTTPS requests are supported.

**Q: Does this work in Incognito mode?**  
A: Yes, if you enable "Allow in Incognito" in extension settings (chrome://extensions).

**Q: Can I use this for automated testing?**  
A: This extension is designed for manual testing in DevTools. For automated tests, use tools like MSW or Nock.

**Q: Why is recording tab-specific?**  
A: Recording tracks requests from a specific tab to avoid confusion when working with multiple pages. The recording status shows which tab is being monitored.

**Q: Can I use the extension without opening DevTools?**  
A: No, Moq operates exclusively as a DevTools panel. This design provides better integration with your development workflow.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this extension in your projects.

## Credits

Built with:

- TypeScript 5.3.3
- React 19.2.3
- Chrome Extension Manifest V3
- Webpack 5.104.1
- Tailwind CSS 3.4.1
- Chrome DevTools Extension APIs

---

**Need help?** Open an issue on GitHub: https://github.com/PavelShpakovich/mock-ext/issues
