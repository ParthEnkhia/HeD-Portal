import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

for (const fileName of [".env", "HeD-Portal-2.env"]) {
  const envPath = path.join(projectRoot, fileName);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}
