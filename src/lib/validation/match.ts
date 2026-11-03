import type { Token, ErrorDescription, ParserOptions, ValidationOptions } from "../../@types/index.d.ts";
import { type AstArena, TokenField } from "../ast/arena.ts";
import { getParsedSyntax, getSyntaxConfig } from "./config.ts";
import { EnumToken } from "../ast/types.ts";
import type { ValidationAmpersandToken, ValidationBracketToken, ValidationColumnToken, ValidationDeclarationToken, ValidationDimensionRangeMatch, ValidationDimensionToken, ValidationFunctionDefinitionToken, ValidationFunctionToken, ValidationKeywordToken, ValidationOptionalGroupToken, ValidationPipeToken, ValidationPropertyToken, ValidationStringToken, ValidationToken, ValidationValueRangeMatch } from "./parser/types.d.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum, ValidationTokenEnum } from "./parser/typedef.ts";
import type { ValidationContext, ValidationMatch } from "./types.d.ts";
import type { ValidationConfiguration, ValidationMediaFeature } from "../../@types/validation.d.ts";
import { funcLike, mFGT, mFLT, tokensfuncDefMap, tokensfuncSet } from "../syntax/constants.ts";
import { isColor } from "../syntax/syntax.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";
import { parseTokens } from "../parser/parse.ts";

const config: ValidationConfiguration = getSyntaxConfig();

// @ts-expect-error
const allValues = config.declarations.all!.syntax.split(/[\s|]+/g) as string[];

const selectorNodeTypes: EnumToken[] = [
    EnumToken.CommaTokenType,
    EnumToken.ColumnCombinatorTokenType,
    EnumToken.ChildCombinatorTokenType,
    EnumToken.NextSiblingCombinatorTokenType,
    EnumToken.SubsequentSiblingCombinatorTokenType,
];
const trimWhitespaceBefore: EnumToken[] = selectorNodeTypes.concat(
    EnumToken.DelimTokenType,
    EnumToken.DashMatchTokenType,
    EnumToken.IncludeMatchTokenType,
    EnumToken.ContainMatchTokenType,
    EnumToken.StartMatchTokenType,
    EnumToken.EndMatchTokenType,
    EnumToken.AttrEndTokenType,
);
const trimWhitespaceAfter: EnumToken[] = selectorNodeTypes.concat(
    EnumToken.DelimTokenType,
    EnumToken.DashMatchTokenType,
    EnumToken.IncludeMatchTokenType,
    EnumToken.ContainMatchTokenType,
    EnumToken.StartMatchTokenType,
    EnumToken.EndMatchTokenType,
    EnumToken.AttrStartTokenType,
);
const selectorEnumMap: Map<EnumToken, EnumToken> = new Map([
    [EnumToken.Tilda, EnumToken.SubsequentSiblingCombinatorTokenType],
    [EnumToken.GtTokenType, EnumToken.ChildCombinatorTokenType],
]);
const propertyKeywordValues = new Map<string, Set<string>>();

/**
 * @type {Array.<EnumToken>}
 */
export const funcTypes: EnumToken[] = Array.from(tokensfuncDefMap.values());

funcTypes.push(EnumToken.FunctionTokenType, EnumToken.PseudoClassFuncTokenType);

/**
 * trim leading and trailing whitespace
 * @param tokens
 * @returns
 */
export function trimArray(arena: AstArena, tokens: Token[]): Token[] {
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
export function getMFInfo(featureName: string): ValidationMediaFeature | null {
    // @ts-expect-error
    return config.mediaFeatures[featureName.toLowerCase()] as ValidationMediaFeature;
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
export function isMFValue(
    arena: AstArena,
    featureName: string,
    tokens: Token[],
    isMFRange?: boolean,
): { valid: boolean; success: boolean; isValueAllowed?: boolean } {
    // mf-value: <number> | <dimension> | <ident> | <ratio>

    tokens = tokens.filter(
        (token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType,
    );

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
    const mediaFeature = config.mediaFeatures[featureName] as ValidationMediaFeature;

    switch (mediaFeature.type) {
        case MediaFeatureType.BooleanType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] === EnumToken.NumberTokenType &&
                    (arena.numericValue[tokens[0]] === 0 || arena.numericValue[tokens[0]] === 1),
            };

        case MediaFeatureType.KeywordType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] === EnumToken.IdenTokenType &&
                    (mediaFeature.values as string[]).includes(arena.strings[arena.stringValue[tokens[0]]].toLowerCase()),
            };

        case MediaFeatureType.LengthType:
            return { valid: true, success: tokens.length === 1 && arena.dataTypes[tokens[0]] == EnumToken.LengthTokenType };

        case MediaFeatureType.IntergerType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType &&
                    !arena.numericValue[tokens[0]].toString().includes("."),
            };

        case MediaFeatureType.NumberType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
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
                success:
                    (tokens.length == 1 && arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType) ||
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
 * create validation context
 * @param tokens
 * @returns
 */
