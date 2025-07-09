import type {
    AstAtRule,
    AstNode,
    FunctionToken,
    IdentToken,
    MediaFeatureNotToken,
    MediaQueryConditionToken,
    ParensToken,
    Token,
    ValidationOptions
} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";
import {colorFontTech, fontFeaturesTech, fontFormat} from "../../syntax/index.ts";
import {validateComplexSelector} from "../syntaxes/complex-selector.ts";
import {parseSelector} from "../../parser/index.ts";

export function validateAtRuleSupports(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

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

    const result = validateAtRuleSupportsConditions(atRule, atRule.tokens);

    if (result) {

        if (result.node == null) {

            result.node = atRule;
        }

        return result;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body'
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: ''
    }
}

export function validateAtRuleSupportsConditions(atRule: AstAtRule, tokenList: Token[]): ValidationSyntaxResult {

    let result: ValidationSyntaxResult | null = null;

    for (const tokens of splitTokenList(tokenList)) {

        if (tokens.length == 0) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                context: [],
                node: tokens[0] ?? atRule,
                syntax: '@' + atRule.nam,
                error: 'unexpected token',
                tokens: []
            } as ValidationSyntaxResult;
        }

        let previousToken: Token | null = null;

        while (tokens.length > 0) {

            result = validateSupportCondition(atRule, tokens[0]);

            // supports-condition
            if (result.valid == ValidationLevel.Valid) {

                previousToken = tokens[0];
                tokens.shift();
            } else {

                result = validateSupportFeature(tokens[0]);

                if (/*result == null || */ result.valid == ValidationLevel.Valid) {

                    previousToken = tokens[0];
                    tokens.shift();
                } else {

                    if (tokens[0].typ == EnumToken.ParensTokenType) {

                        result = validateAtRuleSupportsConditions(atRule, (tokens[0] as ParensToken).chi);

                        if (/* result == null || */ result.valid == ValidationLevel.Valid) {

                            previousToken = tokens[0];
                            tokens.shift();
                            // continue;
                        } else {

                            return result;
                        }
                    } else {

                        return result;
                    }

                    // if (result!= null && result.valid == ValidationLevel.Drop) {
                    //
                    //     return  {
                    //         valid: ValidationLevel.Drop,
                    //         context: [],
                    //         node: tokens[0] ?? atRule,
                    //         syntax: '@' + atRule.nam,
                    //         // @ts-ignore
                    //         error: result.error as string ?? 'unexpected token',
                    //         tokens: []
                    //     };
                    // }
                }
            }

            if (tokens.length == 0) {

                break;
            }

            if (!consumeWhitespace(tokens)) {

                if (previousToken?.typ != EnumToken.ParensTokenType) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        context: [],
                        node: tokens[0] ?? previousToken ?? atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected whitespace'
                    }
                }
            }

            if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected and/or'
                }
            }

            if (tokens.length == 1) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected supports-condition'
                }
            }

            tokens.shift();

            if (!consumeWhitespace(tokens)) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected whitespace'
                }
            }
        }
    }

    return {
        valid: ValidationLevel.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: ''
    }
}

export function validateSupportCondition(atRule: AstAtRule, token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.MediaFeatureNotTokenType) {

        return validateSupportCondition(atRule, (token as MediaFeatureNotToken).val);
    }

    if (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val.localeCompare('selector', undefined, {sensitivity: 'base'}) == 0) {

        return validateComplexSelector(parseSelector((token as FunctionToken).chi));
    }

    const chi: Token[] = (token as FunctionToken).chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);

    if (chi.length != 1) {
        return validateAtRuleSupportsConditions(atRule, (token as FunctionToken).chi);
    }

    if (chi[0].typ == EnumToken.IdenTokenType) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }

    if (chi[0].typ == EnumToken.MediaFeatureNotTokenType) {

        return validateSupportCondition(atRule, (chi[0] as MediaFeatureNotToken).val);
    }

    if (chi[0].typ == EnumToken.MediaQueryConditionTokenType) {

        // @ts-ignore
        return chi[0].l.typ == EnumToken.IdenTokenType && (chi[0] as MediaQueryConditionToken).op.typ == EnumToken.ColonTokenType ?

            {
                valid: ValidationLevel.Valid,
                context: [],
                node: null,
                syntax: 'supports-condition',
                error: ''
            } : {
                valid: ValidationLevel.Drop,
                context: [],
                node: token,
                syntax: 'supports-condition',
                error: 'expected supports condition-in-parens'
            };
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Drop,
        context: [],
        node: token,
        syntax: 'supports-condition',
        error: 'expected supports condition-in-parens'
    };
}

function validateSupportFeature(token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.MediaFeatureNotTokenType) {

        return validateSupportFeature((token as MediaFeatureNotToken).val);
    }

    if (token.typ == EnumToken.FunctionTokenType) {

        if ((token as FunctionToken).val.localeCompare('selector', undefined, {sensitivity: 'base'}) == 0) {

            return validateComplexSelector(parseSelector((token as FunctionToken).chi));
        }

        if ((token as FunctionToken).val.localeCompare('font-tech', undefined, {sensitivity: 'base'}) == 0) {

            const chi: Token[] = (token as FunctionToken).chi.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
            // @ts-ignore
            return chi.length == 1 && chi[0].typ == EnumToken.IdenTokenType && colorFontTech.concat(fontFeaturesTech).some((t) => t.localeCompare((chi[0] as IdentToken).val, undefined, {sensitivity: 'base'}) == 0) ?

                {
                    valid: ValidationLevel.Valid,
                    context: [],
                    node: token,
                    syntax: 'font-tech',
                    error: ''
                } :
                {
                    valid: ValidationLevel.Drop,
                    context: [],
                    node: token,
                    syntax: 'font-tech',
                    error: 'expected font-tech'
                };
        }

        if ((token as FunctionToken).val.localeCompare('font-format', undefined, {sensitivity: 'base'}) == 0) {

            const chi: Token[] = (token as FunctionToken).chi.filter((t: Token): boolean => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
            // @ts-ignore
            return chi.length == 1 && chi[0].typ == EnumToken.IdenTokenType && fontFormat.some((t) => t.localeCompare((chi[0] as IdentToken).val, undefined, {sensitivity: 'base'}) == 0) ?

                {
                    valid: ValidationLevel.Valid,
                    context: [],
                    node: token,
                    syntax: 'font-format',
                    error: ''
                } :
                {
                    valid: ValidationLevel.Drop,
                    context: [],
                    node: token,
                    syntax: 'font-format',
                    error: 'expected font-format'
                };
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Drop,
        context: [],
        node: token,
        syntax: '@supports',
        error: 'expected feature'
    };
}