# API Mocker ProA powerful Chrome extension for mocking API requests during development and testing. Intercept HTTP requests and respond with custom data without modifying your application code.[Русская версия](README.ru.md)## Features### 🎯 Request Interception- **URL Pattern Matching**: Use wildcards (`*`) or regex patterns to match URLs- **HTTP Method Filtering**: Mock specific methods (GET, POST, PUT, DELETE, PATCH) or all methods- **Custom Responses**: Define JSON, text, HTML, or XML responses- **Status Code Control**: Set any HTTP status code (200, 404, 500, etc.)- **Response Delay**: Simulate network latency for testing loading states### 🔄 Dynamic VariablesGenerate dynamic data in responses using built-in variables:- `{{timestamp}}` - Current Unix timestamp- `{{uuid}}` - Random UUID v4- `{{random_number}}` - Random number between 0-999999Example:`json{  "id": "{{uuid}}",  "timestamp": {{timestamp}},  "order_number": {{random_number}}}`### 📊 Request Logging- **Page-Specific Recording**: Record requests from a specific browser tab- **Manual Control**: Start/stop recording with button controls- **Request Details**: View URL, method, status code, and timestamp- **Search & Filter**: Quickly find requests with search functionality- **Up to 1000 Requests**: Automatic log rotation keeps recent requests- **Quick Mocking**: Create mock rules directly from logged requests with "Mock This" button### 💡 User Interface- **Floating Window**: Opens in a separate popup window for easy multitasking- **Two Tabs**: "Mock Rules" for managing mocks, "Requests Log" for viewing captured requests- **Toggle Controls**: Enable/disable individual rules or global mocking- **Visual Feedback**: Clear indicators for enabled/disabled rules and recording status- **Search**: Filter rules and requests instantly- **Responsive Design**: Clean, modern interface with smooth animations## Installation### From Source1. **Clone or download this repository** `bash   git clone <repository-url>   cd api-mocker-extension   `2. **Install dependencies** `bash   npm install   `3. **Build the extension** `bash   npm run build   ` This creates a `dist` folder with the compiled extension.4. **Load in Chrome** - Open Chrome and navigate to `chrome://extensions` - Enable "Developer mode" (toggle in top-right corner) - Click "Load unpacked" - Select the `dist` folder### Development ModeFor development with auto-rebuild on changes:`bashnpm run dev`## Quick Start### Creating Your First Mock Rule1. **Click the extension icon** to open API Mocker2. **Go to "Mock Rules" tab**3. **Click "+ Add Rule"**4. **Fill in the form**: - **Rule Name**: "Mock User API" - **URL Pattern**: `https://api.example.com/users/*` - **Match Type**: Wildcard - **Method**: GET - **Status Code**: 200 - **Content Type**: application/json - **Response Body**: `json     {       "id": "{{uuid}}",       "name": "Test User",       "email": "test@example.com"     }     `5. **Click "Save Rule"**6. **Toggle the rule ON** using the switchNow all GET requests to `https://api.example.com/users/*` will return your mock data!### Recording and Mocking Requests1. **Open the website you want to test**2. **Click the extension icon**3. **Go to "Requests Log" tab**4. **Click "Start Recording This Page"**5. **Interact with the website** to generate requests6. **View logged requests** in the list7. **Click "Mock This"** on any request to create a mock rule instantly## Usage Examples### Mock API Endpoint`URL Pattern: https://api.github.com/users/*Method: GETResponse:{  "login": "testuser",  "id": {{random_number}},  "created_at": "{{timestamp}}"}`### Mock Error Response`URL Pattern: https://api.example.com/checkoutMethod: POSTStatus Code: 500Response:{  "error": "Payment service unavailable",  "code": "SERVICE_ERROR"}`### Simulate Slow Network`URL Pattern: https://api.example.com/dataDelay: 3000 (3 seconds)Response: {"data": "slow response"}`### Regex Pattern Matching`URL Pattern: https://api\.example\.com/(users|customers)/\d+Match Type: RegexResponse: {"id": {{random_number}}, "type": "entity"}`## URL Pattern Matching### Wildcard Pattern- `*` matches any characters- Examples: - `https://api.example.com/*` - matches all requests to this domain - `https://*/users` - matches /users on any domain - `*://api.example.com/v*/users` - matches any protocol and version### Regex Pattern- Full regex support with JavaScript syntax- Don't include leading/trailing slashes- Examples: - `https://api\.example\.com/users/\d+` - matches /users/123 - `https://.*\.example\.com/.*` - matches all subdomains## Project Structure```api-mocker-extension/├── src/│ ├── background.ts # Service worker (request interception)│ ├── popup.ts # UI logic and event handlers│ ├── storage.ts # Chrome storage API wrapper│ ├── types.ts # TypeScript type definitions│ ├── utils.ts # Utility functions│ ├── ruleMatcher.ts # URL pattern matching logic│ └── responseGenerator.ts # Dynamic response generation

├── public/
│ ├── manifest.json # Extension manifest
│ ├── popup.html # UI structure
│ ├── popup.css # Styling
│ └── icons/ # Extension icons
├── dist/ # Build output (generated)
├── webpack.config.js # Webpack configuration
├── tsconfig.json # TypeScript configuration
└── package.json # Project dependencies

````

## Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome Extension APIs
- **TypeScript**: Fully typed codebase for better development experience
- **Webpack**: Module bundler for optimized builds
- **Service Worker**: Background script for request interception
- **declarativeNetRequest**: Chrome API for modifying network requests
- **webRequest API**: For logging and monitoring requests
- **Chrome Storage**: Persistent data storage for rules and logs

### Permissions
- `declarativeNetRequest`: Modify network requests
- `webRequest`: Monitor network activity
- `storage`: Save rules and settings
- `tabs`: Access tab information for recording
- `contextMenus`: Context menu integration
- `host_permissions`: Access to all URLs for interception

### Data Storage
All data is stored locally using `chrome.storage.local`:
- Mock rules with complete configuration
- Request logs (up to 1000 entries)
- Settings and preferences
- Auto-save drafts for unsaved rules

## Development

### Building
```bash
npm run build      # Production build
npm run dev        # Development build with watch mode
npm run clean      # Remove dist folder
````

### Code Structure

**background.ts** - Service Worker

- Initializes on extension install/update
- Manages declarativeNetRequest rules
- Listens for webRequest events to log requests
- Handles messages from popup
- Manages recording state

**popup.ts** - UI Controller

- Manages two-tab interface
- Handles form interactions
- Real-time request log polling
- Auto-save draft functionality
- Search and filter logic

**storage.ts** - Data Layer

- Wraps Chrome Storage API
- Provides type-safe storage operations
- Manages rules, logs, and settings
- Handles data validation

**responseGenerator.ts** - Mock Engine

- Converts mock rules to Chrome declarativeNetRequest format
- Processes dynamic variables
- Generates base64-encoded responses
- Handles different content types

**ruleMatcher.ts** - Pattern Matching

- Wildcard pattern matching
- Regex pattern matching
- URL comparison logic

## Troubleshooting

### Extension Not Working

- Check if "Mocking Enabled" toggle is ON (header)
- Verify individual rule toggles are enabled
- Check URL pattern matches your request
- Open DevTools Console to see extension logs

### Requests Not Being Logged

- Ensure you clicked "Start Recording This Page"
- Check that you're on the correct tab (recording is tab-specific)
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
