// compile the syntaxes of src/data/validation.json (declarations, types and functions) into matchers: the syntaxes are
// parsed once, at build time, the references (`<length>`, `<'width'>`, `<rgb()>`) are resolved, and the matchers are
// written as typescript code (src/validation/compiled/syntaxes.ts), built from the combinators of
// src/validation/compiled/runtime.ts. the structure of a matcher mirrors the syntax tree matched by the interpreter
// (src/validation/match.ts): a compiled matcher answers "valid", or defers to the interpreter, which reports the errors.
//
// the problems found in the syntax file are reported in src/data/syntax-report.json and in the console:
// - unresolved: a type that is neither defined nor built in (matchProperty()): the definitions that reference it are not
//   compiled, the interpreter validates them. a type that is not allowed (see `allowedUnresolved`) fails the build
// - unsupported: a syntax construct the compiler does not know: the definition is validated by the interpreter
//
// usage: npm run syntax-compile (after npm run syntax-update)

import "../src/node.ts";
import { readFile, writeFile } from "node:fs/promises";
import { parseSyntax, trimSyntaxArray } from "../src/validation/parser/parse.ts";
import { ValidationTokenEnum } from "../src/validation/parser/typedef.ts";
import { isNullable } from "../src/validation/first.ts";
import { builtinTypes } from "../src/validation/compiled/builtins.ts";
import type {
    ValidationAmpersandToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationDimensionToken,
    ValidationFunctionToken,
    ValidationNumberToken,
    ValidationOptionalGroupToken,
    ValidationPipeToken,
    ValidationStringToken,
    ValidationToken,
} from "../src/validation/parser/types.d.ts";

const root: string = import.meta.dirname! + "/..";
const dataFile: string = root + "/src/data/validation.json";
const outputFile: string = root + "/src/validation/compiled/syntaxes.ts";
const reportFile: string = root + "/src/data/syntax-report.json";

/**
 * the types that may be referenced without a definition: they are validated by the interpreter. the build fails when
 * another type is unresolved: a definition was renamed or removed upstream (webref), fix it in scripts/local-patch.json
 */
const allowedUnresolved: Set<string> = new Set([
    "any-value",
    "at-keyword-token",
    "boolean-expr-group",
    "charset",
    "declaration-rule-list",
    "dimension-token",
    "group-rule-body",
    "number-token",
    "qualified-rule-list",
    "rule-list",
    "string-token",
    "style-feature-value",
    "stylesheet",
    "url-token",
    "when-condition",
    "anchored-feature",
    // a hex color is a color token: <color> is built in (matchProperty())
    "hex-color",
]);

type Group = "declarations" | "syntaxes" | "types";

interface SyntaxNode {
    syntax?: string;
    alias?: string;
}

const config = JSON.parse(await readFile(dataFile, "utf8")) as Record<Group, Record<string, SyntaxNode>>;

/**
 * the compiled definitions: `group/name`, by index
 */
const keys: string[] = [];
const indexes: Map<string, number> = new Map();
const code: string[] = [];
const report = {
    unresolved: {} as Record<string, string[]>,
    unsupported: {} as Record<string, string>,
};

/**
 * the definition node of a group, the aliases are followed (see lookupNode() in src/validation/config.ts)
 * @param group
 * @param key
 */
function lookup(group: Group, key: string): { group: Group; key: string } | null {
    if (config[group]?.[key] != null) {
        let node: SyntaxNode = config[group][key];

        for (let i = 0; node.alias != null && i < 4; i++) {
            if (config[group][node.alias] == null) {
                return null;
            }

            key = node.alias;
            node = config[group][key];
        }

        return node.alias != null ? null : { group, key };
    }

    if (group === "syntaxes" && config.types?.[key] != null) {
        return lookup("types", key);
    }

    return null;
}

/**
 * see findNode() in src/validation/config.ts: a vendor prefixed name falls back to the standard name
 * @param group
 * @param key
 */
function resolve(group: Group, key: string): { group: Group; key: string } | null {
    let found = lookup(group, key);

    if (found == null && (key.charAt(0) === "@" || key.charAt(0) === "-")) {
        const matches: RegExpMatchArray | null = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);

        if (matches != null) {
            found = lookup(group, matches[1] + matches[3]);
        }
    }

    return found;
}

/**
 * the index of a definition, allocated on first reference
 * @param group
 * @param key
 */
function indexOf(group: Group, key: string): number {
    const name: string = group + "/" + key;
    let index: number | undefined = indexes.get(name);

    if (index === undefined) {
        index = keys.length;
        keys.push(name);
        indexes.set(name, index);
    }

    return index;
}

