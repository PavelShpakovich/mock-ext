/**
 * Firefox DevTools Drag & Drop Fix — Cancel-native + Pointer-events simulation
 *
 * Root cause (Firefox bug #1408756, open since 2017, marked wontfix):
 * In out-of-process WebExtension pages (DevTools panels, embedded options pages),
 * the OS-level drag signal never reaches the child process. The browser fires
 * dragstart, then immediately dragend, and never fires dragover/dragenter/drop.
 * While this is happening Firefox is still briefly in "drag mode", suppressing
 * pointermove events — which is why a pure pointermove-based simulation also fails.
 *
 * Strategy:
 * 1. Let dragstart fire NORMALLY so pragmatic-drag-and-drop registers the source
 *    draggable and calls onDragStart on consumers.
 * 2. In a LATE window-bubble dragstart listener (fires AFTER the library's
 *    document-bubble handler), call event.preventDefault(). This cancels the
 *    OS/native drag before it locks pointer events, while the library has already
 *    registered the drag.
 * 3. Since the OS drag is now cancelled upfront:
 *    - No native dragend fires (drag was cancelled, not started)
 *    - pointermove events flow normally
 * 4. Use pointermove to dispatch synthetic dragover/dragenter/dragleave to the
 *    element under the cursor. These bubble to window where the library's capture
 *    listener processes them to update drop-target state.
 * 5. On pointerup, dispatch synthetic drop + dragend to finish the interaction.
 *
 * Override for the library's "broken drag" pointermove detector:
 * pragmatic-drag-and-drop registers a pointermove capture handler inside the
 * dragstart callback that calls cancel() after 20 moves. We block it with
 * stopImmediatePropagation() in our earlier-registered capture handler.
 */

function isFirefoxDevTools(): boolean {
  return navigator.userAgent.toLowerCase().includes('firefox') && window.location.search.includes('tabId=');
}

function makeDragEvent(type: string, source: PointerEvent | MouseEvent): DragEvent {
  return new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: source.clientX,
    clientY: source.clientY,
    screenX: source.screenX,
    screenY: source.screenY,
    altKey: source.altKey,
    ctrlKey: source.ctrlKey,
    metaKey: source.metaKey,
    shiftKey: source.shiftKey,
    button: 0,
    buttons: 1,
  });
}

// Module-level singleton state
const sim = {
  active: false,
  sourceElement: null as HTMLElement | null,
  lastOverElement: null as Element | null,
  // Ghost element that follows the cursor (replaces native drag preview)
  ghost: null as HTMLElement | null,
  // Offset from pointer to top-left corner of the source element at drag start
  offsetX: 0,
  offsetY: 0,
};

let globalListenersInstalled = false;

function createGhost(source: HTMLElement, pointerX: number, pointerY: number): HTMLElement {
  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;

  ghost.style.position = 'fixed';
  ghost.style.top = '0';
  ghost.style.left = '0';
  ghost.style.width = `${rect.width}px`;
  ghost.style.margin = '0';
  ghost.style.boxSizing = 'border-box';
  ghost.style.borderRadius = '0.75rem';
  ghost.style.overflow = 'hidden';
  ghost.style.opacity = '0.85';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '99999';
  ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
  ghost.style.willChange = 'transform';
  ghost.style.userSelect = 'none';
  // Position the ghost exactly over the source element initially, then track the cursor offset
  sim.offsetX = pointerX - rect.left;
  sim.offsetY = pointerY - rect.top;
  ghost.style.transform = `translate(${rect.left}px, ${rect.top}px)`;

  document.body.appendChild(ghost);
  return ghost;
}

function moveGhost(x: number, y: number) {
  if (!sim.ghost) return;
  sim.ghost.style.transform = `translate(${x - sim.offsetX}px, ${y - sim.offsetY}px)`;
}

function removeGhost() {
  if (sim.ghost) {
    sim.ghost.remove();
    sim.ghost = null;
  }
}

function getElementUnder(x: number, y: number): Element | null {
  // Temporarily hide the source element so elementFromPoint sees what's beneath it.
  // The ghost already has pointerEvents: none permanently, so no action needed for it.
  const prevPointerEvents = sim.sourceElement?.style.pointerEvents ?? '';
  if (sim.sourceElement) sim.sourceElement.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  if (sim.sourceElement) sim.sourceElement.style.pointerEvents = prevPointerEvents;
  return el;
}

