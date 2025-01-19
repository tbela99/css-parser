import { ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateFamilyName } from '../syntaxes/family-name.js';
import '../syntaxes/complex-selector.js';

function validateAtRuleFontFeatureValues(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule prelude',
            tokens: []
        };
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
        };
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    };
}

export { validateAtRuleFontFeatureValues };
