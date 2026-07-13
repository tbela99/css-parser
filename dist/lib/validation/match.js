import { getParsedSyntax, getSyntaxConfig } from './config.js';
import { EnumToken, ColorType } from '../ast/types.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum, MediaFeatureType } from './parser/typedef.js';
import { tokensfuncDefMap, tokensfuncSet, funcLike, mFLT, mFGT } from '../syntax/constants.js';
import { pseudoElements, isValue, isColor } from '../syntax/syntax.js';
import { isDeclarationValue } from '../parser/utils/declaration.js';
import { renderSyntax } from './parser/parse.js';
import { equalsIgnoreCase } from '../parser/utils/text.js';
import { cloneNode } from '../ast/clone.js';
import { parseTokens } from '../parser/parse.js';

const config = getSyntaxConfig();
// @ts-expect-error
const allValues = config.declarations.all.syntax.split(/[\s|]+/g);
const funcTypes = [
    ...tokensfuncDefMap.values(),
    EnumToken.FunctionTokenType,
    EnumToken.PseudoClassFuncTokenType,
];
function trimArray(tokens) {
    while (tokens[0]?.typ === EnumToken.WhitespaceTokenType) {
        tokens.shift();
    }
    while (tokens[tokens.length - 1]?.typ === EnumToken.WhitespaceTokenType) {
        tokens.pop();
    }
    return tokens;
}
function isMFName(featureName) {
    return featureName.startsWith("--") || featureName.toLowerCase() in config.mediaFeatures;
}
/**
 *
 * @param featureName
 * @returns
 */
function getMFInfo(featureName) {
    // @ts-expect-error
    return config.mediaFeatures[featureName.toLowerCase()] ?? null;
}
/**
 *
 * @param featureName
 * @param tokens
 * @returns object with:
 * - valid: boolean. true the media feaure is known or is a custom property. false otherwise
 * - success: boolean. validation result
 */
