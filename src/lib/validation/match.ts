import type { AstNode, Token, ErrorDescription, ParserOptions, ValidationOptions } from "../../@types/index.d.ts";
import { type AstArena, TokenField } from "../ast/arena.ts";
import { getParsedSyntax, getSyntax, getSyntaxConfig, hasSyntax } from "./config.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import type { ValidationAmpersandToken, ValidationBracketToken, ValidationColumnToken, ValidationDeclarationToken, ValidationDimensionRangeMatch, ValidationDimensionToken, ValidationFunctionDefinitionToken, ValidationFunctionToken, ValidationKeywordToken, ValidationOptionalGroupToken, ValidationPipeToken, ValidationPropertyToken, ValidationStringToken, ValidationToken, ValidationValueRangeMatch } from "./parser/types.d.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum, ValidationTokenEnum } from "./parser/typedef.ts";
import type { ValidationContext, ValidationMatch } from "./types.d.ts";
import type { ValidationConfiguration, ValidationMediaFeature } from "../../@types/validation.d.ts";
import { funcLike, mFGT, mFLT, tokensfuncDefMap, tokensfuncSet } from "../syntax/constants.ts";
import { isColor } from "../syntax/syntax.ts";
import { equalsIgnoreCase, lowercase } from "../parser/utils/text.ts";
import { parseTokens } from "../parser/parse.ts";

const config: ValidationConfiguration = getSyntaxConfig();

// @ts-expect-error
const allValues = config.declarations.all!.syntax.split(/[\s|]+/g) as string[];

/**
 * true if the value is a css wide keyword (`inherit`, `initial`, ...), ignoring the case
 * @param value
 */
function isCssWideKeyword(value: string): boolean {
    for (let i = 0; i < allValues.length; i++) {
        if (equalsIgnoreCase(allValues[i], value)) {
            return true;
        }
    }

    return false;
}

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
 * empty error list shared by the results
 */
const noErrors: ErrorDescription[] = Object.freeze([]) as unknown as ErrorDescription[];

/**
 * allocate a result. the results are passed to the matching functions that fill them (see {@link setMatch})
 */
