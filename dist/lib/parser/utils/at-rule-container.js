import { EnumToken } from '../../ast/types.js';
import { tokensfuncDefMap, LOC, mFGT, mFLT } from '../../syntax/constants.js';
import { matchAllSyntaxes, createValidationContext, trimArray } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxRule } from '../../validation/config.js';

function parseAtRuleContainerQueryList(stream, context, options = {}) {
    let matchCount = 0;
    const errors = [];
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    const parts = stream.reduce((acc, t) => {
        if (t.typ === EnumToken.CommaTokenType && matchCount === 0) {
            acc.push([]);
        }
        else {
            acc[acc.length - 1].push(t);
            if (t.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(t.typ)) {
                matchCount++;
            }
            else if (t.typ === EnumToken.EndParensTokenType) {
                if (matchCount > 0) {
                    matchCount--;
                }
            }
        }
        return acc;
    }, [[]]);
    const result = matchAllSyntaxes(syntax, createValidationContext(stream), options);
    if (!result.success) {
        errors.push(...result.errors);
        return {
            success: false,
            errors,
        };
    }
    {
        for (const stream of parts.slice()) {
            let success = true;
            let i;
            let currentScope = new Set();
            const scopes = [currentScope];
            const stack = [];
            const tokens = [];
            let expectAndOr = false;
            i = 0;
            while (i < stream.length &&
                (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)) {
                tokens.push(stream[i++]);
            }
            // if (i >= stream.length) {
            //     return {
            //         success: false,
            //         errors: [
            //             {
            //                 action: "drop",
            //                 node: context,
            //                 location: context[LOC],
            //                 message: `expecting <container-condition> at ${context[LOC]?.src}:${context?.[LOC]?.sta.lin}:${context[LOC]?.sta.col}`,
            //             },
            //         ],
            //     };
            // }
            if (stream[i].typ === EnumToken.IdenTokenType) {
                tokens.push(stream[i++]);
            }
            while (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType) {
                tokens.push(stream[i++]);
            }
            if (i < stream.length &&
                stream[i]?.typ !== EnumToken.StartParensTokenType &&
                stream[i]?.typ !== EnumToken.ContainerFunctionTokenDefType) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            node: stream[i],
                            location: stream[i]?.[LOC], // ?? context[LOC],
                            message: `expecting <container-condition> at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                        },
                    ],
                };
            }
            // if (stream[i]?.typ === EnumToken.IdenTokenType) {
            //     const val: string = (stream[i] as IdentToken).val.toLowerCase();
            //     if ("not" === val) {
            //         tokens.push(stream[i]);
            //         stack.push(Object.assign(stream[i], { typ: EnumToken.NotTokenType }));
            //         i++;
            //     } else if ("and" === val || "or" === val) {
            //         return {
            //             success: false,
            //             errors: [
            //                 {
            //                     action: "drop",
            //                     node: stream[i],
            //                     location: stream[i]?.[LOC],
            //                     message: `unexpected token at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
            //                 },
            //             ],
            //         };
            //     } else {
            //         tokens.push(stream[i++]);
            //     }
            // }
            for (; i < stream.length; i++) {
                tokens.push(stream[i]);
                if (stream[i].typ === EnumToken.WhitespaceTokenType || stream[i].typ === EnumToken.CommentTokenType) {
                    continue;
                }
                if (expectAndOr) {
                    let valid = true;
                    // if (stream[i].typ === EnumToken.IdenTokenType) {
                    //     const val: string = (stream[i] as IdentToken).val.toLowerCase();
                    //     valid = val === "and" || val === "or";
                    // } else {
                    valid = stream[i].typ !== EnumToken.CommaTokenType;
                    // }
                    if (!valid) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: stream[i],
                            message: `expecting <and>, <or> or comma  at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                        });
                        break;
                    }
                    // expectAndOr = false;
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
                            const val = stream[i].val.toLowerCase();
                            if (val === "not") {
                                Object.assign(stream[i], {
                                    typ: EnumToken.NotTokenType,
                                });
                                stack.push(stream[i]);
                            }
                            else if (val === "and" || val === "or") {
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
                                // if (currentScope.has(val === "or" ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                                //     success = false;
                                //     errors.push({
                                //         action: "drop",
                                //         node: stream[i],
                                //         message: `cannot mix <and> and <or> at the same level at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                //     });
                                //     break;
                                // }
                                currentScope.add(stream[i].typ);
                                stack.push(stream[i]);
                            }
                            // else if (scopes.length === 0) {
                            //     success = false;
                            //     errors.push({
                            //         action: "drop",
                            //         node: stream[i],
                            //         location: stream[i]?.[LOC],
                            //         message: `unexpected <ident> at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                            //     });
                            //     return {
                            //         success,
                            //         errors,
                            //     };
                            // }
                        }
                        break;
                    case EnumToken.EndParensTokenType:
                        // feature
                        // if (mFLT.has(stack.at(-1)?.typ) || mFGT.has(stack.at(-1)?.typ)) {
                        //     // <mf-lt> | <mf-gt>
                        //     const index: number = tokens.indexOf(stack.at(-1)!);
                        //     const prevToken: Token = stack[stack.length - 2];
                        //     if (mFLT.has(prevToken?.typ) || mFGT.has(prevToken?.typ)) {
                        //         if (stack[stack.length - 3]?.typ !== EnumToken.StartParensTokenType) {
                        //             success = false;
                        //             errors.push({
                        //                 action: "drop",
                        //                 node: stream[i],
                        //                 message: `unmatched '(' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                        //             });
                        //             break;
                        //         }
                        //         if (!mFLT.has(stack.at(-1)?.typ) && mFLT.has(prevToken?.typ)) {
                        //             success = false;
                        //             errors.push({
                        //                 action: "drop",
                        //                 node: stack.at(-1),
                        //                 message: `expected <mf-lt> at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
                        //             });
                        //             break;
                        //         } else if (!mFGT.has(stack.at(-1)?.typ) && mFGT.has(prevToken?.typ)) {
                        //             success = false;
                        //             errors.push({
                        //                 action: "drop",
                        //                 node: stream[i],
                        //                 message: `expected <mf-gt> at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
                        //             });
                        //             break;
                        //         }
                        //         // <style-range>
                        //         // const index: number = tokens.indexOf(stack.at(-1)!);
                        //         // <mf-lt> | <mf-gt>
                        //         const index2: number = tokens.indexOf(prevToken);
                        //         // '('
                        //         const index3: number = tokens.indexOf(stack.at(-3)!);
                        //         const left: Token[] = trimArray(tokens.slice(index3 + 1, index2));
                        //         const right: Token[] = trimArray(tokens.slice(index + 1, tokens.length - 1));
                        //         const names: Token[] = trimArray(tokens.slice(index2 + 1, index));
                        //         if (!isStyleFeatureValue(left)) {
                        //             success = false;
                        //             errors.push({
                        //                 action: "drop",
                        //                 node: left[0],
                        //                 message: `expected <style-feature-value> at ${left[0]?.[LOC]?.src}:${left[0]?.[LOC]?.sta.lin}:${left[0]?.[LOC]?.sta.col}`,
                        //             });
                        //             break;
                        //         }
                        //         if (!isStyleFeatureValue(right)) {
                        //             success = false;
                        //             errors.push({
                        //                 action: "drop",
                        //                 node: right[0],
                        //                 message: `expected <style-feature-value> at ${right[0]?.[LOC]?.src}:${right[0]?.[LOC]?.sta.lin}:${right[0]?.[LOC]?.sta.col}`,
                        //             });
                        //             break;
                        //         }
                        //         if (!isStyleFeatureValue(names)) {
                        //             success = false;
                        //             errors.push({
                        //                 action: "drop",
                        //                 node: names[0],
                        //                 message: `expected <style-feature-value> at ${names[0]?.[LOC]?.src}:${names[0]?.[LOC]?.sta.lin}:${names[0]?.[LOC]?.sta.col}`,
                        //             });
                        //             break;
                        //         }
                        //         tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                        //             typ: EnumToken.ContainerStyleRangeTokenType,
                        //             l: left,
                        //             op: names,
                        //             r: right,
                        //             [LOC]: { ...left[0][LOC]!, end: right.at(-1)![LOC]!.end },
                        //         } as ContainerStyleRangeToken);
                        //         // check <style()> or <scroll-state()>
                        //         stack.pop();
                        //         stack.pop();
                        //     } else if (stack[stack.length - 2]?.typ !== EnumToken.StartParensTokenType) {
                        //         success = false;
                        //         errors.push({
                        //             action: "drop",
                        //             node: stream[i],
                        //             location: stream[i]?.[LOC],
                        //             message: `expected '(' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                        //         });
                        //         break;
                        //     }
                        // }
                        if (mFGT.has(stack.at(-1)?.typ) ||
                            mFLT.has(stack.at(-1)?.typ) ||
                            stack.at(-1)?.typ === EnumToken.DelimTokenType ||
                            stack.at(-1)?.typ === EnumToken.ColonTokenType) {
                            stack[stack.length - 2].val?.toLowerCase?.();
                            // if (
                            //     stack[stack.length - 2]?.typ !== EnumToken.StartParensTokenType &&
                            //     !(
                            //         stack[stack.length - 2]?.typ === EnumToken.ContainerFunctionTokenDefType &&
                            //         ("style" === funcName || "scroll-state" === funcName)
                            //     )
                            // ) {
                            //     success = false;
                            //     errors.push({
                            //         action: "drop",
                            //         node: stream[i],
                            //         location: stream[i]?.[LOC],
                            //         message: `unmatched2 ')' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                            //     });
                            //     break;
                            // }
                            const index2 = tokens.indexOf(stack.at(-1));
                            const index3 = tokens.indexOf(stack.at(-2));
                            let names = trimArray(tokens.slice(index3 + 1, index2));
                            let values = trimArray(tokens.slice(index2 + 1, tokens.length - 1));
                            // if (
                            //     stack.at(-1)?.typ !== EnumToken.ColonTokenType &&
                            //     stack.at(-1)?.typ !== EnumToken.DelimTokenType
                            // ) {
                            //     const filteredNames = names.filter(
                            //         (n) =>
                            //             n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType,
                            //     );
                            //     if (
                            //         filteredNames.length !== 1 ||
                            //         (filteredNames[0].typ !== EnumToken.IdenTokenType &&
                            //             filteredNames[0].typ !== EnumToken.DashedIdenTokenType)
                            //     ) {
                            //     }
                            // }
                            tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                                typ: EnumToken.MediaQueryConditionTokenType,
                                l: names,
                                op: stack.pop(),
                                r: values,
                                [LOC]: { ...names[0][LOC], end: values.at(-1)[LOC].end },
                            });
                            // check <style()> or <scroll-state()>
                        }
                        if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                            const index = tokens.indexOf(stack.at(-1));
                            Object.assign(tokens[index], {
                                typ: tokensfuncDefMap.get(stack.at(-1)?.typ),
                                chi: trimArray(tokens.slice(index + 1, tokens.length - 1)),
                            });
                            tokens[index][LOC] = { ...tokens[index][LOC], end: stream[i][LOC].end };
                            if (tokens[index].chi.every((t) => t.typ === EnumToken.WhitespaceTokenType || t.typ === EnumToken.CommentTokenType)) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: stream[i]?.[LOC],
                                    message: `expecting '<${tokens[index].val}-query>' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                });
                                break;
                            }
                            tokens.length = index + 1;
                            // if (EnumToken.ColorTokenType === tokens[index].typ) {
                            //     parseColor(tokens[index]);
                            // }
                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1);
                        }
                        else {
                            const index = tokens.indexOf(stack.at(-1));
                            tokens[index] = {
                                typ: EnumToken.ParensTokenType,
                                chi: tokens.slice(index + 1, tokens.length - 1),
                                [LOC]: { ...tokens[index][LOC], end: stream[i][LOC].end },
                            };
                            if (tokens[index].chi.every((t) => t.typ === EnumToken.WhitespaceTokenType || t.typ === EnumToken.CommentTokenType)) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: stream[i]?.[LOC],
                                    message: `expecting '<query-in-parens>' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                });
                                break;
                            }
                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            stack.pop();
                        }
                        if (stack.at(-1)?.typ === EnumToken.NotTokenType) {
                            let j = tokens.indexOf(stack.at(-1));
                            let k = j;
                            while (j-- &&
                                (tokens[j]?.typ === EnumToken.WhitespaceTokenType ||
                                    tokens[j]?.typ === EnumToken.CommentTokenType)) { }
                            if (j >= 0) {
                                if (tokens[j]?.typ !== EnumToken.StartParensTokenType) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: tokens[k],
                                        location: tokens[k]?.[LOC],
                                        message: `unexpected token 'not' at ${tokens[k]?.[LOC]?.src}:${tokens[k]?.[LOC]?.sta.lin}:${tokens[k]?.[LOC]?.sta.col}`,
                                    });
                                    break;
                                }
                            }
                            // const index = tokens.indexOf(stack.at(-1)!);
                            // const slice = trimArray(tokens.slice(index + 1));
                            // tokens[index] = {
                            //     typ: EnumToken.MediaQueryUnaryFeatureTokenType,
                            //     l: stack.pop()!,
                            //     r: slice,
                            //     [LOC]: { ...tokens[index][LOC]!, end: slice.at(-1)![LOC]!.end },
                            // };
                            // tokens.length = index + 1;
                        }
                        if (stack.at(-1)?.typ === EnumToken.AndTokenType ||
                            stack.at(-1)?.typ === EnumToken.OrTokenType) {
                            const index = tokens.indexOf(stack.at(-1));
                            let l = index - 1;
                            while (l > 0 &&
                                (tokens[l].typ === EnumToken.WhitespaceTokenType ||
                                    tokens[l].typ === EnumToken.CommentTokenType)) {
                                l--;
                            }
                            const left = trimArray(tokens.slice(l, index));
                            const right = trimArray(tokens.slice(index + 1));
                            tokens[l] = {
                                typ: EnumToken.MediaQueryConditionTokenType,
                                op: stack.pop(),
                                l: left,
                                r: right,
                                [LOC]: { ...left[0][LOC], end: right.at(-1)[LOC].end },
                            };
                            tokens.length = l + 1;
                            expectAndOr = true;
                        }
                        break;
                    // default:
                    //     if (tokensfuncDefMap.has(stream[i]?.typ)) {
                    //         stack.push(stream[i]);
                    //         scopes.push((currentScope = new Set()));
                    //     }
                    //     break;
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
            //         message: `unmatched token '${EnumToken[stack.at(-1)?.typ]}' at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
            //     });
            // }
            if (!success) {
                return {
                    success,
                    errors,
                };
            }
            stream.length = 0;
            stream.push(...trimArray(tokens));
        }
    }
    stream.length = 0;
    stream.push(...parts
        .filter((p) => p.length > 0 && p[0].typ !== EnumToken.InvalidMediaQueryTokenType)
        .reduce((acc, b) => {
        // if (acc.length > 0) {
        //     acc.push({ typ: EnumToken.CommaTokenType });
        // }
        acc.push(...b);
        return acc;
    }, []));
    return {
        success: true,
        errors,
    };
}

export { parseAtRuleContainerQueryList };
