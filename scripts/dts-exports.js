// build.sh exports every interface and type alias of the bundled declarations (`export declare interface ...`): the
// names that are also listed in the `export type { ... }` / `export { ... }` statements of the bundle are removed
// from these statements, a name exported twice is a type error (TS2484) for the consumers that check the declarations
// usage: node scripts/dts-exports.js dist/index.d.ts
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
let source = readFileSync(file, "utf8");

// names exported by their declaration
const exported = new Set(
    [...source.matchAll(/^export declare (?:interface|type|class|enum|const enum|function|const|let) ([\w$]+)/gm)].map(
        (match) => match[1],
    ),
);

source = source.replace(/^export (type )?\{([^}]*)\};$/gm, (statement, type, list) => {
    const names = list
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "" && !exported.has(name));

    return names.length === 0 ? "" : `export ${type ?? ""}{ ${names.join(", ")} };`;
});

writeFileSync(file, source);
