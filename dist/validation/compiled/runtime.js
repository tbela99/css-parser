/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { lowercase } from '../../parser/utils/text.js';
import { isFunctionDefType, funcLike, isFunctionType } from '../../syntax/constants.js';
import { ValidationTokenEnum } from '../parser/typedef.js';
import { isCssWideKeyword, matchProperty, funcTypes, ValidationTokenContext } from '../match.js';
import { keys, builders } from './syntaxes.js';
import { rawTypes } from './builtins.js';

const FAIL = -1;
/**
 * thrown when the value must be validated by the interpreter
 */
const BAIL = Object.freeze({ bail: true });
/**
 * the maximum depth of the references being matched: deeper, the interpreter validates the value
 */
const maxDepth = 256;
/**
 * the matchers of the definitions, by index (see {@link builders})
 */
const matchers = [];
/**
 * the matcher of a definition, built once
 * @param index
 */
function definition(index) {
    return (matchers[index] ??= builders[index]());
}
/**
 * a reference to a definition: the matcher is built when it is first matched
 * @param index
 */
function ref(index) {
    let matcher = null;
    return (c, p) => {
        if (++c.depth > maxDepth) {
            throw BAIL;
        }
        const result = (matcher ??= definition(index))(c, p);
        c.depth--;
        return result;
    };
}
/**
 * a definition the compiler could not compile: the interpreter validates it
 */
const interpreted = () => {
    throw BAIL;
};
/**
 * an empty syntax
 */
const empty = (_c, p) => p;
/**
 * a sequence of syntaxes. the remaining syntaxes must be nullable when the tokens are consumed
 * @param items
 * @param nullable nullable[i]: the syntaxes from i are nullable
 */
