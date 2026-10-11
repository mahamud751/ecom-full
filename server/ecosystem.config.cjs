const path = require("path");
const fs = require("fs");

// Load .env so PM2 inherits DB URL, JWT secrets, etc.
const envPath = path.join(__dirname, ".env");
const fileEnv = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    fileEnv[key] = val;
  }
}

module.exports = {
  apps: [
    {
      name: "ahona-api",
      cwd: __dirname,
      script: "dist/src/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 4081,
        ...fileEnv,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
