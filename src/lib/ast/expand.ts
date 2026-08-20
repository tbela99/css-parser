import { splitRule } from "./minify.ts";
import { combinators, PARENT, RAW, STATE } from "../syntax/constants.ts";
import { parseString } from "../parser/parse.ts";
import { walkValues } from "./walk.ts";
import { renderValue } from "../renderer/render.ts";
import type { AstAtRule, AstNode, AstRule, AstStyleSheet, LiteralToken, Token } from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "./types.ts";
import { cloneNode } from "./clone.ts";

/**
 * expand css nesting ast nodes
 * @param ast
 *
 * @private
 */
export function expand(ast: AstStyleSheet | AstAtRule | AstRule): AstNode {

    if(
                (ast as AstNode)[STATE] == EnumAstNodeStatus.Invalid ||
                (ast as AstNode)[STATE] == EnumAstNodeStatus.Disallowed ||
                (ast as AstNode)[STATE] == EnumAstNodeStatus.Unknown ||
                (ast as AstNode)[STATE] == EnumAstNodeStatus.Unparsed ||
                (ast as AstNode)[STATE] == EnumAstNodeStatus.Malformed
    ) {
        return ast;
    }

    const result = Object.assign(cloneNode(ast), { chi: [] }) as AstStyleSheet | AstAtRule;
    let children: AstNode[];

    for (let i = 0; i < ast.chi!.length; i++) {
        let node = ast.chi![i];

        if (node.typ === EnumToken.RuleNodeType) {
            children = expandRule(node as AstRule);

            for (const child of children) {
                child[PARENT] = result;
            }

            // @ts-ignore
            result.chi.push(...children);
        } else if (node.typ == EnumToken.AtRuleNodeType && "chi" in node) {
            let hasRule: boolean = false;
            let j: number = node!.chi!.length;

            while (j--) {
                // @ts-ignore
                if (node.chi[j].typ == EnumToken.RuleNodeType || node.chi[j].typ == EnumToken.AtRuleNodeType) {
                    hasRule = true;
                    break;
                }
            }

            if (hasRule) {
                node = expand(node as AstRule);

                for (const child of node.chi) {
                    child[PARENT] = result;
                }

                node[PARENT] = result;
                // @ts-ignore
                result.chi.push(node);
            } else {
                node[PARENT] = result;
                // @ts-ignore
                result.chi.push(node);
            }
        } else {
            node[PARENT] = result;
            // @ts-ignore

            result.chi!.push(node);
        }
    }

    return result;
}

