import type { AstKeyframesRule, AstNode, AstRule, Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import type { AstArena } from "../../ast/arena.ts";
import { renderValue } from "../../printer/render.ts";
import { combinators, pseudoElements, tokensfuncDefMap } from "../../syntax/constants.ts";
import { isHash } from "../../syntax/syntax.ts";
import { getParsedSyntax, getSyntaxConfig, getSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, matchSelectorSyntax, trimArray } from "../../validation/match.ts";

import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "../../validation/parser/typedef.ts";
import type { ValidationPropertyToken } from "../../validation/parser/types.d.ts";
import { splitTokenList } from "../../validation/utils/list.ts";
import { trimWhiteSpace } from "../parse.ts";
import { equalsIgnoreCase } from "./text.ts";

/**
 * minify the an+b expression of a pseudo class function
 * @param arena
 * @param func
 */
function minifyNthExpression(arena: AstArena, func: Token): void {
    const chi: Token[] = arena.tokens(func);
    const list: Token[] = [];
    let index: number;

    for (index = 0; index < chi.length; index++) {
        if (
            arena.dataTypes[chi[index]] == EnumToken.CommentTokenType ||
            arena.dataTypes[chi[index]] == EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        if (
            arena.dataTypes[chi[index]] == EnumToken.IdenTokenType &&
            equalsIgnoreCase("of", arena.strings[arena.stringValue[chi[index]]])
        ) {
            index--;
            break;
        }

        list.push(chi[index]);
    }

    if (list.length == 2) {
        if (arena.dataTypes[list[1]] == EnumToken.NumberTokenType) {
            if (arena.numericValue[list[1]] == 0) {
                list.length = 1;

                if (arena.dataTypes[list[0]] == EnumToken.DimensionTokenType && arena.numericValue[list[0]] == -2) {
                    arena.numericValue[list[0]] = 2;
                }
            } else {
                const sign = Math.sign(arena.numericValue[list[1]]);

                arena.numericValue[list[1]] *= sign;
                list.splice(1, 0, arena.createToken(EnumToken.LiteralTokenType, sign > 0 ? "+" : "-"));
            }
        }

        if (
            list.length == 3 &&
            arena.dataTypes[list[2]] == EnumToken.NumberTokenType &&
            arena.dataTypes[list[0]] == EnumToken.DimensionTokenType &&
            (arena.numericValue[list[0]] == 2 || arena.numericValue[list[0]] == -2)
        ) {
            if (1 == arena.numericValue[list[2]]) {
                const ident: Token = arena.createToken(EnumToken.IdenTokenType, "odd");

                arena.copyLocation(ident, list[0]);
                list.splice(0, 3, ident);
            } else if (0 == arena.numericValue[list[2]]) {
                const ident: Token = arena.createToken(EnumToken.IdenTokenType, "even");

                arena.copyLocation(ident, list[0]);
                list.splice(0, 3, ident);
            }
        }

        chi.splice(0, index, ...list);
    }

    if (list.length == 1) {
        if (
            arena.dataTypes[list[0]] == EnumToken.IdenTokenType &&
            equalsIgnoreCase("-n", arena.strings[arena.stringValue[list[0]]])
        ) {
            arena.setStr(list[0], "n");
        }
    }

    if (list.length == 3) {
        if (
            arena.dataTypes[list[0]] == EnumToken.IdenTokenType &&
            ("n" == arena.strings[arena.stringValue[list[0]]] ||
                "-n" == arena.strings[arena.stringValue[list[0]]] ||
                "+n" == arena.strings[arena.stringValue[list[0]]])
        ) {
            if (arena.dataTypes[list[1]] == EnumToken.NextSiblingCombinatorTokenType) {
                if (arena.dataTypes[list[2]] == EnumToken.NumberTokenType && 0 == arena.numericValue[list[2]]) {
                    arena.setStr(list[0], "n");
                    chi.splice(0, index, list[0]);
                    arena.setTokenList(func, chi);
                    return;
                }
            }
        }
    }

    const token: Token | undefined = chi.find(
        (t: Token) => arena.dataTypes[t] != EnumToken.WhitespaceTokenType && arena.dataTypes[t] != EnumToken.CommentTokenType,
    );

    if (token != null) {
        if (arena.dataTypes[token] == EnumToken.IdenTokenType || arena.dataTypes[token] == EnumToken.LiteralTokenType) {
            const val: string = arena.strings[arena.stringValue[token]];

            if (arena.dataTypes[token] == EnumToken.IdenTokenType && (val == "odd" || val == "even")) {
                if (val == "even") {
                    arena.resetToken(token, EnumToken.DimensionTokenType, 2, "n");
                }
            } else {
                const matches = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(val);

                if (matches != null) {
                    const a1 = matches[2] === "" ? 1 : matches[2] === "-" ? -1 : +matches[2];
                    const b1 = +matches[3];

                    if (b1 === 0) {
                        if (Math.abs(a1) === 1) {
                            arena.resetToken(token, EnumToken.IdenTokenType, "n");
                        } else {
                            arena.resetToken(token, EnumToken.DimensionTokenType, a1 * Math.sign(a1), "n");
                        }
                    }
                }
            }
        } else if (arena.dataTypes[token] === EnumToken.DimensionTokenType) {
            const index: number = chi.indexOf(token);

            let num: Token | null = null;
            let i: number = index + 1;

            for (; i < chi.length; i++) {
                if (
                    arena.dataTypes[chi[i]] == EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[chi[i]] == EnumToken.CommentTokenType
                ) {
                    continue;
                }

                if (arena.dataTypes[chi[i]] == EnumToken.NumberTokenType) {
                    num = chi[i];
                    break;
                }
            }

            if (num != null) {
                if (arena.numericValue[num] === 0) {
                    chi.splice(index + 1, i - index);

                    if (arena.numericValue[token] < 0) {
                        arena.numericValue[token] *= -1;
                    }
                } else if (arena.numericValue[token] === 2 && Math.abs(arena.numericValue[num]) === 1) {
                    arena.resetToken(token, EnumToken.IdenTokenType, "odd");
                    chi.splice(index + 1, i - index);
                }
            }
        }
    }

    arena.setTokenList(func, chi);
}

/**
 * parse selector
 * @param arena
 * @param tokens
 * @param context parent node id
 * @param options
 * @param errors
 */

export function parseSelector(
    arena: AstArena,
    tokens: Token[],
    context: AstNode | null,
    options: ParserOptions,
    errors: ErrorDescription[],
): AstRule | AstKeyframesRule {
    const contextType: EnumToken | null = context == null ? null : arena.dataTypes[context];

    if (contextType === EnumToken.KeyframesAtRuleNodeType) {
        const result = matchAllSyntaxes(
            arena,
            getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "keyframe-selectors"),
            createValidationContext(arena, tokens),
            options,
        );

        const parts: Token[][] = splitTokenList(arena, tokens);

        for (const part of parts) {
            trimArray(arena, part);

            if (options.minify) {
                const filtered = part.filter(
                    (token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType,
                );

                if (filtered.length === 1) {
                    if (
                        arena.dataTypes[filtered[0]] === EnumToken.IdenTokenType &&
                        "from" === arena.strings[arena.stringValue[filtered[0]]].toLowerCase()
                    ) {
                        arena.resetToken(filtered[0], EnumToken.PercentageTokenType, 0);
                    } else if (
                        arena.dataTypes[filtered[0]] === EnumToken.PercentageTokenType &&
                        100 === arena.numericValue[filtered[0]]
                    ) {
                        arena.resetToken(filtered[0], EnumToken.IdenTokenType, "to");
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
                    acc.push(arena.createToken(EnumToken.CommaTokenType));
                }

                for (const c of curr) {
                    acc.push(c);
                }

                return acc;
            }, [] as Token[]),
        );

        const node: AstKeyframesRule = arena.createRule(
            EnumToken.KeyframesRuleNodeType,
            [
                ...splitTokenList(arena, trimArray(arena, tokens)).reduce((acc, curr: Token[]) => {
                    acc.add(curr.reduce((acc, curr) => acc + renderValue(arena, curr, { minify: false }), ""));
                    return acc;
                }, new Set<string>()),
            ].join(),
            tokens.length === 0 ? null : tokens,
            result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
            result.errors,
        );

        arena.setLocation(node, arena.getSource(tokens[0]), arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
        return node;
    }

    const stack: Token[] = [];

    let allowed: boolean = true;
    let index: number;
    let parent: AstNode | null = context;
    let nested: boolean = false;
    let val: string;

    if (contextType !== EnumToken.StyleSheetNodeType && contextType !== EnumToken.RuleNodeType) {
        allowed = false;

        if (contextType === EnumToken.AtRuleNodeType) {
            const syntaxRule = getSyntaxRule(
                ValidationSyntaxGroupEnum.AtRules,
                "@" + arena.strings[arena.name[context as AstNode]],
            );

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

    while (parent != null && parent > 0) {
        if (arena.dataTypes[parent] === EnumToken.AtRuleNodeType && "media" === arena.strings[arena.name[parent]]) {
            parent = arena.parents[parent];
            continue;
        }

        nested = arena.dataTypes[parent] == EnumToken.RuleNodeType;

        if (nested) {
            break;
        }

        parent = arena.parents[parent];
    }

    const all = new Array(tokens.length);
    let write = 0;

    for (let read = 0; read < tokens.length; read++) {
        let token = tokens[read];

        if (arena.dataTypes[token] == EnumToken.ColonTokenType) {
            const next = tokens[read + 1];

            if (arena.dataTypes[next] == EnumToken.IdenTokenType) {
                arena.dataTypes[token] = EnumToken.PseudoElementTokenType;
                arena.setStr(token, ":" + arena.strings[arena.stringValue[next]]);
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }

            if (arena.dataTypes[next] == EnumToken.FunctionTokenDefType) {
                val = ":" + arena.strings[arena.stringValue[next]];

                arena.dataTypes[token] =
                    val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : arena.dataTypes[next];
                arena.setStr(token, val);
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }
        }

        if (arena.dataTypes[token] == EnumToken.DoubleColonTokenType) {
            const next = tokens[read + 1];
            val = ":" + arena.strings[arena.stringValue[next]];

            if (arena.dataTypes[next] == EnumToken.IdenTokenType) {
                arena.dataTypes[token] = EnumToken.PseudoClassTokenType;
                arena.setStr(token, (pseudoElements.includes(val) ? "" : ":") + val);
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }

            if (arena.dataTypes[next] == EnumToken.FunctionTokenDefType) {
                val = "::" + arena.strings[arena.stringValue[next]];
                arena.dataTypes[token] =
                    val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : EnumToken.FunctionTokenDefType;
                arena.setStr(token, val);
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }
        }

        if (arena.dataTypes[token] == EnumToken.ColorTokenType) {
            if (isHash(arena.strings[arena.stringValue[token]])) {
                arena.dataTypes[token] = EnumToken.HashTokenType;
                all[write++] = token;
                continue;
            }

            const node: AstRule = arena.createRule(
                EnumToken.RuleNodeType,
                renderSelector(arena, tokens),
                tokens,
                EnumAstNodeStatus.Invalid,
                [
                    {
                        action: "drop",
                        node: token,
                        message: "invalid hash id",
                    },
                ],
            );

            arena.setLocation(node, arena.getSource(tokens[0]), arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
            return node;
        }

        all[write++] = token;
    }

    if (write !== tokens.length) {
        for (let index = 0; index < write; index++) {
            tokens[index] = all[index];
        }

        tokens.length = write;
    }

    const result = matchSelectorSyntax(arena, tokens, errors, options, nested);

    trimArray(arena, tokens);

    if (result.success) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            switch (arena.dataTypes[token]) {
                case EnumToken.AttrStartTokenType:
                    stack.push(token);
                    break;
                case EnumToken.AttrEndTokenType:
                    if (arena.typeOf(stack.at(-1)) == EnumToken.AttrStartTokenType) {
                        const attr: Token = stack[stack.length - 1];

                        index = tokens.indexOf(attr);
                        arena.spanLocation(attr, attr, token);
                        tokens.splice(i, 1);
                        arena.dataTypes[attr] = EnumToken.AttrTokenType;
                        arena.stringValue[attr] = 0;
                        arena.setTokenList(attr, tokens.splice(index + 1, i - index - 1));

                        i = index;
                        stack.pop();
                    }

                    break;

                case EnumToken.PseudoClassFunctionTokenDefType:
                    stack.push(token);

                    break;

                case EnumToken.EndParensTokenType:
                    if (arena.typeOf(stack.at(-1)) == EnumToken.PseudoClassFunctionTokenDefType) {
                        const func: Token = stack[stack.length - 1];
                        index = tokens.indexOf(func);
                        arena.spanLocation(func, func, token);
                        tokens.splice(i, 1);

                        if (tokensfuncDefMap.has(arena.dataTypes[func])) {
                            arena.dataTypes[func] = tokensfuncDefMap.get(arena.dataTypes[func]) as EnumToken;
                            arena.setTokenList(func, trimArray(arena, tokens.splice(index + 1, i - index - 1)));
                        }

                        if (result.success && options.minify) {
                            // parse an+b
                            // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                            const name: string = arena.strings[arena.stringValue[func]];

                            if (
                                name == ":nth-child" ||
                                name == ":nth-last-child" ||
                                name == ":nth-of-type" ||
                                name == ":nth-last-of-type"
                            ) {
                                minifyNthExpression(arena, func);
                            }
                        }

                        i = index;
                        stack.pop();
                    }

                    break;
            }
        }
    }

    const node: AstRule = arena.createRule(
        EnumToken.RuleNodeType,
        renderSelector(arena, tokens),
        tokens,
        result.success && allowed
            ? EnumAstNodeStatus.Validated
            : allowed
              ? EnumAstNodeStatus.Invalid
              : EnumAstNodeStatus.Disallowed,
        result.success ? [] : result.errors,
    );

    arena.setLocation(node, arena.getSource(tokens[0]), arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
    return node;
}

// options of the rendering of the selector tokens
const selectorRenderOptions: ParserOptions = { minify: false };

/**
 * selector of a rule: the distinct comma separated selectors, the whitespace around the combinators is removed.
 * a universal selector is removed before a compound selector
 * @param arena
 * @param tokens
 */
function renderSelector(arena: AstArena, tokens: Token[]): string {
    // the distinct selectors, in order
    const selectors: Set<string> = new Set();
    // rendered tokens of the current selector
    let part: string[] = [];

    for (let index = 0; index < tokens.length; index++) {
        const curr: Token = tokens[index];

        if (arena.dataTypes[curr] == EnumToken.WhitespaceTokenType) {
            if (
                trimWhiteSpace.includes(arena.dataTypes[tokens[index - 1]]) ||
                trimWhiteSpace.includes(arena.dataTypes[tokens[index + 1]]) ||
                combinators.includes(arena.str(tokens[index - 1]) as string) ||
                combinators.includes(arena.str(tokens[index + 1]) as string)
            ) {
                continue;
            }
        }

        const t: string = renderValue(arena, curr, selectorRenderOptions);

        if (t == ",") {
            addSelector(selectors, part);
            part = [];
        } else {
            part.push(t);
        }
    }

    addSelector(selectors, part);

    let result: string = "";
    let first: boolean = true;

    for (const selector of selectors) {
        result = first ? selector : result + "," + selector;
        first = false;
    }

    return result;
}

/**
 * add a selector from its rendered tokens
 * @param selectors
 * @param curr
 */
function addSelector(selectors: Set<string>, curr: string[]): void {
    for (let i: number = 0; i < curr.length; i++) {
        if (i + 1 < curr.length && curr[i] == "*") {
            const index: number = curr[i + 1] == " " ? 2 : 1;

            if (![">", "~", "+"].includes(curr[index])) {
                curr.splice(i, index);
            }
        }
    }

    selectors.add(curr.join(""));
}
