/**
 * The dialogs and sheets Android's back gesture closes. ADR-0183.
 *
 * Read from the page rather than registered: every one of them already
 * closes on Escape, and back sends them the same thing.
 */
import { LAYER_SELECTOR, topLayer } from './shell-rules.js';

/** The dialog or sheet on top, or null with none open. */
export function openLayer(root: ParentNode = document): Element | null {
  const open = [...root.querySelectorAll(LAYER_SELECTOR)].map((element) => ({
    element,
    // Every `<dialog>` this app opens is opened with `showModal()`.
    topLayer: element instanceof HTMLDialogElement,
  }));
  return topLayer(open)?.element ?? null;
}

/**
 * Close it, as Escape would.
 *
 * A `<dialog>` gets its `cancel` event, which is what Escape fires — and its
 * handler may refuse, as the start dialog does while a workout is being
 * created. Everything else gets the Escape key itself, which its own handler
 * listens for, on the element or on the document.
 */
export function dismissLayer(layer: Element): void {
  if (layer instanceof HTMLDialogElement) {
    const cancel = new Event('cancel', { cancelable: true });
    layer.dispatchEvent(cancel);
    // A dialog with nothing listening closes, as it would for Escape.
    if (!cancel.defaultPrevented) layer.close();
    return;
  }
  layer.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    }),
  );
}
