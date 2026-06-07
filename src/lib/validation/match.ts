import type {
    BinaryExpressionToken,
    ColorToken,
    DimensionToken,
    ErrorDescription,
    FractionToken,
    FunctionToken,
    IdentToken,
    LiteralToken,
    NumberToken,
    ParensToken,
    ParserOptions,
    PseudoClassFunctionToken,
    PseudoElementToken,
    StringToken,
    Token,
    ValidationOptions,
} from "../../@types/index.d.ts";
import { getParsedSyntax, getSyntaxConfig } from "./config.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import type {
    ValidationAmpersandToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationDeclarationToken,
    ValidationDimensionRangeMatch,
    ValidationDimensionToken,
    ValidationFunctionDefinitionToken,
    ValidationFunctionToken,
    ValidationKeywordToken,
    ValidationOptionalGroupToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationPseudoClassFunctionToken,
    ValidationStringToken,
    ValidationToken,
    ValidationValueRangeMatch,
} from "./parser/types.d.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum, ValidationTokenEnum } from "./parser/typedef.ts";
import type { ValidationContext, ValidationMatch } from "./types.d.ts";
import type { ValidationConfiguration, ValidationMediaFeature } from "../../@types/validation.d.ts";
import { funcLike, mFGT, mFLT, tokensfuncDefMap, tokensfuncSet } from "../syntax/constants.ts";
import { isColor, isValue, pseudoElements } from "../syntax/syntax.ts";
import { isDeclarationValue } from "../parser/utils/declaration.ts";
import { renderSyntax } from "./parser/parse.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";
import { renderToken } from "../renderer/render.ts";

const config: ValidationConfiguration = getSyntaxConfig();

// @ts-expect-error
const allValues = config.declarations.all!.syntax.split(/[\s|]+/g) as string[];

export const funcTypes: EnumToken[] = [
    ...tokensfuncDefMap.values(),
    EnumToken.FunctionTokenType,
    EnumToken.PseudoClassFuncTokenType,
];

export function trimArray(tokens: Token[]): Token[] {
    while (tokens[0]?.typ === EnumToken.WhitespaceTokenType) {
        tokens.shift();
    }

    while (tokens[tokens.length - 1]?.typ === EnumToken.WhitespaceTokenType) {
        tokens.pop();
    }

    return tokens;
}

export function isMFName(featureName: string): boolean {
    return featureName.startsWith("--") || featureName.toLowerCase() in config.mediaFeatures;
}

/**
 *
 * @param featureName
 * @returns
 */
export function getMFInfo(featureName: string): ValidationMediaFeature | null {
    // @ts-expect-error
    return (config.mediaFeatures[featureName.toLowerCase()] as ValidationMediaFeature) ?? null;
}

/**
 *
 * @param featureName
 * @param tokens
 * @returns object with:
 * - valid: boolean. true the media feaure is known or is a custom property. false otherwise
 * - success: boolean. validation result
 */
export function isMFValue(
    featureName: string,
    tokens: Token[],
    isMFRange?: boolean,
): { valid: boolean; success: boolean; isValueAllowed?: boolean } {
    // mf-value: <number> | <dimension> | <ident> | <ratio>

    tokens = tokens.filter(
        (token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
    );

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
    const mediaFeature = config.mediaFeatures[featureName] as ValidationMediaFeature;

    if (
        tokens.length === 1 &&
        tokens[0].typ === EnumToken.MathFunctionTokenType &&
        (tokens[0] as FunctionToken).val === "calc"
    ) {
        // todo: check calc tokens are of compatible types : resolution, ratio, length, integer, number?
        // https://github.com/web-platform-tests/wpt/blob/master/css/mediaqueries/mq-calc-sign-function-003.html
        return {
            valid: true,
            success:
                mediaFeature.type !== MediaFeatureType.KeywordType && mediaFeature.type !== MediaFeatureType.StringType,
        };
    }

    switch (mediaFeature.type) {
        case MediaFeatureType.BooleanType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    tokens[0].typ === EnumToken.NumberTokenType &&
                    ((tokens[0] as NumberToken).val === 0 || (tokens[0] as NumberToken).val === 1),
            };

        case MediaFeatureType.KeywordType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    tokens[0].typ === EnumToken.IdenTokenType &&
                    (mediaFeature.values as string[]).includes((tokens[0] as IdentToken).val.toLowerCase()),
            };

        case MediaFeatureType.LengthType:
            return { valid: true, success: tokens.length === 1 && tokens[0].typ == EnumToken.LengthTokenType };

        case MediaFeatureType.IntergerType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    tokens[0].typ == EnumToken.NumberTokenType &&
                    !(tokens[0] as NumberToken).val.toString().includes("."),
            };

        case MediaFeatureType.NumberType:
            return {
                valid: true,
                success:
                    tokens.length === 1 &&
                    tokens[0].typ == EnumToken.NumberTokenType &&
                    typeof (tokens[0] as NumberToken).val === "number",
            };

        case MediaFeatureType.StringType:
            return { valid: true, success: tokens.length === 1 && tokens[0].typ == EnumToken.StringTokenType };

        case MediaFeatureType.ResolutionType:
            return { valid: true, success: tokens.length === 1 && tokens[0].typ == EnumToken.ResolutionTokenType };

        case MediaFeatureType.RatioType:
            return {
                valid: true,
                success:
                    (tokens.length == 1 &&
                        tokens[0].typ == EnumToken.NumberTokenType &&
                        ((tokens[0] as NumberToken).val as FractionToken).typ == EnumToken.FractionTokenType) ||
                    (tokens.length === 3 &&
                        tokens[0].typ == EnumToken.NumberTokenType &&
                        typeof (tokens[0] as NumberToken).val === "number" &&
                        tokens[1].typ == EnumToken.LiteralTokenType &&
                        (tokens[1] as LiteralToken).val === "/" &&
                        tokens[2].typ == EnumToken.NumberTokenType &&
                        typeof (tokens[2] as NumberToken).val === "number"),
            };

        default:
            console.debug("Unknown media feature type " + mediaFeature.type);
        // throw new Error("Unknown media feature type " + mediaFeature.type);
    }

    return {
        valid: true,
        success: true,
    };
}

