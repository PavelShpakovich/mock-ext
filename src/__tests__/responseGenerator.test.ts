import { ResponseGenerator } from '../responseGenerator';
import { MockRule } from '../types';

describe('ResponseGenerator', () => {
  let generator: ResponseGenerator;

  beforeEach(() => {
    generator = new ResponseGenerator();
    // Fix the random values for consistent testing
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    jest.spyOn(Date, 'now').mockReturnValue(1705075200000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('applyDynamicVariables', () => {
    it('should replace {{timestamp}} with current timestamp', () => {
      const response = '{"time": {{timestamp}}}';
      const result = generator.applyDynamicVariables(response);
      expect(result).toBe('{"time": 1705075200000}');
    });

    it('should replace {{uuid}} with generated UUID', () => {
      const response = '{"id": "{{uuid}}"}';
      const result = generator.applyDynamicVariables(response);
      expect(result).toMatch(/"id": "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"/i);
    });

    it('should replace {{random_number}} with random number', () => {
      const response = '{"num": {{random_number}}}';
      const result = generator.applyDynamicVariables(response);
      expect(result).toContain('"num": ');
      expect(parseInt(result.match(/\d+/)![0])).toBeGreaterThanOrEqual(0);
      expect(parseInt(result.match(/\d+/)![0])).toBeLessThan(1000000);
    });

    it('should replace {{random_string}} with random string', () => {
      const response = '{"str": "{{random_string}}"}';
      const result = generator.applyDynamicVariables(response);
      // Random string generated from Math.random().toString(36).substring(7)
      expect(result).toContain('"str":');
      expect(result).not.toContain('{{random_string}}');
    });

    it('should replace multiple variables at once', () => {
      const response = '{"id": "{{uuid}}", "time": {{timestamp}}, "num": {{random_number}}}';
      const result = generator.applyDynamicVariables(response);
      expect(result).toContain('"time": 1705075200000');
      expect(result).toMatch(/"id": "[0-9a-f-]+"/);
      expect(result).toMatch(/"num": \d+/);
    });

    it('should handle strings without variables', () => {
      const response = '{"static": "value"}';
      const result = generator.applyDynamicVariables(response);
      expect(result).toBe('{"static": "value"}');
    });
  });

  describe('createDataURL', () => {
    it('should create data URL from string response', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Test',
        enabled: true,
        urlPattern: 'https://example.com',
        matchType: 'exact',
        method: 'GET',
        statusCode: 200,
        response: 'test response',
        contentType: 'text/plain',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const dataUrl = generator.createDataURL(rule);
      expect(dataUrl).toBe('data:text/plain,test%20response');
    });

    it('should create data URL from object response', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Test',
        enabled: true,
        urlPattern: 'https://example.com',
        matchType: 'exact',
        method: 'GET',
        statusCode: 200,
        response: { key: 'value' },
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const dataUrl = generator.createDataURL(rule);
      expect(dataUrl).toContain('data:application/json,');
      expect(decodeURIComponent(dataUrl.split(',')[1])).toBe('{"key":"value"}');
    });

    it('should use default content type if not specified', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Test',
        enabled: true,
        urlPattern: 'https://example.com',
        matchType: 'exact',
        method: 'GET',
        statusCode: 200,
        response: 'test',
        contentType: '',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      // @ts-ignore - testing runtime behavior
      rule.contentType = undefined;
      const dataUrl = generator.createDataURL(rule);
      expect(dataUrl).toContain('data:application/json,');
    });
  });

  describe('toDeclarativeRule', () => {
    it('should convert MockRule to declarativeNetRequest rule', () => {
      const rule: MockRule = {
        id: 'test-id',
        name: 'Test Rule',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: 'wildcard',
        method: 'GET',
        statusCode: 200,
        response: { data: 'test' },
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const declarativeRule = generator.toDeclarativeRule(rule, 1);

      expect(declarativeRule.id).toBe(1);
      expect(declarativeRule.priority).toBe(1);
      expect(declarativeRule.action.type).toBe('redirect');
      expect(declarativeRule.action.redirect?.url).toBeDefined();
      expect(declarativeRule.condition.urlFilter).toBe('https://api.example.com/*');
      expect(declarativeRule.condition.resourceTypes).toContain('xmlhttprequest');
    });

    it('should include data URL in redirect', () => {
      const rule: MockRule = {
        id: 'test-id',
        name: 'Test Rule',
        enabled: true,
        urlPattern: 'https://example.com',
        matchType: 'exact',
        method: 'GET',
        statusCode: 200,
        response: 'test response',
        contentType: 'text/plain',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const declarativeRule = generator.toDeclarativeRule(rule, 5);
      expect(declarativeRule.action.redirect?.url).toContain('data:text/plain,');
    });
  });
});
