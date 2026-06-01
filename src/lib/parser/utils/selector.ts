import type {
    Token,
    AstRule,
    AstAtRule,
    AstKeyFrameRule,
    AstKeyframesAtRule,
    AstStyleSheet,
    ParserOptions,
    ErrorDescription,
    AstInvalidRule,
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
import { EnumToken } from "../../ast/types.ts";
import { renderToken } from "../../renderer/render.ts";
import { combinators, definedPropertySettings, tokensfuncDefMap } from "../../syntax/constants.ts";
import { isHash, isIdent, pseudoElements } from "../../syntax/syntax.ts";
import { getParsedSyntax, getSyntaxConfig } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntax, matchSelectorSyntax, trimArray } from "../../validation/match.ts";

import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import { splitTokenList } from "../../validation/utils/list.ts";
import { trimWhiteSpace } from "../parse.ts";

/**
 * parse selector
 */

export function parseSelector(
    tokens: Token[],
    context: AtRuleToken | AstRule | AstAtRule | AstKeyFrameRule | AstKeyframesAtRule | AstStyleSheet | null,
    options: ParserOptions,
    errors: ErrorDescription[],
): AstRule | AstInvalidRule | AstKeyFrameRule {
    if (context?.typ === EnumToken.KeyframesAtRuleNodeType) {
        const result = matchAllSyntax(
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
                        filtered[0] = Object.defineProperty(
                            {
                                typ: EnumToken.PercentageTokenType,
                                val: 0,
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: filtered[0].loc,
                            },
                        );
                    } else if (
                        filtered[0].typ === EnumToken.PercentageTokenType &&
                        100 === (filtered[0] as PercentageToken).val
                    ) {
                        filtered[0] = Object.defineProperty(
                            {
                                typ: EnumToken.IdenTokenType,
                                val: "to",
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: filtered[0].loc,
                            },
                        );
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

                acc.push(...curr);
                return acc;
            }, [] as Token[]),
        );

        return Object.defineProperties(
            {
                typ: result.success ? EnumToken.KeyFramesRuleNodeType : EnumToken.InvalidRuleNodeType,
                sel: [
                    ...splitTokenList(trimArray(tokens)).reduce((acc, curr: Token[]) => {
                        acc.add(curr.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), ""));
                        return acc;
                    }, new Set<string>()),
                ].join(),
                chi: [],
            },
            {
                tokens: { ...definedPropertySettings, value: tokens.length === 0 ? null : tokens },
                loc: {
                    ...definedPropertySettings,
                    value: {
                        ...tokens[0].loc,
                        end: { ...(tokens[tokens.length - 1]?.loc?.end ?? tokens[0]?.loc?.end) },
                    },
                },
            },
        );
    }

    const stack: Token[] = [];
    const uniq = new Map<string, string[]>();

    let i: number = 0;
    let index: number;
    let parent: AstRuleList = context as AstRuleList;
    let nested: boolean = false;
    let val: string;

    do {
        if (parent?.typ === EnumToken.AtRuleNodeType && "media" === (parent as AstAtRule).nam) {
            parent = parent.parent;
            continue;
        }

        nested = parent?.typ == EnumToken.RuleNodeType;
        parent = parent?.parent;
    } while (!nested && parent != null);

    for (; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.ColonTokenType) {
            if (tokens[i + 1]?.typ == EnumToken.IdenTokenType) {
                Object.assign(tokens[i], {
                    typ: EnumToken.PseudoElementTokenType,
                    val: ":" + (tokens[i + 1] as IdentToken).val,
                });

                tokens[i].loc!.end = tokens[i + 1]!.loc!.end;
                tokens.splice(i + 1, 1);
                continue;
            }

            if (tokens[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = ":" + (tokens[i + 1] as IdentToken).val;

                Object.assign(tokens[i], {
                    typ:
                        val + "()" in getSyntaxConfig().selectors
                            ? EnumToken.PseudoClassFunctionTokenDefType
                            : tokens[i + 1].typ,
                    val,
                });

                tokens[i].loc!.end = tokens[i + 1]!.loc!.end;
                tokens.splice(i + 1, 1);
                continue;
            }
        }

        if (tokens[i].typ == EnumToken.DoubleColonTokenType) {
            val = ":" + (tokens[i + 1] as IdentToken).val;
            if (tokens[i + 1]?.typ == EnumToken.IdenTokenType) {
                Object.assign(tokens[i], {
                    typ: EnumToken.PseudoClassTokenType,
                    val: (pseudoElements.includes(val) ? "" : ":") + val,
                });

                tokens[i].loc!.end = tokens[i + 1]!.loc!.end;
                tokens.splice(i + 1, 1);
                continue;
            }

            if (tokens[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = "::" + (tokens[i + 1] as IdentToken).val;
                Object.assign(tokens[i], {
                    typ:
                        val + "()" in getSyntaxConfig().selectors
                            ? EnumToken.PseudoClassFunctionTokenDefType
                            : EnumToken.FunctionTokenDefType,
                    val,
                });

                tokens[i].loc!.end = tokens[i + 1]!.loc!.end;
                tokens.splice(i + 1, 1);
                continue;
            }
        }

        if (tokens[i].typ == EnumToken.ColorTokenType) {
            if (isIdent((tokens[i] as ColorToken).val)) {
                Object.assign(tokens[i], {
                    typ: EnumToken.IdenTokenType,
                });
            } else if (isHash((tokens[i] as ColorToken).val)) {
                Object.assign(tokens[i], {
                    typ: EnumToken.HashTokenType,
                });
            }
        }
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

                        Object.defineProperty(attr, "loc", {
                            ...definedPropertySettings,
                            value: {
                                ...stack.at(-1)!.loc!,
                                end: token.loc!.end,
                            },
                        });

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
                        (stack.at(-1) as AttrStartToken).loc!.end = token.loc!.end;
                        tokens.splice(i, 1);
                        Object.assign(func, {
                            typ: EnumToken.PseudoClassFuncTokenType,
                            chi: tokens.splice(index + 1, i - index - 1),
                        });

                        if (result.success && options.minify) {
                            // parse an+b
                            // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                            if (
                                func.val == ":nth-child" ||
                                func.val == ":nth-last-child" ||
                                func.val == ":nth-of-type" ||
                                func.val == ":nth-last-of-type"
                            ) {
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
                                        if (!/\d+$/.test((token as IdentToken | LiteralToken).val)) {
                                            let index = func.chi.indexOf(token);
                                            let i: number = index + 1;
                                            let sign: Token | null = null;
                                            let num: NumberToken | null = null;

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
                                                    sign = func.chi[i] as Token;
                                                }
                                            }

                                            if (num != null) {
                                                if (num.val === 0) {
                                                    func.chi.splice(index + 1, i - index);
                                                    if ((token as IdentToken | LiteralToken).val == "-n") {
                                                        (token as IdentToken).val = "n";
                                                    }
                                                    break;
                                                }

                                                // else if ((token as DimensionToken).val === 0) {

                                                //         func.chi.splice(0, i);
                                                //         break;
                                                // }

                                                // else if (Math.abs((token as DimensionToken).val as number) === 1) {

                                                //     Object.assign(token, {
                                                //         typ: EnumToken.IdenTokenType,
                                                //         val: (token as DimensionToken).val === 1 ? "n" : "-n",
                                                //     })
                                                // }

                                                if (sign == null) {
                                                    func.chi.splice(index + 1, i - index - 1);
                                                    if (Math.sign(num.val as number) === 1) {
                                                        func.chi.splice(index + 1, 0, {
                                                            typ: EnumToken.LiteralTokenType,
                                                            val: "+",
                                                        });
                                                    }
                                                }
                                            } else if ((token as IdentToken | LiteralToken).val == "-n") {
                                                (token as IdentToken).val = "n";
                                            }

                                            break;
                                        }

                                        const matches = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(
                                            (token as IdentToken | LiteralToken).val,
                                        );

                                        if (matches != null) {
                                            let [_, an, a, b]: string[] = matches;

                                            const a1 = matches[2] === "" ? 1 : matches[2] === "-" ? -1 : +matches[2];
                                            const b1 = +matches[3];

                                            if (a1 === 0) {
                                                if (b1 === 1) {
                                                    let hasSelector: boolean = false;
                                                    let i: number = func.chi.indexOf(token);
                                                    let j: number = i + 1;

                                                    for (; j < func.chi.length; j++) {
                                                        if (
                                                            func.chi[j].typ == EnumToken.IdenTokenType &&
                                                            (func.chi[j] as IdentToken).val == "of"
                                                        ) {
                                                            hasSelector = true;
                                                            break;
                                                        }
                                                    }

                                                    if (hasSelector) {
                                                        Object.assign(token, {
                                                            typ: EnumToken.NumberTokenType,
                                                            val: b1,
                                                        });
                                                    } else {
                                                        // :first-child
                                                        tokens[tokens.indexOf(func)] = Object.defineProperties(
                                                            {
                                                                typ: EnumToken.PseudoClassTokenType,
                                                                val: ":first-child",
                                                            },
                                                            {
                                                                loc: {
                                                                    ...definedPropertySettings,
                                                                    value: func.loc,
                                                                },
                                                            },
                                                        );
                                                    }

                                                    break;
                                                } else {
                                                    Object.assign(token, { typ: EnumToken.NumberTokenType, val: b1 });
                                                }
                                            } else if (b1 === 0) {
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
                                            } else if (Math.abs(a1) === 2) {
                                                if (b1 === 0) {
                                                    Object.assign(token, {
                                                        typ: EnumToken.DimensionTokenType,
                                                        val: a1,
                                                        unit: "n",
                                                    });
                                                } else if (Math.abs(b1) === 1) {
                                                    Object.assign(token, { typ: EnumToken.IdenTokenType, val: "odd" });
                                                }
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
                                        if ((token as DimensionToken).val === 0) {
                                            if (num.val === 0) {
                                                func.chi.splice(0, i);
                                            } else if (num.val === 1) {
                                                let hasSelector: boolean = false;
                                                let j: number = i + 1;

                                                for (; j < func.chi.length; j++) {
                                                    if (
                                                        func.chi[j].typ == EnumToken.IdenTokenType &&
                                                        (func.chi[j] as IdentToken).val == "of"
                                                    ) {
                                                        hasSelector = true;
                                                        break;
                                                    }
                                                }

                                                if (hasSelector) {
                                                    func.chi.splice(0, i);
                                                } else {
                                                    tokens[tokens.indexOf(func)] = Object.defineProperties(
                                                        {
                                                            typ: EnumToken.PseudoClassTokenType,
                                                            val: ":first-child",
                                                        },
                                                        {
                                                            loc: {
                                                                ...definedPropertySettings,
                                                                value: func.loc,
                                                            },
                                                        },
                                                    );
                                                }

                                                break;
                                            } else {
                                                func.chi.splice(0, i);
                                            }

                                            break;
                                        } else if (num.val === 0) {
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

                                        if (((token as DimensionToken).val as number) === 1) {
                                            Object.assign(token, {
                                                typ: EnumToken.IdenTokenType,
                                                val:
                                                    Math.sign((token as DimensionToken).val as number) === 1
                                                        ? "n"
                                                        : "-n",
                                            });
                                        }

                                        if (sign == null) {
                                            func.chi.splice(index + 1, i - index - 1);
                                            if (Math.sign(num.val as number) === 1) {
                                                func.chi.splice(index + 1, 0, {
                                                    typ: EnumToken.LiteralTokenType,
                                                    val: "+",
                                                });
                                            }
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
    }

    // else {

    //     console.error(JSON.stringify({tokens,result}, null, 1));
    // }

    return Object.defineProperties(
        {
            typ: result.success ? EnumToken.RuleNodeType : EnumToken.InvalidRuleNodeType,
            sel: [
                ...tokens
                    .reduce(
                        (acc: string[][], curr: Token, index: number, array: Token[]) => {
                            if (curr.typ == EnumToken.CommentTokenType) {
                                return acc;
                            }

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

                            let t: string = renderToken(curr, { minify: false });

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
        },
        {
            tokens: { ...definedPropertySettings, value: tokens },
            loc: {
                ...definedPropertySettings,
                value: {
                    ...tokens[0].loc,
                    end: tokens[tokens.length - 1].loc!.end,
                },
            },
        },
    );
}
