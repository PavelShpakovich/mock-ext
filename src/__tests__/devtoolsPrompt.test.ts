import { MessageActionType } from '../enums';
import { listeners, resetListeners } from './setup';

interface ContentScriptDefinition {
  main: () => void;
}

describe('DevTools prompt content script', () => {
  let main: () => void;
  const originalPlatform = navigator.platform;

  beforeEach(async () => {
    jest.resetModules();
    resetListeners();
    Object.defineProperty(globalThis, 'defineContentScript', {
      configurable: true,
      value: (definition: ContentScriptDefinition) => definition,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });
    const module = await import('../entrypoints/devtools-prompt.content');
    main = (module.default as unknown as ContentScriptDefinition).main;
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(navigator, 'platform', { configurable: true, value: originalPlatform });
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('renders localized dark prompts, replaces prior prompt, and supports close buttons', () => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'MacIntel' });
    main();
    listeners['runtime.onMessage']?.[0]({ action: MessageActionType.OpenDevTools, language: 'ru', theme: 'dark' });
    const prompt = document.getElementById('moq-devtools-prompt')!;
    expect(prompt.textContent).toContain('Открыть DevTools');
    expect(prompt.textContent).toContain('Нажмите');
    expect(prompt.textContent).toContain('⌥⌘I');
    expect(prompt.style.color).toBe('white');

    listeners['runtime.onMessage']?.[0]({ action: MessageActionType.OpenDevTools, language: 'en', theme: 'light' });
    expect(document.querySelectorAll('#moq-devtools-prompt')).toHaveLength(1);
    const buttons = document.querySelectorAll('#moq-devtools-prompt button');
    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('moq-devtools-prompt')).toBeNull();
    expect(jest.getTimerCount()).toBe(1);
  });

  it('uses system preference/default language, displays non-Mac shortcut, and auto-dismisses', () => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'Win32' });
    main();
    listeners['runtime.onMessage']?.[0]({ action: MessageActionType.OpenDevTools });
    const prompt = document.getElementById('moq-devtools-prompt')!;
    expect(prompt.textContent).toContain('Open DevTools');
    expect(prompt.textContent).toContain('Ctrl+Shift+I');
    expect(prompt.style.color).toBe('white');
    jest.advanceTimersByTime(10000);
    expect(document.getElementById('moq-devtools-prompt')).toBeNull();
  });
});
