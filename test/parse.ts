import {readFile, writeFile} from 'fs/promises'
import {dirname} from 'path';
import {Parser} from "../src";
import {Position} from "../src/@types";

// https://github.com/mdn/data/tree/main/css
// https://github.com/mdn/data/blob/main/css/syntaxes.json

// const syntax = `
// inset? && <length>{2,4} && <color>?
// `;
// console.log(parse(syntax))

// const css =
//     `/* file: https://github.githubassets.com/assets/light-fe3f886b577a.css 🚀🚀🚀🚀🚀✋ 123 */
// /*@media all {
// */
// @media all {:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] { }}
// `;
//
const baseName = 'bootstrap';
//
const dir = dirname(new URL(import.meta.url).pathname);
const file = (await readFile( `${dir}/files/css/${baseName}.css`)).toString();

// const str = '@media (min-width: 500px) { height: calc(100vh - 20%);';
const parser = new Parser({location: true});

const start = Date.now();
console.log(parser.parse(file).getAst());
const mid = Date.now();

console.error(`parsed in ${mid - start}ms`);
console.debug(parser.toString());
const end = Date.now();
console.error(`renderer in ${end - mid}ms`);

// console.log(parser.toString());
// console.debug(parser.getErrors())