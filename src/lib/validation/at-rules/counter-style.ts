import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";

export function validateAtRuleCounterStyle(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: 'expected counter style name',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.filter((t: Token): boolean => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: 'expected counter style name',
            tokens
        } as ValidationSyntaxResult;
    }

    if (tokens.length > 1) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[1] ?? atRule,
            syntax: '@counter-style',
            error: 'unexpected token',
            tokens
        } as ValidationSyntaxResult;
    }

    if (![EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType].includes(tokens[0].typ)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@counter-style',
            error: 'expected counter style name',
            tokens
        } as ValidationSyntaxResult;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: 'expected counter style body',
            tokens
        } as ValidationSyntaxResult;
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@counter-style',
        error: '',
        tokens
    } as ValidationSyntaxResult
}