import type { ParserOptions, Token } from "../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { lowercase } from "../../parser/utils/text.ts";
import { funcLike, isFunctionDefType, isFunctionType } from "../../syntax/constants.ts";
import { ValidationTokenEnum } from "../parser/typedef.ts";
import type { ValidationPropertyToken } from "../parser/types.d.ts";
import { funcTypes, isCssWideKeyword, matchProperty, ValidationTokenContext } from "../match.ts";
import { builders, keys } from "./syntaxes.ts";
import { rawTypes } from "./builtins.ts";

/**
 * the compiled matchers (see scripts/compile-syntax.ts). a matcher matches the tokens of a value from a position and
 * returns the position after the matched tokens, or {@link FAIL}. the positions are indexes in the significant tokens
 * of the value (the whitespace and the comments are skipped, like the interpreter does). a matcher throws
 * {@link BAIL} when the value must be validated by the interpreter (a construct it does not handle)
 *
 * a compiled matcher mirrors the syntax tree matched by the interpreter (src/validation/match.ts). its "valid" answer
 * is final, its "invalid" answer is not: the interpreter validates the value again and reports the errors
 */
export type Matcher = (c: MatchContext, p: number) => number;

/**
 * the value being matched
 */
export interface MatchContext {
    arena: AstArena;
    /**
     * the significant tokens of the value
     */
    toks: Token[];
    /**
     * the end of the tokens being matched: the items of a list are matched up to the next comma
     */
    len: number;
    options: ParserOptions;
    /**
     * the depth of the references being matched, see {@link ref}
     */
    depth: number;
    /**
     * the context passed to matchProperty(), see {@link leafContext}
     */
    leaf: ValidationTokenContext | null;
    leafLen: number;
}

export const FAIL: number = -1;

/**
 * thrown when the value must be validated by the interpreter
 */
export const BAIL: object = Object.freeze({ bail: true });

/**
 * the maximum depth of the references being matched: deeper, the interpreter validates the value
 */
const maxDepth: number = 256;

/**
 * the matchers of the definitions, by index (see {@link builders})
 */
const matchers: Array<Matcher | undefined> = [];

/**
 * the matcher of a definition, built once
 * @param index
 */
function definition(index: number): Matcher {
    return (matchers[index] ??= builders[index]());
}

/**
 * a reference to a definition: the matcher is built when it is first matched
 * @param index
 */
export function ref(index: number): Matcher {
    let matcher: Matcher | null = null;

    return (c: MatchContext, p: number): number => {
        if (++c.depth > maxDepth) {
            throw BAIL;
        }

        const result: number = (matcher ??= definition(index))(c, p);

        c.depth--;
        return result;
    };
}

/**
 * a definition the compiler could not compile: the interpreter validates it
 */
export const interpreted: Matcher = (): number => {
    throw BAIL;
};

/**
 * an empty syntax
 */
export const empty: Matcher = (_c: MatchContext, p: number): number => p;

/**
 * a sequence of syntaxes. the remaining syntaxes must be nullable when the tokens are consumed
 * @param items
 * @param nullable nullable[i]: the syntaxes from i are nullable
 */
export function seq(items: Matcher[], nullable: number[]): Matcher {
    const length: number = items.length;

    if (length === 1) {
        const item: Matcher = items[0];
        const optional: boolean = nullable[0] === 1;

        return (c: MatchContext, p: number): number => (p >= c.len ? (optional ? p : FAIL) : item(c, p));
    }

    return (c: MatchContext, p: number): number => {
        for (let i = 0; i < length; i++) {
            if (p >= c.len) {
                return nullable[i] === 1 ? p : FAIL;
            }

            p = items[i](c, p);

            if (p < 0) {
                return FAIL;
            }
        }

        return p;
    };
}

/**
 * alternatives: the alternative that matches the most tokens
 * @param alternatives
 */
export function alt(alternatives: Matcher[]): Matcher {
    const length: number = alternatives.length;

    return (c: MatchContext, p: number): number => {
        let best: number = FAIL;

        for (let i = 0; i < length; i++) {
            const result: number = alternatives[i](c, p);

            if (result > best) {
                best = result;

                if (result >= c.len) {
                    break;
                }
            }
        }

        return best;
    };
}

