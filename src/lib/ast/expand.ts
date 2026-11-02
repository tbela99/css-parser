import { splitRule } from "./minify.ts";
import { combinators } from "../syntax/constants.ts";
import { parseString } from "../parser/parse.ts";
import { walkValues } from "./walk.ts";
import { renderValue } from "../printer/render.ts";
import type { AstAtRule, AstNode, AstRule, AstStyleSheet, LiteralToken, Token } from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "./types.ts";
import type { AstArena } from "./arena.ts";

const skipStates: number =
    EnumAstNodeStatus.Invalid |
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
export function expand(arena: AstArena, ast: AstStyleSheet | AstAtRule | AstRule): AstNode {
    if (arena.flags[ast] & skipStates) {
        return ast;
    }

    const children: AstNode[] = arena.children(ast);
    const result: AstNode[] = [];

    for (let i = 0; i < children.length; i++) {
        let node: AstNode = children[i];
        const typ: EnumToken = arena.dataTypes[node];

        if (typ === EnumToken.RuleNodeType) {
            for (const child of expandRule(arena, node)) {
                result.push(child);
            }
        } else if (typ == EnumToken.AtRuleNodeType && arena.flags[node] & EnumAstNodeStatus.HasChildren) {
            let hasRule: boolean = false;
            let j: AstNode = arena.lastChild[node];

            while (j != 0) {
                if (arena.dataTypes[j] == EnumToken.RuleNodeType || arena.dataTypes[j] == EnumToken.AtRuleNodeType) {
                    hasRule = true;
                    break;
                }

                j = arena.previousSibling[j];
            }

            if (hasRule) {
                node = expand(arena, node);
            }

            result.push(node);
        } else {
            result.push(node);
        }
    }

    arena.setChildList(ast, result);
    return ast;
}

/**
 * expand a rule. nested rules and at-rules are detached from the rule and returned
 * @param arena
 * @param node
 */
