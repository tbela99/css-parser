import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";
import {validateURL} from "../syntaxes/url";


export function validateAtRuleNamespace(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@namespace',
            error: 'expected at-rule prelude',
            tokens: []
        } as ValidationSyntaxResult;
    }

    if ('chi' in atRule) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@namespace',
            error: 'unexpected at-rule body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.slice() as Token[];

    consumeWhitespace(tokens);

    if (tokens[0].typ == EnumToken.IdenTokenType) {

        tokens.shift();
        consumeWhitespace(tokens);
    }

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@namespace',
            error: 'expected string or url()',
            tokens
        } as ValidationSyntaxResult;
    }

    if (tokens[0].typ != EnumToken.StringTokenType) {

        const result = validateURL(tokens[0]);

        if (result.valid != ValidationLevel.Valid) {

            return result;
        }

        tokens.shift();
        consumeWhitespace(tokens);
    } else {

        tokens.shift();
        consumeWhitespace(tokens);
    }

    if (tokens.length > 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@namespace',
            error: 'unexpected token',
            tokens
        } as ValidationSyntaxResult;
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@namespace',
        error: '',
        tokens
    }
}