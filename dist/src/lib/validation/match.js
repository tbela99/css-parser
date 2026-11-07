/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { TokenField } from '../ast/arena.js';
import { getParsedSyntax, getSyntaxConfig } from './config.js';
import { EnumToken } from '../ast/types.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum, MediaFeatureType } from './parser/typedef.js';
import { tokensfuncDefMap, tokensfuncSet, funcLike, mFLT, mFGT } from '../syntax/constants.js';
import { isColor } from '../syntax/syntax.js';
import { equalsIgnoreCase, lowercase } from '../parser/utils/text.js';
import { parseTokens } from '../parser/parse.js';

const config = getSyntaxConfig();
// @ts-expect-error
const allValues = config.declarations.all.syntax.split(/[\s|]+/g);
/**
 * true if the value is a css wide keyword (`inherit`, `initial`, ...), ignoring the case
 * @param value
 */
function isCssWideKeyword(value) {
    for (let i = 0; i < allValues.length; i++) {
        if (equalsIgnoreCase(allValues[i], value)) {
            return true;
        }
    }
    return false;
}
const selectorNodeTypes = [
    EnumToken.CommaTokenType,
    EnumToken.ColumnCombinatorTokenType,
    EnumToken.ChildCombinatorTokenType,
    EnumToken.NextSiblingCombinatorTokenType,
    EnumToken.SubsequentSiblingCombinatorTokenType,
];
const trimWhitespaceBefore = selectorNodeTypes.concat(EnumToken.DelimTokenType, EnumToken.DashMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.AttrEndTokenType);
const trimWhitespaceAfter = selectorNodeTypes.concat(EnumToken.DelimTokenType, EnumToken.DashMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.AttrStartTokenType);
const selectorEnumMap = new Map([
    [EnumToken.Tilda, EnumToken.SubsequentSiblingCombinatorTokenType],
    [EnumToken.GtTokenType, EnumToken.ChildCombinatorTokenType],
]);
const propertyKeywordValues = new Map();
/**
 * empty error list shared by the results
 */
const noErrors = Object.freeze([]);
/**
 * allocate a result. the results are passed to the matching functions that fill them (see {@link setMatch})
 */
function createMatch() {
    return {
        success: false,
        valid: true,
        token: null,
        context: null,
        syntaxToken: null,
        errors: noErrors,
    };
}
/**
 * fill a result
 * @param out
 * @param success
 * @param valid
 * @param token
 * @param context
 * @param syntaxToken
 * @param errors
 */
function setMatch(out, success, valid, token, context, syntaxToken, errors) {
    out.success = success;
    out.valid = valid;
    out.token = token;
    out.context = context;
    out.syntaxToken = syntaxToken;
    out.errors = errors;
    return out;
}
/**
 * the error list returned to the callers of {@link matchAllSyntaxes}: the callers may add errors to it
 * @param errors
 */
function ownErrors(errors) {
    return errors === noErrors ? [] : errors;
}
/**
 * copy a result
 * @param out
 * @param from
 */
function copyMatch(out, from) {
    return setMatch(out, from.success, from.valid, from.token, from.context, from.syntaxToken, from.errors);
}
/**
 * @type {Array.<EnumToken>}
 */
const funcTypes = Array.from(tokensfuncDefMap.values());
funcTypes.push(EnumToken.FunctionTokenType, EnumToken.PseudoClassFuncTokenType);
/**
 * trim leading and trailing whitespace
 * @param tokens
 * @returns
 */
function trimArray(arena, tokens) {
    while (tokens.length > 0 && arena.dataTypes[tokens[0]] === EnumToken.WhitespaceTokenType) {
        tokens.shift();
    }
    while (tokens.length > 0 && arena.dataTypes[tokens[tokens.length - 1]] === EnumToken.WhitespaceTokenType) {
        tokens.pop();
    }
    return tokens;
}
/**
 *
 * @param featureName
 * @returns
 */
function getMFInfo(featureName) {
    // @ts-expect-error
    return config.mediaFeatures[featureName.toLowerCase()];
}
/**
 *
 * @param featureName
 * @param tokens
 * @param isMFRange
 * @returns object with:
 * - valid: boolean. true the media feaure is known or is a custom property. false otherwise
 * - success: boolean. validation result
 */
function isMFValue(arena, featureName, tokens, isMFRange) {
    // mf-value: <number> | <dimension> | <ident> | <ratio>
    tokens = tokens.filter((token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType);
    // if (tokens.length === 0) {
    //     return { valid: true, success: false };
    // }
    // https://www.w3.org/TR/mediaqueries-5/#:~:text=Attempting%20to%20evaluate%20a%20min%2Fmax%20prefixed
    // https://www.w3.org/TR/mediaqueries-5/#custom-mq
    if (featureName.startsWith("--") || (isMFRange && /^((min)|(max))-/g.test(featureName))) {
        return { valid: true, success: false, isValueAllowed: false };
    }
    featureName = featureName.toLowerCase();
    // @ts-expect-error
    if (config.mediaFeatures[featureName] == null) {
        return { valid: false, success: false };
    }
    // @ts-expect-error
    const mediaFeature = config.mediaFeatures[featureName];
    switch (mediaFeature.type) {
        case MediaFeatureType.BooleanType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] === EnumToken.NumberTokenType &&
                    (arena.numericValue[tokens[0]] === 0 || arena.numericValue[tokens[0]] === 1),
            };
        case MediaFeatureType.KeywordType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] === EnumToken.IdenTokenType &&
                    mediaFeature.values.includes(arena.strings[arena.stringValue[tokens[0]]].toLowerCase()),
            };
        case MediaFeatureType.LengthType:
            return { valid: true, success: tokens.length === 1 && arena.dataTypes[tokens[0]] == EnumToken.LengthTokenType };
        case MediaFeatureType.IntergerType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType &&
                    !arena.numericValue[tokens[0]].toString().includes("."),
            };
        case MediaFeatureType.NumberType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType &&
                    !arena.hasFraction(tokens[0]),
            };
        case MediaFeatureType.StringType:
            return { valid: true, success: tokens.length === 1 && arena.dataTypes[tokens[0]] == EnumToken.StringTokenType };
        case MediaFeatureType.ResolutionType:
            return { valid: true, success: tokens.length === 1 && arena.dataTypes[tokens[0]] == EnumToken.ResolutionTokenType };
        case MediaFeatureType.RatioType:
            return {
                valid: true,
                success: (tokens.length == 1 && arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType) ||
                    (tokens.length === 3 &&
                        arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType &&
                        !arena.hasFraction(tokens[0]) &&
                        arena.dataTypes[tokens[1]] == EnumToken.LiteralTokenType &&
                        arena.strings[arena.stringValue[tokens[1]]] === "/" &&
                        arena.dataTypes[tokens[2]] == EnumToken.NumberTokenType &&
                        !arena.hasFraction(tokens[2])),
            };
        default:
            console.debug("Unknown media feature type " + mediaFeature.type);
    }
    return {
        valid: true,
        success: true,
    };
}
/**
 * validation context: a cursor over the tokens being validated. the methods are shared by all the contexts
 */
