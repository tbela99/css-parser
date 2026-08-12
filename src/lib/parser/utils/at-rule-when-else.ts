import type {
    SourceLocation,
    AstAtRule,
    AtRuleToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    ParensToken,
    ParserOptions,
    Token,
    WhenElseQueryConditionToken,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { trimArray } from "../../validation/match.ts";
import { LOC, tokensfuncDefMap } from "../../syntax/constants.ts";
import { parseMediaqueryList } from "./at-rule-media.ts";
import { parseAtRuleSupportSyntax } from "./at-rule-support.ts";

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
    // const scopes: Array<Set<EnumToken>> = [scope];


    for (; i < stream.length; i++) {
        tokens.push(stream[i]);


        if (expectAndOr) {
            let k: number = i;
            while (
                k < stream.length &&
                (stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[k]);
                k++;
            }


            expectAndOr = false;
        }

        switch (stream[i].typ) {

            case EnumToken.IdenTokenType:
                {
                    const val = (stream[i] as IdentToken).val.toLowerCase();
                    

                    if ("and" === val || "or" === val) {
                        Object.assign(stream[i], {
                            typ: "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType,
                        });

                        scope.add(stream[i].typ);
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
                        {
                            typ: EnumToken.StartParensTokenType,
                            [LOC]: { ...stream[i][LOC], end:stream[j]?.[LOC]?.end  },
                        },
                        // @ts-expect-error
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
                    }
                    // else {
                    //     errors.push({
                    //         action: "ignore",
                    //         message: `unknown <boolean-condition> function '${funcName}' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                    //         node: stream[i],
                    //         location: stream[i][LOC],
                    //     });
                    // }

                    stream[i][LOC] = { ...stream[i][LOC], end: stream[j]?.[LOC]?.end  } as SourceLocation;

                    Object.assign(stream[i], {
                        typ: tokensfuncDefMap.get(stream[i].typ)!,
                        chi:
                            stream[i].typ === EnumToken.SupportsFunctionTokenDefType
                                ? trimArray(slice.slice(1, -1))
                                : (tokenList[0] as ParensToken).chi,
                    });

                    // if (stack.at(-1)?.typ === EnumToken.NotTokenType || stack.at(-1)?.typ === EnumToken.OnlyTokenType) {
                    //     const index: number = tokens.indexOf(stack.at(-1)!);
                    //     tokens[index] = {
                    //         typ: EnumToken.WhenElseUnaryConditionTokenType,
                    //         l: stack.at(-1)!,
                    //         r: trimArray(tokens.slice(index + 1)),
                    //         [LOC]: { ...stack.at(-1)![LOC], end: { ...stream[i]?.[LOC]?.end } },
                    //     } as WhenElseUnaryConditionToken;
                    //     tokens.length = index + 1;
                    //     stack.pop();
                    // }

                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack.at(-2)!) + 1 : 0;

                        tokens[index2] = {
                            typ: EnumToken.WhenElseQueryConditionTokenType,
                            op: stack.at(-1)!,
                            l: trimArray(tokens.slice(index2, index)),
                            r: trimArray(tokens.slice(index + 1)),
                            [LOC]: { ...stack.at(-1)![LOC], end: stream[i]?.[LOC]?.end },
                        } as WhenElseQueryConditionToken;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }

                    i = j;
                    expectAndOr = true;
                }

                break;

            default:
                // if (tokensfuncDefMap.has(stream[i].typ)) {
                //     stack.push(stream[i]);
                //     expectAndOr = true;
                // }

                break;
        }
    }

    // if (stack.length > 0) {
    //     return {
    //         success: false,
    //         errors: [
    //             {
    //                 action: "drop",
    //                 node: stack.at(-1),
    //                 message: `unmatched token '${renderValue(stack.at(-1) as Token)}' at ${stack.at(-1)![LOC]!.src}:${
    //                     stack.at(-1)![LOC]!.sta.lin
    //                 }:${stack.at(-1)![LOC]!.sta.col}`,
    //             },
    //         ],
    //     };
    // }

    stream.length = 0;
    stream.push(...trimArray(tokens));

    return { success, errors };
}
