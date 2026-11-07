import type { Token, ParserOptions, ValidationOptions, ErrorDescription } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";

export function matchAtRuleSyntax(
    arena: AstArena, atRule: Token,
    stream: Token[],
    options: ParserOptions | ValidationOptions,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.strings[arena.name[atRule]]);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];

    trimArray(arena, stream);

    if (syntax.length === 0) {
        return { success: true, errors: [] };
    }

    const { success, errors } = matchAllSyntaxes(arena, syntax, createValidationContext(arena, stream), options);

    return { success, errors };
}
