import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { validateURL } from '../syntaxes/url.js';

function validateAtRuleDocument(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude'
        };
    }
    const tokens = atRule.tokens.slice();
    let result = null;
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude'
        };
    }
    for (const t of splitTokenList(tokens)) {
        if (t.length != 1) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: t[0] ?? atRule,
                syntax: '@document',
                error: 'unexpected token'
            };
        }
        // @ts-ignore
        if ((t[0].typ != EnumToken.FunctionTokenType && t[0].typ != EnumToken.UrlFunctionTokenType) || !['url', 'url-prefix', 'domain', 'media-document', 'regexp'].includes(t[0].val?.toLowerCase?.())) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: t[0] ?? atRule,
                syntax: '@document',
                error: 'expecting any of url-prefix(), domain(), media-document(), regexp() but found ' + t[0].val
            };
        }
        if (t[0].typ == EnumToken.UrlFunctionTokenType) {
            result = validateURL(t[0]);
            if (result?.valid == SyntaxValidationResult.Drop) {
                return result;
            }
            continue;
        }
        const children = t[0].chi.slice();
        consumeWhitespace(children);
        if (children.length != 1 || (children[0].typ != EnumToken.StringTokenType && children[0].typ != EnumToken.UrlTokenTokenType)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@document',
                error: 'expecting string argument'
            };
        }
        tokens.shift();
        consumeWhitespace(tokens);
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@document',
        error: ''
    };
}

export { validateAtRuleDocument };
