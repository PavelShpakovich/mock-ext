import { fireEvent, render, screen } from '@testing-library/react';
import Header from '../components/Header';
import { Language, ResolvedTheme, Theme } from '../enums';

const openStandaloneWindow = jest.fn();
let devToolsContext = false;

jest.mock('../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string>) => (params ? `${key}:${params.tabTitle}` : key),
    language: Language.English,
    setLanguage: jest.fn(),
  }),
}));
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: Theme.System, resolvedTheme: ResolvedTheme.Dark, setTheme: jest.fn() }),
}));
jest.mock('../helpers/context', () => ({
  isDevTools: () => devToolsContext,
  openStandaloneWindow: (...args: unknown[]) => openStandaloneWindow(...args),
}));
jest.mock('../components/ui/SettingsMenu', () => ({
  SettingsMenu: (props: {
    onThemeChange: (theme: Theme) => void;
    onLanguageChange: (language: Language) => void;
    showOpenWindow: boolean;
    onOpenWindow: () => void;
  }) => (
    <div>
      <button onClick={() => props.onThemeChange(Theme.Light)}>set-light</button>
      <button onClick={() => props.onLanguageChange(Language.Russian)}>set-russian</button>
      {props.showOpenWindow && <button onClick={props.onOpenWindow}>open-window</button>}
    </div>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    devToolsContext = false;
    jest.clearAllMocks();
  });

  it('toggles extension, recording and CORS settings and shows recording context', () => {
    const onToggleEnabled = jest.fn();
    const onToggleRecording = jest.fn();
    const onToggleCors = jest.fn();
    render(
      <Header
        enabled
        logRequests
        corsAutoFix={false}
        activeTabTitle='Example tab'
        onToggleEnabled={onToggleEnabled}
        onToggleRecording={onToggleRecording}
        onToggleCors={onToggleCors}
      />
    );

    fireEvent.click(screen.getByTitle('header.disabled'));
    fireEvent.click(screen.getByTitle('header.corsAutoFix'));
    fireEvent.click(screen.getByTitle('header.stop'));
    expect(onToggleEnabled).toHaveBeenCalledWith(false);
    expect(onToggleCors).toHaveBeenCalledWith(true);
    expect(onToggleRecording).toHaveBeenCalledWith(false);
    expect(screen.getByText('header.recording:Example tab')).toBeInTheDocument();
  });

  it('disables dependent actions while disabled and exposes standalone window in devtools', () => {
    devToolsContext = true;
    const onToggleRecording = jest.fn();
    render(
      <Header
        enabled={false}
        logRequests={false}
        corsAutoFix={false}
        onToggleEnabled={jest.fn()}
        onToggleRecording={onToggleRecording}
        onToggleCors={jest.fn()}
      />
    );
    expect(screen.getByTitle('header.corsAutoFix')).toBeDisabled();
    expect(screen.getByTitle('header.record')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'open-window' }));
    expect(openStandaloneWindow).toHaveBeenCalledWith(Language.English);
  });
});
