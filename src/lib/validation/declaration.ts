import type {AstAtRule, AstDeclaration, AstNode, ValidationOptions} from "../../@types";
import type {ValidationConfiguration, ValidationResult, ValidationSyntaxResult} from "../../@types/validation";
import {EnumToken, ValidationLevel} from "../ast";
import {getParsedSyntax, getSyntaxConfig} from "./config";
import {validateSyntax} from "./syntax";
import {ValidationAtRuleDefinitionToken, ValidationSyntaxGroupEnum, ValidationToken} from "./parser";

export function validateDeclaration(declaration: AstDeclaration, options: ValidationOptions, root?: AstNode): ValidationResult {

    const config: ValidationConfiguration = getSyntaxConfig();

    let name: string = declaration.nam;

    if (!(name in config.declarations) && !(name in config.syntaxes)) {

        if (name[0] == '-') {

            const match = /^-([a-z]+)-(.*)$/.exec(name);

            if (match != null) {

                name = match[2];
            }
        }
    }

    // root is at-rule - check if declaration allowed
    if (root?.typ == EnumToken.AtRuleNodeType) {

        const syntax: ValidationToken = (getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, '@' + (root as AstAtRule).nam) as ValidationToken[])?.[0];

        if (syntax != null) {

            if(!('chi' in syntax)) {

                return {
                    valid: ValidationLevel.Drop,
                    node: declaration,
                    syntax,
                    error: 'declaration not allowed here'
                }
            }

            if (name.startsWith('--')) {

                return {

                    valid: ValidationLevel.Valid,
                    node: declaration,
                    syntax: null,
                    error: ''
                }
            }

            if (!(name in config.declarations) && !(name in config.syntaxes)) {

                return {

                    valid: ValidationLevel.Drop,
                    node: declaration,
                    syntax: null,
                    error: `unknown declaration "${declaration.nam}"`
                }
            }

            return validateSyntax((syntax as ValidationAtRuleDefinitionToken).chi as ValidationToken[], [declaration], root, options);
        }
    }

    if (name.startsWith('--')) {

        return {

            valid: ValidationLevel.Valid,
            node: declaration,
            syntax: null,
            error: ''
        }
    }

    if (!(name in config.declarations) && !(name in config.syntaxes)) {

        return {

            valid: ValidationLevel.Drop,
            node: declaration,
            syntax: null,
            error: `unknown declaration "${declaration.nam}"`
        }
    }

    return validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name) as ValidationToken[], declaration.val);
}