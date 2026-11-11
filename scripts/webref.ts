import { appendFile, readFile, writeFile } from "node:fs/promises";
import localPatch from "./local-patch.json" with { type: "json" };

// syntax definitions of the W3C Webref repository: the consolidated css definitions of the @webref/css package
// (https://github.com/w3c/webref/tree/main/packages/css), pulled from the remote url. the definitions of the levels of a
// spec and their extensions are merged (the latest level is used). a new version of the package may introduce breaking
// changes: the version is updated manually
const webrefUrl = "https://cdn.jsdelivr.net/npm/@webref/css@8.7.8/css.json";
// the renamed properties are renamed by the parser (renamedStandardProperties), they are updated manually
const renamedPropertiesFile = import.meta.dirname! + "/../src/lib/syntax/syntax.ts";
// the csstree patch, written for mdn-data
const patchUrl = "https://raw.githubusercontent.com/csstree/csstree/refs/heads/master/data/patch.json";
const localPatchUrl = "scripts/local-patch.json";
const languagesUrl = "https://cdn.jsdelivr.net/npm/@iso-639/data/1/en.json";
// the legacy data source (mdn-data, deprecated), used to find the origin of the definitions of the syntax files
// generated before the migration to webref
const legacyUrl = "https://raw.githubusercontent.com/mdn/data/main/css/";
const fetchInit = {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:180.0) Gecko/20100101 Firefox/151.0" },
};

// the order of the origins in the summary
const originLabels: string[] = [
    "legacy mdn-data",
    "mdn-data patch",
    "local-patch.json",
    "removed from webref",
    "iso-639",
    "unknown origin",
];

// the origins of the definitions of the legacy syntax files, see legacyOrigins()
let legacy: Promise<Origins> | null = null;

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
    units: [],
    languages: Object.keys((await fetchJson(languagesUrl)) as Record<string, string>),
    mediaFeatures: {},
    types: {},
} as any;

// origin of the definitions of the syntax file: the url of the file that provides them, see summarizeChanges()
const origins: Origins = createOrigins();

for (const language of json.languages) {
    origins.languages[language] = languagesUrl;
}

const patches: PatchSyntax = (await fetchJson(patchUrl)) as PatchSyntax;

const webref: WebrefCss = (await fetchJson(webrefUrl)) as WebrefCss;

// functions and types scoped to another definition (e.g. <filter-function> -> blur(), clip -> rect()). they are
// resolved once all the definitions are loaded, see resolveScopedDefinitions()
const scopedDefinitions: ScopedDefinition[] = [];

// renamed definitions, by origin group: old name -> new name. they are not added to the syntax file
const renamed: Partial<Record<OriginGroup, Record<string, string>>> = { declarations: {} };

// the renamed properties the parser does not rename, see checkRenamedProperties()
const renamedMissing: Set<string> = new Set();

for (const atRule of webref.atrules ?? []) {
    // the scoped at-rules (`@swash` for `@font-feature-values`) are stored with the other at-rules
    if (atRule.syntax == null) {
        console.error(`>> skipping at-rule without syntax >> ${atRule.name}`);
        continue;
    }

    define("atRules", atRule.name, webrefUrl, () => {
        json.atRules[atRule.name] = { syntax: atRule.syntax };
    });

    // @media descriptors are the media features, they are validated using json.mediaFeatures
    if (atRule.name == "@media") {
        continue;
    }

    for (const descriptor of atRule.descriptors ?? []) {
        if (descriptor.syntax == null) {
            continue;
        }

        define("descriptors", `${atRule.name}/${descriptor.name}`, webrefUrl, () => {
            (json.atRules[atRule.name].descriptors ??= {})[descriptor.name] = descriptor.syntax;
        });
    }
}

for (const property of webref.properties ?? []) {
    // legacy name aliases are renamed properties: `word-wrap` is a legacy name alias of `overflow-wrap`,
    // `-webkit-align-content` of `align-content`. they are not added, the parser renames them
    // (renamedStandardProperties)
    if (property.legacyAliasOf != null) {
        console.error(`>> renamed property >> ${property.name} >> ${property.legacyAliasOf}`);
        renamed.declarations![property.name] = property.legacyAliasOf;
        continue;
    }

    if (property.syntax == null) {
        console.error(`>> skipping property without syntax >> ${property.name}`);
        continue;
    }

    define("declarations", property.name, webrefUrl, () => {
        json.declarations[property.name] = { syntax: property.syntax };
    });
}

