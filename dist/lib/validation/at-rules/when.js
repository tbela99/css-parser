import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { generalEnclosedFunc } from '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { validateMediaFeature, validateMediaCondition } from './media.js';
import { validateSupportCondition } from './supports.js';

function validateAtRuleWhen(atRule, options, root) {
    const slice = Array.isArray(atRule.tokens) ? atRule.tokens.slice() : [];
    consumeWhitespace(slice);
    if (slice.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@when',
            error: '',
            tokens: []
        };
    }
    const result = validateAtRuleWhenQueryList(atRule.tokens, atRule);
    if (result.valid == SyntaxValidationResult.Drop) {
        return result;
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@when',
            error: 'expected at-rule body',
            tokens: []
        };
    }
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@when',
        error: ''
    };
}
// media() = media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )
// supports() = supports( <declaration> )
function validateAtRuleWhenQueryList(tokenList, atRule) {
    const matched = [];
    let result = null;
    for (const split of splitTokenList(tokenList)) {
        const match = [];
        result = null;
        consumeWhitespace(split);
        if (split.length == 0) {
            continue;
        }
        while (split.length > 0) {
            if (split[0].typ != EnumToken.FunctionTokenType || !generalEnclosedFunc.includes(split[0].val)) {
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: split[0] ?? atRule,
                    syntax: '@when',
                    error: 'unexpected token',
                    tokens: []
                };
                break;
            }
            const chi = split[0].chi.slice();
            consumeWhitespace(chi);
            if (split[0].val == 'media') {
                // result = valida
                if (chi.length != 1 || !(validateMediaFeature(chi[0]) || validateMediaCondition(split[0], atRule))) {
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: split[0] ?? atRule,
                        syntax: 'media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )',
                        error: 'unexpected token'
                    };
                    break;
                }
            }
            else if (generalEnclosedFunc.includes(split[0].val)) {
                // result = valida
                if (!validateSupportCondition(atRule, split[0])) {
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: split[0] ?? atRule,
                        syntax: 'media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )',
                        error: 'unexpected token'
                    };
                    break;
                }
            }
            if (match.length > 0) {
                match.push({ typ: EnumToken.WhitespaceTokenType });
            }
            match.push(split.shift());
            consumeWhitespace(split);
            if (split.length == 0) {
                break;
            }
            if (![EnumToken.MediaFeatureAndTokenType, EnumToken.MediaFeatureOrTokenType].includes(split[0].typ)) {
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: split[0] ?? atRule,
                    syntax: '@when',
                    error: 'expecting and/or media-condition',
                    tokens: []
                };
                break;
            }
            if (match.length > 0) {
                match.push({ typ: EnumToken.WhitespaceTokenType });
            }
            match.push(split.shift());
            consumeWhitespace(split);
            if (split.length == 0) {
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: split[0] ?? atRule,
                    syntax: '@when',
                    error: 'expecting media-condition',
                    tokens: []
                };
                break;
            }
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
            valid: SyntaxValidationResult.Drop,
            context: [],
            // @ts-ignore
            node: result?.node ?? atRule,
            syntax: '@when',
            error: 'invalid at-rule body'
        };
    }
    tokenList.length = 0;
    for (const match of matched) {
        if (tokenList.length > 0) {
            tokenList.push({
                typ: EnumToken.CommaTokenType
            });
        }
        tokenList.push(...match);
    }
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@when',
        error: ''
    };
}

export { validateAtRuleWhen, validateAtRuleWhenQueryList };
