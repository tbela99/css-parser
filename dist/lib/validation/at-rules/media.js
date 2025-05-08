import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';

function validateAtRuleMedia(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: null,
            error: '',
            tokens: []
        };
    }
    let result = null;
    const slice = atRule.tokens.slice();
    consumeWhitespace(slice);
    if (slice.length == 0) {
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: '',
            tokens: []
        };
    }
    result = validateAtRuleMediaQueryList(atRule.tokens, atRule);
    if (result.valid == ValidationLevel.Drop) {
        return result;
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: 'expected at-rule body',
            tokens: []
        };
    }
    // @ts-ignore
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
    const split = splitTokenList(tokenList);
    const matched = [];
    let result = null;
    let previousToken;
    let mediaFeatureType;
    for (let i = 0; i < split.length; i++) {
        const tokens = split[i].slice();
        const match = [];
        result = null;
        mediaFeatureType = null;
        previousToken = null;
        if (tokens.length == 0) {
            // @ts-ignore
            result = {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0] ?? atRule,
                syntax: '@media',
                error: 'unexpected token',
                tokens: []
            };
            continue;
        }
        while (tokens.length > 0) {
            previousToken = tokens[0];
            // media-condition | media-type | custom-media
            if (!(validateMediaCondition(tokens[0], atRule) || validateMediaFeature(tokens[0]) || validateCustomMediaCondition(tokens[0], atRule))) {
                if (tokens[0].typ == EnumToken.ParensTokenType) {
                    result = validateAtRuleMediaQueryList(tokens[0].chi, atRule);
                }
                else {
                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expecting media feature or media condition',
                        tokens: []
                    };
                }
                if (result.valid == ValidationLevel.Drop) {
                    break;
                }
                result = null;
            }
            match.push(tokens.shift());
            if (tokens.length == 0) {
                break;
            }
            if (!consumeWhitespace(tokens)) {
                if (previousToken?.typ != EnumToken.ParensTokenType) {
                    // @ts-ignore
                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expected media query list',
                        tokens: []
                    };
                    break;
                }
            }
            else if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {
                // @ts-ignore
                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected and/or',
                    tokens: []
                };
                break;
            }
            if (mediaFeatureType == null) {
                mediaFeatureType = tokens[0];
            }
            if (mediaFeatureType.typ != tokens[0].typ) {
                // @ts-ignore
                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'mixing and/or not allowed at the same level',
                    tokens: []
                };
                break;
            }
            match.push({ typ: EnumToken.WhitespaceTokenType }, tokens.shift());
            consumeWhitespace(tokens);
            if (tokens.length == 0) {
                // @ts-ignore
                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected media-condition',
                    tokens: []
                };
                break;
            }
            match.push({ typ: EnumToken.WhitespaceTokenType });
        }
        if (result == null && match.length > 0) {
            matched.push(match);
        }
    }
    if (result != null) {
        return result;
    }
    if (matched.length == 0) {
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@media',
            error: 'expected media query list',
            tokens: []
        };
    }
    tokenList.length = 0;
    let hasAll = false;
    for (let i = 0; i < matched.length; i++) {
        if (tokenList.length > 0) {
            tokenList.push({ typ: EnumToken.CommaTokenType });
        }
        if (matched[i].length == 1 && matched.length > 1 && matched[i][0].typ == EnumToken.MediaFeatureTokenType && matched[i][0].val == 'all') {
            hasAll = true;
            continue;
        }
        tokenList.push(...matched[i]);
    }
    if (hasAll && tokenList.length == 0) {
        tokenList.push({ typ: EnumToken.MediaFeatureTokenType, val: 'all' });
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@media',
        error: '',
        tokens: []
    };
}
function validateCustomMediaCondition(token, atRule) {
    if (token.typ == EnumToken.MediaFeatureNotTokenType) {
        return validateMediaCondition(token.val, atRule);
    }
    if (token.typ != EnumToken.ParensTokenType) {
        return false;
    }
    const chi = token.chi.filter((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
    if (chi.length != 1) {
        return false;
    }
    return chi[0].typ == EnumToken.DashedIdenTokenType;
}
function validateMediaCondition(token, atRule) {
    if (token.typ == EnumToken.MediaFeatureNotTokenType) {
        return validateMediaCondition(token.val, atRule);
    }
    if (token.typ != EnumToken.ParensTokenType && !(['when', 'else', 'import'].includes(atRule.nam) && token.typ == EnumToken.FunctionTokenType && ['media', 'supports', 'selector'].includes(token.val))) {
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
        return validateMediaCondition(chi[0].val, atRule);
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

export { validateAtRuleMedia, validateAtRuleMediaQueryList, validateMediaCondition, validateMediaFeature };