export function isStyleRangeValue(tokens: Token[]): { success: boolean; errors: ErrorDescription[] } {
    const filtered: Token[] = tokens.filter(
        (token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
    );

    const result = isDeclarationValue(tokens);

    if (result.success) {
        result.success = filtered.length > 0;
    }

    return result;
}

export function createValidationContext(tokens: Token[]): ValidationContext {
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

            while (
                this.tokens[this.index]?.typ == EnumToken.WhitespaceTokenType ||
                this.tokens[this.index]?.typ == EnumToken.CommentTokenType ||
                this.tokens[this.index]?.typ == EnumToken.CDOCOMMTokenType
            ) {
                this.index++;
            }

            return this.tokens[this.index];
        },
        peek(offset: number = 0, skipWhitespace = true) {
            let index: number = this.index;
            let token: Token = this.tokens[++index];

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
                while (
                    token?.typ == EnumToken.WhitespaceTokenType ||
                    token?.typ == EnumToken.CommentTokenType ||
                    token?.typ == EnumToken.CDOCOMMTokenType
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
         * @param stopCondition
         * @param matchCount
         * @returns
         */
        peekRange(
            open: EnumToken = EnumToken.StartParensTokenType,
            close: EnumToken = EnumToken.EndParensTokenType,
            counter: number = 0,
        ): Token[] {
            let index: number = this.index;
            let token: Token = this.tokens[index];
            // track balanced parens
            let matchCount: number = 0;
            const tokens: Token[] = [];

            while (index + 1 < this.tokens.length && this.tokens[index + 1]?.typ === EnumToken.WhitespaceTokenType) {
                index++;
            }

            while (index + 1 < this.tokens.length) {
                token = this.tokens[++index];

                if (token?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token?.typ)) {
                    matchCount++;
                } else if (token?.typ === EnumToken.EndParensTokenType) {
                    matchCount--;
                }

                if (matchCount >= 0) {
                    tokens.push(token);
                }

                if (matchCount === 0) {
                    if (close !== EnumToken.EndParensTokenType && token?.typ === close) {
                        counter--;
                    } else if (open !== EnumToken.StartParensTokenType && token?.typ === open) {
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
        split(split: EnumToken = EnumToken.CommaTokenType): Token[][] {
            let index: number = this.index;
            let token: Token = this.tokens[index];
            // track balanced parens
            let matchCount: number = 0;
            const tokens: Token[][] = [[]];

            while (index + 1 < this.tokens.length) {
                token = this.tokens[++index];

                if (token?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token?.typ)) {
                    matchCount++;
                } else if (token?.typ === EnumToken.EndParensTokenType) {
                    matchCount--;
                }

                // console.debug([matchCount, token?.typ === split]);

                if (matchCount === 0 && token.typ === split) {
                    (tokens.at(-1) as Token[]).push(token);
                    tokens.push([]);
                } else {
                    (tokens.at(-1) as Token[]).push(token);
                }
            }

            return tokens;
        },

        getRemainingTokens(): Token[] {
            return this.tokens.slice(this.index + 1);
        },
        last() {
            let index: number = this.tokens.length - 1;
            let token: Token = this.tokens[index];

            while (
                (this.index >= 0 && token?.typ === EnumToken.WhitespaceTokenType) ||
                token?.typ === EnumToken.CommentTokenType ||
                token?.typ === EnumToken.CDOCOMMTokenType ||
                token?.typ === EnumToken.InvalidCommentTokenType ||
                token?.typ === EnumToken.BadCommentTokenType ||
                token?.typ === EnumToken.BadStringTokenType
            ) {
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
            let token: Token = this.tokens[++this.index];

            while (
                token?.typ === EnumToken.WhitespaceTokenType ||
                token?.typ === EnumToken.CommentTokenType ||
                token?.typ === EnumToken.CDOCOMMTokenType ||
                token?.typ === EnumToken.InvalidCommentTokenType ||
                token?.typ === EnumToken.BadCommentTokenType ||
                token?.typ === EnumToken.BadStringTokenType
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
        update(token: Token) {
            const index = this.tokens.indexOf(token);

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
                        this.tokens[index].typ === EnumToken.WhitespaceTokenType ||
                        this.tokens[index].typ === EnumToken.CommentTokenType
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

export function matchSelectorSyntax(
    stream: Token[],
    errors: ErrorDescription[],
    options: ParserOptions | ValidationOptions,
    nested?: boolean,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const stack: Token[] = [];
    const tokens: Token[] = [];
    const nodes: EnumToken[] = [
        EnumToken.CommaTokenType,
        EnumToken.ColumnCombinatorTokenType,
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
    ];
    const trimWhitespaceBefore: EnumToken[] = nodes.concat(
        EnumToken.DelimTokenType,
        EnumToken.DashMatchTokenType,
        EnumToken.IncludeMatchTokenType,
        EnumToken.ContainMatchTokenType,
        EnumToken.StartMatchTokenType,
        EnumToken.EndMatchTokenType,
        EnumToken.AttrEndTokenType,
    );
    const trimWhitespaceAfter: EnumToken[] = nodes.concat(
        EnumToken.DelimTokenType,
        EnumToken.DashMatchTokenType,
        EnumToken.IncludeMatchTokenType,
        EnumToken.ContainMatchTokenType,
        EnumToken.StartMatchTokenType,
        EnumToken.EndMatchTokenType,
        EnumToken.AttrStartTokenType,
    );
    const enumMap: Map<EnumToken, EnumToken> = new Map([
        [EnumToken.Tilda, EnumToken.SubsequentSiblingCombinatorTokenType],
        [EnumToken.GtTokenType, EnumToken.ChildCombinatorTokenType],
    ]);

    let token: Token;
    let i: number = 0;
    let success: boolean = true;

    if (!nested) {
        while (
            i < stream.length &&
            (stream[i].typ === EnumToken.WhitespaceTokenType || stream[i].typ === EnumToken.CommentTokenType)
        ) {
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
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[stream[i].typ]} at ${stream[i].loc!.src}:${stream[i].loc!.sta.lin}:${
                                    stream[i].loc!.sta.col
                                }`,
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

        tokens.push(token);

        if (tokensfuncDefMap.has(token.typ)) {
            if (stack.at(-1)?.typ === EnumToken.CommaTokenType) {
                stack.pop();
            }

            stack.push(token);
            continue;
        }

        if (
            stack.length > 0 &&
            nodes.includes(stack.at(-1)!.typ) &&
            !nodes.includes(token.typ) &&
            token.typ !== EnumToken.WhitespaceTokenType &&
            token.typ !== EnumToken.CommentTokenType &&
            token.typ !== EnumToken.CDOCOMMTokenType
        ) {
            stack.pop();
        }

        if ((token.typ === EnumToken.LiteralTokenType && "+" === (token as LiteralToken).val)) {
            Object.assign(token, { typ: EnumToken.NextSiblingCombinatorTokenType });
            continue;
        }

        switch (token.typ) {
            case EnumToken.InvalidCommentTokenType:
            case EnumToken.BadCommentTokenType:
            case EnumToken.BadStringTokenType:
                break;

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
                                message: `Nesting selector is not allowed at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                    token.loc!.sta.col
                                }`,
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
                                message: `Unexpected combinator ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                    token.loc!.sta.col
                                }`,
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
                Object.assign(token, { typ: enumMap.get(token.typ)! });

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

                if (stack.length > 0 && nodes.includes(stack.at(-1)?.typ)) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected combinator ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                    token.loc!.sta.col
                                }`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }

                stack.push(token);
                break;

            case EnumToken.CommaTokenType:
                if (tokens.length === 0 || stack.at(-1)?.typ == EnumToken.CommaTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                    token.loc!.sta.col
                                }`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }

                stack.push(token);

                if (!nested) {
                    let k: number = i + 1;

                    while (
                        k < stream.length &&
                        (stream[k].typ === EnumToken.WhitespaceTokenType ||
                            stream[k].typ === EnumToken.CommentTokenType)
                    ) {
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
                                            message: `Unexpected token ${EnumToken[stream[k].typ]} at ${stream[k].loc!.src}:${stream[k].loc!.sta.lin}:${
                                                stream[k].loc!.sta.col
                                            }`,
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
                if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                    token.loc!.sta.col
                                }`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }

                break;

            case EnumToken.Star:
                // if (stack.length === 0) {

                Object.assign(token, { typ: EnumToken.UniversalSelectorTokenType });

                // if (stack.length > 0 && nodes.includes(stack.at(-1)?.typ)) {
                //
                //     stack.pop();
                // }
                // }

                break;

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
                if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                    token.loc!.sta.col
                                }`,
                                node: token,
                                location: token.loc,
                            },
                        ],
                    };
                }

                {
                    const k: number = tokens.length - 1;
                    let index: number = tokens.indexOf(stack.at(-1) as Token);
                    const slice: Token[] = [];

                    for (let n = index + 1; n < k; n++) {
                        if (
                            tokens[n].typ === EnumToken.WhitespaceTokenType ||
                            tokens[n].typ === EnumToken.CommentTokenType ||
                            tokens[n].typ === EnumToken.CDOCOMMTokenType
                        ) {
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
                                    message: `Invalid selector attribute at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                        token.loc!.sta.col
                                    }`,
                                    node: token,
                                    location: token.loc,
                                },
                            ],
                        };
                    }

                    if (slice[1]?.typ === EnumToken.Pipe) {
                        if (
                            slice[0].typ !== EnumToken.UniversalSelectorTokenType &&
                            slice[0].typ !== EnumToken.Star &&
                            slice[0].typ !== EnumToken.IdenTokenType
                        ) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Invalid selector attribute at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                            token.loc!.sta.col
                                        }`,
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
                                        message: `Invalid selector attribute at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                            token.loc!.sta.col
                                        }`,
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
                                        message: `Invalid selector attribute at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                            token.loc!.sta.col
                                        }`,
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
                                        message: `Invalid selector attribute at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                            token.loc!.sta.col
                                        }`,
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

                    if (
                        slice[0].typ != EnumToken.DelimTokenType &&
                        slice[0].typ !== EnumToken.DashMatchTokenType &&
                        slice[0].typ !== EnumToken.EndMatchTokenType &&
                        slice[0].typ !== EnumToken.IncludeMatchTokenType &&
                        slice[0].typ !== EnumToken.StartMatchTokenType &&
                        slice[0].typ !== EnumToken.ContainMatchTokenType
                    ) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc!.src}:${slice[0].loc!.sta.lin}:${
                                        slice[0].loc!.sta.col
                                    }`,
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
                                    message: `Invalid selector attribute at ${slice[0].loc!.src}:${slice[0].loc!.sta.lin}:${
                                        slice[0].loc!.sta.col
                                    }`,
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
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc!.src}:${slice[0].loc!.sta.lin}:${
                                        slice[0].loc!.sta.col
                                    }`,
                                    node: slice[0],
                                    location: slice[0].loc,
                                },
                            ],
                        };
                    }

                    if (
                        slice[0]?.typ === EnumToken.StringTokenType &&
                        /^[a-zA-Z0-9_-]+$/.test((slice[0] as StringToken).val.slice(1, -1))
                    ) {
                        Object.assign(slice[0], {
                            typ: EnumToken.IdenTokenType,
                            val: (slice[0] as StringToken).val.slice(1, -1),
                        });
                    }

                    slice.shift();

                    if (slice.length === 0) {
                        stack.pop();
                        break;
                    }

                    if (
                        slice[0].typ !== EnumToken.IdenTokenType ||
                        ((slice[0] as IdentToken).val != "i" && (slice[0] as IdentToken).val != "s")
                    ) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc!.src}:${slice[0].loc!.sta.lin}:${
                                        slice[0].loc!.sta.col
                                    }`,
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
                                    message: `Unexpected token ${EnumToken[slice[0].typ]} at ${slice[0].loc!.src}:${slice[0].loc!.sta.lin}:${
                                        slice[0].loc!.sta.col
                                    }`,
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
                    // if (
                    //     nodes.includes(stack.at(-1)?.typ)
                    // ) {
                    //     stack.pop();
                    // }

                    Object.assign(token, {
                        typ:
                            (stream[i + 1] as IdentToken).val === "page"
                                ? EnumToken.PseudoPageTokenType
                                : pseudoElements.includes((token as PseudoElementToken).val)
                                  ? EnumToken.PseudoElementTokenType
                                  : EnumToken.PseudoClassTokenType,
                        val: ":" + (stream[i + 1] as IdentToken).val,
                    });

                    token.loc!.end = stream[++i].loc!.end;
                    break;
                } else if (stream[i + 1]?.typ === EnumToken.FunctionTokenDefType) {
                    Object.assign(token, {
                        typ: EnumToken.PseudoClassFunctionTokenDefType,
                        val: ":" + (stream[i + 1] as IdentToken).val,
                    });
                    token.loc!.end = stream[++i].loc!.end;

                    stack.push(token);
                    // tokens.splice(i, 1);
                    break;
                }

                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                token.loc!.sta.col
                            }`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
                break;

            case EnumToken.DoubleColonTokenType:
                if (stream[i + 1]?.typ === EnumToken.IdenTokenType) {
                    Object.assign(token, {
                        typ:
                            (stream[i + 1] as IdentToken).val === "page"
                                ? EnumToken.PseudoPageTokenType
                                : EnumToken.PseudoElementTokenType,
                        val: "::" + (stream[i + 1] as IdentToken).val,
                    });
                    token.loc!.end = stream[++i].loc!.end;
                    // tokens.splice(i, 1);
                    break;
                } else if (stream[i + 1]?.typ === EnumToken.FunctionTokenDefType) {
                    Object.assign(token, {
                        typ: EnumToken.PseudoClassFunctionTokenDefType,
                        val: "::" + (stream[i + 1] as IdentToken).val,
                    });
                    token.loc!.end = stream[++i].loc!.end;
                    stack.push(token);
                    break;
                }

                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                token.loc!.sta.col
                            }`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
                break;

            case EnumToken.StartParensTokenType:
                if (
                    tokens.at(-2)?.typ === EnumToken.PseudoClassTokenType ||
                    tokens.at(-2)?.typ === EnumToken.PseudoElementTokenType
                ) {
                    stack.push(
                        Object.assign(tokens.at(-2) as Token, {
                            typ: EnumToken.PseudoClassFunctionTokenDefType,
                            chi: [],
                        }),
                    );
                    tokens.pop();
                    break;
                }

                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                token.loc!.sta.col
                            }`,
                            node: token,
                            location: token.loc,
                        },
                    ],
                };
                break;

            case EnumToken.EndParensTokenType:
                if (
                    stack.at(-1)?.typ === EnumToken.PseudoClassFunctionTokenDefType ||
                    stack.at(-1)?.typ === EnumToken.PseudoElementTokenType
                ) {
                    const token = stack.at(-1) as PseudoClassFunctionToken | PseudoElementToken;

                    if (!((stack.at(-1) as PseudoClassFunctionToken).val + "()" in config.selectors)) {
                        return {
                            errors: [
                                {
                                    action: "drop",
                                    message: `Unknown class element ${(token as PseudoElementToken).val}`,
                                    node: token,
                                    location: token.loc!,
                                },
                            ],
                            success: false,
                        };
                    }
                    // else {

                    const index: number = tokens.indexOf(token);
                    const result = matchAllSyntax(
                        ((
                            getParsedSyntax(
                                ValidationSyntaxGroupEnum.Selectors,
                                (token as PseudoClassFunctionToken).val + "()",
                            ) as ValidationFunctionToken[]
                        )?.[0]?.chi as ValidationToken[]) ?? [],
                        createValidationContext(tokens.slice(index + 1, tokens.length - 1)),
                        options,
                    );

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
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${
                                token.loc!.sta.col
                            }`,
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
                            message: `Unsupported selector token ${EnumToken[token.typ]} at ${token.loc!.src}:${
                                token.loc!.sta.lin
                            }:${token.loc!.sta.col}`,
                            node: token,
                            location: token.loc!,
                        },
                    ],
                };
        }

        if (
            token.typ === EnumToken.WhitespaceTokenType &&
            trimWhitespaceAfter.includes(tokens.at(-2)?.typ) &&
            tokens.at(-1)?.typ === EnumToken.WhitespaceTokenType
        ) {
            tokens.pop();
        } else if (trimWhitespaceBefore.includes(token.typ) && tokens.at(-2)?.typ === EnumToken.WhitespaceTokenType) {
            tokens.splice(tokens.length - 2, 1);
        }
    }

    if (stack.length > 0) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: `Unmatched token ${EnumToken[stack.at(-1)!.typ]} at ${stack.at(-1)!.loc!.src}:${
                        stack.at(-1)!.loc!.sta.lin
                    }:${stack.at(-1)!.loc!.sta.col}`,
                    node: stack.at(-1)! as Token,
                    location: stack.at(-1)!.loc!,
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
            location: tokens[0].loc!,
        });
    }

    return { success, errors };
}

export function matchAllSyntax(
    syntaxes: ValidationToken[] | null,
    context: ValidationContext,
    options: ParserOptions,
): ValidationMatch {
    const result = matchSyntax(syntaxes, context, {
        ...options,
        visited: new Map<Token, Set<ValidationToken>>(),
    }) as ValidationMatch;

    // console.debug(result);

    if (result.success && !result.context.done()) {
        const node = result.context.peek() as Token;

        return {
            ...result,
            success: false,
            token: context.peek(),
            errors: [
                ...result.errors,
                {
                    action: "drop",
                    message: `Unexpected token ${EnumToken[node?.typ]} at ${node!.loc?.src}:${node!.loc?.sta?.lin}:${
                        node!.loc?.sta?.col
                    }`,
                    node,
                    syntax:
                        result.syntaxToken ??
                        syntaxes?.reduce?.((acc, b) => acc + renderSyntax(b), "")?.trim?.() ??
                        null,
                },
            ],
        };
    }

    if (syntaxes != null && result.success && result.syntaxToken != null) {
        const index: number = syntaxes.indexOf(result.syntaxToken);

        if (index != -1) {
            for (let i = index; i < syntaxes.length; i++) {
                if (
                    // syntaxes[i] === result.syntaxToken ||
                    syntaxes[i].typ == ValidationTokenEnum.Whitespace ||
                    syntaxes[i].isOptional ||
                    syntaxes[i].isRepeatable
                ) {
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
        // }
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
                          location: result.token?.loc! ?? context.tokens.at(-1)?.loc,
                      },
                  ]
                : result.errors,
        syntaxToken: !result.success ? result.syntaxToken : null,
    };
}

function matchListSyntax(
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
    let token: Token | null = null;

    success = false;

    do {
        range = context.peekRange(EnumToken.CommaTokenType, EnumToken.CommaTokenType, 1);
        tmpResult = matchSyntax(
            [rest],
            createValidationContext(range.at(-1)?.typ === EnumToken.CommaTokenType ? range.slice(0, -1) : range),
            options,
        );

        if (tmpResult.success) {
            count++;
            success = true;
            result = tmpResult;

            context.update(range.at(-1) as Token);

            if (context.done()) {
                // context.end();
                break;
            }

            if (Number.isFinite(match?.max?.val) && count === (match!.max!.val as number)) {
                break;
            }
        }
    } while (tmpResult.success && !context.done());

    if (result?.success && match != null) {
        if (count < match.min!.val || (Number.isFinite(match.max) && count > (match.max!.val as number))) {
            return {
                ...result,
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: "could not match syntax",
                        node: context.peek(),
                        location: context.peek()?.loc!,
                    },
                ],
            };
        }
    }

    return {
        ...(result ?? tmpResult),
        success,
        context,
        token: context.peek(),
    };
}

export function matchOccurenceSyntax(
    syntax: ValidationToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const { match, ...rest } = syntax;
    let result: ValidationMatch | null = null;
    let tmpResult: ValidationMatch;
    let count: number = 0;

    do {
        tmpResult = matchSyntax([rest], context.slice(), options);

        // console.debug({syntax,tmpResult});

        if (tmpResult.success) {
            count++;
            result = tmpResult;

            if (tmpResult.context.done()) {
                context.end();
                break;
            }

            context.update(tmpResult.context.current() as Token);

            // console.debug(['match?.max?.val != null && Number.isFinite(match?.max?.val) && count === (match!.max!.val as number)', match?.max?.val != null , Number.isFinite(match?.max?.val) , count === (match!.max!.val as number)])

            if (match?.max?.val != null && Number.isFinite(match?.max?.val) && count === (match!.max!.val as number)) {
                break;
            }
        }
    } while (tmpResult.success && !context.done());

    if (
        match != null &&
        (count < match!.min!.val || (Number.isFinite(match!.max?.val) && count > (match!.max!.val as number)))
    ) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "could not match syntax",
                    node: context.peek(),
                    location: context.peek()?.loc!,
                },
            ],
            syntaxToken: null,
            valid: true,
            context,
            token: null,
        };
    }

    // console.debug({result3: result, match, count});

    return (
        (result as ValidationMatch) ?? {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "could not match syntax",
                    node: context.peek(),
                    location: context.peek()!.loc!,
                },
            ],
            syntaxToken: syntax,
            valid: true,
            context,
            token: context.peek(),
        }
    );
}

function matchSyntax(
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

    syntaxes = syntaxes.slice();

    let i: number = -1;
    let success: boolean;
    let token: Token | null = null;
    let result: ValidationMatch | null = null;
    let isOptional: boolean;

    // console.debug('[ ');
    // console.debug(' > ' + syntaxes.reduce((acc, b) => acc + renderSyntax(b), ""));
    // console.debug(' > ' + context.getRemainingTokens().reduce((acc, b) => acc + renderToken(b), ""));
    // console.debug('] ');

    // console.debug(JSON.stringify(syntaxes, null, 1));
    // console.debug(new Error('debug'));
    //
    // console.debug(JSON.stringify({tokens: context.getRemainingTokens(), syntaxes: syntaxes}, null, 1));

    if (
        context.tokens.length == 1 &&
        context.tokens[0].typ == EnumToken.IdenTokenType &&
        allValues.some((v) => equalsIgnoreCase(v, (context.tokens[0] as IdentToken).val))
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

        // console.debug([syntaxes[i], context.peek()]);

        isOptional =
            (syntaxes[i].isOptional === true ||
                syntaxes[i].isRepeatable === true ||
                syntaxes[i].isRepeatable === true) &&
            !syntaxes[i].isMandatatoryGroup;
        token = context.peek();

        // console.debug({token, syntax: syntaxes[i]});
        // console.debug(new Error("123"));

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

        // console.debug(

        //         {
        //             op: ValidationTokenEnum[syntaxes[i].typ],
        //             slice: JSON.stringify(context.slice()),
        //             s: JSON.stringify(syntaxes[i]),
        //             syntax: renderSyntax(syntaxes[i]), // renderSyntax(),
        //             token,
        //             // result
        //         }
        // );

        // console.debug(new Error("123"));

        // console.debug({token});

        if (token.typ === EnumToken.WildCardFunctionTokenType && (token as FunctionToken).val === "var") {
            result = matchSyntax(
                (
                    getParsedSyntax(
                        ValidationSyntaxGroupEnum.Syntaxes,
                        (token as FunctionToken).val + "()",
                    ) as ValidationFunctionToken[]
                )?.[0]?.chi,
                createValidationContext((token as FunctionToken).chi),
                options,
            );

            if (result.success || isOptional) {
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
                        location: context.peek()!.loc!,
                    },
                ],
            };
        }

        // custom function token
        if (token.typ === EnumToken.CustomFunctionTokenDefType) {
            if (
                syntaxes[i].typ != ValidationTokenEnum.PropertyType ||
                syntaxes[i + 1].typ != ValidationTokenEnum.OpenParenthesis ||
                syntaxes[i + 2].typ == null
            ) {
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
                context.update(range.at(-1) as Token);
                i += 2;
            }

            return result;
        }

        if (
            tokensfuncDefMap.has(token.typ) &&
            ((token as FunctionToken).typ === EnumToken.WildCardFunctionTokenDefType)
            // ||                (token as FunctionToken).val.toLowerCase() ===
            //     (syntaxes[i] as ValidationFunctionToken).val?.toLowerCase?.()
        ) {
            const range = trimArray(context.peekRange());

            result = matchSyntax(
                (
                    getParsedSyntax(
                        ValidationSyntaxGroupEnum.Syntaxes,
                        (token as FunctionToken).val + "()",
                    ) as ValidationFunctionToken[]
                )?.[0]?.chi as ValidationToken[],

                createValidationContext(range.slice(1, -1)),
                options,
            );

            if (result.success) {
                context.update(range.at(-1) as Token);

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

                context.update(result.context.current() as Token);
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
                (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

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

                context.update(result.context.current() as Token);

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
                if (
                    syntaxes[i + 1]?.typ === ValidationTokenEnum.Whitespace ||
                    syntaxes[i + 1]?.typ === ValidationTokenEnum.Comma
                ) {
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

            // console.debug(result);

            if (result.success) {
                (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);

                // console.debug({tokens: context.slice().tokens, remaining: result.context.getRemainingTokens(),result2: result, done: result.context.done(), index: result.context.index});

                if (result.context.done()) {
                    context.end();

                    return {
                        ...result,
                        context,
                        syntaxToken: syntaxes[++i],
                    };
                }

                // console.debug([result.context.current(), result.context.peek(), syntaxes[i] ]);

                context.update(result.context.current() as Token);
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

        if (!options.visited!.has(token)) {
            options.visited!.set(token, new Set<ValidationToken>());
        }

        if ((options.visited!.get(token) as Set<ValidationToken>)!.has(syntaxes[i])) {
            // console.error(`cyclic definition : ${JSON.stringify({ syntax: syntaxes[i], token }, null, 1)}`);
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
            case ValidationTokenEnum.Colon:
                if (token.typ == EnumToken.ColonTokenType) {
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
            case ValidationTokenEnum.Keyword:
                if (
                    token.typ == EnumToken.IdenTokenType &&
                    (token as IdentToken).val.toLowerCase() ===
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
                            context.update(result.context.current() as Token);
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

                // console.debug(JSON.stringify({tokens, s: (syntaxes[i] as ValidationOptionalGroupToken).chi}, null, 1));

                for (; j < tokens.length; j++) {
                    result = matchSyntax((syntaxes[i] as ValidationOptionalGroupToken).chi, context.slice(), options);

                    if (result.success) {
                        context.update(tokens[j].at(-1) as Token);
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

            case ValidationTokenEnum.StringToken:
                if (token.typ == EnumToken.StringTokenType || token.typ == EnumToken.UrlFunctionTokenType) {
                    success = true;
                } else if (token.typ === EnumToken.StringTokenType) {
                    success = (token as StringToken).val === (syntaxes[i] as ValidationStringToken).val.slice(1, -1);
                } else if (token.typ === EnumToken.Add) {
                    success = (syntaxes[i] as ValidationStringToken).val.slice(1, -1) === "+";
                } else if (token.typ === EnumToken.Mul) {
                    success = (syntaxes[i] as ValidationStringToken).val.slice(1, -1) === "*";
                } else if (token.typ === EnumToken.Div) {
                    success = (syntaxes[i] as ValidationStringToken).val.slice(1, -1) === "/";
                } else if (token.typ === EnumToken.Sub) {
                    success = (syntaxes[i] as ValidationStringToken).val.slice(1, -1) === "-";
                } else if (token.typ === EnumToken.LiteralTokenType) {
                    success = (token as LiteralToken).val === (syntaxes[i] as ValidationStringToken).val.slice(1, -1);
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

            case ValidationTokenEnum.PropertyType:
                result = matchProperty(syntaxes[i] as ValidationPropertyToken, context, options);

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
                    context.update(result.context.current() as Token);
                }

                // console.debug({result6: result, done: context.done(), s: syntaxes[i], i, l: syntaxes.length, token});

                // console.debug(
                //         JSON.stringify({
                //             op: ValidationTokenEnum[syntaxes[i].typ],
                //             slice:
                //     context.slice(),
                //             s: syntaxes[i],
                //             syntax: renderSyntax(syntaxes[i]), // renderSyntax(),
                //             result

                //         } , null, 1
                //     )
                // );

                // console.debug(new Error('123'));

                break;

            case ValidationTokenEnum.PipeToken:
                {
                    result = null;
                    const results: ValidationMatch[] = [];

                    let tmp: ValidationMatch | null = null;

                    for (const syntax of (syntaxes[i] as ValidationPipeToken).chi) {
                        tmp = matchSyntax(syntax, context.slice(), options);

                        // console.debug(
                        //         {
                        //             op: ValidationTokenEnum[syntaxes[i].typ],
                        //             slice:
                        //     JSON.stringify(context.slice()
                        //     ),
                        //             s: JSON.stringify(syntaxes[i]),
                        //             syntax: syntax.reduce((acc, b) => acc + renderSyntax(b), ""), // renderSyntax(),
                        //             // isOptional,
                        //             result
                        //         }
                        // );

                        // console.debug(new Error('123'));

                        // if (result.success) {
                        //     break;
                        // }

                        // console.debug([token, syntax, tmp]);

                        if (tmp.success) {
                            results.push(tmp);

                            // console.debug({tmp,  syntax, rem: context.getRemainingTokens()});

                            if (tmp.context.done()) {
                                context.end();
                                return { ...tmp, context, syntaxToken: syntaxes[i + 1] };
                                // break;
                            }
                        }
                    }

                    if (results.length > 0) {
                        result = results.reduce((a, b) => (a.context.index > b.context.index ? a : b));
                    }

                    if (result?.success) {
                        success = true;
                        options.visited!.get(token)!.delete(syntaxes[i]);

                        if (result!.context.done()) {
                            context.end();
                        } else {
                            context.update(result!.context.current() as Token);
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
                result = matchSyntax((syntaxes[i] as ValidationBracketToken).chi, context.slice(), options);

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
                        context.update(result.context.current() as Token);
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
                result = matchColumnSyntax(syntaxes[i] as ValidationColumnToken, context.slice(), options);

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
                        context.update(result.context.current() as Token);
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
                result = matchAmpersandSyntax(syntaxes[i] as ValidationAmpersandToken, context.slice(), options);

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
                        context.update(result.context.current() as Token);
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
                if (!((token as PseudoClassFunctionToken).val + "()" in config.selectors)) {
                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: syntaxes[i],
                        errors: [
                            {
                                action: "drop",
                                message: `Unknown pseudo-class selector ${(token as PseudoClassFunctionToken).val}()`,
                                node: token,
                            },
                        ],
                    };
                }

                result = matchSyntax(
                    ((
                        getParsedSyntax(
                            ValidationSyntaxGroupEnum.Selectors,
                            (token as PseudoClassFunctionToken).val + "()",
                        ) as [ValidationPseudoClassFunctionToken]
                    )?.[0]?.chi as ValidationToken[]) ?? [],
                    createValidationContext((token as PseudoClassFunctionToken).chi),
                    options,
                );

                if (result.success) {
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
                    errors: result.errors,
                };

            case ValidationTokenEnum.Function:
                // console.debug(JSON.stringify({token, syntax: syntaxes[i]}));

                if (
                    (!tokensfuncDefMap.has(token.typ) &&
                        !funcLike.includes(token.typ) &&
                        !funcTypes.includes(token.typ)) ||
                    !("val" in token) ||
                    !equalsIgnoreCase(
                        (syntaxes[i] as ValidationFunctionToken).val,
                        (token as FunctionToken).val.toLowerCase(),
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
                                message: `Expecting a function ${EnumToken[(token as FunctionToken).typ]}`,
                                node: token,
                            },
                        ],
                    };
                }

                if (tokensfuncDefMap.has(token.typ)) {
                    const range = context.peekRange();

                    if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                        const tk = range.at(-1) as Token;
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

                    // console.debug("Function token", (syntaxes[i] as ValidationFunctionToken));

                    result = matchSyntax(
                        (syntaxes[i] as ValidationFunctionToken).chi as ValidationToken[],
                        // (getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (syntaxes[i] as ValidationFunctionToken).val + '()') as ValidationFunctionToken[])[0].chi as ValidationToken[],
                        createValidationContext(range.slice(1, -1)),
                        options,
                    );

                    // console.debug(ValidationSyntaxGroupEnum.Syntaxes + '.' + (syntaxes[i] as ValidationFunctionToken).val + '()')
                    // console.debug({range, result});

                    if (result.success) {
                        context.update(range.at(-1) as Token);
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                    }

                    break;
                } else {
                    result = matchSyntax(
                        (syntaxes[i] as ValidationFunctionToken).chi as ValidationToken[],
                        createValidationContext((token as FunctionToken).chi),
                        options,
                    );
                }

                if (result.success) {
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
                    errors: result.errors,
                };

            case ValidationTokenEnum.Comma:
                if (token.typ !== EnumToken.CommaTokenType && isOptional) {
                    let k: number = i;

                    while (syntaxes[--k]?.typ === ValidationTokenEnum.Whitespace) {}

                    // ignore the comma if the previous token is a list
                    if (syntaxes[k]?.isList) {
                        continue;
                    }
                }

                if (token.typ === EnumToken.CommaTokenType) {
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

            case ValidationTokenEnum.LessThan:
                if (token.typ === EnumToken.LtTokenType) {
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

            case ValidationTokenEnum.Separator:
                if (token.typ === EnumToken.LiteralTokenType && (token as LiteralToken).val === "/") {
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
                    tokensfuncDefMap.has(token.typ) &&
                    equalsIgnoreCase(
                        (token as FunctionToken).val,
                        (syntaxes[i] as ValidationFunctionDefinitionToken).val,
                    )
                ) {
                    const children = trimArray(context.peekRange());

                    // console.debug(JSON.stringify({token, syntax: syntaxes[i], children, s: (
                    //             (
                    //                 getParsedSyntax(
                    //                     ValidationSyntaxGroupEnum.Syntaxes,
                    //                     (syntaxes[i] as ValidationFunctionDefinitionToken).val + "()",
                    //                 ) as ValidationFunctionToken[] as ValidationToken[]
                    //             )?.[0] as ValidationFunctionToken
                    //         ).chi}, null, 1));

                    result = matchSyntax(
                        (
                            (
                                getParsedSyntax(
                                    ValidationSyntaxGroupEnum.Syntaxes,
                                    (syntaxes[i] as ValidationFunctionDefinitionToken).val + "()",
                                ) as ValidationFunctionToken[] as ValidationToken[]
                            )?.[0] as ValidationFunctionToken
                        ).chi ?? [],
                        createValidationContext(children.slice(1, -1)),
                        options,
                    );

                    // console.debug(
                    //     // JSON.stringify(
                    //         [
                    //     // (
                    //     //     (
                    //     //         getParsedSyntax(
                    //     //             ValidationSyntaxGroupEnum.Syntaxes,
                    //     //             (syntaxes[i] as ValidationFunctionDefinitionToken).val + "()",
                    //     //         ) as ValidationFunctionToken[] as ValidationToken[]
                    //     //     )?.[0] as ValidationFunctionToken
                    //     // ).chi,
                    //     // children.slice(1, -1),
                    //     {result, children, tk: result.token, syn: result.syntaxToken}]
                    //     // , null, 1)
                    // );

                    if (result.success) {
                        success = true;
                        (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                        context.update(children.at(-1) as Token);
                        break;
                    }

                    // success = context.peek()?.typ === EnumToken.EndParensTokenType;

                    // if (success) {
                    //     context.next();
                    //     (options.visited!.get(token) as Set<ValidationToken>)!.delete(syntaxes[i]);
                    // }
                } else if (
                    tokensfuncSet.has(token.typ) &&
                    equalsIgnoreCase(
                        (token as FunctionToken).val,
                        (syntaxes[i] as ValidationFunctionDefinitionToken).val,
                    )
                ) {
                    result = matchSyntax(
                        (getParsedSyntax(
                            ValidationSyntaxGroupEnum.Syntaxes,
                            (syntaxes[i] as ValidationFunctionDefinitionToken).val + "()",
                        ) as ValidationFunctionToken[] as ValidationToken[]) ?? [],
                        createValidationContext([token as FunctionToken]),
                        options,
                    );

                    if (result.success) {
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
                    errors: [],
                };

            case ValidationTokenEnum.OpenParenthesis:
                if (token.typ === EnumToken.StartParensTokenType) {
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

            case ValidationTokenEnum.CloseParenthesis:
                if (token.typ === EnumToken.EndParensTokenType) {
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

            case ValidationTokenEnum.DeclarationNameToken:
                result = matchSyntax(
                    (getParsedSyntax(
                        ValidationSyntaxGroupEnum.Declarations,
                        (syntaxes[i] as ValidationDeclarationToken).val,
                    ) as ValidationFunctionToken[] as ValidationToken[]) ?? [],
                    context.slice(),
                    options,
                );

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
                    context.update(result.context.current() as Token);
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
                // console.error("syntax => ", syntaxes[i]);
                throw new Error(`Unexpected syntax ${ValidationTokenEnum[syntaxes[i].typ]}`);
        }

        if (
            success &&
            "range" in syntaxes[i] &&
            !(
                token?.typ === EnumToken.MathFunctionTokenType ||
                token?.typ === EnumToken.MathFunctionTokenDefType ||
                (token?.typ === EnumToken.WildCardFunctionTokenDefType)
            )
        ) {
            let success = false;
            success =
                typeof (token as NumberToken).val === "number" &&
                ((token as NumberToken).val as number) >=
                    (syntaxes[i].range as ValidationValueRangeMatch | ValidationDimensionRangeMatch).min.val;

            if ((syntaxes[i].range!.min as ValidationToken).typ === ValidationTokenEnum.Dimension) {
                success =
                    (token as NumberToken).typ ===
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
                    ((token as NumberToken).val as number) <=
                    (syntaxes[i].range as ValidationValueRangeMatch | ValidationDimensionRangeMatch).max!.val;
            }

            // console.debug({token, success});

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

    // console.debug({result7: result});

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

function matchColumnSyntax(
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
        // console.debug({
        //     index1: context.index,
        //     done1: context.done(),
        //     curr1: context.current(),
        //     peek1: context.peek(),
        //     s1: syntaxes[i].reduce((acc, b) => acc + renderSyntax(b), ""),
        // });

        result = matchSyntax(syntaxes[i], context.slice(), options);

        // console.debug([result.success,result.context.current()]);

        if (result.success) {
            const curr = result.context.current() as Token;

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

            const syn = syntaxes[i];

            // console.debug('<<< ' + syntaxes[i].reduce((acc, b) => acc + renderSyntax(b), ""));
            syntaxes.splice(i, 1);

            // console.debug({
            //     result,
            //     index: result.context.index,
            //     done: result.context.done(),
            //     curr: result.context.current(),
            //     peek: result.context.peek(),
            //     syn: syn.reduce((acc, b) => acc + renderSyntax(b), ""),
            //     s: syntaxes.reduce((acc, b) => acc + (acc.length > 0 ? " || " : "") + b.reduce((acc, b) => acc + renderSyntax(b), ""), ''),
            //     success: result.success,
            // });

            // console.debug(new Error("bg"));

            // console.debug(
            //     ">>> " +
            //         syntaxes.reduce(
            //             (acc, b) =>
            //                 acc + (acc.length > 0 ? " || " : "") + b.reduce((acc, b) => acc + renderSyntax(b), ""),
            //             "",
            //         ),
            // );

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

function matchAmpersandSyntax(
    syntax: ValidationAmpersandToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const syntaxes = [syntax.l, syntax.r];
    let result: ValidationMatch;
    let i: number;
    let success: boolean = false;

    for (i = 0; i < syntaxes.length; i++) {
        result = matchSyntax(syntaxes[i], context.slice(), options);

        if (result.success) {
            success = true;
            if (result.context.done()) {
                context.end();
                break;
            }

            context.update(result.context.current() as Token);
            syntaxes.splice(i, 1);
            i = -1;
        }
    }

    return (
        /* syntaxes.length === 0 ? */ result! ?? {
            success,
            valid: true,
            token: context.peek(),
            context,
            syntaxToken: syntax,
            errors: [],
        }
    );
}

function matchProperty(
    property: ValidationPropertyToken,
    context: ValidationContext,
    options: ParserOptions | ValidationOptions,
): ValidationMatch {
    let success: boolean = false;

    // console.debug({rem: context.getRemainingTokens(), property});

    let checkCalc: boolean =
        context.peek()?.typ == EnumToken.MathFunctionTokenDefType &&
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
        checkCalc = (context.peek() as FunctionToken).val === "calc";
    }

    // console.debug({checkCalc, property, tk: context.peek()});

    // console.debug(JSON.stringify({property,checkCalc, peek: context.peek()}, null, 1));

    if (checkCalc) {
        const range = context.peekRange();

        // console.debug([
        // (getParsedSyntax(
        //         ValidationSyntaxGroupEnum.Syntaxes,
        //         (context.peek() as FunctionToken).val + "()",
        //     ) as ValidationFunctionToken[]
        // )?.[0]?.chi,
        // range.slice(1, -1),
        // range,
        // context.getRemainingTokens(),
        // ]);

        const result = matchSyntax(
            (
                getParsedSyntax(
                    ValidationSyntaxGroupEnum.Syntaxes,
                    (context.peek() as FunctionToken).val + "()",
                ) as ValidationFunctionToken[]
            )?.[0]?.chi,
            createValidationContext(range.slice(1, -1)),
            options as ValidationOptions,
        );

        // console.debug(new Error('d'));

        // console.debug(new Error('d'));

        if (result.success) {
            context.update(range.at(-1) as Token);

            // console.debug({calcR: result, done: context.done(), pk: context.peek()});

            // console.debug(context.getRemainingTokens());

            return {
                success: true,
                valid: true,
                token: range.at(-1) as Token,
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

    switch (property.val) {
        case "combinator":
            {
                const token = context.peek() as Token;

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
                let expectToken: boolean = true;
                let token: Token | null;

                const stack: Token[] = [];

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
                    // token = context.peek();
                    expectToken = true;
                }

                while ((token = context.peek()) != null) {
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
                                        message: `Unexpected token ${EnumToken[token?.typ]} at ${token!.loc?.src}:${token!.loc?.sta?.lin}:${token!.loc?.sta?.col}`,
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
                        } else {
                            return {
                                success: false,
                                valid: true,
                                token,
                                context,
                                syntaxToken: property,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `Unexpected token ${EnumToken[token?.typ]} at ${token!.loc?.src}:${token!.loc?.sta?.lin}:${token!.loc?.sta?.col}`,
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
                    token = stack.at(-1) as Token;

                    return {
                        success: false,
                        valid: true,
                        token,
                        context,
                        syntaxToken: property,
                        errors: [
                            {
                                action: "drop",
                                message: `unbalanced parentheses ${EnumToken[token?.typ]} at ${token!.loc?.src}:${token!.loc?.sta?.lin}:${token!.loc?.sta?.col}`,
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
                const result = matchSyntax(
                    (getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc()") as ValidationFunctionToken[])[0].chi,
                    createValidationContext((token as ParensToken).chi),
                    options,
                );

                success = result.success;
                break;
            }

            //
            if (token?.typ === EnumToken.BinaryExpressionTokenType) {
                // const expr: string =
                //     (token as BinaryExpressionToken).op === EnumToken.Add ||
                //     (token as BinaryExpressionToken).op === EnumToken.Sub
                //         ? "calc-sum"
                //         : "calc-product";

                let result = matchSyntax(
                    getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"),
                    createValidationContext([(token as BinaryExpressionToken).l]),
                    options,
                );
                if (result.success) {
                    result = matchSyntax(
                        getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"),
                        createValidationContext([(token as BinaryExpressionToken).r]),
                        options,
                    );
                }

                success = result.success;
                break;
            }

            const result = matchSyntax(
                getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "calc-sum"),
                context.slice(),
                options,
            );

            success = result.success;

            if (success) {
                if (result.context.done()) {
                    context.end();
                } else {
                    context.update(result.context.current() as Token);
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
                let token = context.peek() as Token;

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

                if (
                    token.typ === EnumToken.IdenTokenType &&
                    ("even" === (token as IdentToken).val || "odd" === (token as IdentToken).val)
                ) {
                    success = true;
                    break;
                }

                if (
                    token.typ === EnumToken.NumberTokenType &&
                    Number.isInteger((token as NumberToken).val) &&
                    !(token as NumberToken).toString().includes(".")
                ) {
                    success = true;
                    break;
                }

                if (token.typ === EnumToken.LiteralTokenType || token.typ === EnumToken.IdenTokenType) {
                    let match = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec((token as LiteralToken).val);

                    success = match != null;

                    if (!success) {
                        success = /^(([+-]?[0-9]*)?n)?([+-])?$/.test((token as LiteralToken).val);

                        if (success) {
                            token = context.peek(1) as Token;

                            success =
                                token?.typ === EnumToken.NumberTokenType &&
                                Number.isInteger((token as NumberToken).val) &&
                                !(token as NumberToken).toString().includes(".") &&
                                (token as NumberToken).sign == null;

                            context.next();
                        }
                    } else if (match?.[3] == null) {
                        token = context.peek(1) as Token;

                        if (
                            token?.typ === EnumToken.Add ||
                            token?.typ === EnumToken.NextSiblingCombinatorTokenType ||
                            token?.typ === EnumToken.Sub
                        ) {
                            token = context.peek(2) as Token;

                            success =
                                token?.typ === EnumToken.NumberTokenType &&
                                Number.isInteger((token as NumberToken).val) &&
                                !(token as NumberToken).toString().includes(".") &&
                                (token as NumberToken).sign == null;
                        } else if (token?.typ === EnumToken.NumberTokenType) {
                            success =
                                Number.isInteger((token as NumberToken).val) &&
                                !(token as NumberToken).toString().includes(".") &&
                                (token as NumberToken).sign != null;
                        }

                        if (success) {
                            context.update(token as Token);

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

                if (token.typ === EnumToken.DimensionTokenType && (token as DimensionToken).unit === "n") {
                    success =
                        Number.isInteger((token as DimensionToken).val) &&
                        !(token as DimensionToken).toString().includes(".");

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

                    token = context.peek(1) as Token;

                    if (token == null) {
                        break;
                    }

                    if (token.typ === EnumToken.NumberTokenType) {
                        if (
                            Number.isInteger((token as NumberToken).val) &&
                            !(token as NumberToken).toString().includes(".") &&
                            ["+", "-"].includes((token as NumberToken).sign as string)
                        ) {
                            success = true;
                            context.next();
                        }
                        break;
                    }

                    if (token?.typ === EnumToken.NextSiblingCombinatorTokenType) {
                        Object.assign(token, { typ: EnumToken.Add });
                    }

                    token = context.peek(2) as Token;

                    if (token == null) {
                        break;
                    }

                    if (
                        token?.typ === EnumToken.NumberTokenType &&
                        Number.isInteger((token as NumberToken).val) &&
                        !(token as NumberToken).toString().includes(".") &&
                        (token as NumberToken).sign == null
                    ) {
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
                    !(token as DimensionToken).val.toString().includes(".") &&
                    Number.isInteger((token as DimensionToken).val);
            }
            break;

        case "ndashdigit-ident":
            {
                const token = context.peek();

                success =
                    (token?.typ === EnumToken.IdenTokenType || token?.typ === EnumToken.LiteralTokenType) &&
                    /^-?n[-+]\d+$/.test((token as IdentToken | LiteralToken).val);
            }

            break;

        case "dimension-token":
            {
                const token = context.peek();

                success =
                    token?.typ === EnumToken.DimensionTokenType &&
                    (token as DimensionToken).unit === "n" &&
                    !(token as DimensionToken).val.toString().includes(".") &&
                    Number.isInteger((token as DimensionToken).val);
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
                    .includes((context.peek() as IdentToken).val.toLowerCase());
            break;

        case "mf-name":
            {
                const token = context.peek();
                success =
                    token?.typ === EnumToken.IdenTokenType &&
                    (token as IdentToken).val.toLowerCase() in config.mediaFeatures;
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
                const val: string = (context.peek() as IdentToken).val.toLowerCase();
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
                    token: success ? context.update(context.peek(1) as Token).current() : context.peek(),
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            } else if (context.peek(1)?.typ == EnumToken.Pipe) {
                const success =
                    context.peek()?.typ === EnumToken.Star && context.peek(2)?.typ === EnumToken.IdenTokenType;

                return {
                    success,
                    valid: true,
                    token: success ? context.update(context.peek(2) as Token).current() : context.peek(),
                    context,
                    syntaxToken: property,
                    errors: [],
                };
            } else {
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
            success = token?.typ == EnumToken.NumberTokenType && (token as NumberToken).val === 0;
            break;
        }

        case "integer":
            {
                const token = context.peek();

                success =
                    token?.typ == EnumToken.NumberTokenType && Number.isInteger(Number((token as NumberToken).val));
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
                    (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val === 0);
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
                (token.typ == EnumToken.NumberTokenType && (token as NumberToken).val === 0);
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
                token != null && token.typ == EnumToken.ColorTokenType && (token as ColorToken).kin == ColorType.HEX;
            break;
        }

        case "color":
        case "color-function":
            {
                const token = context.peek();
                const errors: ErrorDescription[] = [];

                if (tokensfuncDefMap.has(token?.typ)) {
                    const range = context.peekRange();

                    const result = matchSyntax(
                        getParsedSyntax(
                            ValidationSyntaxGroupEnum.Syntaxes,
                            (token as FunctionToken).val + "()",
                        ) as ValidationFunctionToken[],
                        createValidationContext(range),
                        options,
                    );

                    if (result.success) {
                        context.update(range.at(-1) as Token);
                        return {
                            success: true,
                            valid: true,
                            token: context.peek(),
                            context,
                            syntaxToken: null,
                            errors: [],
                        };
                    }

                    return result;
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
        case "complex-selector-list": {
            const tokens = context.getRemainingTokens();
            const result = matchSelectorSyntax(tokens, [], options);

            if (result.success) {
                context.update(tokens.at(-1) as Token);
            }

            return {
                success: result.success,
                valid: true,
                token: context.peek(),
                context,
                syntaxToken: property,
                errors: result.errors,
            };
        }

        case "function-token":
            if (
                context.peek()?.typ == EnumToken.IdenTokenType &&
                context.peek(1, false)?.typ == EnumToken.StartParensTokenType
            ) {
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
                (config.languages as string[]).some(
                    (t) => t === (token as IdentToken).val || (token as IdentToken).val.startsWith(t + "-"),
                );
            break;
        }

        case "named-color": {
            const token = context.peek();
            success =
                token != null &&
                token.typ == EnumToken.ColorTokenType &&
                ((token as ColorToken).kin == ColorType.LIT ||
                    (token as ColorToken).kin == ColorType.SYS ||
                    (token as ColorToken).kin == ColorType.DPSYS ||
                    (token as ColorToken).kin == ColorType.NON_STD);
            break;
        }

        case "size-feature": {
            const range = context.peekRange();

            const filteredRange = range.filter(
                (token: Token) =>
                    token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
            );

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

            if (
                !mFLT.has(filteredRange[1]?.typ) &&
                !mFGT.has(filteredRange[1]?.typ) &&
                filteredRange[1]?.typ !== EnumToken.ColonTokenType &&
                filteredRange[1]?.typ !== EnumToken.DelimTokenType
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
            const filteredRange = range.filter(
                (token: Token) =>
                    token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
            );

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

            if (
                filteredRange[1]?.typ === EnumToken.ColonTokenType ||
                filteredRange[1]?.typ === EnumToken.DelimTokenType
            ) {
                const result = isDeclarationValue(filteredRange.slice(2));

                if (result.success) {
                    context.update(filteredRange.at(-1)!);

                    return {
                        success: true,
                        valid: true,
                        token: filteredRange.at(-1)!,
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

            break;
        }

        case "url": {
            const token = context.peek();

            if (token == null) {
                success = false;
                break;
            }

            // if (token.typ === EnumToken.StringTokenType) {
            //     success = true;
            //     break;
            // }

            let l: number;

            if (token.typ == EnumToken.UrlFunctionTokenDefType) {
                l = 0;
                let token: Token | null;

                while ((token = context.peek(++l))) {
                    if (token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType) {
                        break;
                    }
                }

                if (
                    token != null &&
                    (token.typ == EnumToken.StringTokenType ||
                        token.typ == EnumToken.IdenTokenType ||
                        token.typ == EnumToken.UrlTokenTokenType)
                ) {
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
                        context.update(token as Token);

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

            while (++l < (token as FunctionToken).chi.length) {
                if (
                    (token as FunctionToken).chi[l].typ !== EnumToken.WhitespaceTokenType &&
                    (token as FunctionToken).chi[l].typ !== EnumToken.CommentTokenType
                ) {
                    break;
                }
            }

            if (l < (token as FunctionToken).chi.length) {
                success =
                    (token as FunctionToken).chi[l].typ == EnumToken.StringTokenType ||
                    (token as FunctionToken).chi[l].typ == EnumToken.IdenTokenType ||
                    (token as FunctionToken).chi[l].typ == EnumToken.UrlTokenTokenType;
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

    if (
        !success &&
        context.peek()?.typ == EnumToken.IdenTokenType &&
        allValues.includes((context.peek() as IdentToken).val)
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

    // default:
    //
    //     throw new Error(`Unexpected validation property ${property.val}`);
}

function matchRepeatableSyntax(
    syntax: ValidationToken,
    context: ValidationContext,
    options: ValidationOptions | ParserOptions,
): ValidationMatch {
    const { isRepeatable, isOptional, isMandatatoryGroup, isRepeatableAtLeastOnce, ...rest } = syntax;
    let result: ValidationMatch | null = null;
    let tmpResult: ValidationMatch;
    let success: boolean = !!isRepeatable;

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
            } else {
                context.update(result.context.current() as Token);
            }
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
