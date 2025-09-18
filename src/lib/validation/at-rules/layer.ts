import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {SyntaxValidationResult} from "../../ast/index.ts";
import {validateLayerName} from "../syntaxes/index.ts";


export function validateAtRuleLayer(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

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

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            matches: [],
            node: atRule,
            syntax: '@layer',
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    return validateLayerName(atRule.tokens);
}