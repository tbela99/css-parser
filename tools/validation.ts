import {fetchInit, ValidationToken} from "../src/lib";
import process from "node:process";
import {writeFile} from "node:fs/promises";

function debug(error: any) {

    console.error(error);
}

process.on('unhandledRejection', debug);
process.on('uncaughtException', debug);

export interface PatchSyntax {

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

        console.error(`>> adding at-rule declarations >> ${key}`);
        json.atRules[key] = {syntax: value.prelude};
    }
}

for (const [key, value] of Object.entries(patches.properties)) {

    if (!(key in json.declarations)) {

        console.error(`>> adding declarations >> ${key}`);
        json.declarations[key] = {syntax: value.syntax};
    }

    else if (value.comment?.startsWith?.('extend')) {

        console.error(`>> extending declarations >> ${key}`);
        json.declarations[key].syntax += value.syntax;
    }
}

for (const [key, value] of Object.entries(patches.types)) {

    if (!(key in json.syntaxes)) {

        console.error(`>> adding syntax >> ${key}`);
        json.syntaxes[key] = {syntax: value.syntax};
    }

    else if (value.comment?.startsWith?.('extend')) {

        console.error(`>> extending syntax >> ${key}`);
        json.syntaxes[key].syntax += value.syntax;
    }
}

if (!(':-webkit-any()' in json.selectors)) {

    json.selectors[':-webkit-any()'] = {syntax: ':-webkit-any( <forgiving-selector-list> )'};
}

if (!(':-webkit-any-link' in json.selectors)) {

    json.selectors[':-webkit-any-link'] = {syntax: ':-webkit-any-link'};
}

await writeFile(import.meta.dirname + '/../src/lib/validation/config.json', JSON.stringify(json, null, 1));
console.debug(json);

// =============================== //

export function cleanup(ast: { [key: string]: any }) {

    return ast;
}

export interface ParsedSyntax {
    syntax: string;
    ast?: ValidationToken[];
    descriptors?: Record<string, ParsedSyntax>;
}

type ParsedSyntaxes = Record<string, ParsedSyntax>

export async function parseDeclarationsSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/properties.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key == '--*') {

            continue;
        }

        console.error(' >> parseDeclarationsSyntax >> ' + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseFunctionsSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/functions.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
        // mdn_url: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key == '--*') {

            continue;
        }

        console.error(' >> parseFunctionsSyntax >> ' + key);

        json[key.slice(0, -2)] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi,
            // mdn_url: values.mdn_url
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseSelectorsSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/selectors.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
        // mdn_url: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key.match(/[A-Z]/)) {

            continue;
        }

        console.error(' >> parseSelectorsSyntax >> ' + key);

        json[key] = {
            syntax: values.syntax.startsWith('/*') ? key : values.syntax,
            // ast: parseSyntax(values.syntaxes.startsWith('/*') ? key : values.syntaxes).chi,
            // mdn_url: values.mdn_url
        };
    }

    for (const k of [':host', ':autofill']) {


        if (!(k in json)) {

            json[k] = {
                syntax: k,
                // ast: parseSyntax(k).chi
            };
        }
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseAtRulesSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/at-rules.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
        // mdn_url: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        console.error(' >> parseAtRulesSyntax >> ' + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi,
            // mdn_url: values.mdn_url
        };

        if ('descriptors' in values) {

            json[key].descriptors = Object.entries(values.descriptors as Record<string, {
                [key: string]: string
            }>).reduce((acc, [k, v]) => Object.assign(acc, {[k]: {syntax: v.syntax} as ParsedSyntax}), {} as Record<string, ParsedSyntax>);
        }
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseAllSyntaxes(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/syntaxes.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        console.error(' >> parseAllSyntaxes >> ' + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

