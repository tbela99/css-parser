import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { validateURL } from '../syntaxes/url.js';

function validateAtRuleDocument(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
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
    let result = null;
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude',
            tokens
        };
    }
    if (tokens[0].typ == EnumToken.CommaTokenType) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@document',
            error: 'unexpected token',
            tokens
        };
    }
    while (tokens.length > 0) {
        if (tokens[0].typ == EnumToken.CommentTokenType) {
            tokens.shift();
            consumeWhitespace(tokens);
        }
        result = validateURL(tokens[0]);
        if (result.valid == ValidationLevel.Valid) {
            tokens.shift();
            consumeWhitespace(tokens);
            continue;
        }
        if (tokens[0].typ == EnumToken.FunctionTokenType) {
            if (!['url-prefix', 'domain', 'media-document', 'regexp'].some((t) => t.localeCompare(tokens[0].val, undefined, { sensitivity: 'base' }) == 0)) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@document',
                    error: 'unexpected token',
                    tokens
                };
            }
            const children = tokens[0].chi.slice();
            consumeWhitespace(children);
            if (children.length == 0) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@document',
                    error: 'expecting string argument',
                    tokens
                };
            }
            if (children[0].typ == EnumToken.StringTokenType) {
                children.shift();
                consumeWhitespace(children);
            }
            if (children.length > 0) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: children[0],
                    syntax: '@document',
                    error: 'unexpected token',
                    tokens
                };
            }
            tokens.shift();
            consumeWhitespace(tokens);
        }
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@document',
        error: '',
        tokens
    };
}

export { validateAtRuleDocument };
