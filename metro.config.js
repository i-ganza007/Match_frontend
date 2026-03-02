const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required so require('./assets/models/*.tflite') is bundled in dev and production
config.resolver.assetExts.push('tflite');

module.exports = config;
