import { execSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup() {
  const cwd = path.resolve(__dirname, "../..");
  // Reset DB state for stable E2E runs.
  execSync("npm run prisma:seed:e2e", {
    cwd,
    stdio: "inherit",
  });
}

