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
            matches: [],
            node: null,
            syntax: null,
            error: '',
            tokens: []
        };
    }
    const queries = atRule.tokens.slice();
    consumeWhitespace(queries);
    if (queries.length == 0 || queries[0].typ != EnumToken.DashedIdenTokenType) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@custom-media',
            error: 'expecting dashed identifier',
            tokens: []
        };
    }
    queries.shift();
    const result = validateAtRuleMediaQueryList(queries, atRule);
    if (result.valid == ValidationLevel.Drop) {
        atRule.tokens = [];
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@custom-media',
            error: '',
            tokens: []
        };
    }
    return result;
}

export { validateAtRuleCustomMedia };