// webref does not provide a syntax for some selectors, or provides a prose one, see the patches
for (const selector of webref.selectors ?? []) {
    if (selector.syntax != null) {
        define("selectors", selector.name, webrefUrl, () => {
            json.selectors[selector.name] = { syntax: selector.syntax };
        });
    }
}

// the functions (`abs()`) are stored in json.syntaxes, the types (`color` for `<color>`) in json.types, without their
// angle brackets. see lookupNode() in src/lib/validation/config.ts
for (const [definitions, isType] of [
    [webref.functions, false],
    [webref.types, true],
] as Array<[WebrefDefinition[] | undefined, boolean]>) {
    for (const definition of definitions ?? []) {
        if (definition.syntax == null) {
            continue;
        }

        const name: string = isType ? `<${definition.name}>` : definition.name;
        const scopes: string[] = definition.for == null ? [] : ([] as string[]).concat(definition.for);

        if (scopes.length == 0) {
            define("types", name, webrefUrl, () => {
                (isType ? json.types : json.syntaxes)[definition.name] = { syntax: definition.syntax };
            });
            continue;
        }

        for (const scope of scopes) {
            scopedDefinitions.push({ name, syntax: definition.syntax, scope: scopeOf(scope), url: webrefUrl });
        }
    }
}

await checkRenamedProperties();
resolveScopedDefinitions();

// @webref/css does not list the units: they are defined by the local patch
for (const unit of Object.keys((localPatch as { units?: Record<string, unknown> }).units ?? {})) {
    origins.units[unit] = localPatchUrl;
}

json.units = Object.keys(origins.units).sort();

// the csstree patch was written for another data source: it adds the missing definitions and extends the existing ones,
// but it does not replace the webref definitions. the local patch may replace them
applyPatches(false, patchUrl, patches);
// @ts-ignore
applyPatches(true, localPatchUrl, localPatch as PatchSyntax);

json = sortKeys(json) as typeof json;

const outputDirectory = process.env.CSS_DATA_OUTPUT_DIR ?? import.meta.dirname! + "/../src/data";
const outputFile: string = outputDirectory + "/validation.json";
// the origin of the definitions of the syntax file, used to report the origin of the removed definitions
const originsFile: string = outputDirectory + "/validation.origins.json";
// the changes are appended to this file, they are ported manually to CHANGELOG.md
const changesFile: string = process.env.CSS_SYNTAX_CHANGES_FILE ?? import.meta.dirname! + "/../VALIDATION-SYNTAX-CHANGELOG.md";

// the previous syntax file, compared with the new one
const previous: SyntaxFile | null = await readFile(outputFile, "utf8").then(
    (content: string) => JSON.parse(content) as SyntaxFile,
    () => null,
);

const previousOrigins: Origins = await readFile(originsFile, "utf8").then(
    (content: string) => parseOrigins(JSON.parse(content)),
    () => createOrigins(),
);

await writeFile(outputFile, JSON.stringify(json));
await writeFile(originsFile, serializeOrigins(collectOrigins(json as SyntaxFile, origins)));

const summary: string = await summarizeChanges(previous, json as SyntaxFile, previousOrigins, renamed);

console.log(summary);

if (previous != null && summary.includes("\n### ")) {
    await appendFile(changesFile, summary + "\n\n");
    console.error(`>> syntax changes appended to ${changesFile}`);
}

/**
 * fetch a json file
 * @param url
 */
