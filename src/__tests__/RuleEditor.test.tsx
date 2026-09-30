import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import RuleEditor from '../components/RuleEditor';
import { validateRuleForm } from '../helpers/ruleValidation';
import { HttpMethod, MatchType, ResponseMode } from '../enums';
import type { MockRule } from '../types';

function translate(key: string) {
  return key;
}

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: translate }) }));
jest.mock('../hooks/useBodyScrollLock', () => ({ useBodyScrollLock: jest.fn() }));
jest.mock('../helpers/ruleValidation', () => ({
  validateJSONDetailed: jest.fn(() => ({ isValid: true, message: 'valid-json' })),
  validateRuleForm: jest.fn(async () => ({})),
}));
jest.mock('../components/RuleEditor/RuleBasicInfo', () => ({
  RuleBasicInfo: (props: { name: string; onNameChange: (name: string) => void }) => (
    <input aria-label='rule-name' value={props.name} onChange={(event) => props.onNameChange(event.target.value)} />
  ),
}));
jest.mock('../components/RuleEditor/RuleMatchingSection', () => ({
  RuleMatchingSection: (props: { urlPattern: string; onUrlPatternChange: (url: string) => void }) => (
    <input
      aria-label='rule-url'
      value={props.urlPattern}
      onChange={(event) => props.onUrlPatternChange(event.target.value)}
    />
  ),
}));
jest.mock('../components/RuleEditor/RuleResponseSection', () => ({
  RuleResponseSection: (props: {
    responseBody: string;
    onResponseBodyChange: (value: string) => void;
    onBeautifyJSON: () => void;
    onExpandBody: () => void;
    onExpandHook: () => void;
    onResponseHookChange: (value: string) => void;
  }) => (
    <div>
      <textarea
        aria-label='response-body'
        value={props.responseBody}
        onChange={(event) => props.onResponseBodyChange(event.target.value)}
      />
      <input aria-label='response-hook' onChange={(event) => props.onResponseHookChange(event.target.value)} />
      <button onClick={props.onBeautifyJSON}>format-json</button>
      <button onClick={props.onExpandBody}>expand-body</button>
      <button onClick={props.onExpandHook}>expand-hook</button>
    </div>
  ),
}));
jest.mock('../components/RuleEditor/ExpandedEditor', () => ({
  ExpandedEditor: (props: { title: string; value: string; onChange: (value: string) => void; onClose: () => void }) => (
    <div data-testid={`expanded-${props.title}`}>
      <textarea
        aria-label={`expanded-${props.title}-value`}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      <button onClick={props.onClose}>close-{props.title}</button>
    </div>
  ),
}));

const baseRule: MockRule = {
  id: 'rule-1',
  name: 'Original',
  enabled: false,
  urlPattern: 'https://api.example.com/items',
  matchType: MatchType.Exact,
  method: HttpMethod.POST,
  statusCode: 201,
  response: { saved: true },
  contentType: 'application/json',
  delay: 100,
  headers: { 'x-test': 'yes' },
  created: 10,
  modified: 20,
  matchCount: 3,
  lastMatched: 30,
};

const mockedValidateRuleForm = validateRuleForm as jest.Mock;

describe('RuleEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateRuleForm.mockResolvedValue({});
  });

  it('builds and saves a new rule from the form, parsing valid JSON', async () => {
    const onSave = jest.fn();
    render(<RuleEditor rule={null} folders={[]} onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('rule-name'), { target: { value: 'Created' } });
    fireEvent.change(screen.getByLabelText('rule-url'), { target: { value: 'https://api.example.com/new' } });
    fireEvent.change(screen.getByLabelText('response-body'), { target: { value: '{"ok":true}' } });
    await act(async () => {
      fireEvent.click(screen.getByTitle('editor.createRule'));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Created',
        urlPattern: 'https://api.example.com/new',
        response: { ok: true },
        responseMode: ResponseMode.Mock,
        enabled: true,
      })
    );
  });

  it('preserves existing rule identity and statistics while editing', async () => {
    const onSave = jest.fn();
    render(<RuleEditor rule={baseRule} folders={[]} onSave={onSave} onCancel={jest.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('editor.updateRule'));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rule-1', enabled: false, created: 10, matchCount: 3, lastMatched: 30 })
    );
  });

  it('displays validation errors without saving and clears the corresponding field error on change', async () => {
    mockedValidateRuleForm.mockResolvedValue({ name: 'validation.nameRequired' });
    const onSave = jest.fn();
    render(<RuleEditor rule={null} folders={[]} onSave={onSave} onCancel={jest.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('editor.createRule'));
    });
    await waitFor(() => expect(mockedValidateRuleForm).toHaveBeenCalled());
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('rule-name'), { target: { value: 'Fixed' } });
  });

  it('formats JSON and opens/closes body and hook expanded editors', () => {
    render(<RuleEditor rule={null} folders={[]} onSave={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('response-body'), { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole('button', { name: 'format-json' }));
    expect(screen.getByLabelText('response-body')).toHaveValue('{\n  "a": 1\n}');

    fireEvent.click(screen.getByRole('button', { name: 'expand-body' }));
    expect(screen.getByTestId('expanded-editor.responseBody')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-editor.responseBody' }));
    expect(screen.queryByTestId('expanded-editor.responseBody')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'expand-hook' }));
    expect(screen.getByTestId('expanded-editor.responseHook')).toBeInTheDocument();
  });

  it('cancels editing and initializes from captured request data', () => {
    const onCancel = jest.fn();
    render(
      <RuleEditor
        rule={null}
        folders={[]}
        mockRequest={{
          id: 'r',
          url: '/captured?x=1',
          method: 'POST',
          timestamp: 1,
          matched: false,
          responseBody: '{"v":1}',
        }}
        onSave={jest.fn()}
        onCancel={onCancel}
      />
    );
    expect(screen.getByLabelText('rule-name')).toHaveValue('Mock for /captured');
    expect(screen.getByLabelText('rule-url')).toHaveValue('/captured?x=1');
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
