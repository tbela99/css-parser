import { EnumToken } from '../../ast/types.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxRule } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { LOC } from '../../syntax/constants.js';

function matchAtRuleSyntax(atRule, stream, options) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRule.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    trimArray(stream);
    if (syntax.length === 0) {
        const filtered = stream.filter((token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
        if (filtered.length > 0) {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `unexpected token ${EnumToken[filtered[0].typ]} at ${filtered[0][LOC].src}:${filtered[0][LOC].sta.lin}:${filtered[0][LOC].sta.col}`,
                        node: filtered[0],
                        location: filtered[0][LOC],
                    },
                ],
            };
        }
        return { success: true, errors: [] };
    }
    const { success, errors} = matchAllSyntaxes(syntax, createValidationContext(stream), options);
    return { success, errors };
}

export { matchAtRuleSyntax };
