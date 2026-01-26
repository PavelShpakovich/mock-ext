// This script runs in ISOLATED world
// Bridges between MAIN world (page) and extension background

import { Storage } from './storage';
import { MockRule, Settings } from './types';
import { withContextCheck } from './contextHandler';
interface RuntimeMessage {
  action: 'updateRulesInPage' | 'openDevTools';
  rules?: MockRule[];
  settings?: Settings;
  language?: string;
}

interface MessageResponse {
  success: boolean;
}

interface PageMessageData {
  type: 'MOQ_INTERCEPTED' | 'MOQ_RESPONSE_CAPTURED' | 'MOQ_INCREMENT_COUNTER';
  url?: string;
  method?: string;
  ruleId?: string;
  statusCode?: number;
  contentType?: string;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  timestamp?: number;
}
class ContentScriptBridge {
  async initialize() {
    // Interceptor is now injected declaratively via manifest.json
    // No need for dynamic injection

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));

    // Listen for messages from page
    window.addEventListener('message', this.handlePageMessage.bind(this));

    // Send initial rules to page
    await this.loadAndSendInitialRules();
  }

  private handleRuntimeMessage(
    message: RuntimeMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    if (message.action === ('ping' as any)) {
      sendResponse({ success: true } as any);
      return true;
    }

    if (message.action === 'updateRulesInPage') {
      this.updatePageRules(message.rules ?? [], message.settings);
      sendResponse({ success: true });
      return true;
    }

    if (message.action === 'openDevTools') {
      this.showDevToolsPrompt(message.language || 'en');
      sendResponse({ success: true });
      return true;
    }

    return false;
  }

  private handlePageMessage(event: MessageEvent): void {
    if (event.source !== window) return;

    if (event.data.type === 'MOQ_INTERCEPTED') {
      this.forwardMockedRequest(event.data);
    }

    if (event.data.type === 'MOQ_RESPONSE_CAPTURED') {
      this.forwardCapturedResponse(event.data);
    }

    if (event.data.type === 'MOQ_INCREMENT_COUNTER') {
      this.incrementRuleCounter(event.data.ruleId);
    }
  }

  private async loadAndSendInitialRules(): Promise<void> {
    try {
      const rules = await withContextCheck(() => Storage.getRules(), []);
      const settings = await withContextCheck(() => Storage.getSettings(), {
        enabled: false,
        logRequests: false,
        showNotifications: false,
        corsAutoFix: false,
      });

      if (settings.enabled) {
        this.updatePageRules(
          rules.filter((r) => r.enabled),
          settings
        );
      }
    } catch (error) {
      // Context invalidated, silently ignore
    }
  }

  private forwardMockedRequest(data: PageMessageData): void {
    if (!chrome.runtime?.id) return;

    chrome.runtime
      .sendMessage({
        action: 'logMockedRequest',
        url: data.url,
        method: data.method,
        ruleId: data.ruleId,
        statusCode: data.statusCode,
        timestamp: data.timestamp || Date.now(),
      })
      .catch(() => {
        // Extension context might be invalidated, ignore silently
      });
  }

  private forwardCapturedResponse(data: PageMessageData): void {
    if (!chrome.runtime?.id) return;

    chrome.runtime
      .sendMessage({
        action: 'logCapturedResponse',
        url: data.url,
        method: data.method,
        statusCode: data.statusCode,
        contentType: data.contentType,
        responseBody: data.responseBody,
        responseHeaders: data.responseHeaders,
      })
      .catch(() => {
        // Extension context might be invalidated, ignore silently
      });
  }

  private incrementRuleCounter(ruleId: string): void {
    if (!chrome.runtime?.id) return;

    chrome.runtime
      .sendMessage({
        action: 'incrementRuleCounter',
        ruleId: ruleId,
      })
      .catch(() => {
        // Extension context might be invalidated, ignore silently
      });
  }

  private updatePageRules(rules: MockRule[], settings?: Settings) {
    window.postMessage(
      {
        type: 'MOQ_UPDATE_RULES',
        rules: rules,
        settings: settings,
      },
      '*'
    );
  }

  private getTranslations(language: string) {
    const translations = {
      en: {
        title: 'Open DevTools',
        message: 'to open DevTools and access Moq panel',
        gotIt: 'Got it',
      },
      ru: {
        title: 'Открыть DevTools',
        message: 'чтобы открыть DevTools и получить доступ к панели Moq',
        gotIt: 'Понятно',
      },
    };

    return translations[language as keyof typeof translations] || translations.en;
  }

  private getPromptStyles(): string {
    return `
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
  }

  private createPromptElement(t: { title: string; message: string; gotIt: string }): HTMLElement {
    // Create DOM structure safely (prevents XSS)
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: start; gap: 16px;';

    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = 'font-size: 28px; flex-shrink: 0;';
    iconDiv.textContent = '🛠️';

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'flex: 1;';

    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #10b981;';
    title.textContent = t.title;

    const message = document.createElement('p');
    message.style.cssText = 'margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #d1d5db;';
    message.textContent = 'Press ';

    const macShortcut = document.createElement('strong');
    macShortcut.style.cssText = 'color: #10b981; font-family: monospace;';
    macShortcut.textContent = 'Cmd+Option+I';

    const orText = document.createTextNode(' (Mac) or ');

    const winShortcut = document.createElement('strong');
    winShortcut.style.cssText = 'color: #10b981; font-family: monospace;';
    winShortcut.textContent = 'Ctrl+Shift+I';

    const winText = document.createTextNode(' (Win) ');
    const messageText = document.createTextNode(t.message);

    message.appendChild(macShortcut);
    message.appendChild(orText);
    message.appendChild(winShortcut);
    message.appendChild(winText);
    message.appendChild(messageText);

    const button = document.createElement('button');
    button.id = 'moq-prompt-close';
    button.style.cssText = `
      background: #10b981;
      color: white;
      border: none;
      outline: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      width: 100%;
    `;
    button.textContent = t.gotIt;

    // Add hover effects via event listeners (safer than inline)
    button.addEventListener('mouseenter', () => {
      button.style.background = '#059669';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#10b981';
    });

    contentDiv.appendChild(title);
    contentDiv.appendChild(message);
    contentDiv.appendChild(button);
    container.appendChild(iconDiv);
    container.appendChild(contentDiv);

    return container;
  }

  private setupPromptDismissal(overlay: HTMLElement): void {
    // Auto-dismiss after 10 seconds
    const timeout = setTimeout(() => {
      overlay.remove();
    }, 10000);

    // Manual dismiss
    const closeBtn = document.getElementById('moq-prompt-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearTimeout(timeout);
        overlay.remove();
      });
    }
  }

  private showDevToolsPrompt(language: string = 'en') {
    const t = this.getTranslations(language);

    // Remove any existing prompt
    const existing = document.getElementById('moq-devtools-prompt');
    if (existing) {
      existing.remove();
    }

    // Create prompt overlay
    const overlay = document.createElement('div');
    overlay.id = 'moq-devtools-prompt';
    overlay.style.cssText = this.getPromptStyles();

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);

    // Append safely created content (prevents XSS)
    overlay.appendChild(this.createPromptElement(t));

    document.body.appendChild(overlay);
    this.setupPromptDismissal(overlay);
  }
}

// Initialize bridge
const bridge = new ContentScriptBridge();
bridge.initialize().catch((error) => {
  console.error('[Moq] Failed to initialize content script bridge:', error);
});

export {};
