import {deduplicate, parse} from "../src";
import {walk} from "../src/walker";
import {dirname} from "path";
import {readFileSync} from "fs";
import {AstAtRule, AstDeclaration, AstRule} from "../src/@types";


const dir: string = dirname(new URL(import.meta.url).pathname);
const filePath: string = `${dir}/files/css/import.css`;

const {ast} = parse(readFileSync(filePath).toString());

deduplicate(ast);

for (const info of walk(ast)) {

    console.debug(`${info.node.typ} [${(<AstDeclaration | AstAtRule>info.node).nam || (<AstRule>info.node).sel || '(none)'}]`)
}
