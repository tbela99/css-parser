import {dirname} from "node:path";
import {transformFile} from '../dist/node.js';

const {code, stats} = await transformFile(dirname(new URL(import.meta.url).pathname) + '/files/css/tailwind.css');

console.debug(code);
console.debug({stats});