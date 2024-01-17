import {readFileSync} from "fs";
import {dirname} from "path";
import {transform} from '../dist/node/index.js';

const css = readFileSync(dirname(new URL(import.meta.url).pathname) + '/files/css/tailwind.css', {encoding: 'utf-8'});

const {code, stats} = await transform(css);

console.log(code);
console.error({stats});