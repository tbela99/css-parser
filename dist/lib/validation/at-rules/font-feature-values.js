import { SyntaxValidationResult } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { validateFamilyName } from '../syntaxes/family-name.js';
import '../syntaxes/complex-selector.js';
import '../syntax.js';
import '../config.js';

function validateAtRuleFontFeatureValues(atRule, options, root) {
    if (!Array.isArray(atRule.chi)) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports body',
            tokens: []
        };
    }
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule prelude',
            tokens: []
        };
    }
    const result = validateFamilyName(atRule.tokens);
    if (result.valid == SyntaxValidationResult.Drop) {
        return result;
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body',
            tokens: []
        };
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    };
}

export { validateAtRuleFontFeatureValues };
