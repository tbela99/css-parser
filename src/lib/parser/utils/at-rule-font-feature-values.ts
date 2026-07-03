import type { ParserOptions, Token, AstAtRule , AtRuleToken } from "../../../@types/index.d.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntax, trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";

export function parseAtRuleFontFeatureValues(
    stream: Token[],
    context: AstAtRule | AtRuleToken,
    options: ParserOptions = {}) {
const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];

    trimArray(stream);

    const { success, errors, ...all } = matchAllSyntax(syntax, createValidationContext(stream), options);

    return { success, errors };
}