import {
    fetchInit,
    parseAllSyntaxes,
    parseAtRulesSyntax,
    parseDeclarationsSyntax,
    parseFunctionsSyntax,
    parseSelectorsSyntax
} from "../src/lib";
import process from "node:process";
import {writeFile} from "node:fs/promises";

function debug(error: any) {

    console.error(error);
}

process.on('unhandledRejection', debug);
process.on('uncaughtException', debug);

interface PatchSyntax {

    atrules: Record<string, {
        prelude: string;
    }>;
    properties: Record<string, {
        comment: string;
        syntax: string;
    }>;
    types: Record<string, {
        comment: string;
        syntax: string;
    }>;
}

const patches: PatchSyntax = await fetch('https://raw.githubusercontent.com/csstree/csstree/refs/heads/master/data/patch.json', fetchInit).then(r => r.json()) as PatchSyntax;

const json = {

    declarations: await parseDeclarationsSyntax(),
    functions: await parseFunctionsSyntax(),
    syntaxes: await parseAllSyntaxes(),
    selectors: await parseSelectorsSyntax(),
    atRules: await parseAtRulesSyntax()
}

for (const [key, value] of Object.entries(patches.atrules)) {

    if (!(key in json.atRules)) {

        json.atRules[key] = {syntax: value.prelude};
    }
}

for (const [key, value] of Object.entries(patches.properties)) {

    if (!(key in json.declarations)) {

        json.declarations[key] = {syntax: value.syntax};
    }

    else if (value.comment?.startsWith?.('extended')) {

        json.declarations[key].syntax += value.syntax;
    }
}

for (const [key, value] of Object.entries(patches.types)) {

    if (!(key in json.syntaxes)) {

        json.syntaxes[key] = {syntax: value.syntax};
    }

    else if (value.comment?.startsWith?.('extended')) {

        json.syntaxes[key].syntax += value.syntax;
    }
}


await writeFile(import.meta.dirname + '/../src/lib/validation/config.json', JSON.stringify(json, null, 1));
console.debug(json);

