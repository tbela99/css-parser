/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { splitRule } from './minify.js';
import { combinators } from '../syntax/constants.js';
import { parseString } from '../parser/parse.js';
import { walkValues } from './walk.js';
import { renderValue } from '../printer/render.js';
import { EnumToken, EnumAstNodeStatus } from './types.js';

const skipStates = EnumAstNodeStatus.Invalid |
    EnumAstNodeStatus.Disallowed |
    EnumAstNodeStatus.Unknown |
    EnumAstNodeStatus.Unparsed |
    EnumAstNodeStatus.Malformed;
/**
 * expand css nesting ast nodes.
 * the tree is expanded in place: nested rules are moved into the parent of the node
 * @param arena
 * @param ast
 *
 * @private
 */
function expand(arena, ast) {
    if (arena.flags[ast] & skipStates) {
        return ast;
    }
    let node = arena.firstChild[ast];
    while (node != 0) {
        const next = arena.nextSibling[node];
        const typ = arena.dataTypes[node];
        if (typ === EnumToken.RuleNodeType) {
            // the expanded rules are inserted after the rule
            expandRule(arena, node, ast, next);
        }
        else if (typ == EnumToken.AtRuleNodeType && arena.flags[node] & EnumAstNodeStatus.HasChildren) {
            let j = arena.lastChild[node];
            while (j != 0) {
                if (arena.dataTypes[j] == EnumToken.RuleNodeType || arena.dataTypes[j] == EnumToken.AtRuleNodeType) {
                    expand(arena, node);
                    break;
                }
                j = arena.previousSibling[j];
            }
        }
        node = next;
    }
    return ast;
}
/**
 * expand a rule: the nested rules and at-rules are moved out of the rule, into `parent` before `before`.
 * the rule is detached when it has no children left
 * @param arena
 * @param node
 * @param parent
 * @param before the expanded nodes are inserted before this child of parent. they are appended when 0
 */
