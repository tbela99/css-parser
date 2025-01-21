import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { validateAtRuleSupports } from './supports.js';
import { validateAtRuleMediaQueryList } from './media.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { validateLayerName } from '../syntaxes/layer-name.js';
import '../syntaxes/complex-selector.js';

function validateAtRuleImport(atRule, options, root) {
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list',
            tokens: []
        };
    }
    if ('chi' in atRule) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'unexpected at-rule body',
            tokens: []
        };
    }
    const tokens = atRule.tokens.filter((t) => ![EnumToken.CommentTokenType].includes(t.typ));
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: 'expected @import media query list',
            tokens: []
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
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'invalid url()',
                tokens
            };
        }
        else {
            tokens.shift();
            // @ts-ignore
            if (!consumeWhitespace(tokens)) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace',
                    tokens
                };
            }
        }
    }
    else {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@' + atRule.nam,
            error: 'expecting url() or string',
            tokens
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
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: '@' + atRule.nam,
                        error: 'expecting whitespace',
                        tokens
                    };
                }
            }
        }
        // @ts-ignore
        else if (tokens[0].typ == EnumToken.FunctionTokenType) {
            // @ts-ignore
            if ('layer'.localeCompare(tokens[0].val, undefined, { sensitivity: 'base' }) != 0) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting layer()',
                    tokens
                };
            }
            // @ts-ignore
            const result = validateLayerName(tokens[0].chi);
            if (result.valid == ValidationLevel.Drop) {
                return result;
            }
            tokens.shift();
            // @ts-ignore
            if (!consumeWhitespace(tokens)) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace',
                    tokens
                };
            }
        }
    }
    if (tokens.length > 0) {
        // @ts-ignore
        if (tokens[0].typ == EnumToken.AtRuleTokenType) {
            if (tokens[0].nam != 'supports') {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting @supports or media query list',
                    tokens
                };
            }
            // @ts-ignore
            const result = validateAtRuleSupports(tokens[0]);
            if (result.valid == ValidationLevel.Drop) {
                return result;
            }
            tokens.shift();
            // @ts-ignore
            if (!consumeWhitespace(tokens)) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting whitespace',
                    tokens
                };
            }
        }
    }
    if (tokens.length > 0) {
        return validateAtRuleMediaQueryList(tokens, atRule);
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    };
}

export { validateAtRuleImport };
