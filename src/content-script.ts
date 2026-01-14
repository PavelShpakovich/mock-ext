// This script runs in ISOLATED world
// Bridges between MAIN world (page) and extension background

import { Storage } from './storage';
import { MockRule } from './types';

class ContentScriptBridge {
  private hasInjectedInterceptor = false;

  async initialize() {
    // Inject interceptor into MAIN world
    await this.injectInterceptor();

    // Listen for rule updates from background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'updateRulesInPage') {
        this.updatePageRules(message.rules);
        sendResponse({ success: true });
        return true;
      }

      if (message.action === 'openDevTools') {
        this.showDevToolsPrompt(message.language || 'en');
        sendResponse({ success: true });
        return true;
      }

      // Return false for unhandled messages
      return false;
    });

    // Send initial rules to page
    try {
      const rules = await Storage.getRules();
      const settings = await Storage.getSettings();

      if (settings.enabled) {
        this.updatePageRules(rules.filter((r) => r.enabled));
      }
    } catch (error) {
      console.error('[MockAPI] Failed to load initial rules:', error);
    }

    // Listen for interception notifications from page
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      if (event.data.type === 'MOCKAPI_INTERCEPTED') {
        // Log to background that a request was mocked
        chrome.runtime
          .sendMessage({
            action: 'logMockedRequest',
            url: event.data.url,
            method: event.data.method,
            ruleId: event.data.ruleId,
            statusCode: event.data.statusCode,
          })
          .catch(() => {
            // Extension context might be invalidated
          });
      }

      if (event.data.type === 'MOCKAPI_RESPONSE_CAPTURED') {
        // Forward captured response to background
        chrome.runtime
          .sendMessage({
            action: 'logCapturedResponse',
            url: event.data.url,
            method: event.data.method,
            statusCode: event.data.statusCode,
            contentType: event.data.contentType,
            responseBody: event.data.responseBody,
          })
          .catch(() => {
            // Extension context might be invalidated
          });
      }
    });
  }

  private async injectInterceptor(): Promise<void> {
    if (this.hasInjectedInterceptor) return;

    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('interceptor.js');
        script.onload = () => {
          script.remove();
          this.hasInjectedInterceptor = true;
          // Wait a bit for the interceptor to initialize
          setTimeout(() => resolve(), 100);
        };
        script.onerror = () => {
          // eslint-disable-next-line no-console
          console.error('[MockAPI] Failed to inject interceptor script');
          script.remove();
          reject(new Error('Failed to inject interceptor'));
        };

        (document.head || document.documentElement).appendChild(script);
      } catch (error) {
        console.error('[MockAPI] Error injecting interceptor:', error);
        reject(error);
      }
    });
  }

  private updatePageRules(rules: MockRule[]) {
    window.postMessage(
      {
        type: 'MOCKAPI_UPDATE_RULES',
        rules: rules,
      },
      '*'
    );
  }

  private showDevToolsPrompt(language: string = 'en') {
    const translations = {
      en: {
        title: 'Open DevTools',
        message: 'to open DevTools and access MockAPI panel',
        gotIt: 'Got it',
      },
      ru: {
        title: 'Открыть DevTools',
        message: 'чтобы открыть DevTools и получить доступ к панели MockAPI',
        gotIt: 'Понятно',
      },
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    // Remove any existing prompt
    const existing = document.getElementById('mockapi-devtools-prompt');
    if (existing) {
      existing.remove();
    }

    // Create prompt overlay
    const overlay = document.createElement('div');
    overlay.id = 'mockapi-devtools-prompt';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      border: 1px solid #10b981;
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 320px;
      max-width: 400px;
      backdrop-filter: blur(10px);
      animation: slideIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      </style>
      <div style="display: flex; align-items: start; gap: 16px;">
        <div style="font-size: 28px; flex-shrink: 0;">🛠️</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #10b981;">
            ${t.title}
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #d1d5db;">
            Press <strong style="color: #10b981; font-family: monospace;">Cmd+Option+I</strong> (Mac) or 
            <strong style="color: #10b981; font-family: monospace;">Ctrl+Shift+I</strong> (Win) 
            ${t.message}
          </p>
          <button 
            id="mockapi-prompt-close"
            style="
              background: #10b981;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
              width: 100%;
            "
            onmouseover="this.style.background='#059669'"
            onmouseout="this.style.background='#10b981'"
          >
            ${t.gotIt}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-dismiss after 10 seconds
    const timeout = setTimeout(() => {
      overlay.remove();
    }, 10000);

    // Manual dismiss
    const closeBtn = document.getElementById('mockapi-prompt-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearTimeout(timeout);
        overlay.remove();
      });
    }
  }
}

// Initialize bridge
const bridge = new ContentScriptBridge();
bridge.initialize().catch((error) => {
  console.error('[MockAPI] Failed to initialize content script bridge:', error);
});

export {};
