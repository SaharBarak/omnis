// Web shim for expo-secure-store — localStorage-backed. Dev preview only;
// tokens in localStorage are acceptable for the LAN dev preview, never prod web.
module.exports = {
  getItemAsync: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItemAsync: async (key, value) => { globalThis.localStorage?.setItem(key, value) },
  deleteItemAsync: async (key) => { globalThis.localStorage?.removeItem(key) },
  isAvailableAsync: async () => true,
}
