import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {ValidationLevel} from "../../ast";
import {validateFamilyName} from "../syntaxes";


export function validateAtRuleFontFeatureValues(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule prelude',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const result = validateFamilyName(atRule.tokens, atRule);

    if (result.valid == ValidationLevel.Drop) {

        return result;
    }

    if (!('chi' in atRule)) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}