class Unsupported extends Error {}

class Unresolved extends Error {
    constructor(public type: string) {
        super(type);
    }
}

const json = (value: unknown): string => JSON.stringify(value);

/**
 * a sequence of syntaxes. the whitespace is skipped, the nullable flags of the suffixes are used when the tokens are
 * consumed (see findMandatorySyntax() in src/validation/match.ts)
 * @param syntaxes
 */
function sequence(syntaxes: ValidationToken[]): string {
    const items: ValidationToken[] = syntaxes.filter((syntax) => syntax.typ !== ValidationTokenEnum.Whitespace);

    if (items.length === 0) {
        return "empty";
    }

    const nullable: boolean[] = items.map((_, index: number) => items.slice(index).every(isNullable));

    return `seq([${items.map(element).join(", ")}], ${json(nullable.map(Number))})`;
}

/**
 * a syntax with its multipliers, in the order of matchSyntax()
 * @param syntax
 */
function element(syntax: ValidationToken): string {
    const optional: boolean = (syntax.isOptional === true || syntax.isRepeatable === true) && !syntax.isMandatatoryGroup;

    if (syntax.isRepeatableAtLeastOnce || syntax.isRepeatable) {
        const { isRepeatable, isOptional, isMandatatoryGroup, isRepeatableAtLeastOnce, ...rest } = syntax;
        const matcher: string = `rep(${sequence([rest as ValidationToken])}, ${isRepeatable === true})`;

        return optional ? `opt(${matcher})` : matcher;
    }

    if (syntax.isList) {
        const { isList, match, isOptional, ...rest } = syntax;
        let commas: number = 0;

        if (rest.typ === ValidationTokenEnum.Bracket) {
            commas = (rest as ValidationBracketToken).chi.filter((t) => t.typ === ValidationTokenEnum.Comma).length;
        }

        const matcher: string = `list(${sequence([rest as ValidationToken])}, ${match?.min?.val ?? 0}, ${bound(match?.max?.val)}, ${commas})`;

        return optional ? `opt(${matcher})` : matcher;
    }

    if (syntax.match != null) {
        const { match, ...rest } = syntax;
        const matcher: string = `occ(${sequence([rest as ValidationToken])}, ${match.min?.val ?? 0}, ${bound(match.max?.val)})`;

        return optional ? `opt(${matcher})` : matcher;
    }

    const matcher: string = base(syntax);

    switch (syntax.typ) {
        case ValidationTokenEnum.PropertyType:
            // the range is checked after the match: a value out of range fails, even when the syntax is optional
            return syntax.range == null ? (optional ? `opt(${matcher})` : matcher) : `rng(${matcher}, ${range(syntax)}, ${optional})`;

        // the syntaxes skipped when they do not match (see matchSyntax())
        case ValidationTokenEnum.Colon:
        case ValidationTokenEnum.Keyword:
        case ValidationTokenEnum.DeclarationType:
        case ValidationTokenEnum.StringToken:
        case ValidationTokenEnum.Bracket:
        case ValidationTokenEnum.Number:
        case ValidationTokenEnum.Dimension:
            return optional ? `opt(${matcher})` : matcher;
    }

    return matcher;
}

/**
 * an upper bound: Infinity when missing
 * @param value
 */
function bound(value: number | null | undefined): string {
    return value == null || !Number.isFinite(value) ? "Infinity" : String(value);
}

/**
 * the range of a numeric type: [min, max, unit]
 * @param syntax
 */
function range(syntax: ValidationToken): string {
    const range = syntax.range!;
    const min = range.min as ValidationNumberToken | ValidationDimensionToken | null;
    const max = range.max as ValidationNumberToken | ValidationDimensionToken | null;
    const unit: string | null =
        min != null && (min as ValidationToken).typ === ValidationTokenEnum.Dimension
            ? ((min as ValidationDimensionToken).unit as unknown as string)
            : null;

    // a bound that is not a number compares as NaN (see isInRange())
    const value = (token: ValidationNumberToken | ValidationDimensionToken): string =>
        typeof token.val === "number" ? String(token.val) : "NaN";

    return `[${min == null ? "-Infinity" : value(min)}, ${max == null ? "Infinity" : value(max)}, ${json(unit)}, ${min != null}]`;
}

/**
 * a reference to a definition
 * @param group
 * @param key
 */
function reference(group: Group, key: string): string {
    const found = resolve(group, key);

    if (found == null) {
        throw new Unresolved(group === "declarations" ? `'${key}'` : key);
    }

    return `ref(${indexOf(found.group, found.key)})`;
}