async function fetchJson(url: string): Promise<unknown> {
    const response: Response = await fetch(url, fetchInit);

    if (!response.ok) {
        throw new Error(`${url}: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * consolidated css definitions of @webref/css (css.json)
 */
interface WebrefCss {
    atrules?: Array<WebrefDefinition & { descriptors?: WebrefDefinition[] }>;
    functions?: WebrefDefinition[];
    properties?: Array<WebrefDefinition & { legacyAliasOf?: string }>;
    selectors?: WebrefDefinition[];
    types?: WebrefDefinition[];
}

/**
 * css definition. the types are named without their angle brackets (`color`), the functions with their parentheses
 * (`abs()`)
 */
interface WebrefDefinition {
    name: string;
    href?: string;
    syntax?: string;
    // the definitions the definition is scoped to: a property (`clip`), a type (`<basic-shape>`), a function
    // (`attr()`), an at-rule (`@function`) or a selector
    for?: string | string[];
}

/**
 * add or replace a webref definition
 * @param group
 * @param name the name of the definition, see originName()
 * @param url the url of the file that provides it
 * @param add
 */
function define(group: OriginGroup, name: string, url: string, add: () => void) {
    origins[group][originName(group, name)] = url;
    add();
}

/**
 * report the renamed properties that the parser does not rename: renamedStandardProperties is updated manually
 */
async function checkRenamedProperties() {
    const source: string = await readFile(renamedPropertiesFile, "utf8").catch(() => "");
    const entries: string =
        source.match(/renamedStandardProperties\s*=\s*new Map\(\s*\[([\s\S]*?)\]\s*\)/)?.[1] ?? "";
    const known: Set<string> = new Set(
        [...entries.matchAll(/\[\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\]/g)].map((match) => match[1]),
    );

    for (const [name, target] of Object.entries(renamed.declarations!)) {
        if (!known.has(name)) {
            console.error(`>> renamed property missing from renamedStandardProperties >> ${name} >> ${target}`);
            renamedMissing.add(name);
        }
    }
}

/**
 * scope of a definition: the definition it is nested in. the types are named without their angle brackets
 */
type Scope =
    | { group: "declarations" | "selectors" | "atRules" | "types" | "syntaxes"; name: string }
    | { group: "descriptors"; name: string; atRule: string };

interface ScopedDefinition {
    // `<name>` for a type, `name()` for a function
    name: string;
    syntax: string;
    scope: Scope;
    // the url of the file that provides it
    url: string;
}

/**
 * scope of a scoped definition, from the `for` key of webref: `clip`, `<basic-shape>`, `attr()`, `@function`,
 * `@font-face/src`, `:nth-child()`
 * @param name
 */
function scopeOf(name: string): Scope {
    if (name.startsWith("<")) {
        return { group: "types", name: name.slice(1, -1) };
    }

    if (name.startsWith("@")) {
        const index: number = name.indexOf("/");

        return index == -1
            ? { group: "atRules", name }
            : { group: "descriptors", name: name.slice(index + 1), atRule: name.slice(0, index) };
    }

    if (name.startsWith(":")) {
        return { group: "selectors", name };
    }

    if (name.endsWith("()")) {
        return { group: "syntaxes", name };
    }

    return { group: "declarations", name };
}

/**
 * syntax of the definition a scoped definition is nested in
 * @param scope
 */
function getScopeSyntax(scope: Scope): string | null {
    if (scope.group == "descriptors") {
        return json.atRules[scope.atRule]?.descriptors?.[scope.name] ?? null;
    }

    return json[scope.group][scope.name]?.syntax ?? null;
}

/**
 * update the syntax of the definition a scoped definition is nested in
 * @param scope
 * @param syntax
 */
function setScopeSyntax(scope: Scope, syntax: string) {
    if (scope.group == "descriptors") {
        json.atRules[scope.atRule].descriptors[scope.name] = syntax;
    } else {
        json[scope.group][scope.name].syntax = syntax;
    }
}

/**
 * reference of a type or a function in a syntax: `<content-list>`, `<rect()>`
 * @param name
 */
function referencePattern(name: string): RegExp {
    return new RegExp((name[0] == "<" ? name : `<${name}>`).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
}

/**
 * true if the syntax is a single function: `rect( <top>, <right>, <bottom>, <left> )`
 * @param name
 * @param syntax
 */
function isSingleFunction(name: string, syntax: string): boolean {
    syntax = syntax.trim();

    if (!syntax.startsWith(name.slice(0, -1)) || !syntax.endsWith(")")) {
        return false;
    }

    let depth: number = 0;

    for (let i = name.length - 2; i < syntax.length; i++) {
        if (syntax[i] == "(") {
            depth++;
        } else if (syntax[i] == ")" && --depth == 0) {
            return i == syntax.length - 1;
        }
    }

    return false;
}

/**
 * true if the definition the scoped definition is nested in references it
 * @param definition
 */
function canInline(definition: ScopedDefinition): boolean {
    const syntax: string | null = getScopeSyntax(definition.scope);

    return syntax != null && referencePattern(definition.name).test(syntax);
}

/**
 * replace the reference to a scoped definition by its syntax in the definition it is nested in:
 * `clip: <rect()> | auto` becomes `clip: rect( <top>, <right>, <bottom>, <left> ) | auto`
 * @param definition
 */
function inline(definition: ScopedDefinition): boolean {
    if (!canInline(definition)) {
        return false;
    }

    const syntax: string =
        definition.name[0] != "<" && isSingleFunction(definition.name, definition.syntax)
            ? definition.syntax.trim()
            : `[ ${definition.syntax.trim()} ]`;

    setScopeSyntax(
        definition.scope,
        (getScopeSyntax(definition.scope) as string).replace(referencePattern(definition.name), () => syntax),
    );

    return true;
}

/**
 * a function or a type may be defined differently for different scopes (rect() for clip and rect() for
 * <basic-shape>). the validation syntaxes have a single definition per name: the unscoped definition, or the first
 * scoped definition that is not referenced by its scope. the other definitions are inlined in the syntax of their
 * scope, as a function or a bracketed group
 */
function resolveScopedDefinitions() {
    const byName: Map<string, ScopedDefinition[]> = new Map();

    for (const definition of scopedDefinitions) {
        // nested in itself
        if ((definition.scope.group == "types" ? `<${definition.scope.name}>` : definition.scope.name) == definition.name) {
            continue;
        }

        if (!byName.has(definition.name)) {
            byName.set(definition.name, []);
        }

        byName.get(definition.name)!.push(definition);
    }

    for (const [name, definitions] of byName) {
        const group = name[0] == "<" ? json.types : json.syntaxes;
        const key: string = name[0] == "<" ? name.slice(1, -1) : name;
        let global: string | undefined = group[key]?.syntax;

        if (global == null) {
            const definition: ScopedDefinition =
                definitions.find((definition) => !canInline(definition)) ?? definitions[0];

            global = definition.syntax;
            group[key] = { syntax: global };
            origins.types[originName("types", name)] = definition.url;
        }

        for (const definition of definitions) {
            if (definition.syntax == global) {
                continue;
            }

            // the scope already contains the syntax: `width: ... | fit-content(<length-percentage [0,∞]>)`
            if (getScopeSyntax(definition.scope)?.includes(definition.syntax)) {
                continue;
            }

            if (inline(definition)) {
                console.error(
                    `>> inlining scoped definition >> ${name} >> ${definition.scope.group} ${definition.scope.name}`,
                );
            } else {
                console.error(
                    `>> ignoring scoped definition >> ${name} >> ${definition.scope.group} ${definition.scope.name} >> ${definition.syntax}`,
                );
            }
        }
    }
}

/**
 * find a type syntax: the patches use the type names without the angle brackets
 * @param key
 */
function findTypeSyntax(key: string): ParsedSyntax | null {
    return json.syntaxes[key] ?? json.types[key] ?? null;
}

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

/**
 * apply patches. the patch is the origin of the definitions it adds or replaces
 * @param replace replace the existing definitions
 * @param url the url of the patches
 * @param patches
 */
function applyPatches(replace: boolean, url: string, ...patches: PatchSyntax[]) {
    for (const patch of patches) {
        for (let [key, value] of Object.entries(patch.atrules)) {
            if (key.charAt(0) != "@") {
                key = "@" + key;
            }

            if (localPatch.skipped.some((t) => key.slice(1).startsWith(t))) {
                console.error(`>> skipping at-rule >> ${key}`);
                continue;
            }

            if (replace || !(key in json.atRules) || json.atRules[key].syntax == null) {
                console.error(`>> adding at-rule >> ${key}`);
                json.atRules[key] = { syntax: value.syntax };
                origins.atRules[key] = url;

                if ("descriptors" in value) {
                    (json.atRules[key] as ParsedSyntax).descriptors = value.descriptors as Record<string, ParsedSyntax>;

                    for (const descriptor of Object.keys(value.descriptors as object)) {
                        origins.descriptors[`${key}/${descriptor}`] = url;
                    }
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
                origins.declarations[key] = url;
            } else if (value.comment?.startsWith?.("extend") || value.syntax.startsWith("|")) {
                console.error(`>> extending declaration syntax >> ${key}`);
                json.declarations[key].syntax += " " + value.syntax;
            } else if (replace) {
                console.error(`>> replacing declaration syntax >> ${key}`);
                json.declarations[key].syntax = " " + value.syntax;
                origins.declarations[key] = url;
            } else {
                console.error(`>> keeping webref declaration syntax >> ${key}`);
            }
        }

        for (const [key, value] of Object.entries(patch.types)) {
            if (localPatch.skipped.some((t) => key.startsWith(t))) {
                console.error(`>> skipping type >> ${key}`);
                continue;
            }

            // webref types are stored without their angle brackets in json.types
            const type: ParsedSyntax | null = findTypeSyntax(key);

            if (type == null) {
                console.error(`>> adding type syntax >> ${key}`);
                json.syntaxes[key] = { syntax: value.syntax };
                origins.types[originName("types", key)] = url;
            } else if (value.comment?.startsWith?.("extend") || value.syntax.startsWith("|")) {
                console.error(`>> extending type syntax >> ${key} >> ${JSON.stringify(value)}`);
                type.syntax += " " + value.syntax;
            } else if (replace) {
                console.error(`>> replacing type syntax >> ${key} >> ${JSON.stringify(value)}`);
                type.syntax = value.syntax;
                origins.types[originName("types", key)] = url;
            } else {
                console.error(`>> keeping webref type syntax >> ${key}`);
            }
        }

        if ("selectors" in patch) {
            for (const [key, value] of Object.entries(patch.selectors)) {
                // webref does not provide a syntax for some selectors, or provides a prose one:
                // `:nth-child(An+B [of S]?)`
                if (replace || !(key in json.selectors)) {
                    console.error(`>> adding selector syntax >> ${key}`);
                    json.selectors[key] = { syntax: value.syntax };
                    origins.selectors[key] = url;
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
                        origins.mediaFeatures[name] = url;

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

// =============================== //
// summary of the changes between the previous and the new syntax file

/**
 * syntax file (src/data/validation.json)
 */
interface SyntaxFile {
    declarations?: Record<string, { syntax: string }>;
    syntaxes?: Record<string, { syntax: string }>;
    types?: Record<string, { syntax: string }>;
    selectors?: Record<string, { syntax: string }>;
    atRules?: Record<string, { syntax?: string; descriptors?: Record<string, string | { syntax: string }> }>;
    units?: string[];
    languages?: string[];
    mediaFeatures?: Record<string, unknown>;
}

/**
 * changes of a group of definitions
 */
interface GroupChanges {
    added: string[];
    removed: string[];
    changed: Array<[name: string, previous: string, current: string]>;
}

/**
 * syntax without the insignificant whitespace: the patches may add leading spaces
 * @param syntax
 */
function normalizeSyntax(syntax: string | undefined | null): string {
    return (syntax ?? "").replace(/\s+/g, " ").trim();
}

/**
 * compare the definitions of a group, by name
 * @param previous
 * @param current
 */
function compareDefinitions(previous: Record<string, string>, current: Record<string, string>): GroupChanges {
    const changes: GroupChanges = { added: [], removed: [], changed: [] };

    for (const [name, syntax] of Object.entries(current)) {
        if (!(name in previous)) {
            changes.added.push(name);
        } else if (previous[name] !== syntax) {
            changes.changed.push([name, previous[name], syntax]);
        }
    }

    for (const name of Object.keys(previous)) {
        if (!(name in current)) {
            changes.removed.push(name);
        }
    }

    changes.added.sort();
    changes.removed.sort();
    changes.changed.sort((a, b) => a[0].localeCompare(b[0]));

    return changes;
}

/**
 * the syntaxes of a group, by name
 * @param group
 */
function syntaxesOf(group: Record<string, { syntax?: string }> | undefined): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [name, definition] of Object.entries(group ?? {})) {
        result[name] = normalizeSyntax(definition?.syntax);
    }

    return result;
}

/**
 * the types and the functions, by name: `<color>`, `abs()`. the types are stored in `types` or in `syntaxes`, without
 * their angle brackets. the matcher uses the `syntaxes` definition first
 * @param file
 */
function valueSyntaxesOf(file: SyntaxFile): Record<string, string> {
    const result: Record<string, string> = {};

    // the types are stored without their angle brackets (previous syntax files: with their angle brackets)
    for (const [name, definition] of Object.entries(file.types ?? {})) {
        result[name.startsWith("<") ? name : `<${name}>`] = normalizeSyntax(definition?.syntax);
    }

    for (const [name, definition] of Object.entries(file.syntaxes ?? {})) {
        result[name.endsWith("()") || name.startsWith("<") ? name : `<${name}>`] = normalizeSyntax(definition?.syntax);
    }

    return result;
}

/**
 * the at-rule descriptors, by at-rule and descriptor name: `@font-face/src`
 * @param file
 */
function descriptorsOf(file: SyntaxFile): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [atRule, definition] of Object.entries(file.atRules ?? {})) {
        for (const [name, descriptor] of Object.entries(definition?.descriptors ?? {})) {
            result[`${atRule}/${name}`] = normalizeSyntax(typeof descriptor === "string" ? descriptor : descriptor?.syntax);
        }
    }

    return result;
}

/**
 * the values of a list, by value: units, languages
 * @param values
 */
function listOf(values: string[] | undefined): Record<string, string> {
    return Object.fromEntries((values ?? []).map((value: string) => [value, value]));
}

/**
 * the media features, by name. the keys are sorted: the syntax file keys are sorted, see sortKeys()
 * @param file
 */
function mediaFeaturesOf(file: SyntaxFile): Record<string, string> {
    const stringify = (value: unknown): string =>
        value != null && typeof value == "object" && !Array.isArray(value)
            ? "{" +
              Object.keys(value)
                  .sort()
                  .map((key: string) => JSON.stringify(key) + ":" + stringify((value as Record<string, unknown>)[key]))
                  .join(",") +
              "}"
            : JSON.stringify(value);

    return Object.fromEntries(
        Object.entries(file.mediaFeatures ?? {}).map(([name, feature]) => [name, stringify(feature)]),
    );
}

/**
 * markdown code span
 * @param text
 */
function code(text: string): string {
    return text.includes("`") ? "`` " + text + " ``" : "`" + text + "`";
}

/**
 * the definitions of a syntax file, by group and name: the syntaxes of the definitions, the values of the lists
 * @param file
 */
function groupsOf(file: SyntaxFile): Record<OriginGroup, Record<string, string>> {
    return {
        declarations: syntaxesOf(file.declarations),
        types: valueSyntaxesOf(file),
        selectors: syntaxesOf(file.selectors),
        atRules: syntaxesOf(file.atRules),
        descriptors: descriptorsOf(file),
        mediaFeatures: mediaFeaturesOf(file),
        units: listOf(file.units),
        languages: listOf(file.languages),
    };
}

// =============================== //
// origin of the definitions

/**
 * groups of definitions of the syntax file
 */
type OriginGroup =
    | "declarations"
    | "types"
    | "selectors"
    | "atRules"
    | "descriptors"
    | "mediaFeatures"
    | "units"
    | "languages";

/**
 * url of the file that provides each definition, by group and name. the types and the functions are named `<color>`
 * and `abs()`, the descriptors `@font-face/src`. saved next to the syntax file (validation.origins.json), see
 * serializeOrigins()
 */
type Origins = Record<OriginGroup, Record<string, string>>;

/**
 * the origins file: the names of the definitions, by group and url
 * @param origins
 */
function serializeOrigins(origins: Origins): string {
    const result: Record<string, Record<string, string[]>> = {};

    for (const [group, definitions] of Object.entries(origins)) {
        result[group] = {};

        for (const [name, url] of Object.entries(definitions)) {
            (result[group][url] ??= []).push(name);
        }

        result[group] = Object.fromEntries(
            Object.entries(result[group])
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([url, names]) => [url, names.sort()]),
        );
    }

    return JSON.stringify(result, null, 1) + "\n";
}

/**
 * parse the origins file, see serializeOrigins()
 * @param content
 */
function parseOrigins(content: Record<string, Record<string, string[]>>): Origins {
    const origins: Origins = createOrigins();

    for (const [group, urls] of Object.entries(content ?? {})) {
        if (group in origins) {
            for (const [url, names] of Object.entries(urls ?? {})) {
                for (const name of names) {
                    origins[group as OriginGroup][name] = url;
                }
            }
        }
    }

    return origins;
}

function createOrigins(): Origins {
    return {
        declarations: {},
        types: {},
        selectors: {},
        atRules: {},
        descriptors: {},
        mediaFeatures: {},
        units: {},
        languages: {},
    };
}

/**
 * name of a definition in its group: the types stored in json.syntaxes are named without their angle brackets
 * @param group
 * @param name
 */
function originName(group: OriginGroup, name: string): string {
    return group == "types" && !name.endsWith("()") && !name.startsWith("<") ? `<${name}>` : name;
}

/**
 * the origins of the definitions of the syntax file
 * @param file
 * @param origins the origins recorded while generating the syntax file
 */
function collectOrigins(file: SyntaxFile, origins: Origins): Origins {
    const result: Origins = createOrigins();

    for (const [group, definitions] of Object.entries(groupsOf(file)) as Array<[OriginGroup, Record<string, string>]>) {
        for (const name of Object.keys(definitions).sort()) {
            result[group][name] =
                origins[group][name] ??
                // a descriptor is provided by its at-rule
                (group == "descriptors" ? origins.atRules[name.slice(0, name.indexOf("/"))] : undefined) ??
                "";

            if (result[group][name] == "") {
                console.error(`>> unknown origin >> ${group} >> ${name}`);
            }
        }
    }

    return result;
}

/**
 * the origins of the definitions of a syntax file generated before the migration to webref (mdn-data, removed script
 * scripts/validation.ts):
 * mdn-data, then the csstree patch (mdn-data patch), then the local patch
 */
function legacyOrigins(): Promise<Origins> {
    legacy ??= (async () => {
        const result: Origins = createOrigins();
        const add = (group: OriginGroup, names: Iterable<string>, url: string) => {
            for (const name of names) {
                result[group][originName(group, name)] ??= url;
            }
        };

        const mdn = async (file: string): Promise<Record<string, any>> =>
            ((await fetchJson(legacyUrl + file).catch((error: Error) => {
                console.error(`>> legacy mdn-data not available >> ${error.message}`);
                return {};
            })) ?? {}) as Record<string, any>;

        const atRules = (url: string, definitions: Record<string, { descriptors?: object }>) => {
            for (const [name, definition] of Object.entries(definitions ?? {})) {
                const key: string = name.startsWith("@") ? name : "@" + name;

                add("atRules", [key], url);
                add(
                    "descriptors",
                    Object.keys(definition?.descriptors ?? {}).map((descriptor: string) => `${key}/${descriptor}`),
                    url,
                );
            }
        };

        add("declarations", Object.keys(await mdn("properties.json")), legacyUrl + "properties.json");
        add("types", Object.keys(await mdn("syntaxes.json")), legacyUrl + "syntaxes.json");
        add("types", Object.keys(await mdn("functions.json")), legacyUrl + "functions.json");
        add("selectors", Object.keys(await mdn("selectors.json")), legacyUrl + "selectors.json");
        atRules(legacyUrl + "at-rules.json", await mdn("at-rules.json"));
        add("units", Object.keys(await mdn("units.json")), legacyUrl + "units.json");

        for (const [url, patch] of [
            [patchUrl, patches],
            [localPatchUrl, localPatch],
        ] as Array<[string, Partial<PatchSyntax> & { mediaFeatures?: object; units?: object }]>) {
            add("declarations", Object.keys(patch.properties ?? {}), url);
            add("types", Object.keys(patch.types ?? {}), url);
            add("selectors", Object.keys(patch.selectors ?? {}), url);
            atRules(url, (patch.atrules ?? {}) as Record<string, { descriptors?: object }>);
            add("units", Object.keys(patch.units ?? {}), url);

            for (const config of Object.values(patch.mediaFeatures ?? {})) {
                for (const features of Object.values(config as object)) {
                    add("mediaFeatures", Object.keys(features as object), url);
                }
            }
        }

        add("languages", json.languages as string[], languagesUrl);

        return result;
    })();

    return legacy;
}

/**
 * description of an origin
 * @param url
 */
function originLabel(url: string): string {
    if (url == "") {
        return "unknown origin";
    }

    if (url.startsWith(legacyUrl)) {
        return "legacy mdn-data";
    }

    if (url == patchUrl) {
        return "mdn-data patch";
    }

    if (url == localPatchUrl) {
        return "local-patch.json";
    }

    if (url == languagesUrl) {
        return "iso-639";
    }

    // the other origins are webref files: webrefUrl, another version of the package, or the css extracts used by the
    // previous versions of this script
    return "removed from webref";
}

/**
 * the removed definitions of a group, grouped by origin: [label, url, names]
 * @param group
 * @param names
 * @param previousOrigins the origins of the definitions of the previous syntax file
 */
async function groupByOrigin(
    group: OriginGroup,
    names: string[],
    previousOrigins: Origins,
): Promise<Array<[label: string, url: string, names: string[]]>> {
    const byUrl: Map<string, string[]> = new Map();

    for (const name of names) {
        const url: string = previousOrigins[group][name] || (await legacyOrigins())[group][name] || "";

        if (!byUrl.has(url)) {
            byUrl.set(url, []);
        }

        byUrl.get(url)!.push(name);
    }

    return [...byUrl]
        .map(([url, names]): [string, string, string[]] => [originLabel(url), url, names])
        .sort(
            (a, b) => originLabels.indexOf(a[0]) - originLabels.indexOf(b[0]) || a[1].localeCompare(b[1]),
        );
}

/**
 * markdown summary of the changes between the previous and the new syntax file
 * @param previous the previous syntax file, null if there is none
 * @param current the new syntax file
 * @param previousOrigins the origins of the definitions of the previous syntax file
 * @param renamed the renamed definitions, by group: old name -> new name
 */
async function summarizeChanges(
    previous: SyntaxFile | null,
    current: SyntaxFile,
    previousOrigins: Origins,
    renamed: Partial<Record<OriginGroup, Record<string, string>>>,
): Promise<string> {
    const lines: string[] = [`## Syntax changes - ${new Date().toISOString()}`, ""];

    lines.push(`source: ${webrefUrl}`, "");

    if (previous == null) {
        lines.push(
            "no previous syntax file: " +
                `${Object.keys(current.declarations ?? {}).length} declarations, ` +
                `${Object.keys(valueSyntaxesOf(current)).length} types and functions, ` +
                `${Object.keys(current.selectors ?? {}).length} selectors, ` +
                `${Object.keys(current.atRules ?? {}).length} at-rules, ` +
                `${(current.units ?? []).length} units`,
        );

        return lines.join("\n");
    }

    const titles: Record<OriginGroup, string> = {
        declarations: "declarations",
        types: "types and functions",
        selectors: "selectors",
        atRules: "at-rules",
        descriptors: "at-rule descriptors",
        mediaFeatures: "media features",
        units: "units",
        languages: "languages",
    };

    const before = groupsOf(previous);
    const after = groupsOf(current);
    const groups: Array<[group: OriginGroup, changes: GroupChanges, showSyntax: boolean]> = (
        Object.keys(titles) as OriginGroup[]
    ).map((group: OriginGroup) => [
        group,
        compareDefinitions(before[group], after[group]),
        group != "units" && group != "languages",
    ]);

    const counts: string[] = [];

    for (const [group, changes] of groups) {
        if (changes.added.length + changes.removed.length + changes.changed.length > 0) {
            const renamedCount: number = changes.removed.filter((name: string) => name in (renamed[group] ?? {})).length;

            counts.push(
                `- ${titles[group]}: ${changes.added.length} added, ${changes.removed.length} removed` +
                    (renamedCount > 0 ? ` (${renamedCount} renamed)` : "") +
                    `, ${changes.changed.length} changed`,
            );
        }
    }

    if (counts.length == 0) {
        lines.push("no changes");
        return lines.join("\n");
    }

    lines.push(...counts);

    for (const [group, changes, showSyntax] of groups) {
        if (changes.added.length + changes.removed.length + changes.changed.length == 0) {
            continue;
        }

        lines.push("", `### ${titles[group]}`);

        if (changes.added.length > 0) {
            lines.push("", `added: ${changes.added.map(code).join(", ")}`);
        }

        if (changes.removed.length > 0) {
            // the removed definitions, grouped by origin. the renamed definitions are reported with their new name
            lines.push("", "removed:", "");

            for (const [label, url, names] of await groupByOrigin(group, changes.removed, previousOrigins)) {
                lines.push(
                    `- ${label}${url == "" ? "" : ` (${url})`}: ` +
                        names
                            .map((name: string) =>
                                name in (renamed[group] ?? {})
                                    ? `${code(name)} (renamed: ${code(renamed[group]![name])}` +
                                      (group == "declarations" && renamedMissing.has(name)
                                          ? ", missing from renamedStandardProperties)"
                                          : ")")
                                    : code(name),
                            )
                            .join(", "),
                );
            }
        }

        if (changes.changed.length > 0) {
            lines.push("", "changed:", "");

            for (const [name, before, after] of changes.changed) {
                lines.push(`- ${code(name)}`);

                if (showSyntax) {
                    lines.push(`  - old: ${code(before)}`, `  - new: ${code(after)}`);
                }
            }
        }
    }

    return lines.join("\n");
}
