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
        const syntax = getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, '@' + root.nam)?.[0];
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
            if (!(name in config.declarations) && !(name in config.syntaxes)) {
                return {
                    valid: ValidationLevel.Drop,
                    node: declaration,
                    syntax: null,
                    error: `unknown declaration "${declaration.nam}"`
                };
            }
            return validateSyntax(syntax.chi, [declaration], root, options);
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
            syntax: null,
            error: `unknown declaration "${declaration.nam}"`
        };
    }
    return validateSyntax(getParsedSyntax("declarations" /* ValidationSyntaxGroupEnum.Declarations */, name), declaration.val);
}

export { validateDeclaration };
