import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { validateAtRuleMediaQueryList } from './media.js';

function validateAtRuleCustomMedia(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            context: [],
            node: null,
            syntax: null,
            error: ''
        };
    }
    const queries = atRule.tokens.slice();
    consumeWhitespace(queries);
    if (queries.length == 0 || queries[0].typ != EnumToken.DashedIdenTokenType) {
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@custom-media',
            error: 'expecting dashed identifier'
        };
    }
    queries.shift();
    const result = validateAtRuleMediaQueryList(queries, atRule);
    if (result.valid == ValidationLevel.Drop) {
        atRule.tokens = [];
        return {
            valid: ValidationLevel.Valid,
            context: [],
            node: atRule,
            syntax: '@custom-media',
            error: ''
        };
    }
    return result;
}

export { validateAtRuleCustomMedia };
