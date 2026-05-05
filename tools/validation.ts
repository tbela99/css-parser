import type { ValidationToken } from "../src/lib/validation/parser/types.d.ts";
import process from "node:process";
import { writeFile } from "node:fs/promises";
import localPatch from "./local-patch.json" with { type: "json" };

const fetchInit = {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:180.0) Gecko/20100101 Firefox/140.0" },
};

function debug(error: any) {
    console.error(error);
}

process.on("unhandledRejection", debug);
process.on("uncaughtException", debug);

export interface PatchSyntax {
    atrules: Record<
        string,
        {
            prelude?: string;
            syntax: string;
        }
    >;
    properties: Record<
        string,
        {
            comment?: string;
            syntax: string;
        }
    >;
    types: Record<
        string,
        {
            comment?: string;
            syntax: string;
        }
    >;
    selectors: Record<
        string,
        {
            comment?: string;
            syntax: string;
        }
    >;
}

const patches: PatchSyntax = (await fetch(
    "https://raw.githubusercontent.com/csstree/csstree/refs/heads/master/data/patch.json",
    fetchInit,
).then((r) => r.json())) as PatchSyntax;

const json = {
    declarations: await parseDeclarationsSyntax(),
    functions: await parseFunctionsSyntax(),
    syntaxes: await parseAllSyntaxes(),
    selectors: await parseSelectorsSyntax(),
    atRules: await parseAtRulesSyntax(),
    units: await parseUnitsSyntax(),
    languages: [],
    mediaFeatures: {},
};

// @ts-ignore
applyPatches(patches, localPatch as PatchSyntax);

if (!(":-webkit-any()" in json.selectors)) {
    json.selectors[":-webkit-any()"] = { syntax: ":-webkit-any( <forgiving-selector-list> )" };
}

if (!(":-webkit-any-link" in json.selectors)) {
    json.selectors[":-webkit-any-link"] = { syntax: ":-webkit-any-link" };
}

// @ts-ignore
json.declarations.cursor.syntax = "<cursor-predefined> | " + json.declarations.cursor.syntax;

// language codes
const codes = (await fetch("https://cdn.jsdelivr.net/npm/@iso-639/data/1/en.json").then((r) => r.json())) as Record<
    string,
    string
>;
json.languages = Object.keys(codes);

await writeFile(import.meta.dirname + "/../src/lib/validation/config.json", JSON.stringify(json, null, 1));
console.debug(json);

// =============================== //

function applyPatches(...patches: PatchSyntax[]) {
    for (const patch of patches) {
        for (let [key, value] of Object.entries(patch.atrules)) {
            if (key.charAt(0) != "@") {
                key = "@" + key;
            }

            if (localPatch.skipped.some((t) => key.slice(1).startsWith(t))) {
                console.error(`>> skipping at-rule >> ${key}`);
                continue;
            }

            if (!(key in json.atRules) || "comment" in value) {
                console.error(`>> adding at-rule >> ${key}`);
                json.atRules[key] = { syntax: value.syntax };

                if ("descriptors" in value) {
                    (json.atRules[key] as ParsedSyntax).descriptors = value.descriptors as Record<string, ParsedSyntax>;
                }
            }
        }

        for (const [key, value] of Object.entries(patch.properties)) {
            if (localPatch.skipped.some((t) => key.startsWith(t))) {
                console.error(`>> skipping property >> ${key}`);
                continue;
            }

            if (!(key in json.declarations)) {
                console.error(`>> adding declarations >> ${key}`);
                json.declarations[key] = { syntax: value.syntax };
            } else if (value.comment?.startsWith?.("extend")) {
                console.error(`>> extending declarations >> ${key}`);
                json.declarations[key].syntax += " " + value.syntax;
            } else {
                console.error(`>> replacing declarations >> ${key}`);
                json.declarations[key].syntax += " " + value.syntax;
            }
        }

        for (const [key, value] of Object.entries(patch.types)) {
            if (localPatch.skipped.some((t) => key.startsWith(t))) {
                console.error(`>> skipping type >> ${key}`);
                continue;
            }

            if (!(key in json.syntaxes)) {
                console.error(`>> adding syntax >> ${key}`);
                json.syntaxes[key] = { syntax: value.syntax };
            } else if (value.comment?.startsWith?.("extend")) {
                console.error(`>> extending syntax >> ${key}`);
                json.syntaxes[key].syntax += " " + value.syntax;
            } else {
                console.error(`>> replacing syntax >> ${key}`);
                json.syntaxes[key] = { syntax: value.syntax };
            }
        }

        if ("selectors" in patch) {
            for (const [key, value] of Object.entries(patch.selectors)) {
                if (!(key in json.selectors)) {
                    console.error(`>> adding syntax >> ${key}`);
                    json.selectors[key] = { syntax: value.syntax };
                }
                // else if (value.comment?.startsWith?.("extend")) {
                //     console.error(`>> extending syntax >> ${key}`);
                //     json.syntaxes[key].syntax += " " + value.syntax;
                // } else {
                //     console.error(`>> replacing syntax >> ${key}`);
                //     json.syntaxes[key] = { syntax: value.syntax };
                // }
            }
        }

        if ("mediaFeatures" in patch) {
            for (const [group, config] of Object.entries(patch.mediaFeatures)) {
                for (const [category, features] of Object.entries(config)) {
                    for (const [name, feature] of Object.entries(features)) {
                        json.mediaFeatures[name] = Object.assign(feature, { category });

                        // if (!(key in json.mediaFeatures)) {
                        //     console.error(`>> adding media features >> ${key}`);
                        //     json.mediaFeatures[key] = { syntax: value.syntax };
                        // }
                    }
                }
            }
        }
    }
}