function expandRule(node: AstRule): Array<AstRule | AstAtRule> {

    if(
                (node as AstNode)[STATE] == EnumAstNodeStatus.Invalid ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Disallowed ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Unknown ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Unparsed ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Malformed
    ) {
        return [node];
    }

    const ast: AstRule = Object.assign(cloneNode(node), {chi: node.chi.slice() }) as AstRule;
    const result: Array<AstRule | AstAtRule> = [];

    if (ast.typ == EnumToken.RuleNodeType) {
        let i: number = 0;

        for (; i < ast.chi.length; i++) {
            if (ast.chi[i].typ == EnumToken.RuleNodeType) {
                const rule: AstRule = (<AstRule>ast).chi[i] as AstRule;

                if (!rule.sel.includes("&")) {
                    const selRule: string[][] = splitRule(rule.sel);

                    const arSelf: string = splitRule(ast.sel)
                        .filter((r: string[]): boolean =>
                            r.every((t: string): boolean => t != ":before" && t != ":after" && !t.startsWith("::")),
                        )
                        .reduce((acc: string[], curr: string[]): string[] => acc.concat([curr.join("")]), <string[]>[])
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
                        .reduce(
                            (acc: string[], curr: string[]) => {
                                acc.push(curr.join(""));

                                return acc;
                            },
                            <string[]>[],
                        )
                        .join(",");
                } else {
                    let childSelectorCompound: string[] = [];
                    let withCompound: string[] = [];
                    let withoutCompound: string[] = [];

                    // pseudo elements cannot be used with '&'
                    // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                    const rules: string[][] = splitRule(ast.sel).filter((r: string[]): boolean =>
                        r.every((t: string): boolean => t != ":before" && t != ":after" && !t.startsWith("::")),
                    );
                    const parentSelector: boolean = !node.sel.includes("&");

                    if (rules.length == 0) {
                        ast.chi.splice(i--, 1);
                        continue;
                    }

                    for (const sel of rule[RAW] ?? splitRule(rule.sel)) {
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
                            selectors.push(replaceCompound("& " + childSelectorCompound[0].trim(), selector));
                        } else {
                            selectors.push(
                                replaceCompound(
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
                            selectors.push(replaceCompound(withCompound[0], selector));
                        }
                    }

                    rule.sel = selectors.reduce(
                        (acc, curr) => (curr.length == 0 ? acc : acc + (acc.length > 0 ? "," : "") + curr),
                        "",
                    );
                }

                ast.chi.splice(i--, 1);

                result.push(...(<AstRule[]>expandRule(rule)));
            } else if (ast.chi[i].typ == EnumToken.AtRuleNodeType) {
                let astAtRule: AstAtRule = <AstAtRule>ast.chi[i];
                const values: Array<AstRule | AstAtRule> = <Array<AstRule | AstAtRule>>[];

                if (astAtRule.nam === "scope") {
                    if (astAtRule.val.includes("&")) {
                        astAtRule.val = replaceCompound(astAtRule.val, ast.sel);
                    }

                    const slice = (astAtRule.chi as AstNode[])
                        .slice()
                        .filter((t) => t.typ == EnumToken.RuleNodeType && ((t as AstRule).sel as string).includes("&"));

                    if (slice.length > 0) {
                        expandRule(<AstRule>{ ...node, chi: (astAtRule.chi as AstNode[]).slice() });
                    }
                } else {
                    // @ts-ignore
                    const clone: AstRule = <AstRule>{ ...ast, chi: astAtRule.chi.slice() };

                    // @ts-ignore
                    astAtRule.chi.length = 0;

                    for (const r of <Array<AstRule | AstAtRule>>expandRule(clone)) {
                        if (r.typ == EnumToken.AtRuleNodeType && "chi" in r) {
                            if (astAtRule.val !== "" && (<AstAtRule>r).val !== "") {
                                if (astAtRule.nam === "media" && (<AstAtRule>r).nam === "media") {
                                    (<AstAtRule>r).val = astAtRule.val + " and " + (<AstAtRule>r).val;
                                } else if (astAtRule.nam == "layer" && (<AstAtRule>r).nam == "layer") {
                                    (<AstAtRule>r).val = astAtRule.val + "." + (<AstAtRule>r).val;
                                }
                            }

                            // @ts-ignore
                            values.push(r);
                        } else if (r.typ == EnumToken.RuleNodeType) {
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
export function replaceCompound(input: string, replace: string): string {
    const tokens: Token[] = parseString(input);
    let replacement: Token[] | null = null;

    for (const t of walkValues(tokens)) {
        if (t.value.typ == EnumToken.NestingSelectorTokenType) {
            if (tokens.length == 2) {
                if (replacement == null) {
                    replacement = parseString(replace);
                }

                Object.assign(t.value, {
                    typ: EnumToken.LiteralTokenType,
                    val: replaceCompoundLiteral((t.value as LiteralToken).val, replace),
                });

                continue;
            }

            const rule: string[][] = splitRule(replace);
            Object.assign(t.value, {
                typ: EnumToken.LiteralTokenType,
                val: rule.length > 1 ? ":is(" + replace + ")" : replace,
            });
        }
    }

    return tokens.reduce((acc: string, curr: Token) => acc + renderValue(curr), "");
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
