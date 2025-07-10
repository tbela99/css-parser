import { SyntaxValidationResult, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function validateAtRulePageMarginBox(atRule, options, root) {
    if (Array.isArray(atRule.tokens) && atRule.tokens.length > 0) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: ''
        };
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected margin-box body'
        };
    }
    for (const token of atRule.chi) {
        if (![EnumToken.DeclarationNodeType, EnumToken.CommentNodeType, EnumToken.WhitespaceTokenType].includes(token.typ)) {
            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: token,
                syntax: 'declaration-list',
                error: 'expected margin-box body'
            };
        }
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

export { validateAtRulePageMarginBox };
