/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
<<<<<<< HEAD
	Version: 2.0.0-alpha.1
=======
	Version: 1.6.8
>>>>>>> v.next
	License: MIT
 */
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxRule } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';

function matchAtRuleSyntax(atRule, stream, options) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRule.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    trimArray(stream);
    if (syntax.length === 0) {
        return { success: true, errors: [] };
    }
    const { success, errors } = matchAllSyntaxes(syntax, createValidationContext(stream), options);
    return { success, errors };
}

export { matchAtRuleSyntax };
