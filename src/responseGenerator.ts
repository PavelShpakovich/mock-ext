import { MockRule } from './types';

export class ResponseGenerator {
  createDataURL(rule: MockRule): string {
    const contentType = rule.contentType || 'application/json';
    let content = this.prepareResponseContent(rule.response);
    // Apply dynamic variables to the content
    content = this.applyDynamicVariables(content);
    return `data:${contentType},${encodeURIComponent(content)}`;
  }

  private prepareResponseContent(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }
    return JSON.stringify(response);
  }

  applyDynamicVariables(response: string): string {
    let result = response;

    result = result.replace(/\{\{timestamp\}\}/g, Date.now().toString());
    result = result.replace(/\{\{uuid\}\}/g, this.generateUUID());
    result = result.replace(/\{\{random_number\}\}/g, () => Math.floor(Math.random() * 1000000).toString());
    result = result.replace(/\{\{random_string\}\}/g, () => Math.random().toString(36).substring(7));

    return result;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  toDeclarativeRule(rule: MockRule, ruleId: number): chrome.declarativeNetRequest.Rule {
    // Build the condition based on match type
    const condition: chrome.declarativeNetRequest.RuleCondition = {
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
      ] as chrome.declarativeNetRequest.ResourceType[],
    };

    // Use regexFilter for regex match type, urlFilter otherwise
    if (rule.matchType === 'regex') {
      condition.regexFilter = rule.urlPattern;
    } else {
      condition.urlFilter = rule.urlPattern;
    }

    // Add request method filter if specified
    if (rule.method) {
      condition.requestMethods = [rule.method.toLowerCase() as chrome.declarativeNetRequest.RequestMethod];
    }

    return {
      id: ruleId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          url: this.createDataURL(rule),
        },
      },
      condition,
    };
  }
}