function expandRule(arena: AstArena, node: AstRule): Array<AstRule | AstAtRule> {
    if (arena.flags[node] & skipStates) {
        return [node];
    }

    const ast: AstRule = node;
    const result: Array<AstRule | AstAtRule> = [];
    const sel: string = arena.strings[arena.name[ast]];

    if (arena.dataTypes[ast] == EnumToken.RuleNodeType) {
        let child: AstNode = arena.firstChild[ast];

        while (child != 0) {
            const next: AstNode = arena.nextSibling[child];
            const typ: EnumToken = arena.dataTypes[child];

            if (typ == EnumToken.RuleNodeType) {
                const rule: AstRule = child;
                const ruleSel: string = arena.strings[arena.name[rule]];

                if (!ruleSel.includes("&")) {
                    const selRule: string[][] = splitRule(ruleSel);

                    const arSelf: string = splitRule(sel)
                        .filter((r: string[]): boolean =>
                            r.every((t: string): boolean => t != ":before" && t != ":after" && !t.startsWith("::")),
                        )
                        .reduce((acc: string[], curr: string[]): string[] => acc.concat([curr.join("")]), <string[]>[])
                        .join(",");

                    if (arSelf.length == 0) {
                        arena.release(rule, true);
                        child = next;
                        continue;
                    }

                    for (let i1 = 0; i1 < selRule.length; i1++) {
                        const arr = selRule[i1];
                        combinators.includes(arr[0].charAt(0)) ? arr.unshift(arSelf) : arr.unshift(arSelf, " ");
                    }

                    arena.setSelector(
                        rule,
                        selRule
                            .reduce(
                                (acc: string[], curr: string[]) => {
                                    acc.push(curr.join(""));

                                    return acc;
                                },
                                <string[]>[],
                            )
                            .join(","),
                    );
                } else {
                    let childSelectorCompound: string[] = [];
                    let withCompound: string[] = [];
                    let withoutCompound: string[] = [];

                    // pseudo elements cannot be used with '&'
                    // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                    const rules: string[][] = splitRule(sel).filter((r: string[]): boolean =>
                        r.every((t: string): boolean => t != ":before" && t != ":after" && !t.startsWith("::")),
                    );
                    const parentSelector: boolean = !sel.includes("&");

                    if (rules.length == 0) {
                        arena.release(rule, true);
                        child = next;
                        continue;
                    }

                    for (const sel of arena.raw[rule] ?? splitRule(ruleSel)) {
                        const s: string = sel.join("");

                        if (s.includes("&") || parentSelector) {
                            if (s.indexOf("&", 1) == -1) {
                                if (s.at(0) == "&") {
                                    if (s.at(1) == " ") {
                                        childSelectorCompound.push(s.slice(2));
                                    } else {
                                        if (s == "&" || parentSelector) {
                                            withCompound.push(s);
                                        }
                                    }
                                } else {
                                    withoutCompound.push(s);
                                }
                            } else {
                                withCompound.push(s);
                            }
                        }
                    }

                    const selectors: string[] = [];
                    const selector: string =
                        rules.length > 1 ? ":is(" + rules.map((a) => a.join("")).join(",") + ")" : rules[0].join("");

                    if (childSelectorCompound.length > 0) {
                        if (childSelectorCompound.length == 1) {
                            selectors.push(replaceCompound(arena, "& " + childSelectorCompound[0].trim(), selector));
                        } else {
                            selectors.push(
                                replaceCompound(
                                    arena,
                                    "& :is(" +
                                        childSelectorCompound.reduce(
                                            (acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(),
                                            "",
                                        ) +
                                        ")",
                                    selector,
                                ),
                            );
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
                            const useIs: boolean =
                                rules.length == 1 &&
                                selector.match(/^[a-zA-Z.:]/) != null &&
                                selector.includes(" ") &&
                                withoutCompound.length == 1 &&
                                withoutCompound[0].match(/^[a-zA-Z]+$/) != null;
                            const compound = useIs ? ":is(&)" : "&";

                            selectors.push(
                                replaceCompound(
                                    arena,
                                    rules.length == 1
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
                                                : ":is(" + withoutCompound[0].trim() + ")"),
                                    selector,
                                ),
                            );
                        } else {
                            selectors.push(
                                replaceCompound(
                                    arena,
                                    "&:is(" +
                                        withoutCompound.reduce(
                                            (acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(),
                                            "",
                                        ) +
                                        ")",
                                    selector,
                                ),
                            );
                        }
                    }

                    if (withCompound.length > 0) {
                        if (withCompound.length == 1) {
                            selectors.push(replaceCompound(arena, withCompound[0], selector));
                        }
                    }

                    arena.setSelector(
                        rule,
                        selectors.reduce(
                            (acc, curr) => (curr.length == 0 ? acc : acc + (acc.length > 0 ? "," : "") + curr),
                            "",
                        ),
                    );
                }

                arena.detach(rule);

                for (const s of expandRule(arena, rule) as AstRule[]) {
                    result.push(s);
                }
            } else if (typ == EnumToken.AtRuleNodeType) {
                const astAtRule: AstAtRule = child;
                const values: Array<AstRule | AstAtRule> = <Array<AstRule | AstAtRule>>[];
                const atRuleName: string = arena.strings[arena.name[astAtRule]];

                if (atRuleName === "scope") {
                    const atRuleValue: string = arena.strings[arena.stringValue[astAtRule]];

                    if (atRuleValue.includes("&")) {
                        arena.setValueString(astAtRule, replaceCompound(arena, atRuleValue, sel));
                    }

                    let hasNesting: boolean = false;

                    for (let t = arena.firstChild[astAtRule]; t != 0; t = arena.nextSibling[t]) {
                        if (
                            arena.dataTypes[t] == EnumToken.RuleNodeType &&
                            arena.strings[arena.name[t]].includes("&")
                        ) {
                            hasNesting = true;
                            break;
                        }
                    }

                    if (hasNesting) {
                        // expand the nested rules against the parent selector
                        const clone: AstRule = arena.clone(node);

                        arena.setChildList(clone, arena.children(astAtRule));

                        const expanded: Array<AstRule | AstAtRule> = expandRule(arena, clone);

                        // declarations stay in the at-rule
                        arena.setChildList(astAtRule, arena.children(clone));
                        arena.release(clone);

                        for (const r of expanded) {
                            if (r != clone) {
                                arena.appendChildren(astAtRule, r);
                            }
                        }
                    }
                } else {
                    const clone: AstRule = arena.clone(ast);

                    arena.setChildList(clone, arena.children(astAtRule));

                    for (const r of <Array<AstRule | AstAtRule>>expandRule(arena, clone)) {
                        if (
                            arena.dataTypes[r] == EnumToken.AtRuleNodeType &&
                            arena.flags[r] & EnumAstNodeStatus.HasChildren
                        ) {
                            const val: string = arena.strings[arena.stringValue[astAtRule]];
                            const rVal: string = arena.strings[arena.stringValue[r]];

                            if (val !== "" && rVal !== "") {
                                const rName: string = arena.strings[arena.name[r]];

                                if (atRuleName === "media" && rName === "media") {
                                    arena.setValueString(r, val + " and " + rVal);
                                } else if (atRuleName == "layer" && rName == "layer") {
                                    arena.setValueString(r, val + "." + rVal);
                                }
                            }

                            values.push(r);
                        } else if (arena.dataTypes[r] == EnumToken.RuleNodeType) {
                            for (const rule of expandRule(arena, r)) {
                                arena.appendChildren(astAtRule, rule);
                            }
                        }
                    }
                }

                arena.detach(astAtRule);

                if (arena.firstChild[astAtRule] != 0) {
                    result.push(astAtRule);
                }

                for (const r of values) {
                    result.push(r);
                }
            }

            child = next;
        }
    }

    return arena.firstChild[ast] != 0 ? [ast].concat(result) : result;
}

/**
 * replace compound selector
 * @param input
 * @param replace
 */
export function replaceCompound(arena: AstArena, input: string, replace: string): string {
    const tokens: Token[] = parseString(arena, input);

    for (const t of walkValues(arena, tokens)) {
        if (arena.dataTypes[t.value] == EnumToken.NestingSelectorTokenType) {
            if (tokens.length == 2) {
                arena.resetToken(
                    t.value,
                    EnumToken.LiteralTokenType,
                    replaceCompoundLiteral(arena.strings[arena.stringValue[t.value]], replace),
                );

                continue;
            }

            const rule: string[][] = splitRule(replace);

            arena.resetToken(t.value, EnumToken.LiteralTokenType, rule.length > 1 ? ":is(" + replace + ")" : replace);
        }
    }

    return tokens.reduce((acc: string, curr: Token) => acc + renderValue(arena, curr), "");
}

function replaceCompoundLiteral(selector: string, replace: string) {
    const tokens: string[] = [""];

    let i: number = 0;

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
        .reduce((acc: string, curr: string): string => acc + (curr == "&" ? replace : curr), "");
}
