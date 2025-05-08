import { ValidationLevel, EnumToken } from '../../ast/types.js';
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
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: '@' + atRule.nam,
            error: '',
            tokens: []
        };
    }
    if (!('chi' in atRule)) {
        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@' + atRule.nam,
            error: 'expected margin-box body',
            tokens: []
        };
    }
    for (const token of atRule.chi) {
        if (![EnumToken.DeclarationNodeType, EnumToken.CommentNodeType, EnumToken.WhitespaceTokenType].includes(token.typ)) {
            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: token,
                syntax: 'declaration-list',
                error: 'expected margin-box body',
                tokens: []
            };
        }
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

export { validateAtRulePageMarginBox };
