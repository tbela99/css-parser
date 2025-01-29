import type {AstAtRule, AstNode, MediaFeatureNotToken, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace, splitTokenList} from "../utils";

const validateContainerScrollStateFeature = validateContainerSizeFeature;

export function validateAtRuleContainer(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports query list',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const result: ValidationSyntaxResult = validateAtRuleContainerQueryList(atRule.tokens, atRule);

    if (result.valid == ValidationLevel.Drop) {

        return result;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}

function validateAtRuleContainerQueryList(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query list',
            tokens
        } as ValidationSyntaxResult;
    }

    let result: ValidationSyntaxResult | null = null;
    let tokenType: EnumToken | null = null;

    for (const queries of splitTokenList(tokens)) {

        consumeWhitespace(queries);

        if (queries.length == 0) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query list',
                tokens
            }
        }

        result = null;
        const match: Token[] = [];
        let token: Token | null = null;

        tokenType = null;

        while (queries.length > 0) {

            if (queries.length == 0) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query list',
                    tokens
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

            if (token.typ == EnumToken.MediaFeatureNotTokenType) {

                token = token.val;
            }

            if (token.typ != EnumToken.ParensTokenType && (token.typ != EnumToken.FunctionTokenType || !['scroll-state', 'style'].includes(token.val))) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens',
                    tokens
                }
            }

            if (token.typ == EnumToken.ParensTokenType) {

                result = validateContainerSizeFeature(token.chi, atRule);
            } else if (token.val == 'scroll-state') {

                result = validateContainerScrollStateFeature(token.chi, atRule);
            } else {

                result = validateContainerStyleFeature(token.chi, atRule);
            }

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            queries.shift();
            consumeWhitespace(queries);

            if (queries.length == 0) {

                break;
            }

            token = queries[0];

            if (token.typ != EnumToken.MediaFeatureAndTokenType && token.typ != EnumToken.MediaFeatureOrTokenType) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting and/or container query token',
                    tokens
                }
            }

            if (tokenType == null) {

                tokenType = token.typ;
            }

            if (tokenType != token.typ) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'mixing and/or not allowed at the same level',
                    tokens
                }
            }

            queries.shift();
            consumeWhitespace(queries);

            if (queries.length == 0) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens',
                    tokens
                }
            }
        }
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens
    }
}

function validateContainerStyleFeature(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 1) {

        if (tokens[0].typ == EnumToken.ParensTokenType) {

            return validateContainerStyleFeature(tokens[0].chi, atRule);
        }

        if ([EnumToken.DashedIdenTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ) ||
            (            tokens[0].typ == EnumToken.MediaQueryConditionTokenType &&tokens[0].op.typ == EnumToken.ColonTokenType)) {

            return {
                valid: ValidationLevel.Valid,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: '',
                tokens
            }
        }
    }

    return {
        valid: ValidationLevel.Drop,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: 'expected container query features',
        tokens
    }
}

function validateContainerSizeFeature(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    tokens = tokens.slice();
    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features',
            tokens
        }
    }

    if (tokens.length == 1) {

        const token: Token = tokens[0];

        if (token.typ == EnumToken.MediaFeatureNotTokenType) {

            return validateContainerSizeFeature([(token as MediaFeatureNotToken).val], atRule);
        }

        if (token.typ == EnumToken.ParensTokenType) {

            return validateAtRuleContainerQueryStyleInParams(token.chi, atRule);
        }

        if (![EnumToken.DashedIdenTokenType, EnumToken.MediaQueryConditionTokenType].includes(tokens[0].typ)) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query features',
                tokens
            }
        }

        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: '',
            tokens
        }
    }

    return validateAtRuleContainerQueryStyleInParams(tokens, atRule);
}

function validateAtRuleContainerQueryStyleInParams(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    tokens = tokens.slice();
    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features',
            tokens
        }
    }

    let token: Token = tokens[0];
    let tokenType: EnumToken | null = null;
    let result: ValidationSyntaxResult | null = null;

    while (tokens.length > 0) {

        token = tokens[0];

        if (token.typ == EnumToken.MediaFeatureNotTokenType) {

            token = token.val;
        }

        if (tokens[0].typ != EnumToken.ParensTokenType) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query-in-parens',
                tokens
            }
        }

        const slices = tokens[0].chi.slice();

        consumeWhitespace(slices);

        if (slices.length == 1) {

            if ([EnumToken.MediaFeatureNotTokenType, EnumToken.ParensTokenType].includes(slices[0].typ)) {

                result = validateAtRuleContainerQueryStyleInParams(slices, atRule);

                if (result.valid == ValidationLevel.Drop) {

                    return result;
                }
            } else if (![EnumToken.DashedIdenTokenType, EnumToken.MediaQueryConditionTokenType].includes(slices[0].typ)) {

                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query features',
                    tokens
                }
            }
        } else {

            result = validateAtRuleContainerQueryStyleInParams(slices, atRule);

            if (result.valid == ValidationLevel.Drop) {

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
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expecting and/or container query token',
                tokens
            }
        }

        if (tokenType == null) {

            tokenType = tokens[0].typ;
        }

        if (tokenType != tokens[0].typ) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'mixing and/or not allowed at the same level',
                tokens
            }
        }

        tokens.shift();
        consumeWhitespace(tokens);

        if (tokens.length == 0) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expected container query-in-parens',
                tokens
            }
        }
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens
    }
}