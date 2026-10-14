import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (process.env.CAPACITOR_SERVER_URL || "").trim().replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "app.needit.android",
  appName: "NEEDIT",
  webDir: "mobile",
  android: {
    allowMixedContent: false,
  },
  ...(serverUrl.startsWith("https://")
    ? {
        server: {
          url: serverUrl,
          androidScheme: "https",
          cleartext: false,
        },
      }
    : {}),
};

export default config;
