import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProxyEditor from '../components/ProxyEditor';
import { validateProxyRuleForm } from '../helpers/ruleValidation';
import { MatchType, HttpMethod } from '../enums';
import type { ProxyRule } from '../types';

function translate(key: string) {
  return key;
}

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: translate }) }));
jest.mock('../hooks/useBodyScrollLock', () => ({ useBodyScrollLock: jest.fn() }));
jest.mock('../helpers/ruleValidation', () => ({ validateProxyRuleForm: jest.fn(async () => ({})) }));
jest.mock('../components/RuleEditor/ExpandedEditor', () => ({
  ExpandedEditor: (props: { value: string; onClose: () => void }) => (
    <div data-testid='expanded-hook'>
      <span>{props.value}</span>
      <button onClick={props.onClose}>close-hook</button>
    </div>
  ),
}));

const existing: ProxyRule = {
  id: 'proxy-1',
  name: 'Existing proxy',
  enabled: false,
  urlPattern: 'https://api.example.com/*',
  matchType: MatchType.Wildcard,
  method: HttpMethod.POST,
  proxyTarget: 'https://upstream.example.net',
  pathRewriteFrom: '/old',
  pathRewriteTo: '/new',
  delay: 300,
  responseHook: 'return response;',
  responseHookEnabled: true,
  created: 10,
  modified: 20,
  matchCount: 4,
  lastMatched: 30,
};
const validateForm = validateProxyRuleForm as jest.Mock;

describe('ProxyEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateForm.mockResolvedValue({});
  });

  it('creates a proxy rule from form input and normalizes optional fields', async () => {
    const onSave = jest.fn();
    render(<ProxyEditor rule={null} onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('editor.ruleName'), { target: { value: 'New proxy' } });
    fireEvent.change(screen.getByLabelText('editor.urlPattern'), { target: { value: 'https://api.example.com/*' } });
    fireEvent.change(screen.getByLabelText('proxy.targetLabel'), { target: { value: 'https://upstream.example.net' } });
    await act(async () => {
      fireEvent.click(screen.getByTitle('proxy.createRule'));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New proxy',
        proxyTarget: 'https://upstream.example.net',
        enabled: true,
        pathRewriteFrom: undefined,
        responseHook: undefined,
      })
    );
  });

  it('preserves identity/stats while editing and shows validation errors', async () => {
    const onSave = jest.fn();
    render(<ProxyEditor rule={existing} onSave={onSave} onCancel={jest.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('proxy.updateRule'));
    });
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'proxy-1', enabled: false, created: 10, matchCount: 4, lastMatched: 30 })
    );

    validateForm.mockResolvedValueOnce({ proxyTarget: 'validation.proxyTargetInvalid' });
    await act(async () => {
      fireEvent.click(screen.getByTitle('proxy.updateRule'));
    });
    await waitFor(() => expect(screen.getByText('validation.proxyTargetInvalid')).toBeInTheDocument());
  });

  it('initializes from a captured request, expands hook editor, and cancels', () => {
    const onCancel = jest.fn();
    render(
      <ProxyEditor
        rule={null}
        mockRequest={{
          id: 'request',
          url: 'https://api.example.com/users?active=1',
          method: 'POST',
          timestamp: 1,
          matched: false,
        }}
        onSave={jest.fn()}
        onCancel={onCancel}
      />
    );
    expect(screen.getByLabelText('editor.ruleName')).toHaveValue('Proxy: POST /users');
    expect(screen.getByLabelText('editor.urlPattern')).toHaveValue('https://api.example.com/users*');
    fireEvent.click(screen.getByRole('button', { name: /proxy.hookSection/ }));
    fireEvent.change(screen.getByPlaceholderText('editor.responseHookPlaceholder'), {
      target: { value: 'return response;' },
    });
    fireEvent.click(screen.getByTitle('common.expandEditor'));
    expect(screen.getByTestId('expanded-hook')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-hook' }));
    expect(screen.queryByTestId('expanded-hook')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'editor.cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
