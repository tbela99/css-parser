import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";
import {validateURL} from "../syntaxes/url.ts";


export function validateAtRuleNamespace(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: 'expected at-rule prelude'
        } as ValidationSyntaxResult;
    }

    if ('chi' in atRule) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: 'unexpected at-rule body'
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.slice() as Token[];

    consumeWhitespace(tokens);

    if (tokens[0].typ == EnumToken.IdenTokenType) {

        tokens.shift();
        consumeWhitespace(tokens);
    }

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: 'expected string or url()'
        } as ValidationSyntaxResult;
    }

    if (tokens[0].typ != EnumToken.StringTokenType) {

        const result = validateURL(tokens[0]);

        if (result.valid != SyntaxValidationResult.Valid) {

            return result;
        }

        tokens.shift();
        consumeWhitespace(tokens);
    } else {

        tokens.shift();
        consumeWhitespace(tokens);
    }

    if (tokens.length > 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: tokens[0],
            syntax: '@namespace',
            error: 'unexpected token'
        } as ValidationSyntaxResult;
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@namespace',
        error: ''
    }
}