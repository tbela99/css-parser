/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
import { EnumToken } from '../ast/types.js';
import { getSyntaxConfig, getParsedSyntax } from './config.js';
import { ValidationTokenEnum, ValidationSyntaxGroupEnum } from './parser/typedef.js';
import { tokensfuncDefMap, isFunctionDefType, isFunctionType, funcLike } from '../syntax/constants.js';
import { equalsIgnoreCase, lowercase } from '../parser/utils/text.js';

/**
 * the syntaxes that may match no token, see {@link isNullable}
 */
const nullableSyntaxes = new WeakMap();
/**
 * true if the syntax may match no token: `<a>?`, `<a>*`, `[ <a>? <b>? ]`, `[ [ and <a> ]* | [ or <a> ]* ]`
 * @param syntax
 */
function isNullable(syntax) {
    if (syntax.typ === ValidationTokenEnum.Whitespace) {
        return true;
    }
    // `[ <a>? <b>? ]!`: at least one token
    if (syntax.isMandatatoryGroup) {
        return false;
    }
    if (syntax.isOptional || syntax.isRepeatable || syntax.match?.min?.val === 0) {
        return true;
    }
    let nullable = nullableSyntaxes.get(syntax);
    if (nullable == null) {
        switch (syntax.typ) {
            case ValidationTokenEnum.Bracket:
                nullable = syntax.chi.every(isNullable);
                break;
            case ValidationTokenEnum.PipeToken:
                nullable = syntax.chi.some((syntaxes) => syntaxes.every(isNullable));
                break;
            case ValidationTokenEnum.AmpersandToken:
                nullable =
                    syntax.l.every(isNullable) &&
                        syntax.r.every(isNullable);
                break;
            default:
                nullable = false;
        }
        nullableSyntaxes.set(syntax, nullable);
    }
    return nullable;
}
/**
 * the types of the function tokens (`name(`, `name(...)`): the types whose name is a key of the sets
 */
const functionTokenTypes = new Set();
/**
 * the types of the function definition tokens (`name(` followed by the arguments and `)`)
 */
const functionDefTypes = [];
/**
 * the function types accepted by the `Function` syntaxes of the matcher (see `funcTypes` in match.ts)
 */
const funcTypes = [
    ...tokensfuncDefMap.values(),
    EnumToken.FunctionTokenType,
    EnumToken.PseudoClassFuncTokenType,
];
for (const value of Object.values(EnumToken)) {
    if (typeof value !== "number") {
        continue;
    }
    if (isFunctionDefType(value)) {
        functionDefTypes.push(value);
    }
    if (isFunctionDefType(value) || isFunctionType(value) || funcLike.includes(value) || funcTypes.includes(value)) {
        functionTokenTypes.add(value);
    }
}
/**
 * the types of the tokens accepted by the built-in types of the matcher (`matchProperty()`). the built-in types that
 * are not listed accept any token (complex checks: `<declaration-value>`, `<an+b>`, the selectors, the media features,
 * ...).
 * the css wide keywords, which are accepted by the built-in types, are not looked up
 */
