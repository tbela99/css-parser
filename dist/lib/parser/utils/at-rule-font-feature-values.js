import { getSyntaxRule } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';

function parseAtRuleFontFeatureValues(stream, context, options = {}) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    trimArray(stream);
    const { success, errors} = matchAllSyntaxes(syntax, createValidationContext(stream), options);
    return { success, errors };
}

export { parseAtRuleFontFeatureValues };
