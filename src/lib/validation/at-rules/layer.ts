import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {ValidationLevel} from "../../ast";
import {validateLayerName} from "../syntaxes";


export function validateAtRuleLayer(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@layer',
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    return validateLayerName(atRule.tokens);
}