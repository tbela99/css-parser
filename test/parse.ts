import {readFile, writeFile} from 'fs/promises'
import {dirname} from 'path';
import {Parser} from "../src";
import {Position} from "../src/@types";
import {tokenize} from "../src/parser/tokenize";
import {stringIterator} from "../src/parser/utils";
// import {StringIterator} from "../src/parser/utils";
//
// const iterator = new StringIterator('<!-- b577a.css 🚀🚀🚀🚀🚀✋ 123 -->');
// console.log(iterator.next());
// console.debug(iterator.next(3));
// console.debug(iterator.prev(2));
// console.log([...iterator]);

// https://github.com/mdn/data/tree/main/css
// https://github.com/mdn/data/blob/main/css/syntaxes.json

// const syntax = `
// inset? && <length>{2,4} && <color>?
// `;
// console.log(parse(syntax))

// const file =
//     `/* file: https://github.githubassets.com/assets/light-fe3f886b577a.css 🚀🚀🚀🚀🚀✋ 123 */
// /* @media all {
// */
// @media all {:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] {color: rgb(45% 67% 56%) }}
// `;

// tokenize([...file], {index: 0, line: 0, column: 0}, (token) => console.debug(token));
// process.exit();

const baseName = 'bootstrap';

const dir = dirname(new URL(import.meta.url).pathname);
const file = (await readFile( `${dir}/files/css/${baseName}.css`)).toString();

// const str = '@media (min-width: 500px) { height: calc(100vh - 20%);';
const parser = new Parser({location: false});

const start = Date.now();
const ast = parser.parse(file).getAst();
const mid = Date.now();

const css = parser.toString();
const end = Date.now();
//
// console.debug(css);
console.error(`parsed in ${mid - start}ms`);
console.error(`renderer in ${end - mid}ms`);
// console.log(parser.getAst());
// console.debug(parser.getErrors())