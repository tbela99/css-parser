import { getSyntaxRule } from '../../validation/config.js';
import { trimArray, matchAllSyntax, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';

function parseAtRuleFontFeatureValues(stream, context, options = {}) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    trimArray(stream);
    // console.debug(stream,syntax.reduce((acc, b) => acc + renderSyntax(b), ""));
    const { success, errors} = matchAllSyntax(syntax, createValidationContext(stream), options);
    return { success, errors };
}

export { parseAtRuleFontFeatureValues };
