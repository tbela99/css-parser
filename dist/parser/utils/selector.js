/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.2
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../../ast/types.js';
import { StringBuilder } from '../../ast/strings.js';
import { renderValue } from '../../printer/render.js';
import { isFunctionDefType, tokensfuncDefMap, pseudoElements, combinators } from '../../syntax/constants.js';
import { isHash, isIdent } from '../../syntax/syntax.js';
import { getParsedSyntax, getSyntaxRule } from '../../validation/config.js';
import { matchAllSyntaxes, createValidationContext, trimArray, selectorFunctionSyntax, matchSimpleSelector, matchSelectorSyntax } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from '../../validation/parser/typedef.js';
import { splitTokenList } from '../../validation/utils/list.js';
import { trimWhiteSpace } from '../parse.js';
import { equalsIgnoreCase } from './text.js';

/**
 * minify the an+b expression of a pseudo class function
 * @param arena
 * @param func
 */
function minifyNthExpression(arena, func) {
    const chi = arena.tokens(func);
    const list = [];
    let index;
    for (index = 0; index < chi.length; index++) {
        if (arena.dataTypes[chi[index]] === EnumToken.CommentTokenType ||
            arena.dataTypes[chi[index]] === EnumToken.WhitespaceTokenType) {
            continue;
        }
        if (arena.dataTypes[chi[index]] === EnumToken.IdenTokenType &&
            equalsIgnoreCase("of", arena.resolveString(arena.stringValue[chi[index]]))) {
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
            }
            else {
                const sign = Math.sign(arena.numericValue[list[1]]);
                arena.numericValue[list[1]] *= sign;
                list.splice(1, 0, arena.createToken(EnumToken.LiteralTokenType, sign > 0 ? "+" : "-"));
            }
        }
        if (list.length === 3 &&
            arena.dataTypes[list[2]] === EnumToken.NumberTokenType &&
            arena.dataTypes[list[0]] === EnumToken.DimensionTokenType &&
            (arena.numericValue[list[0]] === 2 || arena.numericValue[list[0]] === -2)) {
            if (1 === arena.numericValue[list[2]]) {
                const ident = arena.createToken(EnumToken.IdenTokenType, "odd");
                arena.copyLocation(ident, list[0]);
                list.splice(0, 3, ident);
            }
            else if (0 === arena.numericValue[list[2]]) {
                const ident = arena.createToken(EnumToken.IdenTokenType, "even");
                arena.copyLocation(ident, list[0]);
                list.splice(0, 3, ident);
            }
        }
        chi.splice(0, index, ...list);
    }
    if (list.length === 1) {
        if (arena.dataTypes[list[0]] === EnumToken.IdenTokenType &&
            equalsIgnoreCase("-n", arena.resolveString(arena.stringValue[list[0]]))) {
            // inlined: arena.setStr(list[0], "n")
            arena.stringValue[list[0]] = arena.internString("n");
        }
    }
    if (list.length === 3) {
        if (arena.dataTypes[list[0]] === EnumToken.IdenTokenType &&
            ("n" === arena.resolveString(arena.stringValue[list[0]]) ||
                "-n" === arena.resolveString(arena.stringValue[list[0]]) ||
                "+n" === arena.resolveString(arena.stringValue[list[0]]))) {
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
    const token = chi.find((t) => arena.dataTypes[t] !== EnumToken.WhitespaceTokenType && arena.dataTypes[t] !== EnumToken.CommentTokenType);
    if (token != null) {
        if (arena.dataTypes[token] === EnumToken.IdenTokenType ||
            arena.dataTypes[token] === EnumToken.LiteralTokenType) {
            const val = arena.resolveString(arena.stringValue[token]);
            if (arena.dataTypes[token] === EnumToken.IdenTokenType && (val === "odd" || val === "even")) {
                if (val === "even") {
                    arena.resetToken(token, EnumToken.DimensionTokenType, 2, "n");
                }
            }
            else {
                const matches = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(val);
                if (matches != null) {
                    const a1 = matches[2] === "" ? 1 : matches[2] === "-" ? -1 : +matches[2];
                    const b1 = +matches[3];
                    if (b1 === 0) {
                        if (Math.abs(a1) === 1) {
                            arena.resetToken(token, EnumToken.IdenTokenType, "n");
                        }
                        else {
                            arena.resetToken(token, EnumToken.DimensionTokenType, a1 * Math.sign(a1), "n");
                        }
                    }
                }
            }
        }
        else if (arena.dataTypes[token] === EnumToken.DimensionTokenType) {
            const index = chi.indexOf(token);
            let num = null;
            let i = index + 1;
            for (; i < chi.length; i++) {
                if (arena.dataTypes[chi[i]] === EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[chi[i]] === EnumToken.CommentTokenType) {
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
                }
                else if (arena.numericValue[token] === 2 && Math.abs(arena.numericValue[num]) === 1) {
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
function splitUnicodeRanges(arena, tokens) {
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (arena.dataTypes[token] === EnumToken.UniCodeRange) {
            const text = arena.resolveString(arena.stringValue[token]);
            const rest = text.slice(2);
            const split = [
                arena.createToken(EnumToken.IdenTokenType, text.charAt(0)),
                arena.createToken(EnumToken.Plus, "+"),
                arena.createToken(isIdent(rest) ? EnumToken.IdenTokenType : EnumToken.LiteralTokenType, rest),
            ];
            for (const t of split) {
                arena.copyLocation(t, token);
            }
            tokens.splice(i, 1, ...split);
            i += split.length - 1;
        }
        else if (arena.firstToken[token] !== 0) {
            // `:is(u+a)`
            const children = arena.tokens(token);
            if (children.some((child) => arena.dataTypes[child] === EnumToken.UniCodeRange || arena.firstToken[child] !== 0)) {
                const length = children.length;
                splitUnicodeRanges(arena, children);
                if (children.length !== length) {
                    arena.setTokenList(token, children);
                }
            }
        }
    }
}
/**
 * true if the token is a keyframe selector: `from`, `to` or a percentage between 0 and 100
 * @param arena
 * @param token
 */
function isKeyframeSelectorToken(arena, token) {
    if (token === undefined) {
        return false;
    }
    if (arena.dataTypes[token] === EnumToken.PercentageTokenType) {
        return arena.numericValue[token] >= 0 && arena.numericValue[token] <= 100;
    }
    if (arena.dataTypes[token] !== EnumToken.IdenTokenType) {
        return false;
    }
    const id = arena.stringValue[token];
    const length = arena.stringLength(id);
    // `from` and `to`, case-insensitive
    return length === 4
        ? (arena.stringCodeAt(id, 0) | 0x20) === 0x66 &&
            (arena.stringCodeAt(id, 1) | 0x20) === 0x72 &&
            (arena.stringCodeAt(id, 2) | 0x20) === 0x6f &&
            (arena.stringCodeAt(id, 3) | 0x20) === 0x6d
        : length === 2 && (arena.stringCodeAt(id, 0) | 0x20) === 0x74 && (arena.stringCodeAt(id, 1) | 0x20) === 0x6f;
}
/**
 * true if the selector of a keyframe is a list of `from`, `to` and percentages between 0 and 100, separated by commas
 * and whitespace: it matches the `keyframe-selectors` syntax
 * @param arena
 * @param tokens
 */
function isSimpleKeyframeSelector(arena, tokens) {
    // a keyframe selector is expected
    let selector = true;
    let i = 0;
    for (; i < tokens.length; i++) {
        const type = arena.dataTypes[tokens[i]];
        if (type === EnumToken.WhitespaceTokenType) {
            continue;
        }
        if (selector) {
            if (!isKeyframeSelectorToken(arena, tokens[i])) {
                return false;
            }
        }
        else if (type !== EnumToken.CommaTokenType) {
            return false;
        }
        selector = !selector;
    }
    return !selector;
}
/**
 * parse selector
 * @param arena
 * @param tokens
 * @param context parent node id
 * @param options
 * @param errors
 */
function parseSelector(arena, tokens, context, options, errors) {
    const contextType = context == null ? null : arena.dataTypes[context];
    splitUnicodeRanges(arena, tokens);
    if (contextType === EnumToken.KeyframesAtRuleNodeType) {
        // `from`, `to` and the percentages are valid: the syntax is not matched
        const result = isSimpleKeyframeSelector(arena, tokens)
            ? { success: true, errors: [] }
            : matchAllSyntaxes(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "keyframe-selectors"), createValidationContext(arena, tokens), options);
        const parts = splitTokenList(arena, tokens);
        for (const part of parts) {
            trimArray(arena, part);
            if (options.minify) {
                const filtered = part.filter((token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[token] !== EnumToken.CommentTokenType);
                if (filtered.length === 1) {
                    if (arena.dataTypes[filtered[0]] === EnumToken.IdenTokenType &&
                        "from" === arena.resolveString(arena.stringValue[filtered[0]]).toLowerCase()) {
                        arena.resetToken(filtered[0], EnumToken.PercentageTokenType, 0);
                    }
                    else if (arena.dataTypes[filtered[0]] === EnumToken.PercentageTokenType &&
                        100 === arena.numericValue[filtered[0]]) {
                        arena.resetToken(filtered[0], EnumToken.IdenTokenType, "to");
                    }
                    part.splice(0, part.length, ...filtered);
                }
            }
        }
        tokens.splice(0, tokens.length, ...parts.reduce((acc, curr) => {
            if (acc.length > 0) {
                acc.push(arena.createToken(EnumToken.CommaTokenType));
            }
            for (const c of curr) {
                acc.push(c);
            }
            return acc;
        }, []));
        const node = arena.createRule(EnumToken.KeyframesRuleNodeType, [
            ...splitTokenList(arena, trimArray(arena, tokens)).reduce((acc, curr) => {
                acc.add(curr.reduce((acc, curr) => acc + renderValue(arena, curr, { minify: false }), ""));
                return acc;
            }, new Set()),
        ].join(), tokens.length === 0 ? null : tokens, result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid, result.errors);
        // inlined: arena.getSource(tokens[0])
        arena.setLocation(node, arena.sources[arena.getSourceId(tokens[0])] ?? 0, arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
        return node;
    }
    const stack = [];
    let allowed = true;
    let index;
    let parent = context;
    let nested = false;
    if (contextType !== EnumToken.StyleSheetNodeType && contextType !== EnumToken.RuleNodeType) {
        allowed = false;
        if (contextType === EnumToken.AtRuleNodeType) {
            // computed once per at-rule name: the name is not concatenated for each selector
            const previousAtRuleArena = atRuleArena;
            atRuleArena = arena;
            allowed = arena.stringDerived(arena.name[context], 3 /* StringDerived.AtRuleAcceptsRules */, atRuleAcceptsRules);
            // the arena is not kept after the parse: the previous arena is restored (a nested call)
            atRuleArena = previousAtRuleArena;
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
                arena.stringValue[token] = arena.internBuilder(arena.appendString(pseudoBuilder.reset().appendCode(0x3a), arena.stringValue[next]));
                arena.spanLocation(token, token, next);
                all[write++] = token;
                read++;
                continue;
            }
            if (arena.dataTypes[next] === EnumToken.FunctionTokenDefType) {
                // ":" + name, no string is created. `:name()` is a selector function: looked up once per name
                arena.stringValue[token] = arena.internBuilder(arena.appendString(pseudoBuilder.reset().appendCode(0x3a), arena.stringValue[next]));
                arena.dataTypes[token] =
                    selectorFunctionSyntax(arena, token) != null
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : arena.dataTypes[next];
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
                // "::" + name, no string is created
                arena.stringValue[token] = arena.internBuilder(arena.appendString(pseudoBuilder.reset().appendCode(0x3a).appendCode(0x3a), arena.stringValue[next]));
                arena.dataTypes[token] =
                    selectorFunctionSyntax(arena, token) != null
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : EnumToken.FunctionTokenDefType;
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
            const node = arena.createRule(EnumToken.RuleNodeType, renderSelector(arena, tokens), tokens, EnumAstNodeStatus.Invalid, [
                {
                    action: "drop",
                    node: token,
                    message: "invalid hash id",
                },
            ]);
            // inlined: arena.getSource(tokens[0])
            arena.setLocation(node, arena.sources[arena.getSourceId(tokens[0])] ?? 0, arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
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
    // a selector made of simple selectors is valid, it has no attribute selector and no function
    const simple = matchSimpleSelector(arena, tokens);
    const result = simple ? simpleSelectorMatch : matchSelectorSyntax(arena, tokens, errors, options, nested);
    trimArray(arena, tokens);
    if (result.success && !simple) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            switch (arena.dataTypes[token]) {
                case EnumToken.AttrStartTokenType:
                    stack.push(token);
                    break;
                case EnumToken.AttrEndTokenType:
                    // inlined: arena.typeOf(stack.at(-1))
                    if (arena.dataTypes[stack.at(-1)] === EnumToken.AttrStartTokenType) {
                        const attr = stack[stack.length - 1];
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
                    if (arena.dataTypes[stack.at(-1)] === EnumToken.PseudoClassFunctionTokenDefType) {
                        const func = stack[stack.length - 1];
                        index = tokens.indexOf(func);
                        arena.spanLocation(func, func, token);
                        tokens.splice(i, 1);
                        if (isFunctionDefType(arena.dataTypes[func])) {
                            arena.dataTypes[func] = tokensfuncDefMap.get(arena.dataTypes[func]);
                            arena.setTokenList(func, trimArray(arena, tokens.splice(index + 1, i - index - 1)));
                        }
                        if (result.success && options.minify) {
                            // parse an+b
                            // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                            const name = arena.resolveString(arena.stringValue[func]);
                            if (name === ":nth-child" ||
                                name === ":nth-last-child" ||
                                name === ":nth-of-type" ||
                                name === ":nth-last-of-type") {
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
    const node = arena.createRule(EnumToken.RuleNodeType, simple ? renderSimpleSelector(arena, tokens) : renderSelector(arena, tokens), tokens, result.success && allowed
        ? EnumAstNodeStatus.Validated
        : allowed
            ? EnumAstNodeStatus.Invalid
            : EnumAstNodeStatus.Disallowed, result.success ? [] : result.errors);
    // inlined: arena.getSource(tokens[0])
    arena.setLocation(node, arena.sources[arena.getSourceId(tokens[0])] ?? 0, arena.getSpanStart(tokens[0]), arena.getSpanEnd(tokens[tokens.length - 1]));
    return node;
}
/**
 * result of the validation of a simple selector, see {@link matchSimpleSelector}
 */
const simpleSelectorMatch = Object.freeze({
    success: true,
    errors: Object.freeze([]),
});
// options of the rendering of the selector tokens
const selectorRenderOptions = { minify: false };
/**
 * builder of the pseudo classes and pseudo elements
 */
const pseudoBuilder = new StringBuilder();
/**
 * the arena of the at-rule names read by {@link atRuleAcceptsRules}: the function passed to the string table is not a
 * closure
 */
let atRuleArena = null;
/**
 * true if the rules are allowed in the block of an at-rule, by name (see {@link StringDerived.AtRuleAcceptsRules})
 * @param id the at-rule name
 */
function atRuleAcceptsRules(id) {
    const syntaxRule = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRuleArena.resolveString(id));
    if (syntaxRule?.acceptAnyRule) {
        return true;
    }
    const rules = syntaxRule?.getBlockRules?.();
    if (rules != null) {
        for (const rule of rules) {
            if (ValidationTokenEnum.PropertyType === rule.typ &&
                ("block-contents" === rule.val ||
                    "rule-list" === rule.val)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * true if ":" + the string is a pseudo element with a single colon syntax (`:before`). the string is not created
 * @param arena
 * @param id
 */
function isSingleColonPseudoElement(arena, id) {
    const length = arena.stringLength(id);
    for (let i = 0; i < pseudoElements.length; i++) {
        const pseudo = pseudoElements[i];
        if (pseudo.length === length + 1 && pseudo.charCodeAt(0) === 0x3a) {
            let k = 0;
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
const partBuilder = new StringBuilder();
/**
 * builder of the selector of a rule
 */
const selectorBuilder = new StringBuilder();
/**
 * offsets of the rendered tokens of the current selector in {@link partBuilder}: start and end of each token
 */
let partOffsets = new Int32Array(64);
/**
 * offsets of the distinct selectors in {@link selectorBuilder}: start and end of each selector
 */
let selectorOffsets = new Int32Array(16);
/**
 * true if the string of a token is a combinator. the string is not created
 * @param arena
 * @param token
 */
function isCombinatorString(arena, token) {
    if (token === undefined) {
        return false;
    }
    const id = arena.stringValue[token];
    const length = arena.stringLength(id);
    if (length === 0 || length > 2) {
        return false;
    }
    for (let i = 0; i < combinators.length; i++) {
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
function appendSelectorToken(arena, token, builder) {
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
function equalCodes(codes, start1, end1, start2, end2) {
    if (end1 - start1 !== end2 - start2) {
        return false;
    }
    for (let i = 0; i < end1 - start1; i++) {
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
function isPartCode(index, count, code) {
    if (index < 0 || index >= count) {
        return false;
    }
    const start = partOffsets[index * 2];
    return partOffsets[index * 2 + 1] - start === 1 && partBuilder.codes[start] === code;
}
/**
 * true if the rendered token is a simple selector that is not a type selector: a class (`.a`), an id (`#a`), an
 * attribute (`[a]`), a pseudo-class (`:hover`) or a pseudo-element (`::before`)
 * @param index index of the rendered token
 * @param count number of rendered tokens
 */
function isSubclassPart(index, count) {
    if (index < 0 || index >= count || partOffsets[index * 2 + 1] === partOffsets[index * 2]) {
        return false;
    }
    const code = partBuilder.codes[partOffsets[index * 2]];
    // '.', '#', ':', '['
    return code === 0x2e || code === 0x23 || code === 0x3a || code === 0x5b;
}
/**
 * true if the rendered token is a type selector other than `html`: `span`, `svg|circle`
 * @param index index of the rendered token
 * @param count number of rendered tokens
 */
function isTypePart(index, count) {
    if (index >= count) {
        return false;
    }
    const start = partOffsets[index * 2];
    const end = partOffsets[index * 2 + 1];
    const code = partBuilder.codes[start];
    // a namespace prefix: `ns|span`
    if (isPartCode(index + 1, count, 0x7c)) {
        return false;
    }
    if (!((code >= 0x61 && code <= 0x7a) || (code >= 0x41 && code <= 0x5a) || code === 0x5f || code >= 0x80)) {
        return false;
    }
    // `html`, case-insensitive
    return !(end - start === 4 &&
        (partBuilder.codes[start] | 0x20) === 0x68 &&
        (partBuilder.codes[start + 1] | 0x20) === 0x74 &&
        (partBuilder.codes[start + 2] | 0x20) === 0x6d &&
        (partBuilder.codes[start + 3] | 0x20) === 0x6c);
}
/**
 * add the current selector (the rendered tokens in {@link partBuilder}) to the selectors of the rule when it is not
 * already present. a universal selector is removed before a compound selector
 * @param count number of rendered tokens
 * @param selectors number of selectors
 * @returns the number of selectors
 */
function addSelectorCodes(count, selectors) {
    // `*` is removed when it is followed by another simple selector of the same compound selector:
    // `*.a` -> `.a`, `*:hover` -> `:hover`, `*[a]` -> `[a]`, `*::before` -> `::before`.
    // it is kept when it is the only simple selector of the compound selector: it is followed by a combinator
    // (`.a * .b`, `.a *+.b`) or it ends the selector. it is kept in a namespace selector: `*|*`, `ns|*.a`
    for (let i = 0; i + 1 < count; i++) {
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
    const start = selectorBuilder.length + (selectors > 0 ? 1 : 0);
    if (selectors > 0) {
        selectorBuilder.appendCode(0x2c);
    }
    for (let i = 0; i < count; i++) {
        const tokenStart = partOffsets[i * 2];
        const tokenEnd = partOffsets[i * 2 + 1];
        for (let k = tokenStart; k < tokenEnd; k++) {
            selectorBuilder.appendCode(partBuilder.codes[k]);
        }
    }
    const end = selectorBuilder.length;
    // distinct selectors
    for (let k = 0; k < selectors; k++) {
        if (equalCodes(selectorBuilder.codes, selectorOffsets[k * 2], selectorOffsets[k * 2 + 1], start, end)) {
            selectorBuilder.length = selectors > 0 ? start - 1 : start;
            return selectors;
        }
    }
    if ((selectors + 1) * 2 > selectorOffsets.length) {
        const offsets = new Int32Array(selectorOffsets.length * 2);
        offsets.set(selectorOffsets);
        selectorOffsets = offsets;
    }
    selectorOffsets[selectors * 2] = start;
    selectorOffsets[selectors * 2 + 1] = end;
    return selectors + 1;
}
/**
 * selector of a rule made of simple selectors (see {@link matchSimpleSelector}), without the leading and the trailing
 * whitespace: the string of a single token is used as is, a compound or a complex selector is built without
 * {@link renderSelector}. a selector list is rendered with {@link renderSelector}: the duplicate selectors are removed
 * @param arena
 * @param tokens
 * @returns the interned string id of the selector
 */
function renderSimpleSelector(arena, tokens) {
    if (tokens.length === 1) {
        const type = arena.dataTypes[tokens[0]];
        // rendered as their string by appendSelectorToken()
        if (type !== EnumToken.PseudoElementTokenType) {
            return arena.stringValue[tokens[0]];
        }
    }
    selectorBuilder.reset();
    for (let index = 0; index < tokens.length; index++) {
        if (arena.dataTypes[tokens[index]] === EnumToken.CommaTokenType) {
            return renderSelector(arena, tokens);
        }
        appendSelectorToken(arena, tokens[index], selectorBuilder);
    }
    return arena.internBuilder(selectorBuilder);
}
/**
 * selector of a rule: the distinct comma separated selectors, the whitespace around the combinators is removed.
 * a universal selector is removed before a compound selector. the selector is built from the code units of the
 * tokens and interned: no string is created
 * @param arena
 * @param tokens
 * @returns the interned string id of the selector
 */
function renderSelector(arena, tokens) {
    // number of rendered tokens of the current selector, number of distinct selectors
    let count = 0;
    let selectors = 0;
    partBuilder.reset();
    selectorBuilder.reset();
    for (let index = 0; index < tokens.length; index++) {
        const curr = tokens[index];
        const type = arena.dataTypes[curr];
        if (type === EnumToken.WhitespaceTokenType) {
            if (trimWhiteSpace.includes(arena.dataTypes[tokens[index - 1]]) ||
                trimWhiteSpace.includes(arena.dataTypes[tokens[index + 1]]) ||
                isCombinatorString(arena, tokens[index - 1]) ||
                isCombinatorString(arena, tokens[index + 1])) {
                continue;
            }
        }
        if (type === EnumToken.CommaTokenType) {
            selectors = addSelectorCodes(count, selectors);
            count = 0;
            partBuilder.reset();
            continue;
        }
        const start = partBuilder.length;
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
            const offsets = new Int32Array(partOffsets.length * 2);
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

export { parseSelector };
