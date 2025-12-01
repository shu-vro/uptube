import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = 'uptube';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: appName,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icons/icons-folder/iTunesArtwork@2x.png',
  scheme: appName,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  extra: {
    UPTUBE_API: process.env.UPTUBE_API,
    eas: {
      projectId: 'e85bb0bd-70bd-47ae-b3c1-085ef92c34db',
    },
  },
  splash: {
    image: './assets/icons/icons-folder/ic_launcher_foreground.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.shirshen.uptube',
  },
  android: {
    package: 'com.shirshen.uptube',
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/icons/icons-folder/iTunesArtwork@2x.png',
      backgroundColor: '#000000',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/icons/icons-folder/iTunesArtwork@2x.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#000000',
        image: './assets/icons/icons-folder/ic_launcher_foreground.png',
        dark: {
          image: './assets/icons/icons-folder/ic_launcher_foreground.png',
          backgroundColor: '#000000',
        },
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
