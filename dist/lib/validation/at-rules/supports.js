import { ValidationLevel, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import { parseSelector } from '../../parser/parse.js';
import { colorFontTech, fontFeaturesTech, fontFormat } from '../../syntax/syntax.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';
import { validateComplexSelector } from '../syntaxes/complex-selector.js';

function validateAtRuleSupports(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports query list',
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
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected at-rule body',
            tokens: []
        };
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    };
}
function validateAtRuleSupportsConditions(atRule, tokenList) {
    let result = null;
    for (const tokens of splitTokenList(tokenList)) {
        if (tokens.length == 0) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
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
            if (result.valid == ValidationLevel.Valid) {
                previousToken = tokens[0];
                tokens.shift();
            }
            else {
                result = validateSupportFeature(tokens[0]);
                if ( /*result == null || */result.valid == ValidationLevel.Valid) {
                    previousToken = tokens[0];
                    tokens.shift();
                }
                else {
                    if (tokens[0].typ == EnumToken.ParensTokenType) {
                        result = validateAtRuleSupportsConditions(atRule, tokens[0].chi);
                        if ( /* result == null || */result.valid == ValidationLevel.Valid) {
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
                    //         matches: [],
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
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? previousToken ?? atRule,
                        syntax: '@' + atRule.nam,
                        error: 'expected whitespace',
                        tokens: []
                    };
                }
            }
            if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected and/or',
                    tokens: []
                };
            }
            if (tokens.length == 1) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected supports-condition',
                    tokens: []
                };
            }
            tokens.shift();
            if (!consumeWhitespace(tokens)) {
                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@' + atRule.nam,
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
        syntax: '@' + atRule.nam,
        error: '',
        tokens: []
    };
}
function validateSupportCondition(atRule, token) {
    if (token.typ == EnumToken.MediaFeatureNotTokenType) {
        return validateSupportCondition(atRule, token.val);
    }
    if (token.typ != EnumToken.ParensTokenType && !(['when', 'else'].includes(atRule.nam) && token.typ == EnumToken.FunctionTokenType && ['supports', 'font-format', 'font-tech'].includes(token.val))) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: token,
            syntax: '@' + atRule.nam,
            error: 'expected supports condition-in-parens',
            tokens: []
        };
    }
    const chi = token.chi.filter((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
    if (chi.length != 1) {
        return validateAtRuleSupportsConditions(atRule, token.chi);
    }
    if (chi[0].typ == EnumToken.IdenTokenType) {
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
    if (chi[0].typ == EnumToken.MediaFeatureNotTokenType) {
        return validateSupportCondition(atRule, chi[0].val);
    }
    if (chi[0].typ == EnumToken.MediaQueryConditionTokenType) {
        // @ts-ignore
        return chi[0].l.typ == EnumToken.IdenTokenType && chi[0].op.typ == EnumToken.ColonTokenType ?
            {
                valid: ValidationLevel.Valid,
                matches: [],
                node: null,
                syntax: 'supports-condition',
                error: '',
                tokens: []
            } : {
            valid: ValidationLevel.Drop,
            matches: [],
            node: token,
            syntax: 'supports-condition',
            error: 'expected supports condition-in-parens',
            tokens: []
        };
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Drop,
        matches: [],
        node: token,
        syntax: 'supports-condition',
        error: 'expected supports condition-in-parens',
        tokens: []
    };
}
function validateSupportFeature(token) {
    if (token.typ == EnumToken.FunctionTokenType) {
        if (token.val.localeCompare('selector', undefined, { sensitivity: 'base' }) == 0) {
            return validateComplexSelector(parseSelector(token.chi));
        }
        if (token.val.localeCompare('font-tech', undefined, { sensitivity: 'base' }) == 0) {
            const chi = token.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
            // @ts-ignore
            return chi.length == 1 && chi[0].typ == EnumToken.IdenTokenType && colorFontTech.concat(fontFeaturesTech).some((t) => t.localeCompare(chi[0].val, undefined, { sensitivity: 'base' }) == 0) ?
                {
                    valid: ValidationLevel.Valid,
                    matches: [],
                    node: token,
                    syntax: 'font-tech',
                    error: '',
                    tokens: []
                } :
                {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax: 'font-tech',
                    error: 'expected font-tech',
                    tokens: []
                };
        }
        if (token.val.localeCompare('font-format', undefined, { sensitivity: 'base' }) == 0) {
            const chi = token.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
            // @ts-ignore
            return chi.length == 1 && chi[0].typ == EnumToken.IdenTokenType && fontFormat.some((t) => t.localeCompare(chi[0].val, undefined, { sensitivity: 'base' }) == 0) ?
                {
                    valid: ValidationLevel.Valid,
                    matches: [],
                    node: token,
                    syntax: 'font-format',
                    error: '',
                    tokens: []
                } :
                {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: token,
                    syntax: 'font-format',
                    error: 'expected font-format',
                    tokens: []
                };
        }
    }
    // @ts-ignore
    return {
        valid: ValidationLevel.Drop,
        matches: [],
        node: token,
        syntax: '@supports',
        error: 'expected feature',
        tokens: []
    };
}

export { validateAtRuleSupports, validateAtRuleSupportsConditions, validateSupportCondition };