class ValidationTokenContext {
    arena;
    tokens;
    index;
    constructor(arena, tokens, index) {
        this.arena = arena;
        this.tokens = tokens;
        this.index = index;
    }
    current() {
        if (this.index < 0) {
            return null;
        }
        return this.tokens[this.index];
    }
    peek(offset = 0) {
        let index = this.index;
        let token = this.tokens[++index];
        while (offset >= 0 && index < this.tokens.length) {
            while (this.arena.dataTypes[token] == EnumToken.WhitespaceTokenType ||
                this.arena.dataTypes[token] == EnumToken.CommentTokenType ||
                this.arena.dataTypes[token] == EnumToken.CDOCOMMTokenType) {
                token = this.tokens[++index];
            }
            if (token == null || offset === 0) {
                return token;
            }
            offset--;
            token = this.tokens[++index];
        }
        return token;
    }
    /**
     *
     * @returns
     * @param open
     * @param close
     * @param counter
     */
    peekRange(close = EnumToken.EndParensTokenType, counter = 0) {
        let index = this.index;
        let token = this.tokens[index];
        // track balanced parens
        let matchCount = 0;
        const tokens = [];
        while (index + 1 < this.tokens.length && this.arena.dataTypes[this.tokens[index + 1]] === EnumToken.WhitespaceTokenType) {
            index++;
        }
        while (index + 1 < this.tokens.length) {
            token = this.tokens[++index];
            if (this.arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(this.arena.dataTypes[token])) {
                matchCount++;
            }
            else if (this.arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                matchCount--;
            }
            if (matchCount >= 0) {
                tokens.push(token);
            }
            if (matchCount === 0) {
                if (close !== EnumToken.EndParensTokenType && this.arena.dataTypes[token] === close) {
                    counter--;
                }
            }
            if (matchCount <= 0 && counter <= 0) {
                break;
            }
        }
        return tokens;
    }
    // 2
    split(split = EnumToken.CommaTokenType) {
        let index = this.index;
        let token = this.tokens[index];
        // track balanced parens
        let matchCount = 0;
        const tokens = [[]];
        while (index + 1 < this.tokens.length) {
            token = this.tokens[++index];
            if (this.arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(this.arena.dataTypes[token])) {
                matchCount++;
            }
            else if (this.arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                matchCount--;
            }
            if (matchCount === 0 && this.arena.dataTypes[token] === split) {
                tokens.at(-1).push(token);
                tokens.push([]);
            }
            else {
                tokens.at(-1).push(token);
            }
        }
        return tokens;
    }
    getRemainingTokens() {
        return this.tokens.slice(this.index + 1);
    }
    end() {
        this.index = this.tokens.length + 1;
        return this;
    }
    next() {
        let token = this.tokens[++this.index];
        while (this.arena.dataTypes[token] === EnumToken.WhitespaceTokenType ||
            this.arena.dataTypes[token] === EnumToken.CommentTokenType ||
            this.arena.dataTypes[token] === EnumToken.CDOCOMMTokenType ||
            this.arena.dataTypes[token] === EnumToken.BadCdoTokenType ||
            this.arena.dataTypes[token] === EnumToken.BadCommentTokenType ||
            this.arena.dataTypes[token] === EnumToken.BadStringTokenType) {
            token = this.tokens[++this.index];
        }
        return token;
    }
    slice() {
        return new ValidationTokenContext(this.arena, this.index == -1 ? this.tokens.slice() : this.tokens.slice(this.index), this.index == -1 ? -1 : 0);
    }
    update(token) {
        const index = token == null ? -1 : this.tokens.indexOf(token);
        if (index != -1) {
            this.index = index;
        }
        return this;
    }
    done() {
        if (this.index + 1 < this.tokens.length) {
            let index = this.index + 1;
            while (index < this.tokens.length) {
                if (this.arena.dataTypes[this.tokens[index]] === EnumToken.WhitespaceTokenType ||
                    this.arena.dataTypes[this.tokens[index]] === EnumToken.CommentTokenType) {
                    index++;
                }
                else {
                    return false;
                }
            }
        }
        return true;
    }
}
/**
 * create validation context
 * @param tokens
 * @returns
 */
function createValidationContext(arena, tokens) {
    const filtered = [];
    for (let i = 0; i < tokens.length; i++) {
        if (arena.dataTypes[tokens[i]] !== EnumToken.CommentTokenType) {
            filtered.push(tokens[i]);
        }
    }
    tokens = trimArray(arena, filtered);
    // inlined: arena.typeOf(tokens.at(-1))
    if (arena.dataTypes[tokens.at(-1)] === EnumToken.ImportantTokenType) {
        tokens.pop();
        trimArray(arena, tokens);
    }
    return new ValidationTokenContext(arena, tokens, -1);
}
/**
 * match selector syntax
 * @param stream
 * @param errors
 * @param options
 * @param nested
 * @returns
 */
