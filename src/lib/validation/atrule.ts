import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../@types";
import type {ValidationConfiguration, ValidationResult, ValidationSyntaxResult} from "../../@types/validation";
import {ValidationLevel} from "../ast";
import {getParsedSyntax, getSyntaxConfig} from "./config";
import {ValidationSyntaxGroupEnum, ValidationToken} from "./parser";
import {validateSyntax} from "./syntax";

export function validateAtRule(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationResult {

    if (atRule.nam == 'charset') {

        const valid: boolean = atRule.val.match(/^"[a-zA-Z][a-zA-Z0-9_-]+"$/i) != null;

        return {

            valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
            node: atRule,
            syntax: null,
            error: ''
        }
    }

    // if (!options.validation) {
    //
    //     return {
    //
    //         valid: ValidationLevel.Valid,
    //         node: atRule,
    //         syntax: null,
    //         error: ''
    //     }
    // }

    // handle keyframe as special case
    // check if the node exists
    const config: ValidationConfiguration = getSyntaxConfig();

    let name: string = '@' + atRule.nam;

    if (!(name in config.atRules)) {

        if (name.charAt(1) == '-') {

            name = name.replace(/@-[a-zA-Z]+-([a-zA-Z][a-zA-Z0-9_-]*)/, '@$1');
        }
    }

    if (!(name in config.atRules)) {

    //     if (root?.typ == EnumToken.AtRuleNodeType) {
    //
    //         const syntax: ValidationToken = (getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, '@' + (root as AstAtRule).nam) as ValidationToken[])?.[0];
    //
    //         if ('chi' in syntax) {
    //
    //             return validateSyntax(syntax.chi as ValidationToken[], [atRule], root, options);
    //         }
    //     }

        return {

            valid: ValidationLevel.Drop,
            node: atRule,
            syntax: null,
            error: 'unknown at-rule'
        }
    }

    let result: ValidationSyntaxResult;
    const syntax: ValidationToken = (getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, name) as ValidationToken[])?.[0];

    if ('chi' in syntax && !('chi' in atRule)) {

        return {
            valid: ValidationLevel.Drop,
            node: atRule,
            syntax,
            error: 'missing at-rule body'
        }
    }

    if ('prelude' in syntax) {

        return validateSyntax(syntax.prelude as ValidationToken[], atRule.tokens as Token[], root, options);
    }

    return {

        valid: ValidationLevel.Valid,
        node: null,
        syntax,
        error: ''
    }
}
