import { dirname } from "node:path";
import { transformSync } from "../dist/src/node.js";
import tailwind from "./files/css/tailwind.css" with { type: "text" };
import { parseArgs } from "node:util";

const args = parseArgs({
    options: {
        fast: {
            type: "boolean",
            short: "f",
            description: "Fast mode",
        },
    },
});

const options = {
    src: dirname(new URL(import.meta.url).pathname) + "/files/css/tailwind.css",
    input: tailwind,
};

const { code, stats } = await transformSync(
    args.values.fast
        ? {
              ...options,
              minify: false,
              beautify: false,
              removeEmpty: true,
              removeComments: true,
              convertColor: true,
              minifyValues: true,
          }
        : options,
);

console.debug(code);
console.debug({ stats });