function matchSelectorSyntax(arena, stream, errors, options, nested = true) {
    const stack = [];
    const tokens = [];
    let token;
    let i = 0;
    let success = true;
    while (i < stream.length &&
        (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType)) {
        i++;
    }
    if (i < stream.length) {
        switch (arena.dataTypes[stream[i]]) {
            case EnumToken.Plus:
            case EnumToken.Tilda:
            case EnumToken.GtTokenType:
            case EnumToken.ColumnCombinatorTokenType:
            case EnumToken.ChildCombinatorTokenType:
            case EnumToken.NextSiblingCombinatorTokenType:
            case EnumToken.SubsequentSiblingCombinatorTokenType:
                if (!nested) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[arena.dataTypes[stream[i]]]}`,
                                node: stream[i],
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                // @ts-expect-error
                                location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                            },
                        ],
                    };
                }
        }
    }
    for (; i < stream.length; i++) {
        token = stream[i];
        if (arena.dataTypes[token] === EnumToken.Star) {
            arena.dataTypes[token] = EnumToken.UniversalSelectorTokenType;
        }
        tokens.push(token);
        if (tokensfuncDefMap.has(arena.dataTypes[token])) {
            if (stack.length > 0 && selectorNodeTypes.includes(arena.dataTypes[stack[stack.length - 1]])) {
                stack.pop();
            }
            stack.push(token);
            continue;
        }
        if (stack.length > 0 &&
            selectorNodeTypes.includes(arena.dataTypes[stack[stack.length - 1]]) &&
            !selectorNodeTypes.includes(arena.dataTypes[token]) &&
            arena.dataTypes[token] !== EnumToken.WhitespaceTokenType &&
            arena.dataTypes[token] !== EnumToken.CommentTokenType &&
            arena.dataTypes[token] !== EnumToken.CDOCOMMTokenType) {
            stack.pop();
        }
        switch (arena.dataTypes[token]) {
            case EnumToken.PseudoClassFuncTokenType:
                {
                    const result = matchAllSyntaxes(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, arena.strings[arena.stringValue[token]] + "()")?.[0]?.chi ?? [], createValidationContext(arena, arena.tokens(token)), options);
                    if (!result.success) {
                        success = false;
                        if (result.errors.length > 0) {
                            for (const error of result.errors) {
                                errors.push(error);
                            }
                        }
                    }
                }
                break;
            case EnumToken.WhitespaceTokenType:
            case EnumToken.CommentTokenType:
            case EnumToken.CDOCOMMTokenType:
                break;
            case EnumToken.NestingSelectorTokenType:
                if (!nested && !options.nestedRule) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Nesting selector is not allowed`,
                                node: token,
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                                // @ts-expect-error
                                location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(token))],
                            },
                        ],
                    };
                }
                break;
            case EnumToken.Plus:
                arena.dataTypes[token] = EnumToken.NextSiblingCombinatorTokenType;
                stack.push(token);
                break;
            case EnumToken.Tilda:
            case EnumToken.GtTokenType:
                arena.dataTypes[token] = selectorEnumMap.get(arena.dataTypes[token]);
            case EnumToken.ColumnCombinatorTokenType:
            case EnumToken.ChildCombinatorTokenType:
            case EnumToken.UniversalSelectorTokenType:
            case EnumToken.DescendantCombinatorTokenType:
            case EnumToken.NextSiblingCombinatorTokenType:
            case EnumToken.SubsequentSiblingCombinatorTokenType:
                if (arena.dataTypes[stream[i + 1]] === EnumToken.WhitespaceTokenType) {
                    i++;
                }
                // inlined: arena.typeOf(stack.at(-1))
                if (stack.length > 0 && arena.dataTypes[stack.at(-1)] === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                // inlined: arena.typeOf(stack.at(-1))
                if (stack.length > 0 && selectorNodeTypes.includes((stack.at(-1) == null ? null : arena.dataTypes[stack.at(-1)]))) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected combinator ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                                // @ts-expect-error
                                location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(token))],
                            },
                        ],
                    };
                }
                stack.push(token);
                break;
            case EnumToken.CommaTokenType:
                if (stack.length > 0 && arena.dataTypes[stack[stack.length - 1]] === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                stack.push(token);
                break;
            case EnumToken.PipeTokenType:
            case EnumToken.DelimTokenType:
            case EnumToken.StringTokenType:
            case EnumToken.IncludeMatchTokenType:
            case EnumToken.ContainMatchTokenType:
            case EnumToken.StartMatchTokenType:
            case EnumToken.EndMatchTokenType:
            case EnumToken.DashMatchTokenType:
                break;
            case EnumToken.IdenTokenType:
            case EnumToken.HashTokenType:
            case EnumToken.PseudoElementTokenType:
            case EnumToken.PseudoClassTokenType:
            case EnumToken.ClassSelectorTokenType:
                break;
            case EnumToken.AttrStartTokenType:
                stack.push(token);
                break;
            case EnumToken.AttrEndTokenType:
                if (stack.length > 0 && arena.dataTypes[stack[stack.length - 1]] === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                // inlined: arena.typeOf(stack.at(-1))
                if (arena.dataTypes[stack.at(-1)] !== EnumToken.AttrStartTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                                // @ts-expect-error
                                location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(token))],
                            },
                        ],
                    };
                }
                {
                    const k = tokens.length - 1;
                    let index = tokens.indexOf(stack[stack.length - 1]);
                    const slice = [];
                    for (let n = index + 1; n < k; n++) {
                        if (arena.dataTypes[tokens[n]] === EnumToken.WhitespaceTokenType ||
                            arena.dataTypes[tokens[n]] === EnumToken.CommentTokenType ||
                            arena.dataTypes[tokens[n]] === EnumToken.CDOCOMMTokenType) {
                            continue;
                        }
                        slice.push(tokens[n]);
                    }
                    if (arena.dataTypes[slice[1]] === EnumToken.PipeTokenType) {
                        slice.shift();
                    }
                    if (arena.dataTypes[slice[0]] === EnumToken.PipeTokenType) {
                        slice.shift();
                    }
                    if (slice.length === 1) {
                        stack.pop();
                        break;
                    }
                    slice.shift();
                    slice.shift();
                    if (arena.dataTypes[slice[0]] === EnumToken.StringTokenType &&
                        /^[a-zA-Z0-9_-]+$/.test(arena.strings[arena.stringValue[slice[0]]].slice(1, -1))) {
                        // inlined: arena.setStr(slice[0], arena.strings[arena.stringValue[slice[0]]].slice(1, -1))
                        arena.stringValue[slice[0]] = arena.internString(arena.strings[arena.stringValue[slice[0]]].slice(1, -1));
                        arena.dataTypes[slice[0]] = EnumToken.IdenTokenType;
                    }
                    slice.shift();
                    if (slice.length === 0) {
                        stack.pop();
                        break;
                    }
                    if (arena.dataTypes[slice[0]] !== EnumToken.IdenTokenType ||
                        (arena.strings[arena.stringValue[slice[0]]] != "i" && arena.strings[arena.stringValue[slice[0]]] != "s")) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[arena.dataTypes[slice[0]]]}`,
                                    node: slice[0],
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(slice[0]))
                                    // @ts-expect-error
                                    location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(slice[0]))],
                                },
                            ],
                        };
                    }
                    slice.shift();
                    stack.pop();
                    break;
                }
            case EnumToken.StartParensTokenType:
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                            node: token,
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                            // @ts-expect-error
                            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(token))],
                        },
                    ],
                };
            case EnumToken.EndParensTokenType:
                // inlined: arena.typeOf(stack.at(-1))
                if (stack.length > 0 && arena.dataTypes[stack.at(-1)] === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                if (
                // inlined: arena.typeOf(stack.at(-1))
                arena.dataTypes[stack.at(-1)] === EnumToken.PseudoClassFunctionTokenDefType ||
                    // inlined: arena.typeOf(stack.at(-1))
                    arena.dataTypes[stack.at(-1)] === EnumToken.PseudoElementTokenType) {
                    const token = stack.at(-1);
                    const index = tokens.indexOf(token);
                    const result = matchAllSyntaxes(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, arena.strings[arena.stringValue[token]] + "()")?.[0]?.chi ?? [], createValidationContext(arena, tokens.slice(index + 1, tokens.length - 1)), options);
                    if (!result.success) {
                        success = false;
                        if (result.errors.length > 0) {
                            for (const error of result.errors) {
                                errors.push(error);
                            }
                        }
                    }
                    stack.pop();
                    break;
                }
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                            node: token,
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                            // @ts-expect-error
                            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(token))],
                        },
                    ],
                };
            case EnumToken.NumberTokenType:
            case EnumToken.LiteralTokenType:
            case EnumToken.DimensionTokenType:
                // inlined: arena.typeOf(stack.at(-1))
                if (arena.dataTypes[stack.at(-1)] === EnumToken.PseudoClassFunctionTokenDefType) {
                    break;
                }
            default:
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unsupported selector token ${EnumToken[arena.dataTypes[token]]}`,
                            node: token,
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                            // @ts-expect-error
                            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(token))],
                        },
                    ],
                };
        }
        if (arena.dataTypes[token] === EnumToken.WhitespaceTokenType &&
            // inlined: arena.typeOf(tokens.at(-2))
            trimWhitespaceAfter.includes((tokens.at(-2) == null ? null : arena.dataTypes[tokens.at(-2)])) &&
            // inlined: arena.typeOf(tokens.at(-1))
            arena.dataTypes[tokens.at(-1)] === EnumToken.WhitespaceTokenType) {
            tokens.pop();
            // inlined: arena.typeOf(token), arena.typeOf(tokens.at(-2))
        }
        else if (trimWhitespaceBefore.includes(arena.dataTypes[token]) && arena.dataTypes[tokens.at(-2)] === EnumToken.WhitespaceTokenType) {
            tokens.splice(tokens.length - 2, 1);
        }
    }
    if (stack.length > 0 && arena.dataTypes[stack[stack.length - 1]] === EnumToken.UniversalSelectorTokenType) {
        stack.pop();
    }
    if (stack.length > 0) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: `Unmatched token ${EnumToken[arena.dataTypes[stack[stack.length - 1]]]}`,
                    node: stack[stack.length - 1],
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stack[stack.length - 1]))
                    // @ts-expect-error
                    location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stack[stack.length - 1]))],
                },
            ],
        };
    }
    stream.length = 0;
    for (let i = 0; i < tokens.length; i++) {
        stream.push(tokens[i]);
    }
    return { success, errors };
}
/**
 * declaration validations (successful and failed), by string table of the arena, by syntax and by hash of the value
 * encoding (see {@link encodeToken}). the encoding contains interned string ids: the string table is the key, it is
 * replaced when the arena is compacted and the ids change (see {@link AstArena.compact})
 */
const declarationValidations = new WeakMap();
/**
 * shared result of a declaration whose validation is cached
 */
const cachedValidMatch = Object.freeze({
    success: true,
    valid: true,
    context: null,
    token: null,
    syntaxToken: null,
    errors: Object.freeze([]),
});
/**
 * encoding of the value being validated: 6 fields per token (type, interned name, interned string value, numeric
 * value, interned unit, color type), followed by the encoding of its tokens between markers -1 / -2 and of its
 * children between markers -3 / -4. the buffer is reused: no allocation unless a new valid value is cached
 */
let encoding = new Float64Array(512);
let encodingLength = 0;
let encodingHash = 0;
/**
 * append a value to the encoding and update its hash
 * @param value
 */
function encode(value) {
    if (encodingLength == encoding.length) {
        const previous = encoding;
        encoding = new Float64Array(previous.length * 2);
        encoding.set(previous);
    }
    encoding[encodingLength++] = value;
    encodingHash = Math.imul(encodingHash ^ (Number.isInteger(value) ? value | 0 : (value * 4096) | 0), 0x01000193);
}
/**
 * encode a token and its descendants. the validation only depends on these fields: two values with the same encoding
 * are validated the same way
 * @param arena
 * @param token
 */
function encodeToken(arena, token) {
    encode(arena.dataTypes[token]);
    encode(arena.name[token]);
    encode(arena.stringValue[token]);
    encode(arena.numericValue[token]);
    encode(arena.unit[token]);
    encode(arena.colorType[token]);
    if (arena.firstToken[token] != 0) {
        encode(-1);
        for (let child = arena.firstToken[token]; child != 0; child = arena.nextSibling[child]) {
            encodeToken(arena, child);
        }
        encode(-2);
    }
    if (arena.firstChild[token] != 0) {
        encode(-3);
        for (let child = arena.firstChild[token]; child != 0; child = arena.nextSibling[child]) {
            encodeToken(arena, child);
        }
        encode(-4);
    }
}
/**
 * the cached validations with the hash of the current encoding
 * @param arena
 * @param syntaxes
 * @param create create the bucket when missing
 */
function cachedValidations(arena, syntaxes, create) {
    let bySyntax = declarationValidations.get(arena.strings);
    if (bySyntax == null) {
        if (!create) {
            return null;
        }
        bySyntax = new Map();
        declarationValidations.set(arena.strings, bySyntax);
    }
    let byHash = bySyntax.get(syntaxes);
    if (byHash == null) {
        if (!create) {
            return null;
        }
        byHash = new Map();
        bySyntax.set(syntaxes, byHash);
    }
    let bucket = byHash.get(encodingHash);
    if (bucket == null && create) {
        bucket = [];
        byHash.set(encodingHash, bucket);
    }
    return bucket ?? null;
}
/**
 * the cached validation of the current encoding for the syntax
 * @param arena
 * @param syntaxes
 */
