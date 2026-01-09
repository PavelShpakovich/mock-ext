# API Mocker Pro

A powerful Chrome extension for mocking API requests during development and testing. Intercept HTTP requests and respond with custom data without modifying your application code.

[Русская версия](README.ru.md)

## Features

### 🎯 Request Interception

- **URL Pattern Matching**: Use wildcards (`*`), exact match, or regex patterns to match URLs
- **HTTP Method Filtering**: Mock specific methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD) or all methods
- **Custom Responses**: Define JSON or text responses
- **Status Code Control**: Set any HTTP status code (200, 404, 500, etc.)
- **Response Delay**: Simulate network latency for testing loading states

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

### 📊 Request Logging

- **Page-Specific Recording**: Record XMLHttpRequest/fetch requests from a specific browser tab
- **Manual Control**: Start/stop recording with button controls
- **Request Details**: View URL, method, status code, content type, and timestamp
- **Search & Filter**: Quickly find requests with search functionality
- **Up to 1000 Requests**: Automatic log rotation keeps recent requests
- **Quick Mocking**: Create mock rules directly from logged requests with "Mock This" button

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

### Creating Your First Mock Rule

1. **Click the extension icon** to open API Mocker Pro
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

1. **Open the website you want to test**
2. **Click the extension icon**
3. **Go to "Requests" tab**
4. **Click "Start Recording"**
5. **Interact with the website** to generate fetch/XHR requests
6. **View logged requests** in the list (mocked requests are automatically filtered out)
7. **Click "Mock This"** on any request to create a mock rule instantly

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
│   ├── types.ts                # TypeScript type definitions
│   ├── utils.ts                # Utility functions
│   ├── storage.ts              # Chrome storage API wrapper
│   ├── ruleMatcher.ts          # URL pattern matching logic
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
│   ├── popup.html              # Popup HTML structure
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
- **TypeScript 5.3.3**: Fully typed codebase for better development experience
- **React 19.2.3**: Modern React with hooks for UI components
- **Webpack 5.104.1**: Module bundler for optimized builds
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Service Worker**: Background script for request interception
- **declarativeNetRequest**: Chrome API for modifying network requests
- **webRequest API**: For logging and monitoring fetch/XHR requests only
- **Chrome Storage**: Persistent data storage for rules and logs

### Performance Optimizations

- **Simplified Architecture**: Removed content scripts for zero page load impact
- **Request Filtering**: Only logs XMLHttpRequest/fetch, excludes images, CSS, fonts
- **Smart Deduplication**: Prevents duplicate request logging within 100ms window
- **Mocked Request Filtering**: Automatically excludes mocked requests from logs
- **Throttled Validation**: JSON validation debounced to 500ms for better UX
- **Continuous Polling**: Request count updates on all tabs when recording is active

### Key Features Removed for Performance

- **Response Body Capture**: Not available due to Chrome security limitations and performance impact
  - Users manually enter response bodies when creating mock rules
  - Focus on fast, non-intrusive request logging

### Permissions

- `declarativeNetRequest`: Modify network requests
- `declarativeNetRequestWithHostAccess`: Access host permissions for request modification
- `webRequest`: Monitor network activity (fetch/XHR only)
- `storage`: Save rules and settings
- `tabs`: Access tab information for recording
- `scripting`: Script injection capabilities
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
- **No Unused Code**: Clean codebase without legacy content script files

### Recent Architectural Changes

The extension previously attempted to capture response bodies using content scripts running in MAIN and ISOLATED worlds. This approach caused:

- Severe page load performance degradation
- Request timeouts
- Complex dual-script architecture

**Decision Made**: Removed all content scripts and response body capture functionality in favor of:

- Pure webRequest API for logging (fast, non-intrusive)
- Manual response body entry by users
- Dramatically improved performance with zero page load impact

## Troubleshooting

### Extension Not Working

- Check if "Enable Mocking" toggle is ON (header)
- Verify individual rule toggles are enabled
- Check URL pattern matches your request
- Verify HTTP method matches (or leave empty for all methods)
- Check JSON syntax is valid (error will prevent rule creation)

### Requests Not Being Logged

- Ensure you clicked "Start Recording"
- Recording is global across all tabs when enabled
- Only fetch/XHR requests are logged (not images, CSS, fonts)
- Mocked requests are automatically filtered out
- Check that the page is making actual network requests

### JSON Validation Errors

- Wait 500ms after typing for validation to run (throttled)
- Use "Beautify" button to auto-format valid JSON
- Empty response body is valid
- Error message shows specific JSON syntax issue
- Cannot create/update rule while JSON is invalid

### Slow Page Loading

- **This should not happen** - content scripts have been removed
- If you experience slowness, it's likely unrelated to the extension
- Try disabling other extensions to isolate the issue

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

**Q: Are my mock rules shared across devices?**  
A: No, rules are stored locally in Chrome storage. Export/import features coming soon.

**Q: Can I mock WebSocket connections?**  
A: No, currently only HTTP/HTTPS requests are supported.

**Q: Does this work in Incognito mode?**  
A: Yes, if you enable "Allow in Incognito" in extension settings.

**Q: Can I use this for automated testing?**  
A: This extension is designed for manual testing. For automated tests, use tools like MSW or Nock.

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

- TypeScript
- Chrome Extension Manifest V3
- Webpack
- Modern CSS with Flexbox

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.
