import {combinators, splitRule} from "./minify";
import {parseString} from "../parser";
import {walkValues} from "./walk";
import {renderToken} from "../renderer";
import {AstAtRule, AstNode, AstRule, AstRuleStyleSheet, Token} from "../../@types";
import {EnumToken, NodeType} from "./types";

export function expand(ast: AstNode): AstNode {
    //
    if (![NodeType.RuleNodeType, NodeType.StyleSheetNodeType, NodeType.AtRuleNodeType].includes(ast.typ)) {

        return ast;
    }

    if (NodeType.RuleNodeType == ast.typ) {

        return <AstRuleStyleSheet>{
            typ: NodeType.StyleSheetNodeType,
            chi: expandRule(<AstRule>ast)
        }
    }

    if (!('chi' in ast)) {

        return <AstAtRule>{...ast};
    }

    const result = <AstRuleStyleSheet | AstAtRule>{...ast, chi: []};

    // @ts-ignore
    for (let i = 0; i < ast.chi.length; i++) {

        // @ts-ignore
        const node = ast.chi[i];

        if (node.typ == NodeType.RuleNodeType) {

            // @ts-ignore
            result.chi.push(...expandRule(<AstRule>node));
            // i += expanded.length - 1;
        } else if (node.typ == NodeType.AtRuleNodeType && 'chi' in node) {

            let hasRule = false;
            let j = node.chi.length;

            while (j--) {

                if (node.chi[j].typ == NodeType.RuleNodeType || node.chi[j].typ == NodeType.AtRuleNodeType) {

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

function expandRule(node: AstRule): Array<AstRule | AstAtRule> {

    const ast: AstRule = <AstRule>{...node, chi: node.chi.slice()};
    const result: Array<AstRule | AstAtRule> = [];

    if (ast.typ == NodeType.RuleNodeType) {

        let i: number = 0;

        for (; i < ast.chi.length; i++) {

            if (ast.chi[i].typ == NodeType.RuleNodeType) {

                const rule: AstRule = <AstRule>(<AstRule>ast).chi[i];

                if (!rule.sel.includes('&')) {

                    const selRule = splitRule(rule.sel);
                    selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(ast.sel) : arr.unshift(ast.sel, ' '));

                    rule.sel = selRule.reduce((acc, curr) => {

                        acc.push(curr.join(''));

                        return acc;
                    }, <string[]>[]).join(',');
                } else {

                    rule.sel = replaceCompound(rule.sel, ast.sel);
                }

                ast.chi.splice(i--, 1);

                result.push(...<AstRule[]>expandRule(rule));
            } else if (ast.chi[i].typ == NodeType.AtRuleNodeType) {


                let astAtRule: AstAtRule = <AstAtRule>ast.chi[i];
                const values = <Array<AstRule | AstAtRule>>[];

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

                    for (const r of (<Array<AstRule | AstAtRule>>expandRule(clone))) {

                        if (r.typ == NodeType.AtRuleNodeType && 'chi' in r) {

                            if (astAtRule.val !== '' && (<AstAtRule>r).val !== '') {

                                if (astAtRule.nam == 'media' && (<AstAtRule>r).nam == 'media') {

                                    (<AstAtRule>r).val = astAtRule.val + ' and ' + (<AstAtRule>r).val;
                                } else if (astAtRule.nam == 'layer' && (<AstAtRule>r).nam == 'layer') {

                                    (<AstAtRule>r).val = astAtRule.val + '.' + (<AstAtRule>r).val;
                                }
                            }

                            // @ts-ignore
                            values.push(r);
                        } else if (r.typ == NodeType.RuleNodeType) {

                            // @ts-ignore
                            astAtRule.chi.push(...expandRule(r));
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

export function replaceCompound(input: string, replace: string) {

    const tokens: Token[] = parseString(input);

    for (const t of walkValues(tokens)) {

        if (t.value.typ == EnumToken.LiteralTokenType) {

            if (t.value.val == '&') {

                t.value.val = replace;
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
    }).reduce((acc: string, curr: string) => acc + (curr == '&' ? replace : curr), '');
}
