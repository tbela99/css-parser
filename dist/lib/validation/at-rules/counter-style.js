import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function validateAtRuleCounterStyle(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: 'expected counter style name',
            tokens: []
        };
    }
    const tokens = atRule.tokens.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: 'expected counter style name',
            tokens
        };
    }
    if (tokens.length > 1) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[1] ?? atRule,
            syntax: '@counter-style',
            error: 'unexpected token',
            tokens
        };
    }
    if (![EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType].includes(tokens[0].typ)) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@counter-style',
            error: 'expected counter style name',
            tokens
        };
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@counter-style',
            error: 'expected counter style body',
            tokens
        };
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@counter-style',
        error: '',
        tokens
    };
}

export { validateAtRuleCounterStyle };
