import { EnumToken, ValidationLevel } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import '../parser/utils/config.js';
import { getParsedSyntax, getSyntaxConfig } from './config.js';
import { validateSyntax } from './syntax.js';

function validateDeclaration(declaration, options, root) {
    const config = getSyntaxConfig();
    let name = declaration.nam;
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
        //
        const syntax = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, '@' + root.nam)?.[0];
        // console.error({syntax});
        if (syntax != null) {
            if (!('chi' in syntax)) {
                return {
                    valid: ValidationLevel.Drop,
                    node: declaration,
                    syntax,
                    error: 'declaration not allowed here'
                };
            }
            if (name.startsWith('--')) {
                return {
                    valid: ValidationLevel.Valid,
                    node: declaration,
                    syntax: null,
                    error: ''
                };
            }
            // console.error({syntax});
            const config = getSyntaxConfig();
            // @ts-ignore
            const obj = config["atRules" /* ValidationSyntaxGroupEnum.AtRules */]['@' + root.nam];
            if ('descriptors' in obj) {
                const descriptors = obj.descriptors;
                if (!(name in descriptors)) {
                    return {
                        valid: ValidationLevel.Drop,
                        node: declaration,
                        syntax: `<${declaration.nam}>`,
                        error: ` declaration <${declaration.nam}> is not allowed in <@${root.nam}>`
                    };
                }
                const syntax = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, ['@' + root.nam, 'descriptors', name]);
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
        };
    }
    if (!(name in config.declarations) && !(name in config.syntaxes)) {
        return {
            valid: ValidationLevel.Drop,
            node: declaration,
            syntax: `<${declaration.nam}>`,
            error: `unknown declaration "${declaration.nam}"`
        };
    }
    // return {
    //
    //     valid: ValidationLevel.Valid,
    //     node: declaration,
    //     syntax: null,
    //     error: ''
    // }
    return validateSyntax(getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, name), declaration.val);
}

export { validateDeclaration };
