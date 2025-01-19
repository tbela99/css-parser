import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace, splitTokenList} from "../utils";

export function validateAtRuleMedia(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: 'expected media query list',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const result: ValidationSyntaxResult = validateAtRuleMediaQueryList(atRule.tokens, atRule);

    if (result.valid == ValidationLevel.Drop) {

        return result;
    }

    if (!('chi' in atRule)) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: 'expected at-rule body',
            tokens: []
        }
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@media',
        error: '',
        tokens: []
    }
}

export function validateAtRuleMediaQueryList(tokenList: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    for (const tokens of splitTokenList(tokenList)) {

        if (tokens.length == 0) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0] ?? atRule,
                syntax: '@media',
                error: 'unexpected token',
                tokens: []
            } as ValidationSyntaxResult;
        }

        let previousToken: Token | null = null;

        while (tokens.length > 0) {

            // media-condition
            if (validateMediaCondition(tokens[0])) {

                previousToken = tokens[0];
                tokens.shift();
            }
            // media-type
            else if (validateMediaFeature(tokens[0])) {

                previousToken = tokens[0];
                tokens.shift();
            }

            if (tokens.length == 0) {

                break;
            }

            if (!consumeWhitespace(tokens)) {

                if (previousToken?.typ != EnumToken.ParensTokenType) {

                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expected media query list',
                        tokens: []
                    }
                }
            }

            if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected and/or',
                    tokens: []
                }
            }

            if (tokens.length == 1) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected media-condition',
                    tokens: []
                }
            }

            tokens.shift();

            if (!consumeWhitespace(tokens)) {

                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected whitespace',
                    tokens: []
                }
            }
        }
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@media',
        error: '',
        tokens: []
    }
}

function validateMediaCondition(token: Token): boolean {

    if (token.typ == EnumToken.MediaFeatureNotTokenType) {

        return validateMediaCondition(token.val);
    }

    if (token.typ != EnumToken.ParensTokenType) {

        return false;
    }

    const chi: Token[] = token.chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);

    if (chi.length != 1) {

        return false;
    }

    if (chi[0].typ == EnumToken.IdenTokenType) {

        return true;
    }

    if (chi[0].typ == EnumToken.MediaFeatureNotTokenType) {

        return validateMediaCondition(chi[0].val);
    }

    if (chi[0].typ == EnumToken.MediaQueryConditionTokenType) {

        return chi[0].l.typ == EnumToken.IdenTokenType;
    }

    return false;
}

function validateMediaFeature(token: Token): boolean {

    let val: Token = token;

    if (token.typ == EnumToken.MediaFeatureOnlyTokenType || token.typ == EnumToken.MediaFeatureNotTokenType) {

        val = token.val
    }

    return val.typ == EnumToken.MediaFeatureTokenType;
}