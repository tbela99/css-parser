import type {AstAtRule, AstDeclaration, AstNode, ValidationOptions} from "../../@types";
import type {ValidationConfiguration, ValidationResult} from "../../@types/validation";
import {EnumToken, ValidationLevel} from "../ast";
import {getParsedSyntax, getSyntaxConfig} from "./config";
import {ParsedSyntax, ValidationSyntaxGroupEnum, ValidationToken} from "./parser";
import {validateSyntax} from "./syntax";

export function validateDeclaration(declaration: AstDeclaration, options: ValidationOptions, root?: AstNode): ValidationResult {

    const config: ValidationConfiguration = getSyntaxConfig();

    let name: string = declaration.nam;

    if (!(name in config.declarations) && !(name in config.syntaxes)) {

        if (name[0] == '-') {

            const match: RegExpExecArray | null = /^-([a-z]+)-(.*)$/.exec(name);

            if (match != null) {

                name = match[2];
            }
        }
    }

    // root is at-rule - check if declaration allowed
    if (root?.typ == EnumToken.AtRuleNodeType) {
        //
        const syntax: ValidationToken = (getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, '@' + (root as AstAtRule).nam) as ValidationToken[])?.[0];

        if (syntax != null) {

            if (!('chi' in syntax)) {

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

            // console.error({syntax});

            const config: ValidationConfiguration = getSyntaxConfig();

            // @ts-ignore
            const obj = config[ValidationSyntaxGroupEnum.AtRules]['@' + (root as AstAtRule).nam] as ParsedSyntax;

            if ('descriptors' in obj) {

                const descriptors = obj.descriptors as Record<string, ParsedSyntax>;

                if (!(name in descriptors)) {

                    return {
                        valid: ValidationLevel.Drop,
                        node: declaration,
                        syntax: `<${declaration.nam}>`,
                        error: `declaration <${declaration.nam}> is not allowed in <@${(root as AstAtRule).nam}>`
                    }
                }

                const syntax = getParsedSyntax(ValidationSyntaxGroupEnum.AtRules, ['@' + (root as AstAtRule).nam, 'descriptors', name]) as ValidationToken[];
                return validateSyntax(syntax, declaration.val, root, options);
            }

            // console.error({name});

            //         if (!(name in config.declarations) && !(name in config.syntaxes)) {
            //
            //             return {
            //
            //                 valid: ValidationLevel.Drop,
            //                 node: declaration,
            //                 syntax: null,
            //                 error: `unknown declaration "${declaration.nam}"`
            //             }
            //         }
            //
            //         return validateSyntax((syntax as ValidationAtRuleDefinitionToken).chi as ValidationToken[], [declaration], root, options);
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
            syntax: `<${declaration.nam}>`,
            error: `unknown declaration "${declaration.nam}"`
        }
    }

    return validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name) as ValidationToken[], declaration.val);
}