const builtinTypes = new Map([
    ["dashed-ident", [EnumToken.DashedIdenTokenType]],
    ["extension-name", [EnumToken.DashedIdenTokenType]],
    ["custom-property-name", [EnumToken.DashedIdenTokenType]],
    ["namespace-prefix", [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType]],
    ["ident", [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType]],
    ["ident-token", [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType]],
    ["custom-ident", [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType]],
    ["counter-name", [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType]],
    ["counter-style-name", [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType]],
    ["unicode-range-token", [EnumToken.UniCodeRange]],
    ["hash-token", [EnumToken.HashTokenType, EnumToken.ColorTokenType]],
    ["string", [EnumToken.StringTokenType]],
    ["wq-name", [EnumToken.IdenTokenType]],
    ["number", [EnumToken.NumberTokenType]],
    ["zero", [EnumToken.NumberTokenType]],
    ["integer", [EnumToken.NumberTokenType]],
    [
        "dimension",
        [
            EnumToken.DimensionTokenType,
            EnumToken.AngleTokenType,
            EnumToken.LengthTokenType,
            EnumToken.PercentageTokenType,
            EnumToken.ResolutionTokenType,
            EnumToken.TimeTokenType,
            EnumToken.FrequencyTokenType,
            EnumToken.UserDefinedDimensionTokenType,
            EnumToken.FlexTokenType,
        ],
    ],
    ["angle", [EnumToken.AngleTokenType, EnumToken.UserDefinedDimensionTokenType]],
    [
        "angle-percentage",
        [EnumToken.AngleTokenType, EnumToken.UserDefinedDimensionTokenType, EnumToken.PercentageTokenType],
    ],
    ["percentage", [EnumToken.PercentageTokenType]],
    [
        "length-percentage",
        [
            EnumToken.PercentageTokenType,
            EnumToken.LengthTokenType,
            EnumToken.UserDefinedDimensionTokenType,
            EnumToken.NumberTokenType,
        ],
    ],
    ["flex", [EnumToken.FlexTokenType, EnumToken.UserDefinedDimensionTokenType]],
    ["length", [EnumToken.LengthTokenType, EnumToken.UserDefinedDimensionTokenType, EnumToken.NumberTokenType]],
    ["resolution", [EnumToken.ResolutionTokenType]],
    ["frequency", [EnumToken.FrequencyTokenType]],
    ["decibel", [EnumToken.DimensionTokenType]],
    ["semitones", [EnumToken.DimensionTokenType]],
    ["time", [EnumToken.TimeTokenType, EnumToken.UserDefinedDimensionTokenType]],
    ["quote", [EnumToken.IdenTokenType]],
    ["display-box", [EnumToken.IdenTokenType]],
    ["display-inside", [EnumToken.IdenTokenType]],
    ["display-internal", [EnumToken.IdenTokenType]],
    ["display-outside", [EnumToken.IdenTokenType]],
    ["display-legacy", [EnumToken.IdenTokenType]],
    ["content-position", [EnumToken.IdenTokenType]],
    ["mf-name", [EnumToken.IdenTokenType]],
    ["language-code", [EnumToken.IdenTokenType]],
    ["url", [EnumToken.UrlFunctionTokenDefType, EnumToken.UrlFunctionTokenType]],
    // `isColor()`: the color tokens, the color names and the color functions
    ["color", [EnumToken.ColorTokenType, EnumToken.IdenTokenType, EnumToken.FunctionTokenType, ...functionDefTypes]],
    [
        "color-function",
        [EnumToken.ColorTokenType, EnumToken.IdenTokenType, EnumToken.FunctionTokenType, ...functionDefTypes],
    ],
    ["function-token", functionDefTypes],
    ["dashed-function", [EnumToken.CustomFunctionTokenDefType, EnumToken.CustomFunctionTokenType]],
    ["block-contents", [EnumToken.StartParensTokenType]],
    ["css-type", [EnumToken.FunctionTokenDefType, EnumToken.FunctionTokenType, EnumToken.CssTypeTokenType]],
    // any token
    ["declaration-value", null],
    ["calc-sum", null],
    ["an+b", null],
    ["any-value", null],
    ["type-selector", null],
    ["compound-selector", null],
    ["complex-selector", null],
    ["subclass-selector", null],
    ["attribute-selector", null],
    ["complex-selector-unit", null],
    ["pseudo-compound-selector", null],
    ["forgiving-relative-selector-list", null],
    ["complex-selector-list", null],
    ["size-feature", null],
    ["style-feature", null],
]);
/**
 * a set that accepts any token
 */
const anyToken = Object.freeze({
    any: true,
    nullable: true,
    types: new Set(),
    keywords: new Set(),
    functions: new Set(),
});
/**
 * first token sets of the syntax tokens
 */
const tokenSets = new WeakMap();
/**
 * first token sets of the syntax sequences
 */
const sequenceSets = new WeakMap();
/**
 * the sequences whose set is being computed: a cyclic reference accepts any token
 */
const computing = new Set();
/**
 * an empty set
 */
function createSet() {
    return {
        any: false,
        nullable: false,
        types: new Set(),
        keywords: new Set(),
        functions: new Set(),
    };
}
/**
 * add the tokens of a set to another set
 * @param target
 * @param source
 */
function merge(target, source) {
    target.any ||= source.any;
    for (const type of source.types) {
        target.types.add(type);
    }
    for (const keyword of source.keywords) {
        target.keywords.add(keyword);
    }
    for (const name of source.functions) {
        target.functions.add(name);
    }
}
/**
 * first tokens of a sequence of syntaxes: the first tokens of its syntaxes until a syntax that must match a token
 * @param syntaxes
 */
function firstOfSequence(syntaxes) {
    if (syntaxes == null) {
        // no syntax: the matcher accepts the value
        return anyToken;
    }
    let set = sequenceSets.get(syntaxes);
    if (set !== undefined) {
        return set;
    }
    if (computing.has(syntaxes)) {
        return anyToken;
    }
    computing.add(syntaxes);
    try {
        set = createSet();
        set.nullable = true;
        for (const syntax of syntaxes) {
            const first = firstOf(syntax);
            merge(set, first);
            if (set.any || !first.nullable) {
                set.nullable = false;
                break;
            }
        }
        if (set.any) {
            set = anyToken;
        }
    }
    finally {
        computing.delete(syntaxes);
    }
    sequenceSets.set(syntaxes, set);
    return set;
}
/**
 * first tokens of a syntax token
 * @param syntax
 */
