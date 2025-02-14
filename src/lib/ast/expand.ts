import {combinators, splitRule} from "./minify";
import {parseString} from "../parser";
import {walkValues} from "./walk";
import {renderToken} from "../renderer";
import type {AstAtRule, AstNode, AstRule, AstRuleStyleSheet, Token} from "../../@types";
import {EnumToken} from "./types";

export function expand(ast: AstNode): AstNode {
    //
    if (![EnumToken.RuleNodeType, EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType].includes(ast.typ)) {

        return ast;
    }

    if (EnumToken.RuleNodeType == ast.typ) {

        return <AstRuleStyleSheet>{
            typ: EnumToken.StyleSheetNodeType,
            chi: expandRule(<AstRule>ast)
        }
    }

    if (!('chi' in ast)) {

        return ast;
    }

    const result = <AstRuleStyleSheet | AstAtRule>{...ast, chi: []};

    // @ts-ignore
    for (let i = 0; i < ast.chi.length; i++) {

        // @ts-ignore
        const node = ast.chi[i];

        if (node.typ == EnumToken.RuleNodeType) {

            // @ts-ignore
            result.chi.push(...expandRule(<AstRule>node));
            // i += expanded.length - 1;
        } else if (node.typ == EnumToken.AtRuleNodeType && 'chi' in node) {

            let hasRule = false;
            let j = node!.chi!.length;

            while (j--) {

                // @ts-ignore
                if (node.chi[j].typ == EnumToken.RuleNodeType || node.chi[j].typ == EnumToken.AtRuleNodeType) {

                    hasRule = true;
                    break;
                }
            }

            // @ts-ignore
            result.chi.push(<AstAtRule>{...(hasRule ? expand(node) : node)});
        } else {

            // @ts-ignore
            result.chi.push(node);
        }
    }

    return result;
}

