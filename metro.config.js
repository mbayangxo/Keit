const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// @vercel/blob/client ships a package.json "browser" field remapping its
// Node-only deps (undici/crypto/stream) to browser-safe shims, but Metro
// doesn't read that field — only the frontend's upload() path is used here
// (never handleUpload, which stays server-side in lib/), so alias just what
// Metro needs to bundle that path for web/native. The shim file isn't in
// the package's "exports" map, so resolve it by absolute path via a custom
// resolver rather than require.resolve or extraNodeModules.
const undiciBrowserShim = path.join(__dirname, 'node_modules/@vercel/blob/dist/undici-browser.js');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'undici' && context.originModulePath?.includes(`@vercel${path.sep}blob`)) {
    return { type: 'sourceFile', filePath: undiciBrowserShim };
  }
  if (originalResolveRequest) return originalResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
