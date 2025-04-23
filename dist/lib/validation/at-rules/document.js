import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { validateURL } from '../syntaxes/url.js';

function validateAtRuleDocument(atRule, options, root) {
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
    let result = null;
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude',
            tokens
        };
    }
    for (const t of splitTokenList(tokens)) {
        if (t.length != 1) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0] ?? atRule,
                syntax: '@document',
                error: 'unexpected token',
                tokens
            };
        }
        // @ts-ignore
        if ((t[0].typ != EnumToken.FunctionTokenType && t[0].typ != EnumToken.UrlFunctionTokenType) || !['url', 'url-prefix', 'domain', 'media-document', 'regexp'].some((f) => f.localeCompare(t[0].val, undefined, { sensitivity: 'base' }) == 0)) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0] ?? atRule,
                syntax: '@document',
                error: 'expecting any of url-prefix(), domain(), media-document(), regexp() but found ' + t[0].val,
                tokens
            };
        }
        if (t[0].typ == EnumToken.UrlFunctionTokenType) {
            result = validateURL(t[0]);
            if (result?.valid == ValidationLevel.Drop) {
                return result;
            }
            continue;
        }
        const children = t[0].chi.slice();
        consumeWhitespace(children);
        if (children.length != 1 || (children[0].typ != EnumToken.StringTokenType && children[0].typ != EnumToken.UrlTokenTokenType)) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@document',
                error: 'expecting string argument',
                tokens
            };
        }
        tokens.shift();
        consumeWhitespace(tokens);
    }
    // @ts-ignore
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
