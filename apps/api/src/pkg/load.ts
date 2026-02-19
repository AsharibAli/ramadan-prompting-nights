import fs from "node:fs";
import dotenv from "dotenv";

const candidatePaths = [
  `${process.cwd()}/.env.local`,
  `${process.cwd()}/.env`,
  `${__dirname}/../config/.env`,
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    // In local development, file values should win over inherited shell vars.
    const shouldOverride = envPath.endsWith(".env.local") || envPath.endsWith(".env");
    dotenv.config({ path: envPath, override: shouldOverride });
  }
}