/**
 * a syntax without its multipliers
 * @param syntax
 */
function base(syntax: ValidationToken): string {
    switch (syntax.typ) {
        case ValidationTokenEnum.Keyword:
            return `kw(${json((syntax as ValidationToken & { val: string }).val.toLowerCase())})`;

        case ValidationTokenEnum.PipeToken: {
            const alternatives: ValidationToken[][] = (syntax as ValidationPipeToken).chi.map((alternative) =>
                alternative.filter((t) => t.typ !== ValidationTokenEnum.Whitespace),
            );

            // the alternatives are keywords: a set lookup
            if (
                alternatives.every(
                    (alternative) =>
                        alternative.length === 1 &&
                        alternative[0].typ === ValidationTokenEnum.Keyword &&
                        !alternative[0].isOptional &&
                        !alternative[0].isRepeatable &&
                        !alternative[0].isRepeatableAtLeastOnce &&
                        !alternative[0].isList &&
                        alternative[0].match == null &&
                        alternative[0].range == null,
                )
            ) {
                return `kws(${json(alternatives.map((alternative) => (alternative[0] as unknown as { val: string }).val.toLowerCase()))})`;
            }

            return `alt([${alternatives.map(sequence).join(", ")}])`;
        }

        case ValidationTokenEnum.Bracket:
            return sequence((syntax as ValidationBracketToken).chi);

        case ValidationTokenEnum.ColumnToken: {
            const operands: ValidationToken[][] = (syntax as ValidationColumnToken).chi;

            return `unordered([${operands.map(sequence).join(", ")}], ${json(operands.map((o) => Number(o.every(isNullable))))}, false)`;
        }

        case ValidationTokenEnum.AmpersandToken: {
            const operands: ValidationToken[][] = ampersandOperands(syntax as ValidationAmpersandToken);

            return `unordered([${operands.map(sequence).join(", ")}], ${json(operands.map((o) => Number(o.every(isNullable))))}, true)`;
        }

        case ValidationTokenEnum.PropertyType: {
            const name: string = (syntax as ValidationToken & { val: string }).val;

            if (builtinTypes.has(name)) {
                return `leaf(${json(name)})`;
            }

            return reference("syntaxes", name);
        }

        case ValidationTokenEnum.DeclarationType:
            return reference("declarations", (syntax as ValidationToken & { val: string }).val);

        case ValidationTokenEnum.Function:
            return `fn(${json((syntax as ValidationFunctionToken).val.toLowerCase())}, ${sequence((syntax as ValidationFunctionToken).chi)})`;

        case ValidationTokenEnum.FunctionDefinition: {
            const name: string = (syntax as ValidationToken & { val: string }).val;
            const found = resolve("syntaxes", name + "()");

            return `fndef(${json(name.toLowerCase())}, ${found == null ? "null" : `ref(${indexOf(found.group, found.key)})`})`;
        }

        case ValidationTokenEnum.Number:
            return `num(${(syntax as ValidationNumberToken).val}, null, null)`;

        case ValidationTokenEnum.Dimension:
            return `num(${(syntax as ValidationDimensionToken).val}, ${json((syntax as ValidationDimensionToken).unit)}, ${json((syntax as ValidationDimensionToken).unitText)})`;

        case ValidationTokenEnum.StringToken:
            return `str(${json((syntax as ValidationStringToken).val.slice(1, -1))})`;

        case ValidationTokenEnum.Comma:
            return "comma";

        case ValidationTokenEnum.Colon:
            return "colon";

        case ValidationTokenEnum.Separator:
            return "slash";

        case ValidationTokenEnum.OpenParenthesis:
            return "openParens";

        case ValidationTokenEnum.CloseParenthesis:
            return "closeParens";

        case ValidationTokenEnum.OpenCurlyBrace:
            return "openCurly";

        case ValidationTokenEnum.OptionalGroupToken: {
            const chi: ValidationToken[] = (syntax as ValidationOptionalGroupToken).chi;

            // `<bg-layer>#? , <final-bg-layer>`: `[ <bg-layer> , ]*` (see matchSyntax())
            if (chi.length === 1 && chi[0].isList) {
                const { isList, isOptional, match, ...item } = chi[0];

                return `optList(${sequence([item as ValidationToken, { typ: ValidationTokenEnum.Comma } as ValidationToken])})`;
            }

            return `optGroup(${sequence(chi)})`;
        }
    }

    throw new Unsupported(ValidationTokenEnum[syntax.typ]);
}

