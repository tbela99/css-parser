import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";

export function validateAtRuleKeyframes(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.slice() as Token[];

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting at-rule prelude',
            tokens
        } as ValidationSyntaxResult;
    }

    if (![EnumToken.StringTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting ident or string token',
            tokens
        } as ValidationSyntaxResult;
    }

    tokens.shift();
    consumeWhitespace(tokens);

    if (tokens.length > 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@keyframes',
            error: 'unexpected token',
            tokens
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@keyframes',
        error: '',
        tokens
    }
}