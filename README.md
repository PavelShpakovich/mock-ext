# MockAPI

A powerful Chrome DevTools extension for mocking API requests during development and testing. Intercepts HTTP requests at the JavaScript level and responds with custom data, status codes, and delays without modifying your application code.

## ✨ What's New in v2.0

**🚀 Complete Architecture Redesign**: MockAPI now uses client-side JavaScript interception instead of Chrome's declarativeNetRequest API, unlocking full control over:

- ✅ **Custom Status Codes** - Finally works! Return 404, 500, or any status code
- ✅ **Response Delays** - Accurately simulate network latency
- ✅ **Better Reliability** - Intercepts at JavaScript level before network calls
- ✅ **Enhanced Debugging** - Comprehensive console logging for troubleshooting

## Features

### 🎯 Request Interception

- **URL Pattern Matching**: Use wildcards (`*`), exact match, or regex patterns to match URLs
- **HTTP Method Filtering**: Mock specific methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD) or all methods
- **Custom Responses**: Define JSON or text responses
- **✨ Status Code Control**: Set any HTTP status code (200, 404, 500, etc.) - **Now fully functional!**
- **✨ Response Delay**: Simulate network latency for testing loading states - **Now fully functional!**
- **✨ Custom Response Headers**: Add custom HTTP headers to mock responses (NEW in v2.1)
  - Define multiple key-value header pairs
  - Auto-populates from captured real responses
  - Perfect for testing CORS, authentication, caching behaviors
- **Client-Side Interception**: Intercepts fetch() and XMLHttpRequest before they reach the network

### 🔄 Dynamic Variables

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

### 📊 Request Logging & Filtering

- **Page-Specific Recording**: Record XMLHttpRequest/fetch requests from a specific browser tab
- **Manual Control**: Start/stop recording with button controls
- **Advanced Filtering**: Filter logged requests by HTTP method and status code range
  - Method filters: GET, POST, PUT, DELETE, PATCH, OPTIONS
  - Status code filters: 2xx Success, 3xx Redirect, 4xx Client Error, 5xx Server Error
- **Search & Filter**: Quickly find requests with text search and multiple filters
- **Request Details**: View URL, method, status code, content type, and timestamp
- **Response Headers Capture**: All response headers captured and stored with logged requests (NEW in v2.1)
- **Up to 1000 Requests**: Automatic log rotation keeps recent requests
- **Quick Mocking**: Create mock rules directly from logged requests with "Mock This" button
  - Auto-populates all fields including captured response headers

### 🛠️ Rule Management

- **Export/Import**: Backup rules to JSON file and restore them later
- **Duplicate Rules**: Quickly copy existing rules to create variations
- **Enable/Disable**: Toggle rules on/off without deleting them
- **Search Rules**: Find rules by name or URL pattern

### 🛠️ DevTools Integration

- **Native DevTools Panel**: Integrated as a dedicated panel in Chrome DevTools
- **Developer-Focused**: Designed for seamless integration into your development workflow
- **Keyboard Shortcut Access**: Quick access via Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
- **Visual Prompt**: Helpful notification when extension icon is clicked, guiding you to open DevTools

### 💡 User Interface

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

### Opening MockAPI

1. **Open Chrome DevTools** on any webpage:
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `Ctrl + Shift + I`
   - Right-click anywhere and select "Inspect"
2. **Look for the "MockAPI" tab** in the DevTools panel (usually at the top or under >> menu)
3. **Alternative**: Click the extension icon to see a helpful prompt with the keyboard shortcut

### Creating Your First Mock Rule

1. **Open MockAPI in DevTools**
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
2. **Navigate to MockAPI panel**
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
│   ├── popup.tsx               # Main React app entry point
│   ├── devtools.ts             # DevTools panel registration
│   ├── devtools-prompt.ts      # Content script for DevTools prompt notification
│   ├── types.ts                # TypeScript type definitions
│   ├── utils.ts                # Utility functions
│   ├── storage.ts              # Chrome storage API wrapper (with batched logging)
│   ├── responseGenerator.ts    # Dynamic response generation
│   ├── performance.ts          # Performance monitoring utilities
│   ├── styles.css              # Global styles with Tailwind
│   └── components/
│       ├── App.tsx             # Main app component with tabs
│       ├── Header.tsx          # Extension header
│       ├── RulesTab.tsx        # Rules management tab
│       ├── RequestsTab.tsx     # Request logging tab
│       ├── RuleEditor.tsx      # Form for creating/editing rules
│       ├── RuleItem.tsx        # Individual rule display
│       ├── RequestItem.tsx     # Individual request display
│       └── ui/                 # Reusable UI components
│           ├── Badge.tsx
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── Input.tsx
│           ├── Select.tsx
│           ├── TabButton.tsx
│           ├── TextArea.tsx
│           └── Toggle.tsx
├── public/
│   ├── manifest.json           # Extension manifest (Manifest V3)
│   ├── popup.html              # UI HTML structure
│   ├── devtools.html           # DevTools panel entry point
│   └── icons/                  # Extension icons (SVG)
├── dist/                       # Build output (generated)
├── webpack.config.js           # Webpack configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome Extension APIs
- **DevTools Integration**: Native panel integrated into Chrome DevTools
- **TypeScript 5.3.3**: Fully typed codebase for better development experience
- **React 19.2.3**: Modern React with hooks for UI components
- **Webpack 5.104.1**: Module bundler with multiple entry points (background, popup, devtools, devtools-prompt)
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Service Worker**: Background script for request interception
- **declarativeNetRequest**: Chrome API for modifying network requests
- **webRequest API**: For logging and monitoring fetch/XHR requests only
- **Chrome Storage**: Persistent data storage for rules and logs
- **Content Script**: Lightweight script for showing DevTools prompt notification

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

