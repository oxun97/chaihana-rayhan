// Reading a value back out of localStorage is reading untrusted input. It
// may have been written by an older version of the site, left half-written
// by a failed write, or edited by hand — and a shape the current code does
// not expect took the whole app down for that one browser, on every visit,
// because the bad value stayed in storage and a reload changed nothing.
//
// So every read goes through a coercion step, and a value that cannot be
// coerced is deleted rather than handed on: the next visit starts clean
// instead of crashing again.

/**
 * @param {string} key
 * @param {(parsed: unknown) => T | null} coerce  returns a usable value, or
 *        null/undefined to reject (and drop) what is stored
 * @param {T} fallback
 * @returns {T}
 * @template T
 */
export function readStored(key, coerce, fallback) {
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch (e) {
    // Private mode, or site data blocked: nothing stored, nothing to clean.
    return fallback;
  }
  if (!raw) return fallback;

  let coerced = null;
  try {
    coerced = coerce(JSON.parse(raw));
  } catch (e) {
    coerced = null;
  }

  if (coerced === null || coerced === undefined) {
    dropStored(key);
    return fallback;
  }
  return coerced;
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* out of quota or storage blocked — the app works without persistence */
  }
}

export function dropStored(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
