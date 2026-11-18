/**
 * Web Storage doubles for jsdom tests. This Node's own `localStorage` global
 * shadows jsdom's, so a test that needs one installs it with
 * `vi.stubGlobal('localStorage', memoryStorage())`.
 */

export function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}

/** Storage as private modes and blocked site data present it: every call throws. */
export function blockedStorage(): Storage {
  const blocked = (): never => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }
  return { length: 0, clear: blocked, getItem: blocked, key: blocked, removeItem: blocked, setItem: blocked }
}
