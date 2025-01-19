import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../parser/utils/config.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';

function validateAtRuleMedia(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: 'expected media query list',
            tokens: []
        };
    }
    const result = validateAtRuleMediaQueryList(atRule.tokens, atRule);
    if (result.valid == ValidationLevel.Drop) {
        return result;
    }
    if (!('chi' in atRule)) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: 'expected at-rule body',
            tokens: []
        };
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@media',
        error: '',
        tokens: []
    };
}
function validateAtRuleMediaQueryList(tokenList, atRule) {
    for (const tokens of splitTokenList(tokenList)) {
        if (tokens.length == 0) {
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0] ?? atRule,
                syntax: '@media',
                error: 'unexpected token',
                tokens: []
            };
        }
        let previousToken = null;
        while (tokens.length > 0) {
            // media-condition
            if (validateMediaCondition(tokens[0])) {
                previousToken = tokens[0];
                tokens.shift();
            }
            // media-type
            else if (validateMediaFeature(tokens[0])) {
                previousToken = tokens[0];
                tokens.shift();
            }
            if (tokens.length == 0) {
                break;
            }
            if (!consumeWhitespace(tokens)) {
                if (previousToken?.typ != EnumToken.ParensTokenType) {
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expected media query list',
                        tokens: []
                    };
                }
            }
            if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected and/or',
                    tokens: []
                };
            }
            if (tokens.length == 1) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected media-condition',
                    tokens: []
                };
            }
            tokens.shift();
            if (!consumeWhitespace(tokens)) {
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected whitespace',
                    tokens: []
                };
            }
        }
    }
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@media',
        error: '',
        tokens: []
    };
}
function validateMediaCondition(token) {
    if (token.typ == EnumToken.MediaFeatureNotTokenType) {
        return validateMediaCondition(token.val);
    }
    if (token.typ != EnumToken.ParensTokenType) {
        return false;
    }
    const chi = token.chi.filter((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
    if (chi.length != 1) {
        return false;
    }
    if (chi[0].typ == EnumToken.IdenTokenType) {
        return true;
    }
    if (chi[0].typ == EnumToken.MediaFeatureNotTokenType) {
        return validateMediaCondition(chi[0].val);
    }
    if (chi[0].typ == EnumToken.MediaQueryConditionTokenType) {
        return chi[0].l.typ == EnumToken.IdenTokenType;
    }
    return false;
}
function validateMediaFeature(token) {
    let val = token;
    if (token.typ == EnumToken.MediaFeatureOnlyTokenType || token.typ == EnumToken.MediaFeatureNotTokenType) {
        val = token.val;
    }
    return val.typ == EnumToken.MediaFeatureTokenType;
}

export { validateAtRuleMedia, validateAtRuleMediaQueryList };
