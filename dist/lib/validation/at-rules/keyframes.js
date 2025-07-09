import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';

function validateAtRuleKeyframes(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting at-rule prelude'
        };
    }
    const tokens = atRule.tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting at-rule prelude'
        };
    }
    if (![EnumToken.StringTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ)) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@keyframes',
            error: 'expecting ident or string token'
        };
    }
    tokens.shift();
    consumeWhitespace(tokens);
    if (tokens.length > 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: tokens[0],
            syntax: '@keyframes',
            error: 'unexpected token'
        };
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        context: [],
        node: atRule,
        syntax: '@keyframes',
        error: ''
    };
}

export { validateAtRuleKeyframes };