function endSimulation(e: PointerEvent | MouseEvent, drop: boolean) {
  if (!sim.active) return;

  removeGhost();

  const target = getElementUnder(e.clientX, e.clientY);

  if (drop && target) {
    target.dispatchEvent(makeDragEvent('drop', e));
  }

  // Fire dragend on source AFTER setting active=false so our own dragend
  // capture guard doesn't block it
  sim.active = false;
  const src = sim.sourceElement;
  sim.sourceElement = null;
  sim.lastOverElement = null;

  if (src) {
    src.dispatchEvent(makeDragEvent('dragend', e));
  }
}

function installGlobalSimulation() {
  if (globalListenersInstalled) return;
  globalListenersInstalled = true;

  // ── Block the library's "broken drag" pointermove detector ────────────────
  // Registered NOW (before draggable() mounts) so our capture fires first.
  // We call stopImmediatePropagation so the library's counter never increments.
  window.addEventListener(
    'pointermove',
    (e: PointerEvent) => {
      if (!sim.active || !sim.sourceElement) return;

      // Block library's broken-drag detector
      e.stopImmediatePropagation();

      // Move the ghost preview to follow the cursor
      moveGhost(e.clientX, e.clientY);

      const target = getElementUnder(e.clientX, e.clientY);

      // dragenter / dragleave on boundary crossing
      if (target !== sim.lastOverElement) {
        if (sim.lastOverElement) {
          sim.lastOverElement.dispatchEvent(makeDragEvent('dragleave', e));
        }
        if (target) {
          target.dispatchEvent(makeDragEvent('dragenter', e));
        }
        sim.lastOverElement = target;
      }

      // dragover — bubbles from target up to window where library listens
      if (target) {
        target.dispatchEvent(makeDragEvent('dragover', e));
      }
    },
    { capture: true }
  );

  // ── Pointer up — drop ──────────────────────────────────────────────────────
  window.addEventListener(
    'pointerup',
    (e: PointerEvent) => {
      endSimulation(e, /* drop= */ true);
    },
    { capture: true }
  );

  // ── Pointer cancel — abort ─────────────────────────────────────────────────
  window.addEventListener(
    'pointercancel',
    (e: PointerEvent) => {
      endSimulation(e, /* drop= */ false);
    },
    { capture: true }
  );

  // ── Safety: key-press Escape should cancel ─────────────────────────────────
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (sim.active && e.key === 'Escape') {
        // Synthesize a mouse-like event for dragend coords
        const fakeEnd = new MouseEvent('mouseup', {
          clientX: 0,
          clientY: 0,
          bubbles: true,
        });
        endSimulation(fakeEnd, /* drop= */ false);
      }
    },
    { capture: true }
  );
}

// ─── Per-element export ────────────────────────────────────────────────────────

export function addFirefoxDragSupport(element: HTMLElement): () => void {
  if (!isFirefoxDevTools()) {
    return () => {};
  }

  // Register global singleton handlers BEFORE draggable() so our capture
  // listeners come before the library's (capture order = registration order).
  installGlobalSimulation();

  // ── Step 1: early capture — record simulation start ───────────────────────
  // Fires before the library's document-bubble handler, so sim.active is true
  // before the library even processes the dragstart.
  const handleDragStartEarly = (e: DragEvent) => {
    sim.active = true;
    sim.sourceElement = element;
    sim.lastOverElement = null;
    // Build the ghost now — DragEvent.clientX/Y gives the exact pointer position.
    // The source element's opacity is handled by the React isDragging state via
    // onDragStart, so we don't set it here (avoids double-opacity compounding).
    sim.ghost = createGhost(element, e.clientX, e.clientY);
  };

  // ── Step 2: late window-bubble — cancel native drag ───────────────────────
  // Fires AFTER the library's document-bubble handler. By this point the library
  // has already registered the drag and called onDragStart on consumers.
  // Calling preventDefault() tells the browser: "don't start the OS drag".
  // This ensures pointer events are NOT suppressed for our simulation.
  const handleDragStartLate = (e: DragEvent) => {
    if (!sim.active) return;
    // Cancel the OS drag AFTER the library has already registered the drag source.
    // This prevents pointer events from being suppressed by the browser's drag mode.
    e.preventDefault();
  };

  element.addEventListener('dragstart', handleDragStartEarly, { capture: true });
  window.addEventListener('dragstart', handleDragStartLate, { capture: false }); // bubble = late

  return () => {
    element.removeEventListener('dragstart', handleDragStartEarly, { capture: true });
    window.removeEventListener('dragstart', handleDragStartLate, { capture: false });
    if (sim.sourceElement === element) {
      removeGhost();
      sim.active = false;
      sim.sourceElement = null;
      sim.lastOverElement = null;
    }
  };
}