/**
 * the operands of chained ampersands, see ampersandOperands() in src/validation/match.ts
 * @param syntax
 * @param operands
 */
function ampersandOperands(syntax: ValidationAmpersandToken, operands: ValidationToken[][] = []): ValidationToken[][] {
    for (const side of [syntax.l, syntax.r]) {
        const tokens: ValidationToken[] = side.filter((token) => token.typ !== ValidationTokenEnum.Whitespace);

        if (
            tokens.length === 1 &&
            tokens[0].typ === ValidationTokenEnum.AmpersandToken &&
            !tokens[0].isOptional &&
            !tokens[0].isRepeatable &&
            !tokens[0].isRepeatableAtLeastOnce &&
            !tokens[0].isList &&
            tokens[0].match == null
        ) {
            ampersandOperands(tokens[0] as ValidationAmpersandToken, operands);
        } else {
            operands.push(side);
        }
    }

    return operands;
}

// the definitions are compiled in a stable order: the declarations, the functions and the types, sorted by name. the
// referenced definitions get their index on first reference
const groups: Group[] = ["declarations", "syntaxes", "types"];

for (const group of groups) {
    for (const key of Object.keys(config[group]).sort()) {
        if (config[group][key].alias == null) {
            indexOf(group, key);
        }
    }
}

for (let index = 0; index < keys.length; index++) {
    const name: string = keys[index];
    const group: Group = name.slice(0, name.indexOf("/")) as Group;
    const key: string = name.slice(name.indexOf("/") + 1);
    const syntax: string | undefined = config[group][key]?.syntax;
    let matcher: string;

    try {
        if (syntax == null) {
            throw new Unsupported("no syntax");
        }

        matcher = sequence(trimSyntaxArray(parseSyntax(syntax)));
    } catch (error) {
        if (error instanceof Unresolved) {
            (report.unresolved[error.type] ??= []).push(name);
        } else if (error instanceof Unsupported) {
            report.unsupported[name] = error.message;
        } else {
            throw error;
        }

        // validated by the interpreter
        matcher = "interpreted";
    }

    code.push(`    /* ${index} ${name.replace(/\*\//g, "*\\/")} */ () => ${matcher},`);
}

const source: string = `// generated by scripts/compile-syntax.ts from src/data/validation.json: do not edit, run \`npm run syntax-compile\`
/* eslint-disable */
import type { Matcher } from "./runtime.ts";
import {
    alt,
    closeParens,
    colon,
    comma,
    empty,
    fn,
    fndef,
    interpreted,
    kw,
    kws,
    leaf,
    list,
    num,
    occ,
    openCurly,
    openParens,
    opt,
    optGroup,
    optList,
    ref,
    rep,
    rng,
    seq,
    slash,
    str,
    unordered,
} from "./runtime.ts";

/**
 * the compiled definitions, \`group/name\`, by index
 */
export const keys: string[] = ${JSON.stringify(keys)};

/**
 * the matchers of the definitions, by index. a matcher is built the first time it is used
 */
export const builders: Array<() => Matcher> = [
${code.join("\n")}
];
`;

await writeFile(outputFile, source);

const sortedReport = {
    unresolved: Object.fromEntries(
        Object.entries(report.unresolved)
            .sort()
            .map(([type, names]) => [type, names.sort()]),
    ),
    unsupported: Object.fromEntries(Object.entries(report.unsupported).sort()),
};

await writeFile(reportFile, JSON.stringify(sortedReport, null, 1) + "\n");

const compiled: number = keys.length - Object.keys(report.unsupported).length - Object.values(report.unresolved).flat().length;

console.log(`>> ${compiled}/${keys.length} definitions compiled, see ${outputFile}`);

for (const [name, construct] of Object.entries(sortedReport.unsupported)) {
    console.error(`>> not compiled (unsupported ${construct}) >> ${name}`);
}

const errors: string[] = [];

for (const [type, names] of Object.entries(sortedReport.unresolved)) {
    const allowed: boolean = allowedUnresolved.has(type.replace(/^'|'$/g, ""));

    console.error(`>> ${allowed ? "unresolved" : "ERROR unresolved"} <${type}> >> ${names.join(", ")}`);

    if (!allowed) {
        errors.push(type);
    }
}

if (errors.length > 0) {
    console.error(
        `>> ${errors.length} unresolved type(s): a definition was renamed or removed upstream. define it in scripts/local-patch.json, or allow it in scripts/compile-syntax.ts`,
    );
    process.exit(1);
}
