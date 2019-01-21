/**
 * querySelector wrapper
 *
 * @param {string} selector Selector to query
 * @param {Element} [scope] Optional scope element for the selector
 */
export function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

/**
 * addEventListener wrapper
 *
 * @param {Element|Window} target Target Element
 * @param {string} type Event name to bind to
 * @param {Function} callback Event callback
 * @param {boolean} [capture] Capture the event
 */
export function $on(target, type, callback, capture) {
  $log("on", target);
  $log("on", type);
  target.addEventListener(type, callback, !!capture);
}

export class EventEmitter {
  constructor() {
    this._cb = {};
  }

  addEventListener(type, func) {
    if (this._cb[type]) {
      this._cb[type].handlers.push(func);
    } else {
      this._cb[type] = {
        handlers: [func]
      };
    }
  }

  trigger(type, data) {
    if (this._cb[type]) {
      this._cb[type].handlers.forEach(handle => handle(data));
    }
  }
}

export function $log(msg, val = "") {
  console.log("~~~~~~~~~~~~~~ QUIZAPP: " + msg + " " + val);
}

/**
 * Attach a handler to an event for all elements matching a selector.
 *
 * @param {Element} target Element which the event must bubble to
 * @param {string} selector Selector to match
 * @param {string} type Event name
 * @param {Function} handler Function called when the event bubbles to target
 *                           from an element matching selector
 * @param {boolean} [capture] Capture the event
 */
export function $delegate(target, selector, type, handler, capture) {
  const dispatchEvent = event => {
    const targetElement = event.target;
    const potentialElements = target.querySelectorAll(selector);
    let i = potentialElements.length;

    while (i--) {
      if (potentialElements[i] === targetElement) {
        handler.call(targetElement, event);
        break;
      }
    }
  };

  $on(target, type, dispatchEvent, !!capture);
}

/**
 * Encode less-than and ampersand characters with entity codes to make user-
 * provided text safe to parse as HTML.
 *
 * @param {string} s String to escape
 *
 * @returns {string} String with unsafe characters escaped with entity codes
 */
export const escapeForHTML = s =>
  s.replace(/[&<]/g, c => (c === "&" ? "&amp;" : "&lt;"));
