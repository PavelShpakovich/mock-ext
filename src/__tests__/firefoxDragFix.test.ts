describe('Firefox DevTools drag support', () => {
  const originalUserAgent = navigator.userAgent;
  const originalUrl = window.location.href;

  function pointerEvent(type: string, x: number, y: number) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      clientX: { value: x },
      clientY: { value: y },
      screenX: { value: x },
      screenY: { value: y },
      stopImmediatePropagation: { value: jest.fn() },
    });
    return event;
  }

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent });
    window.history.pushState({}, '', originalUrl);
    jest.resetModules();
  });

  it('returns a no-op cleanup outside Firefox DevTools', async () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Chrome' });
    const { addFirefoxDragSupport } = await import('../helpers/firefoxDragFix');
    const cleanup = addFirefoxDragSupport(document.createElement('div'));
    expect(cleanup).not.toThrow();
  });

  it('simulates drag enter/leave/over and drops at the element under the pointer', async () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla Firefox' });
    window.history.pushState({}, '', '/devtools.html?tabId=5');
    Object.defineProperty(globalThis, 'DragEvent', {
      configurable: true,
      value: class extends MouseEvent {},
    });
    const source = document.createElement('div');
    const firstTarget = document.createElement('div');
    const secondTarget = document.createElement('div');
    document.body.append(source, firstTarget, secondTarget);
    source.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      width: 100,
      height: 40,
      right: 110,
      bottom: 60,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });
    document.elementFromPoint = jest
      .fn()
      .mockReturnValueOnce(firstTarget)
      .mockReturnValueOnce(secondTarget)
      .mockReturnValue(secondTarget);
    const { addFirefoxDragSupport } = await import('../helpers/firefoxDragFix');
    const cleanup = addFirefoxDragSupport(source);
    const dragStart = new Event('dragstart', { bubbles: true, cancelable: true });
    Object.defineProperties(dragStart, {
      clientX: { value: 20 },
      clientY: { value: 30 },
      screenX: { value: 20 },
      screenY: { value: 30 },
    });
    source.dispatchEvent(dragStart);
    window.dispatchEvent(pointerEvent('pointermove', 30, 40));
    window.dispatchEvent(pointerEvent('pointermove', 40, 50));
    window.dispatchEvent(pointerEvent('pointerup', 40, 50));

    expect(dragStart.defaultPrevented).toBe(true);
    expect(firstTarget).toBeInTheDocument();
    expect(secondTarget).toBeInTheDocument();
    expect(document.querySelectorAll('body > div')).toHaveLength(3);
    cleanup();
    source.remove();
    firstTarget.remove();
    secondTarget.remove();
  });

  it('cancels a drag on pointercancel or Escape and cleans the ghost', async () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Firefox' });
    window.history.pushState({}, '', '/devtools.html?tabId=8');
    Object.defineProperty(globalThis, 'DragEvent', { configurable: true, value: class extends MouseEvent {} });
    const source = document.createElement('div');
    document.body.append(source);
    source.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 20,
      height: 20,
      right: 20,
      bottom: 20,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.elementFromPoint = jest.fn().mockReturnValue(null);
    const { addFirefoxDragSupport } = await import('../helpers/firefoxDragFix');
    const cleanup = addFirefoxDragSupport(source);
    const start = () => {
      const event = new Event('dragstart', { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        clientX: { value: 1 },
        clientY: { value: 1 },
        screenX: { value: 1 },
        screenY: { value: 1 },
      });
      source.dispatchEvent(event);
    };
    start();
    window.dispatchEvent(pointerEvent('pointercancel', 1, 1));
    expect(document.querySelectorAll('body > div')).toHaveLength(1);
    start();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    cleanup();
    expect(document.querySelectorAll('body > div')).toHaveLength(1);
    source.remove();
  });
});
