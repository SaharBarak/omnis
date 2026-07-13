// Metro config — monorepo-aware Expo defaults, plus a web-only shim:
// react-native-web 0.21 doesn't ship the RN-internal ReactDevToolsSettingsManager
// that RN 0.86 dev mode imports, so alias it to an empty module on web.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

const emptyShim = path.resolve(__dirname, 'web-shims/empty.js')

// circular-natal-horoscope-js publishes `module: src/index.js` but ships only
// dist/ — web resolution follows the module field and dies. Pin it to dist.
const horoscopeEntry = path.resolve(
  __dirname,
  '../../node_modules/circular-natal-horoscope-js/dist/index.js'
)

const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.includes('devsupport/rndevtools/ReactDevToolsSettingsManager')) {
    return { type: 'sourceFile', filePath: emptyShim }
  }
  if (platform === 'web' && moduleName === 'circular-natal-horoscope-js') {
    return { type: 'sourceFile', filePath: horoscopeEntry }
  }
  // Native-only modules → web shims (dev preview): secure-store backs onto
  // localStorage, notifications no-op as denied, Skia renders nothing.
  if (platform === 'web' && moduleName === 'expo-secure-store') {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'web-shims/secure-store.js') }
  }
  if (platform === 'web' && moduleName === 'expo-notifications') {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'web-shims/notifications.js') }
  }
  if (platform === 'web' && moduleName.startsWith('@shopify/react-native-skia')) {
    return { type: 'sourceFile', filePath: emptyShim }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
