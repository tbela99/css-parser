import {
    parseAllSyntaxes, parseAtRulesSyntax,
    parseDeclarationsSyntax,
    parseFunctionsSyntax,
    parseSelectorsSyntax
} from "../src/lib/validation/parser";
import process   from "node:process";
import {writeFile} from "node:fs/promises";

function debug(error: any) {

    console.error(error);
}

process.on('unhandledRejection', debug);
process.on('uncaughtException', debug);

const json = JSON.stringify({

    declarations: await parseDeclarationsSyntax(),
    functions: await parseFunctionsSyntax(),
    syntaxes: await parseAllSyntaxes(),
    selectors: await parseSelectorsSyntax(),
    atRules: await parseAtRulesSyntax()
}, null, 1);

await writeFile(import.meta.dirname + '/../src/lib/validation/config.json', json);
console.debug(json);

