import { splitRule } from './minify.js';
import { STATE, PARENT, combinators, RAW } from '../syntax/constants.js';
import { parseString } from '../parser/parse.js';
import { walkValues } from './walk.js';
import { renderValue } from '../renderer/render.js';
import { EnumAstNodeStatus, EnumToken } from './types.js';
import { cloneNode } from './clone.js';

/**
 * expand css nesting ast nodes
 * @param ast
 *
 * @private
 */
function expand(ast) {
    if (ast[STATE] == EnumAstNodeStatus.Invalid ||
        ast[STATE] == EnumAstNodeStatus.Disallowed ||
        ast[STATE] == EnumAstNodeStatus.Unknown ||
        ast[STATE] == EnumAstNodeStatus.Unparsed ||
        ast[STATE] == EnumAstNodeStatus.Malformed) {
        return ast;
    }
    const result = Object.assign(cloneNode(ast), { chi: [] });
    let children;
    for (let i = 0; i < ast.chi.length; i++) {
        let node = ast.chi[i];
        if (node.typ === EnumToken.RuleNodeType) {
            children = expandRule(node);
            for (const child of children) {
                child[PARENT] = result;
            }
            // @ts-ignore
            result.chi.push(...children);
        }
        else if (node.typ == EnumToken.AtRuleNodeType && "chi" in node) {
            let hasRule = false;
            let j = node.chi.length;
            while (j--) {
                // @ts-ignore
                if (node.chi[j].typ == EnumToken.RuleNodeType || node.chi[j].typ == EnumToken.AtRuleNodeType) {
                    hasRule = true;
                    break;
                }
            }
            if (hasRule) {
                node = expand(node);
                for (const child of node.chi) {
                    child[PARENT] = result;
                }
                node[PARENT] = result;
                // @ts-ignore
                result.chi.push(node);
            }
            else {
                node[PARENT] = result;
                // @ts-ignore
                result.chi.push(node);
            }
        }
        else {
            node[PARENT] = result;
            // @ts-ignore
            result.chi.push(node);
        }
    }
    return result;
}
function expandRule(node) {
    if (node[STATE] == EnumAstNodeStatus.Invalid ||
        node[STATE] == EnumAstNodeStatus.Disallowed ||
        node[STATE] == EnumAstNodeStatus.Unknown ||
        node[STATE] == EnumAstNodeStatus.Unparsed ||
        node[STATE] == EnumAstNodeStatus.Malformed) {
        return [node];
    }
    const ast = Object.assign(cloneNode(node), { chi: node.chi.slice() });
    const result = [];
    if (ast.typ == EnumToken.RuleNodeType) {
        let i = 0;
        for (; i < ast.chi.length; i++) {
            if (ast.chi[i].typ == EnumToken.RuleNodeType) {
                const rule = ast.chi[i];
                if (!rule.sel.includes("&")) {
                    const selRule = splitRule(rule.sel);
                    const arSelf = splitRule(ast.sel)
                        .filter((r) => r.every((t) => t != ":before" && t != ":after" && !t.startsWith("::")))
                        .reduce((acc, curr) => acc.concat([curr.join("")]), [])
                        .join(",");
                    if (arSelf.length == 0) {
                        ast.chi.splice(i--, 1);
                        continue;
                    }
                    for (let i1 = 0; i1 < selRule.length; i1++) {
                        const arr = selRule[i1];
                        combinators.includes(arr[0].charAt(0)) ? arr.unshift(arSelf) : arr.unshift(arSelf, " ");
                    }
                    rule.sel = selRule
                        .reduce((acc, curr) => {
                        acc.push(curr.join(""));
                        return acc;
                    }, [])
                        .join(",");
                }
                else {
                    let childSelectorCompound = [];
                    let withCompound = [];
                    let withoutCompound = [];
                    // pseudo elements cannot be used with '&'
                    // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                    const rules = splitRule(ast.sel).filter((r) => r.every((t) => t != ":before" && t != ":after" && !t.startsWith("::")));
                    const parentSelector = !node.sel.includes("&");
                    if (rules.length == 0) {
                        ast.chi.splice(i--, 1);
                        continue;
                    }
                    for (const sel of rule[RAW] ?? splitRule(rule.sel)) {
                        const s = sel.join("");
                        if (s.includes("&") || parentSelector) {
                            if (s.indexOf("&", 1) == -1) {
                                if (s.at(0) == "&") {
                                    if (s.at(1) == " ") {
                                        childSelectorCompound.push(s.slice(2));
                                    }
                                    else {
                                        if (s == "&" || parentSelector) {
                                            withCompound.push(s);
                                        }
                                    }
                                }
                                else {
                                    withoutCompound.push(s);
                                }
                            }
                            else {
                                withCompound.push(s);
                            }
                        }
                    }
                    const selectors = [];
                    const selector = rules.length > 1 ? ":is(" + rules.map((a) => a.join("")).join(",") + ")" : rules[0].join("");
                    if (childSelectorCompound.length > 0) {
                        if (childSelectorCompound.length == 1) {
                            selectors.push(replaceCompound("& " + childSelectorCompound[0].trim(), selector));
                        }
                        else {
                            selectors.push(replaceCompound("& :is(" +
                                childSelectorCompound.reduce((acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(), "") +
                                ")", selector));
                        }
                    }
                    if (withCompound.length > 0) {
                        if (withCompound.every((t) => t[0] == "&" && t.indexOf("&", 1) == -1)) {
                            withoutCompound.push(...withCompound.map((t) => t.slice(1)));
                            withCompound.length = 0;
                        }
                    }
                    if (withoutCompound.length > 0) {
                        if (withoutCompound.length == 1) {
                            const useIs = rules.length == 1 &&
                                selector.match(/^[a-zA-Z.:]/) != null &&
                                selector.includes(" ") &&
                                withoutCompound.length == 1 &&
                                withoutCompound[0].match(/^[a-zA-Z]+$/) != null;
                            const compound = useIs ? ":is(&)" : "&";
                            selectors.push(replaceCompound(rules.length == 1
                                ? useIs
                                    ? withoutCompound[0] + ":is(&)"
                                    : selector.match(/^[.:]/) && withoutCompound[0].match(/^[a-zA-Z]+$/)
                                        ? withoutCompound[0] + compound
                                        : compound + withoutCompound[0]
                                : withoutCompound[0].match(/^[a-zA-Z:]+$/)
                                    ? withoutCompound[0].trim() + compound
                                    : "&" +
                                        (withoutCompound[0].match(/^\S+$/)
                                            ? withoutCompound[0].trim()
                                            : ":is(" + withoutCompound[0].trim() + ")"), selector));
                        }
                        else {
                            selectors.push(replaceCompound("&:is(" +
                                withoutCompound.reduce((acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(), "") +
                                ")", selector));
                        }
                    }
                    if (withCompound.length > 0) {
                        if (withCompound.length == 1) {
                            selectors.push(replaceCompound(withCompound[0], selector));
                        }
                    }
                    rule.sel = selectors.reduce((acc, curr) => (curr.length == 0 ? acc : acc + (acc.length > 0 ? "," : "") + curr), "");
                }
                ast.chi.splice(i--, 1);
                result.push(...expandRule(rule));
            }
            else if (ast.chi[i].typ == EnumToken.AtRuleNodeType) {
                let astAtRule = ast.chi[i];
                const values = [];
                if (astAtRule.nam === "scope") {
                    if (astAtRule.val.includes("&")) {
                        astAtRule.val = replaceCompound(astAtRule.val, ast.sel);
                    }
                    const slice = astAtRule.chi
                        .slice()
                        .filter((t) => t.typ == EnumToken.RuleNodeType && t.sel.includes("&"));
                    if (slice.length > 0) {
                        expandRule({ ...node, chi: astAtRule.chi.slice() });
                    }
                }
                else {
                    // @ts-ignore
                    const clone = { ...ast, chi: astAtRule.chi.slice() };
                    // @ts-ignore
                    astAtRule.chi.length = 0;
                    for (const r of expandRule(clone)) {
                        if (r.typ == EnumToken.AtRuleNodeType && "chi" in r) {
                            if (astAtRule.val !== "" && r.val !== "") {
                                if (astAtRule.nam === "media" && r.nam === "media") {
                                    r.val = astAtRule.val + " and " + r.val;
                                }
                                else if (astAtRule.nam == "layer" && r.nam == "layer") {
                                    r.val = astAtRule.val + "." + r.val;
                                }
                            }
                            // @ts-ignore
                            values.push(r);
                        }
                        else if (r.typ == EnumToken.RuleNodeType) {
                            // @ts-ignore
                            astAtRule.chi.push(...expandRule(r));
                        }
                    }
                }
                // @ts-ignore
                result.push(...(astAtRule.chi.length > 0 ? [astAtRule].concat(values) : values));
                ast.chi.splice(i--, 1);
            }
        }
    }
    // @ts-ignore
    return ast.chi.length > 0 ? [ast].concat(result) : result;
}
/**
 * replace compound selector
 * @param input
 * @param replace
 */
function replaceCompound(input, replace) {
    const tokens = parseString(input);
    let replacement = null;
    for (const t of walkValues(tokens)) {
        if (t.value.typ == EnumToken.NestingSelectorTokenType) {
            if (tokens.length == 2) {
                if (replacement == null) {
                    replacement = parseString(replace);
                }
                Object.assign(t.value, {
                    typ: EnumToken.LiteralTokenType,
                    val: replaceCompoundLiteral(t.value.val, replace),
                });
                continue;
            }
            const rule = splitRule(replace);
            Object.assign(t.value, {
                typ: EnumToken.LiteralTokenType,
                val: rule.length > 1 ? ":is(" + replace + ")" : replace,
            });
        }
    }
    return tokens.reduce((acc, curr) => acc + renderValue(curr), "");
}
function replaceCompoundLiteral(selector, replace) {
    const tokens = [""];
    let i = 0;
    for (; i < selector.length; i++) {
        if (selector.charAt(i) == "&") {
            tokens.push("&", "");
        }
    }
    return tokens
        .sort((a, b) => {
        if (a == "&") {
            return 1;
        }
        return b == "&" ? -1 : 0;
    })
        .reduce((acc, curr) => acc + (curr == "&" ? replace : curr), "");
}

export { expand, replaceCompound };