function createMatch(): ValidationMatch {
    return {
        success: false,
        valid: true,
        token: null,
        context: null as unknown as ValidationContext,
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
function setMatch(
    out: ValidationMatch,
    success: boolean,
    valid: boolean,
    token: Token | null,
    context: ValidationContext,
    syntaxToken: ValidationToken | null,
    errors: ErrorDescription[],
): ValidationMatch {
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
function ownErrors(errors: ErrorDescription[]): ErrorDescription[] {
    return errors === noErrors ? [] : errors;
}

/**
 * copy a result
 * @param out
 * @param from
 */
function copyMatch(out: ValidationMatch, from: ValidationMatch): ValidationMatch {
    return setMatch(out, from.success, from.valid, from.token, from.context, from.syntaxToken, from.errors);
}

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
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    (arena.dataTypes[tokens[0]] == EnumToken.LengthTokenType ||
                        // a length may be the number 0: `(width > 0)`
                        (arena.dataTypes[tokens[0]] == EnumToken.NumberTokenType &&
                            arena.numericValue[tokens[0]] === 0 &&
                            !arena.hasFraction(tokens[0]))),
            };

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
 * validation context: a cursor over the tokens being validated. the methods are shared by all the contexts
 */
class ValidationTokenContext implements ValidationContext {
    arena: AstArena;
    tokens: Token[];
    index: number;

    constructor(arena: AstArena, tokens: Token[], index: number) {
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

    peek(offset: number = 0) {
        let index: number = this.index;
        let token: Token = this.tokens[++index];

        while (offset >= 0 && index < this.tokens.length) {
            while (
                this.arena.dataTypes[token] == EnumToken.WhitespaceTokenType ||
                this.arena.dataTypes[token] == EnumToken.CommentTokenType ||
                this.arena.dataTypes[token] == EnumToken.CDOCOMMTokenType
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
    }


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

        while (index + 1 < this.tokens.length && this.arena.dataTypes[this.tokens[index + 1]] === EnumToken.WhitespaceTokenType) {
            index++;
        }

        while (index + 1 < this.tokens.length) {
            token = this.tokens[++index];

            if (this.arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(this.arena.dataTypes[token])) {
                matchCount++;
            } else if (this.arena.dataTypes[token] === EnumToken.EndParensTokenType) {
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
    split(split: EnumToken = EnumToken.CommaTokenType): Token[][] {
        let index: number = this.index;
        let token: Token = this.tokens[index];
        // track balanced parens
        let matchCount: number = 0;
        const tokens: Token[][] = [[]];

        while (index + 1 < this.tokens.length) {
            token = this.tokens[++index];

            if (this.arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(this.arena.dataTypes[token])) {
                matchCount++;
            } else if (this.arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                matchCount--;
            }

            if (matchCount === 0 && this.arena.dataTypes[token] === split) {
                (tokens.at(-1) as number[]).push(token);
                tokens.push([]);
            } else {
                (tokens.at(-1) as number[]).push(token);
            }
        }

        return tokens;
    }


    getRemainingTokens(): Token[] {
        return this.tokens.slice(this.index + 1);
    }

    end() {
        this.index = this.tokens.length + 1;
        return this;
    }

    next() {
        let token: Token = this.tokens[++this.index];

        while (
            this.arena.dataTypes[token] === EnumToken.WhitespaceTokenType ||
            this.arena.dataTypes[token] === EnumToken.CommentTokenType ||
            this.arena.dataTypes[token] === EnumToken.CDOCOMMTokenType ||
            this.arena.dataTypes[token] === EnumToken.BadCdoTokenType ||
            this.arena.dataTypes[token] === EnumToken.BadCommentTokenType ||
            this.arena.dataTypes[token] === EnumToken.BadStringTokenType
        ) {
            token = this.tokens[++this.index];
        }

        return token;
    }

    slice(): ValidationTokenContext {
        return new ValidationTokenContext(
            this.arena,
            this.index == -1 ? this.tokens.slice() : this.tokens.slice(this.index),
            this.index == -1 ? -1 : 0,
        );
    }

    update(token: Token | null | undefined) {
        const index = token == null ? -1 : this.tokens.indexOf(token);

        if (index != -1) {
            this.index = index;
        }

        return this;
    }

    done() {
        if (this.index + 1 < this.tokens.length) {
            let index: number = this.index + 1;

            while (index < this.tokens.length) {
                if (
                    this.arena.dataTypes[this.tokens[index]] === EnumToken.WhitespaceTokenType ||
                    this.arena.dataTypes[this.tokens[index]] === EnumToken.CommentTokenType
                ) {
                    index++;
                } else {
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
export function createValidationContext(arena: AstArena, tokens: Token[]): ValidationContext {
    const filtered: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
        if (arena.dataTypes[tokens[i]] !== EnumToken.CommentTokenType) {
            filtered.push(tokens[i]);
        }
    }

    tokens = trimArray(arena, filtered);

    // inlined: arena.typeOf(tokens.at(-1))
    if (arena.dataTypes[tokens.at(-1) as number] === EnumToken.ImportantTokenType) {
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
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                // @ts-expect-error
                                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
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
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                                // @ts-expect-error
                                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
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

                // inlined: arena.typeOf(stack.at(-1))
                if (stack.length > 0 && arena.dataTypes[stack.at(-1) as number] === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }

                // inlined: arena.typeOf(stack.at(-1))
                if (stack.length > 0 && selectorNodeTypes.includes((stack.at(-1) == null ? null : arena.dataTypes[stack.at(-1) as number]) as EnumToken)) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected combinator ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                                // @ts-expect-error
                                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
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

                // inlined: arena.typeOf(stack.at(-1))
                if (arena.dataTypes[stack.at(-1) as number] !== EnumToken.AttrStartTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                                node: token,
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                                // @ts-expect-error
                                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
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
                        // inlined: arena.setStr(slice[0], arena.strings[arena.stringValue[slice[0]]].slice(1, -1))
                        arena.stringValue[slice[0]] = arena.internString(arena.strings[arena.stringValue[slice[0]]].slice(1, -1));
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
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(slice[0]))
                                    // @ts-expect-error
                                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(slice[0]))],
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
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
                        },
                    ],
                };

            case EnumToken.EndParensTokenType:
                // inlined: arena.typeOf(stack.at(-1))
                if (stack.length > 0 && arena.dataTypes[stack.at(-1) as number] === EnumToken.UniversalSelectorTokenType) {
                    stack.pop();
                }

                if (
                    // inlined: arena.typeOf(stack.at(-1))
                    arena.dataTypes[stack.at(-1) as number] === EnumToken.PseudoClassFunctionTokenDefType ||
                    // inlined: arena.typeOf(stack.at(-1))
                    arena.dataTypes[stack.at(-1) as number] === EnumToken.PseudoElementTokenType
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
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                            // @ts-expect-error
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
                        },
                    ],
                };

            case EnumToken.NumberTokenType:
            case EnumToken.LiteralTokenType:
            case EnumToken.DimensionTokenType:
                // inlined: arena.typeOf(stack.at(-1))
                if (arena.dataTypes[stack.at(-1) as number] === EnumToken.PseudoClassFunctionTokenDefType) {
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
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
                        },
                    ],
                };
        }

        if (
            arena.dataTypes[token] === EnumToken.WhitespaceTokenType &&
            // inlined: arena.typeOf(tokens.at(-2))
            trimWhitespaceAfter.includes((tokens.at(-2) == null ? null : arena.dataTypes[tokens.at(-2) as number]) as EnumToken) &&
            // inlined: arena.typeOf(tokens.at(-1))
            arena.dataTypes[tokens.at(-1) as number] === EnumToken.WhitespaceTokenType
        ) {
            tokens.pop();
        // inlined: arena.typeOf(token), arena.typeOf(tokens.at(-2))
        } else if (trimWhitespaceBefore.includes(arena.dataTypes[token] as EnumToken) && arena.dataTypes[tokens.at(-2) as number] === EnumToken.WhitespaceTokenType) {
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
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stack[stack.length - 1]))],
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
 * error of a failed validation, bound to the position of its tokens in the validated value: the errors of an identical
 * value are rebuilt with the tokens of that value
 */
interface CachedError {
    /**
     * the error, without its node and its location
     */
    error: ErrorDescription;
    /**
     * position of the error node in the value tokens (depth first, see {@link collectTokens}). -1: no node
     */
    node: number;
    /**
     * position of the token the location is computed from. -1: no location
     */
    location: number;
}

/**
 * cached validation of a value
 */
interface CachedValidation {
    /**
     * value encoding, see {@link encodeToken}
     */
    encoding: Float64Array;
    /**
     * validation result
     */
    valid: boolean;
    /**
     * errors of a failed validation. null when the errors are not known (the validation is done again when the errors
     * are needed)
     */
    errors: CachedError[] | null;
}

/**
 * declaration validations (successful and failed), by string table of the arena, by syntax and by hash of the value
 * encoding (see {@link encodeToken}). the encoding contains interned string ids: the string table is the key, it is
 * replaced when the arena is compacted and the ids change (see {@link AstArena.compact})
 */
const declarationValidations: WeakMap<string[], Map<ValidationToken[], Map<number, CachedValidation[]>>> =
    new WeakMap();

/**
 * shared result of a declaration whose validation is cached
 */
const cachedValidMatch: ValidationMatch = Object.freeze({
    success: true,
    valid: true,
    context: null as unknown as ValidationContext,
    token: null,
    syntaxToken: null,
    errors: Object.freeze([]) as unknown as ErrorDescription[],
});

/**
 * encoding of the value being validated: 6 fields per token (type, interned name, interned string value, numeric
 * value, interned unit, color type), followed by the encoding of its tokens between markers -1 / -2 and of its
 * children between markers -3 / -4. the buffer is reused: no allocation unless a new valid value is cached
 */
let encoding: Float64Array = new Float64Array(512);
let encodingLength: number = 0;
let encodingHash: number = 0;

/**
 * append a value to the encoding and update its hash
 * @param value
 */
function encode(value: number): void {
    if (encodingLength == encoding.length) {
        const previous: Float64Array = encoding;

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
function encodeToken(arena: AstArena, token: Token): void {
    encode(arena.dataTypes[token]);
    encode(arena.name[token]);
    encode(arena.stringValue[token]);
    encode(arena.numericValue[token]);
    encode(arena.unit[token]);
    encode(arena.colorType[token]);

    if (arena.firstToken[token] != 0) {
        encode(-1);

        for (let child: Token = arena.firstToken[token]; child != 0; child = arena.nextSibling[child]) {
            encodeToken(arena, child);
        }

        encode(-2);
    }

    if (arena.firstChild[token] != 0) {
        encode(-3);

        for (let child: Token = arena.firstChild[token]; child != 0; child = arena.nextSibling[child]) {
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
function cachedValidations(arena: AstArena, syntaxes: ValidationToken[], create: boolean): CachedValidation[] | null {
    let bySyntax: Map<ValidationToken[], Map<number, CachedValidation[]>> | undefined = declarationValidations.get(
        arena.strings,
    );

    if (bySyntax == null) {
        if (!create) {
            return null;
        }

        bySyntax = new Map();
        declarationValidations.set(arena.strings, bySyntax);
    }

    let byHash: Map<number, CachedValidation[]> | undefined = bySyntax.get(syntaxes);

    if (byHash == null) {
        if (!create) {
            return null;
        }

        byHash = new Map();
        bySyntax.set(syntaxes, byHash);
    }

    let bucket: CachedValidation[] | undefined = byHash.get(encodingHash);

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
function findValidation(arena: AstArena, syntaxes: ValidationToken[]): CachedValidation | null {
    const bucket: CachedValidation[] | null = cachedValidations(arena, syntaxes, false);

    if (bucket != null) {
        for (let i = 0; i < bucket.length; i++) {
            const candidate: Float64Array = bucket[i].encoding;

            if (candidate.length == encodingLength) {
                let k: number = 0;

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
function cacheValidation(
    arena: AstArena,
    syntaxes: ValidationToken[],
    value: Float64Array,
    hash: number,
    valid: boolean,
    errors: CachedError[] | null,
): void {
    encodingHash = hash;
    (cachedValidations(arena, syntaxes, true) as CachedValidation[]).push({ encoding: value, valid, errors });
}

/**
 * the value tokens and their descendants, in the encoding order (see {@link encodeToken})
 * @param arena
 * @param token
 * @param result
 */
function collectTokens(arena: AstArena, token: Token, result: Token[]): void {
    result.push(token);

    for (let child: Token = arena.firstToken[token]; child != 0; child = arena.nextSibling[child]) {
        collectTokens(arena, child, result);
    }

    for (let child: Token = arena.firstChild[token]; child != 0; child = arena.nextSibling[child]) {
        collectTokens(arena, child, result);
    }
}

/**
 * same source location
 * @param a
 * @param b
 */
function sameLocation(a: [string | null, number, number], b: [string | null, number, number]): boolean {
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
function bindErrors(
    arena: AstArena,
    tokens: Token[],
    errors: ErrorDescription[],
    options: ParserOptions,
): CachedError[] | null {
    const result: CachedError[] = [];

    for (let i = 0; i < errors.length; i++) {
        const error: ErrorDescription = errors[i];
        let node: number = -1;
        let location: number = -1;

        if (error.node != null) {
            node = tokens.indexOf(error.node as Token);

            if (node == -1) {
                return null;
            }
        }

        if (error.location != null) {
            // the location is computed from a token of the value: the error node, the last token, ...
            if (
                node != -1 &&
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[node]))
                sameLocation(error.location, [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[node]))])
            ) {
                location = node;
            } else {
                for (let k = 0; k < tokens.length; k++) {
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[k]))
                    if (sameLocation(error.location, [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[k]))])) {
                        location = k;
                        break;
                    }
                }

                if (location == -1) {
                    return null;
                }
            }
        }

        const copy: ErrorDescription = { ...error };

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
function rebuildErrors(
    arena: AstArena,
    tokens: Token[],
    errors: CachedError[],
    options: ParserOptions,
): ErrorDescription[] {
    const result: ErrorDescription[] = [];

    for (let i = 0; i < errors.length; i++) {
        const error: ErrorDescription = { ...errors[i].error };

        if (errors[i].node != -1) {
            error.node = tokens[errors[i].node];
        }

        if (errors[i].location != -1) {
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[errors[i].location]))
            error.location = [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[errors[i].location]))];
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
function valueTokens(arena: AstArena, tokens: Token[]): Token[] {
    const result: Token[] = [];

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
export function matchDeclarationSyntax(
    arena: AstArena,
    syntaxes: ValidationToken[],
    tokens: Token[],
    options: ParserOptions,
): ValidationMatch {
    encodingLength = 0;
    encodingHash = 0x811c9dc5;

    for (let i = 0; i < tokens.length; i++) {
        encodeToken(arena, tokens[i]);
    }

    const cached: CachedValidation | null = findValidation(arena, syntaxes);

    if (cached != null) {
        if (cached.valid) {
            return cachedValidMatch;
        }

        if (cached.errors != null) {
            return {
                success: false,
                valid: true,
                context: null as unknown as ValidationContext,
                token: null,
                syntaxToken: null,
                errors: rebuildErrors(arena, valueTokens(arena, tokens), cached.errors, options),
            };
        }
    }

    // the encoding is copied before the validation, which may encode other values
    const value: Float64Array = encoding.slice(0, encodingLength);
    const hash: number = encodingHash;
    const result: ValidationMatch = matchAllSyntaxes(arena, syntaxes, createValidationContext(arena, tokens), options);

    if (result.success) {
        cacheValidation(arena, syntaxes, value, hash, true, null);
    } else {
        const errors: CachedError[] | null = bindErrors(arena, valueTokens(arena, tokens), result.errors, options);

        if (cached != null) {
            // failure cached without its errors
            cached.errors = errors;
        } else {
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
export function isValidDeclarationValue(
    arena: AstArena,
    syntaxes: ValidationToken[],
    declaration: AstNode,
    options: ParserOptions,
): boolean {
    encodingLength = 0;
    encodingHash = 0x811c9dc5;

    for (let token: Token = arena.firstToken[declaration]; token != 0; token = arena.nextSibling[token]) {
        encodeToken(arena, token);
    }

    const cached: CachedValidation | null = findValidation(arena, syntaxes);

    if (cached != null) {
        return cached.valid;
    }

    // the encoding is copied before the validation, which may encode other values
    const value: Float64Array = encoding.slice(0, encodingLength);
    const hash: number = encodingHash;
    const valid: boolean = matchAllSyntaxes(
        arena,
        syntaxes,
        createValidationContext(arena, arena.tokens(declaration)),
        options,
    ).success;

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
export function matchAllSyntaxes(
    arena: AstArena,
    syntaxes: ValidationToken[] | null,
    context: ValidationContext,
    options: ParserOptions,
): ValidationMatch {
    // the visited syntaxes are tracked per call. the options are not copied: the previous map is restored
    const visited: Map<Token, Set<ValidationToken>> | undefined = options.visited;
    // the result object is passed to the matching functions, which fill it
    const out: ValidationMatch = createMatch();
    let result: ValidationMatch;

    options.visited = new Map<Token, Set<ValidationToken>>();

    try {
        result = matchSyntax(arena, syntaxes, context, options, out) as ValidationMatch;
    } finally {
        options.visited = visited;
    }

    if (syntaxes != null && result.success && result.syntaxToken != null) {
        const index: number = syntaxes.indexOf(result.syntaxToken);

        if (index != -1) {
            const mandatory: number = findMandatorySyntax(syntaxes, index);

            if (mandatory != -1) {
                return setMatch(out, false, result.valid, result.token, result.context, syntaxes[mandatory], ownErrors(result.errors));
            }
        }
    }

    // the syntaxes are exhausted, the tokens must be consumed: `color: red blue`
    if (syntaxes != null && result.success && !result.context.done()) {
        const token: Token = result.context.peek() as Token;

        return setMatch(out, false, result.valid, token, result.context, null, [
            {
                action: "drop",
                message: "unexpected token",
                node: token,
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
            },
        ]);
    }

    return setMatch(
        out,
        result.success,
        result.valid,
        result.token,
        result.context,
        !result.success ? result.syntaxToken : null,
        !result.success && result.errors.length === 0
            ? [
                  {
                      action: "drop",
                      message: result.errors[0]?.message || "could not match syntax",
                      node: result.token,
                      syntax: result.syntaxToken,
                      // inlined: options.source!.getSourceLocation(arena.getSpanStart(result.token ?? (context.tokens[context.tokens.length - 1] as Token)))
                      location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(result.token ?? (context.tokens[context.tokens.length - 1] as Token)))],
                  },
              ]
            : ownErrors(result.errors),
    );
}

/**
 * number of the mandatory commas of a list item: the items of `[ <number [0,1]>, <number> ]#{2}` span two values
 * @param syntax
 */
function countItemCommas(syntax: ValidationToken): number {
    let count: number = 0;

    if (syntax.typ === ValidationTokenEnum.Bracket) {
        for (const token of (syntax as ValidationBracketToken).chi) {
            if (token.typ === ValidationTokenEnum.Comma) {
                count++;
            }
        }
    }

    return count;
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
    // an item that contains commas spans several comma separated values
    const commas: number = countItemCommas(rest as ValidationToken);

    success = false;

    do {
        range = context.peekRange(EnumToken.CommaTokenType, 1 + commas);
        tmpResult = matchSyntax(
            arena,
            [rest],
            createValidationContext(
                arena,
                // inlined: arena.typeOf(range.at(-1))
                arena.dataTypes[range.at(-1) as number] === EnumToken.CommaTokenType ? range.slice(0, -1) : range,
            ),
            options,
        );

        if (tmpResult.success && !tmpResult.context.done()) {
            // the item does not match all the tokens before the next comma: the list ends with this item, the next
            // syntaxes match the remaining tokens. `<ident># from <ident>` matches `a, b from c`
            const current: Token | null = tmpResult.context.current();

            if (current != null) {
                count++;
                success = true;
                result = tmpResult;
                context.update(current);
            }

            break;
        }

        if (tmpResult.success) {
            count++;
            success = true;
            result = tmpResult;

            if (Number.isFinite(match?.max?.val) && count === (match!.max!.val as number)) {
                context.update(
                    // inlined: arena.typeOf(range.at(-1))
                    arena.dataTypes[range.at(-1) as number] === EnumToken.CommaTokenType ? (range.at(-2)) : (range.at(-1)),
                );

                break;
            } else {
                context.update(range.at(-1));
            }

            done = context.done();
        }
    } while (tmpResult.success && !done);

    // <foo>#{2}: too few items
    if (result != null && match?.min?.val != null && count < (match.min.val as number)) {
        result = null;
    }

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

            // no token matched. the indexes of the contexts are not comparable: the result context is a slice
            if (tmpResult.context.current() === context.current()) {
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
/**
 * the syntaxes that may match no token, see {@link isNullable}
 */
const nullableSyntaxes: WeakMap<ValidationToken, boolean> = new WeakMap();

/**
 * true if the syntax may match no token: `<a>?`, `<a>*`, `[ <a>? <b>? ]`, `[ [ and <a> ]* | [ or <a> ]* ]`
 * @param syntax
 */
function isNullable(syntax: ValidationToken): boolean {
    if (syntax.typ == ValidationTokenEnum.Whitespace) {
        return true;
    }

    // `[ <a>? <b>? ]!`: at least one token
    if (syntax.isMandatatoryGroup) {
        return false;
    }

    if (syntax.isOptional || syntax.isRepeatable || syntax.match?.min?.val === 0) {
        return true;
    }

    let nullable: boolean | undefined = nullableSyntaxes.get(syntax);

    if (nullable == null) {
        switch (syntax.typ) {
            case ValidationTokenEnum.Bracket:
                nullable = (syntax as ValidationBracketToken).chi.every(isNullable);
                break;

            case ValidationTokenEnum.PipeToken:
                nullable = (syntax as ValidationPipeToken).chi.some((syntaxes: ValidationToken[]) =>
                    syntaxes.every(isNullable),
                );
                break;

            case ValidationTokenEnum.AmpersandToken:
                nullable =
                    (syntax as ValidationAmpersandToken).l.every(isNullable) &&
                    (syntax as ValidationAmpersandToken).r.every(isNullable);
                break;

            default:
                nullable = false;
        }

        nullableSyntaxes.set(syntax, nullable);
    }

    return nullable;
}

/**
 * index of the first syntax that must be matched, starting at index. -1 if the remaining syntaxes may match no token
 * @param syntaxes
 * @param index
 */
function findMandatorySyntax(syntaxes: ValidationToken[], index: number): number {
    for (let i = index; i < syntaxes.length; i++) {
        if (!isNullable(syntaxes[i])) {
            return i;
        }
    }

    return -1;
}

/**
 * true if a numeric token is in the range of the syntax: `<integer [1,∞]>`
 * @param arena
 * @param token
 * @param syntax
 */
function isInRange(arena: AstArena, token: Token, syntax: ValidationToken): boolean {
    if (
        syntax.range == null ||
        arena.dataTypes[token] === EnumToken.MathFunctionTokenType ||
        arena.dataTypes[token] === EnumToken.MathFunctionTokenDefType ||
        arena.dataTypes[token] === EnumToken.WildCardFunctionTokenType ||
        arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType
    ) {
        return true;
    }

    const range = syntax.range as ValidationValueRangeMatch | ValidationDimensionRangeMatch;
    // a null lower bound is -∞
    let success: boolean =
        !arena.hasFraction(token) && (range.min == null || (arena.numericValue[token] as number) >= range.min.val);

    if ((range.min as ValidationToken | null)?.typ === ValidationTokenEnum.Dimension) {
        success =
            arena.dataTypes[token] ===
            (EnumToken[
                // @ts-expect-error
                (range as ValidationDimensionRangeMatch).min!.unit! as keyof EnumToken
            ] as EnumToken);
    }

    if (success && range.max != null) {
        success = (arena.numericValue[token] as number) <= range.max.val;
    }

    return success;
}

/**
 * the wildcard functions being matched with a syntax, see {@link matchWildCardFunction}
 */
const wildCardProbes: Map<Token, ValidationToken> = new Map();

/**
 * var(), env() and if() may be substituted by any number of values. the function is matched:
 * - as a part of the syntax at index: `var(--color) 65%` is matched by `<linear-color-stop>` (`<color>` is the function)
 * - as the syntax at index, or as all the remaining syntaxes when it is the last token
 *
 * the next syntaxes must match the tokens that follow. otherwise, the syntax at index is skipped if it is optional and
 * the function is matched with the next syntax
 * @param arena
 * @param syntaxes
 * @param index index of the syntax matched by the function
 * @param context
 * @param token the function token
 * @param end last token of the function
 * @param options
 * @param out
 * @returns the result, null if the syntax at index is skipped
 */
function matchWildCardFunction(
    arena: AstArena,
    syntaxes: ValidationToken[],
    index: number,
    context: ValidationContext,
    token: Token,
    end: Token,
    options: ValidationOptions | ParserOptions,
    out: ValidationMatch,
): ValidationMatch | null {
    let errors: ErrorDescription[] = noErrors;
    const candidates: ValidationContext[] = [];

    // the function is a part of the syntax. a keyword, a comma, ... is matched by the function
    if (
        syntaxes[index].typ !== ValidationTokenEnum.Keyword &&
        syntaxes[index].typ !== ValidationTokenEnum.Comma &&
        syntaxes[index].typ !== ValidationTokenEnum.Separator &&
        syntaxes[index].typ !== ValidationTokenEnum.StringToken &&
        syntaxes[index].typ !== ValidationTokenEnum.OpenParenthesis &&
        syntaxes[index].typ !== ValidationTokenEnum.CloseParenthesis
    ) {
        const previous: ValidationToken | undefined = wildCardProbes.get(token);
        let probe: ValidationMatch;

        wildCardProbes.set(token, syntaxes[index]);

        try {
            probe = matchSyntax(arena, [syntaxes[index]], context.slice(), options);
        } finally {
            if (previous == null) {
                wildCardProbes.delete(token);
            } else {
                wildCardProbes.set(token, previous);
            }
        }

        if (probe.success) {
            if (probe.context.done()) {
                // the syntax matched all the tokens: the remaining syntaxes must be optional
                if (findMandatorySyntax(syntaxes, index + 1) == -1) {
                    context.end();
                    return setMatch(out, true, probe.valid, null, context, null, probe.errors);
                }
            } else if (probe.context.current() != null) {
                // the syntax matched some tokens
                candidates.push(probe.context);
            }
        }
    }

    // the function is the syntax
    const next: ValidationContext = context.slice();

    next.update(end);

    if (next.done()) {
        // all the remaining syntaxes
        context.end();
        return setMatch(out, true, true, null, context, null, noErrors);
    }

    candidates.push(next);

    for (const candidate of candidates) {
        const rest: ValidationMatch = matchSyntax(arena, syntaxes.slice(index + 1), candidate.slice(), options);

        if (rest.success) {
            if (rest.context.done()) {
                context.end();
            } else {
                context.update(rest.context.current() ?? candidate.current());
            }

            return setMatch(out, true, rest.valid, rest.token, context, null, rest.errors);
        }

        errors = rest.errors;
    }

    if (isNullable(syntaxes[index])) {
        return null;
    }

    return setMatch(out, false, true, token, context, syntaxes[index], errors);
}

/**
 * the tokens are consumed: the match succeeds if the remaining syntaxes, starting at index, are optional.
 * `[ <number [0,1]>, <number> ]` does not match `.2`
 * @param out
 * @param syntaxes
 * @param index index of the next syntax
 * @param valid
 * @param token
 * @param context
 * @param errors
 */
function setDoneMatch(
    out: ValidationMatch,
    syntaxes: ValidationToken[],
    index: number,
    valid: boolean,
    token: Token | null,
    context: ValidationContext,
    errors: ErrorDescription[],
): ValidationMatch {
    const mandatory: number = findMandatorySyntax(syntaxes, index);

    if (mandatory != -1) {
        return setMatch(out, false, valid, token, context, syntaxes[mandatory], noErrors);
    }

    return setMatch(out, true, valid, token, context, syntaxes[index] ?? null, errors);
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
    out: ValidationMatch = createMatch(),
): ValidationMatch {
    if (syntaxes == null) {
        return setMatch(out, true, false, context.peek(), context, null, noErrors);
    }

    let i: number = -1;
    let success: boolean = false;
    let token: Token | null = null;
    let result: ValidationMatch | null = null;
    let isOptional: boolean;

    if (
        context.tokens.length == 1 &&
        arena.dataTypes[context.tokens[0]] == EnumToken.IdenTokenType &&
        isCssWideKeyword(arena.strings[arena.stringValue[context.tokens[0]]])
    ) {
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
            // the remaining syntaxes must be optional: `<a>? <b>`
            const mandatory: number = findMandatorySyntax(syntaxes, isOptional ? i + 1 : i);

            if (mandatory != -1) {
                return setMatch(out, false, true, null, context, syntaxes[mandatory], [
                        {
                            action: "drop",
                            message: "could not match syntax",
                            node: null,
                            syntax: syntaxes[mandatory],
                        },
                    ]);
            }

            break;
        }

        if (
            arena.dataTypes[token] === EnumToken.WildCardFunctionTokenType &&
            arena.strings[arena.stringValue[token]] === "var" &&
            wildCardProbes.get(token) !== syntaxes[i]
        ) {
            result = matchSyntax(
                arena,
                (
                    getParsedSyntax(
                        ValidationSyntaxGroupEnum.Syntaxes,
                        arena.strings[arena.stringValue[token]] + "()",
                    ) as ValidationFunctionToken[]
                )?.[0]?.chi,
                createValidationContext(arena, arena.tokens(token as Token)),
                options, out,
            );

            if (result.success && result.context.done()) {
                const wildCardResult: ValidationMatch | null = matchWildCardFunction(
                    arena,
                    syntaxes,
                    i,
                    context,
                    token,
                    token,
                    options,
                    out,
                );

                if (wildCardResult == null) {
                    continue;
                }

                return wildCardResult;
            }
        }

        if (
            // @ts-ignore
            arena.dataTypes[token] === EnumToken.WildCardFunctionTokenDefType &&
            wildCardProbes.get(token) !== syntaxes[i]
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
                options, out,
            );

            if (result.success) {
                const wildCardResult: ValidationMatch | null = matchWildCardFunction(
                    arena,
                    syntaxes,
                    i,
                    context,
                    token,
                    range.at(-1) as Token,
                    options,
                    out,
                );

                if (wildCardResult == null) {
                    continue;
                }

                return wildCardResult;
            }
        }

        if (syntaxes[i].isRepeatableAtLeastOnce || syntaxes[i].isRepeatable) {
            result = matchRepeatableSyntax(arena, syntaxes[i], context.slice(), options);

            if (result.success) {
                if (result.context.done()) {
                    context.end();

                    return setDoneMatch(out, syntaxes, i + 1, result.valid, result.token, result.context, result.errors);
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

                    return setDoneMatch(out, syntaxes, i + 1, true, null, context, result.errors);
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
                (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                if (result.context.done()) {
                    context.end();

                    return setDoneMatch(out, syntaxes, i + 1, result.valid, result.token, context, result.errors);
                }

                context.update(result.context.current());
                continue;
            }

            if (isOptional) {
                continue;
            }

            return setMatch(out, false, true, token, context, syntaxes[i], result.errors);
        }

        if (!options.visited!.has(token)) {
            options.visited!.set(token, new Set<ValidationToken>());
        }

        if ((options.visited!.get(token) as Set<ValidationToken>)!.has(syntaxes[i])) {
            // cyclic definition
            return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
        }

        (options.visited!.get(token) as Set<ValidationToken>)!.add(syntaxes[i]);
        success = false;

        try {
            switch (syntaxes[i].typ) {
                case ValidationTokenEnum.Colon:
                    // `<ident-token> : <declaration-value>?`
                    if (arena.dataTypes[token] == EnumToken.ColonTokenType) {
                        success = true;
                        context.next();
                        break;
                    }

                    if (isOptional) {
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.Comma:
                    if (arena.dataTypes[token] == EnumToken.CommaTokenType) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.Keyword:
                    if (
                        arena.dataTypes[token] == EnumToken.IdenTokenType &&
                        lowercase(arena.strings[arena.stringValue[token]]) ===
                            lowercase((syntaxes[i] as ValidationKeywordToken).val)
                    ) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }

                    if (isOptional) {
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.DeclarationType:
                    result = matchSyntax(
                        arena,
                        getParsedSyntax(
                            ValidationSyntaxGroupEnum.Declarations,
                            (syntaxes[i] as ValidationDeclarationToken).val,
                        ),
                        context,
                        options, out,
                    );

                    if (result.success) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                        if (result.context.done()) {
                            context.end();

                            return setDoneMatch(out, syntaxes, i + 1, result.valid, token, context, result.errors);
                        } else {
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
                    const chi: ValidationToken[] = (syntaxes[i] as ValidationOptionalGroupToken).chi;

                    // `<bg-layer>#? , <final-bg-layer>` (the group of the optional list, the comma is the list separator) is
                    // matched as `[ <bg-layer> , ]* <final-bg-layer>`: the last item is left to the next syntax
                    if (chi.length == 1 && chi[0].isList) {
                        const { isList, isOptional, match, ...item } = chi[0];
                        const group: ValidationToken[] = [
                            item as ValidationToken,
                            { typ: ValidationTokenEnum.Comma } as ValidationToken,
                        ];

                        while (context.peek() != null) {
                            const tmp: ValidationMatch = matchSyntax(arena, group, context.slice(), options);

                            if (!tmp.success || tmp.context.current() == null) {
                                break;
                            }

                            context.update(tmp.context.current());

                            if (tmp.context.done()) {
                                break;
                            }
                        }

                        success = true;
                        break;
                    }

                    // the group is optional: it is skipped if it does not match
                    result = matchSyntax(arena, chi, context.slice(), options);

                    if (result.success) {
                        success = true;

                        if (result.context.done()) {
                            context.end();

                            return setDoneMatch(out, syntaxes, i + 1, true, null, context, result.errors);
                        }

                        context.update(result.context.current());
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

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.PropertyType:
                    result = matchProperty(arena, syntaxes[i] as ValidationPropertyToken, context, options);

                    if (!result.success) {
                        if (isOptional) {
                            break;
                        }

                        return setMatch(out, false, true, context.current() ?? token, context, syntaxes[i], noErrors);
                    }

                    success = true;
                    (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                    if (result.context.done()) {
                        if (!isInRange(arena, token as Token, syntaxes[i])) {
                            return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
                        }

                        context.end();

                        return setDoneMatch(out, syntaxes, i + 1, true, null, context, noErrors);
                    } else {
                        context.update(result.context.current());
                    }

                    break;

                case ValidationTokenEnum.PipeToken:
                    {
                        // each alternative is matched in the same scratch result, the best match is copied
                        const scratch: ValidationMatch = createMatch();
                        let best: ValidationMatch | null = null;
                        let tmp: ValidationMatch | null = null;

                        for (const syntax of (syntaxes[i] as ValidationPipeToken).chi) {
                            tmp = matchSyntax(arena, syntax, context.slice(), options, scratch);

                            if (tmp.success) {
                                // an alternative that consumes the tokens is skipped if mandatory syntaxes remain
                                if (tmp.context.done() && findMandatorySyntax(syntaxes, i + 1) != -1) {
                                    continue;
                                }

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
                            options.visited!.get(token)!.delete(syntaxes[i]);

                            context.update(result!.context.current());

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
                    result = matchSyntax(arena, (syntaxes[i] as ValidationBracketToken).chi, context.slice(), options, out);

                    if (result.success) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                        if (result.context.done()) {
                            context.end();

                            return setDoneMatch(out, syntaxes, i + 1, true, null, context, noErrors);
                        } else {
                            context.update(result.context.current());
                        }

                        break;
                    }

                    if (isOptional) {
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.ColumnToken:
                    result = matchColumnSyntax(arena, syntaxes[i] as ValidationColumnToken, context.slice(), options);

                    if (result.success) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                        if (result.context.done()) {
                            context.end();

                            return setDoneMatch(out, syntaxes, i + 1, true, null, context, noErrors);
                        } else {
                            context.update(result.context.current());
                        }

                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.AmpersandToken:
                    result = matchAmpersandSyntax(arena, syntaxes[i] as ValidationAmpersandToken, context.slice(), options);

                    if (result.success) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                        if (result.context.done()) {
                            context.end();

                            return setDoneMatch(out, syntaxes, i + 1, true, null, context, noErrors);
                        } else {
                            context.update(result.context.current());
                        }

                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

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

                        result = matchSyntax(
                            arena,
                            (syntaxes[i] as ValidationFunctionToken).chi as ValidationToken[],
                            createValidationContext(arena, range.slice(1, -1)),
                            options, out,
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
                            options, out,
                        );

                        if (result.success && result.context.done()) {
                            success = true;
                            (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                            context.next();
                            break;
                        }
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], result.errors);

                case ValidationTokenEnum.Separator:
                    if (arena.dataTypes[token] === EnumToken.LiteralTokenType && arena.strings[arena.stringValue[token]] === "/") {
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

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
                                options, out,
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
                                options, out,
                            );

                            if (result.success && result.context.done()) {
                                success = true;
                                (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                                context.next();
                                break;
                            }
                        }
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.OpenParenthesis:
                    if (arena.dataTypes[token] === EnumToken.StartParensTokenType) {
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.OpenCurlyBrace:
                    if (arena.dataTypes[token] === EnumToken.BlockStartTokenType) {
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                case ValidationTokenEnum.CloseParenthesis:
                    if (arena.dataTypes[token] === EnumToken.EndParensTokenType) {
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.next();
                        break;
                    }

                    return setMatch(out, false, true, token, context, syntaxes[i], noErrors);

                default:
                    throw new Error(`Unexpected syntax ${ValidationTokenEnum[syntaxes[i].typ]}`);
            }
        } finally {
            // the syntax is no longer being matched: a token may be matched again with the same syntax (the
            // alternatives of an optional group, ...). only the syntaxes being matched detect a cyclic definition
            (options.visited!.get(token) as Set<ValidationToken>)?.delete(syntaxes[i]);
        }

        if (success && !isInRange(arena, token as Token, syntaxes[i])) {
            return setMatch(out, false, true, token, context, syntaxes[i], noErrors);
        }
    }

    // the context of this list of syntaxes: the last result may not include the tokens matched after it (`,`, ...)
    return setMatch(
        out,
        true,
        result?.success ? result.valid : true,
        token,
        context,
        syntaxes[i] ?? null,
        result?.success ? result.errors : noErrors,
    );
}

/**
 * matches a column of syntaxes: `<a> || <b> || <c>`, one or more syntaxes in any order. the syntaxes are matched in
 * the order that matches the most tokens: `[ none | <single-transition-property> ] || <time> || <easing-function>`
 * matches `.2s ease-in-out transform` (`ease-in-out` is also a <custom-ident>)
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
    return matchUnorderedSyntaxes(arena, syntax, (syntax as ValidationColumnToken).chi, false, context, options);
}

/**
 * matches syntaxes in any order: all the syntaxes (`&&`) or one or more syntaxes (`||`), see {@link searchUnorderedSyntaxes}
 * @param arena
 * @param syntax
 * @param syntaxes
 * @param all all the syntaxes must be matched, except the syntaxes that match no token
 * @param context
 * @param options
 */
function matchUnorderedSyntaxes(
    arena: AstArena,
    syntax: ValidationToken,
    syntaxes: ValidationToken[][],
    all: boolean,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const best: ValidationContext | null = searchUnorderedSyntaxes(
        arena,
        syntaxes,
        syntaxes.map((_, index: number) => index),
        all,
        context,
        context,
        options,
        new Map(),
    );

    if (best != null) {
        if (best.done()) {
            context.end();
        } else {
            context.update(best.current());
        }
    }

    return {
        // `<a>? && <b>?` matches no token
        success:
            best != null ||
            (all && syntaxes.every((syntaxes: ValidationToken[]) => findMandatorySyntax(syntaxes, 0) == -1)),
        valid: true,
        token: context.current(),
        context,
        syntaxToken: syntax,
        errors: [],
    };
}

/**
 * position of a context in the tokens of the unordered syntaxes, see {@link searchUnorderedSyntaxes}
 * @param base
 * @param context
 */
function unorderedPosition(base: ValidationContext, context: ValidationContext): number {
    return context.done() ? Number.POSITIVE_INFINITY : base.tokens.indexOf(context.current() as Token);
}

/**
 * the context after the unordered syntaxes that match the most tokens. null if the syntaxes do not match
 * @param arena
 * @param syntaxes the unordered syntaxes
 * @param remaining the indexes of the syntaxes that are not matched
 * @param all all the syntaxes must be matched, except the syntaxes that match no token
 * @param base the context of the syntaxes
 * @param context
 * @param options
 * @param cache the context after a syntax, by syntax index and position
 */
function searchUnorderedSyntaxes(
    arena: AstArena,
    syntaxes: ValidationToken[][],
    remaining: number[],
    all: boolean,
    base: ValidationContext,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
    cache: Map<string, ValidationContext | null>,
): ValidationContext | null {
    const position: number = unorderedPosition(base, context);
    let best: ValidationContext | null = null;

    for (let k = 0; k < remaining.length; k++) {
        const key: string = remaining[k] + ":" + position;
        let next: ValidationContext | null | undefined = cache.get(key);

        if (next === undefined) {
            const result: ValidationMatch = matchSyntax(arena, syntaxes[remaining[k]], context.slice(), options);

            next = null;

            // the syntax matched some tokens
            if (result.success && (result.context.done() || result.context.current() !== context.current())) {
                next = context.slice();

                if (result.context.done()) {
                    next.end();
                } else {
                    next.update(result.context.current());
                }
            }

            cache.set(key, next);
        }

        if (next == null) {
            continue;
        }

        const rest: number[] = remaining.slice(0, k).concat(remaining.slice(k + 1));
        // the match may stop after this syntax
        const complete: boolean =
            !all || rest.every((index: number) => findMandatorySyntax(syntaxes[index], 0) == -1);
        const candidates: ValidationContext[] = [];

        if (!next.done() && rest.length > 0) {
            const deeper: ValidationContext | null = searchUnorderedSyntaxes(
                arena,
                syntaxes,
                rest,
                all,
                base,
                next,
                options,
                cache,
            );

            if (deeper != null) {
                candidates.push(deeper);
            }
        }

        if (complete) {
            candidates.push(next);
        }

        for (const candidate of candidates) {
            if (candidate.done()) {
                return candidate;
            }

            if (best == null || unorderedPosition(base, candidate) > unorderedPosition(base, best)) {
                best = candidate;
            }
        }
    }

    return best;
}

/**
 * the operands of chained ampersands: `<a> && <b> && <c>` is parsed as `[ <a> && <b> ] && <c>`
 * @param syntax
 * @param operands
 */
function ampersandOperands(syntax: ValidationAmpersandToken, operands: ValidationToken[][] = []): ValidationToken[][] {
    for (const side of [syntax.l, syntax.r]) {
        const tokens: ValidationToken[] = side.filter((token: ValidationToken) => token.typ != ValidationTokenEnum.Whitespace);

        if (
            tokens.length == 1 &&
            tokens[0].typ == ValidationTokenEnum.AmpersandToken &&
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

/**
 * matches an ampersand of syntaxes: `<a> && <b> && <c>`, all the syntaxes in any order, except the optional syntaxes
 * that match no token. `[ <ident> && <length> ]` matches `thin 10px` and `10px thin`
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
    return matchUnorderedSyntaxes(arena, syntax, ampersandOperands(syntax), true, context, options);
}

/**
 * the tokens of a media / container feature: the tokens before the closing parenthesis, `width >= 700px` in
 * `(width >= 700px)`. the whitespace and the comments are skipped
 * @param arena
 * @param context
 */
function peekFeatureTokens(arena: AstArena, context: ValidationContext): Token[] {
    const tokens: Token[] = [];
    let depth: number = 0;

    for (let index = context.index + 1; index < context.tokens.length; index++) {
        const token: Token = context.tokens[index];

        if (arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[token])) {
            depth++;
        } else if (arena.dataTypes[token] === EnumToken.EndParensTokenType && depth-- == 0) {
            break;
        }

        if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType) {
            tokens.push(token);
        }
    }

    return tokens;
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
    // inlined: arena.typeOf(token)
    let t: EnumToken = (token == null ? null : arena.dataTypes[token as number]) as EnumToken;
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
        case "declaration-value":
            {
                // consume a declaration value
                // consume a token,
                // if the next token is a comma consume it and expect a token
                // check the parenthises are balanced
                // if semicolon or end curly brace is encountered, stop
                let expectToken: boolean = true;
                let token: Token | null;
                // one or more tokens
                let consumed: number = 0;

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
                        consumed++;
                    }
                }

                success = consumed > 0 && !expectToken;

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
            if (arena.dataTypes[token as number] === EnumToken.BinaryExpressionTokenType) {
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
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] === EnumToken.IdenTokenType &&
                    ("even" === arena.strings[arena.stringValue[token as Token]] ||
                        "odd" === arena.strings[arena.stringValue[token as Token]])
                ) {
                    success = true;
                    break;
                }

                if (
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] === EnumToken.NumberTokenType &&
                    Number.isInteger(arena.numericValue[token as Token])
                ) {
                    success = true;
                    break;
                }

                // inlined: arena.typeOf(token)
                if (arena.dataTypes[token as number] === EnumToken.LiteralTokenType || arena.dataTypes[token as number] === EnumToken.IdenTokenType) {
                    let match = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(
                        arena.strings[arena.stringValue[token as Token]],
                    );

                    success = match != null;

                    // `n + 1`: the sign and the number follow the ident
                    if (success && match?.[3] == null) {
                        const sign: Token | null = context.peek(1);

                        // `n+1`: the sign is a part of the number
                        if (arena.dataTypes[sign as number] === EnumToken.NumberTokenType) {
                            if (!Number.isInteger(arena.numericValue[sign as Token])) {
                                success = false;
                                break;
                            }

                            context.update(sign);

                            return {
                                success: true,
                                valid: true,
                                token: null,
                                context,
                                syntaxToken: property,
                                errors: [],
                            };
                        }

                        if (
                            // inlined: arena.typeOf(sign)
                            arena.dataTypes[sign as number] === EnumToken.Add ||
                            // inlined: arena.typeOf(sign)
                            arena.dataTypes[sign as number] === EnumToken.NextSiblingCombinatorTokenType ||
                            // inlined: arena.typeOf(sign)
                            arena.dataTypes[sign as number] === EnumToken.Sub
                        ) {
                            token = context.peek(2);

                            success =
                                // inlined: arena.typeOf(token)
                                arena.dataTypes[token as number] === EnumToken.NumberTokenType &&
                                Number.isInteger(arena.numericValue[token as Token]);

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
                    }

                    break;
                }

                if (
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] === EnumToken.DimensionTokenType &&
                    arena.strings[arena.unit[token as Token]] === "n"
                ) {
                    success = Number.isInteger(arena.numericValue[token as Token]);

                    token = context.peek(1);

                    if (token == null) {
                        break;
                    }

                    if (arena.dataTypes[token] === EnumToken.NumberTokenType) {
                        // `2n+1`, `-2n -0`: the sign is a part of the number
                        if (Number.isInteger(arena.numericValue[token])) {
                            context.next();
                        } else {
                            success = false;
                        }

                        break;
                    }

                    if (arena.dataTypes[token] === EnumToken.NextSiblingCombinatorTokenType) {
                        arena.dataTypes[token] = EnumToken.Add;
                    }

                    token = context.peek(2);

                    if (
                        // inlined: arena.typeOf(token)
                        arena.dataTypes[token as number] === EnumToken.NumberTokenType &&
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
                values = new Set((getSyntax(property.val) ?? "").split(/[\s|]+/));
                propertyKeywordValues.set(property.val, values);
            }

            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token as number] == EnumToken.IdenTokenType && values.has(arena.strings[arena.stringValue[token as Token]].toLowerCase());
            break;
        }

        case "mf-name":
            {
                const token = context.peek();
                success =
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] === EnumToken.IdenTokenType &&
                    arena.strings[arena.stringValue[token as Token]].toLowerCase() in config.mediaFeatures;
            }

            break;

        case "dashed-ident":
        case "extension-name":
        case "custom-property-name":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek() as number] == EnumToken.DashedIdenTokenType;
            break;

        case "namespace-prefix":
        case "ident":
        case "ident-token":
        case "custom-ident":
        case "counter-name":
        case "counter-style-name":
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token as number] == EnumToken.IdenTokenType || arena.dataTypes[token as number] == EnumToken.DashedIdenTokenType;

            // inlined: arena.typeOf(token)
            if (success && arena.dataTypes[token as number] === EnumToken.IdenTokenType) {
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

        case "unicode-range-token":
            // `U+0025-00FF`
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek() as number] === EnumToken.UniCodeRange;
            break;

        case "hash-token": {
            // <id-selector>: `#foo`. a valid hex color such as `#fade` is tokenized as a color
            const token = context.peek();

            success =
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] === EnumToken.HashTokenType ||
                (arena.dataTypes[token as number] === EnumToken.ColorTokenType &&
                    arena.colorType[token as Token] === ColorType.HEX);
            break;
        }

        case "string": {
            const token = context.peek();

            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token as number] === EnumToken.StringTokenType;
            break;
        }

        case "wq-name": {
            // inlined: arena.typeOf(context.peek())
            const success = arena.dataTypes[context.peek() as number] == EnumToken.IdenTokenType;

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
                success = arena.dataTypes[token as number] == EnumToken.NumberTokenType;
            }

            break;

        case "zero": {
            const token = context.peek();
            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token as number] == EnumToken.NumberTokenType && arena.numericValue[token as Token] === 0;
            break;
        }

        case "integer":
            {
                const token = context.peek();

                success =
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] == EnumToken.NumberTokenType && Number.isInteger(Number(arena.numericValue[token as Token]));
            }
            break;

        case "dimension": {
            const token = context.peek();

            success =
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.DimensionTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.AngleTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.LengthTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.PercentageTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.ResolutionTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.TimeTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.FrequencyTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.UserDefinedDimensionTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.FlexTokenType;
            break;
        }

        case "angle":
            {
                const token = context.peek();

                // inlined: arena.typeOf(token)
                success = arena.dataTypes[token as number] === EnumToken.AngleTokenType || arena.dataTypes[token as number] === EnumToken.UserDefinedDimensionTokenType;
            }

            break;

        case "angle-percentage":
            {
                const token = context.peek();

                // inlined: arena.typeOf(token)
                success = arena.dataTypes[token as number] === EnumToken.AngleTokenType || arena.dataTypes[token as number] === EnumToken.UserDefinedDimensionTokenType || arena.dataTypes[token as number] === EnumToken.PercentageTokenType;
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
                    arena.dataTypes[token as number] == EnumToken.PercentageTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] == EnumToken.LengthTokenType ||
                    // inlined: arena.typeOf(token)
                    arena.dataTypes[token as number] == EnumToken.UserDefinedDimensionTokenType ||
                    // inlined: arena.typeOf(token)
                    (arena.dataTypes[token as number] == EnumToken.NumberTokenType && arena.numericValue[token as Token] === 0);
            }
            break;

        case "flex":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek() as number] == EnumToken.FlexTokenType || arena.dataTypes[context.peek() as number] == EnumToken.UserDefinedDimensionTokenType;
            break;

        case "length": {
            const token = context.peek();

            success =
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.LengthTokenType ||
                // inlined: arena.typeOf(token)
                arena.dataTypes[token as number] == EnumToken.UserDefinedDimensionTokenType ||
                // inlined: arena.typeOf(token)
                (arena.dataTypes[token as number] == EnumToken.NumberTokenType && arena.numericValue[token as Token] === 0);
            break;
        }

        case "resolution":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek() as number] == EnumToken.ResolutionTokenType;
            break;

        case "frequency":
            // inlined: arena.typeOf(context.peek())
            success = arena.dataTypes[context.peek() as number] == EnumToken.FrequencyTokenType;
            break;

        case "decibel":
        case "semitones": {
            // `6dB`, `2st`
            const token: Token | null = context.peek();

            success =
                arena.dataTypes[token as number] == EnumToken.DimensionTokenType &&
                equalsIgnoreCase(arena.strings[arena.unit[token as Token]], property.val == "decibel" ? "dB" : "st");
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

                // inlined: arena.typeOf(token)
                if (tokensfuncDefMap.has((token == null ? null : arena.dataTypes[token as number]) as EnumToken)) {
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
            // inlined: arena.typeOf(context.peek()). the type of a null id is undefined: not a key of the map either
            if (tokensfuncDefMap.has(arena.dataTypes[context.peek() as number] as EnumToken)) {
                // the token is consumed below
                success = true;
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
                arena.dataTypes[token as number] == EnumToken.IdenTokenType &&
                // @ts-expect-error
                (config.languages as string[]).some(
                    (t) => t === arena.strings[arena.stringValue[token as Token]] || arena.strings[arena.stringValue[token as Token]].startsWith(t + "-"),
                );
            break;
        }

        case "size-feature": {
            // <mf-name> | <mf-name> : <mf-value> | <mf-range>. the feature is validated by the at-rule parser
            const filteredRange: Token[] = peekFeatureTokens(arena, context);

            success =
                filteredRange.length === 1
                    ? arena.dataTypes[filteredRange[0]] === EnumToken.IdenTokenType ||
                      arena.dataTypes[filteredRange[0]] === EnumToken.DashedIdenTokenType
                    : filteredRange.length > 2 &&
                      (mFLT.has(arena.dataTypes[filteredRange[1]]) ||
                          mFGT.has(arena.dataTypes[filteredRange[1]]) ||
                          arena.dataTypes[filteredRange[1]] === EnumToken.ColonTokenType ||
                          arena.dataTypes[filteredRange[1]] === EnumToken.DelimTokenType);

            if (success) {
                context.update(filteredRange.at(-1));
            }

            return {
                success,
                valid: true,
                token: success ? null : (filteredRange[1] ?? context.peek()),
                context,
                syntaxToken: property,
                errors: [],
            };
        }

        case "style-feature": {
            // <style-feature-plain> | <style-feature-boolean> | <style-range>
            const filteredRange: Token[] = peekFeatureTokens(arena, context);

            success =
                filteredRange.length === 1
                    ? arena.dataTypes[filteredRange[0]] === EnumToken.IdenTokenType ||
                      arena.dataTypes[filteredRange[0]] === EnumToken.DashedIdenTokenType
                    : filteredRange.length > 2 &&
                      (mFLT.has(arena.dataTypes[filteredRange[1]]) ||
                          mFGT.has(arena.dataTypes[filteredRange[1]]) ||
                          arena.dataTypes[filteredRange[1]] === EnumToken.ColonTokenType);

            if (success) {
                context.update(filteredRange.at(-1));
            }

            return {
                success,
                valid: success,
                token: success ? null : context.peek(),
                context,
                syntaxToken: property,
                errors: [],
            };
        }

        case "url": {
            const token = context.peek();

            let l: number;

            // inlined: arena.typeOf(token)
            if (arena.dataTypes[token as number] == EnumToken.UrlFunctionTokenDefType) {
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

                    // inlined: arena.typeOf(token)
                    if (arena.dataTypes[token as number] == EnumToken.EndParensTokenType) {
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
            if (arena.dataTypes[token as number] != EnumToken.UrlFunctionTokenType) {
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
            const token: Token | null = context.peek();

            // `type(<number> | <transform-function>)`: the css type syntax
            if (
                (arena.dataTypes[token as number] == EnumToken.FunctionTokenDefType ||
                    arena.dataTypes[token as number] == EnumToken.FunctionTokenType) &&
                equalsIgnoreCase(arena.strings[arena.stringValue[token as Token]], "type")
            ) {
                if (arena.dataTypes[token as number] == EnumToken.FunctionTokenDefType) {
                    context.update(context.peekRange().at(-1));
                } else {
                    context.next();
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

            // inlined: arena.typeOf(token)
            success = arena.dataTypes[token as number] == EnumToken.CssTypeTokenType;

            if (success) {
                context.next();

                // the multiplier follows the type: `<length>#`, `<length>+`
                const multiplier: Token | undefined = context.tokens[context.index + 1];

                if (
                    multiplier != null &&
                    (arena.dataTypes[multiplier] == EnumToken.Plus ||
                        (arena.dataTypes[multiplier] == EnumToken.LiteralTokenType &&
                            arena.strings[arena.stringValue[multiplier]] == "#"))
                ) {
                    context.next();
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

        case "dashed-function": {
            const token = context.peek();

            // inlined: arena.typeOf(token)
            success =
                arena.dataTypes[token as number] == EnumToken.CustomFunctionTokenDefType ||
                arena.dataTypes[token as number] == EnumToken.CustomFunctionTokenType;

            if (success) {
                // `--name(<arguments>)`: the function and its arguments
                if (arena.dataTypes[token as number] == EnumToken.CustomFunctionTokenDefType) {
                    context.update(context.peekRange().at(-1));
                } else {
                    context.next();
                }

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
            success = arena.dataTypes[context.peek() as number] == EnumToken.StartParensTokenType;

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
            if (!hasSyntax(property.val)) {
                console.debug("Unknown syntax", context.peek(), property);

                throw new Error(`Unexpected validation property ${property.val}`);
            }

            return matchSyntax(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, property.val), context, options);
    }

    if (
        !success &&
        // inlined: arena.typeOf(context.peek())
        arena.dataTypes[context.peek() as number] == EnumToken.IdenTokenType &&
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

            // no token matched. the indexes of the contexts are not comparable: the result context is a slice
            if (tmpResult.context.current() === context.current()) {
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