/**
 * the lowercase value of an ident token, null for another token
 * @param c
 * @param token
 */
function identValue(c: MatchContext, token: Token): string | null {
    return c.arena.dataTypes[token] === EnumToken.IdenTokenType
        ? lowercase(c.arena.resolveString(c.arena.stringValue[token]))
        : null;
}

/**
 * a keyword, ignoring the case
 * @param value the lowercase keyword
 */
export function kw(value: string): Matcher {
    return (c: MatchContext, p: number): number => (identValue(c, c.toks[p]) === value ? p + 1 : FAIL);
}

/**
 * alternative keywords, ignoring the case
 * @param values the lowercase keywords
 */
export function kws(values: string[]): Matcher {
    const set: Set<string> = new Set(values);

    return (c: MatchContext, p: number): number => {
        const value: string | null = identValue(c, c.toks[p]);

        return value !== null && set.has(value) ? p + 1 : FAIL;
    };
}

/**
 * an optional syntax: skipped when it does not match
 * @param matcher
 */
export function opt(matcher: Matcher): Matcher {
    return (c: MatchContext, p: number): number => {
        const result: number = matcher(c, p);

        return result < 0 ? p : result;
    };
}

/**
 * a repeated syntax: `*` (zero or more) or `+` (one or more), see matchRepeatableSyntax()
 * @param item
 * @param zero zero matches are allowed
 */
export function rep(item: Matcher, zero: boolean): Matcher {
    return (c: MatchContext, p: number): number => {
        let matched: boolean = false;

        while (true) {
            const result: number = item(c, p);

            if (result < 0) {
                break;
            }

            matched = true;

            if (result >= c.len) {
                p = c.len;
                break;
            }

            // no token matched
            if (result === p) {
                break;
            }

            p = result;
        }

        return matched || zero ? p : FAIL;
    };
}

/**
 * a syntax repeated from min to max times: `{2}`, `{1,4}`, see matchOccurenceSyntax()
 * @param item
 * @param min
 * @param max
 */
export function occ(item: Matcher, min: number, max: number): Matcher {
    return (c: MatchContext, p: number): number => {
        let count: number = 0;

        do {
            const result: number = item(c, p);

            if (result < 0) {
                break;
            }

            count++;

            if (result >= c.len) {
                p = c.len;
                break;
            }

            if (result === p) {
                break;
            }

            p = result;

            if (count === max) {
                break;
            }
        } while (p < c.len);

        return count === 0 || count < min || count > max ? FAIL : p;
    };
}

/**
 * the end of a comma separated item: the position of the comma that follows the item (the items may contain commas)
 * @param c
 * @param p
 * @param commas the number of commas of an item
 */
function itemEnd(c: MatchContext, p: number, commas: number): number {
    let depth: number = 0;

    for (let i = p; i < c.len; i++) {
        const type: EnumToken = c.arena.dataTypes[c.toks[i]];

        if (type === EnumToken.StartParensTokenType || isFunctionDefType(type)) {
            depth++;
        } else if (type === EnumToken.EndParensTokenType) {
            depth--;
        } else if (depth === 0 && type === EnumToken.CommaTokenType && commas-- === 0) {
            return i;
        }
    }

    return c.len;
}

/**
 * a comma separated list: `#`, `#{1,4}`, see matchListSyntax(). an item is matched up to the next comma
 * @param item
 * @param min
 * @param max
 * @param commas the number of commas of an item
 */
export function list(item: Matcher, min: number, max: number, commas: number): Matcher {
    return (c: MatchContext, p: number): number => {
        const len: number = c.len;
        let count: number = 0;

        while (true) {
            const end: number = itemEnd(c, p, commas);

            // BAIL aborts the whole match: the length is not restored
            c.len = end;

            const result: number = item(c, p);

            c.len = len;

            if (result < 0) {
                break;
            }

            // the item does not match the tokens before the comma: the list ends with this item
            if (result < end) {
                if (result > p) {
                    count++;
                    p = result;
                }

                break;
            }

            count++;

            if (count === max) {
                p = end;
                break;
            }

            // the comma
            p = end < len ? end + 1 : end;

            if (p >= len) {
                break;
            }
        }

        return count === 0 || count < min ? FAIL : p;
    };
}

