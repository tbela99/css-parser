import {readFile, writeFile} from 'fs/promises'
import {dirname} from 'path';
import {Parser} from "../src";
import {update} from "../src/parser/utils";
import {parse} from "../tools/syntax";

// https://github.com/mdn/data/tree/main/css
// https://github.com/mdn/data/blob/main/css/syntaxes.json

// const syntax = `
// inset? && <length>{2,4} && <color>?
// `;
// console.log(parse(syntax))

const dir = dirname(new URL(import.meta.url).pathname);
const file = (await readFile( `${dir}/files/css/bootstrap.css`)).toString();

/*
*/
const parser: Parser = new Parser();

parser.on('traverse', (node, direction) => {

    // console.log({direction, node});

}).parse(file);

// parser.getAst();
// parser.compact();
console.log(parser.getAst());
//
// await writeFile(`${dir}/files/json/invalid-2.json`, JSON.stringify(parser.getAst(), null ,1));