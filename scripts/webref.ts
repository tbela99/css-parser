import { writeFile } from "node:fs/promises";
import localPatch from "./local-patch.json" with { type: "json" };

// syntx definitions using the W3C Webref repository:
const baseUrl = "https://raw.githubusercontent.com/w3c/webref/refs/heads/main/ed/";
const indexUrl = baseUrl + "index.json";
const fetchInit = {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:180.0) Gecko/20100101 Firefox/151.0" },
};

export interface ParsedSyntax {
    syntax: string;
    descriptors?: Record<string, ParsedSyntax>;
}

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

let json = {
    declarations: {},
    syntaxes: {},
    selectors: {},
    atRules: {},
    units: await parseUnitsSyntax(),
    languages: Object.keys(
        (await fetch("https://cdn.jsdelivr.net/npm/@iso-639/data/1/en.json").then((r) => r.json())) as Record<
            string,
            string
        >,
    ),
    mediaFeatures: {},
    types: {},
} as any;

const patches: PatchSyntax = (await fetch(
    "https://raw.githubusercontent.com/csstree/csstree/refs/heads/master/data/patch.json",
    fetchInit,
).then((r) => r.json())) as PatchSyntax;

const definitions = (await fetch(indexUrl, fetchInit).then((r) => r.json())) as {
    results: Array<Record<string, string>>;
};

let url: string;

for (const definition of definitions.results) {
    if (definition.css == null) {
        continue;
    }

    url = baseUrl + definition.css;
    const object = await fetch(url, fetchInit).then((r) => r.json());

    if (Array.isArray(object.atrules)) {
        for (const atRule of object.atrules) {
            if (atRule.value == null) {
                continue;
            }

            json.atRules[atRule.name] = { syntax: atRule.value };

            if (Array.isArray(atRule.descriptors)) {
                json.atRules[atRule.name].descriptors = {};

                for (const descriptor of atRule.descriptors) {
                    if (descriptor.value == null) {
                        continue;
                    }

                    json.atRules[atRule.name].descriptors[descriptor.name] = descriptor.value;
                }
            }

            if (Object.keys(json.atRules[atRule.name].descriptors).length === 0) {
                delete json.atRules[atRule.name].descriptors;
            }

            // json.atRules[atRule.name].url = url;
        }
    }

    if (Array.isArray(object.properties)) {
        for (const property of object.properties) {
            if (property.value == null) {
                continue;
            }

            json.declarations[property.name] = { syntax: property.value };
            // json.declarations[property.name].url = url;
        }
    }

    if (Array.isArray(object.selectors)) {
        for (const selector of object.selectors) {
            if (selector.value == null) {
                continue;
            }

            json.selectors[selector.name] = { syntax: selector.value };
            // json.selectors[selector.name].url = url;
        }
    }

    for (const type of object.values) {
        if (type.value == null) {
            continue;
        }

        if (type.name[0] == "<") {
            json.types[type.name] = { syntax: type.value };
            // json.types[type.name].url = url;
            continue;
        }

        json.syntaxes[type.name] = { syntax: type.value };
        // json.syntaxes[type.name].url = url;
    }

    console.error(" >> parseAllSyntaxes >> " + baseUrl + definition.css);
}

// @ts-ignore
applyPatches(patches, localPatch as PatchSyntax);

if (!(":-webkit-any()" in json.selectors)) {
    json.selectors[":-webkit-any()"] = { syntax: ":-webkit-any( <forgiving-selector-list> )" };
}

if (!(":-webkit-any-link" in json.selectors)) {
    json.selectors[":-webkit-any-link"] = { syntax: ":-webkit-any-link" };
}

json = sortKeys(json) as typeof json;

const outputDirectory = process.env.CSS_DATA_OUTPUT_DIR ?? import.meta.dirname! + "/../src/data";
await writeFile(outputDirectory + "/validation.json", JSON.stringify(json));

console.log(JSON.stringify(json, null, 1));

function sortKeys(obj: Record<string, any>) {
    const enteries = Object.entries(obj).sort(([a], [b]) =>
        a == "syntax" ? -1 : b == "syntax" ? 1 : a.localeCompare(b),
    );
    const json = Object.fromEntries(enteries);

    for (const [key, value] of enteries) {
        if (typeof value === "object" && !Array.isArray(value)) {
            json[key] = sortKeys(value);
        }
    }

    return json;
}

export async function parseUnitsSyntax(): Promise<string[]> {
    const syntaxes = (await fetch("https://raw.githubusercontent.com/mdn/data/main/css/units.json", fetchInit).then(
        (r) => r.json(),
    )) as Record<string, any>;

    return Object.keys(syntaxes);
}

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

            if (!(key in json.atRules) || json.atRules[key].syntax == null || "comment" in value) {
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
            } else if (value.comment?.startsWith?.("extend") || value.syntax.startsWith("|")) {
                console.error(`>> extending declaration syntax >> ${key}`);
                json.declarations[key].syntax += " " + value.syntax;
            } else {
                console.error(`>> replacing declaration syntax >> ${key}`);
                json.declarations[key].syntax = " " + value.syntax;
            }
        }

        for (const [key, value] of Object.entries(patch.types)) {
            if (localPatch.skipped.some((t) => key.startsWith(t))) {
                console.error(`>> skipping type >> ${key}`);
                continue;
            }

            if (!(key in json.syntaxes)) {
                console.error(`>> adding type syntax >> ${key}`);
                json.syntaxes[key] = { syntax: value.syntax };
            } else if (value.comment?.startsWith?.("extend") || value.syntax.startsWith("|")) {
                console.error(`>> extending type syntax >> ${key} >> ${JSON.stringify(value)}`);
                json.syntaxes[key].syntax += " " + value.syntax;
            } else {
                console.error(`>> replacing type syntax >> ${key} >> ${JSON.stringify(value)}`);
                json.syntaxes[key] = { syntax: value.syntax };
            }
        }

        if ("selectors" in patch) {
            for (const [key, value] of Object.entries(patch.selectors)) {
                if (!(key in json.selectors)) {
                    console.error(`>> adding selector syntax >> ${key}`);
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
            // @ts-expect-error
            for (const [group, config] of Object.entries(patch.mediaFeatures)) {
                // @ts-expect-error
                for (const [category, features] of Object.entries(config)) {
                    // @ts-expect-error
                    for (const [name, feature] of Object.entries(features)) {
                        // @ts-expect-error
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
