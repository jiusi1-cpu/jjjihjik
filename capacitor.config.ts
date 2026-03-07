import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

function readEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {} as Record<string, string>;
  }

  const content = readFileSync(filePath, "utf8");
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      if (index === -1) {
        return null;
      }

      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      return [key, value] as const;
    })
    .filter(Boolean) as Array<readonly [string, string]>;

  return Object.fromEntries(entries);
}

const fileEnv = {
  ...readEnvFile(resolve(process.cwd(), ".env")),
  ...readEnvFile(resolve(process.cwd(), ".env.local"))
};

const remoteMode = (process.env.CAPACITOR_REMOTE_MODE || fileEnv.CAPACITOR_REMOTE_MODE) === "true";
const serverUrl = remoteMode ? process.env.CAPACITOR_SERVER_URL || fileEnv.CAPACITOR_SERVER_URL : undefined;
const appId = process.env.CAPACITOR_APP_ID || fileEnv.CAPACITOR_APP_ID || "com.personalfilecenter.app";
const appName = process.env.CAPACITOR_APP_NAME || fileEnv.CAPACITOR_APP_NAME || "个人文件中心";

const config: CapacitorConfig = {
  appId,
  appName,
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
