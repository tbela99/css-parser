import {readFile, writeFile} from 'fs/promises'
import {dirname} from 'path';
import {Parser} from "../src";
import {update} from "../src/parser/utils";

// https://github.com/mdn/data/tree/main/css
// https://github.com/mdn/data/blob/main/css/syntaxes.json

const dir = dirname(new URL(import.meta.url).pathname);
const file = (await readFile( `${dir}/files/nested.css`)).toString();

/*
*/
const parser: Parser = new Parser();

parser.on('traverse', (node, direction) => {

    // console.log({direction, node});

}).parse(file);

// parser.getAst();
// parser.compact();
console.log(parser.getAst())

// writeFile(`${dir}/json/nested.json`, JSON.stringify(parser.getAst(), null ,1));