function findValidation(arena, syntaxes) {
    const bucket = cachedValidations(arena, syntaxes, false);
    if (bucket != null) {
        for (let i = 0; i < bucket.length; i++) {
            const candidate = bucket[i].encoding;
            if (candidate.length == encodingLength) {
                let k = 0;
                while (k < encodingLength && candidate[k] === encoding[k]) {
                    k++;
                }
                if (k == encodingLength) {
                    return bucket[i];
                }
            }
        }
    }
    return null;
}
/**
 * cache the validation of an encoding for the syntax
 * @param arena
 * @param syntaxes
 * @param value encoding
 * @param hash encoding hash
 * @param valid
 * @param errors errors of a failed validation, null when unknown
 */
function cacheValidation(arena, syntaxes, value, hash, valid, errors) {
    encodingHash = hash;
    cachedValidations(arena, syntaxes, true).push({ encoding: value, valid, errors });
}
/**
 * the value tokens and their descendants, in the encoding order (see {@link encodeToken})
 * @param arena
 * @param token
 * @param result
 */
function collectTokens(arena, token, result) {
    result.push(token);
    for (let child = arena.firstToken[token]; child != 0; child = arena.nextSibling[child]) {
        collectTokens(arena, child, result);
    }
    for (let child = arena.firstChild[token]; child != 0; child = arena.nextSibling[child]) {
        collectTokens(arena, child, result);
    }
}
/**
 * same source location
 * @param a
 * @param b
 */
function sameLocation(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * bind the errors of a failed validation to the position of their tokens in the value. null when an error refers to
 * a token that is not part of the value (a copy created by the validation, ...)
 * @param arena
 * @param tokens value tokens, see {@link collectTokens}
 * @param errors
 * @param options
 */
function bindErrors(arena, tokens, errors, options) {
    const result = [];
    for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        let node = -1;
        let location = -1;
        if (error.node != null) {
            node = tokens.indexOf(error.node);
            if (node == -1) {
                return null;
            }
        }
        if (error.location != null) {
            // the location is computed from a token of the value: the error node, the last token, ...
            if (node != -1 &&
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[node]))
                sameLocation(error.location, [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(tokens[node]))])) {
                location = node;
            }
            else {
                for (let k = 0; k < tokens.length; k++) {
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[k]))
                    if (sameLocation(error.location, [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(tokens[k]))])) {
                        location = k;
                        break;
                    }
                }
                if (location == -1) {
                    return null;
                }
            }
        }
        const copy = { ...error };
        delete copy.node;
        delete copy.location;
        result.push({ error: copy, node, location });
    }
    return result;
}
/**
 * rebuild the errors of a cached failed validation with the tokens of the value
 * @param arena
 * @param tokens value tokens, see {@link collectTokens}
 * @param errors
 * @param options
 */
function rebuildErrors(arena, tokens, errors, options) {
    const result = [];
    for (let i = 0; i < errors.length; i++) {
        const error = { ...errors[i].error };
        if (errors[i].node != -1) {
            error.node = tokens[errors[i].node];
        }
        if (errors[i].location != -1) {
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[errors[i].location]))
            error.location = [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(tokens[errors[i].location]))];
        }
        result.push(error);
    }
    return result;
}
/**
 * the value tokens and their descendants
 * @param arena
 * @param tokens
 */
function valueTokens(arena, tokens) {
    const result = [];
    for (let i = 0; i < tokens.length; i++) {
        collectTokens(arena, tokens[i], result);
    }
    return result;
}
/**
 * validate the value of a declaration. a value that has already been validated for the same syntax in the same arena
 * (same encoding, see {@link encodeToken}) is not validated again: `width: 10px` is validated once, whatever the number
 * of rules that contain it. the failed validations are cached too: their errors are rebuilt with the tokens of the value
 * @param arena
 * @param syntaxes declaration syntax
 * @param tokens value tokens
 * @param options
 */
function matchDeclarationSyntax(arena, syntaxes, tokens, options) {
    encodingLength = 0;
    encodingHash = 0x811c9dc5;
    for (let i = 0; i < tokens.length; i++) {
        encodeToken(arena, tokens[i]);
    }
    const cached = findValidation(arena, syntaxes);
    if (cached != null) {
        if (cached.valid) {
            return cachedValidMatch;
        }
        if (cached.errors != null) {
            return {
                success: false,
                valid: true,
                context: null,
                token: null,
                syntaxToken: null,
                errors: rebuildErrors(arena, valueTokens(arena, tokens), cached.errors, options),
            };
        }
    }
    // the encoding is copied before the validation, which may encode other values
    const value = encoding.slice(0, encodingLength);
    const hash = encodingHash;
    const result = matchAllSyntaxes(arena, syntaxes, createValidationContext(arena, tokens), options);
    if (result.success) {
        cacheValidation(arena, syntaxes, value, hash, true, null);
    }
    else {
        const errors = bindErrors(arena, valueTokens(arena, tokens), result.errors, options);
        if (cached != null) {
            // failure cached without its errors
            cached.errors = errors;
        }
        else {
            cacheValidation(arena, syntaxes, value, hash, false, errors);
        }
    }
    return result;
}
/**
 * validate the value tokens of a declaration node, see {@link matchDeclarationSyntax}. the successful and the failed
 * validations are cached
 * @param arena
 * @param syntaxes declaration syntax
 * @param declaration declaration node
 * @param options
 * @returns true if the value is valid
 */
function isValidDeclarationValue(arena, syntaxes, declaration, options) {
    encodingLength = 0;
    encodingHash = 0x811c9dc5;
    for (let token = arena.firstToken[declaration]; token != 0; token = arena.nextSibling[token]) {
        encodeToken(arena, token);
    }
    const cached = findValidation(arena, syntaxes);
    if (cached != null) {
        return cached.valid;
    }
    // the encoding is copied before the validation, which may encode other values
    const value = encoding.slice(0, encodingLength);
    const hash = encodingHash;
    const valid = matchAllSyntaxes(arena, syntaxes, createValidationContext(arena, arena.tokens(declaration)), options).success;
    // the errors are not needed: they are computed if a declaration with the same value is validated by the parser
    cacheValidation(arena, syntaxes, value, hash, valid, null);
    return valid;
}
/**
 * matches all syntaxes
 * @param syntaxes
 * @param context
 * @param options
 * @returns
 */
function matchAllSyntaxes(arena, syntaxes, context, options) {
    // the visited syntaxes are tracked per call. the options are not copied: the previous map is restored
    const visited = options.visited;
    // the result object is passed to the matching functions, which fill it
    const out = createMatch();
    let result;
    options.visited = new Map();
    try {
        result = matchSyntax(arena, syntaxes, context, options, out);
    }
    finally {
        options.visited = visited;
    }
    if (syntaxes != null && result.success && result.syntaxToken != null) {
        const index = syntaxes.indexOf(result.syntaxToken);
        if (index != -1) {
            for (let i = index; i < syntaxes.length; i++) {
                if (syntaxes[i].typ == ValidationTokenEnum.Whitespace ||
                    syntaxes[i].isOptional ||
                    syntaxes[i].isRepeatable ||
                    syntaxes[i].match?.min?.val === 0) {
                    continue;
                }
                return setMatch(out, false, result.valid, result.token, result.context, syntaxes[i], ownErrors(result.errors));
            }
        }
    }
    return setMatch(out, result.success, result.valid, result.token, result.context, !result.success ? result.syntaxToken : null, !result.success && result.errors.length === 0
        ? [
            {
                action: "drop",
                message: result.errors[0]?.message || "could not match syntax",
                node: result.token,
                syntax: result.syntaxToken,
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(result.token ?? (context.tokens[context.tokens.length - 1] as Token)))
                location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(result.token ?? context.tokens[context.tokens.length - 1]))],
            },
        ]
        : ownErrors(result.errors));
}
/**
 * matches a list of syntaxes
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchListSyntax(arena, syntax, context, options) {
    const { isList, match, isOptional, ...rest } = syntax;
    let success = true;
    let result = null;
    let tmpResult;
    let count = 0;
    let range;
    let done = false;
    success = false;
    do {
        range = context.peekRange(EnumToken.CommaTokenType, 1);
        tmpResult = matchSyntax(arena, [rest], createValidationContext(arena, 
        // inlined: arena.typeOf(range.at(-1))
        arena.dataTypes[range.at(-1)] === EnumToken.CommaTokenType ? range.slice(0, -1) : range), options);
        if (tmpResult.success) {
            count++;
            success = true;
            result = tmpResult;
            if (Number.isFinite(match?.max?.val) && count === match.max.val) {
                context.update(
                // inlined: arena.typeOf(range.at(-1))
                arena.dataTypes[range.at(-1)] === EnumToken.CommaTokenType ? (range.at(-2)) : (range.at(-1)));
                break;
            }
            else {
                context.update(range.at(-1));
            }
            done = context.done();
        }
    } while (tmpResult.success && !done);
    return result == null
        ? {
            success: false,
            valid: true,
            context,
            token: context.peek(),
            syntaxToken: syntax,
            errors: [],
        }
        : {
            ...result,
            success,
            context,
            token: context.peek(),
        };
}
/**
 * matches a list of syntaxes
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchOccurenceSyntax(arena, syntax, context, options) {
    const { match, ...rest } = syntax;
    let result = null;
    let tmpResult;
    let count = 0;
    do {
        tmpResult = matchSyntax(arena, [rest], context.slice(), options);
        if (tmpResult.success) {
            count++;
            result = tmpResult;
            if (tmpResult.context.done()) {
                context.end();
                break;
            }
            if (tmpResult.context.index === context.index) {
                break;
            }
            context.update(tmpResult.context.current());
            if (match?.max?.val != null && Number.isFinite(match?.max?.val) && count === match.max.val) {
                break;
            }
        }
    } while (tmpResult.success && !context.done());
    if (result == null ||
        (match != null &&
            (count < match.min.val || (Number.isFinite(match.max?.val) && count > match.max.val)))) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "could not match syntax",
                    node: context.peek(),
                    // location: options.source!.getSourceLocation(context.peek()?.[LOCSTA]),
                },
            ],
            syntaxToken: null,
            valid: true,
            context,
            token: null,
        };
    }
    return result;
}
/**
 * matches a list of syntaxes
 * @param syntaxes
 * @param context
 * @param options
 * @returns
 */
