import { splitRule, combinators } from './minify.js';
import { parseString } from '../parser/parse.js';
import '../parser/tokenize.js';
import '../parser/utils/config.js';
import { EnumToken } from './types.js';
import { walkValues } from './walk.js';
import { renderToken } from '../renderer/render.js';
import '../renderer/color/utils/constants.js';

/**
 * expand nested css ast
 * @param ast
 */
function expand(ast) {
    //
    if (![EnumToken.RuleNodeType, EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType].includes(ast.typ)) {
        return ast;
    }
    if (EnumToken.RuleNodeType == ast.typ) {
        return {
            typ: EnumToken.StyleSheetNodeType,
            chi: expandRule(ast)
        };
    }
    if (!('chi' in ast)) {
        return ast;
    }
    const result = { ...ast, chi: [] };
    // @ts-ignore
    for (let i = 0; i < ast.chi.length; i++) {
        // @ts-ignore
        const node = ast.chi[i];
        if (node.typ == EnumToken.RuleNodeType) {
            // @ts-ignore
            result.chi.push(...expandRule(node));
            // i += expanded.length - 1;
        }
        else if (node.typ == EnumToken.AtRuleNodeType && 'chi' in node) {
            let hasRule = false;
            let j = node.chi.length;
            while (j--) {
                // @ts-ignore
                if (node.chi[j].typ == EnumToken.RuleNodeType || node.chi[j].typ == EnumToken.AtRuleNodeType) {
                    hasRule = true;
                    break;
                }
            }
            // @ts-ignore
            result.chi.push({ ...(hasRule ? expand(node) : node) });
        }
        else {
            // @ts-ignore
            result.chi.push(node);
        }
    }
    return result;
}
function expandRule(node) {
    const ast = { ...node, chi: node.chi.slice() };
    const result = [];
    if (ast.typ == EnumToken.RuleNodeType) {
        let i = 0;
        for (; i < ast.chi.length; i++) {
            if (ast.chi[i].typ == EnumToken.RuleNodeType) {
                const rule = ast.chi[i];
                if (!rule.sel.includes('&')) {
                    const selRule = splitRule(rule.sel);
                    if (selRule.length > 1) {
                        const r = ':is(' + selRule.map(a => a.join('')).join(',') + ')';
                        rule.sel = splitRule(ast.sel).reduce((a, b) => a.concat([b.join('') + r]), []).join(',');
                    }
                    else {
                        // selRule = splitRule(selRule.reduce((acc, curr) => acc + (acc.length > 0 ? ',' : '') + curr.join(''), ''));
                        const arSelf = splitRule(ast.sel).filter((r) => r.every((t) => t != ':before' && t != ':after' && !t.startsWith('::'))).reduce((acc, curr) => acc.concat([curr.join('')]), []).join(',');
                        if (arSelf.length == 0) {
                            ast.chi.splice(i--, 1);
                            continue;
                        }
                        //
                        selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(arSelf) : arr.unshift(arSelf, ' '));
                        rule.sel = selRule.reduce((acc, curr) => {
                            acc.push(curr.join(''));
                            return acc;
                        }, []).join(',');
                    }
                }
                else {
                    let childSelectorCompound = [];
                    let withCompound = [];
                    let withoutCompound = [];
                    // pseudo elements cannot be used with '&'
                    // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                    const rules = splitRule(ast.sel).filter((r) => r.every((t) => t != ':before' && t != ':after' && !t.startsWith('::')));
                    const parentSelector = !node.sel.includes('&');
                    if (rules.length == 0) {
                        ast.chi.splice(i--, 1);
                        continue;
                    }
                    for (const sel of (rule.raw ?? splitRule(rule.sel))) {
                        const s = sel.join('');
                        if (s.includes('&') || parentSelector) {
                            if (s.indexOf('&', 1) == -1) {
                                if (s.at(0) == '&') {
                                    if (s.at(1) == ' ') {
                                        childSelectorCompound.push(s.slice(2));
                                    }
                                    else {
                                        if (s == '&' || parentSelector) {
                                            withCompound.push(s);
                                        }
                                        else {
                                            withoutCompound.push(s.slice(1));
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
                        else {
                            withoutCompound.push(s);
                        }
                    }
                    const selectors = [];
                    const selector = rules.length > 1 ? ':is(' + rules.map(a => a.join('')).join(',') + ')' : rules[0].join('');
                    if (childSelectorCompound.length > 0) {
                        if (childSelectorCompound.length == 1) {
                            selectors.push(replaceCompound('& ' + childSelectorCompound[0].trim(), selector));
                        }
                        else {
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
                            const useIs = rules.length == 1 && selector.match(/^[a-zA-Z.:]/) != null && selector.includes(' ') && withoutCompound.length == 1 && withoutCompound[0].match(/^[a-zA-Z]+$/) != null;
                            const compound = useIs ? ':is(&)' : '&';
                            selectors.push(replaceCompound(rules.length == 1 ? (useIs ? withoutCompound[0] + ':is(&)' : (selector.match(/^[.:]/) && withoutCompound[0].match(/^[a-zA-Z]+$/) ? withoutCompound[0] + compound : compound + withoutCompound[0])) : (withoutCompound[0].match(/^[a-zA-Z:]+$/) ? withoutCompound[0].trim() + compound : '&' + (withoutCompound[0].match(/^\S+$/) ? withoutCompound[0].trim() : ':is(' + withoutCompound[0].trim() + ')')), selector));
                        }
                        else {
                            selectors.push(replaceCompound('&:is(' + withoutCompound.reduce((acc, curr) => acc + (acc.length > 0 ? ',' : '') + curr.trim(), '') + ')', selector));
                        }
                    }
                    if (withCompound.length > 0) {
                        if (withCompound.length == 1) {
                            selectors.push(replaceCompound(withCompound[0], selector));
                        }
                        else {
                            for (const w of withCompound) {
                                selectors.push(replaceCompound(w, selector));
                            }
                        }
                    }
                    rule.sel = selectors.reduce((acc, curr) => curr.length == 0 ? acc : acc + (acc.length > 0 ? ',' : '') + curr, '');
                }
                ast.chi.splice(i--, 1);
                result.push(...expandRule(rule));
            }
            else if (ast.chi[i].typ == EnumToken.AtRuleNodeType) {
                let astAtRule = ast.chi[i];
                const values = [];
                if (astAtRule.nam == 'scope') {
                    if (astAtRule.val.includes('&')) {
                        astAtRule.val = replaceCompound(astAtRule.val, ast.sel);
                    }
                    const slice = astAtRule.chi.slice().filter(t => t.typ == EnumToken.RuleNodeType && t.sel.includes('&'));
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
                        if (r.typ == EnumToken.AtRuleNodeType && 'chi' in r) {
                            if (astAtRule.val !== '' && r.val !== '') {
                                if (astAtRule.nam == 'media' && r.nam == 'media') {
                                    r.val = astAtRule.val + ' and ' + r.val;
                                }
                                else if (astAtRule.nam == 'layer' && r.nam == 'layer') {
                                    r.val = astAtRule.val + '.' + r.val;
                                }
                            }
                            // @ts-ignore
                            values.push(r);
                        }
                        else if (r.typ == EnumToken.RuleNodeType) {
                            // @ts-ignore
                            astAtRule.chi.push(...expandRule(r));
                        }
                        else {
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
/**
 * replace compound selector
 * @param input
 * @param replace
 */
function replaceCompound(input, replace) {
    const tokens = parseString(input);
    let replacement = null;
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
                    }
                    else {
                        t.value.val = replaceCompoundLiteral(t.value.val, replace);
                    }
                    continue;
                }
                const rule = splitRule(replace);
                t.value.val = rule.length > 1 ? ':is(' + replace + ')' : replace;
            }
            else if (t.value.val.length > 1 && t.value.val.charAt(0) == '&') {
                t.value.val = replaceCompoundLiteral(t.value.val, replace);
            }
        }
    }
    return tokens.reduce((acc, curr) => acc + renderToken(curr), '');
}
function replaceCompoundLiteral(selector, replace) {
    const tokens = [''];
    let i = 0;
    for (; i < selector.length; i++) {
        if (selector.charAt(i) == '&') {
            tokens.push('&');
            tokens.push('');
        }
        else {
            tokens[tokens.length - 1] += selector.charAt(i);
        }
    }
    return tokens.sort((a, b) => {
        if (a == '&') {
            return 1;
        }
        return b == '&' ? -1 : 0;
    }).reduce((acc, curr) => {
        if (acc.length > 0 && curr == '&' && (replace.charAt(0) != '.' || replace.includes(' '))) {
            return acc + ':is(' + replace + ')';
        }
        return acc + (curr == '&' ? replace : curr);
    }, '');
}

export { expand, replaceCompound };
