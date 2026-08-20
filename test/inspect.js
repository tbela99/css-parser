import { dirname } from "node:path";
import { transform } from "../dist/node.js";

const { code, stats } = await transform({
    file: dirname(new URL(import.meta.url).pathname) + "/files/css/tailwind.css",
});

console.debug(code);
console.debug({ stats });
