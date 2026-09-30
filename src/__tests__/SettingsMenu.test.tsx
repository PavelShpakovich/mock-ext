import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsMenu } from '../components/ui/SettingsMenu';
import { Language, Theme } from '../enums';

jest.mock('../hooks/useClickOutside', () => ({ useClickOutside: jest.fn() }));

const translations = {
  settings: 'Settings',
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  language: 'Language',
  openWindow: 'Open standalone window',
};

describe('SettingsMenu', () => {
  it('opens, selects theme/language options, and closes after opening standalone window', () => {
    const onThemeChange = jest.fn();
    const onLanguageChange = jest.fn();
    const onOpenWindow = jest.fn();
    render(
      <SettingsMenu
        theme={Theme.System}
        language={Language.English}
        onThemeChange={onThemeChange}
        onLanguageChange={onLanguageChange}
        showOpenWindow
        onOpenWindow={onOpenWindow}
        translations={translations}
      />
    );

    fireEvent.click(screen.getByTitle('Settings'));
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dark'));
    expect(onThemeChange).toHaveBeenCalledWith(Theme.Dark);
    fireEvent.click(screen.getByText('Русский'));
    expect(onLanguageChange).toHaveBeenCalledWith(Language.Russian);
    fireEvent.click(screen.getByText('Open standalone window'));
    expect(onOpenWindow).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });

  it('omits standalone action when disabled and toggles closed on repeated trigger', () => {
    render(
      <SettingsMenu
        theme={Theme.Light}
        language={Language.Russian}
        onThemeChange={jest.fn()}
        onLanguageChange={jest.fn()}
        translations={translations}
      />
    );
    const toggle = screen.getByTitle('Settings');
    fireEvent.click(toggle);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.queryByText('Open standalone window')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText('Light')).not.toBeInTheDocument();
  });
});
