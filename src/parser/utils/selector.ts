import type {
    AstKeyframesRule,
    AstNode,
    AstRule,
    Token,
    ErrorDescription,
    ParserOptions,
} from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import type { AstArena } from "../../ast/arena.ts";
import { StringBuilder } from "../../ast/strings.ts";
import { renderValue } from "../../printer/render.ts";
import { combinators, pseudoElements, tokensfuncDefMap, isFunctionDefType } from "../../syntax/constants.ts";
import { isHash, isIdent } from "../../syntax/syntax.ts";
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
            arena.dataTypes[chi[index]] === EnumToken.CommentTokenType ||
            arena.dataTypes[chi[index]] === EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        if (
            arena.dataTypes[chi[index]] === EnumToken.IdenTokenType &&
            equalsIgnoreCase("of", arena.resolveString(arena.stringValue[chi[index]]))
        ) {
            index--;
            break;
        }

        list.push(chi[index]);
    }

    if (list.length === 2) {
        if (arena.dataTypes[list[1]] === EnumToken.NumberTokenType) {
            if (arena.numericValue[list[1]] === 0) {
                list.length = 1;

                if (arena.dataTypes[list[0]] === EnumToken.DimensionTokenType && arena.numericValue[list[0]] === -2) {
                    arena.numericValue[list[0]] = 2;
                }
            } else {
                const sign = Math.sign(arena.numericValue[list[1]]);

                arena.numericValue[list[1]] *= sign;
                list.splice(1, 0, arena.createToken(EnumToken.LiteralTokenType, sign > 0 ? "+" : "-"));
            }
        }

        if (
            list.length === 3 &&
            arena.dataTypes[list[2]] === EnumToken.NumberTokenType &&
            arena.dataTypes[list[0]] === EnumToken.DimensionTokenType &&
            (arena.numericValue[list[0]] === 2 || arena.numericValue[list[0]] === -2)
        ) {
            if (1 === arena.numericValue[list[2]]) {
                const ident: Token = arena.createToken(EnumToken.IdenTokenType, "odd");

                arena.copyLocation(ident, list[0]);
                list.splice(0, 3, ident);
            } else if (0 === arena.numericValue[list[2]]) {
                const ident: Token = arena.createToken(EnumToken.IdenTokenType, "even");

                arena.copyLocation(ident, list[0]);
                list.splice(0, 3, ident);
            }
        }

        chi.splice(0, index, ...list);
    }

    if (list.length === 1) {
        if (
            arena.dataTypes[list[0]] === EnumToken.IdenTokenType &&
            equalsIgnoreCase("-n", arena.resolveString(arena.stringValue[list[0]]))
        ) {
            // inlined: arena.setStr(list[0], "n")
            arena.stringValue[list[0]] = arena.internString("n");
        }
    }

    if (list.length === 3) {
        if (
            arena.dataTypes[list[0]] === EnumToken.IdenTokenType &&
            ("n" === arena.resolveString(arena.stringValue[list[0]]) ||
                "-n" === arena.resolveString(arena.stringValue[list[0]]) ||
                "+n" === arena.resolveString(arena.stringValue[list[0]]))
        ) {
            if (arena.dataTypes[list[1]] === EnumToken.NextSiblingCombinatorTokenType) {
                if (arena.dataTypes[list[2]] === EnumToken.NumberTokenType && 0 === arena.numericValue[list[2]]) {
                    // inlined: arena.setStr(list[0], "n")
                    arena.stringValue[list[0]] = arena.internString("n");
                    chi.splice(0, index, list[0]);
                    arena.setTokenList(func, chi);
                    return;
                }
            }
        }
    }

    const token: Token | undefined = chi.find(
        (t: Token) =>
            arena.dataTypes[t] !== EnumToken.WhitespaceTokenType && arena.dataTypes[t] !== EnumToken.CommentTokenType,
    );

    if (token != null) {
        if (
            arena.dataTypes[token] === EnumToken.IdenTokenType ||
            arena.dataTypes[token] === EnumToken.LiteralTokenType
        ) {
            const val: string = arena.resolveString(arena.stringValue[token]);

            if (arena.dataTypes[token] === EnumToken.IdenTokenType && (val === "odd" || val === "even")) {
                if (val === "even") {
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
                    arena.dataTypes[chi[i]] === EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[chi[i]] === EnumToken.CommentTokenType
                ) {
                    continue;
                }

                if (arena.dataTypes[chi[i]] === EnumToken.NumberTokenType) {
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
 * split the unicode ranges of a selector: `u+a` is the element `u` followed by the element `a`, not a unicode range
 * @param arena
 * @param tokens
 */
function splitUnicodeRanges(arena: AstArena, tokens: Token[]): void {
    for (let i = 0; i < tokens.length; i++) {
        const token: Token = tokens[i];

        if (arena.dataTypes[token] === EnumToken.UniCodeRange) {
            const text: string = arena.resolveString(arena.stringValue[token]);
            const rest: string = text.slice(2);
            const split: Token[] = [
                arena.createToken(EnumToken.IdenTokenType, text.charAt(0)),
                arena.createToken(EnumToken.Plus, "+"),
                arena.createToken(isIdent(rest) ? EnumToken.IdenTokenType : EnumToken.LiteralTokenType, rest),
            ];

            for (const t of split) {
                arena.copyLocation(t, token);
            }

            tokens.splice(i, 1, ...split);
            i += split.length - 1;
        } else if (arena.firstToken[token] !== 0) {
            // `:is(u+a)`
            const children: Token[] = arena.tokens(token);

            if (
                children.some(
                    (child: Token) =>
                        arena.dataTypes[child] === EnumToken.UniCodeRange || arena.firstToken[child] !== 0,
                )
            ) {
                const length: number = children.length;

                splitUnicodeRanges(arena, children);

                if (children.length !== length) {
                    arena.setTokenList(token, children);
                }
            }
        }
    }
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

    splitUnicodeRanges(arena, tokens);

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
                    (token) =>
                        arena.dataTypes[token] !== EnumToken.WhitespaceTokenType &&
                        arena.dataTypes[token] !== EnumToken.CommentTokenType,
                );

                if (filtered.length === 1) {
                    if (
                        arena.dataTypes[filtered[0]] === EnumToken.IdenTokenType &&
                        "from" === arena.resolveString(arena.stringValue[filtered[0]]).toLowerCase()
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

        // inlined: arena.getSource(tokens[0])
        arena.setLocation(
            node,
            arena.sources[arena.getSourceId(tokens[0])] ?? 0,
            arena.getSpanStart(tokens[0]),
            arena.getSpanEnd(tokens[tokens.length - 1]),
        );
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
                "@" + arena.resolveString(arena.name[context as AstNode]),
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
        if (arena.dataTypes[parent] === EnumToken.AtRuleNodeType && "media" === arena.resolveString(arena.name[parent])) {
            parent = arena.parents[parent];
            continue;
        }

        // the rules of a mixin body are nested in the rule the mixin is applied to:
        // '&' represents the rule that contains the '@apply' rule
        nested =
            arena.dataTypes[parent] === EnumToken.RuleNodeType ||
            (arena.dataTypes[parent] === EnumToken.AtRuleNodeType &&
                "mixin" === arena.resolveString(arena.name[parent]));

        if (nested) {
            break;
        }

        parent = arena.parents[parent];
    }

    const all = new Array(tokens.length);
    let write = 0;

    for (let read = 0; read < tokens.length; read++) {
        let token = tokens[read];

        if (arena.dataTypes[token] === EnumToken.ColonTokenType) {
            const next = tokens[read + 1];

            if (arena.dataTypes[next] === EnumToken.IdenTokenType) {
                arena.dataTypes[token] = EnumToken.PseudoElementTokenType;
                // ":" + name, no string is created
                arena.stringValue[token] = arena.internBuilder(
                    arena.appendString(pseudoBuilder.reset().appendCode(0x3a), arena.stringValue[next]),
                );
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }

            if (arena.dataTypes[next] === EnumToken.FunctionTokenDefType) {
                val = ":" + arena.resolveString(arena.stringValue[next]);

                arena.dataTypes[token] =
                    val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : arena.dataTypes[next];
                // inlined: arena.setStr(token, val)
                arena.stringValue[token] = arena.internString(val);
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }
        }

        if (arena.dataTypes[token] === EnumToken.DoubleColonTokenType) {
            const next = tokens[read + 1];

            if (arena.dataTypes[next] === EnumToken.IdenTokenType) {
                arena.dataTypes[token] = EnumToken.PseudoClassTokenType;
                // ":" + name for the pseudo elements with a single colon syntax, "::" + name otherwise. no string is
                // created
                pseudoBuilder.reset().appendCode(0x3a);

                if (!isSingleColonPseudoElement(arena, arena.stringValue[next])) {
                    pseudoBuilder.appendCode(0x3a);
                }

                arena.stringValue[token] = arena.internBuilder(arena.appendString(pseudoBuilder, arena.stringValue[next]));
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }

            if (arena.dataTypes[next] === EnumToken.FunctionTokenDefType) {
                val = "::" + arena.resolveString(arena.stringValue[next]);
                arena.dataTypes[token] =
                    val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : EnumToken.FunctionTokenDefType;
                // inlined: arena.setStr(token, val)
                arena.stringValue[token] = arena.internString(val);
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }
        }

        if (arena.dataTypes[token] === EnumToken.ColorTokenType) {
            if (isHash(arena.resolveString(arena.stringValue[token]))) {
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

            // inlined: arena.getSource(tokens[0])
            arena.setLocation(
                node,
                arena.sources[arena.getSourceId(tokens[0])] ?? 0,
                arena.getSpanStart(tokens[0]),
                arena.getSpanEnd(tokens[tokens.length - 1]),
            );
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
                    // inlined: arena.typeOf(stack.at(-1))
                    if (arena.dataTypes[stack.at(-1) as number] === EnumToken.AttrStartTokenType) {
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
                    // inlined: arena.typeOf(stack.at(-1))
                    if (arena.dataTypes[stack.at(-1) as number] === EnumToken.PseudoClassFunctionTokenDefType) {
                        const func: Token = stack[stack.length - 1];
                        index = tokens.indexOf(func);
                        arena.spanLocation(func, func, token);
                        tokens.splice(i, 1);

                        if (isFunctionDefType(arena.dataTypes[func])) {
                            arena.dataTypes[func] = tokensfuncDefMap.get(arena.dataTypes[func]) as EnumToken;
                            arena.setTokenList(func, trimArray(arena, tokens.splice(index + 1, i - index - 1)));
                        }

                        if (result.success && options.minify) {
                            // parse an+b
                            // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                            const name: string = arena.resolveString(arena.stringValue[func]);

                            if (
                                name === ":nth-child" ||
                                name === ":nth-last-child" ||
                                name === ":nth-of-type" ||
                                name === ":nth-last-of-type"
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

    // inlined: arena.getSource(tokens[0])
    arena.setLocation(
        node,
        arena.sources[arena.getSourceId(tokens[0])] ?? 0,
        arena.getSpanStart(tokens[0]),
        arena.getSpanEnd(tokens[tokens.length - 1]),
    );
    return node;
}

// options of the rendering of the selector tokens
const selectorRenderOptions: ParserOptions = { minify: false };

/**
 * builder of the pseudo classes and pseudo elements
 */
const pseudoBuilder: StringBuilder = new StringBuilder();

/**
 * true if ":" + the string is a pseudo element with a single colon syntax (`:before`). the string is not created
 * @param arena
 * @param id
 */
function isSingleColonPseudoElement(arena: AstArena, id: number): boolean {
    const length: number = arena.stringLength(id);

    for (let i: number = 0; i < pseudoElements.length; i++) {
        const pseudo: string = pseudoElements[i];

        if (pseudo.length === length + 1 && pseudo.charCodeAt(0) === 0x3a) {
            let k: number = 0;

            while (k < length && arena.stringCodeAt(id, k) === pseudo.charCodeAt(k + 1)) {
                k++;
            }

            if (k === length) {
                return true;
            }
        }
    }

    return false;
}

/**
 * builder of the rendered tokens of the current selector
 */
const partBuilder: StringBuilder = new StringBuilder();

/**
 * builder of the selector of a rule
 */
const selectorBuilder: StringBuilder = new StringBuilder();

/**
 * offsets of the rendered tokens of the current selector in {@link partBuilder}: start and end of each token
 */
let partOffsets: Int32Array = new Int32Array(64);

/**
 * offsets of the distinct selectors in {@link selectorBuilder}: start and end of each selector
 */
let selectorOffsets: Int32Array = new Int32Array(16);

/**
 * true if the string of a token is a combinator. the string is not created
 * @param arena
 * @param token
 */
function isCombinatorString(arena: AstArena, token: Token | undefined): boolean {
    if (token === undefined) {
        return false;
    }

    const id: number = arena.stringValue[token];
    const length: number = arena.stringLength(id);

    if (length === 0 || length > 2) {
        return false;
    }

    for (let i: number = 0; i < combinators.length; i++) {
        if (arena.stringEquals(id, combinators[i])) {
            return true;
        }
    }

    return false;
}

/**
 * append the rendering of a selector token to the builder. the strings of the tokens are copied, no string is created:
 * the tokens that are rendered as their string value, the symbols. the other tokens are rendered with renderValue()
 * @param arena
 * @param token
 * @param builder
 */
function appendSelectorToken(arena: AstArena, token: Token, builder: StringBuilder): void {
    if (arena.firstToken[token] === 0 && arena.firstChild[token] === 0) {
        switch (arena.dataTypes[token]) {
            case EnumToken.HashTokenType:
            case EnumToken.IdenTokenType:
            case EnumToken.LiteralTokenType:
            case EnumToken.DashedIdenTokenType:
            case EnumToken.ClassSelectorTokenType:
            case EnumToken.PseudoClassTokenType:
                arena.appendString(builder, arena.stringValue[token]);
                return;

            case EnumToken.WhitespaceTokenType:
            case EnumToken.DescendantCombinatorTokenType:
                builder.appendCode(0x20);
                return;

            case EnumToken.CommaTokenType:
                builder.appendCode(0x2c);
                return;

            case EnumToken.Star:
            case EnumToken.UniversalSelectorTokenType:
                builder.appendCode(0x2a);
                return;

            case EnumToken.NestingSelectorTokenType:
                builder.appendCode(0x26);
                return;

            case EnumToken.GtTokenType:
            case EnumToken.ChildCombinatorTokenType:
                builder.appendCode(0x3e);
                return;

            case EnumToken.Plus:
            case EnumToken.NextSiblingCombinatorTokenType:
                builder.appendCode(0x2b);
                return;

            case EnumToken.Tilda:
            case EnumToken.SubsequentSiblingCombinatorTokenType:
                builder.appendCode(0x7e);
                return;
        }
    }

    builder.appendString(renderValue(arena, token, selectorRenderOptions));
}

/**
 * true if two ranges of code units are equal
 * @param codes
 * @param start1
 * @param end1
 * @param start2
 * @param end2
 */
function equalCodes(codes: Uint16Array, start1: number, end1: number, start2: number, end2: number): boolean {
    if (end1 - start1 !== end2 - start2) {
        return false;
    }

    for (let i: number = 0; i < end1 - start1; i++) {
        if (codes[start1 + i] !== codes[start2 + i]) {
            return false;
        }
    }

    return true;
}

/**
 * true if a rendered token of the current selector is a single code unit
 * @param index token index
 * @param count number of tokens
 * @param code
 */
function isPartCode(index: number, count: number, code: number): boolean {
    if (index < 0 || index >= count) {
        return false;
    }

    const start: number = partOffsets[index * 2];

    return partOffsets[index * 2 + 1] - start === 1 && partBuilder.codes[start] === code;
}

/**
 * true if the rendered token is a simple selector that is not a type selector: a class (`.a`), an id (`#a`), an
 * attribute (`[a]`), a pseudo-class (`:hover`) or a pseudo-element (`::before`)
 * @param index index of the rendered token
 * @param count number of rendered tokens
 */
function isSubclassPart(index: number, count: number): boolean {
    if (index < 0 || index >= count || partOffsets[index * 2 + 1] === partOffsets[index * 2]) {
        return false;
    }

    const code: number = partBuilder.codes[partOffsets[index * 2]];

    // '.', '#', ':', '['
    return code === 0x2e || code === 0x23 || code === 0x3a || code === 0x5b;
}

/**
 * true if the rendered token is a type selector other than `html`: `span`, `svg|circle`
 * @param index index of the rendered token
 * @param count number of rendered tokens
 */
function isTypePart(index: number, count: number): boolean {
    if (index < 0 || index >= count) {
        return false;
    }

    const start: number = partOffsets[index * 2];
    const end: number = partOffsets[index * 2 + 1];
    const code: number = partBuilder.codes[start];

    // a namespace prefix: `ns|span`
    if (isPartCode(index + 1, count, 0x7c)) {
        return false;
    }

    if (!((code >= 0x61 && code <= 0x7a) || (code >= 0x41 && code <= 0x5a) || code === 0x5f || code >= 0x80)) {
        return false;
    }

    // `html`, case-insensitive
    return !(
        end - start === 4 &&
        (partBuilder.codes[start] | 0x20) === 0x68 &&
        (partBuilder.codes[start + 1] | 0x20) === 0x74 &&
        (partBuilder.codes[start + 2] | 0x20) === 0x6d &&
        (partBuilder.codes[start + 3] | 0x20) === 0x6c
    );
}

/**
 * add the current selector (the rendered tokens in {@link partBuilder}) to the selectors of the rule when it is not
 * already present. a universal selector is removed before a compound selector
 * @param count number of rendered tokens
 * @param selectors number of selectors
 * @returns the number of selectors
 */
function addSelectorCodes(count: number, selectors: number): number {
    // `*` is removed when it is followed by another simple selector of the same compound selector:
    // `*.a` -> `.a`, `*:hover` -> `:hover`, `*[a]` -> `[a]`, `*::before` -> `::before`.
    // it is kept when it is the only simple selector of the compound selector: it is followed by a combinator
    // (`.a * .b`, `.a *+.b`) or it ends the selector. it is kept in a namespace selector: `*|*`, `ns|*.a`
    for (let i: number = 0; i + 1 < count; i++) {
        if (isPartCode(i, count, 0x2a) && !isPartCode(i - 1, count, 0x7c) && isSubclassPart(i + 1, count)) {
            partOffsets.copyWithin(i * 2, (i + 1) * 2, count * 2);
            count--;
        }
    }

    // a leading `* ` is removed before a type selector: `* span` -> `span`. every element but the root element has a
    // parent element, the root element is `html`. it is kept before the other selectors: `* .dark` does not match
    // `html.dark`
    if (count > 2 && isPartCode(0, count, 0x2a) && isPartCode(1, count, 0x20) && isTypePart(2, count)) {
        partOffsets.copyWithin(0, 4, count * 2);
        count -= 2;
    }

    // the selector: the rendered tokens, at the end of the selector builder
    const start: number = selectorBuilder.length + (selectors > 0 ? 1 : 0);

    if (selectors > 0) {
        selectorBuilder.appendCode(0x2c);
    }

    for (let i: number = 0; i < count; i++) {
        const tokenStart: number = partOffsets[i * 2];
        const tokenEnd: number = partOffsets[i * 2 + 1];

        for (let k: number = tokenStart; k < tokenEnd; k++) {
            selectorBuilder.appendCode(partBuilder.codes[k]);
        }
    }

    const end: number = selectorBuilder.length;

    // distinct selectors
    for (let k: number = 0; k < selectors; k++) {
        if (equalCodes(selectorBuilder.codes, selectorOffsets[k * 2], selectorOffsets[k * 2 + 1], start, end)) {
            selectorBuilder.length = selectors > 0 ? start - 1 : start;
            return selectors;
        }
    }

    if ((selectors + 1) * 2 > selectorOffsets.length) {
        const offsets: Int32Array = new Int32Array(selectorOffsets.length * 2);

        offsets.set(selectorOffsets);
        selectorOffsets = offsets;
    }

    selectorOffsets[selectors * 2] = start;
    selectorOffsets[selectors * 2 + 1] = end;

    return selectors + 1;
}

/**
 * selector of a rule: the distinct comma separated selectors, the whitespace around the combinators is removed.
 * a universal selector is removed before a compound selector. the selector is built from the code units of the
 * tokens and interned: no string is created
 * @param arena
 * @param tokens
 * @returns the interned string id of the selector
 */
function renderSelector(arena: AstArena, tokens: Token[]): number {
    // number of rendered tokens of the current selector, number of distinct selectors
    let count: number = 0;
    let selectors: number = 0;

    partBuilder.reset();
    selectorBuilder.reset();

    for (let index = 0; index < tokens.length; index++) {
        const curr: Token = tokens[index];
        const type: EnumToken = arena.dataTypes[curr];

        if (type === EnumToken.WhitespaceTokenType) {
            if (
                trimWhiteSpace.includes(arena.dataTypes[tokens[index - 1]]) ||
                trimWhiteSpace.includes(arena.dataTypes[tokens[index + 1]]) ||
                isCombinatorString(arena, tokens[index - 1]) ||
                isCombinatorString(arena, tokens[index + 1])
            ) {
                continue;
            }
        }

        if (type === EnumToken.CommaTokenType) {
            selectors = addSelectorCodes(count, selectors);
            count = 0;
            partBuilder.reset();
            continue;
        }

        const start: number = partBuilder.length;

        appendSelectorToken(arena, curr, partBuilder);

        // a token rendered as `,`
        if (partBuilder.length - start === 1 && partBuilder.codes[start] === 0x2c) {
            partBuilder.length = start;
            selectors = addSelectorCodes(count, selectors);
            count = 0;
            partBuilder.reset();
            continue;
        }

        if ((count + 1) * 2 > partOffsets.length) {
            const offsets: Int32Array = new Int32Array(partOffsets.length * 2);

            offsets.set(partOffsets);
            partOffsets = offsets;
        }

        partOffsets[count * 2] = start;
        partOffsets[count * 2 + 1] = partBuilder.length;
        count++;
    }

    addSelectorCodes(count, selectors);

    return arena.internBuilder(selectorBuilder);
}