function isMFValue(featureName, tokens, isMFRange) {
    // mf-value: <number> | <dimension> | <ident> | <ratio>
    tokens = tokens.filter((token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
    if (tokens.length === 0) {
        return { valid: true, success: false };
    }
    // https://www.w3.org/TR/mediaqueries-5/#:~:text=Attempting%20to%20evaluate%20a%20min%2Fmax%20prefixed
    // https://www.w3.org/TR/mediaqueries-5/#custom-mq
    if (featureName.startsWith("--") || (isMFRange && /^((min)|(max))-/g.test(featureName))) {
        return { valid: true, success: false, isValueAllowed: false };
    }
    featureName = featureName.toLowerCase();
    if (!(featureName in config.mediaFeatures)) {
        return { valid: false, success: false };
    }
    // @ts-expect-error
    const mediaFeature = config.mediaFeatures[featureName];
    if (tokens.length === 1 &&
        tokens[0].typ === EnumToken.MathFunctionTokenType &&
        tokens[0].val === "calc") {
        // todo: check calc tokens are of compatible types : resolution, ratio, length, integer, number?
        // https://github.com/web-platform-tests/wpt/blob/master/css/mediaqueries/mq-calc-sign-function-003.html
        return {
            valid: true,
            success: mediaFeature.type !== MediaFeatureType.KeywordType && mediaFeature.type !== MediaFeatureType.StringType,
        };
    }
    switch (mediaFeature.type) {
        case MediaFeatureType.BooleanType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    tokens[0].typ === EnumToken.NumberTokenType &&
                    (tokens[0].val === 0 || tokens[0].val === 1),
            };
        case MediaFeatureType.KeywordType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    tokens[0].typ === EnumToken.IdenTokenType &&
                    mediaFeature.values.includes(tokens[0].val.toLowerCase()),
            };
        case MediaFeatureType.LengthType:
            return { valid: true, success: tokens.length === 1 && tokens[0].typ == EnumToken.LengthTokenType };
        case MediaFeatureType.IntergerType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    tokens[0].typ == EnumToken.NumberTokenType &&
                    !tokens[0].val.toString().includes("."),
            };
        case MediaFeatureType.NumberType:
            return {
                valid: true,
                success: tokens.length === 1 &&
                    tokens[0].typ == EnumToken.NumberTokenType &&
                    typeof tokens[0].val === "number",
            };
        case MediaFeatureType.StringType:
            return { valid: true, success: tokens.length === 1 && tokens[0].typ == EnumToken.StringTokenType };
        case MediaFeatureType.ResolutionType:
            return { valid: true, success: tokens.length === 1 && tokens[0].typ == EnumToken.ResolutionTokenType };
        case MediaFeatureType.RatioType:
            return {
                valid: true,
                success: (tokens.length == 1 &&
                    tokens[0].typ == EnumToken.NumberTokenType &&
                    tokens[0].val.typ == EnumToken.FractionTokenType) ||
                    (tokens.length === 3 &&
                        tokens[0].typ == EnumToken.NumberTokenType &&
                        typeof tokens[0].val === "number" &&
                        tokens[1].typ == EnumToken.LiteralTokenType &&
                        tokens[1].val === "/" &&
                        tokens[2].typ == EnumToken.NumberTokenType &&
                        typeof tokens[2].val === "number"),
            };
        default:
            console.debug("Unknown media feature type " + mediaFeature.type);
    }
    return {
        valid: true,
        success: true,
    };
}
function isStyleRangeValue(tokens) {
    const filtered = tokens.filter((token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
    const result = isDeclarationValue(tokens);
    if (result.success) {
        result.success = filtered.length > 0;
    }
    return result;
}
function createValidationContext(tokens) {
    tokens = trimArray(tokens.filter((t) => t.typ !== EnumToken.CommentTokenType));
    if (tokens.at(-1)?.typ === EnumToken.ImportantTokenType) {
        tokens.pop();
        trimArray(tokens);
    }
    const token = {
        tokens,
        index: -1,
        current() {
            if (this.index < 0) {
                return null;
            }
            while (this.tokens[this.index]?.typ == EnumToken.WhitespaceTokenType ||
                this.tokens[this.index]?.typ == EnumToken.CommentTokenType ||
                this.tokens[this.index]?.typ == EnumToken.CDOCOMMTokenType) {
                this.index++;
            }
            return this.tokens[this.index];
        },
        peek(offset = 0, skipWhitespace = true) {
            let index = this.index;
            let token = this.tokens[++index];
            if (!skipWhitespace) {
                while (offset >= 0 && index < this.tokens.length) {
                    while (token != null && token.typ === EnumToken.CommentTokenType) {
                        token = this.tokens[++index];
                    }
                    if (offset === 0 || token == null) {
                        return token;
                    }
                    offset--;
                    token = this.tokens[++index];
                }
                return token;
            }
            while (offset >= 0 && index < this.tokens.length) {
                while (token?.typ == EnumToken.WhitespaceTokenType ||
                    token?.typ == EnumToken.CommentTokenType ||
                    token?.typ == EnumToken.CDOCOMMTokenType) {
                    token = this.tokens[++index];
                }
                if (token == null || offset === 0) {
                    return token;
                }
                offset--;
                token = this.tokens[++index];
            }
            return token;
        },
        /**
         *
         * @param stopCondition
         * @param matchCount
         * @returns
         */
        peekRange(open = EnumToken.StartParensTokenType, close = EnumToken.EndParensTokenType, counter = 0) {
            let index = this.index;
            let token = this.tokens[index];
            // track balanced parens
            let matchCount = 0;
            const tokens = [];
            while (index + 1 < this.tokens.length && this.tokens[index + 1]?.typ === EnumToken.WhitespaceTokenType) {
                index++;
            }
            while (index + 1 < this.tokens.length) {
                token = this.tokens[++index];
                if (token?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token?.typ)) {
                    matchCount++;
                }
                else if (token?.typ === EnumToken.EndParensTokenType) {
                    matchCount--;
                }
                if (matchCount >= 0) {
                    tokens.push(token);
                }
                if (matchCount === 0) {
                    if (close !== EnumToken.EndParensTokenType && token?.typ === close) {
                        counter--;
                    }
                    else if (open !== EnumToken.StartParensTokenType && token?.typ === open) {
                        counter++;
                    }
                }
                if (matchCount <= 0 && counter <= 0) {
                    break;
                }
            }
            if (tokens[0]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.shift();
            }
            return tokens;
        },
        // 2
        split(split = EnumToken.CommaTokenType) {
            let index = this.index;
            let token = this.tokens[index];
            // track balanced parens
            let matchCount = 0;
            const tokens = [[]];
            while (index + 1 < this.tokens.length) {
                token = this.tokens[++index];
                if (token?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token?.typ)) {
                    matchCount++;
                }
                else if (token?.typ === EnumToken.EndParensTokenType) {
                    matchCount--;
                }
                if (matchCount === 0 && token.typ === split) {
                    tokens.at(-1).push(token);
                    tokens.push([]);
                }
                else {
                    tokens.at(-1).push(token);
                }
            }
            return tokens;
        },
        getRemainingTokens() {
            return this.tokens.slice(this.index + 1);
        },
        last() {
            let index = this.tokens.length - 1;
            let token = this.tokens[index];
            while ((this.index >= 0 && token?.typ === EnumToken.WhitespaceTokenType) ||
                token?.typ === EnumToken.CommentTokenType ||
                token?.typ === EnumToken.CDOCOMMTokenType ||
                token?.typ === EnumToken.InvalidCommentTokenType ||
                token?.typ === EnumToken.BadCommentTokenType ||
                token?.typ === EnumToken.BadStringTokenType) {
                token = this.tokens[--index];
                if (token == null) {
                    break;
                }
            }
            return token;
        },
        end() {
            this.index = this.tokens.length + 1;
            return this;
        },
        next() {
            let token = this.tokens[++this.index];
            while (token?.typ === EnumToken.WhitespaceTokenType ||
                token?.typ === EnumToken.CommentTokenType ||
                token?.typ === EnumToken.CDOCOMMTokenType ||
                token?.typ === EnumToken.InvalidCommentTokenType ||
                token?.typ === EnumToken.BadCommentTokenType ||
                token?.typ === EnumToken.BadStringTokenType) {
                token = this.tokens[++this.index];
            }
            return token;
        },
        slice() {
            return {
                ...token,
                index: this.index == -1 ? -1 : 0,
                tokens: this.index == -1 ? this.tokens.slice() : this.tokens.slice(this.index),
            };
        },
        update(token) {
            const index = this.tokens.indexOf(token);
            if (index != -1) {
                this.index = index;
            }
            return this;
        },
        done() {
            if (this.index + 1 < this.tokens.length) {
                let index = this.index + 1;
                while (index < this.tokens.length) {
                    if (this.tokens[index].typ === EnumToken.WhitespaceTokenType ||
                        this.tokens[index].typ === EnumToken.CommentTokenType) {
                        index++;
                    }
                    else {
                        return false;
                    }
                }
            }
            return true;
        },
    };
    return token;
}
function matchSelectorSyntax(stream, errors, options, nested = true) {
    const stack = [];
    const tokens = [];
    const nodes = [
        EnumToken.CommaTokenType,
        EnumToken.ColumnCombinatorTokenType,
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
    ];
    const trimWhitespaceBefore = nodes.concat(EnumToken.DelimTokenType, EnumToken.DashMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.AttrEndTokenType);
    const trimWhitespaceAfter = nodes.concat(EnumToken.DelimTokenType, EnumToken.DashMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.AttrStartTokenType);
    const enumMap = new Map([
        [EnumToken.Tilda, EnumToken.SubsequentSiblingCombinatorTokenType],
        [EnumToken.GtTokenType, EnumToken.ChildCombinatorTokenType],
    ]);
    let token;
    let i = 0;
    let success = true;
    while (i < stream.length &&
        (stream[i].typ === EnumToken.WhitespaceTokenType || stream[i].typ === EnumToken.CommentTokenType)) {
        i++;
    }
    if (i < stream.length) {
        switch (stream[i].typ) {
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
                                message: `Unexpected token ${EnumToken[stream[i].typ]} at ${stream[i].loc.src}:${stream[i].loc.sta.lin}:${stream[i].loc.sta.col}`,
                                node: stream[i],
                                location: stream[i].loc,
                            },
                        ],
                    };
                }
        }
    }
    for (; i < stream.length; i++) {
        token = stream[i];
        if (token.typ === EnumToken.EOF) {
            break;
        }
        if (token.typ === EnumToken.Star) {
            token.typ = EnumToken.UniversalSelectorTokenType;
        }
        tokens.push(token);
        if (tokensfuncDefMap.has(token.typ)) {
            if (stack.length > 0 && nodes.includes(stack.at(-1).typ)) {
                stack.pop();
            }
            stack.push(token);
            continue;
        }
        if (stack.length > 0 &&
            nodes.includes(stack.at(-1).typ) &&
            !nodes.includes(token.typ) &&
            token.typ !== EnumToken.WhitespaceTokenType &&
            token.typ !== EnumToken.CommentTokenType &&
            token.typ !== EnumToken.CDOCOMMTokenType) {
            stack.pop();
        }
        if (token.typ === EnumToken.LiteralTokenType && "+" === token.val) {
            Object.assign(token, { typ: EnumToken.NextSiblingCombinatorTokenType });
            continue;
        }
        switch (token.typ) {
            case EnumToken.InvalidCommentTokenType:
            case EnumToken.BadCommentTokenType:
            case EnumToken.BadStringTokenType:
                break;
            case EnumToken.PseudoClassFuncTokenType: {
                const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, token.val + "()")?.[0]?.chi ?? [], createValidationContext(token.chi), options);
                if (!result.success) {
                    success = false;
                    if (result.errors.length > 0) {
                        errors.push(...result.errors);
                    }
                }
            }
            case EnumToken.WhitespaceTokenType:
            case EnumToken.CommentTokenType:
            case EnumToken.CDOCOMMTokenType:
                break;
            case EnumToken.NestingSelectorTokenType:
                if (nested === false && !options.nestedRule) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Nesting selector is not allowed at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                break;
            case EnumToken.Plus:
                Object.assign(token, { typ: EnumToken.NextSiblingCombinatorTokenType });
                if (stack.length > 0 && nodes.includes(stack.at(-1)?.typ)) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected combinator ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                stack.push(token);
                break;
            case EnumToken.Tilda:
            case EnumToken.GtTokenType:
                Object.assign(token, { typ: enumMap.get(token.typ) });
            case EnumToken.ColumnCombinatorTokenType:
            case EnumToken.ChildCombinatorTokenType:
            case EnumToken.UniversalSelectorTokenType:
            case EnumToken.DescendantCombinatorTokenType:
            case EnumToken.NextSiblingCombinatorTokenType:
            case EnumToken.SubsequentSiblingCombinatorTokenType:
                if (tokens.at(-1)?.typ === EnumToken.WhitespaceTokenType) {
                    tokens.pop();
                }
                if (stream[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
                    i++;
                }
                if (stack.length > 0 && stack.at(-1)?.typ === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                if (stack.length > 0 && nodes.includes(stack.at(-1)?.typ)) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected combinator ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                stack.push(token);
                break;
            case EnumToken.CommaTokenType:
                if (stack.length > 0 && stack.at(-1).typ === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                if (tokens.length === 0 || stack.at(-1)?.typ == EnumToken.CommaTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                stack.push(token);
                if (!nested) {
                    let k = i + 1;
                    while (k < stream.length &&
                        (stream[k].typ === EnumToken.WhitespaceTokenType ||
                            stream[k].typ === EnumToken.CommentTokenType)) {
                        k++;
                    }
                    // :has(> a, ~b, +c)
                    if (!tokensfuncDefMap.has(stack.at(-2)?.typ) && k < stream.length) {
                        switch (stream[k].typ) {
                            case EnumToken.Plus:
                            case EnumToken.Tilda:
                            case EnumToken.GtTokenType:
                            case EnumToken.ColumnCombinatorTokenType:
                            case EnumToken.ChildCombinatorTokenType:
                            case EnumToken.NextSiblingCombinatorTokenType:
                            case EnumToken.SubsequentSiblingCombinatorTokenType:
                                return {
                                    success: false,
                                    errors: [
                                        {
                                            action: "drop",
                                            message: `Unexpected token ${EnumToken[stream[k].typ]} at ${stream[k].loc.src}:${stream[k].loc.sta.lin}:${stream[k].loc.sta.col}`,
                                            node: stream[k],
                                            location: stream[k].loc,
                                        },
                                    ],
                                };
                        }
                    }
                }
                break;
            case EnumToken.Pipe:
            case EnumToken.DelimTokenType:
            case EnumToken.StringTokenType:
            case EnumToken.IncludeMatchTokenType:
            case EnumToken.ContainMatchTokenType:
            case EnumToken.StartMatchTokenType:
            case EnumToken.EndMatchTokenType:
            case EnumToken.DashMatchTokenType:
                if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType &&
                    !(stack.at(-1)?.typ === EnumToken.UniversalSelectorTokenType &&
                        stack.at(-2)?.typ === EnumToken.AttrStartTokenType)) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                break;
            // case EnumToken.Star:
            //     Object.assign(token, { typ: EnumToken.UniversalSelectorTokenType });
            //     break;
            case EnumToken.IdenTokenType:
            case EnumToken.HashTokenType:
            case EnumToken.PseudoElementTokenType:
            case EnumToken.PseudoClassTokenType:
            case EnumToken.ClassSelectorTokenType:
                if (stack.at(-1)?.typ === EnumToken.CommaTokenType) {
                    stack.pop();
                }
                break;
            case EnumToken.AttrStartTokenType:
                if (stack.at(-1)?.typ === EnumToken.CommaTokenType) {
                    stack.pop();
                }
                stack.push(token);
                break;
            case EnumToken.AttrEndTokenType:
                if (stack.length > 0 && stack.at(-1).typ === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                {
                    const k = tokens.length - 1;
                    let index = tokens.indexOf(stack.at(-1));
                    const slice = [];
                    for (let n = index + 1; n < k; n++) {
                        if (tokens[n].typ === EnumToken.WhitespaceTokenType ||
                            tokens[n].typ === EnumToken.CommentTokenType ||
                            tokens[n].typ === EnumToken.CDOCOMMTokenType) {
                            continue;
                        }
                        slice.push(tokens[n]);
                    }
                    if (slice.length === 0) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Invalid selector attribute at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                    node: token,
                                    location: token.loc,
                                },
                            ],
                        };
                    }
                    if (slice[1]?.typ === EnumToken.Pipe) {
                        if (slice[0].typ !== EnumToken.UniversalSelectorTokenType &&
                            slice[0].typ !== EnumToken.Star &&
                            slice[0].typ !== EnumToken.IdenTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Invalid selector attribute at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                        node: token,
                                        location: token.loc,
                                    },
                                ],
                            };
                        }
                        slice.shift();
                    }
                    if (slice[0].typ === EnumToken.Pipe) {
                        if (slice.length === 1) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Invalid selector attribute at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                        node: token,
                                        location: token.loc,
                                    },
                                ],
                            };
                        }
                        if (slice[1]?.typ !== EnumToken.IdenTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Invalid selector attribute at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                        node: token,
                                        location: token.loc,
                                    },
                                ],
                            };
                        }
                        slice.shift();
                    }
                    if (slice.length === 1) {
                        if (slice[0].typ !== EnumToken.IdenTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Invalid selector attribute at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                                        node: token,
                                        location: token.loc,
                                    },
                                ],
                            };
                        }
                        stack.pop();
                        break;
                    }
                    slice.shift();
                    if (slice[0].typ != EnumToken.DelimTokenType &&
                        slice[0].typ !== EnumToken.DashMatchTokenType &&
                        slice[0].typ !== EnumToken.EndMatchTokenType &&
                        slice[0].typ !== EnumToken.IncludeMatchTokenType &&
                        slice[0].typ !== EnumToken.StartMatchTokenType &&
                        slice[0].typ !== EnumToken.ContainMatchTokenType) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc.src}:${slice[0].loc.sta.lin}:${slice[0].loc.sta.col}`,
                                    node: slice[0],
                                    location: slice[0].loc,
                                },
                            ],
                        };
                    }
                    slice.shift();
                    if (slice.length === 0) {
                        // expect iden or string
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Invalid selector attribute at ${slice[0].loc.src}:${slice[0].loc.sta.lin}:${slice[0].loc.sta.col}`,
                                    node: slice[0],
                                    location: slice[0].loc,
                                },
                            ],
                        };
                    }
                    if (slice[0].typ !== EnumToken.IdenTokenType && slice[0].typ !== EnumToken.StringTokenType) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc.src}:${slice[0].loc.sta.lin}:${slice[0].loc.sta.col}`,
                                    node: slice[0],
                                    location: slice[0].loc,
                                },
                            ],
                        };
                    }
                    if (slice[0]?.typ === EnumToken.StringTokenType &&
                        /^[a-zA-Z0-9_-]+$/.test(slice[0].val.slice(1, -1))) {
                        Object.assign(slice[0], {
                            typ: EnumToken.IdenTokenType,
                            val: slice[0].val.slice(1, -1),
                        });
                    }
                    slice.shift();
                    if (slice.length === 0) {
                        stack.pop();
                        break;
                    }
                    if (slice[0].typ !== EnumToken.IdenTokenType ||
                        (slice[0].val != "i" && slice[0].val != "s")) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc.src}:${slice[0].loc.sta.lin}:${slice[0].loc.sta.col}`,
                                    node: slice[0],
                                    location: slice[0].loc,
                                },
                            ],
                        };
                    }
                    slice.shift();
                    if (slice.length > 0) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc.src}:${slice[0].loc.sta.lin}:${slice[0].loc.sta.col}`,
                                    node: slice[0],
                                    location: slice[0].loc,
                                },
                            ],
                        };
                    }
                    stack.pop();
                    break;
                }
            case EnumToken.ColonTokenType:
                if (stream[i + 1]?.typ === EnumToken.IdenTokenType) {
                    Object.assign(token, {
                        typ: stream[i + 1].val === "page"
                            ? EnumToken.PseudoPageTokenType
                            : pseudoElements.includes(token.val)
                                ? EnumToken.PseudoElementTokenType
                                : EnumToken.PseudoClassTokenType,
                        val: ":" + stream[i + 1].val,
                    });
                    token.loc.end = stream[++i].loc.end;
                    break;
                }
                else if (stream[i + 1]?.typ === EnumToken.FunctionTokenDefType) {
                    Object.assign(token, {
                        typ: EnumToken.PseudoClassFunctionTokenDefType,
                        val: ":" + stream[i + 1].val,
                    });
                    token.loc.end = stream[++i].loc.end;
                    stack.push(token);
                    break;
                }
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
            case EnumToken.DoubleColonTokenType:
                if (stream[i + 1]?.typ === EnumToken.IdenTokenType) {
                    Object.assign(token, {
                        typ: stream[i + 1].val === "page"
                            ? EnumToken.PseudoPageTokenType
                            : EnumToken.PseudoElementTokenType,
                        val: "::" + stream[i + 1].val,
                    });
                    token.loc.end = stream[++i].loc.end;
                    break;
                }
                else if (stream[i + 1]?.typ === EnumToken.FunctionTokenDefType) {
                    Object.assign(token, {
                        typ: EnumToken.PseudoClassFunctionTokenDefType,
                        val: "::" + stream[i + 1].val,
                    });
                    token.loc.end = stream[++i].loc.end;
                    stack.push(token);
                    break;
                }
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
            case EnumToken.StartParensTokenType:
                if (tokens.at(-2)?.typ === EnumToken.PseudoClassTokenType ||
                    tokens.at(-2)?.typ === EnumToken.PseudoElementTokenType) {
                    stack.push(Object.assign(tokens.at(-2), {
                        typ: EnumToken.PseudoClassFunctionTokenDefType,
                        chi: [],
                    }));
                    // tokens.pop();
                    break;
                }
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
            case EnumToken.EndParensTokenType:
                if (stack.length > 0 && stack.at(-1)?.typ === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }
                if (stack.at(-1)?.typ === EnumToken.PseudoClassFunctionTokenDefType ||
                    stack.at(-1)?.typ === EnumToken.PseudoElementTokenType) {
                    const token = stack.at(-1);
                    if (!(stack.at(-1).val + "()" in config.selectors)) {
                        return {
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unknown class element ${token.val}`,
                                    node: token,
                                    location: token.loc,
                                },
                            ],
                            success: false,
                        };
                    }
                    const index = tokens.indexOf(token);
                    const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, token.val + "()")?.[0]?.chi ?? [], createValidationContext(tokens.slice(index + 1, tokens.length - 1)), options);
                    if (!result.success) {
                        success = false;
                        if (result.errors.length > 0) {
                            errors.push(...result.errors);
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
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
            case EnumToken.NumberTokenType:
            case EnumToken.LiteralTokenType:
            case EnumToken.DimensionTokenType:
                if (stack.at(-1)?.typ === EnumToken.CommaTokenType) {
                    stack.pop();
                }
                if (stack.at(-1)?.typ === EnumToken.PseudoClassFunctionTokenDefType) {
                    break;
                }
            default:
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unsupported selector token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
        }
        if (token.typ === EnumToken.WhitespaceTokenType &&
            trimWhitespaceAfter.includes(tokens.at(-2)?.typ) &&
            tokens.at(-1)?.typ === EnumToken.WhitespaceTokenType) {
            tokens.pop();
        }
        else if (trimWhitespaceBefore.includes(token.typ) && tokens.at(-2)?.typ === EnumToken.WhitespaceTokenType) {
            tokens.splice(tokens.length - 2, 1);
        }
    }
    if (stack.length > 0 && stack.at(-1).typ === EnumToken.UniversalSelectorTokenType) {
        stack.pop();
    }
    if (stack.length > 0) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: `Unmatched token ${EnumToken[stack.at(-1).typ]} at ${stack.at(-1).loc.src}:${stack.at(-1).loc.sta.lin}:${stack.at(-1).loc.sta.col}`,
                    node: stack.at(-1),
                    location: stack.at(-1).loc,
                },
            ],
        };
    }
    stream.length = 0;
    stream.push(...tokens);
    if (!success && errors.length === 0) {
        errors.push({
            action: "drop",
            message: "Invalid selector",
            node: tokens[0],
            location: tokens[0].loc,
        });
    }
    return { success, errors };
}
function matchAllSyntaxes(syntaxes, context, options) {
    const result = matchSyntax(syntaxes, context, {
        ...options,
        visited: new Map(),
    });
    if (result.success && !result.context.done()) {
        const node = result.context.peek();
        return {
            ...result,
            success: false,
            token: context.peek(),
            errors: [
                ...result.errors,
                {
                    action: "drop",
                    message: `Unexpected token ${EnumToken[node?.typ]} at ${node.loc?.src}:${node.loc?.sta?.lin}:${node.loc?.sta?.col}`,
                    node,
                    syntax: result.syntaxToken ??
                        syntaxes?.reduce?.((acc, b) => acc + renderSyntax(b), "")?.trim?.() ??
                        null,
                },
            ],
        };
    }
    if (syntaxes != null && result.success && result.syntaxToken != null) {
        const index = syntaxes.indexOf(result.syntaxToken);
        if (index != -1) {
            for (let i = index; i < syntaxes.length; i++) {
                if (syntaxes[i].typ == ValidationTokenEnum.Whitespace ||
                    syntaxes[i].isOptional ||
                    syntaxes[i].isRepeatable) {
                    continue;
                }
                if (syntaxes[i].typ == ValidationTokenEnum.SemiColon && i === syntaxes.length - 1) {
                    continue;
                }
                return {
                    ...result,
                    success: false,
                    syntaxToken: syntaxes[i],
                };
            }
        }
    }
    return {
        ...result,
        errors: !result.success && result.errors.length === 0
            ? [
                {
                    action: "drop",
                    message: result.errors[0]?.message || "could not match syntax",
                    node: result.token,
                    syntax: result.syntaxToken,
                    location: result.token?.loc ?? context.tokens.at(-1)?.loc,
                },
            ]
            : result.errors,
        syntaxToken: !result.success ? result.syntaxToken : null,
    };
}
function matchListSyntax(syntax, context, options) {
    const { isList, match, isOptional, ...rest } = syntax;
    let success = true;
    let result = null;
    let tmpResult;
    let count = 0;
    let range;
    success = false;
    do {
        range = context.peekRange(EnumToken.CommaTokenType, EnumToken.CommaTokenType, 1);
        tmpResult = matchSyntax([rest], createValidationContext(range.at(-1)?.typ === EnumToken.CommaTokenType ? range.slice(0, -1) : range), options);
        if (tmpResult.success) {
            count++;
            success = true;
            result = tmpResult;
            if (Number.isFinite(match?.max?.val) && count === match.max.val) {
                context.update(range.at(-1)?.typ === EnumToken.CommaTokenType ? range.at(-2) : range.at(-1));
                break;
            }
            else {
                context.update(range.at(-1));
            }
            if (context.done()) {
                // context.end();
                break;
            }
        }
    } while (tmpResult.success && !context.done());
    if (result?.success && match != null) {
        if (count < match.min.val || (Number.isFinite(match.max) && count > match.max.val)) {
            return {
                ...result,
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: "could not match syntax",
                        node: context.peek(),
                        location: context.peek()?.loc,
                    },
                ],
            };
        }
    }
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
function matchOccurenceSyntax(syntax, context, options) {
    const { match, ...rest } = syntax;
    let result = null;
    let tmpResult;
    let count = 0;
    do {
        tmpResult = matchSyntax([rest], context.slice(), options);
        if (tmpResult.success) {
            count++;
            result = tmpResult;
            if (tmpResult.context.done()) {
                context.end();
                break;
            }
            context.update(tmpResult.context.current());
            if (match?.max?.val != null && Number.isFinite(match?.max?.val) && count === match.max.val) {
                break;
            }
        }
    } while (tmpResult.success && !context.done());
    if (match != null &&
        (count < match.min.val || (Number.isFinite(match.max?.val) && count > match.max.val))) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "could not match syntax",
                    node: context.peek(),
                    location: context.peek()?.loc,
                },
            ],
            syntaxToken: null,
            valid: true,
            context,
            token: null,
        };
    }
    return (result ?? {
        success: false,
        errors: [
            {
                action: "drop",
                message: "could not match syntax",
                node: context.peek(),
                location: context.peek().loc,
            },
        ],
        syntaxToken: syntax,
        valid: true,
        context,
        token: context.peek(),
    });
}
function matchSyntax(syntaxes, context, options) {
    if (syntaxes == null) {
        return {
            syntaxToken: null,
            token: context.peek(),
            success: true,
            valid: false,
            context,
            errors: [],
        };
    }
    syntaxes = syntaxes.slice();
    let i = -1;
    let success = false;
    let token = null;
    let result = null;
    let isOptional;
    if (context.tokens.length == 1 &&
        context.tokens[0].typ == EnumToken.IdenTokenType &&
        allValues.some((v) => equalsIgnoreCase(v, context.tokens[0].val))) {
        context.end();
        return {
            syntaxToken: null,
            token: context.peek(),
            success: true,
            valid: true,
            context,
            errors: [],
        };
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
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: "could not match syntax",
                            node: null,
                            syntax: syntaxes[i],
                        },
                    ],
                    syntaxToken: syntaxes[i],
                    valid: true,
                    context,
                    token: null,
                };
            }
            break;
        }
        if (token.typ === EnumToken.WildCardFunctionTokenType && token.val === "var") {
            result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, token.val + "()")?.[0]?.chi, createValidationContext(token.chi), options);
            if ((result.success && result.context.done()) || isOptional) {
                context.next();
                continue;
            }
            return {
                ...result,
                success: false,
                token,
                syntaxToken: syntaxes[i],
                errors: [
                    {
                        action: "drop",
                        message: "could not match syntax",
                        node: context.peek(),
                        location: context.peek().loc,
                    },
                ],
            };
        }
        // custom function token
        if (token.typ === EnumToken.CustomFunctionTokenDefType) {
            if (syntaxes[i].typ != ValidationTokenEnum.PropertyType ||
                syntaxes[i + 1].typ != ValidationTokenEnum.OpenParenthesis ||
                syntaxes[i + 2].typ == null) {
                if (!isOptional) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: "could not match syntax",
                                node: token,
                                syntax: syntaxes[i],
                            },
                        ],
                        syntaxToken: syntaxes[i],
                        valid: true,
                        context,
                        token: null,
                    };
                }
                break;
            }
            const range = trimArray(context.peekRange());
            context.next();
            i++;
            result = matchSyntax([syntaxes[i + 1]], createValidationContext(range.slice(1, -1)), options);
            if (result.success) {
                context.update(range.at(-1));
                i += 2;
            }
            return result;
        }
        if (tokensfuncDefMap.has(token.typ) &&
            token.typ === EnumToken.WildCardFunctionTokenDefType) {
            const range = trimArray(context.peekRange());
            result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, token.val + "()")?.[0]?.chi, createValidationContext(range.slice(1, -1)), options);
            if (result.success) {
                context.update(range.at(-1));
                if (context.done()) {
                    return {
                        ...result,
                        context,
                        syntaxToken: syntaxes[i + 1],
                    };
                }
                continue;
            }
            if (isOptional) {
                continue;
            }
            return result;
        }
        if (syntaxes[i].isRepeatableAtLeastOnce || syntaxes[i].isRepeatable) {
            result = matchRepeatableSyntax(syntaxes[i], context.slice(), options);
            if (result.success) {
                if (result.context.done()) {
                    context.end();
                    return { ...result, syntaxToken: syntaxes[i + 1] };
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
            result = matchListSyntax(syntaxes[i], context.slice(), options);
            if (result.success) {
                options.visited.get(token).delete(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return {
                        ...result,
                        success: true,
                        valid: true,
                        context,
                        token: null,
                        syntaxToken: syntaxes[i + 1],
                    };
                }
                context.update(result.context.current());
                let k = i + 1;
                for (; k < syntaxes.length; k++) {
                    if (syntaxes[k].typ !== ValidationTokenEnum.Whitespace) {
                        break;
                    }
                    if (syntaxes[k]?.typ === ValidationTokenEnum.Comma) {
                        i = k;
                    }
                }
                continue;
            }
            if (isOptional) {
                // eat the next ','
                if (syntaxes[i + 1]?.typ === ValidationTokenEnum.Whitespace ||
                    syntaxes[i + 1]?.typ === ValidationTokenEnum.Comma) {
                    i++;
                }
                continue;
            }
            return {
                success: false,
                valid: true,
                token,
                context,
                syntaxToken: syntaxes[i],
                errors: result.errors,
            };
        }
        if (syntaxes[i].match != null) {
            result = matchOccurenceSyntax(syntaxes[i], context.slice(), options);
            if (result.success) {
                options.visited.get(token).delete(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return {
                        ...result,
                        context,
                        syntaxToken: syntaxes[++i],
                    };
                }
                context.update(result.context.current());
                continue;
            }
            if (isOptional) {
                // eat the next ','
                if (syntaxes[i + 1]?.typ === ValidationTokenEnum.Whitespace) {
                    i++;
                }
                if (syntaxes[i + 1]?.typ === ValidationTokenEnum.Comma) {
                    i++;
                }
                continue;
            }
            return {
                success: false,
                valid: true,
                token,
                context,
                syntaxToken: syntaxes[i],
                errors: result.errors,
            };
        }
        if (!options.visited.has(token)) {
            options.visited.set(token, new Set());
        }
        if (options.visited.get(token).has(syntaxes[i])) {
            // cyclic definition
            return {
                success: false,
                valid: true,
                token,
                context,
                syntaxToken: syntaxes[i],
                errors: [],
            };
        }
        options.visited.get(token).add(syntaxes[i]);
        success = false;
        switch (syntaxes[i].typ) {
            case ValidationTokenEnum.Comma:
                if (token.typ == EnumToken.CommaTokenType) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    if (context.done()) {
                        return {
                            success: true,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: syntaxes[i + 1],
                            errors: [],
                        };
                    }
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.Colon:
                if (token.typ == EnumToken.ColonTokenType) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    if (context.done()) {
                        return {
                            success: true,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: syntaxes[i + 1],
                            errors: [],
                        };
                    }
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.Keyword:
                if (token.typ == EnumToken.IdenTokenType &&
                    token.val.toLowerCase() ===
                        syntaxes[i].val.toLowerCase()) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.DeclarationType:
                result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, syntaxes[i].val), context, options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return {
                            ...result,
                            token,
                            context,
                            syntaxToken: syntaxes[1 + i],
                        };
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
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: result.errors,
                };
            case ValidationTokenEnum.OptionalGroupToken: {
                //
                const tokens = context.split();
                let j = 0;
                for (; j < tokens.length; j++) {
                    result = matchSyntax(syntaxes[i].chi, context.slice(), options);
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
            case ValidationTokenEnum.AtRule:
                if (token.typ == EnumToken.AtRuleTokenType) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.StringToken:
                if (token.typ == EnumToken.StringTokenType || token.typ == EnumToken.UrlFunctionTokenType) {
                    success = true;
                }
                else if (token.typ === EnumToken.StringTokenType) {
                    success = token.val === syntaxes[i].val.slice(1, -1);
                }
                else if (token.typ === EnumToken.Add) {
                    success = syntaxes[i].val.slice(1, -1) === "+";
                }
                else if (token.typ === EnumToken.Mul) {
                    success = syntaxes[i].val.slice(1, -1) === "*";
                }
                else if (token.typ === EnumToken.Div) {
                    success = syntaxes[i].val.slice(1, -1) === "/";
                }
                else if (token.typ === EnumToken.Sub) {
                    success = syntaxes[i].val.slice(1, -1) === "-";
                }
                else if (token.typ === EnumToken.LiteralTokenType) {
                    success = token.val === syntaxes[i].val.slice(1, -1);
                }
                else if (token.typ == EnumToken.Plus) {
                    success = true;
                }
                if (success) {
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.SemiColon:
                if (token.typ == EnumToken.SemiColonTokenType) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.PropertyType:
                result = matchProperty(syntaxes[i], context, options);
                if (!result.success) {
                    if (isOptional) {
                        break;
                    }
                    return {
                        success: false,
                        valid: true,
                        token: context.current() ?? token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: [],
                    };
                }
                success = true;
                options.visited.get(token).delete(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return {
                        success,
                        valid: true,
                        token: null,
                        context,
                        syntaxToken: syntaxes[i + 1],
                        errors: [],
                    };
                }
                else {
                    context.update(result.context.current());
                }
                break;
            case ValidationTokenEnum.PipeToken:
                {
                    result = null;
                    const results = [];
                    let tmp = null;
                    for (const syntax of syntaxes[i].chi) {
                        tmp = matchSyntax(syntax, context.slice(), options);
                        if (tmp.success) {
                            results.push(tmp);
                            if (tmp.context.done()) {
                                context.end();
                                return { ...tmp, context, syntaxToken: syntaxes[i + 1] };
                            }
                        }
                    }
                    if (results.length > 0) {
                        result = results.reduce((a, b) => (a.context.index > b.context.index ? a : b));
                    }
                    if (result?.success) {
                        success = true;
                        options.visited.get(token).delete(syntaxes[i]);
                        if (result.context.done()) {
                            context.end();
                            return {
                                success: true,
                                valid: true,
                                token: null,
                                context,
                                syntaxToken: syntaxes[i + 1],
                                errors: [],
                            };
                        }
                        else {
                            context.update(result.context.current());
                        }
                        break;
                    }
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [
                        {
                            action: "drop",
                            message: "could not match syntax",
                            node: token,
                            location: token.loc,
                            syntax: syntaxes[i],
                        },
                    ],
                };
            case ValidationTokenEnum.Bracket:
                result = matchSyntax(syntaxes[i].chi, context.slice(), options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return {
                            success,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: syntaxes[1 + i],
                            errors: [],
                        };
                    }
                    else {
                        context.update(result.context.current());
                    }
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.ColumnToken:
                result = matchColumnSyntax(syntaxes[i], context.slice(), options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return {
                            success,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: syntaxes[1 + i],
                            errors: [],
                        };
                    }
                    else {
                        context.update(result.context.current());
                    }
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.AmpersandToken:
                result = matchAmpersandSyntax(syntaxes[i], context.slice(), options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    if (result.context.done()) {
                        context.end();
                        return {
                            success,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: syntaxes[1 + i],
                            errors: [],
                        };
                    }
                    else {
                        context.update(result.context.current());
                    }
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.PseudoClassFunctionToken:
                if (!(token.val + "()" in config.selectors)) {
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: [
                            {
                                action: "drop",
                                message: `Unknown pseudo-class selector ${token.val}()`,
                                node: token,
                            },
                        ],
                    };
                }
                result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, token.val + "()")?.[0]?.chi ?? [], createValidationContext(token.chi), options);
                if (result.success) {
                    success = true;
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: result.errors,
                };
            case ValidationTokenEnum.Function:
                if ((!tokensfuncDefMap.has(token.typ) &&
                    !funcLike.includes(token.typ) &&
                    !funcTypes.includes(token.typ)) ||
                    !("val" in token) ||
                    !equalsIgnoreCase(syntaxes[i].val, token.val.toLowerCase())) {
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: [
                            {
                                action: "drop",
                                message: `Expecting a function ${EnumToken[token.typ]}`,
                                node: token,
                            },
                        ],
                    };
                }
                if (tokensfuncDefMap.has(token.typ)) {
                    const range = context.peekRange();
                    if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                        const tk = range.at(-1);
                        return {
                            success: false,
                            valid: true,
                            token,
                            context,
                            syntaxToken: syntaxes[i],
                            errors: [
                                {
                                    action: "drop",
                                    message: `Expecting ')' at ${tk.loc?.src}:${tk.loc?.sta?.lin}:${tk.loc?.sta?.col}`,
                                    node: token,
                                },
                            ],
                        };
                    }
                    result = matchSyntax(syntaxes[i].chi, createValidationContext(range.slice(1, -1)), options);
                    if (result.success && result.context.done()) {
                        context.update(range.at(-1));
                        options.visited.get(token).delete(syntaxes[i]);
                        break;
                    }
                }
                else {
                    result = matchSyntax(syntaxes[i].chi, createValidationContext(token.chi), options);
                    if (result.success && result.context.done()) {
                        success = true;
                        options.visited.get(token).delete(syntaxes[i]);
                        context.next();
                        break;
                    }
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: result.errors,
                };
            case ValidationTokenEnum.LessThan:
                if (token.typ === EnumToken.LtTokenType) {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.Separator:
                if (token.typ === EnumToken.LiteralTokenType && token.val === "/") {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.FunctionDefinition:
                if (equalsIgnoreCase(token.val, syntaxes[i].val)) {
                    if (tokensfuncDefMap.has(token.typ)) {
                        const children = trimArray(context.peekRange());
                        result = matchSyntax((getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, syntaxes[i].val + "()")?.[0]).chi ?? [], createValidationContext(children.slice(1, -1)), options);
                        if (result.success && result.context.done()) {
                            success = true;
                            options.visited.get(token).delete(syntaxes[i]);
                            context.update(children.at(-1));
                            break;
                        }
                    }
                    else if (tokensfuncSet.has(token.typ)) {
                        result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, syntaxes[i].val + "()") ?? [], createValidationContext([token]), options);
                        if (result.success && result.context.done()) {
                            success = true;
                            options.visited.get(token).delete(syntaxes[i]);
                            context.next();
                            break;
                        }
                    }
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.OpenParenthesis:
                if (token.typ === EnumToken.StartParensTokenType) {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.CloseParenthesis:
                if (token.typ === EnumToken.EndParensTokenType) {
                    options.visited.get(token).delete(syntaxes[i]);
                    context.next();
                    break;
                }
                if (isOptional) {
                    break;
                }
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            case ValidationTokenEnum.DeclarationNameToken:
                result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, syntaxes[i].val) ?? [], context.slice(), options);
                if (!result.success) {
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: result.errors,
                    };
                }
                success = true;
                options.visited.get(token).delete(syntaxes[i]);
                if (result.context.done()) {
                    context.end();
                    return {
                        success,
                        valid: true,
                        token: null,
                        context,
                        syntaxToken: syntaxes[1 + i],
                        errors: [],
                    };
                }
                else {
                    context.update(result.context.current());
                }
                break;
            case ValidationTokenEnum.DisallowWhitespace:
                if (context.peek(0, false)?.typ === EnumToken.WhitespaceTokenType) {
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: [],
                    };
                }
                break;
            default:
                throw new Error(`Unexpected syntax ${ValidationTokenEnum[syntaxes[i].typ]}`);
        }
        if (success &&
            "range" in syntaxes[i] &&
            !(token?.typ === EnumToken.MathFunctionTokenType ||
                token?.typ === EnumToken.MathFunctionTokenDefType ||
                token?.typ === EnumToken.WildCardFunctionTokenDefType)) {
            let success = false;
            success =
                typeof token.val === "number" &&
                    token.val >=
                        syntaxes[i].range.min.val;
            if (syntaxes[i].range.min.typ === ValidationTokenEnum.Dimension) {
                success =
                    token.typ ===
                        EnumToken[
                        // @ts-expect-error
                        syntaxes[i].range.min
                            .unit];
            }
            if (success &&
                syntaxes[i].range.max != null) {
                success =
                    token.val <=
                        syntaxes[i].range.max.val;
            }
            if (!success) {
                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: [],
                };
            }
        }
    }
    return result?.success
        ? result
        : {
            success: true,
            context,
            syntaxToken: syntaxes[i] ?? null,
            token,
            valid: true,
            errors: [],
        };
}
function matchColumnSyntax(syntax, context, options) {
    let syntaxes = syntax.chi.slice();
    let i = 0;
    let success = false;
    let result;
    syntaxes = syntaxes.slice();
    for (; i < syntaxes.length; i++) {
        result = matchSyntax(syntaxes[i], context.slice(), options);
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
function matchAmpersandSyntax(syntax, context, options) {
    const syntaxes = [syntax.l, syntax.r];
    let result;
    let i;
    let success = false;
    for (i = 0; i < syntaxes.length; i++) {
        result = matchSyntax(syntaxes[i], context.slice(), options);
        if (result.success) {
            success = true;
            if (result.context.done()) {
                context.end();
                break;
            }
            context.update(result.context.current());
            syntaxes.splice(i, 1);
            i = -1;
        }
    }
    return (
    /* syntaxes.length === 0 ? */ result ?? {
        success,
        valid: true,
        token: context.peek(),
        context,
        syntaxToken: syntax,
        errors: [],
    });
}
function matchProperty(property, context, options) {
    let success = false;
    let t = context.peek()?.typ;
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
        checkCalc = context.peek().val === "calc";
    }
    if (checkCalc) {
        let result;
        const syntax = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, context.peek().val + "()")?.[0]?.chi;
        if (t === EnumToken.MathFunctionTokenType) {
            result = matchSyntax(syntax, createValidationContext(context.peek().chi), options);
            if (result.success && result.context.done()) {
                context.next();
                return {
                    success: true,
                    valid: true,
                    token: context.peek(),
                    context,
                    syntaxToken: null,
                    errors: [],
                };
            }
        }
        else {
            const range = context.peekRange();
            result = matchSyntax(syntax, createValidationContext(range.slice(1, -1)), options);
            if (result.success) {
                context.update(range.at(-1));
                return {
                    success: true,
                    valid: true,
                    token: range.at(-1),
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
        case "combinator":
            {
                const token = context.peek();
                success =
                    token != null &&
                        (token.typ == EnumToken.NextSiblingCombinatorTokenType ||
                            token.typ == EnumToken.ChildCombinatorTokenType ||
                            token.typ == EnumToken.SubsequentSiblingCombinatorTokenType ||
                            token.typ == EnumToken.ColumnCombinatorTokenType);
            }
            break;
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
                if (token?.typ == EnumToken.WhitespaceTokenType) {
                    context.next();
                    token = context.peek();
                }
                if (token?.typ == EnumToken.CommentTokenType) {
                    context.next();
                    token = context.peek();
                }
                if (token?.typ == EnumToken.CommaTokenType) {
                    context.next();
                    expectToken = true;
                }
                while ((token = context.peek()) != null) {
                    if (token.typ == EnumToken.StartParensTokenType || tokensfuncDefMap.has(token?.typ)) {
                        stack.push(token);
                    }
                    if (token.typ == EnumToken.WhitespaceTokenType || token.typ == EnumToken.CommentTokenType) {
                        context.next();
                    }
                    if (expectToken) {
                        if (token?.typ == EnumToken.CommaTokenType || token.typ == EnumToken.EndParensTokenType) {
                            return {
                                success: false,
                                valid: true,
                                token,
                                context,
                                syntaxToken: property,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Unexpected token ${EnumToken[token?.typ]} at ${token.loc?.src}:${token.loc?.sta?.lin}:${token.loc?.sta?.col}`,
                                        node: token,
                                        location: token.loc,
                                    },
                                ],
                            };
                        }
                        expectToken = false;
                    }
                    if (token.typ == EnumToken.CommaTokenType) {
                        expectToken = true;
                    }
                    if (token.typ == EnumToken.EndParensTokenType) {
                        if (stack.length > 0) {
                            stack.pop();
                        }
                        else {
                            return {
                                success: false,
                                valid: true,
                                token,
                                context,
                                syntaxToken: property,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Unexpected token ${EnumToken[token?.typ]} at ${token.loc?.src}:${token.loc?.sta?.lin}:${token.loc?.sta?.col}`,
                                        node: token,
                                        location: token.loc,
                                    },
                                ],
                            };
                        }
                    }
                    context.next();
                }
                if (stack.length > 0) {
                    token = stack.at(-1);
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: property,
                        errors: [
                            {
                                action: "drop",
                                message: `unbalanced parentheses ${EnumToken[token?.typ]} at ${token.loc?.src}:${token.loc?.sta?.lin}:${token.loc?.sta?.col}`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }
                success = !expectToken;
                if (!success) {
                    return {
                        success: false,
                        valid: true,
                        token: token ?? context.current(),
                        context,
                        syntaxToken: property,
                        errors: [],
                    };
                }
            }
            break;
        case "calc-sum": {
            const token = context.peek();
            if (token?.typ === EnumToken.ParensTokenType) {
                const result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc()")[0].chi, createValidationContext(token.chi), options);
                success = result.success && result.context.done();
                break;
            }
            if (token?.typ === EnumToken.BinaryExpressionTokenType) {
                let result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"), createValidationContext([token.l]), options);
                if (result.success) {
                    result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"), createValidationContext([token.r]), options);
                }
                success = result.success;
                break;
            }
            const result = matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"), context.slice(), options);
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
        case "at-keyword-token":
            success = context.peek()?.typ === EnumToken.AtRuleTokenType;
            break;
        case "an+b":
            {
                let token = context.peek();
                if (token == null) {
                    return {
                        success: false,
                        valid: true,
                        token: null,
                        context,
                        syntaxToken: property,
                        errors: [],
                    };
                }
                if (token.typ === EnumToken.IdenTokenType &&
                    ("even" === token.val || "odd" === token.val)) {
                    success = true;
                    break;
                }
                if (token.typ === EnumToken.NumberTokenType &&
                    Number.isInteger(token.val) &&
                    !token.toString().includes(".")) {
                    success = true;
                    break;
                }
                if (token.typ === EnumToken.LiteralTokenType || token.typ === EnumToken.IdenTokenType) {
                    let match = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(token.val);
                    success = match != null;
                    if (!success) {
                        success = /^(([+-]?[0-9]*)?n)?([+-])?$/.test(token.val);
                        if (success) {
                            token = context.peek(1);
                            success =
                                token?.typ === EnumToken.NumberTokenType &&
                                    Number.isInteger(token.val) &&
                                    !token.toString().includes(".") &&
                                    token.sign == null;
                            context.next();
                        }
                    }
                    else if (match?.[3] == null) {
                        token = context.peek(1);
                        if (token?.typ === EnumToken.Add ||
                            token?.typ === EnumToken.NextSiblingCombinatorTokenType ||
                            token?.typ === EnumToken.Sub) {
                            token = context.peek(2);
                            success =
                                token?.typ === EnumToken.NumberTokenType &&
                                    Number.isInteger(token.val) &&
                                    !token.toString().includes(".") &&
                                    token.sign == null;
                        }
                        else if (token?.typ === EnumToken.NumberTokenType) {
                            success =
                                Number.isInteger(token.val) &&
                                    !token.toString().includes(".") &&
                                    token.sign != null;
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
                if (token.typ === EnumToken.DimensionTokenType && token.unit === "n") {
                    success =
                        Number.isInteger(token.val) &&
                            !token.toString().includes(".");
                    if (!success) {
                        return {
                            success: false,
                            valid: true,
                            token: null,
                            context,
                            syntaxToken: property,
                            errors: [
                                {
                                    action: "drop",
                                    message: `expecting <dimension-token>`,
                                    node: token,
                                    location: token.loc,
                                },
                            ],
                        };
                    }
                    if (token == null) {
                        break;
                    }
                    token = context.peek(1);
                    if (token == null) {
                        break;
                    }
                    if (token.typ === EnumToken.NumberTokenType) {
                        if (Number.isInteger(token.val) &&
                            !token.toString().includes(".") &&
                            ["+", "-"].includes(token.sign)) {
                            success = true;
                            context.next();
                        }
                        break;
                    }
                    if (token?.typ === EnumToken.NextSiblingCombinatorTokenType) {
                        Object.assign(token, { typ: EnumToken.Add });
                    }
                    token = context.peek(2);
                    if (token == null) {
                        break;
                    }
                    if (token?.typ === EnumToken.NumberTokenType &&
                        Number.isInteger(token.val) &&
                        !token.toString().includes(".") &&
                        token.sign == null) {
                        success = true;
                        context.next();
                        context.next();
                    }
                    break;
                }
            }
            break;
        case "number-token":
            {
                const token = context.peek();
                success =
                    token?.typ === EnumToken.NumberTokenType &&
                        !token.val.toString().includes(".") &&
                        Number.isInteger(token.val);
            }
            break;
        case "ndashdigit-ident":
            {
                const token = context.peek();
                success =
                    (token?.typ === EnumToken.IdenTokenType || token?.typ === EnumToken.LiteralTokenType) &&
                        /^-?n[-+]\d+$/.test(token.val);
            }
            break;
        case "dimension-token":
            {
                const token = context.peek();
                success =
                    token?.typ === EnumToken.DimensionTokenType &&
                        token.unit === "n" &&
                        !token.val.toString().includes(".") &&
                        Number.isInteger(token.val);
            }
            break;
        case "quote":
        case "display-box":
        case "display-inside":
        case "display-internal":
        case "display-outside":
        case "display-legacy":
        case "content-position":
            success =
                context.peek()?.typ == EnumToken.IdenTokenType &&
                    // @ts-expect-error
                    config.syntaxes[property.val].syntax
                        .split(/[\s|]+/)
                        .includes(context.peek().val.toLowerCase());
            break;
        case "mf-name":
            {
                const token = context.peek();
                success =
                    token?.typ === EnumToken.IdenTokenType &&
                        token.val.toLowerCase() in config.mediaFeatures;
            }
            break;
        case "mf-comparison":
            {
                const token = context.peek();
                success =
                    token?.typ === EnumToken.LtTokenType ||
                        token?.typ === EnumToken.LteTokenType ||
                        token?.typ === EnumToken.GtTokenType ||
                        token?.typ === EnumToken.GteTokenType ||
                        token?.typ === EnumToken.DelimTokenType;
            }
            break;
        case "mf-gt":
            {
                const token = context.peek();
                success = token?.typ === EnumToken.GtTokenType || token?.typ === EnumToken.GteTokenType;
            }
            break;
        case "mf-lt":
            {
                const token = context.peek();
                success = token?.typ === EnumToken.LtTokenType || token?.typ === EnumToken.LteTokenType;
            }
            break;
        case "dashed-ident":
        case "extension-name":
        case "custom-property-name":
            success = context.peek()?.typ == EnumToken.DashedIdenTokenType;
            break;
        case "namespace-prefix":
        case "ident":
        case "ident-token":
        case "custom-ident":
        case "counter-name":
        case "counter-style-name":
            success =
                context.peek()?.typ == EnumToken.IdenTokenType || context.peek()?.typ == EnumToken.DashedIdenTokenType;
            if (success && context.peek()?.typ === EnumToken.IdenTokenType) {
                const val = context.peek().val.toLowerCase();
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
                    ].includes(token?.typ);
            break;
        }
        case "string": {
            const token = context.peek();
            if (token == null) {
                break;
            }
            success = token.typ === EnumToken.StringTokenType;
            break;
        }
        case "wq-name":
            // wq-name matches
            // a
            // |a
            // *|a
            // a|b
            if (context.peek()?.typ == EnumToken.Pipe) {
                const success = context.peek(1)?.typ == EnumToken.IdenTokenType;
                return {
                    success,
                    valid: true,
                    token: success ? context.update(context.peek(1)).current() : context.peek(),
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            else if (context.peek(1)?.typ == EnumToken.Pipe) {
                const success = context.peek()?.typ === EnumToken.Star && context.peek(2)?.typ === EnumToken.IdenTokenType;
                return {
                    success,
                    valid: true,
                    token: success ? context.update(context.peek(2)).current() : context.peek(),
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            else {
                const success = context.peek()?.typ == EnumToken.IdenTokenType;
                return {
                    success,
                    valid: true,
                    token: success ? context.next() : context.peek(),
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
        case "id-selector":
            success = context.peek()?.typ == EnumToken.HashTokenType;
            break;
        case "class-selector":
            success = context.peek()?.typ == EnumToken.ClassSelectorTokenType;
            break;
        case "pseudo-class-selector":
            {
                const token = context.peek();
                success =
                    token?.typ == EnumToken.PseudoClassTokenType ||
                        token?.typ == EnumToken.PseudoClassFuncTokenType ||
                        token?.typ == EnumToken.PseudoElementTokenType;
            }
            break;
        case "number":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = token.typ == EnumToken.NumberTokenType;
            }
            break;
        case "zero": {
            const token = context.peek();
            success = token?.typ == EnumToken.NumberTokenType && token.val === 0;
            break;
        }
        case "integer":
            {
                const token = context.peek();
                success =
                    token?.typ == EnumToken.NumberTokenType && Number.isInteger(Number(token.val));
            }
            break;
        case "dimension": {
            const token = context.peek();
            if (token == null) {
                break;
            }
            success =
                token?.typ == EnumToken.DimensionTokenType ||
                    token?.typ == EnumToken.AngleTokenType ||
                    token?.typ == EnumToken.LengthTokenType ||
                    token?.typ == EnumToken.PercentageTokenType ||
                    token?.typ == EnumToken.ResolutionTokenType ||
                    token?.typ == EnumToken.TimeTokenType ||
                    token?.typ == EnumToken.FrequencyTokenType ||
                    token?.typ == EnumToken.FlexTokenType;
            break;
        }
        case "angle":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = token.typ === EnumToken.AngleTokenType;
            }
            break;
        case "angle-percentage":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = token.typ === EnumToken.AngleTokenType || token.typ === EnumToken.PercentageTokenType;
            }
            break;
        case "percentage":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = token.typ === EnumToken.PercentageTokenType;
            }
            break;
        case "length-percentage":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success =
                    token.typ == EnumToken.PercentageTokenType ||
                        token.typ == EnumToken.LengthTokenType ||
                        (token.typ == EnumToken.NumberTokenType && token.val === 0);
            }
            break;
        case "flex":
            success = context.peek()?.typ == EnumToken.FlexTokenType;
            break;
        case "length": {
            const token = context.peek();
            if (token == null) {
                break;
            }
            success =
                token.typ == EnumToken.LengthTokenType ||
                    (token.typ == EnumToken.NumberTokenType && token.val === 0);
            break;
        }
        case "time":
            {
                const token = context.peek();
                if (token == null) {
                    break;
                }
                success = token.typ == EnumToken.TimeTokenType;
            }
            break;
        case "hex-color": {
            const token = context.peek();
            success =
                token != null && token.typ == EnumToken.ColorTokenType && token.kin == ColorType.HEX;
            break;
        }
        case "color":
        case "color-function":
            {
                const token = context.peek();
                const errors = [];
                if (tokensfuncDefMap.has(token?.typ)) {
                    const range = context.peekRange();
                    // if (
                    //     range.some(
                    //         (token) =>
                    //             token.typ == EnumToken.IdenTokenType &&
                    //             "hslrgbchwmyk".split("").some((t) => equalsIgnoreCase(t, (token as IdentToken).val)),
                    //     )
                    // ) {
                    const newRange = range.map((t) => cloneNode(t, true));
                    parseTokens(newRange, { parseColor: true }, errors);
                    success = newRange.length == 1 && isColor(newRange[0], errors);
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
                    // }
                    // const result = matchSyntax(
                    //     getParsedSyntax(
                    //         ValidationSyntaxGroupEnum.Syntaxes,
                    //         (token as FunctionToken).val + "()",
                    //     ) as ValidationFunctionToken[],
                    //     createValidationContext(range),
                    //     options,
                    // );
                    // if (result.success) {
                    //     context.update(range.at(-1) as Token);
                    //     return {
                    //         success: true,
                    //         valid: true,
                    //         token: context.peek(),
                    //         context,
                    //         syntaxToken: null,
                    //         errors: [],
                    //     };
                    // }
                    // return result;
                }
                // @ts-expect-error
                else if ("chi" in token) {
                    success = isColor(token, errors);
                }
                success = token != null && isColor(token, errors);
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
        case "url-token":
            success =
                context.peek()?.typ == EnumToken.StringTokenType || context.peek()?.typ == EnumToken.UrlTokenTokenType;
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
            const result = matchSelectorSyntax(tokens, [], options, property.val.startsWith("forgiving-relative-selector-list"));
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
            if (context.peek()?.typ == EnumToken.IdenTokenType &&
                context.peek(1, false)?.typ == EnumToken.StartParensTokenType) {
                context.next();
                context.next();
                success = true;
                break;
            }
            if (tokensfuncDefMap.has(context.peek()?.typ)) {
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
                token?.typ == EnumToken.IdenTokenType &&
                    // @ts-expect-error
                    config.languages.some((t) => t === token.val || token.val.startsWith(t + "-"));
            break;
        }
        case "named-color": {
            const token = context.peek();
            success =
                token != null &&
                    token.typ == EnumToken.ColorTokenType &&
                    (token.kin == ColorType.LIT ||
                        token.kin == ColorType.SYS ||
                        token.kin == ColorType.DPSYS ||
                        token.kin == ColorType.NON_STD);
            break;
        }
        case "size-feature": {
            const range = context.peekRange();
            const filteredRange = range.filter((token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
            if (filteredRange.length === 1) {
                success =
                    filteredRange[0].typ === EnumToken.IdenTokenType ||
                        filteredRange[0].typ === EnumToken.DashedIdenTokenType;
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
            if (!mFLT.has(filteredRange[1]?.typ) &&
                !mFGT.has(filteredRange[1]?.typ) &&
                filteredRange[1]?.typ !== EnumToken.ColonTokenType &&
                filteredRange[1]?.typ !== EnumToken.DelimTokenType) {
                return {
                    success: false,
                    valid: true,
                    token: filteredRange[1],
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            if (filteredRange.length === 3) {
                success = isValue(filteredRange[2]);
                if (success) {
                    context.update(filteredRange[2]);
                    return {
                        success,
                        valid: true,
                        token: filteredRange[2],
                        context,
                        syntaxToken: property,
                        errors: [],
                    };
                }
            }
            break;
        }
        case "style-feature": {
            // case 'style-feature-value':
            // match <style-feature-plain>
            // match <style-feature-boolean>
            // match <style-range>
            const range = context.peekRange();
            const filteredRange = range.filter((token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
            if (filteredRange.length === 0) {
                return {
                    success: false,
                    valid: true,
                    token: context.peek(),
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            }
            if (filteredRange.length === 1) {
                success =
                    filteredRange[0].typ === EnumToken.IdenTokenType ||
                        filteredRange[0].typ === EnumToken.DashedIdenTokenType;
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
            if (filteredRange[1]?.typ === EnumToken.ColonTokenType ||
                filteredRange[1]?.typ === EnumToken.DelimTokenType) {
                const result = isDeclarationValue(filteredRange.slice(2));
                if (result.success) {
                    context.update(filteredRange.at(-1));
                    return {
                        success: true,
                        valid: true,
                        token: filteredRange.at(-1),
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
                    errors: result.errors,
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
            if (token == null) {
                success = false;
                break;
            }
            let l;
            if (token.typ == EnumToken.UrlFunctionTokenDefType) {
                l = 0;
                let token;
                while ((token = context.peek(++l))) {
                    if (token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType) {
                        break;
                    }
                }
                if (token != null &&
                    (token.typ == EnumToken.StringTokenType ||
                        token.typ == EnumToken.IdenTokenType ||
                        token.typ == EnumToken.UrlTokenTokenType)) {
                    if (token.typ === EnumToken.IdenTokenType) {
                        while (context.peek(l + 1)?.typ === EnumToken.ClassSelectorTokenType) {
                            l++;
                        }
                    }
                    while ((token = context.peek(++l))) {
                        if (token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType) {
                            break;
                        }
                    }
                    if (token?.typ == EnumToken.EndParensTokenType) {
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
            if (token?.typ != EnumToken.UrlFunctionTokenType) {
                success = false;
                break;
            }
            l = -1;
            while (++l < token.chi.length) {
                if (token.chi[l].typ !== EnumToken.WhitespaceTokenType &&
                    token.chi[l].typ !== EnumToken.CommentTokenType) {
                    break;
                }
            }
            if (l < token.chi.length) {
                success =
                    token.chi[l].typ == EnumToken.StringTokenType ||
                        token.chi[l].typ == EnumToken.IdenTokenType ||
                        token.chi[l].typ == EnumToken.UrlTokenTokenType;
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
        default:
            if (!(property.val in config.syntaxes)) {
                console.debug("Unknown syntax", context.peek(), property);
                console.debug(context.getRemainingTokens());
                throw new Error(`Unexpected validation property ${property.val}`);
            }
            return matchSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, property.val), context, options);
    }
    if (!success &&
        context.peek()?.typ == EnumToken.IdenTokenType &&
        allValues.includes(context.peek().val)) {
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
function matchRepeatableSyntax(syntax, context, options) {
    const { isRepeatable, isOptional, isMandatatoryGroup, isRepeatableAtLeastOnce, ...rest } = syntax;
    let result = null;
    let tmpResult;
    let success = !!isRepeatable;
    let index = context.index;
    do {
        tmpResult = matchSyntax([rest], context.slice(), options);
        if (tmpResult.success) {
            result = tmpResult;
            success = true;
            if (tmpResult.context.done()) {
                context.end();
                break;
            }
            if (context.current() === tmpResult.context.current()) {
                context.next();
            }
            else {
                context.update(result.context.current());
            }
            if (index === context.index) {
                break;
            }
            index = context.index;
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

export { createValidationContext, funcTypes, getMFInfo, isMFName, isMFValue, isStyleRangeValue, matchAllSyntaxes, matchOccurenceSyntax, matchSelectorSyntax, trimArray };