function expandRule(arena, node, parent, before) {
    if (arena.flags[node] & skipStates) {
        return;
    }
    const ast = node;
    const sel = arena.strings[arena.name[ast]];
    const place = (child) => {
        if (before == 0) {
            arena.appendChild(parent, child);
        }
        else {
            arena.insertBefore(before, child);
        }
    };
    if (arena.dataTypes[ast] == EnumToken.RuleNodeType) {
        let child = arena.firstChild[ast];
        while (child != 0) {
            const next = arena.nextSibling[child];
            const typ = arena.dataTypes[child];
            if (typ == EnumToken.RuleNodeType) {
                const rule = child;
                const ruleSel = arena.strings[arena.name[rule]];
                if (!ruleSel.includes("&")) {
                    const selRule = splitRule(ruleSel);
                    const arSelf = splitRule(sel)
                        .filter((r) => r.every((t) => t != ":before" && t != ":after" && !t.startsWith("::")))
                        .reduce((acc, curr) => acc.concat([curr.join("")]), [])
                        .join(",");
                    if (arSelf.length == 0) {
                        arena.detach(rule);
                        child = next;
                        continue;
                    }
                    for (let i1 = 0; i1 < selRule.length; i1++) {
                        const arr = selRule[i1];
                        combinators.includes(arr[0].charAt(0)) ? arr.unshift(arSelf) : arr.unshift(arSelf, " ");
                    }
                    arena.setSelector(rule, selRule
                        .reduce((acc, curr) => {
                        acc.push(curr.join(""));
                        return acc;
                    }, [])
                        .join(","));
                }
                else {
                    let childSelectorCompound = [];
                    let withCompound = [];
                    let withoutCompound = [];
                    // pseudo elements cannot be used with '&'
                    // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                    const rules = splitRule(sel).filter((r) => r.every((t) => t != ":before" && t != ":after" && !t.startsWith("::")));
                    const parentSelector = !sel.includes("&");
                    if (rules.length == 0) {
                        arena.detach(rule);
                        child = next;
                        continue;
                    }
                    for (const sel of arena.raw[rule] ?? splitRule(ruleSel)) {
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
                            selectors.push(replaceCompound(arena, "& " + childSelectorCompound[0].trim(), selector));
                        }
                        else {
                            selectors.push(replaceCompound(arena, "& :is(" +
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
                            selectors.push(replaceCompound(arena, rules.length == 1
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
                            selectors.push(replaceCompound(arena, "&:is(" +
                                withoutCompound.reduce((acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(), "") +
                                ")", selector));
                        }
                    }
                    if (withCompound.length > 0) {
                        if (withCompound.length == 1) {
                            selectors.push(replaceCompound(arena, withCompound[0], selector));
                        }
                    }
                    arena.setSelector(rule, selectors.reduce((acc, curr) => (curr.length == 0 ? acc : acc + (acc.length > 0 ? "," : "") + curr), ""));
                }
                place(rule);
                expandRule(arena, rule, parent, before);
            }
            else if (typ == EnumToken.AtRuleNodeType) {
                const astAtRule = child;
                const atRuleName = arena.strings[arena.name[astAtRule]];
                if (atRuleName === "scope") {
                    const atRuleValue = arena.strings[arena.stringValue[astAtRule]];
                    if (atRuleValue.includes("&")) {
                        arena.setValueString(astAtRule, replaceCompound(arena, atRuleValue, sel));
                    }
                    let hasNesting = false;
                    for (let t = arena.firstChild[astAtRule]; t != 0; t = arena.nextSibling[t]) {
                        if (arena.dataTypes[t] == EnumToken.RuleNodeType &&
                            arena.strings[arena.name[t]].includes("&")) {
                            hasNesting = true;
                            break;
                        }
                    }
                    if (hasNesting) {
                        // expand the nested rules against the parent selector
                        const clone = arena.clone(node);
                        arena.moveChildren(astAtRule, clone);
                        expandRule(arena, clone, astAtRule, 0);
                        // declarations stay in the at-rule, before the expanded rules
                        arena.moveChildren(clone, astAtRule, arena.firstChild[astAtRule]);
                    }
                    place(astAtRule);
                }
                else {
                    const clone = arena.clone(ast);
                    // the rules are expanded inside the at-rule: [clone, ...expanded nodes]
                    arena.moveChildren(astAtRule, clone);
                    expandRule(arena, clone, astAtRule, 0);
                    if (arena.firstChild[clone] != 0) {
                        // the rule declarations are wrapped in the clone, before the expanded nodes
                        if (arena.firstChild[astAtRule] == 0) {
                            arena.appendChild(astAtRule, clone);
                        }
                        else {
                            arena.insertBefore(arena.firstChild[astAtRule], clone);
                        }
                    }
                    place(astAtRule);
                    // the expanded at-rules are moved after the at-rule
                    let r = arena.firstChild[astAtRule];
                    while (r != 0) {
                        const nextRule = arena.nextSibling[r];
                        if (arena.dataTypes[r] == EnumToken.AtRuleNodeType) {
                            if (arena.flags[r] & EnumAstNodeStatus.HasChildren) {
                                const val = arena.strings[arena.stringValue[astAtRule]];
                                const rVal = arena.strings[arena.stringValue[r]];
                                if (val !== "" && rVal !== "") {
                                    const rName = arena.strings[arena.name[r]];
                                    if (atRuleName === "media" && rName === "media") {
                                        arena.setValueString(r, val + " and " + rVal);
                                    }
                                    else if (atRuleName == "layer" && rName == "layer") {
                                        arena.setValueString(r, val + "." + rVal);
                                    }
                                }
                                place(r);
                            }
                            else {
                                arena.detach(r);
                            }
                        }
                        r = nextRule;
                    }
                }
                if (arena.firstChild[astAtRule] == 0) {
                    arena.detach(astAtRule);
                }
            }
            child = next;
        }
    }
    if (arena.firstChild[ast] == 0) {
        arena.detach(ast);
    }
}
/**
 * replace compound selector
 * @param input
 * @param replace
 */
function replaceCompound(arena, input, replace) {
    const tokens = parseString(arena, input);
    for (const t of walkValues(arena, tokens)) {
        if (arena.dataTypes[t.value] == EnumToken.NestingSelectorTokenType) {
            if (tokens.length == 2) {
                arena.resetToken(t.value, EnumToken.LiteralTokenType, replaceCompoundLiteral(arena.strings[arena.stringValue[t.value]], replace));
                continue;
            }
            const rule = splitRule(replace);
            arena.resetToken(t.value, EnumToken.LiteralTokenType, rule.length > 1 ? ":is(" + replace + ")" : replace);
        }
    }
    return tokens.reduce((acc, curr) => acc + renderValue(arena, curr), "");
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