- `declarativeNetRequest`: Modify network requests
- `declarativeNetRequestFeedback`: Access request modification feedback
- `webRequest`: Monitor network activity (fetch/XHR only)
- `storage`: Save rules and settings
- `activeTab`: Access current tab information
- `tabs`: Access tab information for recording
- `scripting`: Script injection for DevTools prompt
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

#### v1.2.0 - Performance & Reliability (Current)

Major improvements to logging performance and extension reliability:

- **Session Storage Logging**: Switched from persistent local storage to in-memory session storage for request logs
- **Batched Writes**: Request logs are batch written every 500ms instead of per-request, reducing I/O by up to 99%
- **Context Invalidation Handling**: Added graceful handling for service worker termination and extension reloads
- **Fallback Values**: Chrome API calls now have fallback values to prevent crashes
- **Simplified URL Matching**: Removed internal `RuleMatcher` class - URL matching is now handled natively by declarativeNetRequest
- **Fixed Regex Support**: Regex patterns now correctly use `regexFilter` instead of `urlFilter`
- **Fixed HTTP Methods**: Rules now correctly filter by HTTP method instead of matching all methods

#### v1.1.0 - DevTools Integration

The extension now operates exclusively as a DevTools panel:

- **Native DevTools Panel**: Integrated as "MockAPI" tab in Chrome DevTools
- **Removed Floating Window**: Simplified architecture with single UI mode
- **DevTools Prompt**: Lightweight notification guides users to open DevTools when clicking extension icon
- **Improved Workflow**: Better integration with existing developer tools
- **Reduced Complexity**: Eliminated window management and multi-mode support

#### v1.0.0 - Performance Optimization

Previously attempted to capture response bodies using content scripts running in MAIN and ISOLATED worlds. This approach caused:

- Severe page load performance degradation
- Request timeouts
- Complex dual-script architecture

**Decision Made**: Removed all response capture content scripts in favor of:

- Pure webRequest API for logging (fast, non-intrusive)
- Manual response body entry by users
- Dramatically improved performance with minimal page load impact

## Troubleshooting

### Extension Not Working

- Ensure **DevTools is open** - the extension only works in DevTools panel
- Check if "Enable Mocking" toggle is ON (in header)
- Verify individual rule toggles are enabled
- Check URL pattern matches your request
- Verify HTTP method matches (or leave empty for all methods)
- Check JSON syntax is valid (error will prevent rule creation)

### Can't Find MockAPI Panel

- Open Chrome DevTools (Cmd+Option+I or Ctrl+Shift+I)
- Look for "MockAPI" tab in the top panel
- If not visible, click the **>>** menu and select "MockAPI"
- **Reload the extension** if panel doesn't appear
- Close and reopen DevTools after reloading extension

### Requests Not Being Logged

- Ensure **DevTools is open** on the tab you want to monitor
- Click "Record" button in MockAPI panel (red circle icon)
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

MockAPI has comprehensive test coverage for critical business logic:

### Test Suites

- **78 unit tests** covering URL matching, storage, utilities, context handling, and translations
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
- `src/__tests__/i18n.test.ts` - Translation validation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this extension for personal or commercial projects.

## Support

For issues, questions, or feature requests, please open an issue on GitHub:
https://github.com/PavelShpakovich/mock-ext/issues

- Recording status should show the page URL
- Only HTTP/HTTPS requests are logged

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

**Q: How do I access MockAPI?**  
A: Open Chrome DevTools (Cmd+Option+I or Ctrl+Shift+I) and look for the "MockAPI" tab. Click the extension icon for a helpful prompt.

**Q: Are my mock rules shared across devices?**  
A: No, rules are stored locally in Chrome storage. Export/import features coming soon.

**Q: Can I mock WebSocket connections?**  
A: No, currently only HTTP/HTTPS requests are supported.

**Q: Does this work in Incognito mode?**  
A: Yes, if you enable "Allow in Incognito" in extension settings (chrome://extensions).

**Q: Can I use this for automated testing?**  
A: This extension is designed for manual testing in DevTools. For automated tests, use tools like MSW or Nock.

**Q: Why is recording tab-specific?**  
A: Recording tracks requests from a specific tab to avoid confusion when working with multiple pages. The recording status shows which tab is being monitored.

**Q: Can I use the extension without opening DevTools?**  
A: No, MockAPI operates exclusively as a DevTools panel. This design provides better integration with your development workflow.

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
