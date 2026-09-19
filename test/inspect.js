import { dirname } from "node:path";
import { transformSync } from "../dist/node.js";
import tailwind from "./files/css/larger.css" with {type: 'text'};

const { code, stats } = await transformSync({
    src: dirname(new URL(import.meta.url).pathname) + "/files/css/larger.css",
    input: tailwind
});

console.debug(code);
console.debug({ stats });