/**
 * the context passed to matchProperty(): the significant tokens, up to the end of the tokens being matched
 * @param c
 * @param p
 */
function leafContext(c: MatchContext, p: number): ValidationTokenContext {
    if (c.leaf === null || c.leafLen !== c.len) {
        c.leaf = new ValidationTokenContext(c.arena, c.len === c.toks.length ? c.toks : c.toks.slice(0, c.len), p - 1);
        c.leafLen = c.len;
    } else {
        c.leaf.index = p - 1;
    }

    return c.leaf;
}

/**
 * the token types matched by the numeric types without calc() and the css wide keywords: the matchers of these types
 * do not call matchProperty() for the other tokens (see {@link leaf})
 */
const numericTypes: Record<string, (c: MatchContext, token: Token, type: EnumToken) => boolean> = {
    number: (_c, _t, type) => type === EnumToken.NumberTokenType,
    integer: (c, t, type) => type === EnumToken.NumberTokenType && Number.isInteger(Number(c.arena.numericValue[t])),
    zero: (c, t, type) => type === EnumToken.NumberTokenType && c.arena.numericValue[t] === 0,
    length: (c, t, type) =>
        type === EnumToken.LengthTokenType ||
        type === EnumToken.UserDefinedDimensionTokenType ||
        (type === EnumToken.NumberTokenType && c.arena.numericValue[t] === 0),
    percentage: (_c, _t, type) => type === EnumToken.PercentageTokenType,
    "length-percentage": (c, t, type) =>
        type === EnumToken.PercentageTokenType ||
        type === EnumToken.LengthTokenType ||
        type === EnumToken.UserDefinedDimensionTokenType ||
        (type === EnumToken.NumberTokenType && c.arena.numericValue[t] === 0),
    angle: (_c, _t, type) => type === EnumToken.AngleTokenType || type === EnumToken.UserDefinedDimensionTokenType,
    "angle-percentage": (_c, _t, type) =>
        type === EnumToken.AngleTokenType ||
        type === EnumToken.UserDefinedDimensionTokenType ||
        type === EnumToken.PercentageTokenType,
    time: (_c, _t, type) => type === EnumToken.TimeTokenType || type === EnumToken.UserDefinedDimensionTokenType,
    flex: (_c, _t, type) => type === EnumToken.FlexTokenType || type === EnumToken.UserDefinedDimensionTokenType,
    resolution: (_c, _t, type) => type === EnumToken.ResolutionTokenType,
    frequency: (_c, _t, type) => type === EnumToken.FrequencyTokenType,
    string: (_c, _t, type) => type === EnumToken.StringTokenType,
    "dashed-ident": (_c, _t, type) => type === EnumToken.DashedIdenTokenType,
    "custom-property-name": (_c, _t, type) => type === EnumToken.DashedIdenTokenType,
};

/**
 * a type validated by matchProperty(): the numeric types are matched here when the token is neither an ident (a css
 * wide keyword is accepted by the types) nor a math function (calc())
 * @param name
 */
export function leaf(name: string): Matcher {
    if (rawTypes.has(name)) {
        return interpreted;
    }

    const property: ValidationPropertyToken = {
        typ: ValidationTokenEnum.PropertyType,
        val: name,
    } as ValidationPropertyToken;
    const fast = numericTypes[name] ?? null;

    return (c: MatchContext, p: number): number => {
        const token: Token = c.toks[p];
        const type: EnumToken = c.arena.dataTypes[token];

        if (
            fast !== null &&
            type !== EnumToken.IdenTokenType &&
            type !== EnumToken.MathFunctionTokenType &&
            type !== EnumToken.MathFunctionTokenDefType
        ) {
            return fast(c, token, type) ? p + 1 : FAIL;
        }

        const context: ValidationTokenContext = leafContext(c, p);
        const result = matchProperty(c.arena, property, context, c.options);

        if (!result.success) {
            return FAIL;
        }

        return context.index >= c.len ? c.len : context.index + 1;
    };
}

/**
 * see isInRange() in src/validation/match.ts
 * @param c
 * @param token
 * @param min
 * @param max
 * @param unit the unit of a dimension range, its token type
 */