function matchSyntax(arena, syntaxes, context, options, out = createMatch()) {
    if (syntaxes == null) {
        return setMatch(out, true, false, context.peek(), context, null, noErrors);
    }
    let i = -1;
    let success = false;
    let token = null;
    let result = null;
    let isOptional;
    if (context.tokens.length == 1 &&
        arena.dataTypes[context.tokens[0]] == EnumToken.IdenTokenType &&
        isCssWideKeyword(arena.strings[arena.stringValue[context.tokens[0]]])) {
        context.end();
        return setMatch(out, true, true, context.peek(), context, null, noErrors);
    }
    while (++i < syntaxes.length) {
        if (syntaxes[i].typ == ValidationTokenEnum.Whitespace) {
            continue;
        }
        isOptional =
            (syntaxes[i].isOptional === true ||
                syntaxes[i].isRepeatable === true ||
                syntaxes[i].isRepeatable === true) &&
                !syntaxes[i].isMandatatoryGroup;
        token = context.peek();
        if (token == null) {
            if (!isOptional) {
                return setMatch(out, false, true, null, context, syntaxes[i], [
                    {
                        action: "drop",
                        message: "could not match syntax",
                        node: null,
                        syntax: syntaxes[i],
                    },
                ]);
            }
            break;
        }
        if (arena.dataTypes[token] === EnumToken.WildCardFunctionTokenType && arena.strings[arena.stringValue[token]] === "var") {
            result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, arena.strings[arena.stringValue[token]] + "()")?.[0]?.chi, createValidationContext(arena, arena.tokens(token)), options, out);
            if (result.success && result.context.done()) {
                context.next();
                continue;
            }
        }
        if (
        // @ts-ignore
        arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType) {
            const range = trimArray(arena, context.peekRange());
            result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, arena.strings[arena.stringValue[token]] + "()")?.[0]?.chi, createValidationContext(arena, range.slice(1, -1)), options, out);
            if (result.success) {
                context.update(range.at(-1));
                if (context.done()) {
                    return setMatch(out, result.success, result.valid, result.token, context, syntaxes[i + 1], result.errors);
                }
                continue;
            }
        }
        if (syntaxes[i].isRepeatableAtLeastOnce || syntaxes[i].isRepeatable) {
            result = matchRepeatableSyntax(arena, syntaxes[i], context.slice(), options);
            if (result.success) {
                if (result.context.done()) {
                    context.end();
                    return setMatch(out, result.success, result.valid, result.token, result.context, syntaxes[i + 1], result.errors);
                }
                context.update(result.context.current());
                continue;
            }
            if (isOptional) {
                continue;
            }
            return result;
        }
        if (syntaxes[i].isList) {
            result = matchListSyntax(arena, syntaxes[i], context.slice(), options);
            if (result.success) {
                options.visited.get(token)?.delete?.(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return setMatch(out, true, true, null, context, syntaxes[i + 1], result.errors);
                }
                context.update(result.context.current());
                continue;
            }
            if (isOptional) {
                continue;
            }
            return setMatch(out, false, true, token, context, syntaxes[i], result.errors);
        }
        if (syntaxes[i].match != null) {
            result = matchOccurenceSyntax(arena, syntaxes[i], context.slice(), options);
            if (result.success) {
                options.visited.get(token).delete(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return setMatch(out, result.success, result.valid, result.token, context, syntaxes[++i], result.errors);
                }
                context.update(result.context.current());
                continue;
            }
            if (isOptional) {
                continue;
            }
            return setMatch(out, false, true, token, context, syntaxes[i], result.errors);
        }
        if (!options.visited.has(token)) {
            options.visited.set(token, new Set());
        }
        if (options.visited.get(token).has(syntaxes[i])) {
            // cyclic definition
            return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
        }
        options.visited.get(token).add(syntaxes[i]);
        success = false;
        switch (syntaxes[i].typ) {
            case ValidationTokenEnum.Comma:
                if (arena.dataTypes[token] == EnumToken.CommaTokenType) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.Keyword:
                if (arena.dataTypes[token] == EnumToken.IdenTokenType &&
                    lowercase(arena.strings[arena.stringValue[token]]) ===
                        lowercase(syntaxes[i].val)) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.DeclarationType:
                result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, syntaxes[i].val), context, options, out);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return setMatch(out, result.success, result.valid, token, context, syntaxes[1 + i], result.errors);
                    }
                    else {
                        if (result.context.current() != null) {
                            context.update(result.context.current());
                        }
                    }
                }
                if (success || isOptional) {
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], result.errors);
            case ValidationTokenEnum.OptionalGroupToken: {
                //
                const tokens = context.split();
                let j = 0;
                for (; j < tokens.length; j++) {
                    result = matchSyntax(arena, syntaxes[i].chi, context.slice(), options, out);
                    if (result.success) {
                        context.update(tokens[j].at(-1));
                    }
                    break;
                }
                if (result?.context?.done?.()) {
                    return result;
                }
                break;
            }
            case ValidationTokenEnum.StringToken:
                if (arena.dataTypes[token] === EnumToken.Add) {
                    success = syntaxes[i].val.slice(1, -1) === "+";
                }
                else if (arena.dataTypes[token] === EnumToken.Sub) {
                    success = syntaxes[i].val.slice(1, -1) === "-";
                }
                else if (arena.dataTypes[token] === EnumToken.LiteralTokenType) {
                    success = arena.strings[arena.stringValue[token]] === syntaxes[i].val.slice(1, -1);
                }
                else if (arena.dataTypes[token] == EnumToken.Plus) {
                    success = true;
                }
                if (success) {
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.PropertyType:
                result = matchProperty(arena, syntaxes[i], context, options);
                if (!result.success) {
                    if (isOptional) {
                        break;
                    }
                    return setMatch(out, false, true, context.current() ?? token, context, syntaxes[i], noErrors);
                }
                success = true;
                options.visited.get(token).delete(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return setMatch(out, success, true, null, context, syntaxes[i + 1], noErrors);
                }
                else {
                    context.update(result.context.current());
                }
                break;
            case ValidationTokenEnum.PipeToken:
                {
                    // each alternative is matched in the same scratch result, the best match is copied
                    const scratch = createMatch();
                    let best = null;
                    let tmp = null;
                    for (const syntax of syntaxes[i].chi) {
                        tmp = matchSyntax(arena, syntax, context.slice(), options, scratch);
                        if (tmp.success) {
                            if (best == null || tmp.context.index >= best.context.index) {
                                best = copyMatch(best ?? createMatch(), tmp);
                            }
                            if (tmp.context.done()) {
                                context.end();
                                return setMatch(out, tmp.success, tmp.valid, tmp.token, context, syntaxes[i + 1], tmp.errors);
                            }
                        }
                    }
                    result = best;
                    if (result?.success) {
                        success = true;
                        options.visited.get(token).delete(syntaxes[i]);
                        context.update(result.context.current());
                        break;
                    }
                }
                return setMatch(out, false, true, token, context, syntaxes[i], [
                    {
                        action: "drop",
                        message: "could not match syntax",
                        node: token,
                        // @ts-ignore
                        // location: options.source!.getSourceLocation(token[LOC]?.sta),
                        syntax: syntaxes[i],
                    },
                ]);
            case ValidationTokenEnum.Bracket:
                result = matchSyntax(arena, syntaxes[i].chi, context.slice(), options, out);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return setMatch(out, success, true, null, context, syntaxes[1 + i], noErrors);
                    }
                    else {
                        context.update(result.context.current());
                    }
                    break;
                }
                if (isOptional) {
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.ColumnToken:
                result = matchColumnSyntax(arena, syntaxes[i], context.slice(), options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return setMatch(out, success, true, null, context, syntaxes[1 + i], noErrors);
                    }
                    else {
                        context.update(result.context.current());
                    }
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.AmpersandToken:
                result = matchAmpersandSyntax(arena, syntaxes[i], context.slice(), options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return setMatch(out, success, true, null, context, syntaxes[1 + i], noErrors);
                    }
                    else {
                        context.update(result.context.current());
                    }
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.Function:
                if ((!tokensfuncDefMap.has(arena.dataTypes[token]) &&
                    !funcLike.includes(arena.dataTypes[token]) &&
                    !funcTypes.includes(arena.dataTypes[token])) ||
                    !equalsIgnoreCase(syntaxes[i].val, arena.strings[arena.stringValue[token]].toLowerCase())) {
                    return setMatch(out, false, true, token, context, syntaxes[i], [
                        {
                            action: "drop",
                            message: `Expecting a function ${EnumToken[arena.dataTypes[token]]}`,
                            node: token,
                        },
                    ]);
                }
                if (tokensfuncDefMap.has(arena.dataTypes[token])) {
                    const range = context.peekRange();
                    result = matchSyntax(arena, syntaxes[i].chi, createValidationContext(arena, range.slice(1, -1)), options, out);
                    if (result.success && result.context.done()) {
                        context.update(range.at(-1));
                        options.visited.get(token).delete(syntaxes[i]);
                        break;
                    }
                }
                else {
                    result = matchSyntax(arena, syntaxes[i].chi, createValidationContext(arena, arena.tokens(token)), options, out);
                    if (result.success && result.context.done()) {
                        success = true;
                        options.visited.get(token).delete(syntaxes[i]);
                        context.next();
                        break;
                    }
                }
                return setMatch(out, false, true, token, context, syntaxes[i], result.errors);
            case ValidationTokenEnum.Separator:
                if (arena.dataTypes[token] === EnumToken.LiteralTokenType && arena.strings[arena.stringValue[token]] === "/") {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.FunctionDefinition:
                if (arena.strings[arena.stringValue[token]] &&
                    equalsIgnoreCase(arena.strings[arena.stringValue[token]], syntaxes[i].val)) {
                    if (tokensfuncDefMap.has(arena.dataTypes[token])) {
                        const children = trimArray(arena, context.peekRange());
                        result = matchSyntax(arena, (getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, syntaxes[i].val + "()")?.[0]).chi ?? [], createValidationContext(arena, children.slice(1, -1)), options, out);
                        if (result.success && result.context.done()) {
                            success = true;
                            options.visited.get(token).delete(syntaxes[i]);
                            context.update(children.at(-1));
                            break;
                        }
                    }
                    else if (tokensfuncSet.has(arena.dataTypes[token])) {
                        result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, syntaxes[i].val + "()") ?? [], createValidationContext(arena, [token]), options, out);
                        if (result.success && result.context.done()) {
                            success = true;
                            options.visited.get(token).delete(syntaxes[i]);
                            context.next();
                            break;
                        }
                    }
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.OpenParenthesis:
                if (arena.dataTypes[token] === EnumToken.StartParensTokenType) {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.OpenCurlyBrace:
                if (arena.dataTypes[token] === EnumToken.BlockStartTokenType) {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            case ValidationTokenEnum.CloseParenthesis:
                if (arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            default:
                throw new Error(`Unexpected syntax ${ValidationTokenEnum[syntaxes[i].typ]}`);
        }
        if (success &&
            "range" in syntaxes[i] &&
            !(arena.dataTypes[token] === EnumToken.MathFunctionTokenType ||
                arena.dataTypes[token] === EnumToken.MathFunctionTokenDefType ||
                arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType)) {
            let success = false;
            success =
                !arena.hasFraction(token) &&
                    arena.numericValue[token] >=
                        syntaxes[i].range.min.val;
            if (syntaxes[i].range.min.typ === ValidationTokenEnum.Dimension) {
                success =
                    arena.dataTypes[token] ===
                        EnumToken[
                        // @ts-expect-error
                        syntaxes[i].range.min
                            .unit];
            }
            if (success &&
                syntaxes[i].range.max != null) {
                success =
                    arena.numericValue[token] <=
                        syntaxes[i].range.max.val;
            }
            if (!success) {
                return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
            }
        }
    }
    return result?.success ? result : setMatch(out, true, true, token, context, syntaxes[i] ?? null, noErrors);
}
/**
 * matches a column of syntaxes
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchColumnSyntax(arena, syntax, context, options) {
    let syntaxes = syntax.chi.slice();
    let i = 0;
    let success = false;
    let result;
    syntaxes = syntaxes.slice();
    for (; i < syntaxes.length; i++) {
        result = matchSyntax(arena, syntaxes[i], context.slice(), options);
        if (result.success) {
            const curr = result.context.current();
            if (curr == null && !result.context.done()) {
                continue;
            }
            if (result.context.done()) {
                context.end();
                return {
                    ...result,
                    context,
                    syntaxToken: syntaxes[i + 1]?.[0],
                };
            }
            context.update(curr);
            success = true;
            syntaxes.splice(i, 1);
            i = -1;
        }
    }
    return {
        success,
        valid: true,
        token: context.current(),
        context,
        syntaxToken: syntax,
        errors: [],
    };
}
/**
 * matches an ampersand of syntaxes
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchAmpersandSyntax(arena, syntax, context, options) {
    const syntaxes = [syntax.l, syntax.r];
    let result;
    let i;
    for (i = 0; i < syntaxes.length; i++) {
        result = matchSyntax(arena, syntaxes[i], context.slice(), options);
        if (result.success) {
            if (result.context.done()) {
                context.end();
                break;
            }
            context.update(result.context.current());
            syntaxes.splice(i, 1);
            i = -1;
        }
    }
    return result;
}
/**
 * matches a property
 * @param property
 * @param context
 * @param options
 * @returns
 */
