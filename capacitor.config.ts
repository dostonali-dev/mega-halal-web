import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.megahalal.app',
  appName: 'Mega supermarket',
  webDir: 'public',
  server: {
    url: 'https://www.megahalal.net',
    cleartext: false,
    allowNavigation: ['megahalal.net', 'www.megahalal.net']
  }
};

export default config;