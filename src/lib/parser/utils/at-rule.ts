import type {
    AtRuleToken,
    Token,
    ParserOptions,
    ValidationOptions,
    ErrorDescription,
} from "../../../@types/index.d.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";

export function matchAtRuleSyntax(
    atRule: AtRuleToken,
    stream: Token[],
    options: ParserOptions | ValidationOptions,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRule.nam);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];

    trimArray(stream);

    if (syntax.length === 0) {
        return { success: true, errors: [] };
    }

    const { success, errors } = matchAllSyntaxes(syntax, createValidationContext(stream), options);

    return { success, errors };
}
