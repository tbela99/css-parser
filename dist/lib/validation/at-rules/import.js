import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { validateAtRuleMediaQueryList } from './media.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { validateLayerName } from '../syntaxes/layer-name.js';
import '../syntaxes/complex-selector.js';
import '../syntax.js';
import '../config.js';
import { validateAtRuleSupportsConditions } from './supports.js';

function validateAtRuleImport(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list'
        };
    }
    if ('chi' in atRule) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'unexpected at-rule body'
        };
    }
    const tokens = atRule.tokens.filter((t) => ![EnumToken.CommentTokenType].includes(t.typ));
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list'
        };
    }
    if (tokens[0].typ == EnumToken.StringTokenType) {
        tokens.shift();
        // @ts-ignore
        consumeWhitespace(tokens);
    }
    else if (tokens[0].typ == EnumToken.UrlFunctionTokenType) {
        const slice = tokens[0].chi.filter((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
        if (slice.length != 1 || ![EnumToken.StringTokenType, EnumToken.UrlTokenTokenType].includes(slice[0].typ)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'invalid url()'
            };
        }
        else {
            tokens.shift();
            // @ts-ignore
            if (!consumeWhitespace(tokens)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace'
                };
            }
        }
        tokens.shift();
        // @ts-ignore
        consumeWhitespace(tokens);
    }
    else {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: tokens[0],
            syntax: '@' + atRule.nam,
            error: 'expecting url() or string'
        };
    }
    if (tokens.length > 0) {
        // @ts-ignore
        if (tokens[0].typ == EnumToken.IdenTokenType) {
            // @ts-ignore
            if ('layer'.localeCompare(tokens[0].val, undefined, { sensitivity: 'base' }) == 0) {
                tokens.shift();
                // @ts-ignore
                if (!consumeWhitespace(tokens)) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0],
                        syntax: '@' + atRule.nam,
                        error: 'expecting whitespace'
                    };
                }
            }
        }
        // @ts-ignore
        else if (tokens[0].typ == EnumToken.FunctionTokenType) {
            // @ts-ignore
            if ('layer'.localeCompare(tokens[0].val, undefined, { sensitivity: 'base' }) == 0) {
                const result = validateLayerName(tokens[0].chi);
                if (result.valid == SyntaxValidationResult.Drop) {
                    return result;
                }
                tokens.shift();
                // @ts-ignore
                consumeWhitespace(tokens);
            }
            // @ts-ignore
            if ('supports'.localeCompare(tokens[0]?.val, undefined, { sensitivity: 'base' }) == 0) {
                const result = validateAtRuleSupportsConditions(atRule, tokens[0].chi);
                if (result.valid == SyntaxValidationResult.Drop) {
                    return result;
                }
                tokens.shift();
                // @ts-ignore
                consumeWhitespace(tokens);
            }
        }
    }
    if (tokens.length > 0) {
        return validateAtRuleMediaQueryList(tokens, atRule);
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: null,
        syntax: '@' + atRule.nam,
        error: ''
    };
}

export { validateAtRuleImport };
