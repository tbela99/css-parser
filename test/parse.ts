import {readFile, writeFile} from 'fs/promises'
import {dirname} from 'path';
import {Parser} from "../src";


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
// @media all {:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] {
// color:rgb(45% 67% 56%);
//  border: none;}}
// `;

// tokenize([...file], {index: 0, line: 0, column: 0}, (token) => console.debug(token));
// process.exit();

(async () => {

    const baseName: 'small' | 'smalli' | 'bootstrap' | 'invalid-3' | 'nested' | 'import' = 'import';
//
    const dir = dirname(new URL(import.meta.url).pathname);
    const filePath = `${dir}/files/css/${baseName}.css`;
    const file = (await readFile( filePath)).toString();
//
// const str = '@media (min-width: 500px) { height: calc(100vh - 20%);';
    const parser = new Parser({location: false, dedup: true, removeEmpty: true, processImport: true});

// parser.on('enter', (node) => console.debug({event: 'enter', node}))
// parser.on('exit', (node) => console.debug({event: 'exit', node}))

    const start = Date.now();
    const ast = parser.parse(file).getAst();
    const mid = Date.now();

    const css = parser.toString();
    const end = Date.now();
//
    console.debug(css);
// console.log(parser.getAst());
    console.error(parser.getErrors());
    console.error(`parsed in ${mid - start}ms`);
    console.error(`renderer in ${end - mid}ms`);
})();
