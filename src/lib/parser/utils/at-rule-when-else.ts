import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { type AstArena, TokenField } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { trimArray } from "../../validation/match.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { parseMediaqueryList } from "./at-rule-media.ts";
import { parseAtRuleSupportSyntax } from "./at-rule-support.ts";

export function matchAtRuleWhenElseSyntax(
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
    // let scope: Set<EnumToken> = new Set();
    const errors: ErrorDescription[] = [];
    // const scopes: Array<Set<EnumToken>> = [scope];

    for (; i < stream.length; i++) {
        tokens.push(stream[i]);

        if (expectAndOr) {
            let k: number = i;
            while (
                k < stream.length &&
                (arena.dataTypes[stream[k]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[k]] === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[k]);
                k++;
            }

            expectAndOr = false;
        }

        switch (arena.dataTypes[stream[i]]) {
            case EnumToken.IdenTokenType:
                {
                    const val = arena.strings[arena.stringValue[stream[i]]].toLowerCase();

                    if ("and" === val || "or" === val) {
                        arena.dataTypes[stream[i]] = "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType;

                        // scope.add(arena.dataTypes[stream[i]]);
                        stack.push(stream[i]);
                        // break;
                    }
                }

                break;

            case EnumToken.SupportsFunctionTokenDefType:
            case EnumToken.WhenElseFunctionTokenDefType:
                {
                    let matchCount: number = 1;
                    let j: number = i + 1;
                    for (; j < stream.length; j++) {
                        if (arena.dataTypes[stream[j]] === EnumToken.EndParensTokenType) {
                            matchCount--;

                            if (matchCount === 0) {
                                break;
                            }
                        } else if (
                            arena.dataTypes[stream[j]] === EnumToken.StartParensTokenType ||
                            tokensfuncDefMap.has(arena.dataTypes[stream[j]])
                        ) {
                            matchCount++;
                        }
                    }

                    const slice = stream.slice(i, j + 1);
                    const funcName: string = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    // the function token may be converted by the sub parsers
                    const isSupportsFunction: boolean =
                        arena.dataTypes[stream[i]] === EnumToken.SupportsFunctionTokenDefType;
                    const funcType: EnumToken = tokensfuncDefMap.get(arena.dataTypes[stream[i]]) as EnumToken;
                    const parens: Token = arena.createToken(EnumToken.StartParensTokenType);

                    arena.spanLocation(parens, stream[i], stream[j]);

                    const tokenList: Token[] = [parens].concat(slice.slice(1));

                    if ("media" === funcName) {
                        const result = parseMediaqueryList(arena, tokenList, options);

                        if (!result.success) {
                            return result;
                        }
                    } else if ("supports" === funcName) {
                        const result = parseAtRuleSupportSyntax(arena, tokenList, context, options);

                        if (!result.success) {
                            return result;
                        }
                    } else if (isSupportsFunction) {
                        tokenList.splice(0, tokenList.length, ...slice);
                        const result = parseAtRuleSupportSyntax(arena, stream.slice(i, j + 1), context, options);

                        if (!result.success) {
                            return result;
                        }
                    }

                    arena.spanLocation(stream[i], stream[i], stream[j]);

                    const chi: Token[] = isSupportsFunction
                        ? arena.firstToken[stream[i]] != 0
                            ? arena.tokens(stream[i])
                            : trimArray(arena, slice.slice(1, -1))
                        : arena.tokens(tokenList[0]);

                    arena.dataTypes[stream[i]] = funcType;
                    arena.setTokenList(stream[i], chi);

                    if (
                        stack.length > 0 &&
                        (arena.dataTypes[stack[stack.length - 1]] === EnumToken.AndTokenType ||
                            arena.dataTypes[stack[stack.length - 1]] === EnumToken.OrTokenType)
                    ) {
                        const op: Token = stack[stack.length - 1];
                        const index: number = tokens.indexOf(op);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack[stack.length - 2]) + 1 : 0;
                        const condition: Token = arena.createToken(EnumToken.WhenElseQueryConditionTokenType);

                        arena.setField(condition, TokenField.L, ...trimArray(arena, tokens.slice(index2, index)));
                        arena.setField(condition, TokenField.R, ...trimArray(arena, tokens.slice(index + 1)));
                        arena.setField(condition, TokenField.Op, op);
                        arena.spanLocation(condition, op, stream[i]);

                        tokens[index2] = condition;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }

                    i = j;
                    expectAndOr = true;
                }

                break;

            default:
                break;
        }
    }

    stream.length = 0;

    for (const token of trimArray(arena, tokens)) {
        stream.push(token);
    }

    return { success, errors };
}
