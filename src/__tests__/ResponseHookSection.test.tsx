import { fireEvent, render, screen } from '@testing-library/react';
import ResponseHookSection from '../components/ResponseHookSection';
import { ResponseMode } from '../enums';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe('ResponseHookSection', () => {
  it('shows hook controls, errors, and forwards code/mode/actions', () => {
    const onChange = jest.fn();
    const onEnabledChange = jest.fn();
    const onResponseModeChange = jest.fn();
    const onBeautify = jest.fn();
    const onExpand = jest.fn();
    render(
      <ResponseHookSection
        value='return response;'
        enabled
        responseMode={ResponseMode.Mock}
        error='Invalid hook'
        onChange={onChange}
        onEnabledChange={onEnabledChange}
        onResponseModeChange={onResponseModeChange}
        onBeautify={onBeautify}
        onExpand={onExpand}
      />
    );

    expect(screen.getByText('Invalid hook')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('editor.responseHookPlaceholder'), { target: { value: 'return 1;' } });
    expect(onChange).toHaveBeenCalledWith('return 1;');
    fireEvent.click(screen.getByTitle('editor.beautify'));
    fireEvent.click(screen.getByTitle('common.expandEditor'));
    expect(onBeautify).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('radio', { name: /editor.responseModePassthrough/ }));
    expect(onResponseModeChange).toHaveBeenCalledWith(ResponseMode.Passthrough);
  });

  it('hides enabled and mode controls when no hook code exists', () => {
    const onEnabledChange = jest.fn();
    render(
      <ResponseHookSection
        value=''
        enabled={false}
        responseMode={undefined}
        onChange={jest.fn()}
        onEnabledChange={onEnabledChange}
        onResponseModeChange={jest.fn()}
        onBeautify={jest.fn()}
        onExpand={jest.fn()}
      />
    );
    expect(screen.queryByTitle('editor.responseModePassthrough')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
