import type {
    AstAtRule,
    AstRule,
    AstStyleSheet,
    AtRuleToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    ParensToken,
    ParserOptions,
    SupportsQueryConditionToken,
    SupportsQueryUnaryConditionToken,
    Token,
    WhenElseQueryConditionToken,
    WhenElseUnaryConditionToken,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { renderToken } from "../../renderer/render.ts";
import { trimArray } from "../../validation/match.ts";
import { definedPropertySettings, tokensfuncDefMap, tokensfuncSet } from "../../syntax/constants.ts";
import { parseMediaqueryList } from "./at-rule-media.ts";
import { parseAtRuleSupportSyntax } from "./at-rule-support.ts";

const validChildTypes: Set<EnumToken> = new Set([
    EnumToken.WhenElseFunctionTokenDefType,
    EnumToken.WhenElseFunctionTokenType,
    EnumToken.WhenElseQueryConditionTokenType,
    EnumToken.WhenElseUnaryConditionTokenType,
]);

export function matchAtRuleWhenElseSyntax(
    stream: Token[],
    context: AstAtRule | AtRuleToken,
    options: ParserOptions = {},
): { success: boolean; errors: ErrorDescription[] } {
    const tokens: Token[] = [];
    const stack: Token[] = [];

    let i: number = 0;
    let success: boolean = true;
    let expectAndOr: boolean = false;
    let scope: Set<EnumToken> = new Set();
    const errors: ErrorDescription[] = [];
    const scopes: Array<Set<EnumToken>> = [scope];

    while (
        i < stream.length &&
        (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)
    ) {
        tokens.push(stream[i]);
        i++;
    }

    if (i >= stream.length) {
        success = "else" === context.nam;
        return {
            success,
            errors: success
                ? []
                : [
                      {
                          action: "drop",
                          node: stream[i],
                          location: stream[i]?.loc,
                          message: `expecting '<boolean-condition>' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                      },
                  ],
        };
    }

    if (
        stream[i]?.typ !== EnumToken.WhenElseFunctionTokenDefType &&
        stream[i]?.typ !== EnumToken.SupportsFunctionTokenDefType &&
        stream[i]?.typ !== EnumToken.StartParensTokenType &&
        !(
            stream[i]?.typ === EnumToken.IdenTokenType &&
            ["not", "only"].includes((stream[i] as IdentToken)?.val.toLocaleLowerCase())
        )
    ) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    node: stream[i],
                    location: stream[i]?.loc,
                    message: `expecting '<boolean-condition>' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                },
            ],
        };
    }

    for (; i < stream.length; i++) {
        tokens.push(stream[i]);

        if (stream[i].typ === EnumToken.StartParensTokenType) {
            stack.push(stream[i]);
            scopes.push((scope = new Set()));
            continue;
        }

        if (expectAndOr) {
            let k: number = i;
            while (
                k < stream.length &&
                (stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[k]);
                k++;
            }

            if (k < stream.length) {
                if (
                    stream[k].typ !== EnumToken.EndParensTokenType &&
                    !(
                        stream[k].typ === EnumToken.IdenTokenType &&
                        ("and" === (stream[k] as IdentToken).val.toLocaleLowerCase() ||
                            "or" === (stream[k] as IdentToken).val.toLocaleLowerCase())
                    )
                ) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                node: stream[k],
                                message: `expecting 'and' or 'or' at ${stream[k]?.loc?.src}:${stream[k]?.loc?.sta.lin}:${stream[k]?.loc?.sta.col}`,
                                location: stream[k].loc,
                            },
                        ],
                    };
                }
            }

            expectAndOr = false;
        }

        switch (stream[i].typ) {
            case EnumToken.EndParensTokenType:
                {
                    if (stack.length === 0) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    node: stream[i],
                                    message: `unmatched ')' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                },
                            ],
                        };
                    }

                    if (stack.at(-1)?.typ === EnumToken.StartParensTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const slice: Token[] = trimArray(tokens.splice(index + 1, tokens.length - index - 2));

                        const filtered: Token[] = slice.filter((token) => {
                            return (
                                token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType
                            );
                        });

                        if (
                            filtered.length !== 1 ||
                            !(
                                validChildTypes.has(filtered[0].typ) ||
                                tokensfuncDefMap.has(filtered[0].typ) ||
                                tokensfuncSet.has(filtered[0].typ)
                            )
                        ) {
                            const token = filtered[0] ?? slice[0] ?? stream[i];
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: token,
                                        location: token.loc,
                                        message: `expecting '<boolean-condition"}>' at ${token?.loc?.src}:${token?.loc?.sta.lin}:${token?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        tokens[index] = Object.defineProperty(
                            {
                                typ: EnumToken.ParensTokenType,
                                chi: slice,
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        );

                        stack.pop();
                        tokens.pop();
                        scopes.pop();
                        scope = scopes[scopes.length - 1];

                        expectAndOr = true;
                    }

                    if (stack.at(-1)?.typ === EnumToken.NotTokenType || stack.at(-1)?.typ === EnumToken.OnlyTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        tokens[index] = Object.defineProperty(
                            {
                                typ: EnumToken.SupportsQueryUnaryConditionTokenType,
                                l: stack.at(-1),
                                r: trimArray(tokens.splice(index + 1, i - index - 1)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as SupportsQueryUnaryConditionToken;

                        stack.pop();
                    }

                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        //

                        if (stack.length > 1 && stack.at(-2)?.typ !== EnumToken.StartParensTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stack.at(-2),
                                        message: `expecting '(' at ${stack.at(-2)?.loc?.src}:${stack.at(-2)?.loc?.sta.lin}:${stack.at(-2)?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack.at(-2)!) + 1 : 0;

                        const left: Token[] = trimArray(tokens.slice(index2, index));
                        const notToken = left.find(
                            (t) =>
                                t.typ === EnumToken.SupportsQueryUnaryConditionTokenType &&
                                (t as SupportsQueryUnaryConditionToken).l.typ === EnumToken.NotTokenType,
                        );

                        if (notToken != null) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stack.at(-1),
                                        message: `unexpected token after 'not' expression at ${stack.at(-1)?.loc?.src}:${stack.at(-1)?.loc?.sta.lin}:${stack.at(-1)?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        tokens[index2] = Object.defineProperty(
                            {
                                typ: EnumToken.SupportsQueryConditionTokenType,
                                op: stack.at(-1)!,
                                l: left,
                                r: trimArray(tokens.slice(index + 1)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as SupportsQueryConditionToken;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }
                }

                break;

            case EnumToken.IdenTokenType:
                {
                    const val = (stream[i] as IdentToken).val.toLocaleLowerCase();
                    if ("not" === val || "only" === val) {
                        stack.push(stream[i]);
                        Object.assign(stream[i], {
                            typ: "only" === val ? EnumToken.OnlyTokenType : EnumToken.NotTokenType,
                        });
                        break;
                    }

                    if ("and" === val || "or" === val) {
                        if (scope.has("or" === val ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `mixing <and> and <or> at the same level is not allowed at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        if ("or" === val && scopes.length === 1) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `<or> is not allowed outside of a parenthesis at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        Object.assign(stream[i], {
                            typ: "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType,
                        });

                        scope.add(stream[i].typ);
                        stack.push(stream[i]);
                        break;
                    }
                }

                break;

            case EnumToken.SupportsFunctionTokenDefType:
            case EnumToken.WhenElseFunctionTokenDefType:
                {
                    let matchCount: number = 1;
                    let j: number = i + 1;
                    for (; j < stream.length; j++) {
                        if (stream[j].typ === EnumToken.EndParensTokenType) {
                            matchCount--;

                            if (matchCount === 0) {
                                break;
                            }
                        } else if (
                            stream[j].typ === EnumToken.StartParensTokenType ||
                            tokensfuncDefMap.has(stream[j].typ)
                        ) {
                            matchCount++;
                        }
                    }

                    const slice = stream.slice(i, j + 1);
                    const funcName: string = (stream[i] as FunctionToken).val.toLowerCase();
                    const tokenList = [
                        Object.defineProperty({ typ: EnumToken.StartParensTokenType }, "loc", {
                            ...definedPropertySettings,
                            value: { ...stream[i].loc, end: { ...stream[j]?.loc?.end } },
                        }),
                    ].concat(slice.slice(1)) as Token[];

                    if ("media" === funcName) {
                        const result = parseMediaqueryList(tokenList, options);

                        if (!result.success) {
                            return result;
                        }
                    } else if ("supports" === funcName) {
                        const result = parseAtRuleSupportSyntax(tokenList, context, options);

                        if (!result.success) {
                            return result;
                        }
                    } else if (stream[i].typ === EnumToken.SupportsFunctionTokenDefType) {
                        tokenList.splice(0, tokenList.length, ...slice);
                        const result = parseAtRuleSupportSyntax(stream.slice(i, j + 1), context, options);

                        if (!result.success) {
                            return result;
                        }
                    } else {
                        errors.push({
                            action: "ignore",
                            message: `unknown <boolean-condition> function '${funcName}' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                            node: stream[i],
                            location: stream[i].loc,
                        });
                    }

                    Object.defineProperty(
                        Object.assign(stream[i], {
                            typ: tokensfuncDefMap.get(stream[i].typ)!,
                            chi:
                                stream[i].typ === EnumToken.SupportsFunctionTokenDefType
                                    ? trimArray(slice.slice(1, -1))
                                    : (tokenList[0] as ParensToken).chi,
                        }),
                        "loc",
                        {
                            ...definedPropertySettings,
                            value: { ...stream[i].loc, end: { ...stream[j]?.loc?.end } },
                        },
                    );

                    if (stack.at(-1)?.typ === EnumToken.NotTokenType || stack.at(-1)?.typ === EnumToken.OnlyTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        tokens[index] = Object.defineProperty(
                            {
                                typ: EnumToken.WhenElseUnaryConditionTokenType,
                                l: stack.at(-1)!,
                                r: trimArray(tokens.slice(index + 1)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as WhenElseUnaryConditionToken;
                        tokens.length = index + 1;
                        stack.pop();
                    }

                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack.at(-2)!) + 1 : 0;

                        tokens[index2] = Object.defineProperty(
                            {
                                typ: EnumToken.WhenElseQueryConditionTokenType,
                                op: stack.at(-1)!,
                                l: trimArray(tokens.slice(index2, index)),
                                r: trimArray(tokens.slice(index + 1)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as WhenElseQueryConditionToken;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }

                    i = j;
                    expectAndOr = true;
                }

                break;

            default:
                if (tokensfuncDefMap.has(stream[i].typ)) {
                    stack.push(stream[i]);
                    expectAndOr = true;
                }

                break;
        }
    }

    if (stack.length > 0) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    node: stack.at(-1),
                    message: `unmatched token '${renderToken(stack.at(-1) as Token)}' at ${stack.at(-1)!.loc!.src}:${
                        stack.at(-1)!.loc!.sta.lin
                    }:${stack.at(-1)!.loc!.sta.col}`,
                },
            ],
        };
    }

    stream.length = 0;
    stream.push(...trimArray(tokens));

    return { success, errors };
}
