import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";


export function validateAtRulePageMarginBox(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.chi)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    if (Array.isArray(atRule.tokens) && atRule.tokens.length > 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: ''
        } as ValidationSyntaxResult;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected margin-box body'
        } as ValidationSyntaxResult;
    }

    for (const token of atRule.chi as AstNode[]) {

        if (![EnumToken.DeclarationNodeType, EnumToken.CommentNodeType, EnumToken.WhitespaceTokenType].includes(token.typ)) {

            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: token,
                syntax: 'declaration-list',
                error: 'expected margin-box body'
            } as ValidationSyntaxResult;
        }
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