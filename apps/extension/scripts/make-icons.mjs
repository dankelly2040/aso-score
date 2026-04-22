// ---------------------------------------------------------------------------
// Generate PNG icons from assets/icon.svg at 16/32/48/128.
//
// Chrome Web Store requires PNG icons at these exact sizes, and WXT wires
// them into the manifest via public/icon/{N}.png. We generate them from a
// single SVG source so a future brand refresh is a one-file change.
//
// Usage:  node scripts/make-icons.mjs
// Deps:   @resvg/resvg-js is pulled in on demand via `pnpm dlx` — see the
//         make:icons script in package.json. No permanent dev dep.
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const svgPath = resolve(projectRoot, "assets/icon.svg");
const outDir = resolve(projectRoot, "public/icon");

const sizes = [16, 32, 48, 128];

async function main() {
  const svg = await readFile(svgPath);
  await mkdir(outDir, { recursive: true });
  for (const size of sizes) {
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: size },
      font: { loadSystemFonts: false },
    });
    const png = resvg.render().asPng();
    const target = resolve(outDir, `${size}.png`);
    await writeFile(target, png);
    console.log(`wrote ${target} (${png.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
