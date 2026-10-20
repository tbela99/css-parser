/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
<<<<<<< HEAD
	Version: 2.0.0-alpha.1
=======
	Version: 1.6.8
>>>>>>> v.next
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../../ast/types.js';
import { printValue } from '../../printer/print.js';
import { ERRORS, STATE, TOKENS, LOCEND, LOCSTA, LOCSRCID, pseudoElements, combinators, tokensfuncDefMap } from '../../syntax/constants.js';
import { isHash } from '../../syntax/syntax.js';
import { getParsedSyntax, getSyntaxRule, getSyntaxConfig } from '../../validation/config.js';
import { matchAllSyntaxes, createValidationContext, trimArray, matchSelectorSyntax } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from '../../validation/parser/typedef.js';
import { splitTokenList } from '../../validation/utils/list.js';
import { trimWhiteSpace } from '../parse.js';

/**
 * parse selector
 */
function parseSelector(tokens, context, options, errors) {
    const arena = options.arena;
    const contextTyp = arena.getType(context);
    let typ;
    if (arena.getType(context) === EnumToken.KeyframesAtRuleNodeType) {
        const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "keyframe-selectors"), createValidationContext(tokens, options), options);
        const parts = splitTokenList(tokens, options);
        for (const part of parts) {
            trimArray(part, options);
            if (options.minify) {
                const filtered = part.filter((token) => {
                    typ = arena.getType(token);
                });
                if (filtered.length === 1) {
                    typ = arena.getType(filtered[0]);
                    if (typ === EnumToken.IdenTokenType && arena.equalsIgnoreCase(filtered[0], "val", "from")) {
                        arena.set(filtered[0], EnumToken.PercentageTokenType, 0, 0);
                        // filtered[0] = {
                        //     typ: EnumToken.PercentageTokenType,
                        //     val: 0,
                        //     [LOCSRCID]: filtered[0][LOCSRCID],
                        //     [LOCSTA]: filtered[0][LOCSTA],
                        //     [LOCEND]: filtered[0][LOCEND],
                        // };
                    }
                    else if (typ === EnumToken.PercentageTokenType && 100 === arena.getNumerciValue(filtered[0])) {
                        arena.set(filtered[0], 0, EnumToken.IdenTokenType, arena.internString("to"), 0);
                        // filtered[0] = {
                        //     typ: EnumToken.IdenTokenType,
                        //     val: "to",
                        //     [LOCSRCID]: filtered[0][LOCSRCID],
                        //     [LOCSTA]: filtered[0][LOCSTA],
                        //     [LOCEND]: filtered[0][LOCEND],
                        // };
                    }
                    part.splice(0, part.length, ...filtered);
                }
            }
        }
        tokens.splice(0, tokens.length, ...parts.reduce((acc, curr) => {
            if (acc.length > 0) {
                const id = arena.allocate();
                arena.set(id, EnumToken.CommaTokenType);
                acc.push(id);
            }
            for (const c of curr) {
                acc.push(c);
            }
            return acc;
        }, []));
        const node = arena.allocate();
        arena.set(node, EnumToken.KeyframesRuleNodeType);
        return {
            typ: EnumToken.KeyframesRuleNodeType,
            sel: [
                ...splitTokenList(trimArray(tokens, options), options).reduce((acc, curr) => {
                    acc.add(curr.reduce((acc, curr) => acc + printValue(curr, { minify: false }), ""));
                    return acc;
                }, new Set()),
            ].join(),
            chi: [],
            [LOCSRCID]: tokens[0]?.[LOCSRCID],
            [LOCSTA]: tokens[0]?.[LOCSTA],
            [LOCEND]: tokens[tokens.length - 1]?.[LOCEND],
            [TOKENS]: tokens.length === 0 ? null : tokens,
            [STATE]: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
            [ERRORS]: result.errors,
        };
    }
    const stack = [];
    const uniq = new Map();
    let allowed = true;
    let index;
    let parent = context;
    let nested = false;
    let val;
    if (contextTyp !== EnumToken.StyleSheetNodeType && contextTyp !== EnumToken.RuleNodeType) {
        allowed = false;
        if (contextTyp === EnumToken.AtRuleNodeType) {
            const syntaxRule = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.getName(context));
            allowed = syntaxRule?.acceptAnyRule ?? false;
            if (!allowed) {
                const rules = syntaxRule?.getBlockRules?.();
                if (rules != null) {
                    for (const rule of rules) {
                        if (ValidationTokenEnum.PropertyType === rule.typ) {
                            if ("block-contents" === rule.val ||
                                "rule-list" === rule.val) {
                                allowed = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    do {
        if (contextTyp === EnumToken.AtRuleNodeType && arena.equalsIgnoreCase(parent, "nam", "media")) {
            parent = arena.getParent(parent);
            continue;
        }
        nested = arena.getType(parent) == EnumToken.RuleNodeType;
        parent = arena.getParent(parent);
    } while (!nested && parent != 0);
    const all = new Array(tokens.length);
    let write = 0;
    let token;
    let next;
    let newToken;
    for (let read = 0; read < tokens.length; read++) {
        token = tokens[read];
        typ = arena.getType(token);
        if (typ == EnumToken.ColonTokenType) {
            next = tokens[read + 1];
            if (next != null && arena.getType(next) == EnumToken.IdenTokenType) {
                newToken = arena.allocate();
                all[write++] = newToken;
                arena.set(newToken, EnumToken.PseudoClassTokenType, arena.interString(":" + arena.getValue(next)));
                arena.setSpan(newToken, arena.getSourceId(token), arena.getStart(token), arena.getEnd(next));
                read++;
                continue;
            }
            if (next != null && arena.getType(next) == EnumToken.FunctionTokenDefType) {
                val = ":" + arena.getValue(next);
                // all[write++] = {
                //     ...token,
                //     typ:
                //         val + "()" in getSyntaxConfig().selectors
                //             ? EnumToken.PseudoClassFunctionTokenDefType
                //             : next.typ,
                //     val,
                //     [LOCEND]: next[LOCEND],
                // } as Token;
                newToken = arena.allocate();
                all[write++] = newToken;
                arena.set(newToken, val + "()" in getSyntaxConfig().selectors
                    ? EnumToken.PseudoClassFunctionTokenDefType
                    : arena.getType(next), arena.interString(":" + arena.getValue(next)));
                arena.setSpan(newToken, arena.getSourceId(token), arena.getStart(token), arena.getEnd(next));
                read++;
                continue;
            }
        }
        if (arena.getType(token) == EnumToken.DoubleColonTokenType) {
            const next = tokens[read + 1];
            val = ":" + arena.getValue(next);
            if (arena.getType(next) == EnumToken.IdenTokenType) {
                // all[write++] = {
                //     ...token,
                //     typ: EnumToken.PseudoClassTokenType,
                //     val: (pseudoElements.includes(val) ? "" : ":") + val,
                //     [LOCEND]: next[LOCEND],
                // } as Token;
                newToken = arena.allocate();
                all[write++] = newToken;
                arena.set(newToken, EnumToken.PseudoClassTokenType, arena.interString((pseudoElements.includes(val) ? "" : ":") + val));
                arena.setSpan(newToken, arena.getSourceId(token), arena.getStart(token), arena.getEnd(next));
                read++;
                continue;
            }
            if (arena.getType(next) == EnumToken.FunctionTokenDefType) {
                val = "::" + arena.getValue(next);
                // all[write++] = {
                //     ...token,
                //     typ:
                //         val + "()" in getSyntaxConfig().selectors
                //             ? EnumToken.PseudoClassFunctionTokenDefType
                //             : EnumToken.FunctionTokenDefType,
                //     val,
                //     [LOCEND]: next[LOCEND],
                // } as Token;
                newToken = arena.allocate();
                all[write++] = newToken;
                arena.set(newToken, val + "()" in getSyntaxConfig().selectors
                    ? EnumToken.PseudoClassFunctionTokenDefType
                    : EnumToken.FunctionTokenDefType, arena.interString(val));
                arena.setSpan(newToken, arena.getSourceId(token), arena.getStart(token), arena.getEnd(next));
                read++;
                continue;
            }
        }
        if (arena.getType(token) == EnumToken.ColorTokenType) {
            if (isHash(arena.getValue(token))) {
                arena.set(token, EnumToken.HashTokenType);
                all[write++] = token;
                continue;
            }
            const node = arena.allocate();
            node.set(node, EnumToken.RuleNodeType, arena.internString([
                ...all
                    .reduce((acc, curr, index, array) => {
                    if (arena.getType(curr) == EnumToken.WhitespaceTokenType) {
                        if (trimWhiteSpace.includes(arena.getType(array[index - 1])) ||
                            trimWhiteSpace.includes(arena.getType(array[index + 1])) ||
                            combinators.includes(arena.getValue(array[index - 1])) ||
                            combinators.includes(arena.getValue(array[index + 1]))) {
                            return acc;
                        }
                    }
                    let t = printValue(curr, { minify: false, arena });
                    if (t == ",") {
                        acc.push([]);
                    }
                    else {
                        acc[acc.length - 1].push(t);
                    }
                    return acc;
                }, [[]])
                    .reduce((acc, curr) => {
                    let i = 0;
                    for (; i < curr.length; i++) {
                        if (i + 1 < curr.length && curr[i] == "*") {
                            if (curr[i] == "*") {
                                let index = curr[i + 1] == " " ? 2 : 1;
                                if (![">", "~", "+"].includes(curr[index])) {
                                    curr.splice(i, index);
                                }
                            }
                        }
                    }
                    acc.set(curr.join(""), curr);
                    return acc;
                }, uniq)
                    .keys(),
            ].join(",")));
            arena.setTokens(node, all);
            arena.setFlags(node, EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.Invalid);
            arena.setErrors(node, [
                {
                    action: "drop",
                    node: node,
                    message: "invalid hash id",
                },
            ]);
            return node;
            // return {
            //     typ: EnumToken.RuleNodeType,
            //     sel: [
            //         ...tokens
            //             .reduce(
            //                 (acc: string[][], curr: Token, index: number, array: Token[]) => {
            //                     if (curr.typ == EnumToken.WhitespaceTokenType) {
            //                         if (
            //                             trimWhiteSpace.includes(array[index - 1]?.typ) ||
            //                             trimWhiteSpace.includes(array[index + 1]?.typ) ||
            //                             combinators.includes((<LiteralToken>array[index - 1])?.val) ||
            //                             combinators.includes((<LiteralToken>array[index + 1])?.val)
            //                         ) {
            //                             return acc;
            //                         }
            //                     }
            //                     let t: string = printValue(curr, { minify: false });
            //                     if (t == ",") {
            //                         acc.push([]);
            //                     } else {
            //                         acc[acc.length - 1].push(t);
            //                     }
            //                     return acc;
            //                 },
            //                 [[]],
            //             )
            //             .reduce((acc: Map<string, string[]>, curr: string[]) => {
            //                 let i: number = 0;
            //                 for (; i < curr.length; i++) {
            //                     if (i + 1 < curr.length && curr[i] == "*") {
            //                         if (curr[i] == "*") {
            //                             let index: number = curr[i + 1] == " " ? 2 : 1;
            //                             if (![">", "~", "+"].includes(curr[index])) {
            //                                 curr.splice(i, index);
            //                             }
            //                         }
            //                     }
            //                 }
            //                 acc.set(curr.join(""), curr);
            //                 return acc;
            //             }, uniq)
            //             .keys(),
            //     ].join(","),
            //     chi: [],
            //     [LOCSRCID]: tokens[0][LOCSRCID],
            //     [LOCSTA]: tokens[0][LOCSTA],
            //     [LOCEND]: tokens[tokens.length - 1][LOCEND],
            //     [TOKENS]: tokens,
            //     [STATE]: EnumAstNodeStatus.Invalid,
            //     [ERRORS]: [
            //         {
            //             action: "drop",
            //             node: token,
            //             message: "invalid hash id",
            //         },
            //     ],
            // } as AstRule;
        }
        all[write++] = token;
    }
    if (write !== tokens.length) {
        for (let index = 0; index < write; index++) {
            tokens[index] = all[index];
        }
        tokens.length = write;
    }
    const result = matchSelectorSyntax(tokens, errors, options, nested);
    trimArray(tokens, options);
    // if (result.success) {
    for (let i = 0; i < tokens.length; i++) {
        token = tokens[i];
        typ = arena.getType(token);
        switch (token) {
            case EnumToken.AttrStartTokenType:
                stack.push(token);
                break;
            case EnumToken.AttrEndTokenType:
                if (arena.getType(stack.at(-1)) == EnumToken.AttrStartTokenType) {
                    index = tokens.indexOf(stack.at(-1));
                    // const { val, ...attr } = stack.at(-1) as AttrStartToken;
                    // attr[LOCSRCID] = stack.at(-1)![LOCSRCID];
                    // attr[LOCSTA] = stack.at(-1)![LOCSTA];
                    // attr[LOCEND] = token[LOCEND];
                    arena.setSpanEnd(tokens[index], arena.getSpanEnd(token));
                    arena.setChildren(tokens[index], ...tokens.splice(index + 1, i - index - 1));
                    tokens.splice(i, 1);
                    // Object.assign(attr, {
                    //     typ: EnumToken.AttrTokenType,
                    //     chi: tokens.splice(index + 1, i - index - 1),
                    // });
                    // tokens[index] = attr;
                    i = index;
                    stack.pop();
                }
                break;
            case EnumToken.PseudoClassFunctionTokenDefType:
                stack.push(token);
                break;
            case EnumToken.EndParensTokenType:
                if (stack.length > 0 && arena.getType(stack.at(-1)) == EnumToken.PseudoClassFunctionTokenDefType) {
                    const func = stack.at(-1);
                    const funcType = arena.getType(func);
                    index = tokens.indexOf(func);
                    arena.setSpanEnd(tokens[index], arena.getSpanEnd(token));
                    // (stack.at(-1) as AttrStartToken)[LOCEND] = token[LOCEND];
                    tokens.splice(i, 1);
                    if (tokensfuncDefMap.has(funcType)) {
                        arena.setType(func, tokensfuncDefMap.get(funcType));
                        arena.setChildren(func, ...trimArray(tokens.splice(index + 1, i - index - 1), options));
                    }
                    if (result.success && options.minify) {
                        val = arena.getValue(func);
                        // parse an+b
                        // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                        if (val == ":nth-child" ||
                            val == ":nth-last-child" ||
                            val == ":nth-of-type" ||
                            val == ":nth-last-of-type") {
                            const list = [];
                            const children = arena.children(func);
                            let index = 0;
                            let child = 0;
                            for (index = 0; index < children.length; index++) {
                                child = children[index];
                                typ = arena.getType(child);
                                if (typ == EnumToken.CommentTokenType || typ == EnumToken.WhitespaceTokenType) {
                                    continue;
                                }
                                if (typ == EnumToken.IdenTokenType && arena.equalsIgnoreCase(child, "val", "of")) {
                                    index--;
                                    break;
                                }
                                list.push(child);
                            }
                            if (list.length == 2) {
                                if (arena.getType(list[1]) == EnumToken.NumberTokenType) {
                                    if (arena.getNumericValue(list[1]) == 0) {
                                        list.length = 1;
                                        if (arena.getType(list[0]) == EnumToken.DimensionTokenType &&
                                            arena.getNumericValue(list[0]) == -2) {
                                            arena.setNumericValue(list[0], 2);
                                        }
                                    }
                                    else {
                                        const sign = Math.sign(arena.getNumericValue(list[1]));
                                        // @ts-ignore
                                        list[1].val *= sign;
                                        const literal = arena.allocate();
                                        arena.setType(literal, EnumToken.LiteralTokenType, arena.internString(sign < 0 ? "-" : "+"));
                                        list.splice(1, 0, literal);
                                    }
                                }
                                if (list.length == 3 &&
                                    arena.getType(list[2]) == EnumToken.NumberTokenType &&
                                    arena.getType(list[0]) == EnumToken.DimensionTokenType) {
                                    const value = arena.getNumericValue(list[0]);
                                    if (value == 2 || value == -2) {
                                        const value0 = arena.getNumericValue(list[2]);
                                        if (1 == value0) {
                                            const literal = arena.allocate();
                                            arena.setType(literal, EnumToken.IdenTokenType, arena.internString("odd"));
                                            arena.setSpan(literal, arena.getSourceId(list[0]), arena.getSpanStart(list[0]), arena.getSpanEnd(list[0]));
                                            list.splice(0, 3, literal);
                                        }
                                        else if (0 == value0) {
                                            const literal = arena.allocate();
                                            arena.setType(literal, EnumToken.IdenTokenType, arena.internString("even"));
                                            arena.setSpan(literal, arena.getSourceId(list[0]), arena.getSpanStart(list[0]), arena.getSpanEnd(list[0]));
                                            list.splice(0, 3, literal);
                                        }
                                    }
                                }
                                arena.setChildren(func, arena.children(func).splice(0, index, ...list));
                            }
                            if (list.length == 1) {
                                if (arena.getType(list[0]) == EnumToken.IdenTokenType &&
                                    arena.equalsIgnoreCase(list[0], "val", "-n")) {
                                    arena.setValue(list[0], arena.interString("n"));
                                }
                            }
                            if (list.length == 3) {
                                if (arena.getType(list[0]) == EnumToken.IdenTokenType) {
                                    val = arena.getValue(list[0]);
                                    if ("n" == val || "-n" == val || "+n" == val) {
                                        if (arena.getType(list[1]) == EnumToken.NextSiblingCombinatorTokenType) {
                                            if (arena.getType(list[2]) == EnumToken.NumberTokenType &&
                                                0 == arena.getNumericValue(list[2])) {
                                                arena.setValue(list[0], "n");
                                                arena.setChildren(func, arena.children(func).splice(0, index, list[0]));
                                                // func.chi.splice(0, index, list[0]);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            const token = arena.findChild(func, (t) => {
                                typ = arena.getType(t);
                                return typ != EnumToken.WhitespaceTokenType && typ != EnumToken.CommentTokenType;
                            });
                            if (token != null) {
                                typ = arena.getType(token);
                                if (typ == EnumToken.IdenTokenType || typ == EnumToken.LiteralTokenType) {
                                    val = arena.getValue(token);
                                    if (typ == EnumToken.IdenTokenType) {
                                        if (val == "even") {
                                            arena.set(token, EnumToken.DimensionTokenType, 0, 2, arena.internString("n"));
                                        }
                                    }
                                    else {
                                        const matches = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(val);
                                        if (matches != null) {
                                            const a1 = matches[2] === "" ? 1 : matches[2] === "-" ? -1 : +matches[2];
                                            const b1 = +matches[3];
                                            if (b1 === 0) {
                                                if (Math.abs(a1) === 1) {
                                                    arena.set(token, EnumToken.IdenTokenType, arena.internString("n"));
                                                }
                                                else {
                                                    arena.set(token, EnumToken.DimensionTokenType, 0, a1 * Math.sign(a1), arena.internString("n"));
                                                }
                                                // Object.assign(
                                                //     token,
                                                //     Math.abs(a1) === 1
                                                //         ? {
                                                //               typ: EnumToken.IdenTokenType,
                                                //               val: "n",
                                                //           }
                                                //         : {
                                                //               typ: EnumToken.DimensionTokenType,
                                                //               val: a1 * Math.sign(a1),
                                                //               unit: "n",
                                                //           },
                                                // );
                                            }
                                        }
                                    }
                                }
                                else if (typ === EnumToken.DimensionTokenType) {
                                    const children = arena.children(func);
                                    const index = children.indexOf(token);
                                    let num = null;
                                    let i = index + 1;
                                    for (; i < children.length; i++) {
                                        typ = arena.getType(children[i]);
                                        if (typ == EnumToken.WhitespaceTokenType ||
                                            typ == EnumToken.CommentTokenType) {
                                            continue;
                                        }
                                        if (typ == EnumToken.NumberTokenType) {
                                            num = children[i];
                                            break;
                                        }
                                    }
                                    if (num != null) {
                                        if (arena.getNumericValue(num) === 0) {
                                            children.splice(index + 1, i - index);
                                            if (arena.getNumericValue(token) < 0) {
                                                arena.setNumericValue(token, arena.getNumericValue(token) * -1);
                                            }
                                            arena.setChildren(func, children);
                                            break;
                                        }
                                        else if (arena.getNumericValue(token) === 2 &&
                                            Math.abs(arena.getNumericValue(num)) === 1) {
                                            arena.set(token, EnumToken.IdenTokenType, arena.internString("n"));
                                            // Object.assign(token, {
                                            //     typ: EnumToken.IdenTokenType,
                                            //     val: "odd",
                                            // });
                                            children.splice(index + 1, i - index);
                                            arena.setChildren(func, children);
                                            break;
                                        }
                                        // if (((token as DimensionToken).val as number) === 1) {
                                        //     Object.assign(token, {
                                        //         typ: EnumToken.IdenTokenType,
                                        //         val:
                                        //             Math.sign((token as DimensionToken).val as number) === 1
                                        //                 ? "n"
                                        //                 : "-n",
                                        //     });
                                        // }
                                        // if (sign == null) {
                                        //     func.chi.splice(index + 1, i - index - 1);
                                        //     if (Math.sign(num.val as number) === 1) {
                                        //         func.chi.splice(index + 1, 0, {
                                        //             typ: EnumToken.LiteralTokenType,
                                        //             val: "+",
                                        //         });
                                        //     }
                                        // }
                                    }
                                }
                            }
                        }
                    }
                    i = index;
                    stack.pop();
                }
                break;
        }
    }
    // }
    const node = arena.allocate();
    arena.set(node, EnumToken.RuleNodeType, arena.internString([
        ...trimArray(all, options)
            .reduce((acc, curr, index, array) => {
            // if (curr.typ == EnumToken.CommentTokenType) {
            //     return acc;
            // }
            if (arena.getType(curr) == EnumToken.WhitespaceTokenType) {
                if (trimWhiteSpace.includes(arena.getType(array[index - 1])) ||
                    trimWhiteSpace.includes(arena.getType(array[index + 1])) ||
                    combinators.includes(arena.getValue(array[index - 1])) ||
                    combinators.includes(arena.getValue(array[index + 1]))) {
                    return acc;
                }
            }
            let t = printValue(curr, arena, { minify: false, arena });
            if (t == ",") {
                acc.push([]);
            }
            else {
                acc[acc.length - 1].push(t);
            }
            return acc;
        }, [[]])
            .reduce((acc, curr) => {
            let i = 0;
            for (; i < curr.length; i++) {
                if (i + 1 < curr.length && curr[i] == "*") {
                    if (curr[i] == "*") {
                        let index = curr[i + 1] == " " ? 2 : 1;
                        if (![">", "~", "+"].includes(curr[index])) {
                            curr.splice(i, index);
                        }
                    }
                }
            }
            acc.set(curr.join(""), curr);
            return acc;
        }, uniq)
            .keys(),
    ].join(",")));
    arena.setSpan(node, arena.getSourceId(tokens[0]), arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
    arena.setFlags(node, EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.Validated);
    return node;
    // return {
    //     typ: EnumToken.RuleNodeType,
    //     sel: [
    //         ...tokens
    //             .reduce(
    //                 (acc: string[][], curr: Token, index: number, array: Token[]) => {
    //                     // if (curr.typ == EnumToken.CommentTokenType) {
    //                     //     return acc;
    //                     // }
    //                     if (curr.typ == EnumToken.WhitespaceTokenType) {
    //                         if (
    //                             trimWhiteSpace.includes(array[index - 1]?.typ) ||
    //                             trimWhiteSpace.includes(array[index + 1]?.typ) ||
    //                             combinators.includes((<LiteralToken>array[index - 1])?.val) ||
    //                             combinators.includes((<LiteralToken>array[index + 1])?.val)
    //                         ) {
    //                             return acc;
    //                         }
    //                     }
    //                     let t: string = printValue(curr, { minify: false });
    //                     if (t == ",") {
    //                         acc.push([]);
    //                     } else {
    //                         acc[acc.length - 1].push(t);
    //                     }
    //                     return acc;
    //                 },
    //                 [[]],
    //             )
    //             .reduce((acc: Map<string, string[]>, curr: string[]) => {
    //                 let i: number = 0;
    //                 for (; i < curr.length; i++) {
    //                     if (i + 1 < curr.length && curr[i] == "*") {
    //                         if (curr[i] == "*") {
    //                             let index: number = curr[i + 1] == " " ? 2 : 1;
    //                             if (![">", "~", "+"].includes(curr[index])) {
    //                                 curr.splice(i, index);
    //                             }
    //                         }
    //                     }
    //                 }
    //                 acc.set(curr.join(""), curr);
    //                 return acc;
    //             }, uniq)
    //             .keys(),
    //     ].join(","),
    //     chi: [],
    //     [LOCSRCID]: tokens[0][LOCSRCID],
    //     [LOCSTA]: tokens[0][LOCSTA],
    //     [LOCEND]: tokens[tokens.length - 1][LOCEND],
    //     [TOKENS]: tokens,
    //     [STATE]:
    //         result.success && allowed
    //             ? EnumAstNodeStatus.Validated
    //             : allowed
    //               ? EnumAstNodeStatus.Invalid
    //               : EnumAstNodeStatus.Disallowed,
    //     [ERRORS]: result.success ? [] : result.errors,
    // } as AstRule;
}

export { parseSelector };
