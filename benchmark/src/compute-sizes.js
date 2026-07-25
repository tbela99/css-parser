// Output byte size is deterministic per (file, library) input -- it doesn't
// need repeated statistical sampling the way timing does, so it's computed
// once here rather than inside the Vitest bench functions, and merged with
// the timing results afterward by generate-report.js.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { minifiers } from "./minifiers.js";
import { fixtures } from "./fixtures.js";

const resultsDir = fileURLToPath(new URL("../results/", import.meta.url));
mkdirSync(resultsDir, { recursive: true });

const sizes = {}; // { [fixtureName]: { [minifierId]: byteSize } }

for (const fixture of fixtures) {
    sizes[fixture.name] = {};
    for (const minifier of minifiers) {
        try {
            const output = await minifier.minify(fixture.css);
            sizes[fixture.name][minifier.id] = Buffer.byteLength(output, "utf8");
        } catch (err) {
            console.error(`[compute-sizes] ${minifier.id} failed on ${fixture.name}:`, err.message);
            sizes[fixture.name][minifier.id] = null;
        }
    }
    console.log(`sizes computed for ${fixture.name}`);
}

writeFileSync(resultsDir + "sizes.json", JSON.stringify(sizes, null, 2));
console.log("wrote results/sizes.json");
