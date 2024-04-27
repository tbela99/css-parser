import {readdir} from "node:fs/promises";
import {load, transform} from "../dist/node/index.js";

const baseDir = import.meta.dirname + '/files/css/';

for (const file of await readdir(baseDir)) {

    let message = `--> file ${file}: `;
    const result = await load(baseDir + file, import.meta.dirname).then(css => transform(css, {src: baseDir + file, minify: true, sourcemap: true, nestingRules: true, resolveImport: true}));

     message += `ratio ${(100 * (1 - result.stats.bytesOut / result.stats.bytesIn)).toFixed(2)}%`;

    for (const key in result.stats) {

        // @ts-ignore
        message += ` / ${key}: ${result.stats[key]}`;
    }

    console.error(message);
}