function inRange(c: MatchContext, token: Token, min: number, max: number, unit: string | null): boolean {
    const type: EnumToken = c.arena.dataTypes[token];

    if (
        type === EnumToken.MathFunctionTokenType ||
        type === EnumToken.MathFunctionTokenDefType ||
        type === EnumToken.WildCardFunctionTokenType ||
        type === EnumToken.WildCardFunctionTokenDefType
    ) {
        return true;
    }

    let success: boolean = !c.arena.hasFraction(token) && (c.arena.numericValue[token] as number) >= min;

    if (unit !== null) {
        success = type === (EnumToken as unknown as Record<string, EnumToken>)[unit];
    }

    return success && (c.arena.numericValue[token] as number) <= max;
}

/**
 * a type with a range: `<integer [1,∞]>`. the range of the first token is checked after the match, a value out of the
 * range fails even if the type is optional
 * @param matcher
 * @param bounds [min, max, unit, has min]
 * @param optional
 */
export function rng(matcher: Matcher, bounds: [number, number, string | null, boolean], optional: boolean): Matcher {
    const [min, max, unit] = bounds;

    return (c: MatchContext, p: number): number => {
        const result: number = matcher(c, p);

        if (result < 0) {
            return optional ? p : FAIL;
        }

        return inRange(c, c.toks[p], min, max, unit) ? result : FAIL;
    };
}

/**
 * the significant tokens of a list of tokens: the whitespace and the comments are skipped, a trailing `!important` is
 * removed (see createValidationContext())
 * @param arena
 * @param tokens
 * @param result
 */
function significantTokens(arena: AstArena, tokens: Token[], result: Token[]): Token[] {
    for (let i = 0; i < tokens.length; i++) {
        const type: EnumToken = arena.dataTypes[tokens[i]];

        if (
            type !== EnumToken.WhitespaceTokenType &&
            type !== EnumToken.CommentTokenType &&
            type !== EnumToken.CDOCOMMTokenType
        ) {
            result.push(tokens[i]);
        }
    }

    if (result.length > 0 && arena.dataTypes[result[result.length - 1]] === EnumToken.ImportantTokenType) {
        result.pop();
    }

    return result;
}

/**
 * the position of the parenthesis that closes the function at a position: the arguments of a function are not nested
 * in the tokens being validated, they follow the function token (see peekRange()). -1 if the function is not closed
 * @param c
 * @param p
 */
function closingParens(c: MatchContext, p: number): number {
    let depth: number = 0;

    for (let i = p; i < c.len; i++) {
        const type: EnumToken = c.arena.dataTypes[c.toks[i]];

        if (type === EnumToken.StartParensTokenType || isFunctionDefType(type)) {
            depth++;
        } else if (type === EnumToken.EndParensTokenType && --depth === 0) {
            return i;
        }
    }

    return -1;
}

/**
 * match the arguments of a function, from p to end (excluded)
 * @param c
 * @param matcher
 * @param p
 * @param end
 * @returns true if the matcher matches all the tokens
 */
function matchRange(c: MatchContext, matcher: Matcher, p: number, end: number): boolean {
    const len: number = c.len;

    // BAIL aborts the whole match: the length is not restored
    c.len = end;

    const result: number = matcher(c, p);

    c.len = len;

    return result === end;
}

/**
 * a function and its arguments: `rgb( ... )`
 * @param name the lowercase function name
 * @param args
 */
export function fn(name: string, args: Matcher): Matcher {
    return (c: MatchContext, p: number): number => {
        const token: Token = c.toks[p];
        const type: EnumToken = c.arena.dataTypes[token];

        if (
            (!isFunctionDefType(type) && !funcLike.includes(type) && !funcTypes.includes(type)) ||
            lowercase(c.arena.resolveString(c.arena.stringValue[token])) !== name
        ) {
            return FAIL;
        }

        if (isFunctionDefType(type)) {
            const close: number = closingParens(c, p);

            return close !== -1 && matchRange(c, args, p + 1, close) ? close + 1 : FAIL;
        }

        const toks: Token[] = significantTokens(c.arena, c.arena.tokens(token), []);
        const sub: MatchContext = {
            arena: c.arena,
            toks,
            len: toks.length,
            options: c.options,
            depth: c.depth,
            leaf: null,
            leafLen: -1,
        };

        return args(sub, 0) === toks.length ? p + 1 : FAIL;
    };
}

