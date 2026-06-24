import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.muyenzi.kiosk',
  appName: 'Muyenzi Kiosk',
  // Points at the built Nuxt output — run `nuxi build` then `npx cap copy` before opening Android Studio.
  webDir: '.output/public',
  // In production, uncomment the server block to load from your live URL instead of a local bundle.
  // This means updates deploy automatically without a Play Store release.
  // server: {
  //   url: 'https://muyenzi.com',
  //   cleartext: false,
  // },
  android: {
    buildOptions: {
      keystorePath: 'android/keystore/muyenzi.keystore',
      keystoreAlias: 'muyenzi',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
