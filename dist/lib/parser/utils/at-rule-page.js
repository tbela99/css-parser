import { EnumToken } from '../../ast/types.js';
import { getSyntaxRule } from '../../validation/config.js';
import { matchAllSyntax, createValidationContext } from '../../validation/match.js';
import { trimSyntaxArray } from '../../validation/parser/parse.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';

function parseAtRulePage(context, stream, options, errors) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@page");
    const syntax = syntaxRules?.getPreludeRules?.()?.slice?.(1);
    let validate = false;
    for (const token of stream) {
        if (token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType) {
            validate = true;
            break;
        }
    }
    if (!validate) {
        return {
            success: true,
            errors,
        };
    }
    const result = matchAllSyntax(trimSyntaxArray(syntax), createValidationContext(stream), options);
    errors.push(...result.errors);
    return { success: result.success, errors };
}

export { parseAtRulePage };
