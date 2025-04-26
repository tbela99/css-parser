import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";


export function validateAtRulePageMarginBox(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (Array.isArray(atRule.tokens) && atRule.tokens.length > 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected margin-box body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    for (const token of atRule.chi as AstNode[]) {

        if (![EnumToken.DeclarationNodeType, EnumToken.CommentNodeType, EnumToken.WhitespaceTokenType].includes(token.typ)) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: token,
                syntax: 'declaration-list',
                error: 'expected margin-box body',
                tokens: []
            } as ValidationSyntaxResult;
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}