function firstOf(syntax) {
    let set = tokenSets.get(syntax);
    if (set !== undefined) {
        return set;
    }
    set = createSet();
    // the syntax may match no token through its content: an empty alternative (`| -moz-center`), a reference to a
    // syntax that may match no token, ...
    let nullable = false;
    let first;
    switch (syntax.typ) {
        case ValidationTokenEnum.Whitespace:
            nullable = true;
            break;
        case ValidationTokenEnum.Keyword:
            set.keywords.add(lowercase(syntax.val));
            break;
        case ValidationTokenEnum.Comma:
            set.types.add(EnumToken.CommaTokenType);
            break;
        case ValidationTokenEnum.Colon:
            set.types.add(EnumToken.ColonTokenType);
            break;
        case ValidationTokenEnum.Separator:
            set.types.add(EnumToken.LiteralTokenType);
            break;
        case ValidationTokenEnum.OpenParenthesis:
            set.types.add(EnumToken.StartParensTokenType);
            break;
        case ValidationTokenEnum.CloseParenthesis:
            set.types.add(EnumToken.EndParensTokenType);
            break;
        case ValidationTokenEnum.OpenCurlyBrace:
            set.types.add(EnumToken.BlockStartTokenType);
            break;
        case ValidationTokenEnum.Number:
            set.types.add(EnumToken.NumberTokenType);
            break;
        case ValidationTokenEnum.Dimension:
            set.types.add(EnumToken[syntax.unit]);
            break;
        case ValidationTokenEnum.StringToken:
            // `'+'`, `'-'`, `'/'`
            set.types.add(EnumToken.Add);
            set.types.add(EnumToken.Sub);
            set.types.add(EnumToken.LiteralTokenType);
            set.types.add(EnumToken.Plus);
            break;
        case ValidationTokenEnum.Function:
        case ValidationTokenEnum.FunctionDefinition:
            set.functions.add(lowercase(syntax.val));
            break;
        case ValidationTokenEnum.Bracket:
            first = firstOfSequence(syntax.chi);
            merge(set, first);
            nullable = first.nullable;
            break;
        case ValidationTokenEnum.OptionalGroupToken:
            // the group is skipped when it does not match
            merge(set, firstOfSequence(syntax.chi));
            nullable = true;
            break;
        case ValidationTokenEnum.PipeToken:
            for (const syntaxes of syntax.chi) {
                first = firstOfSequence(syntaxes);
                merge(set, first);
                nullable ||= first.nullable;
            }
            break;
        case ValidationTokenEnum.ColumnToken:
            // one or more operands, in any order: at least one token
            for (const syntaxes of syntax.chi) {
                merge(set, firstOfSequence(syntaxes));
            }
            break;
        case ValidationTokenEnum.AmpersandToken:
            // all the operands, in any order
            nullable = true;
            for (const syntaxes of [syntax.l, syntax.r]) {
                first = firstOfSequence(syntaxes);
                merge(set, first);
                nullable &&= first.nullable;
            }
            break;
        case ValidationTokenEnum.DeclarationType:
            first = firstOfSequence(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, syntax.val));
            merge(set, first);
            nullable = first.nullable;
            break;
        case ValidationTokenEnum.PropertyType: {
            const name = syntax.val;
            if (builtinTypes.has(name)) {
                const types = builtinTypes.get(name);
                if (types == null) {
                    set.any = true;
                    nullable = true;
                }
                else {
                    for (const type of types) {
                        set.types.add(type);
                    }
                }
            }
            else {
                first = firstOfSequence(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, name));
                merge(set, first);
                nullable = first.nullable;
            }
            break;
        }
        default:
            set.any = true;
            nullable = true;
    }
    // the syntaxes that may match no token: `<a>?`, `<a>*`, `<a>{0,2}`, `[ <a>? ]`, ...
    set.nullable =
        nullable ||
            syntax.isOptional === true ||
            syntax.isRepeatable === true ||
            syntax.match?.min?.val === 0 ||
            isNullable(syntax);
    tokenSets.set(syntax, set);
    return set;
}
/**
 * the css wide keywords, accepted by every syntax
 */
const cssWideKeywords = getSyntaxConfig().declarations.all.syntax.split(/[\s|]+/g);
/**
 * the token may match a syntax that does not accept its type (`var()`, `env()`, `attr()`, the custom function calls,
 * the math functions, the css wide keywords, ...): the first token sets do not apply
 * @param arena
 * @param token
 * @param typ
 */
