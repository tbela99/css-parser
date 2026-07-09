import { EnumToken, EnumAstNodeStatus } from '../../ast/types.js';
import { renderValue } from '../../renderer/render.js';
import { definedPropertySettings, tokensfuncDefMap, combinators } from '../../syntax/constants.js';
import { pseudoElements, isIdent, isHash } from '../../syntax/syntax.js';
import { getParsedSyntax, getSyntaxRule, getSyntaxConfig } from '../../validation/config.js';
import { matchAllSyntax, createValidationContext, trimArray, matchSelectorSyntax } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from '../../validation/parser/typedef.js';
import { splitTokenList } from '../../validation/utils/list.js';
import { trimWhiteSpace } from '../parse.js';

/**
 * parse selector
 */
function parseSelector(tokens, context, options, errors) {
    if (context?.typ === EnumToken.KeyframesAtRuleNodeType) {
        const result = matchAllSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "keyframe-selectors"), createValidationContext(tokens), options);
        const parts = splitTokenList(tokens);
        for (const part of parts) {
            trimArray(part);
            if (options.minify) {
                const filtered = part.filter((token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
                if (filtered.length === 1) {
                    if (filtered[0].typ === EnumToken.IdenTokenType &&
                        "from" === filtered[0].val.toLowerCase()) {
                        filtered[0] = Object.defineProperty({
                            typ: EnumToken.PercentageTokenType,
                            val: 0,
                        }, "loc", {
                            ...definedPropertySettings,
                            value: filtered[0].loc,
                        });
                    }
                    else if (filtered[0].typ === EnumToken.PercentageTokenType &&
                        100 === filtered[0].val) {
                        filtered[0] = Object.defineProperty({
                            typ: EnumToken.IdenTokenType,
                            val: "to",
                        }, "loc", {
                            ...definedPropertySettings,
                            value: filtered[0].loc,
                        });
                    }
                    part.splice(0, part.length, ...filtered);
                }
            }
        }
        tokens.splice(0, tokens.length, ...parts.reduce((acc, curr) => {
            if (acc.length > 0) {
                acc.push({ typ: EnumToken.CommaTokenType });
            }
            acc.push(...curr);
            return acc;
        }, []));
        return Object.defineProperties({
            typ: EnumToken.KeyFramesRuleNodeType,
            sel: [
                ...splitTokenList(trimArray(tokens)).reduce((acc, curr) => {
                    acc.add(curr.reduce((acc, curr) => acc + renderValue(curr, { minify: false }), ""));
                    return acc;
                }, new Set()),
            ].join(),
            chi: [],
        }, {
            state: {
                ...definedPropertySettings,
                value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
            },
            errors: {
                ...definedPropertySettings,
                value: result.errors,
            },
            tokens: { ...definedPropertySettings, value: tokens.length === 0 ? null : tokens },
            loc: {
                ...definedPropertySettings,
                value: {
                    ...tokens[0].loc,
                    end: { ...(tokens[tokens.length - 1]?.loc?.end ?? tokens[0]?.loc?.end) },
                },
            },
        });
    }
    const stack = [];
    const uniq = new Map();
    let allowed = true;
    let i = 0;
    let index;
    let parent = context;
    let nested = false;
    let val;
    if (context?.typ !== EnumToken.StyleSheetNodeType && context?.typ !== EnumToken.RuleNodeType) {
        allowed = false;
        if (context?.typ === EnumToken.AtRuleNodeType) {
            const syntaxRule = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
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
        if (parent?.typ === EnumToken.AtRuleNodeType && "media" === parent.nam) {
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
                    val: ":" + tokens[i + 1].val,
                });
                tokens[i].loc.end = tokens[i + 1].loc.end;
                tokens.splice(i + 1, 1);
                continue;
            }
            if (tokens[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = ":" + tokens[i + 1].val;
                Object.assign(tokens[i], {
                    typ: val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : tokens[i + 1].typ,
                    val,
                });
                tokens[i].loc.end = tokens[i + 1].loc.end;
                tokens.splice(i + 1, 1);
                continue;
            }
        }
        if (tokens[i].typ == EnumToken.DoubleColonTokenType) {
            val = ":" + tokens[i + 1].val;
            if (tokens[i + 1]?.typ == EnumToken.IdenTokenType) {
                Object.assign(tokens[i], {
                    typ: EnumToken.PseudoClassTokenType,
                    val: (pseudoElements.includes(val) ? "" : ":") + val,
                });
                tokens[i].loc.end = tokens[i + 1].loc.end;
                tokens.splice(i + 1, 1);
                continue;
            }
            if (tokens[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = "::" + tokens[i + 1].val;
                Object.assign(tokens[i], {
                    typ: val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : EnumToken.FunctionTokenDefType,
                    val,
                });
                tokens[i].loc.end = tokens[i + 1].loc.end;
                tokens.splice(i + 1, 1);
                continue;
            }
        }
        if (tokens[i].typ == EnumToken.ColorTokenType) {
            if (isIdent(tokens[i].val)) {
                Object.assign(tokens[i], {
                    typ: EnumToken.IdenTokenType,
                });
            }
            else if (isHash(tokens[i].val)) {
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
                        index = tokens.indexOf(stack.at(-1));
                        // @ts-expect-error
                        const { val, ...attr } = stack.at(-1);
                        Object.defineProperty(attr, "loc", {
                            ...definedPropertySettings,
                            value: {
                                ...stack.at(-1).loc,
                                end: token.loc.end,
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
                        const func = stack.at(-1);
                        index = tokens.indexOf(func);
                        stack.at(-1).loc.end = token.loc.end;
                        tokens.splice(i, 1);
                        if (tokensfuncDefMap.has(func.typ)) {
                            // @ts-expect-error
                            func.typ = tokensfuncDefMap.get(func.typ);
                            func.chi = tokens.splice(index + 1, i - index - 1);
                        }
                        if (result.success && options.minify) {
                            // parse an+b
                            // an+b produces an ident such as 'n-0', a literal such as '+2n-0' or a list of tokens such as[2n\s?[+-]\s?3]
                            if (func.val == ":nth-child" ||
                                func.val == ":nth-last-child" ||
                                func.val == ":nth-of-type" ||
                                func.val == ":nth-last-of-type") {
                                const token = func.chi.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommentTokenType);
                                if (token?.typ == EnumToken.IdenTokenType || token?.typ == EnumToken.LiteralTokenType) {
                                    if (token.typ == EnumToken.IdenTokenType &&
                                        (token.val == "odd" || token.val == "even")) {
                                        if (token.val == "even") {
                                            Object.assign(token, {
                                                typ: EnumToken.DimensionTokenType,
                                                val: 2,
                                                unit: "n",
                                            });
                                        }
                                    }
                                    else {
                                        if (!/\d+$/.test(token.val)) {
                                            let index = func.chi.indexOf(token);
                                            let i = index + 1;
                                            let sign = null;
                                            let num = null;
                                            for (; i < func.chi.length; i++) {
                                                if (func.chi[i].typ == EnumToken.WhitespaceTokenType ||
                                                    func.chi[i].typ == EnumToken.CommentTokenType) {
                                                    continue;
                                                }
                                                if (func.chi[i].typ == EnumToken.NumberTokenType) {
                                                    num = func.chi[i];
                                                    break;
                                                }
                                                else {
                                                    sign = func.chi[i];
                                                }
                                            }
                                            if (num != null) {
                                                if (num.val === 0) {
                                                    func.chi.splice(index + 1, i - index);
                                                    if (token.val == "-n") {
                                                        token.val = "n";
                                                    }
                                                    break;
                                                }
                                                if (sign == null) {
                                                    func.chi.splice(index + 1, i - index - 1);
                                                    if (Math.sign(num.val) === 1) {
                                                        func.chi.splice(index + 1, 0, {
                                                            typ: EnumToken.LiteralTokenType,
                                                            val: "+",
                                                        });
                                                    }
                                                }
                                            }
                                            else if (token.val == "-n") {
                                                token.val = "n";
                                            }
                                            break;
                                        }
                                        const matches = /^(([+-]?[0-9]*)?n)?([+-]?[0-9]+)?$/.exec(token.val);
                                        if (matches != null) {
                                            const a1 = matches[2] === "" ? 1 : matches[2] === "-" ? -1 : +matches[2];
                                            const b1 = +matches[3];
                                            if (a1 === 0) {
                                                if (b1 === 1) {
                                                    let hasSelector = false;
                                                    let i = func.chi.indexOf(token);
                                                    let j = i + 1;
                                                    for (; j < func.chi.length; j++) {
                                                        if (func.chi[j].typ == EnumToken.IdenTokenType &&
                                                            func.chi[j].val == "of") {
                                                            hasSelector = true;
                                                            break;
                                                        }
                                                    }
                                                    if (hasSelector) {
                                                        Object.assign(token, {
                                                            typ: EnumToken.NumberTokenType,
                                                            val: b1,
                                                        });
                                                    }
                                                    else {
                                                        // :first-child
                                                        tokens[tokens.indexOf(func)] = Object.defineProperties({
                                                            typ: EnumToken.PseudoClassTokenType,
                                                            val: ":first-child",
                                                        }, {
                                                            loc: {
                                                                ...definedPropertySettings,
                                                                value: func.loc,
                                                            },
                                                        });
                                                    }
                                                    break;
                                                }
                                                else {
                                                    Object.assign(token, { typ: EnumToken.NumberTokenType, val: b1 });
                                                }
                                            }
                                            else if (b1 === 0) {
                                                Object.assign(token, Math.abs(a1) === 1
                                                    ? {
                                                        typ: EnumToken.IdenTokenType,
                                                        val: "n",
                                                    }
                                                    : {
                                                        typ: EnumToken.DimensionTokenType,
                                                        val: a1 * Math.sign(a1),
                                                        unit: "n",
                                                    });
                                            }
                                            else if (Math.abs(a1) === 2) {
                                                if (b1 === 0) {
                                                    Object.assign(token, {
                                                        typ: EnumToken.DimensionTokenType,
                                                        val: a1,
                                                        unit: "n",
                                                    });
                                                }
                                                else if (Math.abs(b1) === 1) {
                                                    Object.assign(token, { typ: EnumToken.IdenTokenType, val: "odd" });
                                                }
                                            }
                                        }
                                    }
                                }
                                else if (token?.typ === EnumToken.DimensionTokenType) {
                                    const index = func.chi.indexOf(token);
                                    let sign = null;
                                    let num = null;
                                    let i = index + 1;
                                    for (; i < func.chi.length; i++) {
                                        if (func.chi[i].typ == EnumToken.WhitespaceTokenType ||
                                            func.chi[i].typ == EnumToken.CommentTokenType) {
                                            continue;
                                        }
                                        if (func.chi[i].typ == EnumToken.NumberTokenType) {
                                            num = func.chi[i];
                                            break;
                                        }
                                        else {
                                            sign = func.chi[i];
                                        }
                                    }
                                    if (num != null) {
                                        if (token.val === 0) {
                                            if (num.val === 0) {
                                                func.chi.splice(0, i);
                                            }
                                            else if (num.val === 1) {
                                                let hasSelector = false;
                                                let j = i + 1;
                                                for (; j < func.chi.length; j++) {
                                                    if (func.chi[j].typ == EnumToken.IdenTokenType &&
                                                        func.chi[j].val == "of") {
                                                        hasSelector = true;
                                                        break;
                                                    }
                                                }
                                                if (hasSelector) {
                                                    func.chi.splice(0, i);
                                                }
                                                else {
                                                    tokens[tokens.indexOf(func)] = Object.defineProperties({
                                                        typ: EnumToken.PseudoClassTokenType,
                                                        val: ":first-child",
                                                    }, {
                                                        loc: {
                                                            ...definedPropertySettings,
                                                            value: func.loc,
                                                        },
                                                    });
                                                }
                                                break;
                                            }
                                            else {
                                                func.chi.splice(0, i);
                                            }
                                            break;
                                        }
                                        else if (num.val === 0) {
                                            func.chi.splice(index + 1, i - index);
                                            if (token.val < 0) {
                                                token.val *= -1;
                                            }
                                            break;
                                        }
                                        else if (token.val === 2 &&
                                            Math.abs(num.val) === 1) {
                                            Object.assign(token, {
                                                typ: EnumToken.IdenTokenType,
                                                val: "odd",
                                            });
                                            func.chi.splice(index + 1, i - index);
                                            break;
                                        }
                                        if (token.val === 1) {
                                            Object.assign(token, {
                                                typ: EnumToken.IdenTokenType,
                                                val: Math.sign(token.val) === 1
                                                    ? "n"
                                                    : "-n",
                                            });
                                        }
                                        if (sign == null) {
                                            func.chi.splice(index + 1, i - index - 1);
                                            if (Math.sign(num.val) === 1) {
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
    return Object.defineProperties({
        typ: EnumToken.RuleNodeType,
        sel: [
            ...tokens
                .reduce((acc, curr, index, array) => {
                if (curr.typ == EnumToken.CommentTokenType) {
                    return acc;
                }
                if (curr.typ == EnumToken.WhitespaceTokenType) {
                    if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                        trimWhiteSpace.includes(array[index + 1]?.typ) ||
                        combinators.includes(array[index - 1]?.val) ||
                        combinators.includes(array[index + 1]?.val)) {
                        return acc;
                    }
                }
                let t = renderValue(curr, { minify: false });
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
        ].join(","),
        chi: [],
    }, {
        state: {
            ...definedPropertySettings,
            value: result.success && allowed
                ? EnumAstNodeStatus.Validated
                : allowed
                    ? EnumAstNodeStatus.Invalid
                    : EnumAstNodeStatus.Disallowed,
        },
        errors: {
            ...definedPropertySettings,
            value: result.success ? [] : result.errors,
        },
        tokens: { ...definedPropertySettings, value: tokens },
        loc: {
            ...definedPropertySettings,
            value: {
                ...tokens[0].loc,
                end: tokens[tokens.length - 1].loc.end,
            },
        },
    });
}

export { parseSelector };
