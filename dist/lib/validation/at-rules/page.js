import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { splitTokenList } from '../utils/list.js';

function validateAtRulePage(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: '@page',
            error: '',
            tokens: []
        };
    }
    // page-selector-list
    for (const tokens of splitTokenList(atRule.tokens)) {
        if (tokens.length == 0) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0] ?? atRule,
                syntax: '@page',
                error: 'unexpected token',
                tokens: []
            };
        }
        // <pseudo-page>+ | <ident> <pseudo-page>*
        // ident pseudo-page* | pseudo-page+
        if (tokens[0].typ == EnumToken.IdenTokenType) {
            tokens.shift();
            if (tokens.length == 0) {
                continue;
            }
            // @ts-ignore
            if (tokens[0].typ != EnumToken.WhitespaceTokenType) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@page',
                    error: 'unexpected token',
                    tokens: []
                };
            }
        }
        while (tokens.length > 0) {
            if (tokens[0].typ == EnumToken.PseudoPageTokenType) {
                tokens.shift();
                if (tokens.length == 0) {
                    continue;
                }
                // @ts-ignore
                if (tokens[0].typ != EnumToken.WhitespaceTokenType) {
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@page',
                        error: 'unexpected token',
                        tokens: []
                    };
                }
            }
        }
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@page',
        error: '',
        tokens: []
    };
}

export { validateAtRulePage };
