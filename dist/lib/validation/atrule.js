import { ValidationLevel } from '../ast/types.js';
import '../ast/minify.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import '../parser/utils/config.js';
import { getParsedSyntax, getSyntaxConfig } from './config.js';
import { validateSyntax } from './syntax.js';

function validateAtRule(atRule, options, root) {
    if (atRule.nam == 'charset') {
        const valid = atRule.val.match(/^"[a-zA-Z][a-zA-Z0-9_-]+"$/i) != null;
        return {
            valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
            node: atRule,
            error: ''
        };
    }
    if (!options.validation) {
        return {
            valid: ValidationLevel.Valid,
            node: atRule,
            error: ''
        };
    }
    // handle keyframe as special case
    // check if the node exists
    const config = getSyntaxConfig();
    let name = '@' + atRule.nam;
    if (!(name in config.atRules)) {
        if (name.charAt(1) == '-') {
            name = name.replace(/@-[a-zA-Z]+-([a-zA-Z][a-zA-Z0-9_-]*)/, '@$1');
        }
        if (!(name in config.atRules)) {
            return {
                valid: ValidationLevel.Drop,
                node: atRule,
                error: 'unknown at-rule'
            };
        }
    }
    return validateSyntax(getParsedSyntax("atRules" /* ValidationSyntaxGroupEnum.AtRules */, name), [atRule]);
}

export { validateAtRule };
