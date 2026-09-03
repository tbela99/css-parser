import type {
    Token,
    AstRule,
    AstAtRule,
    AstKeyframesRule,
    AstKeyframesAtRule,
    AstStyleSheet,
    ParserOptions,
    ErrorDescription,
    AstRuleList,
    AttrStartToken,
    PseudoClassFunctionToken,
    IdentToken,
    DimensionToken,
    LiteralToken,
    NumberToken,
    PercentageToken,
    AtRuleToken,
    ColorToken,
} from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import { renderValue } from "../../renderer/render.ts";
import {
    combinators,
    ERRORS,
    LOCEND,
    LOCSRCID,
    LOCSTA,
    PARENT,
    pseudoElements,
    STATE,
    TOKENS,
    tokensfuncDefMap,
} from "../../syntax/constants.ts";
import { isHash } from "../../syntax/syntax.ts";
import { getParsedSyntax, getSyntaxConfig, getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, matchSelectorSyntax, trimArray } from "../../validation/match.ts";

import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "../../validation/parser/typedef.ts";
import type { ValidationPropertyToken } from "../../validation/parser/types.d.ts";
import { splitTokenList } from "../../validation/utils/list.ts";
import { trimWhiteSpace } from "../parse.ts";
import { equalsIgnoreCase } from "./text.ts";

/**
 * parse selector
 */

