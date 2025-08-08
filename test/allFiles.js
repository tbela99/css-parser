import {readdir} from "node:fs/promises";
import {load, transform} from "../dist/node/index.js";

const baseDir = import.meta.dirname + '/files/css/';

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'], e = Math.floor(Math.log(this) / Math.log(1024));

function toFileSize(value) {

    const e = Math.floor(Math.log(value) / Math.log(1024));
    const result = value === 0 ? 0 : (value / Math.pow(1024, Math.floor(e)));

    return (Number.isInteger(result) ? result : result.toFixed(2)) + units[e];
}

for (const file of await readdir(baseDir)) {

    let message = `>>>>>>>>>>>> ${file} >>>>>>>>>>>>\n [file]: ${file}:\n `;
    const result = await load(baseDir + file, import.meta.dirname).then(css => transform(css, {
        src: baseDir + file, minify: true, sourcemap: true,
        removePrefix: true,
        nestingRules: true,
        resolveImport: true,
        validation: true
    }));

    message += `[inputSize]: ${toFileSize(result.stats.bytesIn)}\n `;
    message += `[outputSize]: ${toFileSize(result.stats.bytesOut)}\n `;
    message += `[ratio]: ${(100 * (1 - result.stats.bytesOut / result.stats.bytesIn)).toFixed(2)}%\n `;

    for (const key in result.stats) {

        if (Array.isArray(result.stats[key]) && result.stats[key].length == 0) {
            continue;
        }

        // @ts-ignore
        message += `[${key}]: ${typeof result.stats[key] == 'object' ? JSON.stringify(result.stats[key]) : result.stats[key]}\n `;
    }

    if (result.errors.length > 0) {

        message += `[errors]: ${result.errors.length}`;
    }

    console.error(message.trim());
}