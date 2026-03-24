import { Storage } from '../storage';
import { MockRule, Settings, ProxyRule } from '../types';
import { withContextCheck } from '../contextHandler';
import { MessageActionType } from '../enums';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: true,
  world: 'ISOLATED',

  main() {
    interface RuntimeMessage {
      action: MessageActionType.UpdateRulesInPage | MessageActionType.Ping;
      rules?: MockRule[];
      proxyRules?: ProxyRule[];
      settings?: Settings;
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
        // Listen for messages from background
        browser.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));

        // Listen for messages from page
        window.addEventListener('message', this.handlePageMessage.bind(this));

        // Send initial rules to page
        await this.loadAndSendInitialRules();
      }

      private handleRuntimeMessage(
        message: RuntimeMessage,
        _sender: Browser.runtime.MessageSender,
        sendResponse: (response: MessageResponse) => void
      ): boolean {
        if (message.action === MessageActionType.Ping) {
          sendResponse({ success: true });
          return true;
        }

        if (message.action === MessageActionType.UpdateRulesInPage) {
          this.updatePageRules(message.rules ?? [], message.proxyRules ?? [], message.settings);
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
          const proxyRules = await withContextCheck(() => Storage.getProxyRules(), []);
          const settings = await withContextCheck(() => Storage.getSettings(), {
            enabled: false,
            logRequests: false,
            showNotifications: false,
            corsAutoFix: false,
          });

          if (settings.enabled) {
            this.updatePageRules(
              rules.filter((r) => r.enabled),
              proxyRules.filter((r) => r.enabled),
              settings
            );
          }
        } catch (error) {
          // Context invalidated, silently ignore
        }
      }

      private forwardMockedRequest(data: PageMessageData): void {
        if (!browser.runtime?.id) return;

        browser.runtime
          .sendMessage({
            action: MessageActionType.LogMockedRequest,
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
        if (!browser.runtime?.id) return;

        browser.runtime
          .sendMessage({
            action: MessageActionType.LogCapturedResponse,
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
        if (!browser.runtime?.id) return;

        browser.runtime
          .sendMessage({
            action: MessageActionType.IncrementRuleCounter,
            ruleId: ruleId,
          })
          .catch(() => {
            // Extension context might be invalidated, ignore silently
          });
      }

      private updatePageRules(rules: MockRule[], proxyRules: ProxyRule[], settings?: Settings) {
        window.postMessage(
          {
            type: 'MOQ_UPDATE_RULES',
            rules: rules,
            proxyRules: proxyRules,
            settings: settings,
          },
          '*'
        );
      }
    }

    // Initialize bridge
    const bridge = new ContentScriptBridge();
    bridge.initialize().catch((error) => {
      console.error('[Moq] Failed to initialize content script bridge:', error);
    });
  },
});
