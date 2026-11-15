import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { pseudoElements, tokensfuncDefMap } from "../../syntax/constants.ts";
import { getParsedSyntax, getSyntaxConfig } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken, ValidationToken } from "../../validation/parser/types.d.ts";
import { parseDeclaration } from "./declaration.ts";
import { type AstArena, TokenField } from "../../ast/arena.ts";

export function parseAtRuleSupportSyntax(
    arena: AstArena,
    stream: Token[],
    context: Token,
    options: ParserOptions = {},
): { success: boolean; errors: ErrorDescription[] } {
    const tokens: Token[] = [];
    const stack: Token[] = [];

    let i: number = 0;
    let success: boolean = true;
    let expectAndOr: boolean = false;
    let scope: Set<EnumToken> = new Set();
    let val: string;
    const errors: ErrorDescription[] = [];
    const scopes: Array<Set<EnumToken>> = [scope];
    const trimWhiteSpace: Set<EnumToken> = new Set([
        EnumToken.GtTokenType,
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
        EnumToken.ColumnCombinatorTokenType,
        EnumToken.UniversalSelectorTokenType,
    ]);

    for (; i < stream.length; i++) {
        tokens.push(stream[i]);

        if (arena.dataTypes[stream[i]] === EnumToken.ColonTokenType) {
            if (arena.dataTypes[stream[i + 1]] === EnumToken.IdenTokenType) {
                const val: string = arena.strings[arena.stringValue[stream[i + 1]]];
                arena.dataTypes[stream[i]] = pseudoElements.includes(val)
                    ? EnumToken.PseudoElementTokenType
                    : EnumToken.PseudoClassTokenType;
                // inlined: arena.setStr(stream[i], ":" + val)
                arena.stringValue[stream[i]] = arena.internString(":" + val);

                // inlined: arena.setSpanEnd(stream[i], arena.getSpanEnd(stream[i + 1]))
                arena.setSpan(
                    stream[i],
                    arena.getSourceId(stream[i]),
                    arena.getSpanStart(stream[i]),
                    arena.getSpanEnd(stream[i + 1]),
                );
                stream.splice(i + 1, 1);
                continue;
            }

            if (arena.dataTypes[stream[i + 1]] === EnumToken.FunctionTokenDefType) {
                val = ":" + arena.strings[arena.stringValue[stream[i + 1]]];

                arena.dataTypes[stream[i]] =
                    val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : arena.dataTypes[stream[i + 1]];
                // inlined: arena.setStr(stream[i], val)
                arena.stringValue[stream[i]] = arena.internString(val);

                stack.push(stream[i]);
                // inlined: arena.setSpanEnd(stream[i], arena.getSpanEnd(stream[i + 1]))
                arena.setSpan(
                    stream[i],
                    arena.getSourceId(stream[i]),
                    arena.getSpanStart(stream[i]),
                    arena.getSpanEnd(stream[i + 1]),
                );
                stream.splice(i + 1, 1);
                continue;
            }
        }

        if (trimWhiteSpace.has(arena.dataTypes[stream[i]])) {
            // inlined: arena.typeOf(tokens.at(-2))
            if (arena.dataTypes[tokens.at(-2) as number] === EnumToken.WhitespaceTokenType) {
                tokens.splice(tokens.length - 2, 1);
            }

            if (arena.dataTypes[stream[i + 1]] === EnumToken.WhitespaceTokenType) {
                i++;
                continue;
            }
        }

        if (expectAndOr) {
            let k: number = i;
            while (
                k < stream.length &&
                (arena.dataTypes[stream[k]] === EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[stream[k]] === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[k]);
                k++;
            }

            expectAndOr = false;
        }

        if (
            arena.dataTypes[stream[i]] === EnumToken.StartParensTokenType ||
            tokensfuncDefMap.has(arena.dataTypes[stream[i]])
        ) {
            scopes.push((scope = new Set<EnumToken>()));
            stack.push(stream[i]);
            continue;
        }

        switch (arena.dataTypes[stream[i]]) {
            case EnumToken.EndParensTokenType:
                {
                    if (arena.dataTypes[stack[stack.length - 1]] === EnumToken.ColonTokenType) {
                        // match declaration
                        const index: number = tokens.indexOf(stack[stack.length - 2]);
                        const slice: Token[] = trimArray(arena, tokens.splice(index + 1, tokens.length - index - 2));
                        const declaration: Token = parseDeclaration(
                            arena,
                            slice,
                            context,
                            { ...options, validation: false },
                            errors,
                        );

                        tokens.splice(index + 1, 0, declaration);
                        stack.pop();
                    }

                    // match <support-condition-name>
                    // @supports (--condition-name) {}
                    // inlined: arena.typeOf(stack.at(-1))
                    if (arena.dataTypes[stack.at(-1) as number] === EnumToken.StartParensTokenType) {
                        const parens: Token = stack[stack.length - 1];
                        const index: number = tokens.indexOf(parens);
                        const slice: Token[] = trimArray(arena, tokens.splice(index + 1, tokens.length - index - 2));

                        arena.dataTypes[parens] = EnumToken.ParensTokenType;
                        arena.setTokenList(parens, slice);
                        arena.spanLocation(parens, parens, stream[i]);

                        stack.pop();
                        tokens.pop();

                        scopes.pop();
                        scope = scopes[scopes.length - 1];

                        expectAndOr = true;
                    } else if (stack.length > 0 && tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]])) {
                        const func: Token = stack[stack.length - 1];
                        const index: number = tokens.indexOf(func);

                        arena.dataTypes[func] = tokensfuncDefMap.get(arena.dataTypes[func])!;
                        arena.setTokenList(func, trimArray(arena, tokens.splice(index + 1, tokens.length - index - 2)));
                        arena.spanLocation(func, func, stream[i]);

                        if (arena.dataTypes[tokens[index]] === EnumToken.PseudoClassFuncTokenType) {
                            // not a declaration
                            const result = matchAllSyntaxes(
                                arena,
                                (
                                    getParsedSyntax(
                                        ValidationSyntaxGroupEnum.Selectors,
                                        arena.strings[arena.stringValue[tokens[index]]] + "()",
                                    ) as ValidationFunctionToken[]
                                )?.[0]?.chi as ValidationToken[],
                                createValidationContext(arena, arena.tokens(tokens[index])),
                                options,
                            );

                            if (!result.success) {
                                return {
                                    success: false,
                                    errors: result.errors,
                                };
                            }

                            stack.pop();
                            tokens.pop();
                            break;
                        }

                        //
                        let k: number = stack.length - 1;

                        while (tokensfuncDefMap.has(arena.dataTypes[stack[k]])) {
                            k--;
                        }

                        stack.pop();
                        tokens.pop();

                        scopes.pop();
                        scope = scopes[scopes.length - 1];
                    }

                    // inlined: arena.typeOf(stack.at(-1))
                    if (arena.dataTypes[stack.at(-1) as number] === EnumToken.NotTokenType) {
                        const not: Token = stack[stack.length - 1];
                        const index: number = tokens.indexOf(not);
                        const unary: Token = arena.createToken(EnumToken.SupportsQueryUnaryConditionTokenType);

                        // inlined: arena.setField(unary, TokenField.R, ...trimArray(arena, tokens.splice(index + 1, i - index - 1)))
                        arena.setTokenList(
                            arena.fieldList(unary, TokenField.R),
                            trimArray(arena, tokens.splice(index + 1, i - index - 1)),
                        );
                        // inlined: arena.setField(unary, TokenField.L, not)
                        arena.setTokenList(arena.fieldList(unary, TokenField.L), [not]);
                        arena.spanLocation(unary, not, stream[i]);
                        tokens[index] = unary;

                        stack.pop();
                    }

                    // inlined: arena.typeOf(stack.at(-1))
                    if (
                        arena.dataTypes[stack.at(-1) as number] === EnumToken.AndTokenType ||
                        arena.dataTypes[stack.at(-1) as number] === EnumToken.OrTokenType
                    ) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack.at(-2)!) + 1 : 0;

                        const op: Token = stack[stack.length - 1];
                        const left: Token[] = trimArray(arena, tokens.slice(index2, index));
                        const condition: Token = arena.createToken(EnumToken.SupportsQueryConditionTokenType);

                        // inlined: arena.setField(condition, TokenField.L, ...left)
                        arena.setTokenList(arena.fieldList(condition, TokenField.L), left);
                        // inlined: arena.setField(condition, TokenField.R, ...trimArray(arena, tokens.slice(index + 1)))
                        arena.setTokenList(
                            arena.fieldList(condition, TokenField.R),
                            trimArray(arena, tokens.slice(index + 1)),
                        );
                        // inlined: arena.setField(condition, TokenField.Op, op)
                        arena.setTokenList(arena.fieldList(condition, TokenField.Op), [op]);
                        arena.spanLocation(condition, op, stream[i]);
                        tokens[index2] = condition;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }
                }

                break;

            case EnumToken.ColonTokenType:
                stack.push(stream[i]);
                break;

            case EnumToken.IdenTokenType:
                {
                    const val = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    if ("not" === val) {
                        stack.push(stream[i]);
                        arena.dataTypes[stream[i]] = EnumToken.NotTokenType;
                        break;
                    }

                    if ("and" === val || "or" === val) {
                        if ("or" === val && scopes.length === 1 && scopes[0].size > 0) {
                            // inlined: options.source!.getFileName()
                            const fileName = options.source!.file ?? "";
                            // inlined: options.source!.getOffsets(arena.getSpanStart(stream[i]))
                            const [line, column] = options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]));
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `<or> is not allowed outside of a parenthesis at ${fileName}:${line}:${column}`,
                                        location: [fileName, line, column],
                                    },
                                ],
                            };
                        }

                        arena.dataTypes[stream[i]] = "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType;

                        scope.add(arena.dataTypes[stream[i]]);
                        stack.push(stream[i]);
                        break;
                    }
                }

                break;
        }
    }

    stream.length = 0;

    for (const token of trimArray(arena, tokens)) {
        stream.push(token);
    }

    return { success, errors };
}