export function cleanup(ast: { [key: string]: any }) {
    return ast;
}

export interface ParsedSyntax {
    syntax: string;
    ast?: ValidationToken[];
    descriptors?: Record<string, ParsedSyntax>;
}

type ParsedSyntaxes = Record<string, ParsedSyntax | string[]>;

export async function parseDeclarationsSyntax(): Promise<ParsedSyntaxes> {
    const syntaxes = (await fetch(
        "https://raw.githubusercontent.com/mdn/data/main/css/properties.json",
        fetchInit,
    ).then((r) => r.json())) as Record<
        string,
        {
            syntax: string;
        }
    >;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {
        if (key == "--*") {
            continue;
        }

        console.error(" >> parseDeclarationsSyntax >> " + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseFunctionsSyntax(): Promise<ParsedSyntaxes> {
    const syntaxes = (await fetch("https://raw.githubusercontent.com/mdn/data/main/css/functions.json", fetchInit).then(
        (r) => r.json(),
    )) as Record<
        string,
        {
            syntax: string;
            // mdn_url: string;
        }
    >;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {
        if (key == "--*") {
            continue;
        }

        console.error(" >> parseFunctionsSyntax >> " + key);

        json[key.slice(0, -2)] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi,
            // mdn_url: values.mdn_url
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseSelectorsSyntax(): Promise<ParsedSyntaxes> {
    const syntaxes = (await fetch("https://raw.githubusercontent.com/mdn/data/main/css/selectors.json", fetchInit).then(
        (r) => r.json(),
    )) as Record<
        string,
        {
            syntax: string;
            // mdn_url: string;
        }
    >;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {
        if (key.match(/[A-Z]/)) {
            continue;
        }

        console.error(" >> parseSelectorsSyntax >> " + key);

        json[key] = {
            syntax: values.syntax.startsWith("/*") ? key : values.syntax,
            // ast: parseSyntax(values.syntaxes.startsWith('/*') ? key : values.syntaxes).chi,
            // mdn_url: values.mdn_url
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseAtRulesSyntax(): Promise<ParsedSyntaxes> {
    const syntaxes = (await fetch("https://raw.githubusercontent.com/mdn/data/main/css/at-rules.json", fetchInit).then(
        (r) => r.json(),
    )) as Record<
        string,
        {
            syntax: string;
            // mdn_url: string;
        }
    >;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {
        console.error(" >> parseAtRulesSyntax >> " + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi,
            // mdn_url: values.mdn_url
        };

        if ("descriptors" in values) {
            json[key].descriptors = Object.entries(
                values.descriptors as Record<
                    string,
                    {
                        [key: string]: string;
                    }
                >,
            ).reduce(
                (acc, [k, v]) => Object.assign(acc, { [k]: { syntax: v.syntax } as ParsedSyntax }),
                {} as Record<string, ParsedSyntax>,
            );
        }
    }

    return cleanup(json) as ParsedSyntaxes;
}
export async function parseAllSyntaxes(): Promise<ParsedSyntaxes> {
    const syntaxes = (await fetch("https://raw.githubusercontent.com/mdn/data/main/css/syntaxes.json", fetchInit).then(
        (r) => r.json(),
    )) as Record<
        string,
        {
            syntax: string;
        }
    >;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {
        console.error(" >> parseAllSyntaxes >> " + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntaxes).chi
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseUnitsSyntax(): Promise<string[]> {
    const syntaxes = (await fetch("https://raw.githubusercontent.com/mdn/data/main/css/units.json", fetchInit).then(
        (r) => r.json(),
    )) as Record<string, any>;

    return Object.keys(syntaxes);
}
