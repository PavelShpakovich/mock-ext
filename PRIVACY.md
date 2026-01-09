# Privacy Policy for MockAPI Extension

**Last updated:** January 10, 2026

## Overview

MockAPI Extension is committed to protecting your privacy. This extension does not collect, store, transmit, or share any personal or user data with third parties.

## Data Collection

**We do not collect any user data.** The extension operates entirely locally on your device.

## Local Storage

All data created by the extension is stored locally in your browser using Chrome's storage API:

- **Mock Rules**: URL patterns and response configurations you create
- **Settings**: Your preferences (theme, language, recording status)
- **Request Logs**: HTTP requests captured during recording mode

**Important:** All this data remains on your device and is never transmitted to external servers.

## Permissions Explanation

The extension requires the following permissions to function:

### storage

Used exclusively to save your mock rules and settings locally in your browser. No data leaves your device.

### declarativeNetRequest

Core functionality that intercepts HTTP requests matching your defined URL patterns and returns custom mock responses. This happens entirely within your browser.

### declarativeNetRequestFeedback

Monitors which mock rules are triggered, providing feedback in the DevTools panel about rule effectiveness.

### activeTab

Identifies the currently active browser tab to display its title in the recording indicator.

### tabs

Queries basic tab information (title only) to show which tab's network traffic is being monitored.

### scripting

Injects a content script that displays a helpful notification when you click the extension icon, guiding you to the DevTools panel.

### webRequest

Logs HTTP request details (URL, method, timestamp) locally when recording mode is enabled. Helps you debug and monitor network traffic.

### Host Permissions (<all_urls>)

Required to intercept and mock HTTP requests to any domain you want to test. You maintain complete control over which URLs are mocked through your rule configurations.

## Third-Party Services

This extension does **not**:

- Communicate with any external servers
- Use analytics or tracking services
- Share data with third parties
- Collect telemetry or usage statistics

## Data Retention

All data is stored locally and persists until you:

- Clear your browser data
- Uninstall the extension
- Manually delete rules and logs within the extension

## Changes to This Policy

Any updates to this privacy policy will be reflected in future extension updates and noted in the changelog.

## Open Source

This extension is built with transparency in mind. The source code is available for review.

## Contact

If you have questions or concerns about this privacy policy, please contact us at:

- GitHub Issues: [Your repository URL]
- Email: [Your contact email]

## Your Rights

You have full control over your data:

- View all stored data through the extension interface
- Delete individual rules or clear all data at any time
- Uninstall the extension to remove all associated data

---

**Summary:** MockAPI Extension respects your privacy. All operations are local, no data is collected or transmitted, and you maintain full control over your information.
