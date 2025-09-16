import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { colorFontTech, fontFeaturesTech, fontFormat } from '../../syntax/syntax.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';

function validateAtRuleSupports(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports query list',
            tokens: []
        };
    }
    if (!Array.isArray(atRule.chi)) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports body',
            tokens: []
        };
    }
    const result = validateAtRuleSupportsConditions(atRule, atRule.tokens);
    if (result) {
        if (result.node == null) {
            result.node = atRule;
        }
        return result;
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body'
        };
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: ''
    };
}
function validateAtRuleSupportsConditions(atRule, tokenList) {
    let result = null;
    for (const tokens of splitTokenList(tokenList)) {
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0] ?? atRule,
                syntax: '@' + atRule.nam,
                error: 'unexpected token',
                tokens: []
            };
        }
        let previousToken = null;
        while (tokens.length > 0) {
            result = validateSupportCondition(atRule, tokens[0]);
            // supports-condition
            if (result.valid == SyntaxValidationResult.Valid) {
                previousToken = tokens[0];
                tokens.shift();
            }
            else {
                result = validateSupportFeature(tokens[0]);
                if ( /*result == null || */result.valid == SyntaxValidationResult.Valid) {
                    previousToken = tokens[0];
                    tokens.shift();
                }
                else {
                    if (tokens[0].typ == EnumToken.ParensTokenType) {
                        result = validateAtRuleSupportsConditions(atRule, tokens[0].chi);
                        if ( /* result == null || */result.valid == SyntaxValidationResult.Valid) {
                            previousToken = tokens[0];
                            tokens.shift();
                            // continue;
                        }
                        else {
                            return result;
                        }
                    }
                    else {
                        return result;
                    }
                    // if (result!= null && result.valid == ValidationLevel.Drop) {
                    //
                    //     return  {
                    //         valid: ValidationLevel.Drop,
                    //         context: [],
                    //         node: tokens[0] ?? atRule,
                    //         syntax: '@' + atRule.nam,
                    //         // @ts-ignore
                    //         error: result.error as string ?? 'unexpected token',
                    //         tokens: []
                    //     };
                    // }
                }
            }
            if (tokens.length == 0) {
                break;
            }
            if (!consumeWhitespace(tokens)) {
                if (previousToken?.typ != EnumToken.ParensTokenType) {
                    // @ts-ignore
                    return {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? previousToken ?? atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected whitespace'
                    };
                }
            }
            if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected and/or'
                };
            }
            if (tokens.length == 1) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected supports-condition'
                };
            }
            tokens.shift();
            if (!consumeWhitespace(tokens)) {
                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected whitespace'
                };
            }
        }
    }
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: ''
    };
}
function validateSupportCondition(atRule, token) {
    if (token.typ == EnumToken.MediaFeatureNotTokenType) {
        return validateSupportCondition(atRule, token.val);
    }
    if (token.typ == EnumToken.FunctionTokenType && 'selector' === token.val.toLowerCase()) {
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: token,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    const chi = token.chi.filter((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
    if (chi.length != 1) {
        return validateAtRuleSupportsConditions(atRule, token.chi);
    }
    if (chi[0].typ == EnumToken.IdenTokenType) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    if (chi[0].typ == EnumToken.MediaFeatureNotTokenType) {
        return validateSupportCondition(atRule, chi[0].val);
    }
    if (chi[0].typ == EnumToken.MediaQueryConditionTokenType) {
        // @ts-ignore
        return chi[0].l.typ == EnumToken.IdenTokenType && chi[0].op.typ == EnumToken.ColonTokenType ?
            {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: null,
                syntax: 'supports-condition',
                error: ''
            } : {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: token,
            syntax: 'supports-condition',
            error: 'expected supports condition-in-parens'
        };
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Drop,
        context: [],
        node: token,
        syntax: 'supports-condition',
        error: 'expected supports condition-in-parens'
    };
}
function validateSupportFeature(token) {
    if (token.typ == EnumToken.MediaFeatureNotTokenType) {
        return validateSupportFeature(token.val);
    }
    if (token.typ == EnumToken.FunctionTokenType) {
        if ('selector' === token.val.toLowerCase()) {
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: token,
                syntax: 'selector',
                error: ''
            };
        }
        if ('font-tech' === token.val.toLowerCase()) {
            const chi = token.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
            // @ts-ignore
            return chi.length == 1 && chi[0].typ == EnumToken.IdenTokenType && colorFontTech.concat(fontFeaturesTech).includes(chi[0].val.toLowerCase()) ?
                {
                    valid: SyntaxValidationResult.Valid,
                    context: [],
                    node: token,
                    syntax: 'font-tech',
                    error: ''
                } :
                {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: token,
                    syntax: 'font-tech',
                    error: 'expected font-tech'
                };
        }
        if ('font-format' === token.val.toLowerCase()) {
            const chi = token.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
            // @ts-ignore
            return chi.length == 1 && chi[0].typ == EnumToken.IdenTokenType && fontFormat.includes(chi[0].val, toLowerCase()) ?
                {
                    valid: SyntaxValidationResult.Valid,
                    context: [],
                    node: token,
                    syntax: 'font-format',
                    error: ''
                } :
                {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: token,
                    syntax: 'font-format',
                    error: 'expected font-format'
                };
        }
    }
    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Drop,
        context: [],
        node: token,
        syntax: '@supports',
        error: 'expected feature'
    };
}

export { validateAtRuleSupports, validateAtRuleSupportsConditions, validateSupportCondition };
