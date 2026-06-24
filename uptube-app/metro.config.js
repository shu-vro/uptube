const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// ensure resolver/transformer objects exist
config.resolver = config.resolver || {};
config.transformer = config.transformer || {};

// remove svg from assetExts and add to sourceExts
if (Array.isArray(config.resolver.assetExts)) {
  config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
}
config.resolver.sourceExts = Array.isArray(config.resolver.sourceExts)
  ? Array.from(new Set([...config.resolver.sourceExts, 'svg']))
  : ['svg'];

// use the svg transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
