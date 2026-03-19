# Moq

A cross-browser extension for mocking API requests, proxying matched traffic, and modifying live responses during development and testing.
Moq intercepts `fetch()` and `XMLHttpRequest` traffic at the page level, lets you return custom mock responses or forward requests through a proxy target, and gives you a DevTools-first UI for managing rules, recording requests, and debugging behavior.

> Built with [WXT](https://wxt.dev/) for Chrome, Firefox, Safari, and Edge.

## Browser Support

| Browser | Support     | Manifest Version |
| ------- | ----------- | ---------------- |
| Chrome  | Full        | MV3              |
| Firefox | Full        | MV3              |
| Edge    | Full        | MV3              |
| Safari  | Build ready | MV3              |

Edge uses the Chrome build output because both targets are Chromium-based.

## Accessing Moq

Moq currently has three access paths:

- **DevTools panel**: the main workflow. Open DevTools on any page and select the **Moq** tab.
- **Standalone window**: available from the settings menu inside the DevTools panel.
- **Toolbar icon click**: shows a prompt that tells you how to open DevTools quickly.
  The extension icon does **not** open a full popup UI at the moment.

## Development

```bash
# Development
npm run dev              # Chrome / Chromium
npm run dev:firefox      # Firefox

# Production builds
npm run build            # Chrome / Chromium
npm run build:chrome     # Chrome / Chromium
npm run build:firefox    # Firefox
npm run build:safari     # Safari
npm run build:all        # All supported browser targets

# Release archives
npm run zip              # Chrome / Chromium zip
npm run zip:chrome
npm run zip:firefox
npm run zip:safari
npm run zip:all

# Quality checks
npm run lint
npm run type-check
npm test
npm run test:coverage
```

### Build Output

- Chrome / Edge: `build/chrome-mv3/`
- Firefox: `build/firefox-mv3/`
- Safari: `build/safari-mv3/`
- Release archives: `releases/moq-extension-{browser}-v{version}.zip`

See [WXT_MIGRATION.md](WXT_MIGRATION.md) for migration-specific notes.

## What's New in v2.15.3

### Header Controls Overhaul

- **Enabled / Disabled** is now always visible as a pill badge next to the app title
- **CORS** and **Record / Stop** are inline controls instead of being hidden behind a controls dropdown
- Active states use consistent green and red status styling
- The recording indicator now sits on its own row so the header layout stays stable on narrow widths

### Recent Follow-up Fixes

- **v2.15.2**: rule import/export now preserves folders using a versioned export format
- **v2.15.1**: the **Ungrouped Rules** heading now renders in the correct position in the list

## Features

### Mock Rules

- Match requests with **wildcard**, **exact**, or **regex** URL patterns
- Filter by HTTP method or match any method
- Return custom status codes, delays, headers, and response bodies
- Support JSON and plain-text responses
- Track match counts and last-matched timestamps
- Duplicate, enable/disable, search, export, and import rules

### Response Hooks and Passthrough Mode

- Add JavaScript **response hooks** to modify responses dynamically
- Choose between:
  - **Modify Mock Response**: apply the hook to the configured mock body
  - **Passthrough + Modify**: forward the real request and transform the real response
- Hook context includes `response`, `request`, and helper utilities
- Built-in helpers include `uuid()`, `timestamp()`, `randomNumber()`, and `randomString()`
- Hook validation and runtime restrictions block dangerous globals such as `window`, `document`, `eval`, and `fetch`

### Proxy Rules

- Forward matching requests to a different target server
- Rewrite paths with `from` / `to` rewrite rules
- Attach response hooks to proxied responses
- Detect conflicts when a proxy overlaps an existing mock rule
- Import/export proxy rules and switch between compact and detailed layouts

### Request Recording

- Record `fetch()` and `XMLHttpRequest` traffic from the active inspected tab
- Automatically reload the page when recording starts so interceptors are active immediately
- Capture status, headers, content type, timestamps, and response bodies
- Create mock rules or proxy rules directly from recorded requests
- Filter logs by text, method, and status range

### CORS Auto Fix

- Uses `declarativeNetRequest` to inject CORS headers at the network layer
- Works across matched requests without creating explicit mock rules
- Useful for third-party APIs, local services, and cross-origin development flows
- Can be toggled independently from recording

### Rule Organization

- Organize rules into folders, including nested folders
- Bulk enable or disable all rules in a folder
- Keep ungrouped rules visible in a dedicated section
- Import/export rules together with folder structure
- Reorder rules and folders with drag and drop

### UI and Workflow

- Separate **Rules**, **Proxy**, and **Requests** tabs
- Compact and detailed views for both rules and proxy rules
- Theme support: **System**, **Light**, and **Dark**
- Internationalization: **English** and **Russian**
- DevTools-first workflow with optional standalone window mode

### Dynamic Variables

Use built-in placeholders inside mock responses:

- `{{timestamp}}`
- `{{uuid}}`
- `{{random_number}}`
- `{{random_string}}`

Example:

```json
{
  "id": "{{uuid}}",
  "createdAt": {{timestamp}},
  "orderNumber": {{random_number}},
  "token": "{{random_string}}"
}
```

## Installation

### From Source

1. Clone the repository

   ```bash
   git clone https://github.com/PavelShpakovich/mock-ext.git
   cd mock-ext
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Build the target you want to load

   ```bash
   npm run build
   ```

4. Load the extension

   - **Chrome / Edge**:
     - Open `chrome://extensions` or `edge://extensions`
     - Enable **Developer mode**
     - Click **Load unpacked**
     - Select `build/chrome-mv3/`
   - **Firefox**:
     - Open `about:debugging#/runtime/this-firefox`
     - Click **Load Temporary Add-on**
     - Select `build/firefox-mv3/manifest.json`
   - **Safari**:
     - Run `npm run build:safari`
     - Use the generated `build/safari-mv3/` output in your Safari extension packaging flow

## Quick Start

### Open Moq

1. Open DevTools on the page you want to work with
   - macOS: `Cmd + Option + I`
   - Windows / Linux: `Ctrl + Shift + I`
2. Select the **Moq** tab in DevTools
3. If you clicked the toolbar icon instead, follow the prompt to open DevTools

### Create Your First Mock Rule

1. Open the **Rules** tab
2. Click **Add Rule**
3. Fill in the form:

   - **Rule Name**: `Mock User API`
   - **URL Pattern**: `https://api.example.com/users/*`
   - **Match Type**: `Wildcard`
   - **Method**: `GET`
   - **Status Code**: `200`
   - **Content Type**: `JSON`
   - **Response Body**:

     ```json
     {
       "id": "{{uuid}}",
       "name": "Test User",
       "email": "test@example.com"
     }
     ```

4. Save the rule
5. Click the **Enabled** pill if Moq is disabled
6. Enable the rule

### Record Requests and Turn Them Into Rules

1. Open the **Requests** tab
2. Click **Record**
3. Interact with the page
4. Inspect the captured requests
5. Use **Mock This** or **Proxy This** on a recorded request to bootstrap a rule
6. Click **Stop** when finished

## Usage Examples

### Mock an API Endpoint

```text
URL Pattern: https://api.github.com/users/*
Method: GET
Response:
{
  "login": "testuser",
  "id": {{random_number}},
  "created_at": "{{timestamp}}"
}
```

### Mock an Error Response

```text
URL Pattern: https://api.example.com/checkout
Method: POST
Status Code: 500
Response:
{
  "error": "Payment service unavailable",
  "code": "SERVICE_ERROR"
}
```

### Simulate a Slow Response

```text
URL Pattern: https://api.example.com/data
Delay: 3000
Response: {"data": "slow response"}
```

### Regex Matching

```text
URL Pattern: https://api\.example\.com/(users|customers)/\d+
Match Type: Regex
Response: {"id": {{random_number}}, "type": "entity"}
```

### Proxy to a Local Backend

```text
URL Pattern: https://api.example.com/v1/*
Proxy Target: http://localhost:3000
Path Rewrite From: /v1
Path Rewrite To: /api
```

## URL Pattern Matching

### Wildcard

- `*` matches any characters
- Examples:
  - `https://api.example.com/*`
  - `https://*/users`
  - `*://api.example.com/v*/users`

### Exact Match

- Matches the URL exactly as written
- Best when you want a single endpoint with no pattern expansion

### Regex

- Uses JavaScript regular expression syntax
- Do not include leading or trailing `/`
- Examples:
  - `https://api\.example\.com/users/\d+`
  - `https://.*\.example\.com/.*`

## Project Structure

```text
mock-ext/
├── src/
│   ├── components/             # React UI
│   ├── config/                 # UI/editor configuration
│   ├── contexts/               # Theme and i18n providers
│   ├── entrypoints/            # WXT entrypoints
│   │   ├── background.ts
│   │   ├── content.content.ts
│   │   ├── devtools/
│   │   ├── devtools-prompt.content.ts
│   │   ├── interceptor.content.ts
│   │   └── window/
│   ├── helpers/                # Business logic and utilities
│   ├── hooks/                  # Feature hooks
│   ├── locales/                # Translations
│   ├── __tests__/              # Jest test suites
│   ├── storage.ts              # Storage layer
│   ├── types.ts                # Shared types
│   └── styles.css              # Global styles
├── public/                     # Static assets copied into builds
├── build/                      # Generated browser builds
├── releases/                   # Generated zip artifacts
├── jest.config.js
├── package.json
├── tsconfig.json
└── wxt.config.ts
```

## Technical Details

- **WXT** for cross-browser extension builds
- **Manifest V3** architecture
- **React 19 + TypeScript 5** for the UI layer
- **Tailwind CSS 4** for styling
- **MAIN-world interceptor** for request interception before network execution
- **Background service worker** for state coordination, badge updates, recording state, and CORS ruleset sync
- **Cross-context synchronization** between DevTools and standalone window modes

## Permissions

- `storage`: persist rules, folders, proxy rules, and settings
- `activeTab`: interact with the current inspected page
- `tabs`: recording and tab metadata
- `contextMenus`: action context menu integration
- `declarativeNetRequest`: network-level CORS header injection
- `host_permissions: <all_urls>`: interception and logging across sites

## Data Storage

Moq stores data locally in the browser:

- `browser.storage.local`
  - mock rules
  - proxy rules
  - folders
  - user settings
- `browser.storage.session`
  - request log

Request logs are buffered and flushed in batches, capped at 1000 entries, and constrained to roughly 5 MB in session storage.

## Troubleshooting

### Moq Tab Is Missing

- Open DevTools first; Moq registers as a DevTools panel
- Check the `>>` overflow menu in DevTools tabs
- Reload the extension after rebuilding or reinstalling it
- Close and reopen DevTools if the panel still does not appear

### The Toolbar Icon Did Not Open Moq

- This is expected: the icon click shows a DevTools prompt, not the full UI
- Open DevTools and use the **Moq** tab
- If you want a separate window, open it from Moq settings inside DevTools

### A Mock Rule Is Not Matching

- Make sure the global **Enabled** pill is on
- Verify the individual rule is enabled
- Check the URL pattern and match type
- Check the HTTP method, or switch to **Any Method**
- Start with a wildcard pattern if you are narrowing down matching issues

### Requests Are Not Being Recorded

- Start recording from the tab you want to inspect
- Let Moq reload the page when recording begins
- Only `fetch()` and `XMLHttpRequest` traffic is recorded
- Restricted browser pages such as `chrome://` cannot be instrumented

### Import Shows a Security Warning

- Moq warns when imported rules contain executable response hooks
- Only import rules from sources you trust

## Testing

The project includes Jest coverage for core behavior including:

- background service worker behavior
- request recording
- import/export
- folder management
- headers and formatting helpers
- rule validation
- i18n
- URL matching
- storage behavior

Run the test suite with:

```bash
npm test
npm run test:watch
npm run test:coverage
```

## FAQ

**Q: Can I use Moq without DevTools?**  
A: You can use the standalone window once it is opened from DevTools, but the primary entry point is still the DevTools panel.

**Q: Why does clicking the extension icon not open the full app?**  
A: The toolbar action currently shows a DevTools prompt instead of a popup.

**Q: Can I mock requests on any website?**  
A: Yes. Moq requests host access for all URLs.

**Q: Are rules synced across devices?**  
A: No. Rules are stored locally in browser extension storage. Use export/import if you need to move them.

**Q: Can I use Moq in Incognito mode?**  
A: Yes, if you enable **Allow in Incognito** in the browser's extension settings.

**Q: Does Moq support WebSockets?**  
A: No. Moq currently targets HTTP/HTTPS traffic through `fetch()` and `XMLHttpRequest`.

**Q: Is this intended for automated end-to-end testing?**  
A: It is primarily a manual debugging and development tool. For automated test suites, dedicated tools such as MSW or Nock are usually a better fit.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make focused changes
4. Run relevant tests
5. Open a pull request

## License

MIT

## Credits

Built with:

- WXT
- React
- TypeScript
- Tailwind CSS
- Browser Extension Manifest V3 APIs

Need help? Open an issue on GitHub: https://github.com/PavelShpakovich/mock-ext/issues
