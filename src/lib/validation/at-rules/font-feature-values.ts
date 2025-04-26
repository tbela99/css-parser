import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {ValidationLevel} from "../../ast/index.ts";
import {validateFamilyName} from "../syntaxes/index.ts";


export function validateAtRuleFontFeatureValues(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
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

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}