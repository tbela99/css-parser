import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { validateURL } from '../syntaxes/url.js';

function validateAtRuleNamespace(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: 'expected at-rule prelude'
        };
    }
    if ('chi' in atRule) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: 'unexpected at-rule body'
        };
    }
    const tokens = atRule.tokens.slice();
    consumeWhitespace(tokens);
    if (tokens[0].typ == EnumToken.IdenTokenType) {
        tokens.shift();
        consumeWhitespace(tokens);
    }
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: atRule,
            syntax: '@namespace',
            error: 'expected string or url()'
        };
    }
    if (tokens[0].typ != EnumToken.StringTokenType) {
        const result = validateURL(tokens[0]);
        if (result.valid != ValidationLevel.Valid) {
            return result;
        }
        tokens.shift();
        consumeWhitespace(tokens);
    }
    else {
        tokens.shift();
        consumeWhitespace(tokens);
    }
    if (tokens.length > 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            context: [],
            node: tokens[0],
            syntax: '@namespace',
            error: 'unexpected token'
        };
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        context: [],
        node: atRule,
        syntax: '@namespace',
        error: ''
    };
}

export { validateAtRuleNamespace };
