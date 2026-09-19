import { dirname } from "node:path";
import { transformSync } from "../dist/node.js";
import tailwind from "./files/css/tailwind.css" with { type: "text" };

const { code, stats } = await transformSync({
    src: dirname(new URL(import.meta.url).pathname) + "/files/css/tailwind.css",
    input: tailwind,
});

console.debug(code);
console.debug({ stats });