function seq(items, nullable) {
    const length = items.length;
    if (length === 1) {
        const item = items[0];
        const optional = nullable[0] === 1;
        return (c, p) => (p >= c.len ? (optional ? p : FAIL) : item(c, p));
    }
    return (c, p) => {
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
function alt(alternatives) {
    const length = alternatives.length;
    return (c, p) => {
        let best = FAIL;
        for (let i = 0; i < length; i++) {
            const result = alternatives[i](c, p);
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
function identValue(c, token) {
    return c.arena.dataTypes[token] === EnumToken.IdenTokenType
        ? lowercase(c.arena.resolveString(c.arena.stringValue[token]))
        : null;
}
/**
 * a keyword, ignoring the case
 * @param value the lowercase keyword
 */
function kw(value) {
    return (c, p) => (identValue(c, c.toks[p]) === value ? p + 1 : FAIL);
}
/**
 * alternative keywords, ignoring the case
 * @param values the lowercase keywords
 */
function kws(values) {
    const set = new Set(values);
    return (c, p) => {
        const value = identValue(c, c.toks[p]);
        return value !== null && set.has(value) ? p + 1 : FAIL;
    };
}
/**
 * an optional syntax: skipped when it does not match
 * @param matcher
 */
function opt(matcher) {
    return (c, p) => {
        const result = matcher(c, p);
        return result < 0 ? p : result;
    };
}
/**
 * a repeated syntax: `*` (zero or more) or `+` (one or more), see matchRepeatableSyntax()
 * @param item
 * @param zero zero matches are allowed
 */
function rep(item, zero) {
    return (c, p) => {
        let matched = false;
        while (true) {
            const result = item(c, p);
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
function occ(item, min, max) {
    return (c, p) => {
        let count = 0;
        do {
            const result = item(c, p);
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
function itemEnd(c, p, commas) {
    let depth = 0;
    for (let i = p; i < c.len; i++) {
        const type = c.arena.dataTypes[c.toks[i]];
        if (type === EnumToken.StartParensTokenType || isFunctionDefType(type)) {
            depth++;
        }
        else if (type === EnumToken.EndParensTokenType) {
            depth--;
        }
        else if (depth === 0 && type === EnumToken.CommaTokenType && commas-- === 0) {
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
function list(item, min, max, commas) {
    return (c, p) => {
        const len = c.len;
        let count = 0;
        while (true) {
            const end = itemEnd(c, p, commas);
            // BAIL aborts the whole match: the length is not restored
            c.len = end;
            const result = item(c, p);
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
function leafContext(c, p) {
    if (c.leaf === null || c.leafLen !== c.len) {
        c.leaf = new ValidationTokenContext(c.arena, c.len === c.toks.length ? c.toks : c.toks.slice(0, c.len), p - 1);
        c.leafLen = c.len;
    }
    else {
        c.leaf.index = p - 1;
    }
    return c.leaf;
}
/**
 * the token types matched by the numeric types without calc() and the css wide keywords: the matchers of these types
 * do not call matchProperty() for the other tokens (see {@link leaf})
 */
const numericTypes = {
    number: (_c, _t, type) => type === EnumToken.NumberTokenType,
    integer: (c, t, type) => type === EnumToken.NumberTokenType && Number.isInteger(Number(c.arena.numericValue[t])),
    zero: (c, t, type) => type === EnumToken.NumberTokenType && c.arena.numericValue[t] === 0,
    length: (c, t, type) => type === EnumToken.LengthTokenType ||
        type === EnumToken.UserDefinedDimensionTokenType ||
        (type === EnumToken.NumberTokenType && c.arena.numericValue[t] === 0),
    percentage: (_c, _t, type) => type === EnumToken.PercentageTokenType,
    "length-percentage": (c, t, type) => type === EnumToken.PercentageTokenType ||
        type === EnumToken.LengthTokenType ||
        type === EnumToken.UserDefinedDimensionTokenType ||
        (type === EnumToken.NumberTokenType && c.arena.numericValue[t] === 0),
    angle: (_c, _t, type) => type === EnumToken.AngleTokenType || type === EnumToken.UserDefinedDimensionTokenType,
    "angle-percentage": (_c, _t, type) => type === EnumToken.AngleTokenType ||
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
function leaf(name) {
    if (rawTypes.has(name)) {
        return interpreted;
    }
    const property = {
        typ: ValidationTokenEnum.PropertyType,
        val: name,
    };
    const fast = numericTypes[name] ?? null;
    return (c, p) => {
        const token = c.toks[p];
        const type = c.arena.dataTypes[token];
        if (fast !== null &&
            type !== EnumToken.IdenTokenType &&
            type !== EnumToken.MathFunctionTokenType &&
            type !== EnumToken.MathFunctionTokenDefType) {
            return fast(c, token, type) ? p + 1 : FAIL;
        }
        const context = leafContext(c, p);
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
function inRange(c, token, min, max, unit) {
    const type = c.arena.dataTypes[token];
    if (type === EnumToken.MathFunctionTokenType ||
        type === EnumToken.MathFunctionTokenDefType ||
        type === EnumToken.WildCardFunctionTokenType ||
        type === EnumToken.WildCardFunctionTokenDefType) {
        return true;
    }
    let success = !c.arena.hasFraction(token) && c.arena.numericValue[token] >= min;
    if (unit !== null) {
        success = type === EnumToken[unit];
    }
    return success && c.arena.numericValue[token] <= max;
}
/**
 * a type with a range: `<integer [1,∞]>`. the range of the first token is checked after the match, a value out of the
 * range fails even if the type is optional
 * @param matcher
 * @param bounds [min, max, unit, has min]
 * @param optional
 */
function rng(matcher, bounds, optional) {
    const [min, max, unit] = bounds;
    return (c, p) => {
        const result = matcher(c, p);
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
function significantTokens(arena, tokens, result) {
    for (let i = 0; i < tokens.length; i++) {
        const type = arena.dataTypes[tokens[i]];
        if (type !== EnumToken.WhitespaceTokenType &&
            type !== EnumToken.CommentTokenType &&
            type !== EnumToken.CDOCOMMTokenType) {
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
function closingParens(c, p) {
    let depth = 0;
    for (let i = p; i < c.len; i++) {
        const type = c.arena.dataTypes[c.toks[i]];
        if (type === EnumToken.StartParensTokenType || isFunctionDefType(type)) {
            depth++;
        }
        else if (type === EnumToken.EndParensTokenType && --depth === 0) {
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
function matchRange(c, matcher, p, end) {
    const len = c.len;
    // BAIL aborts the whole match: the length is not restored
    c.len = end;
    const result = matcher(c, p);
    c.len = len;
    return result === end;
}
/**
 * a function and its arguments: `rgb( ... )`
 * @param name the lowercase function name
 * @param args
 */
function fn(name, args) {
    return (c, p) => {
        const token = c.toks[p];
        const type = c.arena.dataTypes[token];
        if ((!isFunctionDefType(type) && !funcLike.includes(type) && !funcTypes.includes(type)) ||
            lowercase(c.arena.resolveString(c.arena.stringValue[token])) !== name) {
            return FAIL;
        }
        if (isFunctionDefType(type)) {
            const close = closingParens(c, p);
            return close !== -1 && matchRange(c, args, p + 1, close) ? close + 1 : FAIL;
        }
        const toks = significantTokens(c.arena, c.arena.tokens(token), []);
        const sub = {
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
function fndef(name, syntax) {
    return (c, p) => {
        const token = c.toks[p];
        const type = c.arena.dataTypes[token];
        if (syntax === null || lowercase(c.arena.resolveString(c.arena.stringValue[token])) !== name) {
            return FAIL;
        }
        if (isFunctionDefType(type)) {
            const close = closingParens(c, p);
            return close !== -1 && matchRange(c, syntax, p, close + 1) ? close + 1 : FAIL;
        }
        if (!isFunctionType(type)) {
            return FAIL;
        }
        const sub = {
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
function num(value, unit, unitText) {
    const unitType = unit === null ? null : EnumToken[unit];
    const lowerUnit = unitText === null ? null : unitText.toLowerCase();
    return (c, p) => {
        const token = c.toks[p];
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
function str(value) {
    return (c, p) => {
        const token = c.toks[p];
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
function tokenType(type) {
    return (c, p) => (c.arena.dataTypes[c.toks[p]] === type ? p + 1 : FAIL);
}
const comma = tokenType(EnumToken.CommaTokenType);
const colon = tokenType(EnumToken.ColonTokenType);
const openParens = tokenType(EnumToken.StartParensTokenType);
const closeParens = tokenType(EnumToken.EndParensTokenType);
/**
 * the `/` separator
 */
const slash = (c, p) => {
    const token = c.toks[p];
    return c.arena.dataTypes[token] === EnumToken.LiteralTokenType && c.arena.resolveString(c.arena.stringValue[token]) === "/"
        ? p + 1
        : FAIL;
};
/**
 * an optional group: skipped when it does not match
 * @param group
 */
function optGroup(group) {
    return opt(group);
}
/**
 * `<bg-layer>#? , <final-bg-layer>`: the items of the list followed by a comma, `[ <bg-layer> , ]*`. the last item is
 * left to the next syntax
 * @param group the item followed by a comma
 */
function optList(group) {
    return (c, p) => {
        while (p < c.len) {
            const result = group(c, p);
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
function unordered(operands, nullable, all) {
    const count = operands.length;
    const allNullable = nullable.every((value) => value === 1);
    return (c, p) => {
        const size = c.len + 1;
        // the position after an operand, by operand and position. -2: not matched yet
        const memo = new Int32Array(count * size).fill(-2);
        const remaining = [];
        for (let i = 0; i < count; i++) {
            remaining.push(i);
        }
        const best = search(c, operands, nullable, all, remaining, p, memo, size);
        if (best >= 0) {
            return best;
        }
        return all && allNullable ? p : FAIL;
    };
}
/**
 * the position after the operands that match the most tokens, -1 if no operand matches
 */
function search(c, operands, nullable, all, remaining, p, memo, size) {
    let best = -1;
    for (let k = 0; k < remaining.length; k++) {
        const operand = remaining[k];
        const key = operand * size + p;
        let next = memo[key];
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
        const rest = remaining.slice(0, k).concat(remaining.slice(k + 1));
        let complete = true;
        if (all) {
            for (let i = 0; i < rest.length; i++) {
                if (nullable[rest[i]] !== 1) {
                    complete = false;
                    break;
                }
            }
        }
        if (next < c.len && rest.length > 0) {
            const deeper = search(c, operands, nullable, all, rest, next, memo, size);
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
let definitions = null;
/**
 * the compiled matcher of a definition, null if the definition is not compiled
 * @param key `group/name`
 */
function compiledMatcher(key) {
    if (definitions === null) {
        definitions = new Map();
        for (let i = 0; i < keys.length; i++) {
            definitions.set(keys[i], i);
        }
    }
    const index = definitions.get(key);
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
function matchCompiled(arena, matcher, tokens, options) {
    const toks = significantTokens(arena, tokens, []);
    // a css wide keyword (see matchSyntax())
    if (toks.length === 1 &&
        arena.dataTypes[toks[0]] === EnumToken.IdenTokenType &&
        isCssWideKeyword(arena.resolveString(arena.stringValue[toks[0]]))) {
        return true;
    }
    const c = { arena, toks, len: toks.length, options, depth: 0, leaf: null, leafLen: -1 };
    try {
        return matcher(c, 0) === toks.length;
    }
    catch (error) {
        if (error === BAIL) {
            return false;
        }
        throw error;
    }
}

export { BAIL, FAIL, alt, closeParens, colon, comma, compiledMatcher, empty, fn, fndef, interpreted, kw, kws, leaf, list, matchCompiled, num, occ, openParens, opt, optGroup, optList, ref, rep, rng, seq, slash, str, unordered };
