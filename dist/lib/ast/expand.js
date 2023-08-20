import { splitRule, combinators } from './minify.js';
import { parseString } from '../parser/parse.js';
import { renderToken } from '../renderer/render.js';
import '../renderer/utils/color.js';
import { walkValues } from './walk.js';

function expand(ast) {
    //
    if (!['Rule', 'StyleSheet', 'AtRule'].includes(ast.typ)) {
        return ast;
    }
    if ('Rule' == ast.typ) {
        return {
            typ: 'StyleSheet',
            chi: expandRule(ast)
        };
    }
    if (!('chi' in ast)) {
        return { ...ast };
    }
    const result = { ...ast, chi: [] };
    // @ts-ignore
    for (let i = 0; i < ast.chi.length; i++) {
        // @ts-ignore
        const node = ast.chi[i];
        if (node.typ == 'Rule') {
            // @ts-ignore
            result.chi.push(...expandRule(node));
            // i += expanded.length - 1;
        }
        else if (node.typ == 'AtRule' && 'chi' in node) {
            let hasRule = false;
            let j = node.chi.length;
            while (j--) {
                if (node.chi[j].typ == 'Rule' || node.chi[j].typ == 'AtRule') {
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
    if (ast.typ == 'Rule') {
        let i = 0;
        // @ts-ignore
        delete ast.raw;
        // @ts-ignore
        delete ast.optimized;
        for (; i < ast.chi.length; i++) {
            if (ast.chi[i].typ == 'Rule') {
                const rule = ast.chi[i];
                if (!rule.sel.includes('&')) {
                    const selRule = splitRule(rule.sel);
                    selRule.forEach(arr => combinators.includes(arr[0].charAt(0)) ? arr.unshift(ast.sel) : arr.unshift(ast.sel, ' '));
                    rule.sel = selRule.reduce((acc, curr) => {
                        acc.push(curr.join(''));
                        return acc;
                    }, []).join(',');
                }
                else {
                    rule.sel = replaceCompount(rule.sel, ast.sel);
                }
                delete rule.raw;
                delete rule.optimized;
                ast.chi.splice(i--, 1);
                result.push(...expandRule(rule));
            }
            else if (ast.chi[i].typ == 'AtRule') {
                let astAtRule = ast.chi[i];
                const values = [];
                if (astAtRule.nam == 'scope') {
                    if (astAtRule.val.includes('&')) {
                        astAtRule.val = replaceCompount(astAtRule.val, ast.sel);
                    }
                    // @ts-ignore
                    astAtRule = expand(astAtRule);
                }
                else {
                    // @ts-ignore
                    const clone = { ...ast, chi: astAtRule.chi.slice() };
                    // @ts-ignore
                    astAtRule.chi.length = 0;
                    for (const r of expandRule(clone)) {
                        if (r.typ == 'AtRule' && 'chi' in r) {
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
                        else if (r.typ == 'Rule') {
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
function replaceCompount(input, replace) {
    const tokens = parseString(input);
    for (const t of walkValues(tokens)) {
        if (t.value.typ == 'Literal') {
            if (t.value.val == '&') {
                t.value.val = replace;
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
    }).reduce((acc, curr) => acc + (curr == '&' ? replace : curr), '');
}

export { expand };
