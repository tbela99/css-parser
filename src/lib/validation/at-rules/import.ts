import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {validateAtRuleSupports} from "./supports";
import {validateAtRuleMediaQueryList} from "./media";
import {consumeWhitespace} from "../utils";
import {validateLayerName} from "../syntaxes";

export function validateAtRuleImport(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list',
            tokens: []
        } as ValidationSyntaxResult;
    }

    if ('chi' in atRule) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'unexpected at-rule body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.filter((t: Token): boolean => ![EnumToken.CommentTokenType].includes(t.typ));

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list',
            tokens: []
        } as ValidationSyntaxResult;
    }

    if (tokens[0].typ == EnumToken.StringTokenType) {

        tokens.shift();
        // @ts-ignore
        consumeWhitespace(tokens);
    } else if (tokens[0].typ == EnumToken.UrlFunctionTokenType) {

        const slice = tokens[0].chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);

        if (slice.length != 1 || ![EnumToken.StringTokenType, EnumToken.UrlTokenTokenType].includes(slice[0].typ)) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'invalid url()',
                tokens
            } as ValidationSyntaxResult;
        } else {

            tokens.shift();
            // @ts-ignore
            if (!consumeWhitespace(tokens)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace',
                    tokens
                } as ValidationSyntaxResult;
            }
        }
    } else {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@' + atRule.nam,
            error: 'expecting url() or string',
            tokens
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

                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: '@' + atRule.nam,
                        error: 'expecting whitespace',
                        tokens
                    }
                }
            }
        }

        // @ts-ignore
        else if (tokens[0].typ == EnumToken.FunctionTokenType) {

            // @ts-ignore
            if ('layer'.localeCompare(tokens[0].val, undefined, {sensitivity: 'base'}) != 0) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting layer()',
                    tokens
                }
            }

            // @ts-ignore
            const result: ValidationSyntaxResult = validateLayerName(tokens[0].chi);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            tokens.shift();

            // @ts-ignore
            if (!consumeWhitespace(tokens)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace',
                    tokens
                }
            }
        }
    }

    if (tokens.length > 0) {

        // @ts-ignore
        if (tokens[0].typ == EnumToken.AtRuleTokenType) {

            if ((tokens[0] as AstAtRule).nam != 'supports') {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting @supports or media query list',
                    tokens
                }
            }

            // @ts-ignore
            const result: ValidationSyntaxResult = validateAtRuleSupports(tokens[0] as AstAtRule, options, atRule);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            tokens.shift();

            // @ts-ignore
            if (!consumeWhitespace(tokens)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace',
                    tokens
                }
            }
        }
    }

    if (tokens.length > 0) {

        return validateAtRuleMediaQueryList(tokens, atRule);
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}