function matchesAnySyntax(arena, token, typ) {
    switch (typ) {
        case EnumToken.WildCardFunctionTokenType:
        case EnumToken.WildCardFunctionTokenDefType:
        case EnumToken.MathFunctionTokenType:
        case EnumToken.MathFunctionTokenDefType:
        // a custom function call is substituted by its result, like var()
        case EnumToken.CustomFunctionTokenType:
        case EnumToken.CustomFunctionTokenDefType:
            return true;
        case EnumToken.IdenTokenType: {
            const value = arena.resolveString(arena.stringValue[token]);
            for (let i = 0; i < cssWideKeywords.length; i++) {
                if (equalsIgnoreCase(cssWideKeywords[i], value)) {
                    return true;
                }
            }
        }
    }
    return false;
}
/**
 * true if a set may start with a token
 * @param set
 * @param typ token type
 * @param name lowercase name of an identifier or of a function, null for the other tokens
 */
function accepts(set, typ, name) {
    if (set.any || set.types.has(typ)) {
        return true;
    }
    if (name === null) {
        return false;
    }
    return typ === EnumToken.IdenTokenType ? set.keywords.has(name) : set.functions.has(name);
}
/**
 * lowercase name of an identifier or of a function token, null for the other tokens
 * @param arena
 * @param token
 * @param typ
 */
function tokenName(arena, token, typ) {
    return typ === EnumToken.IdenTokenType || functionTokenTypes.has(typ)
        ? arena.resolveString(arena.lowerStringId(arena.stringValue[token]))
        : null;
}
/**
 * maximum number of named lookups memoized by an index
 */
const MAX_NAMES = 512;
/**
 * the alternatives of a syntax indexed by their first tokens
 */
class AlternativeIndex {
    /**
     * first tokens of each alternative
     */
    sets;
    /**
     * the alternatives cannot be filtered: all of them accept any token
     */
    filtered;
    /**
     * the alternatives that may start with a token, by token type (the tokens without a name)
     */
    byType = new Map();
    /**
     * the alternatives that may start with an identifier or a function, by token type and by name
     */
    byName = new Map();
    /**
     * number of memoized named lookups
     */
    names = 0;
    constructor(alternatives) {
        this.sets = alternatives.map((syntaxes) => firstOfSequence(syntaxes));
        this.filtered = this.sets.some((set) => !set.any && !set.nullable);
    }
    /**
     * the indexes of the alternatives that may match a token, in order. null when all the alternatives may match
     * @param typ
     * @param name
     */
    lookup(typ, name) {
        if (name === null) {
            let result = this.byType.get(typ);
            if (result === undefined) {
                result = this.compute(typ, null);
                this.byType.set(typ, result);
            }
            return result;
        }
        let names = this.byName.get(typ);
        if (names === undefined) {
            names = new Map();
            this.byName.set(typ, names);
        }
        let result = names.get(name);
        if (result === undefined) {
            result = this.compute(typ, name);
            if (this.names < MAX_NAMES) {
                this.names++;
                names.set(name, result);
            }
        }
        return result;
    }
    /**
     * the alternatives that may match a token. null when all the alternatives may match
     * @param typ
     * @param name
     */
    compute(typ, name) {
        const result = [];
        for (let i = 0; i < this.sets.length; i++) {
            if (this.sets[i].nullable || accepts(this.sets[i], typ, name)) {
                result.push(i);
            }
        }
        return result.length === this.sets.length ? null : result;
    }
}
/**
 * the indexes of the alternatives, by list of alternatives (`ValidationPipeToken.chi`: the lists are shared by the
 * copies of the syntax tokens)
 */
const alternativeIndexes = new WeakMap();
/**
 * the alternatives of a syntax (`<a> | <b> | <c>`) that may match the first token of a value, in order. the other
 * alternatives cannot match the value. null when all the alternatives may match
 * @param arena
 * @param alternatives
 * @param token the first token of the value
 */
function matchingAlternatives(arena, alternatives, token) {
    let index = alternativeIndexes.get(alternatives);
    if (index === undefined) {
        index = new AlternativeIndex(alternatives);
        alternativeIndexes.set(alternatives, index);
    }
    if (!index.filtered || token == null) {
        return null;
    }
    const typ = arena.dataTypes[token];
    if (matchesAnySyntax(arena, token, typ)) {
        return null;
    }
    return index.lookup(typ, tokenName(arena, token, typ));
}
/**
 * true if a sequence of syntaxes may match tokens starting with a token. a sequence that does not accept the token
 * matches no token
 * @param arena
 * @param syntaxes
 * @param token
 */
function mayStartWith(arena, syntaxes, token) {
    if (token == null) {
        return true;
    }
    const set = firstOfSequence(syntaxes);
    if (set.any) {
        return true;
    }
    const typ = arena.dataTypes[token];
    return matchesAnySyntax(arena, token, typ) || accepts(set, typ, tokenName(arena, token, typ));
}

export { isNullable, matchingAlternatives, mayStartWith };
