import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";


export function validateAtRulePageMarginBox(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (Array.isArray(atRule.tokens) && atRule.tokens.length > 0) {

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

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}