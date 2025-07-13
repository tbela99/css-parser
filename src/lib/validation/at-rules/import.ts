import type {
    AstAtRule,
    AstNode,
    FunctionToken,
    FunctionURLToken,
    Token,
    ValidationOptions
} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {validateAtRuleMediaQueryList} from "./media.ts";
import {consumeWhitespace} from "../utils/index.ts";
import {validateLayerName} from "../syntaxes/index.ts";
import {validateAtRuleSupportsConditions} from "./supports.ts";

export function validateAtRuleImport(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list'
        } as ValidationSyntaxResult;
    }

    if ('chi' in atRule) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'unexpected at-rule body'
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.filter((t: Token): boolean => ![EnumToken.CommentTokenType].includes(t.typ));

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list'
        } as ValidationSyntaxResult;
    }

    if (tokens[0].typ == EnumToken.StringTokenType) {

        tokens.shift();
        // @ts-ignore
        consumeWhitespace(tokens);
    } else if (tokens[0].typ == EnumToken.UrlFunctionTokenType) {

        const slice = (tokens[0] as FunctionURLToken).chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);

        if (slice.length != 1 || ![EnumToken.StringTokenType, EnumToken.UrlTokenTokenType].includes(slice[0].typ)) {

            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'invalid url()'
            } as ValidationSyntaxResult;
        } else {

            tokens.shift();
            // @ts-ignore
            if (!consumeWhitespace(tokens)) {

                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace'
                } as ValidationSyntaxResult;
            }
        }

        tokens.shift();
        // @ts-ignore
        consumeWhitespace(tokens);

    } else {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: tokens[0],
            syntax: '@' + atRule.nam,
            error: 'expecting url() or string'
        }
    }

    if (tokens.length > 0) {

        // @ts-ignore
        if (tokens[0].typ == EnumToken.IdenTokenType) {

            // @ts-ignore
            if ('layer'.localeCompare(tokens[0].val, undefined, {sensitivity: 'base'}) == 0) {

                tokens.shift();

                // @ts-ignore
                if (!consumeWhitespace(tokens)) {

                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0],
                        syntax: '@' + atRule.nam,
                        error: 'expecting whitespace'
                    }
                }
            }
        }

        // @ts-ignore
        else if (tokens[0].typ == EnumToken.FunctionTokenType) {

            // @ts-ignore
            if ('layer'.localeCompare(tokens[0].val, undefined, {sensitivity: 'base'}) == 0) {

                const result = validateLayerName((tokens[0] as FunctionToken).chi);

                if (result.valid == SyntaxValidationResult.Drop) {

                    return result;
                }

                tokens.shift();
                // @ts-ignore
                consumeWhitespace(tokens);
            }

            // @ts-ignore
            if ('supports'.localeCompare(tokens[0]?.val, undefined, {sensitivity: 'base'}) == 0) {

                const result = validateAtRuleSupportsConditions(atRule, (tokens[0] as FunctionToken).chi) as ValidationSyntaxResult;

                if (result.valid == SyntaxValidationResult.Drop) {

                    return result;
                }

                tokens.shift();
                // @ts-ignore
                consumeWhitespace(tokens);
            }
        }
    }

    if (tokens.length > 0) {

        return validateAtRuleMediaQueryList(tokens, atRule);
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: null,
        syntax: '@' + atRule.nam,
        error: ''
    } as ValidationSyntaxResult;
}
