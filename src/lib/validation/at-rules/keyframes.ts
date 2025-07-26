import type {AstKeyframAtRule, AstNode, Token, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";

export function validateAtRuleKeyframes(atRule: AstKeyframAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting at-rule prelude'
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType).slice() as Token[];

    consumeWhitespace(tokens);

    // if (tokens.length == 0) {
    //
    //     // @ts-ignore
    //     return {
    //         valid: SyntaxValidationResult.Drop,
    //         context: [],
    //         node: atRule,
    //         syntax: '@keyframes',
    //         error: 'expecting at-rule prelude'
    //     } as ValidationSyntaxResult;
    // }

    if (tokens.length == 0 || ![EnumToken.StringTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting ident or string token'
        } as ValidationSyntaxResult;
    }

    tokens.shift();
    consumeWhitespace(tokens);

    if (tokens.length > 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: tokens[0],
            syntax: '@keyframes',
            error: 'unexpected token'
        }
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@keyframes',
        error: ''
    }
}