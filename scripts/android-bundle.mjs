import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const isWindows = process.platform === "win32";

function readEnvValue(name) {
  const current = process.env[name]?.trim();
  if (current) return current;
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return "";
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));
  if (!line) return "";
  return line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
}

function javaBinary(home) {
  return path.join(home, "bin", isWindows ? "java.exe" : "java");
}

function javaHome() {
  const current = process.env.JAVA_HOME;
  if (current && fs.existsSync(javaBinary(current))) return current;
  const base = path.join(os.homedir(), "android-build");
  if (!fs.existsSync(base)) return "";
  const match = fs.readdirSync(base).find((name) => {
    const home = path.join(base, name);
    return name.startsWith("jdk-") && fs.existsSync(javaBinary(home));
  });
  return match ? path.join(base, match) : "";
}

function androidHome() {
  for (const key of ["ANDROID_HOME", "ANDROID_SDK_ROOT"]) {
    if (process.env[key] && fs.existsSync(process.env[key])) return process.env[key];
  }
  const candidate = path.join(os.homedir(), "android-build", "sdk");
  return fs.existsSync(path.join(candidate, "platforms")) ? candidate : "";
}

function run(command, args, options) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function ensureKeystore(home) {
  const androidDir = path.join(root, "android");
  const propsPath = path.join(androidDir, "keystore.properties");
  const storePath = path.join(androidDir, "app", "needit-upload.jks");
  if (fs.existsSync(propsPath) && fs.existsSync(storePath)) return;
  if (fs.existsSync(propsPath) || fs.existsSync(storePath)) {
    throw new Error("Keep android/keystore.properties and android/app/needit-upload.jks together. Do not delete only one of them.");
  }

  const password = crypto.randomBytes(18).toString("base64url");
  const keytool = path.join(home, "bin", isWindows ? "keytool.exe" : "keytool");
  run(
    keytool,
    [
      "-genkeypair",
      "-keystore",
      storePath,
      "-alias",
      "needit",
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
      "-storepass",
      password,
      "-keypass",
      password,
      "-dname",
      "CN=NEEDIT, OU=Mobile, O=NEEDIT, C=SA",
    ],
    { cwd: root },
  );
  fs.writeFileSync(
    propsPath,
    ["storeFile=app/needit-upload.jks", `storePassword=${password}`, "keyAlias=needit", `keyPassword=${password}`, ""].join("\n"),
  );
}

const java = javaHome();
const sdk = androidHome();
if (!java) throw new Error("JDK 21 was not found. Set JAVA_HOME to a JDK 21 install.");
if (!sdk) throw new Error("Android SDK was not found. Set ANDROID_HOME to the SDK root.");
if (!fs.existsSync(path.join(root, "android", "gradlew.bat")) && !fs.existsSync(path.join(root, "android", "gradlew"))) {
  throw new Error("The Android project is missing. Run npx cap add android first.");
}

const serverUrl = readEnvValue("CAPACITOR_SERVER_URL").replace(/\/$/, "");
const remote = serverUrl.startsWith("https://") ? serverUrl : "";
if (!remote) {
  console.warn("CAPACITOR_SERVER_URL is not a public https address. This bundle will not open the live shop.");
}

const env = {
  ...process.env,
  JAVA_HOME: java,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  CAPACITOR_SERVER_URL: remote,
};

fs.writeFileSync(path.join(root, "android", "local.properties"), `sdk.dir=${sdk.replaceAll("\\", "/")}\n`);
ensureKeystore(java);
run(isWindows ? "npx.cmd" : "npx", ["cap", "sync", "android"], { cwd: root, env, shell: isWindows });

const gradlew = path.join(root, "android", isWindows ? "gradlew.bat" : "gradlew");
run(gradlew, ["bundleRelease"], { cwd: path.join(root, "android"), env, shell: isWindows });

const built = path.join(root, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
const releaseDir = path.join(root, "release");
fs.mkdirSync(releaseDir, { recursive: true });
const output = path.join(releaseDir, "NEEDIT-1.0.0.aab");
fs.copyFileSync(built, output);

const jarsigner = path.join(java, "bin", isWindows ? "jarsigner.exe" : "jarsigner");
run(jarsigner, ["-verify", output], { cwd: root, env });
console.log(`Play bundle: ${output}`);
