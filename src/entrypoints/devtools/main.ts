// Register Moq panel in DevTools
// Pass inspected tab ID via query parameter so the panel knows which tab to record
const inspectedTabId = browser.devtools.inspectedWindow.tabId;
browser.devtools.panels.create(
  'Moq',
  '', // No icon path for now, will use default
  `window.html?tabId=${inspectedTabId}`,
  () => {
    // eslint-disable-next-line no-console
    console.log('[Moq] DevTools panel created for tab', inspectedTabId);
  }
);
