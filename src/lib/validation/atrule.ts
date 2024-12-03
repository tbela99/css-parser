import type {AstAtRule, AstNode, ValidationOptions} from "../../@types";
import type {ValidationConfiguration, ValidationResult} from "../../@types/validation";
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
            error: ''
        }
    }

    if (!options.validation) {

        return {

            valid: ValidationLevel.Valid,
            node: atRule,
            error: ''
        }
    }

    // handle keyframe as special case
    // check if the node exists
    const config: ValidationConfiguration = getSyntaxConfig();

    let name: string = '@' + atRule.nam;

    if (!(name in config.atRules)) {

        if (name.charAt(1) == '-') {

            name = name.replace(/@-[a-zA-Z]+-([a-zA-Z][a-zA-Z0-9_-]*)/, '@$1');
        }

        if (!(name in config.atRules)) {

            return {

                valid: ValidationLevel.Drop,
                node: atRule,
                error: 'unknown at-rule'
            }
        }
    }

    return validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, name) as ValidationToken[], [atRule]);
}
