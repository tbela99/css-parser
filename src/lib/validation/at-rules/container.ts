import type {
    AstAtRule,
    AstNode,
    FunctionToken,
    MediaFeatureNotToken,
    MediaQueryConditionToken,
    ParensToken,
    Token,
    ValidationOptions
} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";

const validateContainerScrollStateFeature = validateContainerSizeFeature;

export function validateAtRuleContainer(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.chi)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports query list'
        } as ValidationSyntaxResult;
    }

    const result: ValidationSyntaxResult = validateAtRuleContainerQueryList(atRule.tokens, atRule);

    if (result.valid == SyntaxValidationResult.Drop) {

        return result;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body'
        } as ValidationSyntaxResult;
    }

    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
    } as ValidationSyntaxResult;
}

function validateAtRuleContainerQueryList(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query list'
        } as ValidationSyntaxResult;
    }

    let result: ValidationSyntaxResult | null = null;
    let tokenType: EnumToken | null = null;

    for (const queries of splitTokenList(tokens)) {

        consumeWhitespace(queries);

        if (queries.length == 0) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query list'
            }
        }

        result = null;
        const match: Token[] = [];
        let token: Token | null = null;

        tokenType = null;

        while (queries.length > 0) {

            if (queries.length == 0) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query list'
                }
            }

            if (queries[0].typ == EnumToken.IdenTokenType) {

                match.push(queries.shift() as Token);
                consumeWhitespace(queries);
            }

            if (queries.length == 0) {

                break;
            }

            token = queries[0];

            if (token?.typ == EnumToken.MediaFeatureNotTokenType) {

                token = (token  as MediaFeatureNotToken).val;
            }

            if (token?.typ != EnumToken.ParensTokenType && (token?.typ != EnumToken.FunctionTokenType || !['scroll-state', 'style'].includes((token as FunctionToken).val))) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens'
                }
            }

            if (token?.typ == EnumToken.ParensTokenType) {

                result = validateContainerSizeFeature((token as ParensToken).chi, atRule);
            } else if ((token as FunctionToken).val == 'scroll-state') {

                result = validateContainerScrollStateFeature((token as FunctionToken).chi, atRule);
            } else {

                result = validateContainerStyleFeature((token as FunctionToken).chi, atRule);
            }

            if (result.valid == SyntaxValidationResult.Drop) {

                return result;
            }

            queries.shift();
            consumeWhitespace(queries);

            if (queries.length == 0) {

                break;
            }

            token = queries[0];

            if (token?.typ != EnumToken.MediaFeatureAndTokenType && token?.typ != EnumToken.MediaFeatureOrTokenType) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting and/or container query token'
                }
            }

            if (tokenType == null) {

                tokenType = token?.typ;
            }

            if (tokenType == null ||tokenType != token?.typ) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'mixing and/or not allowed at the same level'
                }
            }

            queries.shift();
            consumeWhitespace(queries);

            if (queries.length == 0) {

                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens'
                }
            }
        }
    }

    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: ''
    }
}

function validateContainerStyleFeature(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 1) {

        if (tokens[0].typ == EnumToken.ParensTokenType) {

            return validateContainerStyleFeature((tokens[0] as ParensToken).chi, atRule);
        }

        if ([EnumToken.DashedIdenTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ) ||
            (tokens[0].typ == EnumToken.MediaQueryConditionTokenType && (tokens[0] as MediaQueryConditionToken).op.typ == EnumToken.ColonTokenType)) {

            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: ''
            }
        }
    }

    return {
        valid: SyntaxValidationResult.Drop,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: 'expected container query features'
    }
}

function validateContainerSizeFeature(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    tokens = tokens.slice();
    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features'
        }
    }

    if (tokens.length == 1) {

        const token: Token = tokens[0];

        if (token.typ == EnumToken.MediaFeatureNotTokenType) {

            return validateContainerSizeFeature([(token as MediaFeatureNotToken).val], atRule);
        }

        if (token.typ == EnumToken.ParensTokenType) {

            return validateAtRuleContainerQueryStyleInParams((token as ParensToken).chi, atRule);
        }

        if (![EnumToken.DashedIdenTokenType, EnumToken.MediaQueryConditionTokenType].includes(tokens[0].typ)) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query features'
            }
        }

        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        }
    }

    return validateAtRuleContainerQueryStyleInParams(tokens, atRule);
}

function validateAtRuleContainerQueryStyleInParams(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    tokens = tokens.slice();
    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features'
        }
    }

    let token: Token = tokens[0];
    let tokenType: EnumToken | null = null;
    let result: ValidationSyntaxResult | null = null;

    while (tokens.length > 0) {

        token = tokens[0];

        if (token.typ == EnumToken.MediaFeatureNotTokenType) {

            token = (token as MediaFeatureNotToken).val;
        }

        if (tokens[0].typ != EnumToken.ParensTokenType) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query-in-parens'
            }
        }

        const slices = (tokens[0] as ParensToken).chi.slice();

        consumeWhitespace(slices);

        if (slices.length == 1) {

            if ([EnumToken.MediaFeatureNotTokenType, EnumToken.ParensTokenType].includes(slices[0].typ)) {

                result = validateAtRuleContainerQueryStyleInParams(slices, atRule);

                if (result.valid == SyntaxValidationResult.Drop) {

                    return result;
                }
            } else if (![EnumToken.DashedIdenTokenType, EnumToken.MediaQueryConditionTokenType].includes(slices[0].typ)) {

                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query features'
                }
            }
        } else {

            result = validateAtRuleContainerQueryStyleInParams(slices, atRule);

            if (result.valid == SyntaxValidationResult.Drop) {

                return result;
            }
        }

        tokens.shift();
        consumeWhitespace(tokens);

        if (tokens.length == 0) {

            break;
        }

        if (![EnumToken.MediaFeatureAndTokenType, EnumToken.MediaFeatureOrTokenType].includes(tokens[0].typ)) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expecting and/or container query token'
            }
        }

        if (tokenType == null) {

            tokenType = tokens[0].typ;
        }

        if (tokenType != tokens[0].typ) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'mixing and/or not allowed at the same level'
            }
        }

        tokens.shift();
        consumeWhitespace(tokens);

        if (tokens.length == 0) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expected container query-in-parens'
            }
        }
    }

    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: ''
    }
}