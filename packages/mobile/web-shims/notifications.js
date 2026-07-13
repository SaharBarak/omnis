// Web shim for expo-notifications — everything no-ops as "denied".
module.exports = {
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  getPermissionsAsync: async () => ({ status: 'denied', granted: false, canAskAgain: false }),
  requestPermissionsAsync: async () => ({ status: 'denied', granted: false, canAskAgain: false }),
  getExpoPushTokenAsync: async () => { throw new Error('push unavailable on web preview') },
  setNotificationChannelAsync: async () => null,
  setNotificationHandler: () => {},
  addNotificationReceivedListener: () => ({ remove() {} }),
  addNotificationResponseReceivedListener: () => ({ remove() {} }),
}
