import type { Token, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";

export function parseAtRuleFontFeatureValues(arena: AstArena, stream: Token[], context: Token, options: ParserOptions = {}) {
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.strings[arena.name[context]]);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];

    trimArray(arena, stream);

    const { success, errors /* , ...all */ } = matchAllSyntaxes(arena, syntax, createValidationContext(arena, stream), options);

    return { success, errors };
}