export function parseSelector(
    tokens: Token[],
    context: AtRuleToken | AstRule | AstAtRule | AstKeyframesRule | AstKeyframesAtRule | AstStyleSheet | null,
    options: ParserOptions,
    errors: ErrorDescription[],
): AstRule | AstKeyframesRule {
    if (context?.typ === EnumToken.KeyframesAtRuleNodeType) {
        const result = matchAllSyntaxes(
            getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "keyframe-selectors"),
            createValidationContext(tokens),
            options,
        );

        const parts = splitTokenList(tokens);

        for (const part of parts) {
            trimArray(part);

            if (options.minify) {
                const filtered = part.filter(
                    (token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
                );

                if (filtered.length === 1) {
                    if (
                        filtered[0].typ === EnumToken.IdenTokenType &&
                        "from" === (filtered[0] as IdentToken).val.toLowerCase()
                    ) {
                        filtered[0] = {
                            typ: EnumToken.PercentageTokenType,
                            val: 0,
                            [LOCSRCID]: filtered[0][LOCSRCID],
                            [LOCSTA]: filtered[0][LOCSTA],
                            [LOCEND]: filtered[0][LOCEND],
                        };
                    } else if (
                        filtered[0].typ === EnumToken.PercentageTokenType &&
                        100 === (filtered[0] as PercentageToken).val
                    ) {
                        filtered[0] = {
                            typ: EnumToken.IdenTokenType,
                            val: "to",
                            [LOCSRCID]: filtered[0][LOCSRCID],
                            [LOCSTA]: filtered[0][LOCSTA],
                            [LOCEND]: filtered[0][LOCEND],
                        };
                    }

                    part.splice(0, part.length, ...filtered);
                }
            }
        }

        tokens.splice(
            0,
            tokens.length,
            ...parts.reduce((acc, curr) => {
                if (acc.length > 0) {
                    acc.push({ typ: EnumToken.CommaTokenType });
                }

                for (const c of curr) {
                    acc.push(c);
                }

                return acc;
            }, [] as Token[]),
        );

        return {
            typ: EnumToken.KeyframesRuleNodeType,
            sel: [
                ...splitTokenList(trimArray(tokens)).reduce((acc, curr: Token[]) => {
                    acc.add(curr.reduce((acc, curr) => acc + renderValue(curr, { minify: false }), ""));
                    return acc;
                }, new Set<string>()),
            ].join(),
            chi: [],
            [LOCSRCID]: tokens[0]?.[LOCSRCID],
            [LOCSTA]: tokens[0]?.[LOCSTA],
            [LOCEND]: tokens[tokens.length - 1]?.[LOCEND],
            [TOKENS]: tokens.length === 0 ? null : tokens,
            [STATE]: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
            [ERRORS]: result.errors,
        } as AstKeyframesRule;
    }

    const stack: Token[] = [];
    const uniq = new Map<string, string[]>();

    let allowed: boolean = true;
    let i: number = 0;
    let index: number;
    let parent: AstRuleList = context as AstRuleList;
    let nested: boolean = false;
    let val: string;

    if (context?.typ !== EnumToken.StyleSheetNodeType && context?.typ !== EnumToken.RuleNodeType) {
        allowed = false;

        if (context?.typ === EnumToken.AtRuleNodeType) {
            const syntaxRule = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + (context as AstAtRule).nam);

            allowed = syntaxRule?.acceptAnyRule ?? false;

            if (!allowed) {
                const rules = syntaxRule?.getBlockRules?.();

                if (rules != null) {
                    for (const rule of rules) {
                        if (ValidationTokenEnum.PropertyType === rule.typ) {
                            if (
                                "block-contents" === (rule as ValidationPropertyToken).val ||
                                "rule-list" === (rule as ValidationPropertyToken).val
                            ) {
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
        if (parent?.typ === EnumToken.AtRuleNodeType && "media" === (parent as AstAtRule).nam) {
            parent = parent[PARENT] as AstRuleList;
            continue;
        }

        nested = parent?.typ == EnumToken.RuleNodeType;
        parent = parent?.[PARENT] as AstRuleList;
    } while (!nested && parent != null);

    const all = new Array(tokens.length);
    let write = 0;

    for (let read = 0; read < tokens.length; read++) {
        let token = tokens[read];

        if (token.typ == EnumToken.ColonTokenType) {
            const next = tokens[read + 1];

            if (next?.typ == EnumToken.IdenTokenType) {
                all[write++] = {
                    ...token,
                    typ: EnumToken.PseudoElementTokenType,
                    val: ":" + (next as IdentToken).val,
                    [LOCEND]: next[LOCEND],
                } as Token;
                read++;
                continue;
            }

            if (next?.typ == EnumToken.FunctionTokenDefType) {
                val = ":" + (next as IdentToken).val;

                all[write++] = {
                    ...token,
                    typ:
                        val + "()" in getSyntaxConfig().selectors
                            ? EnumToken.PseudoClassFunctionTokenDefType
                            : next.typ,
                    val,
                    [LOCEND]: next[LOCEND],
                } as Token;
                read++;
                continue;
            }
        }

        if (token.typ == EnumToken.DoubleColonTokenType) {
            const next = tokens[read + 1];
            val = ":" + (next as IdentToken).val;

            if (next?.typ == EnumToken.IdenTokenType) {
                all[write++] = {
                    ...token,
                    typ: EnumToken.PseudoClassTokenType,
                    val: (pseudoElements.includes(val) ? "" : ":") + val,
                    [LOCEND]: next[LOCEND],
                } as Token;
                read++;
                continue;
            }

            if (next?.typ == EnumToken.FunctionTokenDefType) {
                val = "::" + (next as IdentToken).val;
                all[write++] = {
                    ...token,
                    typ:
                        val + "()" in getSyntaxConfig().selectors
                            ? EnumToken.PseudoClassFunctionTokenDefType
                            : EnumToken.FunctionTokenDefType,
                    val,
                    [LOCEND]: next[LOCEND],
                } as Token;
                read++;
                continue;
            }
        }

        if (token.typ == EnumToken.ColorTokenType) {
            if (isHash((token as ColorToken).val)) {
                token.typ = EnumToken.HashTokenType;
                all[write++] = token as Token;
                continue;
            }

            return {
                typ: EnumToken.RuleNodeType,
                sel: [
                    ...tokens
                        .reduce(
                            (acc: string[][], curr: Token, index: number, array: Token[]) => {
                                if (curr.typ == EnumToken.WhitespaceTokenType) {
                                    if (
                                        trimWhiteSpace.includes(array[index - 1]?.typ) ||
                                        trimWhiteSpace.includes(array[index + 1]?.typ) ||
                                        combinators.includes((<LiteralToken>array[index - 1])?.val) ||
                                        combinators.includes((<LiteralToken>array[index + 1])?.val)
                                    ) {
                                        return acc;
                                    }
                                }

                                let t: string = renderValue(curr, { minify: false });

                                if (t == ",") {
                                    acc.push([]);
                                } else {
                                    acc[acc.length - 1].push(t);
                                }
                                return acc;
                            },
                            [[]],
                        )
                        .reduce((acc: Map<string, string[]>, curr: string[]) => {
                            let i: number = 0;

                            for (; i < curr.length; i++) {
                                if (i + 1 < curr.length && curr[i] == "*") {
                                    if (curr[i] == "*") {
                                        let index: number = curr[i + 1] == " " ? 2 : 1;

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
                ].join(","),
                chi: [],
                [LOCSRCID]: tokens[0][LOCSRCID],
                [LOCSTA]: tokens[0][LOCSTA],
                [LOCEND]: tokens[tokens.length - 1][LOCEND],
                [TOKENS]: tokens,
                [STATE]: EnumAstNodeStatus.Invalid,
                [ERRORS]: [
                    {
                        action: "drop",
                        node: token,
                        message: "invalid hash id",
                    },
                ],
            } as AstRule;
        }

        all[write++] = token;
    }

    if (write !== tokens.length) {
        for (let index = 0; index < write; index++) {
            tokens[index] = all[index];
        }

        tokens.length = write;
    }

    const result = matchSelectorSyntax(tokens, errors, options, nested === true);

    trimArray(tokens);

    if (result.success) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            switch (token.typ) {
                case EnumToken.AttrStartTokenType:
                    stack.push(token);
                    break;
                case EnumToken.AttrEndTokenType:
                    if (stack.at(-1)?.typ == EnumToken.AttrStartTokenType) {
                        index = tokens.indexOf(stack.at(-1)!);
                        // @ts-expect-error
                        const { val, ...attr } = stack.at(-1) as AttrStartToken;
                        attr[LOCSRCID] = stack.at(-1)![LOCSRCID];
                        attr[LOCSTA] = stack.at(-1)![LOCSTA];
                        attr[LOCEND] = token[LOCEND];

                        tokens.splice(i, 1);
                        Object.assign(attr, {
                            typ: EnumToken.AttrTokenType,
                            chi: tokens.splice(index + 1, i - index - 1),
                        });

                        tokens[index] = attr;
                        i = index;
                        stack.pop();
                    }

                    break;

                case EnumToken.PseudoClassFunctionTokenDefType:
                    stack.push(token);

                    break;

                case EnumToken.EndParensTokenType:
                    if (stack.at(-1)?.typ == EnumToken.PseudoClassFunctionTokenDefType) {
                        const func = stack.at(-1) as PseudoClassFunctionToken;
                        index = tokens.indexOf(func);
                        (stack.at(-1) as AttrStartToken)[LOCEND] = token[LOCEND];
                        tokens.splice(i, 1);

                        if (tokensfuncDefMap.has(func.typ)) {
                            // @ts-expect-error
                            func.typ = tokensfuncDefMap.get(func.typ) as EnumToken;
                            func.chi = trimArray(tokens.splice(index + 1, i - index - 1));
                        }

                        if (result.success && options.minify) {
                            // parse an+b
                            // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                            if (
                                func.val == ":nth-child" ||
                                func.val == ":nth-last-child" ||
                                func.val == ":nth-of-type" ||
                                func.val == ":nth-last-of-type"
                            ) {
                                const list: Token[] = [];
                                let index: number;

                                for (index = 0; index < func.chi.length; index++) {
                                    if (
                                        func.chi[index].typ == EnumToken.CommentTokenType ||
                                        func.chi[index].typ == EnumToken.WhitespaceTokenType
                                    ) {
                                        continue;
                                    }

                                    if (
                                        func.chi[index].typ == EnumToken.IdenTokenType &&
                                        equalsIgnoreCase("of", (func.chi[index] as IdentToken).val)
                                    ) {
                                        index--;
                                        break;
                                    }

                                    list.push(func.chi[index]);
                                }

                                if (list.length == 2) {
                                    if (list[1].typ == EnumToken.NumberTokenType) {
                                        if ((list[1] as NumberToken).val == 0) {
                                            list.length = 1;

                                            if (
                                                list[0].typ == EnumToken.DimensionTokenType &&
                                                (list[0] as DimensionToken).val == -2
                                            ) {
                                                (list[0] as DimensionToken).val = 2;
                                            }
                                        } else {
                                            const sign = Math.sign((list[1] as NumberToken).val as number);
                                            // @ts-ignore
                                            (list[1] as NumberToken).val *= sign;
                                            list.splice(1, 0, {
                                                typ: EnumToken.LiteralTokenType,
                                                val: sign > 0 ? "+" : "-",
                                            } as LiteralToken);
                                        }
                                    }

                                    if (
                                        list.length == 3 &&
                                        list[2].typ == EnumToken.NumberTokenType &&
                                        list[0].typ == EnumToken.DimensionTokenType &&
                                        (((list[0] as DimensionToken).val as number) == 2 ||
                                            (list[0] as DimensionToken).val == -2)
                                    ) {
                                        if (1 == (list[2] as NumberToken).val) {
                                            list.splice(0, 3, {
                                                typ: EnumToken.IdenTokenType,
                                                val: "odd",
                                                [LOCSRCID]: list[0][LOCSRCID],
                                                [LOCSTA]: list[0][LOCSTA],
                                                [LOCEND]: list[0][LOCEND],
                                            } as IdentToken);
                                        } else if (0 == (list[2] as NumberToken).val) {
                                            list.splice(0, 3, {
                                                typ: EnumToken.IdenTokenType,
                                                val: "even",
                                                [LOCSRCID]: list[0][LOCSRCID],
                                                [LOCSTA]: list[0][LOCSTA],
                                                [LOCEND]: list[0][LOCEND],
                                            } as IdentToken);
                                        }
                                    }

                                    func.chi.splice(0, index, ...list);
                                }

                                if (list.length == 1) {
                                    if (
                                        list[0].typ == EnumToken.IdenTokenType &&
                                        equalsIgnoreCase("-n", (list[0] as IdentToken).val)
                                    ) {
                                        (list[0] as IdentToken).val = "n";
                                    }
                                }

                                if (list.length == 3) {
                                    if (
                                        list[0].typ == EnumToken.IdenTokenType &&
                                        ("n" == (list[0] as IdentToken).val ||
                                            "-n" == (list[0] as IdentToken).val ||
                                            "+n" == (list[0] as IdentToken).val)
                                    ) {
                                        if (list[1].typ == EnumToken.NextSiblingCombinatorTokenType) {
                                            if (
                                                list[2].typ == EnumToken.NumberTokenType &&
                                                0 == (list[2] as NumberToken).val
                                            ) {
                                                (list[0] as IdentToken).val = "n";
                                                func.chi.splice(0, index, list[0]);
                                                break;
                                            }
                                        }
                                    }
                                }

                                const token = func.chi.find(
                                    (t) =>
                                        t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommentTokenType,
                                ) as Token;

                                if (token?.typ == EnumToken.IdenTokenType || token?.typ == EnumToken.LiteralTokenType) {
                                    if (
                                        token.typ == EnumToken.IdenTokenType &&
                                        ((token as IdentToken).val == "odd" || (token as IdentToken).val == "even")
                                    ) {
                                        if ((token as IdentToken).val == "even") {
                                            Object.assign(token, {
                                                typ: EnumToken.DimensionTokenType,
                                                val: 2,
                                                unit: "n",
                                            });
                                        }
                                    } else {
                                        const matches = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(
                                            (token as IdentToken | LiteralToken).val,
                                        );

                                        if (matches != null) {
                                            let [_, an, a, b]: string[] = matches;

                                            const a1 = matches[2] === "" ? 1 : matches[2] === "-" ? -1 : +matches[2];
                                            const b1 = +matches[3];

                                            if (b1 === 0) {
                                                Object.assign(
                                                    token,
                                                    Math.abs(a1) === 1
                                                        ? {
                                                              typ: EnumToken.IdenTokenType,
                                                              val: "n",
                                                          }
                                                        : {
                                                              typ: EnumToken.DimensionTokenType,
                                                              val: a1 * Math.sign(a1),
                                                              unit: "n",
                                                          },
                                                );
                                            }
                                        }
                                    }
                                } else if (token?.typ === EnumToken.DimensionTokenType) {
                                    const index: number = func.chi.indexOf(token);

                                    let sign: Token | null = null;
                                    let num: NumberToken | null = null;
                                    let i: number = index + 1;

                                    for (; i < func.chi.length; i++) {
                                        if (
                                            func.chi[i].typ == EnumToken.WhitespaceTokenType ||
                                            func.chi[i].typ == EnumToken.CommentTokenType
                                        ) {
                                            continue;
                                        }

                                        if (func.chi[i].typ == EnumToken.NumberTokenType) {
                                            num = func.chi[i] as NumberToken;
                                            break;
                                        } else {
                                            sign = func.chi[i];
                                        }
                                    }

                                    if (num != null) {
                                        if (num.val === 0) {
                                            func.chi.splice(index + 1, i - index);

                                            if (((token as DimensionToken).val as number) < 0) {
                                                ((token as DimensionToken).val as number) *= -1;
                                            }
                                            break;
                                        } else if (
                                            ((token as DimensionToken).val as number) === 2 &&
                                            Math.abs(num.val as number) === 1
                                        ) {
                                            Object.assign(token, {
                                                typ: EnumToken.IdenTokenType,
                                                val: "odd",
                                            });

                                            func.chi.splice(index + 1, i - index);
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

                        i = index;
                        stack.pop();
                    }

                    break;
            }
        }
    }

    return {
        typ: EnumToken.RuleNodeType,
        sel: [
            ...tokens
                .reduce(
                    (acc: string[][], curr: Token, index: number, array: Token[]) => {
                        // if (curr.typ == EnumToken.CommentTokenType) {
                        //     return acc;
                        // }

                        if (curr.typ == EnumToken.WhitespaceTokenType) {
                            if (
                                trimWhiteSpace.includes(array[index - 1]?.typ) ||
                                trimWhiteSpace.includes(array[index + 1]?.typ) ||
                                combinators.includes((<LiteralToken>array[index - 1])?.val) ||
                                combinators.includes((<LiteralToken>array[index + 1])?.val)
                            ) {
                                return acc;
                            }
                        }

                        let t: string = renderValue(curr, { minify: false });

                        if (t == ",") {
                            acc.push([]);
                        } else {
                            acc[acc.length - 1].push(t);
                        }
                        return acc;
                    },
                    [[]],
                )
                .reduce((acc: Map<string, string[]>, curr: string[]) => {
                    let i: number = 0;

                    for (; i < curr.length; i++) {
                        if (i + 1 < curr.length && curr[i] == "*") {
                            if (curr[i] == "*") {
                                let index: number = curr[i + 1] == " " ? 2 : 1;

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
        ].join(","),
        chi: [],
        [LOCSRCID]: tokens[0][LOCSRCID],
        [LOCSTA]: tokens[0][LOCSTA],
        [LOCEND]: tokens[tokens.length - 1][LOCEND],
        [TOKENS]: tokens,
        [STATE]:
            result.success && allowed
                ? EnumAstNodeStatus.Validated
                : allowed
                  ? EnumAstNodeStatus.Invalid
                  : EnumAstNodeStatus.Disallowed,
        [ERRORS]: result.success ? [] : result.errors,
    } as AstRule;
}
