// verify the compiled matchers (src/validation/compiled) against the interpreter (src/validation/match.ts): the css
// files of the tests and of the benchmark are validated, the interpreter validates again every value accepted by a
// compiled matcher. a value accepted by a compiled matcher and rejected by the interpreter fails the verification.
// the values rejected by a compiled matcher and accepted by the interpreter are reported: they are validated by the
// interpreter (correct, slower)
//
// usage: npm run syntax-verify (after npm run syntax-compile)

import { transformSync } from "../src/node.ts";
import { compiledMismatches, compiledStats, setCompiledValidation } from "../src/validation/match.ts";
import { readdirSync, readFileSync } from "node:fs";

const root: string = import.meta.dirname! + "/..";
const directories: string[] = [root + "/test/files/css/", root + "/benchmark/fixtures/"];

setCompiledValidation(2);

for (const directory of directories) {
    for (const file of readdirSync(directory)) {
        // larger.css.txt is the same content as the other files, repeated
        if (!/\.css(\.txt)?$/.test(file) || file.startsWith("larger")) {
            continue;
        }

        transformSync(readFileSync(directory + file, "utf8"), { validation: true, lenient: true });
    }
}

/**
 * the values by syntax
 * @param values
 */
function bySyntax(values: Array<{ syntax: string; value: string }>): Map<string, Set<string>> {
    const result: Map<string, Set<string>> = new Map();

    for (const { syntax, value } of values) {
        if (!result.has(syntax)) {
            result.set(syntax, new Set());
        }

        result.get(syntax)!.add(value);
    }

    return result;
}

const { rejectedValidSamples, ...stats } = compiledStats;

console.log(">> validations:", stats);

for (const [syntax, values] of bySyntax(rejectedValidSamples)) {
    console.log(`>> deferred to the interpreter >> ${syntax} >> ${JSON.stringify([...values].slice(0, 3))}`);
}

for (const [syntax, values] of bySyntax(compiledMismatches)) {
    console.error(`>> ERROR accepted by the compiled matcher, rejected by the interpreter >> ${syntax} >> ${JSON.stringify([...values].slice(0, 3))}`);
}

if (compiledMismatches.length > 0) {
    process.exit(1);
}