export function createValidationContext(arena: AstArena, tokens: Token[]): ValidationContext {
    tokens = trimArray(arena, tokens.filter((t) => arena.dataTypes[t] !== EnumToken.CommentTokenType));

    if (arena.typeOf(tokens.at(-1)) === EnumToken.ImportantTokenType) {
        tokens.pop();
        trimArray(arena, tokens);
    }

    const token = {
        arena,
        tokens,
        index: -1,
        current() {
            if (this.index < 0) {
                return null;
            }

            return this.tokens[this.index];
        },
        peek(offset: number = 0) {
            let index: number = this.index;
            let token: Token = this.tokens[++index];

            while (offset >= 0 && index < this.tokens.length) {
                while (
                    arena.dataTypes[token] == EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[token] == EnumToken.CommentTokenType ||
                    arena.dataTypes[token] == EnumToken.CDOCOMMTokenType
                ) {
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
         * @returns
         * @param open
         * @param close
         * @param counter
         */
        peekRange(
            close: EnumToken = EnumToken.EndParensTokenType,
            counter: number = 0,
        ): Token[] {
            let index: number = this.index;
            let token: Token = this.tokens[index];
            // track balanced parens
            let matchCount: number = 0;
            const tokens: Token[] = [];

            while (index + 1 < this.tokens.length && arena.dataTypes[this.tokens[index + 1]] === EnumToken.WhitespaceTokenType) {
                index++;
            }

            while (index + 1 < this.tokens.length) {
                token = this.tokens[++index];

                if (arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[token])) {
                    matchCount++;
                } else if (arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                    matchCount--;
                }

                if (matchCount >= 0) {
                    tokens.push(token);
                }

                if (matchCount === 0) {
                    if (close !== EnumToken.EndParensTokenType && arena.dataTypes[token] === close) {
                        counter--;
                    }
                }

                if (matchCount <= 0 && counter <= 0) {
                    break;
                }
            }

            return tokens;
        },

        // 2
        split(split: EnumToken = EnumToken.CommaTokenType): Token[][] {
            let index: number = this.index;
            let token: Token = this.tokens[index];
            // track balanced parens
            let matchCount: number = 0;
            const tokens: Token[][] = [[]];

            while (index + 1 < this.tokens.length) {
                token = this.tokens[++index];

                if (arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[token])) {
                    matchCount++;
                } else if (arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                    matchCount--;
                }

                if (matchCount === 0 && arena.dataTypes[token] === split) {
                    (tokens.at(-1) as number[]).push(token);
                    tokens.push([]);
                } else {
                    (tokens.at(-1) as number[]).push(token);
                }
            }

            return tokens;
        },

        getRemainingTokens(): Token[] {
            return this.tokens.slice(this.index + 1);
        },
        end() {
            this.index = this.tokens.length + 1;
            return this;
        },
        next() {
            let token: Token = this.tokens[++this.index];

            while (
                arena.dataTypes[token] === EnumToken.WhitespaceTokenType ||
                arena.dataTypes[token] === EnumToken.CommentTokenType ||
                arena.dataTypes[token] === EnumToken.CDOCOMMTokenType ||
                arena.dataTypes[token] === EnumToken.InvalidCommentTokenType ||
                arena.dataTypes[token] === EnumToken.BadCommentTokenType ||
                arena.dataTypes[token] === EnumToken.BadStringTokenType
            ) {
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
        update(token: Token | null | undefined) {
            const index = token == null ? -1 : this.tokens.indexOf(token);

            if (index != -1) {
                this.index = index;
            }

            return this;
        },
        done() {
            if (this.index + 1 < this.tokens.length) {
                let index: number = this.index + 1;

                while (index < this.tokens.length) {
                    if (
                        arena.dataTypes[this.tokens[index]] === EnumToken.WhitespaceTokenType ||
                        arena.dataTypes[this.tokens[index]] === EnumToken.CommentTokenType
                    ) {
                        index++;
                    } else {
                        return false;
                    }
                }
            }

            return true;
        },
    };

    return token;
}

/**
 * match selector syntax
 * @param stream
 * @param errors
 * @param options
 * @param nested
 * @returns
 */
export function matchSelectorSyntax(
    arena: AstArena,
    stream: Token[],
    errors: ErrorDescription[],
    options: ParserOptions | ValidationOptions,
    nested: boolean = true,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const stack: Token[] = [];
    const tokens: Token[] = [];

    let token: Token;
    let i: number = 0;
    let success: boolean = true;

    while (
        i < stream.length &&
        (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType)
    ) {
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
                                // @ts-expect-error
                                location: options.source!.getSourceLocation(arena.getSpanStart(stream[i])),
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

        if (
            stack.length > 0 &&
            selectorNodeTypes.includes(arena.dataTypes[stack[stack.length - 1]]) &&
            !selectorNodeTypes.includes(arena.dataTypes[token]) &&
            arena.dataTypes[token] !== EnumToken.WhitespaceTokenType &&
            arena.dataTypes[token] !== EnumToken.CommentTokenType &&
            arena.dataTypes[token] !== EnumToken.CDOCOMMTokenType
        ) {
            stack.pop();
        }

        switch (arena.dataTypes[token]) {
            case EnumToken.PseudoClassFuncTokenType:
                {
                    const result = matchAllSyntaxes(
                        arena,
                        ((
                            getParsedSyntax(
                                ValidationSyntaxGroupEnum.Selectors,
                                arena.strings[arena.stringValue[token]] + "()",
                            ) as ValidationFunctionToken[]
                        )?.[0]?.chi as ValidationToken[]) ?? [],
                        createValidationContext(arena, arena.tokens(token as Token)),
                        options,
                    );

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
                                // @ts-expect-error
                                location: options.source!.getSourceLocation(arena.getSpanStart(token)),
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
                arena.dataTypes[token] = selectorEnumMap.get(arena.dataTypes[token])!;

            case EnumToken.ColumnCombinatorTokenType:
            case EnumToken.ChildCombinatorTokenType:
            case EnumToken.UniversalSelectorTokenType:
            case EnumToken.DescendantCombinatorTokenType:
            case EnumToken.NextSiblingCombinatorTokenType:
            case EnumToken.SubsequentSiblingCombinatorTokenType:
                if (arena.dataTypes[stream[i + 1]] === EnumToken.WhitespaceTokenType) {
                    i++;
                }

                if (stack.length > 0 && arena.typeOf(stack.at(-1)) === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }

                if (stack.length > 0 && selectorNodeTypes.includes(arena.typeOf(stack.at(-1)) as EnumToken)) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected combinator ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                                // @ts-expect-error
                                location: options.source!.getSourceLocation(arena.getSpanStart(token)),
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

                if (!nested) {
                    let k: number = i + 1;

                    while (
                        k < stream.length &&
                        (arena.dataTypes[stream[k]] === EnumToken.WhitespaceTokenType ||
                            arena.dataTypes[stream[k]] === EnumToken.CommentTokenType)
                    ) {
                        k++;
                    }
                }

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

                if (arena.typeOf(stack.at(-1)) !== EnumToken.AttrStartTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                                // @ts-expect-error
                                location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                            },
                        ],
                    };
                }

                {
                    const k: number = tokens.length - 1;
                    let index: number = tokens.indexOf(stack[stack.length - 1]);
                    const slice: Token[] = [];

                    for (let n = index + 1; n < k; n++) {
                        if (
                            arena.dataTypes[tokens[n]] === EnumToken.WhitespaceTokenType ||
                            arena.dataTypes[tokens[n]] === EnumToken.CommentTokenType ||
                            arena.dataTypes[tokens[n]] === EnumToken.CDOCOMMTokenType
                        ) {
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

                    if (
                        arena.dataTypes[slice[0]] === EnumToken.StringTokenType &&
                        /^[a-zA-Z0-9_-]+$/.test(arena.strings[arena.stringValue[slice[0]]].slice(1, -1))
                    ) {
                        arena.setStr(slice[0], arena.strings[arena.stringValue[slice[0]]].slice(1, -1));
                        arena.dataTypes[slice[0]] = EnumToken.IdenTokenType;
                    }

                    slice.shift();

                    if (slice.length === 0) {
                        stack.pop();
                        break;
                    }

                    if (
                        arena.dataTypes[slice[0]] !== EnumToken.IdenTokenType ||
                        (arena.strings[arena.stringValue[slice[0]]] != "i" && arena.strings[arena.stringValue[slice[0]]] != "s")
                    ) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[arena.dataTypes[slice[0]]]}`,
                                    node: slice[0],
                                    // @ts-expect-error
                                    location: options.source!.getSourceLocation(arena.getSpanStart(slice[0])),
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
                            // @ts-expect-error
                            location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                        },
                    ],
                };

            case EnumToken.EndParensTokenType:
                if (stack.length > 0 && arena.typeOf(stack.at(-1)) === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }

                if (
                    arena.typeOf(stack.at(-1)) === EnumToken.PseudoClassFunctionTokenDefType ||
                    arena.typeOf(stack.at(-1)) === EnumToken.PseudoElementTokenType
                ) {
                    const token = stack.at(-1);

                    const index: number = tokens.indexOf(token as Token);
                    const result = matchAllSyntaxes(
                        arena,
                        ((
                            getParsedSyntax(
                                ValidationSyntaxGroupEnum.Selectors,
                                arena.strings[arena.stringValue[token as Token]] + "()",
                            ) as ValidationFunctionToken[]
                        )?.[0]?.chi as ValidationToken[]) ?? [],
                        createValidationContext(arena, tokens.slice(index + 1, tokens.length - 1)),
                        options,
                    );

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
                            // @ts-expect-error
                            location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                        },
                    ],
                };

            case EnumToken.NumberTokenType:
            case EnumToken.LiteralTokenType:
            case EnumToken.DimensionTokenType:
                if (arena.typeOf(stack.at(-1)) === EnumToken.PseudoClassFunctionTokenDefType) {
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
                            // @ts-expect-error
                            location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                        },
                    ],
                };
        }

        if (
            arena.dataTypes[token] === EnumToken.WhitespaceTokenType &&
            trimWhitespaceAfter.includes(arena.typeOf(tokens.at(-2)) as EnumToken) &&
            arena.typeOf(tokens.at(-1)) === EnumToken.WhitespaceTokenType
        ) {
            tokens.pop();
        } else if (trimWhitespaceBefore.includes(arena.typeOf(token) as EnumToken) && arena.typeOf(tokens.at(-2)) === EnumToken.WhitespaceTokenType) {
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
                    // @ts-expect-error
                    location: options.source!.getSourceLocation(arena.getSpanStart(stack[stack.length - 1])),
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
 * matches all syntaxes
 * @param syntaxes
 * @param context
 * @param options
 * @returns
 */
export function matchAllSyntaxes(
    arena: AstArena,
    syntaxes: ValidationToken[] | null,
    context: ValidationContext,
    options: ParserOptions,
): ValidationMatch {
    const result = matchSyntax(arena, syntaxes, context, {
        ...options,
        visited: new Map<Token, Set<ValidationToken>>(),
    }) as ValidationMatch;

    if (syntaxes != null && result.success && result.syntaxToken != null) {
        const index: number = syntaxes.indexOf(result.syntaxToken);

        if (index != -1) {
            for (let i = index; i < syntaxes.length; i++) {
                if (
                    syntaxes[i].typ == ValidationTokenEnum.Whitespace ||
                    syntaxes[i].isOptional ||
                    syntaxes[i].isRepeatable ||
                    syntaxes[i].match?.min?.val === 0
                ) {
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
        errors:
            !result.success && result.errors.length === 0
                ? [
                      {
                          action: "drop",
                          message: result.errors[0]?.message || "could not match syntax",
                          node: result.token,
                          syntax: result.syntaxToken,
                          location: options.source!.getSourceLocation(
                              arena.getSpanStart(result.token ?? (context.tokens[context.tokens.length - 1] as Token)),
                          ),
                      },
                  ]
                : result.errors,
        syntaxToken: !result.success ? result.syntaxToken : null,
    };
}

/**
 * matches a list of syntaxes
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchListSyntax(
    arena: AstArena,
    syntax: ValidationToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const { isList, match, isOptional, ...rest } = syntax;
    let success: boolean = true;
    let result: ValidationMatch | null = null;
    let tmpResult: ValidationMatch;
    let count: number = 0;
    let range: Token[];
    let done: boolean = false;

    success = false;

    do {
        range = context.peekRange(EnumToken.CommaTokenType, 1);
        tmpResult = matchSyntax(
            arena,
            [rest],
            createValidationContext(
                arena,
                arena.typeOf(range.at(-1)) === EnumToken.CommaTokenType ? range.slice(0, -1) : range,
            ),
            options,
        );

        if (tmpResult.success) {
            count++;
            success = true;
            result = tmpResult;

            if (Number.isFinite(match?.max?.val) && count === (match!.max!.val as number)) {
                context.update(
                    arena.typeOf(range.at(-1)) === EnumToken.CommaTokenType ? (range.at(-2)) : (range.at(-1)),
                );

                break;
            } else {
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
              errors: [] as ErrorDescription[],
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
export function matchOccurenceSyntax(
    arena: AstArena,
    syntax: ValidationToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const { match, ...rest } = syntax;
    let result: ValidationMatch | null = null;
    let tmpResult: ValidationMatch;
    let count: number = 0;

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

            if (match?.max?.val != null && Number.isFinite(match?.max?.val) && count === (match!.max!.val as number)) {
                break;
            }
        }
    } while (tmpResult.success && !context.done());

    if (
        result == null ||
        (match != null &&
            (count < match!.min!.val || (Number.isFinite(match!.max?.val) && count > (match!.max!.val as number))))
    ) {
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

    return result as ValidationMatch;
}

/**
 * matches a list of syntaxes
 * @param syntaxes
 * @param context
 * @param options
 * @returns
 */
function matchSyntax(
    arena: AstArena,
    syntaxes: ValidationToken[] | null,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
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

    let i: number = -1;
    let success: boolean = false;
    let token: Token | null = null;
    let result: ValidationMatch | null = null;
    let isOptional: boolean;

    if (
        context.tokens.length == 1 &&
        arena.dataTypes[context.tokens[0]] == EnumToken.IdenTokenType &&
        allValues.some((v) => equalsIgnoreCase(v, arena.strings[arena.stringValue[context.tokens[0]]]))
    ) {
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

        if (arena.dataTypes[token] === EnumToken.WildCardFunctionTokenType && arena.strings[arena.stringValue[token]] === "var") {
            result = matchSyntax(
                arena,
                (
                    getParsedSyntax(
                        ValidationSyntaxGroupEnum.Syntaxes,
                        arena.strings[arena.stringValue[token]] + "()",
                    ) as ValidationFunctionToken[]
                )?.[0]?.chi,
                createValidationContext(arena, arena.tokens(token as Token)),
                options,
            );

            if (result.success && result.context.done()) {
                context.next();
                continue;
            }
        }

        if (
            // @ts-ignore
            arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType
        ) {
            const range = trimArray(arena, context.peekRange());

            result = matchSyntax(
                arena,
                (
                    getParsedSyntax(
                        ValidationSyntaxGroupEnum.Syntaxes,
                        arena.strings[arena.stringValue[token]] + "()",
                    ) as ValidationFunctionToken[]
                )?.[0]?.chi as ValidationToken[],

                createValidationContext(arena, range.slice(1, -1)),
                options,
            );

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
        }

        if (syntaxes[i].isRepeatableAtLeastOnce || syntaxes[i].isRepeatable) {
            result = matchRepeatableSyntax(arena, syntaxes[i], context.slice(), options);

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
            result = matchListSyntax(arena, syntaxes[i], context.slice(), options);

            if (result.success) {
                (options.visited!.get(token) as Set<ValidationToken>)?.delete?.(syntaxes[i]);

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
                continue;
            }

            if (isOptional) {
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
            result = matchOccurenceSyntax(arena, syntaxes[i], context.slice(), options);

            if (result.success) {
                (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

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

        if (!options.visited!.has(token)) {
            options.visited!.set(token, new Set<ValidationToken>());
        }

        if ((options.visited!.get(token) as Set<ValidationToken>)!.has(syntaxes[i])) {
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

        (options.visited!.get(token) as Set<ValidationToken>)!.add(syntaxes[i]);
        success = false;

        switch (syntaxes[i].typ) {
            case ValidationTokenEnum.Comma:
                if (arena.dataTypes[token] == EnumToken.CommaTokenType) {
                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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

            case ValidationTokenEnum.Keyword:
                if (
                    arena.dataTypes[token] == EnumToken.IdenTokenType &&
                    arena.strings[arena.stringValue[token]].toLowerCase() ===
                        (syntaxes[i] as ValidationKeywordToken).val.toLowerCase()
                ) {
                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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
                result = matchSyntax(
                    arena,
                    getParsedSyntax(
                        ValidationSyntaxGroupEnum.Declarations,
                        (syntaxes[i] as ValidationDeclarationToken).val,
                    ),
                    context,
                    options,
                );

                if (result.success) {
                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                    if (result.context.done()) {
                        context.end();

                        return {
                            ...result,
                            token,
                            context,
                            syntaxToken: syntaxes[1 + i],
                        };
                    } else {
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
                let j: number = 0;

                for (; j < tokens.length; j++) {
                    result = matchSyntax(arena, (syntaxes[i] as ValidationOptionalGroupToken).chi, context.slice(), options);

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

            case ValidationTokenEnum.StringToken as ValidationTokenEnum:
                if (arena.dataTypes[token] === EnumToken.Add) {
                    success = (syntaxes[i] as ValidationStringToken).val.slice(1, -1) === "+";
                } else if (arena.dataTypes[token] === EnumToken.Sub) {
                    success = (syntaxes[i] as ValidationStringToken).val.slice(1, -1) === "-";
                } else if (arena.dataTypes[token] === EnumToken.LiteralTokenType) {
                    success = arena.strings[arena.stringValue[token]] === (syntaxes[i] as ValidationStringToken).val.slice(1, -1);
                } else if (arena.dataTypes[token] == EnumToken.Plus) {
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

            case ValidationTokenEnum.PropertyType:
                result = matchProperty(arena, syntaxes[i] as ValidationPropertyToken, context, options);

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
                (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

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
                } else {
                    context.update(result.context.current());
                }

                break;

            case ValidationTokenEnum.PipeToken:
                {
                    result = null;
                    let tmp: ValidationMatch | null = null;

                    for (const syntax of (syntaxes[i] as ValidationPipeToken).chi) {
                        tmp = matchSyntax(arena, syntax, context.slice(), options);

                        if (tmp.success) {
                            if (result == null || tmp.context.index >= result.context.index) {
                                result = tmp;
                            }

                            if (tmp.context.done()) {
                                context.end();
                                return { ...tmp, context, syntaxToken: syntaxes[i + 1] };
                            }
                        }
                    }

                    if (result?.success) {
                        success = true;
                        options.visited!.get(token)!.delete(syntaxes[i]);

                        context.update(result!.context.current());

                        break;
                    }
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
                            // @ts-ignore
                            // location: options.source!.getSourceLocation(token[LOC]?.sta),
                            syntax: syntaxes[i],
                        },
                    ],
                };

            case ValidationTokenEnum.Bracket:
                result = matchSyntax(arena, (syntaxes[i] as ValidationBracketToken).chi, context.slice(), options);

                if (result.success) {
                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

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
                    } else {
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
                result = matchColumnSyntax(arena, syntaxes[i] as ValidationColumnToken, context.slice(), options);

                if (result.success) {
                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

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
                    } else {
                        context.update(result.context.current());
                    }

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
                result = matchAmpersandSyntax(arena, syntaxes[i] as ValidationAmpersandToken, context.slice(), options);

                if (result.success) {
                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

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
                    } else {
                        context.update(result.context.current());
                    }

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

            case ValidationTokenEnum.Function:
                if (
                    (!tokensfuncDefMap.has(arena.dataTypes[token]) &&
                        !funcLike.includes(arena.dataTypes[token]) &&
                        !funcTypes.includes(arena.dataTypes[token])) ||
                    !equalsIgnoreCase(
                        (syntaxes[i] as ValidationFunctionToken).val,
                        arena.strings[arena.stringValue[token]].toLowerCase(),
                    )
                ) {
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: [
                            {
                                action: "drop",
                                message: `Expecting a function ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                            },
                        ],
                    };
                }

                if (tokensfuncDefMap.has(arena.dataTypes[token])) {
                    const range = context.peekRange();

                    result = matchSyntax(
                        arena,
                        (syntaxes[i] as ValidationFunctionToken).chi as ValidationToken[],
                        createValidationContext(arena, range.slice(1, -1)),
                        options,
                    );

                    if (result.success && result.context.done()) {
                        context.update(range.at(-1));
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        break;
                    }
                } else {
                    result = matchSyntax(
                        arena,
                        (syntaxes[i] as ValidationFunctionToken).chi as ValidationToken[],
                        createValidationContext(arena, arena.tokens(token as Token)),
                        options,
                    );

                    if (result.success && result.context.done()) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }
                }

                return {
                    success: false,
                    valid: true,
                    token,
                    context,
                    syntaxToken: syntaxes[i],
                    errors: result.errors,
                };

            case ValidationTokenEnum.Separator:
                if (arena.dataTypes[token] === EnumToken.LiteralTokenType && arena.strings[arena.stringValue[token]] === "/") {
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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
                if (
                    arena.strings[arena.stringValue[token]] &&
                    equalsIgnoreCase(
                        arena.strings[arena.stringValue[token]],
                        (syntaxes[i] as ValidationFunctionDefinitionToken).val,
                    )
                ) {
                    if (tokensfuncDefMap.has(arena.dataTypes[token])) {
                        const children = trimArray(arena, context.peekRange());

                        result = matchSyntax(
                            arena,
                            (
                                (
                                    getParsedSyntax(
                                        ValidationSyntaxGroupEnum.Syntaxes,
                                        (syntaxes[i] as ValidationFunctionDefinitionToken).val + "()",
                                    ) as ValidationFunctionToken[] as ValidationToken[]
                                )?.[0] as ValidationFunctionToken
                            ).chi ?? [],
                            createValidationContext(arena, children.slice(1, -1)),
                            options,
                        );

                        if (result.success && result.context.done()) {
                            success = true;
                            (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                            context.update(children.at(-1));
                            break;
                        }
                    } else if (tokensfuncSet.has(arena.dataTypes[token])) {
                        result = matchSyntax(
                            arena,
                            (getParsedSyntax(
                                ValidationSyntaxGroupEnum.Syntaxes,
                                (syntaxes[i] as ValidationFunctionDefinitionToken).val + "()",
                            ) as ValidationFunctionToken[] as ValidationToken[]) ?? [],
                            createValidationContext(arena, [token]),
                            options,
                        );

                        if (result.success && result.context.done()) {
                            success = true;
                            (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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
                if (arena.dataTypes[token] === EnumToken.StartParensTokenType) {
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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

            case ValidationTokenEnum.OpenCurlyBrace:
                if (arena.dataTypes[token] === EnumToken.BlockStartTokenType) {
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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

            case ValidationTokenEnum.CloseParenthesis:
                if (arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
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

            default:
                throw new Error(`Unexpected syntax ${ValidationTokenEnum[syntaxes[i].typ]}`);
        }

        if (
            success &&
            "range" in syntaxes[i] &&
            !(
                arena.dataTypes[token] === EnumToken.MathFunctionTokenType ||
                arena.dataTypes[token] === EnumToken.MathFunctionTokenDefType ||
                arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType
            )
        ) {
            let success = false;
            success =
                !arena.hasFraction(token) &&
                (arena.numericValue[token] as number) >=
                    (syntaxes[i].range as ValidationValueRangeMatch | ValidationDimensionRangeMatch).min.val;

            if ((syntaxes[i].range!.min as ValidationToken).typ === ValidationTokenEnum.Dimension) {
                success =
                    arena.dataTypes[token] ===
                    (EnumToken[
                        // @ts-expect-error
                        ((syntaxes[i].range as ValidationDimensionRangeMatch)!.min as ValidationDimensionToken)!
                            .unit! as keyof EnumToken
                    ] as EnumToken);
            }

            if (
                success &&
                (syntaxes[i].range as ValidationValueRangeMatch | ValidationDimensionRangeMatch).max != null
            ) {
                success =
                    (arena.numericValue[token] as number) <=
                    (syntaxes[i].range as ValidationValueRangeMatch | ValidationDimensionRangeMatch).max!.val;
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

/**
 * matches a column of syntaxes
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
function matchColumnSyntax(
    arena: AstArena,
    syntax: ValidationColumnToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    let syntaxes: ValidationToken[][] = (syntax as ValidationColumnToken).chi.slice();
    let i: number = 0;
    let success: boolean = false;
    let result: ValidationMatch;

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
function matchAmpersandSyntax(
    arena: AstArena,
    syntax: ValidationAmpersandToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const syntaxes = [syntax.l, syntax.r];
    let result: ValidationMatch;
    let i: number;
    let success: boolean = false;

    for (i = 0; i < syntaxes.length; i++) {
        result = matchSyntax(arena, syntaxes[i], context.slice(), options);

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

    return result!;
}

/**
 * matches a property
 * @param property
 * @param context
 * @param options
 * @returns
 */
function matchProperty(
    arena: AstArena,
    property: ValidationPropertyToken,
    context: ValidationContext,
    options: ParserOptions | ValidationOptions,
): ValidationMatch {
    let success: boolean = false;
    const token = context.peek();
    let t: EnumToken = arena.typeOf(token) as EnumToken;
    let checkCalc: boolean =
        (t == EnumToken.MathFunctionTokenDefType || t == EnumToken.MathFunctionTokenType) &&
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
        checkCalc = arena.strings[arena.stringValue[token as Token]] === "calc";
    }

    if (checkCalc) {
        let result: ValidationMatch;
        const syntax = (
            getParsedSyntax(
                ValidationSyntaxGroupEnum.Syntaxes,
                arena.strings[arena.stringValue[token as Token]] + "()",
            ) as ValidationFunctionToken[]
        )?.[0]?.chi as ValidationToken[];

        if (t === EnumToken.MathFunctionTokenType) {
            result = matchSyntax(
                arena,
                syntax,
                createValidationContext(arena, arena.tokens(token as Token)),
                options as ValidationOptions,
            );

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
        } else {
            const range = context.peekRange();
            result = matchSyntax(arena, syntax, createValidationContext(arena, range.slice(1, -1)), options as ValidationOptions);

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
                let expectToken: boolean = true;
                let token: Token | null;

                const stack: Token[] = [];

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
                            } else {
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

            if (arena.typeOf(token) === EnumToken.BinaryExpressionTokenType) {
                let result = matchSyntax(
                    arena,
                    getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"),
                    createValidationContext(arena, [arena.field(token as Token, TokenField.L)]),
                    options,
                );
                if (result.success) {
                    result = matchSyntax(
                        arena,
                        getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"),
                        createValidationContext(arena, [arena.field(token as Token, TokenField.R)]),
                        options,
                    );
                }

                success = result.success;
                break;
            }

            const result = matchSyntax(
                arena,
                getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"),
                context.slice(),
                options,
            );

            success = result.success;

            if (success) {
                if (result.context.done()) {
                    context.end();
                } else {
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
                    arena.typeOf(token) === EnumToken.IdenTokenType &&
                    ("even" === arena.strings[arena.stringValue[token as Token]] ||
                        "odd" === arena.strings[arena.stringValue[token as Token]])
                ) {
                    success = true;
                    break;
                }

                if (
                    arena.typeOf(token) === EnumToken.NumberTokenType &&
                    Number.isInteger(arena.numericValue[token as Token])
                ) {
                    success = true;
                    break;
                }

                if (arena.typeOf(token) === EnumToken.LiteralTokenType || arena.typeOf(token) === EnumToken.IdenTokenType) {
                    let match = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(
                        arena.strings[arena.stringValue[token as Token]],
                    );

                    success = match != null;

                    if (match?.[3] == null) {
                        token = context.peek(1);

                        if (
                            arena.typeOf(token) === EnumToken.Add ||
                            arena.typeOf(token) === EnumToken.NextSiblingCombinatorTokenType ||
                            arena.typeOf(token) === EnumToken.Sub
                        ) {
                            token = context.peek(2);

                            success =
                                arena.typeOf(token) === EnumToken.NumberTokenType &&
                                Number.isInteger(arena.numericValue[token as Token]);
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
                    arena.typeOf(token) === EnumToken.DimensionTokenType &&
                    arena.strings[arena.unit[token as Token]] === "n"
                ) {
                    success = Number.isInteger(arena.numericValue[token as Token]);

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
                        arena.typeOf(token) === EnumToken.NumberTokenType &&
                        Number.isInteger(arena.numericValue[token as Token])
                    ) {
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
                values = new Set(
                    (config.syntaxes as unknown as Record<string, { syntax: string }>)[property.val].syntax.split(
                        /[\s|]+/,
                    ),
                );
                propertyKeywordValues.set(property.val, values);
            }

            success = arena.typeOf(token) == EnumToken.IdenTokenType && values.has(arena.strings[arena.stringValue[token as Token]].toLowerCase());
            break;
        }

        case "mf-name":
            {
                const token = context.peek();
                success =
                    arena.typeOf(token) === EnumToken.IdenTokenType &&
                    arena.strings[arena.stringValue[token as Token]].toLowerCase() in config.mediaFeatures;
            }

            break;

        case "dashed-ident":
        case "extension-name":
        case "custom-property-name":
            success = arena.typeOf(context.peek()) == EnumToken.DashedIdenTokenType;
            break;

        case "namespace-prefix":
        case "ident":
        case "ident-token":
        case "custom-ident":
        case "counter-name":
        case "counter-style-name":
            success = arena.typeOf(token) == EnumToken.IdenTokenType || arena.typeOf(token) == EnumToken.DashedIdenTokenType;

            if (success && arena.typeOf(token) === EnumToken.IdenTokenType) {
                const val: string = arena.strings[arena.stringValue[token as Token]].toLowerCase();
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

            success = arena.typeOf(token) === EnumToken.StringTokenType;
            break;
        }

        case "wq-name": {
            const success = arena.typeOf(context.peek()) == EnumToken.IdenTokenType;

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

                success = arena.typeOf(token) == EnumToken.NumberTokenType;
            }

            break;

        case "zero": {
            const token = context.peek();
            success = arena.typeOf(token) == EnumToken.NumberTokenType && arena.numericValue[token as Token] === 0;
            break;
        }

        case "integer":
            {
                const token = context.peek();

                success =
                    arena.typeOf(token) == EnumToken.NumberTokenType && Number.isInteger(Number(arena.numericValue[token as Token]));
            }
            break;

        case "dimension": {
            const token = context.peek();

            success =
                arena.typeOf(token) == EnumToken.DimensionTokenType ||
                arena.typeOf(token) == EnumToken.AngleTokenType ||
                arena.typeOf(token) == EnumToken.LengthTokenType ||
                arena.typeOf(token) == EnumToken.PercentageTokenType ||
                arena.typeOf(token) == EnumToken.ResolutionTokenType ||
                arena.typeOf(token) == EnumToken.TimeTokenType ||
                arena.typeOf(token) == EnumToken.FrequencyTokenType ||
                arena.typeOf(token) == EnumToken.UserDefinedDimensionTokenType ||
                arena.typeOf(token) == EnumToken.FlexTokenType;
            break;
        }

        case "angle":
            {
                const token = context.peek();

                success = arena.typeOf(token) === EnumToken.AngleTokenType || arena.typeOf(token) === EnumToken.UserDefinedDimensionTokenType;
            }

            break;

        case "angle-percentage":
            {
                const token = context.peek();

                success = arena.typeOf(token) === EnumToken.AngleTokenType || arena.typeOf(token) === EnumToken.UserDefinedDimensionTokenType || arena.typeOf(token) === EnumToken.PercentageTokenType;
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
                    arena.typeOf(token) == EnumToken.PercentageTokenType ||
                    arena.typeOf(token) == EnumToken.LengthTokenType ||
                    arena.typeOf(token) == EnumToken.UserDefinedDimensionTokenType ||
                    (arena.typeOf(token) == EnumToken.NumberTokenType && arena.numericValue[token as Token] === 0);
            }
            break;

        case "flex":
            success = arena.typeOf(context.peek()) == EnumToken.FlexTokenType || arena.typeOf(context.peek()) == EnumToken.UserDefinedDimensionTokenType;
            break;

        case "length": {
            const token = context.peek();

            success =
                arena.typeOf(token) == EnumToken.LengthTokenType ||
                arena.typeOf(token) == EnumToken.UserDefinedDimensionTokenType ||
                (arena.typeOf(token) == EnumToken.NumberTokenType && arena.numericValue[token as Token] === 0);
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
                const errors: ErrorDescription[] = [];

                if (tokensfuncDefMap.has(arena.typeOf(token) as EnumToken)) {
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
            const result = matchSelectorSyntax(
                arena,
                tokens,
                [],
                options,
                property.val.startsWith("forgiving-relative-selector-list"),
            );

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
            if (tokensfuncDefMap.has(arena.typeOf(context.peek()) as EnumToken)) {
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
                arena.typeOf(token) == EnumToken.IdenTokenType &&
                // @ts-expect-error
                (config.languages as string[]).some(
                    (t) => t === arena.strings[arena.stringValue[token as Token]] || arena.strings[arena.stringValue[token as Token]].startsWith(t + "-"),
                );
            break;
        }

        case "size-feature": {
            const range = context.peekRange();

            const filteredRange = range.filter(
                (token: Token) =>
                    arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType,
            );

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

            if (
                !mFLT.has(arena.dataTypes[filteredRange[1]]) &&
                !mFGT.has(arena.dataTypes[filteredRange[1]]) &&
                arena.dataTypes[filteredRange[1]] !== EnumToken.ColonTokenType &&
                arena.dataTypes[filteredRange[1]] !== EnumToken.DelimTokenType
            ) {
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
            const filteredRange = range.filter(
                (token: Token) =>
                    arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType,
            );

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

            let l: number;

            if (arena.typeOf(token) == EnumToken.UrlFunctionTokenDefType) {
                l = 0;
                let token: Token | null;

                while ((token = context.peek(++l))) {
                    if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType) {
                        break;
                    }
                }

                if (
                    token != null &&
                    (arena.dataTypes[token] == EnumToken.StringTokenType ||
                        arena.dataTypes[token] == EnumToken.IdenTokenType ||
                        arena.dataTypes[token] == EnumToken.UrlTokenTokenType)
                ) {
                    while ((token = context.peek(++l))) {
                        if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType) {
                            break;
                        }
                    }

                    if (arena.typeOf(token) == EnumToken.EndParensTokenType) {
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

            if (arena.typeOf(token) != EnumToken.UrlFunctionTokenType) {
                success = false;
                break;
            }

            l = -1;

            const urlTokens: Token[] = arena.tokens(token as Token);

            while (++l < urlTokens.length) {
                if (
                    arena.dataTypes[urlTokens[l]] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[urlTokens[l]] !== EnumToken.CommentTokenType
                ) {
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
            success = arena.typeOf(context.peek()) == EnumToken.CssTypeTokenType;

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

            success = arena.typeOf(token) == EnumToken.CustomFunctionTokenDefType;

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
            success = arena.typeOf(context.peek()) == EnumToken.StartParensTokenType;

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

    if (
        !success &&
        arena.typeOf(context.peek()) == EnumToken.IdenTokenType &&
        allValues.includes(arena.strings[arena.stringValue[context.peek() as Token]])
    ) {
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
function matchRepeatableSyntax(
    arena: AstArena,
    syntax: ValidationToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const { isRepeatable, isOptional, isMandatatoryGroup, isRepeatableAtLeastOnce, ...rest } = syntax;
    let result: ValidationMatch | null = null;
    let tmpResult: ValidationMatch;
    let success: boolean = !!isRepeatable;

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
