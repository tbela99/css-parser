/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { getSyntaxRule } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';

function parseAtRuleFontFeatureValues(arena, stream, context, options = {}) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.strings[arena.name[context]]);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    trimArray(arena, stream);
    const { success, errors /* , ...all */ } = matchAllSyntaxes(arena, syntax, createValidationContext(arena, stream), options);
    return { success, errors };
}

export { parseAtRuleFontFeatureValues };
