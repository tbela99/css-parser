import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { parseMediaqueryList } from "./at-rule-media.ts";
import { parseAtRuleSupportSyntax } from "./at-rule-support.ts";

export function matchAtRuleImportSyntax(
    arena: AstArena,
    atRule: Token,
    stream: Token[],
    options: ParserOptions,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    let success: boolean = true;
    let index: number = 0;
    let i: number = 0;
    let matchCount: number;
    const errors: ErrorDescription[] = [];
    const tokens: Token[] = [];
    const stack: Token[] = [];

    const prelude = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@import")!
        .getPreludeRules()!
        .slice(1) as ValidationToken[];

    trimArray(arena, stream);

    // <string> | <url>
    if (arena.dataTypes[stream[index]] === EnumToken.StringTokenType) {
        tokens.push(stream[index++]);
    } else if (arena.dataTypes[stream[index]] === EnumToken.UrlFunctionTokenDefType) {
        // match ending ')'

        let matchCount = 0;
        let k = 0;

        for (; k < stream.length; k++) {
            if (arena.dataTypes[stream[k]] === EnumToken.EndParensTokenType) {
                matchCount--;
            } else if (arena.dataTypes[stream[k]] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[stream[k]])) {
                matchCount++;
            }

            if (matchCount === 0) {
                break;
            }
        }

        const slice: Token[] = stream.slice(index + 1, k);

        arena.spanLocation(stream[0], stream[0], stream[1]);
        arena.dataTypes[stream[0]] = tokensfuncDefMap.get(arena.dataTypes[stream[0]]) as EnumToken;
        arena.setTokenList(stream[0], trimArray(arena, slice));
        tokens.push(stream[0]);

        index = k + 1;
    } else {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "Expected string or url()",
                    syntax: "@import",
                    node: stream[0],
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[0]))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[0]))],
                } as ErrorDescription,
            ],
        };
    }

    while (
        index + 1 < prelude.length &&
        (arena.dataTypes[stream[index]] == EnumToken.WhitespaceTokenType || arena.dataTypes[stream[index]] == EnumToken.CommentTokenType)
    ) {
        tokens.push(stream[index++]);
    }

    // layer | layer(<layer-name>)
    if (
        arena.dataTypes[stream[index]] === EnumToken.IdenTokenType &&
        "layer".localeCompare(arena.strings[arena.stringValue[stream[index]]]) === 0
    ) {
        tokens.push(stream[index++]);
    } else if (
        tokensfuncDefMap.has(arena.dataTypes[stream[index]]) &&
        "layer".localeCompare(arena.strings[arena.stringValue[stream[index]]]) === 0
    ) {
        stack.push(stream[index]);
        tokens.push(stream[index++]);

        // <layer-name">
        if (arena.dataTypes[stream[index]] === EnumToken.EndParensTokenType) {
            tokens.splice(index, 1);

            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `Expected <layer-name>`,
                        syntax: "@import",
                        node: stream[index],
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[index]))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[index]))],
                    } as ErrorDescription,
                ],
            };
        } else if (arena.dataTypes[stream[index]] === EnumToken.IdenTokenType) {
            tokens.push(stream[index++]);

            while (arena.dataTypes[stream[index]] == EnumToken.ClassSelectorTokenType) {
                tokens.push(stream[index++]);
            }

            i = tokens.indexOf(stack[stack.length - 1]);
            tokens.splice(index, 1);

            arena.dataTypes[stack[stack.length - 1]] = EnumToken.FunctionTokenType;
            arena.setTokenList(stack[stack.length - 1], trimArray(arena, tokens.splice(i + 1, index++ - i - 1)));

            stack.pop();
        } else {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `Expected <layer-name>`,
                        syntax: "@import",
                        node: stream[index],
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[index]))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[index]))],
                    } as ErrorDescription,
                ],
            };
        }
    }

    while (arena.dataTypes[stream[index]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[index]] === EnumToken.CommentTokenType) {
        tokens.push(stream[index++]);
    }

    // supports([ <supports-condition> | <declaration> ])
    if (
        index < stream.length &&
        tokensfuncDefMap.has(arena.dataTypes[stream[index]]) &&
        "supports".localeCompare(arena.strings[arena.stringValue[stream[index]]]) === 0
    ) {
        stack.push(stream[index]);
        tokens.push(stream[index++]);

        matchCount = 1;

        // <supports-condition>
        // else {
        // match the next ')'
        while (index < stream.length && matchCount > 0) {
            if (arena.dataTypes[stream[index]] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[stream[index]])) {
                matchCount++;
            } else if (arena.dataTypes[stream[index]] === EnumToken.EndParensTokenType) {
                matchCount--;
                if (matchCount === 0) {
                    tokens.splice(index, 1);
                    i = tokens.indexOf(stack[stack.length - 1]);

                    arena.dataTypes[stack[stack.length - 1]] = tokensfuncDefMap.get(
                        arena.dataTypes[stack[stack.length - 1]],
                    ) as EnumToken;
                    arena.setTokenList(stack[stack.length - 1], trimArray(arena, tokens.splice(i + 1, index++ - i - 1)));

                    stack.pop();

                    break;
                }
            }

            tokens.push(stream[index++]);
        }

        // support() is the last item in tokens array
        {
            const supports: Token = tokens[tokens.length - 1];
            const chi: Token[] = arena.tokens(supports);
            const result = parseAtRuleSupportSyntax(arena, chi, atRule, options);

            arena.setTokenList(supports, chi);

            if (!result.success && result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }

                return {
                    success: false,
                    errors,
                };
            }
        }
    }

    const splice = stream.splice(index, stream.length - index);
    const sliced = parseMediaqueryList(arena, splice, options);

    for (const sp of splice) {
        tokens.push(sp);
    }

    if (sliced.errors.length > 0) {
        for (const error of sliced.errors) {
            errors.push(error);
        }
    }

    if (!sliced.success) {
        success = false;
    }

    stream.length = 0;

    for (const token of trimArray(arena, tokens)) {
        stream.push(token);
    }

    return {
        success,
        errors,
    };
}
