/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxRule } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';

function matchAtRuleSyntax(arena, atRule, stream, options) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.strings[arena.name[atRule]]);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    trimArray(arena, stream);
    if (syntax.length === 0) {
        return { success: true, errors: [] };
    }
    const { success, errors } = matchAllSyntaxes(arena, syntax, createValidationContext(arena, stream), options);
    return { success, errors };
}

export { matchAtRuleSyntax };