/**
 * a function definition: `<rgb()>`
 * @param name the lowercase function name
 * @param syntax the matcher of the function syntax (`rgb()`), null when it is not defined
 */
export function fndef(name: string, syntax: Matcher | null): Matcher {
    return (c: MatchContext, p: number): number => {
        const token: Token = c.toks[p];
        const type: EnumToken = c.arena.dataTypes[token];

        if (syntax === null || lowercase(c.arena.resolveString(c.arena.stringValue[token])) !== name) {
            return FAIL;
        }

        if (isFunctionDefType(type)) {
            const close: number = closingParens(c, p);

            return close !== -1 && matchRange(c, syntax, p, close + 1) ? close + 1 : FAIL;
        }

        if (!isFunctionType(type)) {
            return FAIL;
        }

        const sub: MatchContext = {
            arena: c.arena,
            toks: [token],
            len: 1,
            options: c.options,
            depth: c.depth,
            leaf: null,
            leafLen: -1,
        };

        return syntax(sub, 0) === 1 ? p + 1 : FAIL;
    };
}

/**
 * a literal number or dimension: `0`, `90deg`, see isLiteralNumber()
 * @param value
 * @param unit the token type of a dimension
 * @param unitText the unit of a dimension
 */
export function num(value: number, unit: string | null, unitText: string | null): Matcher {
    const unitType: EnumToken | null =
        unit === null ? null : (EnumToken as unknown as Record<string, EnumToken>)[unit];
    const lowerUnit: string | null = unitText === null ? null : unitText.toLowerCase();

    return (c: MatchContext, p: number): number => {
        const token: Token = c.toks[p];

        if (c.arena.hasFraction(token) || c.arena.numericValue[token] !== value) {
            return FAIL;
        }

        if (unitType === null) {
            return c.arena.dataTypes[token] === EnumToken.NumberTokenType ? p + 1 : FAIL;
        }

        return c.arena.dataTypes[token] === unitType &&
            c.arena.resolveString(c.arena.unit[token]).toLowerCase() === lowerUnit
            ? p + 1
            : FAIL;
    };
}

/**
 * a quoted literal: `'+'`, `'/'`
 * @param value
 */
export function str(value: string): Matcher {
    return (c: MatchContext, p: number): number => {
        const token: Token = c.toks[p];

        switch (c.arena.dataTypes[token]) {
            case EnumToken.Add:
                return value === "+" ? p + 1 : FAIL;
            case EnumToken.Sub:
                return value === "-" ? p + 1 : FAIL;
            case EnumToken.LiteralTokenType:
                return c.arena.resolveString(c.arena.stringValue[token]) === value ? p + 1 : FAIL;
            case EnumToken.Plus:
                return p + 1;
        }

        return FAIL;
    };
}

/**
 * a token of a type
 * @param type
 */
function tokenType(type: EnumToken): Matcher {
    return (c: MatchContext, p: number): number => (c.arena.dataTypes[c.toks[p]] === type ? p + 1 : FAIL);
}

export const comma: Matcher = tokenType(EnumToken.CommaTokenType);
export const colon: Matcher = tokenType(EnumToken.ColonTokenType);
export const openParens: Matcher = tokenType(EnumToken.StartParensTokenType);
export const closeParens: Matcher = tokenType(EnumToken.EndParensTokenType);
export const openCurly: Matcher = tokenType(EnumToken.BlockStartTokenType);

/**
 * the `/` separator
 */
export const slash: Matcher = (c: MatchContext, p: number): number => {
    const token: Token = c.toks[p];

    return c.arena.dataTypes[token] === EnumToken.LiteralTokenType && c.arena.resolveString(c.arena.stringValue[token]) === "/"
        ? p + 1
        : FAIL;
};

/**
 * an optional group: skipped when it does not match
 * @param group
 */
export function optGroup(group: Matcher): Matcher {
    return opt(group);
}

/**
 * `<bg-layer>#? , <final-bg-layer>`: the items of the list followed by a comma, `[ <bg-layer> , ]*`. the last item is
 * left to the next syntax
 * @param group the item followed by a comma
 */
