import { readFileSync, statSync } from "node:fs";
import {readdir} from "node:fs/promises";
import { fileURLToPath } from "node:url";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

const files = (await readdir(import.meta.dirname + '/../fixtures', { withFileTypes: true }))
// foundation.css is crashing with esbuild
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.css') && dirent.name !== 'foundation.css')
    .map(dirent => dirent.name);

export const fixtures = files.map((name) => {
    const path = fixturesDir + name;
    return {
        name,
        path,
        size: statSync(path).size,
        css: readFileSync(path, "utf8"),
    };
});
