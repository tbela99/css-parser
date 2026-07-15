import type { AtRuleToken, Token, ParserOptions, ValidationOptions, ErrorDescription } from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { LOC } from "../../syntax/constants.ts";

export function matchAtRuleSyntax(atRule: AtRuleToken, stream: Token[], options: ParserOptions | ValidationOptions): {
    success: boolean;
    errors: ErrorDescription[]
} {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRule.nam);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];

    trimArray(stream);

    if (syntax.length === 0) {
        const filtered = stream.filter(
            (token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
        );

        if (filtered.length > 0) {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `unexpected token ${EnumToken[filtered[0].typ]} at ${filtered[0][LOC]!.src}:${
                            filtered[0][LOC]!.sta.lin
                        }:${filtered[0][LOC]!.sta.col}`,
                        node: filtered[0],
                        location: filtered[0][LOC]!,
                    },
                ],
            };
        }

        return { success: true, errors: [] };
    }

    const { success, errors, ...all } = matchAllSyntaxes(syntax, createValidationContext(stream), options);

    return { success, errors };
}
