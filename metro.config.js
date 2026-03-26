const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required so require('./assets/models/*.tflite') is bundled in dev and production
config.resolver.assetExts.push('tflite');

// Ensure Metro uses browser-compatible builds of socket.io-client / engine.io-client.
// engine.io-client ships .node.js variants (use process.nextTick + nodebuffer) alongside
// .js variants (use Promise + arraybuffer). The package's 'browser' field maps the Node
// variants to the RN-safe ones. Listing 'browser' here makes Metro honour that mapping.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
