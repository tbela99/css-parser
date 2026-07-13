import type {
    AstAtRule,
    AtRuleToken,
    ErrorDescription,
    ParserOptions,
    Token,
    TokenizeResult,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes } from "../../validation/match.ts";
import { trimSyntaxArray } from "../../validation/parser/parse.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";

export function parseAtRulePage(
    context: AstAtRule | AtRuleToken,
    stream: Token[],
    options: ParserOptions,
    errors: ErrorDescription[],
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@page");
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules?.()?.slice?.(1) as ValidationToken[];

    let validate: boolean = false;

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

    const result = matchAllSyntaxes(trimSyntaxArray(syntax), createValidationContext(stream), options);
    errors.push(...result.errors);

    return { success: result.success, errors };
}
