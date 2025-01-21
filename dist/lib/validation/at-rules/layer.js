import { ValidationLevel } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateLayerName } from '../syntaxes/layer-name.js';
import '../syntaxes/complex-selector.js';

function validateAtRuleLayer(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@layer',
            error: '',
            tokens: []
        };
    }
    return validateLayerName(atRule.tokens);
}

export { validateAtRuleLayer };
