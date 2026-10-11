/**
 * Run catalog import + image scripts in the correct order.
 * From server/: npm run db:catalog
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import path from "node:path";
import { prepareMedia } from "./prepare-media";

const TSX = path.join(process.cwd(), "node_modules", ".bin", "tsx");

function run(label: string, script: string, extraArgs: string[] = []) {
  console.log(`\n======== ${label} ========`);
  return new Promise<void>((resolve, reject) => {
    const child = spawn(TSX, [script, ...extraArgs], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit ${code}`));
    });
  });
}

async function main() {
  await prepareMedia();
  await run("devices", "scripts/import-devices.ts");
  await run("beauty", "scripts/import-beauty.ts");
  await run("food", "scripts/import-food.ts");
  await run("medicines", "scripts/import-medicines.ts");
  await run("pack-images", "scripts/generate-pack-images.ts");
  await run("mirror-images", "scripts/mirror-open-images.ts");
  await run("promote", "scripts/promote-open-catalog.ts");
  await run("enrich-lab", "scripts/enrich-lab.ts");
  await run("live-quality", "scripts/live-catalog-quality.ts");
  console.log("\nCatalog bootstrap complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
