import type { Token, ParserOptions, ErrorDescription } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { matchAllSyntaxes, createValidationContext } from "../../validation/match.ts";
import { trimSyntaxArray } from "../../validation/parser/parse.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";

/**
 *
 * @param stream
 * @param options
 * @param errors
 * @returns
 */
export function parseDeclarationList(
    arena: AstArena,
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
        if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType) {
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

    const result = matchAllSyntaxes(arena, trimSyntaxArray(syntax), createValidationContext(arena, stream), options);
    errors.push(...result.errors);

    return { success: result.success, errors };
}
