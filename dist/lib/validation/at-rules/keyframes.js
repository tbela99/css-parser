import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateAtRuleKeyframes(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude',
            tokens: []
        };
    }
    const tokens = atRule.tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting at-rule prelude',
            tokens
        };
    }
    if (![EnumToken.StringTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ)) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting ident or string token',
            tokens
        };
    }
    tokens.shift();
    consumeWhitespace(tokens);
    if (tokens.length > 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@keyframes',
            error: 'unexpected token',
            tokens
        };
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@keyframes',
        error: '',
        tokens
    };
}

export { validateAtRuleKeyframes };
