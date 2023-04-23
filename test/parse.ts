import {readFile, writeFile} from 'fs/promises'
import {dirname} from 'path';
import {Parser} from "../src";
import {find, parseBlock, update} from "../src/parser/utils";
import {parse} from "../tools/syntax";

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

const dir = dirname(new URL(import.meta.url).pathname);
const file = (await readFile( `${dir}/files/css/${baseName}.css`)).toString();

/*
*/
const parser: Parser = new Parser();

parser.on('traverse', (node, direction) => {

    // console.log({direction, node});

});

const now = Date.now();
parser.parse(file);

console.error(`time : ${Date.now() - now}ms`);

// parser.getAst();
// parser.compact();
console.log(parser.toString());
//
// await writeFile(`${dir}/files/json/${baseName}.json`, JSON.stringify(parser.getAst(), null ,1));

// function toStringProperties(info: { [s: string]: string | string[]; } | ArrayLike<unknown>) {
//
//     return Object.entries(info).reduce((acc, curr) => {
//
//         // @ts-ignore
//         acc[curr[0]] = Array.isArray(curr[1]) ? curr[1].join('') : curr[1]
//
//         return acc;
//     }, {});
// }
//
// const Rule = `:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] {
//     --color-canvas-default-transparent: rgba(255,255,255,0);
//     --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;
//     --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;
// }
// `;
// const atRule = `@media all {:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] {
//     --color-canvas-default-transparent: rgba(255,255,255,0);
//     --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;
//     --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;
// }}
// `;
//
// const info = toStringProperties(parseBlock([...Rule], 0, find([...Rule], 1, ';{}')));;
//
//
// console.log({info});