function matchProperty(arena, property, context, options) {
    let success = false;
    const token = context.peek();
    // inlined: arena.typeOf(token)
    let t = (token == null ? null : arena.dataTypes[token]);
    let checkCalc = (t == EnumToken.MathFunctionTokenDefType || t == EnumToken.MathFunctionTokenType) &&
        [
            "number",
            "zero",
            "integer",
            "percentage",
            "dimension",
            "length-percentage",
            "length",
            "time",
            "calc-sum",
            "calc-product",
        ].includes(property.val);
    if (checkCalc && !["number", "zero", "integer", "percentage", "length-percentage"].includes(property.val)) {
        checkCalc = arena.strings[arena.stringValue[token]] === "calc";
    }
    if (checkCalc) {
        let result;
        const syntax = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, arena.strings[arena.stringValue[token]] + "()")?.[0]?.chi;
        if (t === EnumToken.MathFunctionTokenType) {
            result = matchSyntax(arena, syntax, createValidationContext(arena, arena.tokens(token)), options);
            if (result.success && result.context.done()) {
                context.next();
                return {
                    success: true,
                    valid: true,
                    token: token,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
        }
        else {
            const range = context.peekRange();
            result = matchSyntax(arena, syntax, createValidationContext(arena, range.slice(1, -1)), options);
            if (result.success) {
                context.update(range.at(-1));
                return {
                    success: true,
                    valid: true,
                    token: range[range.length - 1] ?? null,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
        }
        return {
            success: false,
            valid: true,
            token: context.peek(),
            context,
            syntaxToken: property,
            errors: [],
        };
    }
    switch (property.val) {
        case "function-parameter":
        case "declaration-value":
            {
                // consume a declaration value
                // consume a token,
                // if the next token is a comma consume it and expect a token
                // check the parenthises are balanced
                // if semicolon or end curly brace is encountered, stop
                let expectToken = true;
                let token;
                const stack = [];
                token = context.peek();
                if (token != null) {
                    success = false;
                    while ((token = context.peek()) != null) {
                        if (arena.dataTypes[token] == EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[token])) {
                            stack.push(token);
                        }
                        if (expectToken) {
                            expectToken = false;
                        }
                        if (arena.dataTypes[token] == EnumToken.CommaTokenType) {
                            expectToken = true;
                        }
                        if (arena.dataTypes[token] == EnumToken.EndParensTokenType) {
                            if (stack.length > 0) {
                                stack.pop();
                            }
                            else {
                                expectToken = false;
                                break;
                            }
                        }
                        context.next();
                    }
                }
                success = !expectToken;
                if (success) {
                    return {
                        success,
                        valid: true,
                        token: null,
                        context,
                        syntaxToken: property,
                        errors: [],
                    };
                }
            }
            break;
        case "calc-sum": {
            const token = context.peek();
            // inlined: arena.typeOf(token)
            if (arena.dataTypes[token] === EnumToken.BinaryExpressionTokenType) {
                let result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"), createValidationContext(arena, [arena.field(token, TokenField.L)]), options);
                if (result.success) {
                    result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"), createValidationContext(arena, [arena.field(token, TokenField.R)]), options);
                }
                success = result.success;
                break;
            }
            const result = matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"), context.slice(), options);
            success = result.success;
            if (success) {
                if (result.context.done()) {
                    context.end();
                }
                else {
                    context.update(result.context.current());
                }
                return {
                    success: true,
                    valid: true,
                    token: null,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
            break;
        }
        case "an+b":
            {
                let token = context.peek();
                if (
                // inlined: arena.typeOf(token)
                arena.dataTypes[token] === EnumToken.IdenTokenType &&
                    ("even" === arena.strings[arena.stringValue[token]] ||
                        "odd" === arena.strings[arena.stringValue[token]])) {
                    success = true;
                    break;
                }
                if (
                // inlined: arena.typeOf(token)
                arena.dataTypes[token] === EnumToken.NumberTokenType &&
                    Number.isInteger(arena.numericValue[token])) {
                    success = true;
                    break;
                }
                // inlined: arena.typeOf(token)
                if (arena.dataTypes[token] === EnumToken.LiteralTokenType || arena.dataTypes[token] === EnumToken.IdenTokenType) {
                    let match = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(arena.strings[arena.stringValue[token]]);
                    success = match != null;
                    if (match?.[3] == null) {
                        token = context.peek(1);
                        if (
                        // inlined: arena.typeOf(token)
                        arena.dataTypes[token] === EnumToken.Add ||
                            // inlined: arena.typeOf(token)
                            arena.dataTypes[token] === EnumToken.NextSiblingCombinatorTokenType ||
                            // inlined: arena.typeOf(token)
                            arena.dataTypes[token] === EnumToken.Sub) {
                            token = context.peek(2);
                            success =
                                // inlined: arena.typeOf(token)
                                arena.dataTypes[token] === EnumToken.NumberTokenType &&
                                    Number.isInteger(arena.numericValue[token]);
                        }
                        if (success) {
                            context.update(token);
                            return {
                                success: true,
                                valid: true,
                                token: null,
                                context,
                                syntaxToken: property,
                                errors: [],
                            };
                        }
                    }
                    break;
                }
                if (
                // inlined: arena.typeOf(token)
                arena.dataTypes[token] === EnumToken.DimensionTokenType &&
                    arena.strings[arena.unit[token]] === "n") {
                    success = Number.isInteger(arena.numericValue[token]);
                    token = context.peek(1);
                    if (token == null) {
                        break;
                    }
                    if (arena.dataTypes[token] === EnumToken.NumberTokenType) {
                        // the sign of the number is not tracked by the tokenizer
                        break;
                    }
                    if (arena.dataTypes[token] === EnumToken.NextSiblingCombinatorTokenType) {
                        arena.dataTypes[token] = EnumToken.Add;
                    }
                    token = context.peek(2);
                    if (
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] === EnumToken.NumberTokenType &&
                        Number.isInteger(arena.numericValue[token])) {
                        success = true;
                        context.next();
                        context.next();
                    }
                    break;
                }
            }
            break;
        case "quote":
        case "display-box":
        case "display-inside":
        case "display-internal":
        case "display-outside":
        case "display-legacy":
        case "content-position": {
            let values = propertyKeywordValues.get(property.val);
            if (values == null) {
                values = new Set(config.syntaxes[property.val].syntax.split(/[\s|]+/));
                propertyKeywordValues.set(property.val, values);
            }
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token] == EnumToken.IdenTokenType && values.has(arena.strings[arena.stringValue[token]].toLowerCase());
            break;
        }
        case "mf-name":
            {
                const token = context.peek();
                success =
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] === EnumToken.IdenTokenType &&
                        arena.strings[arena.stringValue[token]].toLowerCase() in config.mediaFeatures;
            }
            break;
        case "dashed-ident":
        case "extension-name":
        case "custom-property-name":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek()] == EnumToken.DashedIdenTokenType;
            break;
        case "namespace-prefix":
        case "ident":
        case "ident-token":
        case "custom-ident":
        case "counter-name":
        case "counter-style-name":
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token] == EnumToken.IdenTokenType || arena.dataTypes[token] == EnumToken.DashedIdenTokenType;
            // inlined: arena.typeOf(token)
            if (success && arena.dataTypes[token] === EnumToken.IdenTokenType) {
                const val = arena.strings[arena.stringValue[token]].toLowerCase();
                success = "none" !== val && !allValues.includes(val);
            }
            break;
        case "any-value": {
            const token = context.peek();
            success =
                token == null ||
                    [
                        EnumToken.String,
                        EnumToken.NumberTokenType,
                        EnumToken.DashedIdenTokenType,
                        EnumToken.IdenTokenType,
                        EnumToken.DashedIdenTokenType,
                        EnumToken.FunctionTokenType,
                        EnumToken.ImageFunctionTokenType,
                        EnumToken.UrlFunctionTokenType,
                        EnumToken.TimingFunctionTokenType,
                        EnumToken.TimelineFunctionTokenType,
                        EnumToken.TransformFunctionTokenType,
                    ].includes(arena.dataTypes[token]);
            break;
        }
        case "string": {
            const token = context.peek();
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token] === EnumToken.StringTokenType;
            break;
        }
        case "wq-name": {
            // inlined: arena.typeOf(context.peek())
            const success = arena.dataTypes[context.peek()] == EnumToken.IdenTokenType;
            return {
                success,
                valid: true,
                token: success ? context.next() : context.peek(),
                context,
                syntaxToken: property,
                errors: [],
            };
        }
        case "number":
            {
                const token = context.peek();
                // inlined: arena.typeOf(token)
                success = arena.dataTypes[token] == EnumToken.NumberTokenType;
            }
            break;
        case "zero": {
            const token = context.peek();
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token] == EnumToken.NumberTokenType && arena.numericValue[token] === 0;
            break;
        }
        case "integer":
            {
                const token = context.peek();
                success =
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.NumberTokenType && Number.isInteger(Number(arena.numericValue[token]));
            }
            break;
        case "dimension": {
            const token = context.peek();
            success =
                // inlined: arena.typeOf(token)
                arena.dataTypes[token] == EnumToken.DimensionTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.AngleTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.LengthTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.PercentageTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.ResolutionTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.TimeTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.FrequencyTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.UserDefinedDimensionTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.FlexTokenType;
            break;
        }
        case "angle":
            {
                const token = context.peek();
                // inlined: arena.typeOf(token)
                success = arena.dataTypes[token] === EnumToken.AngleTokenType || arena.dataTypes[token] === EnumToken.UserDefinedDimensionTokenType;
            }
            break;
        case "angle-percentage":
            {
                const token = context.peek();
                // inlined: arena.typeOf(token)
                success = arena.dataTypes[token] === EnumToken.AngleTokenType || arena.dataTypes[token] === EnumToken.UserDefinedDimensionTokenType || arena.dataTypes[token] === EnumToken.PercentageTokenType;
            }
            break;
        case "percentage":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = arena.dataTypes[token] === EnumToken.PercentageTokenType;
            }
            break;
        case "length-percentage":
            {
                const token = context.peek();
                success =
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.PercentageTokenType ||
                        // inlined: arena.typeOf(token)
                        arena.dataTypes[token] == EnumToken.LengthTokenType ||
                        // inlined: arena.typeOf(token)
                        arena.dataTypes[token] == EnumToken.UserDefinedDimensionTokenType ||
                        // inlined: arena.typeOf(token)
                        (arena.dataTypes[token] == EnumToken.NumberTokenType && arena.numericValue[token] === 0);
            }
            break;
        case "flex":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek()] == EnumToken.FlexTokenType || arena.dataTypes[context.peek()] == EnumToken.UserDefinedDimensionTokenType;
            break;
        case "length": {
            const token = context.peek();
            success =
                // inlined: arena.typeOf(token)
                arena.dataTypes[token] == EnumToken.LengthTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token] == EnumToken.UserDefinedDimensionTokenType ||
                    // inlined: arena.typeOf(token)
                    (arena.dataTypes[token] == EnumToken.NumberTokenType && arena.numericValue[token] === 0);
            break;
        }
        case "time":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = arena.dataTypes[token] == EnumToken.TimeTokenType || arena.dataTypes[token] == EnumToken.UserDefinedDimensionTokenType;
            }
            break;
        case "color":
        case "color-function":
            {
                const token = context.peek();
                const errors = [];
                // inlined: arena.typeOf(token)
                if (tokensfuncDefMap.has((token == null ? null : arena.dataTypes[token]))) {
                    const range = context.peekRange();
                    const newRange = range.map((t) => arena.clone(t, true));
                    parseTokens(arena, newRange, { parseColor: true }, errors);
                    success = newRange.length == 1 && isColor(arena, newRange[0], errors);
                    if (success) {
                        context.update(range.at(-1));
                        return {
                            success: true,
                            valid: true,
                            token: context.peek(),
                            context,
                            syntaxToken: null,
                            errors,
                        };
                    }
                    return {
                        success: false,
                        valid: true,
                        token: context.peek(),
                        context,
                        syntaxToken: null,
                        errors,
                    };
                }
                success = token != null && isColor(arena, token, errors);
                if (!success) {
                    return {
                        success,
                        valid: false,
                        token,
                        context,
                        syntaxToken: property,
                        errors,
                    };
                }
            }
            break;
        case "type-selector":
        case "compound-selector":
        case "complex-selector":
        case "subclass-selector":
        case "attribute-selector":
        case "complex-selector-unit":
        case "pseudo-compound-selector":
        case "forgiving-relative-selector-list":
        case "complex-selector-list": {
            const tokens = context.getRemainingTokens();
            const result = matchSelectorSyntax(arena, tokens, [], options, property.val.startsWith("forgiving-relative-selector-list"));
            if (result.success || property.val == "forgiving-relative-selector-list") {
                context.update(tokens.at(-1));
            }
            return {
                success: result.success || property.val == "forgiving-relative-selector-list",
                valid: true,
                token: context.peek(),
                context,
                syntaxToken: property,
                errors: result.errors,
            };
        }
        case "function-token":
            // inlined: arena.typeOf(context.peek()). the type of a null id is undefined: not a key of the map either
            if (tokensfuncDefMap.has(arena.dataTypes[context.peek()])) {
                success = true;
                context.next();
                break;
            }
            return {
                success: false,
                valid: true,
                token: context.peek(),
                context,
                syntaxToken: property,
                errors: [],
            };
        case "language-code": {
            const token = context.peek();
            success =
                // inlined: arena.typeOf(token)
                arena.dataTypes[token] == EnumToken.IdenTokenType &&
                    // @ts-expect-error
                    config.languages.some((t) => t === arena.strings[arena.stringValue[token]] || arena.strings[arena.stringValue[token]].startsWith(t + "-"));
            break;
        }
        case "size-feature": {
            const range = context.peekRange();
            const filteredRange = range.filter((token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType);
            if (filteredRange.length === 1) {
                success =
                    arena.dataTypes[filteredRange[0]] === EnumToken.IdenTokenType ||
                        arena.dataTypes[filteredRange[0]] === EnumToken.DashedIdenTokenType;
                context.update(filteredRange[0]);
                return {
                    success,
                    valid: true,
                    token: filteredRange[0],
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            if (!mFLT.has(arena.dataTypes[filteredRange[1]]) &&
                !mFGT.has(arena.dataTypes[filteredRange[1]]) &&
                arena.dataTypes[filteredRange[1]] !== EnumToken.ColonTokenType &&
                arena.dataTypes[filteredRange[1]] !== EnumToken.DelimTokenType) {
                return {
                    success: false,
                    valid: true,
                    token: filteredRange[1],
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            break;
        }
        case "style-feature": {
            // case 'style-feature-value':
            // match <style-feature-plain>
            // match <style-feature-boolean>
            // match <style-range>
            const range = context.peekRange();
            const filteredRange = range.filter((token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType);
            if (filteredRange.length === 1) {
                success =
                    arena.dataTypes[filteredRange[0]] === EnumToken.IdenTokenType ||
                        arena.dataTypes[filteredRange[0]] === EnumToken.DashedIdenTokenType;
                context.update(filteredRange[0]);
                return {
                    success,
                    valid: true,
                    token: filteredRange[0],
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            return {
                success: false,
                valid: false,
                token: context.peek(),
                context,
                syntaxToken: property,
                errors: [],
            };
        }
        case "url": {
            const token = context.peek();
            let l;
            // inlined: arena.typeOf(token)
            if (arena.dataTypes[token] == EnumToken.UrlFunctionTokenDefType) {
                l = 0;
                let token;
                while ((token = context.peek(++l))) {
                    if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType) {
                        break;
                    }
                }
                if (token != null &&
                    (arena.dataTypes[token] == EnumToken.StringTokenType ||
                        arena.dataTypes[token] == EnumToken.IdenTokenType ||
                        arena.dataTypes[token] == EnumToken.UrlTokenTokenType)) {
                    while ((token = context.peek(++l))) {
                        if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType) {
                            break;
                        }
                    }
                    // inlined: arena.typeOf(token)
                    if (arena.dataTypes[token] == EnumToken.EndParensTokenType) {
                        success = true;
                        context.update(token);
                        return {
                            success: true,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: null,
                            errors: [],
                        };
                    }
                }
                break;
            }
            // inlined: arena.typeOf(token)
            if (arena.dataTypes[token] != EnumToken.UrlFunctionTokenType) {
                success = false;
                break;
            }
            l = -1;
            const urlTokens = arena.tokens(token);
            while (++l < urlTokens.length) {
                if (arena.dataTypes[urlTokens[l]] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[urlTokens[l]] !== EnumToken.CommentTokenType) {
                    break;
                }
            }
            if (l < urlTokens.length) {
                success =
                    arena.dataTypes[urlTokens[l]] == EnumToken.StringTokenType ||
                        arena.dataTypes[urlTokens[l]] == EnumToken.IdenTokenType ||
                        arena.dataTypes[urlTokens[l]] == EnumToken.UrlTokenTokenType;
                context.next();
                return {
                    success: true,
                    valid: true,
                    token: null,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
            break;
        }
        case "css-type": {
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek()] == EnumToken.CssTypeTokenType;
            if (success) {
                context.next();
                return {
                    success: true,
                    valid: true,
                    token: null,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
            break;
        }
        case "dashed-function": {
            const token = context.peek();
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token] == EnumToken.CustomFunctionTokenDefType;
            if (success) {
                context.next();
                return {
                    success: true,
                    valid: true,
                    token,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
            break;
        }
        case "block-contents":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek()] == EnumToken.StartParensTokenType;
            if (success) {
                context.next();
                return {
                    success: true,
                    valid: true,
                    token: null,
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
            return {
                success: false,
                valid: true,
                token,
                context,
                syntaxToken: property,
                errors: [],
            };
        default:
            if (!(property.val in config.syntaxes)) {
                console.debug("Unknown syntax", context.peek(), property);
                throw new Error(`Unexpected validation property ${property.val}`);
            }
            return matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, property.val), context, options);
    }
    if (!success &&
        // inlined: arena.typeOf(context.peek())
        arena.dataTypes[context.peek()] == EnumToken.IdenTokenType &&
        allValues.includes(arena.strings[arena.stringValue[context.peek()]])) {
        success = true;
    }
    if (success) {
        context.next();
        return {
            success: true,
            valid: true,
            token: null,
            context,
            syntaxToken: null,
            errors: [],
        };
    }
    return {
        success: false,
        valid: true,
        token: context.peek(),
        context,
        syntaxToken: property,
        errors: [],
    };
}
/**
 * matches a repeatable syntax
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchRepeatableSyntax(arena, syntax, context, options) {
    const { isRepeatable, isOptional, isMandatatoryGroup, isRepeatableAtLeastOnce, ...rest } = syntax;
    let result = null;
    let tmpResult;
    let success = !!isRepeatable;
    do {
        tmpResult = matchSyntax(arena, [rest], context.slice(), options);
        if (tmpResult.success) {
            result = tmpResult;
            success = true;
            if (tmpResult.context.done()) {
                context.end();
                break;
            }
            if (tmpResult.context.index === context.index) {
                break;
            }
            context.update(result.context.current());
        }
    } while (tmpResult.success && !context.done());
    return {
        success,
        valid: true,
        token: context.peek(),
        context,
        syntaxToken: syntax,
        errors: result?.errors ?? [],
    };
}

export { createValidationContext, funcTypes, getMFInfo, isMFValue, isValidDeclarationValue, matchAllSyntaxes, matchDeclarationSyntax, matchOccurenceSyntax, matchSelectorSyntax, trimArray };
