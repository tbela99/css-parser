import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import { consumeWhitespace } from '../utils/whitespace.js';
import { splitTokenList } from '../utils/list.js';

const validateContainerScrollStateFeature = validateContainerSizeFeature;
function validateAtRuleContainer(atRule, options, root) {
    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected supports query list'
        };
    }
    const result = validateAtRuleContainerQueryList(atRule.tokens, atRule);
    if (result.valid == SyntaxValidationResult.Drop) {
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
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: '',
    };
}
function validateAtRuleContainerQueryList(tokens, atRule) {
    if (tokens.length == 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query list'
        };
    }
    let result = null;
    let tokenType = null;
    for (const queries of splitTokenList(tokens)) {
        consumeWhitespace(queries);
        if (queries.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query list'
            };
        }
        result = null;
        const match = [];
        let token = null;
        tokenType = null;
        while (queries.length > 0) {
            if (queries.length == 0) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query list'
                };
            }
            if (queries[0].typ == EnumToken.IdenTokenType) {
                match.push(queries.shift());
                consumeWhitespace(queries);
            }
            if (queries.length == 0) {
                break;
            }
            token = queries[0];
            if (token?.typ == EnumToken.MediaFeatureNotTokenType) {
                token = token.val;
            }
            if (token?.typ != EnumToken.ParensTokenType && (token?.typ != EnumToken.FunctionTokenType || !['scroll-state', 'style'].includes(token.val))) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens'
                };
            }
            if (token?.typ == EnumToken.ParensTokenType) {
                result = validateContainerSizeFeature(token.chi, atRule);
            }
            else if (token.val == 'scroll-state') {
                result = validateContainerScrollStateFeature(token.chi, atRule);
            }
            else {
                result = validateContainerStyleFeature(token.chi, atRule);
            }
            if (result.valid == SyntaxValidationResult.Drop) {
                return result;
            }
            queries.shift();
            consumeWhitespace(queries);
            if (queries.length == 0) {
                break;
            }
            token = queries[0];
            if (token?.typ != EnumToken.MediaFeatureAndTokenType && token?.typ != EnumToken.MediaFeatureOrTokenType) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expecting and/or container query token'
                };
            }
            if (tokenType == null) {
                tokenType = token?.typ;
            }
            if (tokenType == null || tokenType != token?.typ) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'mixing and/or not allowed at the same level'
                };
            }
            queries.shift();
            consumeWhitespace(queries);
            if (queries.length == 0) {
                return {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: queries[0],
                    syntax: '@' + atRule.nam,
                    error: 'expected container query-in-parens'
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
function validateContainerStyleFeature(tokens, atRule) {
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 1) {
        if (tokens[0].typ == EnumToken.ParensTokenType) {
            return validateContainerStyleFeature(tokens[0].chi, atRule);
        }
        if ([EnumToken.DashedIdenTokenType, EnumToken.IdenTokenType].includes(tokens[0].typ) ||
            (tokens[0].typ == EnumToken.MediaQueryConditionTokenType && tokens[0].op.typ == EnumToken.ColonTokenType)) {
            return {
                valid: SyntaxValidationResult.Valid,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: ''
            };
        }
    }
    return {
        valid: SyntaxValidationResult.Drop,
        context: [],
        node: atRule,
        syntax: '@' + atRule.nam,
        error: 'expected container query features'
    };
}
function validateContainerSizeFeature(tokens, atRule) {
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features'
        };
    }
    if (tokens.length == 1) {
        const token = tokens[0];
        if (token.typ == EnumToken.MediaFeatureNotTokenType) {
            return validateContainerSizeFeature([token.val], atRule);
        }
        if (token.typ == EnumToken.ParensTokenType) {
            return validateAtRuleContainerQueryStyleInParams(token.chi, atRule);
        }
        if (![EnumToken.DashedIdenTokenType, EnumToken.MediaQueryConditionTokenType].includes(tokens[0].typ)) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query features'
            };
        }
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    return validateAtRuleContainerQueryStyleInParams(tokens, atRule);
}
function validateAtRuleContainerQueryStyleInParams(tokens, atRule) {
    tokens = tokens.slice();
    consumeWhitespace(tokens);
    if (tokens.length == 0) {
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected container query features'
        };
    }
    let token = tokens[0];
    let tokenType = null;
    let result = null;
    while (tokens.length > 0) {
        token = tokens[0];
        if (token.typ == EnumToken.MediaFeatureNotTokenType) {
            token = token.val;
        }
        if (tokens[0].typ != EnumToken.ParensTokenType) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: atRule,
                syntax: '@' + atRule.nam,
                error: 'expected container query-in-parens'
            };
        }
        const slices = tokens[0].chi.slice();
        consumeWhitespace(slices);
        if (slices.length == 1) {
            if ([EnumToken.MediaFeatureNotTokenType, EnumToken.ParensTokenType].includes(slices[0].typ)) {
                result = validateAtRuleContainerQueryStyleInParams(slices, atRule);
                if (result.valid == SyntaxValidationResult.Drop) {
                    return result;
                }
            }
            else if (![EnumToken.DashedIdenTokenType, EnumToken.MediaQueryConditionTokenType].includes(slices[0].typ)) {
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: atRule,
                    syntax: '@' + atRule.nam,
                    error: 'expected container query features'
                };
            }
        }
        else {
            result = validateAtRuleContainerQueryStyleInParams(slices, atRule);
            if (result.valid == SyntaxValidationResult.Drop) {
                return result;
            }
        }
        tokens.shift();
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            break;
        }
        if (![EnumToken.MediaFeatureAndTokenType, EnumToken.MediaFeatureOrTokenType].includes(tokens[0].typ)) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expecting and/or container query token'
            };
        }
        if (tokenType == null) {
            tokenType = tokens[0].typ;
        }
        if (tokenType != tokens[0].typ) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'mixing and/or not allowed at the same level'
            };
        }
        tokens.shift();
        consumeWhitespace(tokens);
        if (tokens.length == 0) {
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0],
                syntax: '@' + atRule.nam,
                error: 'expected container query-in-parens'
            };
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

export { validateAtRuleContainer };
