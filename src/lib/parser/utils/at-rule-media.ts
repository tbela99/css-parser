import type {
    DashedIdentToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    MediaQueryConditionToken,
    MediaRangeQueryToken,
    NumberToken,
    ParserOptions,
    Token,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { evaluate } from "../../ast/math/expression.ts";
import { gcd } from "../../ast/math/math.ts";
import { LOC, mediaTypes, mFGT, mFLT } from "../../syntax/constants.ts";

import { createValidationContext, getMFInfo, isMFValue, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken } from "../../validation/parser/types.d.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { getParsedSyntax } from "../../validation/config.ts";

// https://drafts.csswg.org/mediaqueries/#media-descriptor-table:~:text=It%20is%20invalid%20to%20mix%20and%20and%20or%20and%20not%20at%20the%20same%20%E2%80%9Clevel%E2%80%9D%20of%20a%20media%20query%2E
// 'or' is not allowed at the same level as 'and' and 'not'
// 'or' is not allowed outside of parentheses
// https://drafts.csswg.org/mediaqueries/#error-handling
// error recovery

export function parseMediaqueryList(
    stream: Token[],
    options: ParserOptions,
): {
    errors: ErrorDescription[];
    success: boolean;
} {
    let matchCount: number = 0;
    const errors: ErrorDescription[] = [];
    let hasErrors: boolean = false;
    const parts = stream.reduce(
        (acc, t) => {
            if (t.typ === EnumToken.CommaTokenType && matchCount === 0) {
                acc.push([]);
            } else {
                acc[acc.length - 1].push(t);

                if (t.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(t.typ)) {
                    matchCount++;
                } else if (t.typ === EnumToken.EndParensTokenType) {
                    if (matchCount > 0) {
                        matchCount--;
                    }
                }
            }

            return acc;
        },
        [[]] as Token[][],
    );

    {
        for (const stream of parts.slice()) {
            let success: boolean = true;
            let i: number;
            let currentScope: Set<EnumToken> = new Set();
            const scopes: Array<Set<EnumToken>> = [currentScope];
            const stack: Token[] = [];
            const tokens: Token[] = [];
            let expectAndOrComma: boolean = false;

            i = 0;

            while (
                i < stream.length &&
                (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[i]);
                i++;
            }

            // [not | only] <media-type> [ and <media-condition-without-or>  ]?
            if (i < stream.length) {
                if (stream[i].typ === EnumToken.IdenTokenType) {
                    const val = (stream[i] as IdentToken).val.toLowerCase();

                    // if ("not" === val || "only" === val) {
                    //     tokens.push(stream[i]);
                    //     stack.push(stream[i]);
                    //     i++;

                    //     while (
                    //         i < stream.length &&
                    //         (stream[i]?.typ === EnumToken.WhitespaceTokenType ||
                    //             stream[i]?.typ === EnumToken.CommentTokenType)
                    //     ) {
                    //         tokens.push(stream[i]);
                    //         i++;
                    //     }

                    //     if (
                    //         stream[i]?.typ !== EnumToken.IdenTokenType ||
                    //         !mediaTypes.includes((stream[i] as IdentToken).val.toLowerCase())
                    //     ) {
                    //         errors.push({
                    //             action: "drop",
                    //             node: stream[i],
                    //             message: `expecting '<media-type>' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                    //         });
                    //         continue;
                    //     }

                    //     const index: number = tokens.indexOf(stack[stack.length - 1]);

                    //     tokens[index][LOC] = { ...tokens[index][LOC]!, end: stream[i][LOC]!.end };
                    //     tokens[index] = Object.assign(tokens[index], {
                    //         typ: val === "not" ? EnumToken.NotTokenType : EnumToken.OnlyTokenType,
                    //         val: stream[i],
                    //     });

                    //     tokens.length = index + 1;
                    //     i++;

                    //     // expect end of stream | and | or | not
                    //     while (
                    //         i < stream.length &&
                    //         (stream[i]?.typ === EnumToken.WhitespaceTokenType ||
                    //             stream[i]?.typ === EnumToken.CommentTokenType)
                    //     ) {
                    //         tokens.push(stream[i]);
                    //         i++;
                    //     }

                    //     if (i < stream.length) {
                    //         if (stream[i].typ === EnumToken.AndTokenType) {
                    //             tokens.push(Object.assign(stream[i], { typ: EnumToken.AndTokenType }));
                    //             stack.push(stream[i]);
                    //             i++;
                    //         } else if (stream[i].typ === EnumToken.OrTokenType) {
                    //             tokens.push(Object.assign(stream[i], { typ: EnumToken.OrTokenType }));
                    //             stack.push(stream[i]);
                    //             i++;
                    //         } else {
                    //             success = false;
                    //             errors.push({
                    //                 action: "drop",
                    //                 node: stream[i],
                    //                 message: `expecting 'and' or 'or' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                    //             });
                    //         }
                    //     }
                    // } else
                    if (mediaTypes.includes(val)) {
                        tokens.push(stream[i]);
                        i++;
                    } else {
                        success = false;
                        errors.push({
                            action: "drop",
                            message: `expecting '<media-type>' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                            node: stream[i],
                            location: stream[i][LOC]!,
                        });
                    }
                } else if (stream[i].typ !== EnumToken.StartParensTokenType) {
                    success = false;
                    errors.push({
                        action: "drop",
                        message: `expecting '(' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                        node: stream[i],
                        location: stream[i][LOC]!,
                    });
                }
            }

            for (; i < stream.length; i++) {
                tokens.push(stream[i]);

                if (stream[i].typ === EnumToken.WhitespaceTokenType || stream[i].typ === EnumToken.CommentTokenType) {
                    continue;
                }

                if (expectAndOrComma) {
                    let valid: boolean = true;

                    if (stream[i].typ === EnumToken.IdenTokenType) {
                        const val: string = (stream[i] as IdentToken).val.toLowerCase();
                        valid = val === "and" || val === "or";
                    } else {
                        valid = stream[i].typ !== EnumToken.CommaTokenType;
                    }

                    // if (!valid) {
                    //     success = false;
                    //     errors.push({
                    //         action: "drop",
                    //         node: stream[i],
                    //         message: `expecting <and>, <or> or comma  at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                    //     });
                    //     break;
                    // }

                    expectAndOrComma = false;
                }

                if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
                    scopes.push((currentScope = new Set()));
                    stack.push(stream[i]);
                    continue;
                }

                switch (stream[i].typ) {
                    // case EnumToken.LiteralTokenType:
                    //     if ((stream[i] as LiteralToken).val === "<") {
                    //         stack.push(Object.assign(stream[i], { typ: EnumToken.LtTokenType }));
                    //     }

                    //     if ((stream[i] as LiteralToken).val === ">") {
                    //         stack.push(Object.assign(stream[i], { typ: EnumToken.GtTokenType }));
                    //     }

                    //     break;

                    case EnumToken.ColonTokenType:
                    case EnumToken.LtTokenType:
                    case EnumToken.LteTokenType:
                    case EnumToken.GtTokenType:
                    case EnumToken.GteTokenType:
                    case EnumToken.DelimTokenType:
                        stack.push(stream[i]);
                        break;

                    case EnumToken.IdenTokenType:
                        {
                            const val: string = (stream[i] as IdentToken).val.toLowerCase();

                            // if (val === "not" || val === "only") {
                            //     Object.assign(stream[i], {
                            //         typ: val === "not" ? EnumToken.NotTokenType : EnumToken.OnlyTokenType,
                            //     });

                            //     stack.push(stream[i]);
                            // } else
                            if (val === "and" || val === "or") {
                                Object.assign(stream[i], {
                                    typ: val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType,
                                });

                                if (val === "or" && scopes.length <= 1) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `<or> is not allowed outside of parentheses ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                    });

                                    break;
                                }

                                if (currentScope.has(val === "or" ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `cannot mix <and> and <or> at the same level at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                    });
                                }

                                currentScope.add(stream[i].typ);
                                stack.push(stream[i]);
                            }
                        }

                        break;

                    case EnumToken.EndParensTokenType:
                        if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                            const index: number = tokens.indexOf(stack.at(-1)!);

                            tokens[index][LOC] = { ...tokens[index][LOC]!, end: stream[i]![LOC]!.end };
                            Object.assign(tokens[index], {
                                typ: tokensfuncDefMap.get(stack.at(-1)?.typ),
                                chi: trimArray(tokens.slice(index + 1, tokens.length - 1)),
                            });

                            tokens.length = index + 1;

                            const result: ValidationMatch = matchAllSyntaxes(
                                (
                                    getParsedSyntax(
                                        ValidationSyntaxGroupEnum.Syntaxes,
                                        (tokens[index] as FunctionToken).val + "()",
                                    ) as ValidationFunctionToken[]
                                )?.[0]?.chi as ValidationFunctionToken[],
                                createValidationContext((tokens[index] as FunctionToken).chi),
                                options,
                            );

                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1)!;

                            if (!result.success) {
                                errors.push(...result.errors);
                                success = false;
                            }

                            break;
                        }

                        // feature
                        if (mFLT.has(stack.at(-1)?.typ) || mFGT.has(stack.at(-1)?.typ)) {
                            // <mf-lt> | <mf-gt>
                            const index: number = tokens.indexOf(stack.at(-1)!);
                            const prevToken: Token = stack[stack.length - 2];

                            if (mFLT.has(prevToken?.typ) || mFGT.has(prevToken?.typ)) {
                                // if (stack[stack.length - 3]?.typ !== EnumToken.StartParensTokenType) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: stream[i],
                                //         message: `unmatched '(' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                //     });
                                //     break;
                                // }

                                // if (!mFLT.has(stack.at(-1)?.typ) && mFLT.has(prevToken?.typ)) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: stack.at(-1),
                                //         message: `expected <mf-lt> at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
                                //     });

                                //     break;
                                // } else if (!mFGT.has(stack.at(-1)?.typ) && mFGT.has(prevToken?.typ)) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: stream[i],
                                //         message: `expected <mf-gt> at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
                                //     });

                                //     break;
                                // }

                                // const index: number = tokens.indexOf(stack.at(-1)!);
                                // <mf-lt> | <mf-name>
                                const index2: number = tokens.indexOf(prevToken);
                                // '('
                                const index3: number = tokens.indexOf(stack.at(-3)!);

                                const left: Token[] = trimArray(tokens.slice(index3 + 1, index2));
                                const right: Token[] = trimArray(tokens.slice(index + 1, tokens.length - 1));
                                const names: Token[] = trimArray(tokens.slice(index2 + 1, index));

                                const filteredNames = names.filter(
                                    (n) =>
                                        n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType,
                                );

                                // if (filteredNames.length !== 1 || filteredNames[0].typ !== EnumToken.IdenTokenType) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: stream[i],
                                //         message: `expected <mf-name>> at ${filteredNames[0]?.[LOC]?.src}:${filteredNames[0]?.[LOC]?.sta.lin}:${filteredNames[0]?.[LOC]?.sta.col}`,
                                //     });

                                //     break;
                                // }

                                const name: string = (filteredNames[0] as IdentToken | DashedIdentToken).val;
                                const mfInfo = getMFInfo(name);

                                for (const val of [left, right]) {
                                    if (options.computeCalcExpression) {
                                        if (
                                            mfInfo == null ||
                                            (mfInfo.type != MediaFeatureType.KeywordType &&
                                                mfInfo.type != MediaFeatureType.StringType)
                                        ) {
                                            for (let l = 0; l < val.length; l++) {
                                                if (
                                                    val[l].typ === EnumToken.MathFunctionTokenType &&
                                                    (val[l] as FunctionToken).val === "calc"
                                                ) {
                                                    const value = evaluate([val[l]]);

                                                    if (value.length == 1) {
                                                        // if (mfInfo?.type === MediaFeatureType.RatioType) {
                                                        //     if (
                                                        //         value[0].typ !== EnumToken.NumberTokenType ||
                                                        //         !(
                                                        //             ((value[0] as NumberToken).val as FractionToken)
                                                        //                 ?.typ === EnumToken.FractionTokenType
                                                        //         )
                                                        //     ) {
                                                        //         continue;
                                                        //     }
                                                        // }
                                                        value[0][LOC] = val[l][LOC];
                                                        val[l] = value[0];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                let isValidMFValue = isMFValue(name, left, true);

                                // if (isValidMFValue.valid && !isValidMFValue.success) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: left[0] ?? prevToken,
                                //         message: `${isValidMFValue.isValueAllowed === false ? "invalid <mf-name>" : "expected <mf-value>"} at ${(left[0] ?? prevToken)?.[LOC]?.src}:${(left[0] ?? prevToken)?.[LOC]?.sta.lin}:${(left[0] ?? prevToken)?.[LOC]?.sta.col}`,
                                //     });

                                //     break;
                                // }

                                isValidMFValue = isMFValue(name, right, true);

                                // if (isValidMFValue.valid && !isValidMFValue.success) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: right[0] ?? stream[i],
                                //         location: (right[0] ?? stream[i])?.[LOC],
                                //         message: `${isValidMFValue.isValueAllowed === false ? "invalid <mf-name>" : "expected <mf-value>"} at ${(right[0] ?? stream[i])?.[LOC]?.src}:${(right[0] ?? stream[i])?.[LOC]?.sta.lin}:${(left[0] ?? stream[i])?.[LOC]?.sta.col}`,
                                //     });

                                //     break;
                                // }

                                for (const val of [left, right]) {
                                    if (mfInfo?.type === MediaFeatureType.RatioType) {
                                        const filteredValues = val.filter(
                                            (n) =>
                                                n.typ !== EnumToken.WhitespaceTokenType &&
                                                n.typ !== EnumToken.CommentTokenType,
                                        );

                                        if (filteredValues.length === 3) {
                                            if (options.computeCalcExpression) {
                                                const div = gcd(
                                                    (filteredValues[0] as NumberToken).val as number,
                                                    (filteredValues[2] as NumberToken).val as number,
                                                );

                                                if (div > 1) {
                                                    (filteredValues[0] as NumberToken).val =
                                                        ((filteredValues[0] as NumberToken).val as number) / div;
                                                    (filteredValues[2] as NumberToken).val =
                                                        ((filteredValues[2] as NumberToken).val as number) / div;
                                                }
                                            }

                                            val.splice(0, val.length, ...filteredValues);
                                        }
                                    }
                                }

                                tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                                    typ: EnumToken.MediaRangeQueryTokenType,
                                    l: left,
                                    val: filteredNames,
                                    op1: prevToken,
                                    op2: stack.at(-1)!,
                                    r: right,
                                    [LOC]: { ...left[0][LOC]!, end: right.at(-1)![LOC]!.end },
                                } as MediaRangeQueryToken);

                                stack.pop();
                                stack.pop();
                            }
                            // else if (stack[stack.length - 2]?.typ !== EnumToken.StartParensTokenType) {
                            //     success = false;
                            //     errors.push({
                            //         action: "drop",
                            //         node: stream[i],
                            //         location: stream[i]?.[LOC],
                            //         message: `expected '(' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                            //     });

                            //     break;
                            // }
                        }

                        if (
                            mFGT.has(stack.at(-1)?.typ) ||
                            mFLT.has(stack.at(-1)?.typ) ||
                            stack.at(-1)?.typ === EnumToken.DelimTokenType ||
                            stack.at(-1)?.typ === EnumToken.ColonTokenType
                        ) {
                            // if (stack[stack.length - 2]?.typ !== EnumToken.StartParensTokenType) {
                            //     success = false;
                            //     errors.push({
                            //         action: "drop",
                            //         node: stream[i],
                            //         location: stream[i]?.[LOC],
                            //         message: `expected '(' at ${(stack[stack.length - 2] ?? tokens[0])?.[LOC]?.src}:${(stack[stack.length - 2] ?? tokens[0])?.[LOC]?.sta.lin}:${(stack[stack.length - 2] ?? tokens[0])?.[LOC]?.sta.col}`,
                            //     });

                            //     break;
                            // }

                            const index2: number = tokens.indexOf(stack.at(-1)!);
                            const index3: number = tokens.indexOf(stack.at(-2)!);

                            let names: Token[] = trimArray(tokens.slice(index3 + 1, index2));
                            let values: Token[] = trimArray(tokens.slice(index2 + 1, tokens.length - 1));
                            let swapped: boolean = false;

                            // if (stack.at(-1)?.typ !== EnumToken.ColonTokenType) {
                            // const filteredNames = names.filter(
                            //     (n) =>
                            //         n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType,
                            // );

                            // if (
                            //     filteredNames.length !== 1 ||
                            //     (filteredNames[0].typ !== EnumToken.IdenTokenType &&
                            //         filteredNames[0].typ !== EnumToken.DashedIdenTokenType)
                            // ) {
                            //     swapped = true;
                            // }
                            // }

                            const filteredNames = (swapped ? values : names).filter(
                                (n) => n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType,
                            );

                            // if (
                            //     filteredNames.length !== 1 ||
                            //     (filteredNames[0].typ !== EnumToken.IdenTokenType &&
                            //         filteredNames[0].typ !== EnumToken.DashedIdenTokenType)
                            // ) {
                            //     success = false;
                            //     errors.push({
                            //         action: "drop",
                            //         node: names[0] ?? stack.at(-1),
                            //         location: names[0]?.[LOC],
                            //         message: `expected <mf-name> at ${(names[0] ?? stack.at(-1))?.[LOC]?.src}:${(names[0] ?? stack.at(-1))?.[LOC]?.sta.lin}:${(names[0] ?? stack.at(-1))?.[LOC]?.sta.col}`,
                            //     });

                            //     break;
                            // }

                            const name: string = (filteredNames[0] as IdentToken | DashedIdentToken).val;

                            // if (!isMFName(name)) {
                            //     success = false;
                            //     errors.push({
                            //         action: "drop",
                            //         node: names[0] ?? stack.at(-1),
                            //         location: names[0]?.[LOC] ?? stack.at(-1)?.[LOC],
                            //         message: `expected <mf-name> at ${names[0]?.[LOC]?.src}:${names[0]?.[LOC]?.sta.lin}:${names[0]?.[LOC]?.sta.col}`,
                            //     });

                            //     break;
                            // }

                            const mfInfo = getMFInfo(name);
                            if (options.computeCalcExpression) {
                                if (
                                    mfInfo == null ||
                                    (mfInfo.type != MediaFeatureType.KeywordType &&
                                        mfInfo.type != MediaFeatureType.StringType)
                                ) {
                                    const val = swapped ? names : values;

                                    for (let l = 0; l < val.length; l++) {
                                        if (
                                            val[l].typ === EnumToken.MathFunctionTokenType &&
                                            (val[l] as FunctionToken).val === "calc"
                                        ) {
                                            const value = evaluate([val[l]]);

                                            if (value.length == 1) {
                                                // if (mfInfo?.type === MediaFeatureType.RatioType) {
                                                //     if (
                                                //         value[0].typ !== EnumToken.NumberTokenType ||
                                                //         !(
                                                //             ((value[0] as NumberToken).val as FractionToken)?.typ ===
                                                //             EnumToken.FractionTokenType
                                                //         )
                                                //     ) {
                                                //         continue;
                                                //     }
                                                // }

                                                value[0][LOC] = val[l][LOC];
                                                val[l] = value[0];
                                            }
                                        }
                                    }
                                }
                            }

                            const mfValue = isMFValue(
                                name,
                                swapped ? names : values,
                                mFGT.has(stack.at(-1)?.typ) ||
                                    mFLT.has(stack.at(-1)?.typ) ||
                                    stack.at(-1)?.typ === EnumToken.DelimTokenType,
                            );

                            if (!mfValue.success) {
                                success = false;
                                const arr = swapped ? names : values;
                                errors.push({
                                    action: "drop",
                                    node: arr[0],
                                    location: arr[0]?.[LOC],
                                    message: `${mfValue.isValueAllowed === false ? "invalid <mf-name>" : "expected <mf-value>"} at ${arr[0]?.[LOC]?.src}:${arr[0]?.[LOC]?.sta.lin}:${arr[0]?.[LOC]?.sta.col}`,
                                });

                                break;
                            }

                            if (mfInfo?.type === MediaFeatureType.RatioType) {
                                const val = swapped ? names : values;

                                const filteredValues = val.filter(
                                    (n) =>
                                        n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType,
                                );

                                if (filteredValues.length === 3) {
                                    if (options.computeCalcExpression) {
                                        const div = gcd(
                                            (filteredValues[0] as NumberToken).val as number,
                                            (filteredValues[2] as NumberToken).val as number,
                                        );

                                        if (div > 1) {
                                            (filteredValues[0] as NumberToken).val =
                                                ((filteredValues[0] as NumberToken).val as number) / div;
                                            (filteredValues[2] as NumberToken).val =
                                                ((filteredValues[2] as NumberToken).val as number) / div;
                                        }
                                    }

                                    val.splice(0, val.length, ...filteredValues);
                                }
                            }

                            tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                                typ: EnumToken.MediaQueryConditionTokenType,
                                l: names,
                                op: stack.pop() as Token,
                                r: values,
                                // @ts-expect-error
                                [LOC]: { ...names[0][LOC]!, end: values.at(-1)![LOC]!.end } as Location,
                            });
                        }

                        // if (stack.length === 0) {
                        //     success = false;
                        //     errors.push({
                        //         action: "drop",
                        //         node: stream[i],
                        //         location: stream[i]?.[LOC],
                        //         message: `unmatched ')' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                        //     });

                        //     break;
                        // }

                        {
                            const index: number = tokens.indexOf(stack.at(-1)!);

                            tokens[index] = {
                                typ: EnumToken.ParensTokenType,
                                chi: tokens.slice(index + 1, tokens.length - 1),
                                // @ts-expect-error
                                [LOC]: { ...tokens[index][LOC]!, end: stream[i]![LOC]!.end } as Location,
                            };

                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1)!;
                            stack.pop();

                            // if (
                            //     stack.at(-1)?.typ === EnumToken.NotTokenType ||
                            //     stack.at(-1)?.typ === EnumToken.OnlyTokenType
                            // ) {
                            //     const index = tokens.indexOf(stack.at(-1)!);
                            //     const slice = trimArray(tokens.slice(index + 1));
                            //     tokens[index] = {
                            //         typ: EnumToken.MediaQueryUnaryFeatureTokenType,
                            //         l: stack.pop()!,
                            //         r: slice,
                            //         // @ts-expect-error
                            //         [LOC]: { ...tokens[index][LOC]!, end: slice.at(-1)![LOC]!.end } as Location,
                            //     };
                            //     tokens.length = index + 1;
                            // }

                            if (
                                stack.at(-1)?.typ === EnumToken.AndTokenType ||
                                stack.at(-1)?.typ === EnumToken.OrTokenType
                            ) {
                                const index = tokens.indexOf(stack.at(-1)!);
                                let l: number = index - 1;

                                while (
                                    l > 0 &&
                                    (tokens[l].typ === EnumToken.WhitespaceTokenType ||
                                        tokens[l].typ === EnumToken.CommentTokenType)
                                ) {
                                    l--;
                                }

                                const left: Token[] = trimArray(tokens.slice(l, index));
                                const right: Token[] = trimArray(tokens.slice(index + 1));

                                tokens[l] = {
                                    typ: EnumToken.MediaQueryConditionTokenType,
                                    op: stack.pop()!,
                                    l: left,
                                    r: right,
                                    [LOC]: { ...left[0][LOC]!, end: right.at(-1)![LOC]!.end },
                                } as MediaQueryConditionToken;
                                tokens.length = l + 1;

                                expectAndOrComma = true;
                            }
                        }

                        break;
                }

                if (!success) {
                    break;
                }
            }

            // if (success && stack.length > 0) {
            //     success = false;
            //     errors.push({
            //         action: "drop",
            //         node: stack.at(-1),
            //         location: stack.at(-1)?.[LOC],
            //         message: `unmatched token '${EnumToken[stack.at(-1)?.typ]}' at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
            //     });
            // }

            if (!success) {
                hasErrors = true;
                parts.splice(parts.indexOf(stream), 1);
            }

            stream.length = 0;
            stream.push(...trimArray(tokens));
        }
    }

    stream.length = 0;
    stream.push(
        ...parts
            .filter((p) => p.length > 0 && p[0].typ !== EnumToken.InvalidMediaQueryTokenType)
            .reduce((acc, b) => {
                if (acc.length > 0) {
                    acc.push({ typ: EnumToken.CommaTokenType });
                }

                acc.push(...b);
                return acc;
            }, []),
    );

    return {
        success:
            !hasErrors ||
            stream.filter(
                (t) =>
                    t.typ !== EnumToken.WhitespaceTokenType &&
                    t.typ !== EnumToken.CommentTokenType &&
                    t.typ !== EnumToken.InvalidMediaQueryTokenType &&
                    t.typ !== EnumToken.CommaTokenType,
            ).length !== 0,
        errors,
    };
}