export function optList(group: Matcher): Matcher {
    return (c: MatchContext, p: number): number => {
        while (p < c.len) {
            const result: number = group(c, p);

            if (result <= p) {
                break;
            }

            p = result;
        }

        return p;
    };
}

/**
 * syntaxes in any order: one or more (`||`) or all the syntaxes that match a token (`&&`), the order that matches the
 * most tokens, see searchUnorderedSyntaxes()
 * @param operands
 * @param nullable nullable[i]: the operand may match no token
 * @param all
 */
export function unordered(operands: Matcher[], nullable: number[], all: boolean): Matcher {
    const count: number = operands.length;
    const allNullable: boolean = nullable.every((value: number) => value === 1);

    return (c: MatchContext, p: number): number => {
        const size: number = c.len + 1;
        // the position after an operand, by operand and position. -2: not matched yet
        const memo: Int32Array = new Int32Array(count * size).fill(-2);
        const remaining: number[] = [];

        for (let i = 0; i < count; i++) {
            remaining.push(i);
        }

        const best: number = search(c, operands, nullable, all, remaining, p, memo, size);

        if (best >= 0) {
            return best;
        }

        return all && allNullable ? p : FAIL;
    };
}

/**
 * the position after the operands that match the most tokens, -1 if no operand matches
 */
function search(
    c: MatchContext,
    operands: Matcher[],
    nullable: number[],
    all: boolean,
    remaining: number[],
    p: number,
    memo: Int32Array,
    size: number,
): number {
    let best: number = -1;

    for (let k = 0; k < remaining.length; k++) {
        const operand: number = remaining[k];
        const key: number = operand * size + p;
        let next: number = memo[key];

        if (next === -2) {
            next = p < c.len ? operands[operand](c, p) : FAIL;

            // the operand must match a token
            if (next <= p) {
                next = -1;
            }

            memo[key] = next;
        }

        if (next < 0) {
            continue;
        }

        const rest: number[] = remaining.slice(0, k).concat(remaining.slice(k + 1));
        let complete: boolean = true;

        if (all) {
            for (let i = 0; i < rest.length; i++) {
                if (nullable[rest[i]] !== 1) {
                    complete = false;
                    break;
                }
            }
        }

        if (next < c.len && rest.length > 0) {
            const deeper: number = search(c, operands, nullable, all, rest, next, memo, size);

            if (deeper >= 0) {
                if (deeper >= c.len) {
                    return deeper;
                }

                if (deeper > best) {
                    best = deeper;
                }
            }
        }

        if (complete) {
            if (next >= c.len) {
                return next;
            }

            if (next > best) {
                best = next;
            }
        }
    }

    return best;
}

/**
 * the compiled matcher of a definition, by `group/name`
 */
let definitions: Map<string, number> | null = null;

/**
 * the compiled matcher of a definition, null if the definition is not compiled
 * @param key `group/name`
 */
export function compiledMatcher(key: string): Matcher | null {
    if (definitions === null) {
        definitions = new Map();

        for (let i = 0; i < keys.length; i++) {
            definitions.set(keys[i], i);
        }
    }

    const index: number | undefined = definitions.get(key);

    return index === undefined ? null : definition(index);
}

/**
 * match the tokens of a value with a compiled matcher
 * @param arena
 * @param matcher
 * @param tokens the value tokens
 * @param options
 * @returns true if the value is valid, false if the interpreter must validate it
 */
export function matchCompiled(arena: AstArena, matcher: Matcher, tokens: Token[], options: ParserOptions): boolean {
    const toks: Token[] = significantTokens(arena, tokens, []);

    // a css wide keyword (see matchSyntax())
    if (
        toks.length === 1 &&
        arena.dataTypes[toks[0]] === EnumToken.IdenTokenType &&
        isCssWideKeyword(arena.resolveString(arena.stringValue[toks[0]]))
    ) {
        return true;
    }

    const c: MatchContext = { arena, toks, len: toks.length, options, depth: 0, leaf: null, leafLen: -1 };

    try {
        return matcher(c, 0) === toks.length;
    } catch (error) {
        if (error === BAIL) {
            return false;
        }

        throw error;
    }
}