function expandRule(node: AstRule, parent?: AstRule): Array<AstRule | AstAtRule> {

    const ast: AstRule = <AstRule>{...node, chi: node.chi.slice()};
    const result: Array<AstRule | AstAtRule> = [];

    if (ast.typ == EnumToken.RuleNodeType) {

        let i: number = 0;

        for (; i < ast.chi.length; i++) {

            if (ast.chi[i].typ == EnumToken.RuleNodeType) {

                const rule: AstRule = <AstRule>(<AstRule>ast).chi[i];

                if (!rule.sel.includes('&')) {

                    const selRule: string[][] = splitRule(rule.sel);

                    if (selRule.length > 1) {

                        const r: string = ':is(' + selRule.map(a => a.join('')).join(',') + ')';
                        rule.sel = splitRule(ast.sel).reduce((a, b) => a.concat([b.join('') + r]), <string[]>[]).join(',');

                    } else {

                        selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(ast.sel) : arr.unshift(ast.sel, ' '));
                        rule.sel = selRule.reduce((acc: string[], curr: string[]) => {

                            acc.push(curr.join(''));

                            return acc;
                        }, <string[]>[]).join(',');
                    }

                } else {

                    let childSelectorCompound: string[] = [];
                    let withCompound: string[] = [];
                    let withoutCompound: string[] = [];

                    const rules: string[][] = splitRule(ast.sel);
                    const parentSelector: boolean = !node.sel.includes('&');

                    for (const sel of (rule.raw ?? splitRule(rule.sel))) {

                        const s: string = sel.join('');

                        if (s.includes('&') || parentSelector) {

                            if (s.indexOf('&', 1) == -1) {

                                if (s.at(0) == '&') {

                                    if (s.at(1) == ' ') {

                                        childSelectorCompound.push(s.slice(2));
                                    } else {

                                        if (s == '&' || parentSelector) {

                                            withCompound.push(s);
                                        } else {

                                            withoutCompound.push(s.slice(1));
                                        }
                                    }
                                } else {

                                    withoutCompound.push(s);
                                }

                            } else {

                                withCompound.push(s);
                            }

                        } else {

                            withoutCompound.push(s);
                        }
                    }

                    const selectors: string[] = [];
                    const selector: string = rules.length > 1 ? ':is(' + rules.map(a => a.join('')).join(',') + ')' : rules[0].join('');

                    if (childSelectorCompound.length > 0) {

                        if (childSelectorCompound.length == 1) {

                            selectors.push(replaceCompound('& ' + childSelectorCompound[0].trim(), selector));
                        } else {

                            selectors.push(replaceCompound('& :is(' + childSelectorCompound.reduce((acc, curr) => acc + (acc.length > 0 ? ',' : '') + curr.trim(), '') + ')', selector));
                        }
                    }

                    if (withCompound.length > 0) {

                        if (withCompound.every((t) => t[0] == '&' && t.indexOf('&', 1) == -1)) {

                            withoutCompound.push(...withCompound.map(t => t.slice(1)));
                            withCompound.length = 0;
                        }
                    }

                    if (withoutCompound.length > 0) {

                        if (withoutCompound.length == 1) {

                            const useIs: boolean = rules.length == 1 && selector.match(/^[a-zA-Z.:]/) != null && selector.includes(' ') && withoutCompound.length == 1 && withoutCompound[0].match(/^[a-zA-Z]+$/) != null;
                            const compound = useIs ? ':is(&)' : '&';

                            selectors.push(replaceCompound(rules.length == 1 ? (useIs ? withoutCompound[0] + ':is(&)' : (selector.match(/^[.:]/) && withoutCompound[0].match(/^[a-zA-Z]+$/) ? withoutCompound[0] + compound : compound + withoutCompound[0])) : (withoutCompound[0].match(/^[a-zA-Z:]+$/) ? withoutCompound[0].trim() + compound : '&' + (withoutCompound[0].match(/^\S+$/) ? withoutCompound[0].trim() : ':is(' + withoutCompound[0].trim() + ')')), selector));

                        } else {

                            selectors.push(replaceCompound('&:is(' + withoutCompound.reduce((acc, curr) => acc + (acc.length > 0 ? ',' : '') + curr.trim(), '') + ')', selector));
                        }
                    }

                    if (withCompound.length > 0) {

                        if (withCompound.length == 1) {

                            selectors.push(replaceCompound(withCompound[0], selector));

                        } else {

                            for (const w of withCompound) {

                                selectors.push(replaceCompound(w, selector));
                            }
                        }
                    }

                    rule.sel = selectors.reduce((acc, curr) => curr.length == 0 ? acc : acc + (acc.length > 0 ? ',' : '') + curr, '');
                }

                ast.chi.splice(i--, 1);

                result.push(...<AstRule[]>expandRule(rule, node));
            } else if (ast.chi[i].typ == EnumToken.AtRuleNodeType) {


                let astAtRule: AstAtRule = <AstAtRule>ast.chi[i];
                const values: Array<AstRule | AstAtRule> = <Array<AstRule | AstAtRule>>[];

                if (astAtRule.nam == 'scope') {

                    if (astAtRule.val.includes('&')) {

                        astAtRule.val = replaceCompound(astAtRule.val, ast.sel);
                    }

                    astAtRule = <AstAtRule>expand(astAtRule);
                } else {

                    // @ts-ignore
                    const clone: AstRule = <AstRule>{...ast, chi: astAtRule.chi.slice()};

                    // @ts-ignore
                    astAtRule.chi.length = 0;

                    for (const r of (<Array<AstRule | AstAtRule>>expandRule(clone, node))) {

                        if (r.typ == EnumToken.AtRuleNodeType && 'chi' in r) {

                            if (astAtRule.val !== '' && (<AstAtRule>r).val !== '') {

                                if (astAtRule.nam == 'media' && (<AstAtRule>r).nam == 'media') {

                                    (<AstAtRule>r).val = astAtRule.val + ' and ' + (<AstAtRule>r).val;
                                } else if (astAtRule.nam == 'layer' && (<AstAtRule>r).nam == 'layer') {

                                    (<AstAtRule>r).val = astAtRule.val + '.' + (<AstAtRule>r).val;
                                }
                            }

                            // @ts-ignore
                            values.push(r);
                        } else if (r.typ == EnumToken.RuleNodeType) {

                            // @ts-ignore
                            astAtRule.chi.push(...expandRule(r, node));
                        } else {

                            // @ts-ignore
                            astAtRule.chi.push(r);
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

export function replaceCompound(input: string, replace: string): string {

    const tokens: Token[] = parseString(input);
    let replacement: Token[] | null = null;

    for (const t of walkValues(tokens)) {

        if (t.value.typ == EnumToken.LiteralTokenType) {

            if (t.value.val == '&') {

                if (tokens.length == 2) {

                    if (replacement == null) {

                        replacement = parseString(replace);
                    }

                    if (tokens[1].typ == EnumToken.IdenTokenType) {


                        t.value.val = replacement.length == 1 || (!replace.includes(' ') && replace.charAt(0).match(/[:.]/)) ? tokens[1].val + replace : replaceCompoundLiteral(tokens[1].val + '&', replace);
                        tokens.splice(1, 1);
                    } else {

                        t.value.val = replaceCompoundLiteral(t.value.val, replace);
                    }

                    continue;
                }

                const rule: string[][] = splitRule(replace);

                t.value.val = rule.length > 1 ? ':is(' + replace + ')' : replace;
            } else if (t.value.val.length > 1 && t.value.val.charAt(0) == '&') {

                t.value.val = replaceCompoundLiteral(t.value.val, replace);
            }
        }
    }

    return tokens.reduce((acc, curr) => acc + renderToken(curr), '');
}

function replaceCompoundLiteral(selector: string, replace: string) {

    const tokens: string[] = [''];

    let i: number = 0;

    for (; i < selector.length; i++) {

        if (selector.charAt(i) == '&') {

            tokens.push('&');
            tokens.push('');
        } else {

            tokens[tokens.length - 1] += selector.charAt(i);
        }
    }

    return tokens.sort((a, b) => {

        if (a == '&') {

            return 1;
        }

        return b == '&' ? -1 : 0;
    }).reduce((acc: string, curr: string) => {

        if (acc.length > 0 && curr == '&' && (replace.charAt(0) != '.' || replace.includes(' '))) {

            return acc + ':is(' + replace + ')';
        }

        return acc + (curr == '&' ? replace : curr)
    }, '');
}