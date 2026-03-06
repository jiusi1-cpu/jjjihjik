import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || "com.personalfilecenter.app",
  appName: process.env.CAPACITOR_APP_NAME || "个人文件中心",
  webDir: "capacitor-build",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
          allowNavigation: [new URL(serverUrl).host]
        }
      }
    : {})
};

export default config;