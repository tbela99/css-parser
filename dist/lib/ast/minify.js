import { parseString } from '../parser/parse.js';
import '../parser/tokenize.js';
import '../parser/utils/config.js';
import { EnumToken } from './types.js';
import { walkValues } from './walk.js';
import { replaceCompound } from './expand.js';
import { isWhiteSpace, isIdent, isFunction, isIdentStart } from '../syntax/syntax.js';
import { eq } from '../parser/utils/eq.js';
import { doRender, renderToken } from '../renderer/render.js';
import '../syntax/color/utils/constants.js';
import * as index from './features/index.js';
import { FeatureWalkMode } from './features/type.js';

const combinators = ['+', '>', '~', '||', '|'];
const definedPropertySettings = { configurable: true, enumerable: false, writable: true };
const notEndingWith = ['(', '['].concat(combinators);
// @ts-ignore
const features = Object.values(index).sort((a, b) => a.ordering - b.ordering);
/**
 * minify ast
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 * @param context
 */
function minify(ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
    let preprocess = false;
    let postprocess = false;
    let parents;
    if (!('features' in options)) {
        // @ts-ignore
        options = {
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            removePrefix: false,
            features: [], ...options
        };
        // @ts-ignore
        for (const feature of features) {
            feature.register(options);
        }
        options.features.sort((a, b) => a.ordering - b.ordering);
    }
    for (const feature of options.features) {
        if (feature.preProcess) {
            preprocess = true;
        }
        if (feature.postProcess) {
            postprocess = true;
        }
    }
    if (preprocess) {
        parents = [ast];
        for (const parent of parents) {
            if (parent.typ == EnumToken.CommentTokenType ||
                parent.typ == EnumToken.CDOCOMMTokenType) {
                Object.defineProperty(parent, 'parent', {
                    ...definedPropertySettings,
                    value: parent
                });
                continue;
            }
            for (const feature of options.features) {
                if (!feature.preProcess) {
                    continue;
                }
                feature.run(parent, options, parent.parent ?? ast, context, FeatureWalkMode.Pre);
            }
            if (('chi' in parent)) {
                // @ts-ignore
                for (const node of parent.chi) {
                    parents.push(Object.defineProperty(node, 'parent', {
                        ...definedPropertySettings,
                        value: parent
                    }));
                }
            }
        }
        for (const feature of options.features) {
            if (feature.preProcess && 'cleanup' in feature) {
                // @ts-ignore
                feature.cleanup(ast, options, context, FeatureWalkMode.Pre);
            }
        }
    }
    doMinify(ast, options, recursive, errors, nestingContent, context);
    parents = [ast];
    for (const parent of parents) {
        // parent = parents.shift() as AstNode;
        if (parent.typ == EnumToken.CommentTokenType ||
            parent.typ == EnumToken.CDOCOMMTokenType) {
            continue;
        }
        if (postprocess) {
            for (const feature of options.features) {
                if (!feature.postProcess) {
                    continue;
                }
                feature.run(parent, options, parent.parent ?? ast, context, FeatureWalkMode.Post);
            }
        }
        if (('chi' in parent)) {
            // @ts-ignore
            for (const node of parent.chi) {
                parents.push(Object.defineProperty(node, 'parent', {
                    ...definedPropertySettings,
                    value: parent
                }));
            }
        }
    }
    if (postprocess) {
        for (const feature of options.features) {
            if (feature.postProcess && 'cleanup' in feature) {
                // @ts-ignore
                feature.cleanup(ast, options, context, FeatureWalkMode.Post);
            }
        }
    }
    return ast;
}
function reduce(acc, curr, index, array) {
    // trim :is()
    if (array.length == 1 && array[0][0] == ':is(' && array[0].at(-1) == ')') {
        curr = curr.slice(1, -1);
    }
    if (curr[0] == '&') {
        if (curr[1] == ' ' && !isIdent(curr[2]) && !isFunction(curr[2])) {
            curr.splice(0, 2);
        }
        else if (combinators.includes(curr[1])) {
            curr.shift();
        }
    }
    else { // @ts-ignore
        if (this.typ == EnumToken.RuleNodeType && (isIdent(curr[0]) || isFunction(curr[0]))) {
            curr.unshift('&', ' ');
        }
    }
    acc.push(curr.join(''));
    return acc;
}
function doMinify(ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
    if (!('nodes' in context)) {
        context.nodes = new Set;
    }
    if (context.nodes.has(ast)) {
        return ast;
    }
    context.nodes.add(ast);
    // @ts-ignore
    if ('chi' in ast && ast.chi.length > 0) {
        const reducer = reduce.bind(ast);
        if (!nestingContent) {
            nestingContent = options.nestingRules && ast.typ == EnumToken.RuleNodeType;
        }
        let i = 0;
        let previous = null;
        let node;
        let nodeIndex = -1;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            // @ts-ignore
            if (ast.chi[i].typ == EnumToken.CommentNodeType) {
                continue;
            }
            // @ts-ignore
            node = ast.chi[i];
            // @ts-ignore
            if (previous == node) {
                // @ts-ignore
                ast.chi.splice(i--, 1);
                continue;
            }
            if (node.typ == EnumToken.AtRuleNodeType && node.nam == 'font-face') {
                continue;
            }
            if (node.typ == EnumToken.KeyframeAtRuleNodeType) {
                if (previous?.typ == EnumToken.KeyframeAtRuleNodeType &&
                    node.nam == previous.nam &&
                    node.val == previous.val) {
                    ast.chi?.splice(nodeIndex--, 1);
                    previous = ast?.chi?.[nodeIndex] ?? null;
                    i = nodeIndex;
                    continue;
                }
                if (node.chi.length > 0) {
                    doMinify(node, options, true, errors, nestingContent, context);
                }
            }
            if (node.typ == EnumToken.KeyFrameRuleNodeType) {
                if (previous?.typ == EnumToken.KeyFrameRuleNodeType &&
                    node.sel == previous.sel) {
                    previous.chi.push(...node.chi);
                    // @ts-ignore
                    ast.chi.splice(i--, 1);
                    continue;
                }
                let k;
                for (k = 0; k < node.chi.length; k++) {
                    if (node.chi[k].typ == EnumToken.DeclarationNodeType) {
                        let l = node.chi[k].val.length;
                        while (l--) {
                            if (node.chi[k].val[l].typ == EnumToken.ImportantTokenType) {
                                node.chi.splice(k--, 1);
                                break;
                            }
                            if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(node.chi[k].val[l].typ)) {
                                continue;
                            }
                            break;
                        }
                    }
                }
            }
            if (node.typ == EnumToken.AtRuleNodeType) {
                // @ts-ignore
                if (node.nam == 'media' && ['all', '', null].includes(node.val)) {
                    // @ts-ignore
                    ast.chi?.splice(i, 1, ...node.chi);
                    i--;
                    continue;
                }
                // @ts-ignore
                if (previous?.typ == EnumToken.AtRuleNodeType &&
                    previous.nam == node.nam &&
                    previous.val == node.val) {
                    if ('chi' in node) {
                        // @ts-ignore
                        previous.chi.push(...node.chi);
                    }
                    ast?.chi?.splice(i--, 1);
                    continue;
                }
                // @ts-ignore
                if (!hasDeclaration(node)) {
                    doMinify(node, options, recursive, errors, nestingContent, context);
                }
                previous = node;
                nodeIndex = i;
                continue;
            }
            // @ts-ignore
            if (node.typ == EnumToken.RuleNodeType) {
                reduceRuleSelector(node);
                let wrapper;
                let match;
                // @ts-ignore
                if (options.nestingRules) {
                    // @ts-ignore
                    if (previous?.typ == EnumToken.RuleNodeType) {
                        // @ts-ignore
                        reduceRuleSelector(previous);
                        // @ts-ignore
                        match = matchSelectors(previous.raw, node.raw, ast.typ, errors);
                        // @ts-ignore
                        if (match != null) {
                            // @ts-ignore
                            wrapper = wrapNodes(previous, node, match, ast, reducer, i, nodeIndex);
                            nodeIndex = i - 1;
                            // @ts-ignore
                            previous = ast.chi[nodeIndex];
                        }
                    }
                    // @ts-ignore
                    if (wrapper != null) {
                        // @ts-ignore
                        while (i < ast.chi.length) {
                            // @ts-ignore
                            const nextNode = ast.chi[i];
                            // @ts-ignore
                            if (nextNode.typ != EnumToken.RuleNodeType) {
                                break;
                            }
                            reduceRuleSelector(nextNode);
                            // @ts-ignore
                            match = matchSelectors(wrapper.raw, nextNode.raw, ast.typ, errors);
                            // @ts-ignore
                            if (match == null) {
                                break;
                            }
                            // @ts-ignore
                            wrapper = wrapNodes(wrapper, nextNode, match, ast, reducer, i, nodeIndex);
                        }
                        nodeIndex = --i;
                        // @ts-ignore
                        previous = ast.chi[nodeIndex];
                        doMinify(wrapper, options, recursive, errors, nestingContent, context);
                        continue;
                    }
                    // @ts-ignore
                    else if (node.optimized != null &&
                        // @ts-ignore
                        node.optimized.match &&
                        // @ts-ignore
                        node.optimized.selector.length > 1) {
                        // @ts-ignore
                        wrapper = { ...node, chi: [], sel: node.optimized.optimized[0] };
                        // @ts-ignore
                        Object.defineProperty(wrapper, 'raw', {
                            ...definedPropertySettings,
                            // @ts-ignore
                            value: [[node.optimized.optimized[0]]]
                        });
                        // @ts-ignore
                        node.sel = node.optimized.selector.reduce(reducer, []).join(',');
                        // @ts-ignore
                        node.raw = node.optimized.selector.slice();
                        // @ts-ignore
                        wrapper.chi.push(node);
                        // @ts-ignore
                        ast.chi.splice(i, 1, wrapper);
                        node = wrapper;
                    }
                }
                // @ts-ignore
                else if (node.optimized?.match) {
                    let wrap = true;
                    // @ts-ignore
                    const selector = node.optimized.selector.reduce((acc, curr) => {
                        if (curr[0] == '&' && curr.length > 1) {
                            if (curr[1] == ' ') {
                                curr.splice(0, 2);
                            }
                            else {
                                if (ast.typ != EnumToken.RuleNodeType && combinators.includes(curr[1])) {
                                    wrap = false;
                                }
                                else {
                                    curr.splice(0, 1);
                                }
                            }
                        }
                        else if (combinators.includes(curr[0])) {
                            curr.unshift('&');
                            wrap = false;
                        }
                        // @ts-ignore
                        acc.push(curr);
                        return acc;
                    }, []);
                    if (!wrap) {
                        wrap = selector.some((s) => s[0] != '&');
                    }
                    let rule = null;
                    const optimized = node.optimized.optimized.slice();
                    if (optimized.length > 1) {
                        const check = optimized.at(-2);
                        if (!combinators.includes(check)) {
                            let last = optimized.pop();
                            wrap = false;
                            rule = optimized.join('') + `:is(${selector.map(s => {
                                if (s[0] == '&') {
                                    s.splice(0, 1, last);
                                }
                                else {
                                    s.unshift(last);
                                }
                                return s.join('');
                            }).join(',')})`;
                        }
                    }
                    if (rule == null) {
                        rule = selector.map(s => {
                            if (s[0] == '&') {
                                s.splice(0, 1, ...node.optimized.optimized);
                            }
                            return s.join('');
                        }).join(',');
                    }
                    // @ts-ignore
                    let sel = wrap ? node.optimized.optimized.join('') + `:is(${rule})` : rule;
                    if (rule.includes('&')) {
                        // @ts-ignore
                        rule = replaceCompound(rule, node.optimized.optimized[0]);
                    }
                    if (sel.length < node.sel.length) {
                        node.sel = sel;
                    }
                }
            }
            // @ts-ignore
            if (previous != null) {
                // @ts-ignore
                if ('chi' in previous && ('chi' in node)) {
                    // @ts-ignore
                    if (previous.typ == node.typ) {
                        let shouldMerge = true;
                        // @ts-ignore
                        let k = previous.chi.length;
                        while (k-- > 0) {
                            // @ts-ignore
                            if (previous.chi[k].typ == EnumToken.CommentNodeType) {
                                continue;
                            }
                            // @ts-ignore
                            shouldMerge = previous.chi[k].typ == EnumToken.DeclarationNodeType;
                            break;
                        }
                        if (shouldMerge) {
                            // @ts-ignore
                            if (((node.typ == EnumToken.RuleNodeType || node.typ == EnumToken.KeyFrameRuleNodeType) && node.sel == previous.sel) ||
                                // @ts-ignore
                                (node.typ == EnumToken.AtRuleNodeType) && node.val != 'font-face' && node.val == previous.val) {
                                // @ts-ignore
                                node.chi.unshift(...previous.chi);
                                // @ts-ignore
                                ast.chi.splice(nodeIndex, 1);
                                // @ts-ignore
                                if (!hasDeclaration(node)) {
                                    // @ts-ignore
                                    // minifyRule(node, <MinifyOptions>options, ast, context);
                                    // } else {
                                    doMinify(node, options, recursive, errors, nestingContent, context);
                                }
                                i--;
                                previous = node;
                                nodeIndex = i;
                                continue;
                            }
                            else if (node.typ == previous?.typ && [EnumToken.KeyFrameRuleNodeType, EnumToken.RuleNodeType].includes(node.typ)) {
                                const intersect = diff(previous, node, reducer, options);
                                if (intersect != null) {
                                    if (intersect.node1.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(i--, 1);
                                        // @ts-ignore
                                        // node = ast.chi[i];
                                    }
                                    else {
                                        // @ts-ignore
                                        ast.chi.splice(i--, 1, intersect.node1);
                                        // node = ast.chi intersect.node1;
                                    }
                                    if (intersect.node2.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result);
                                        i--;
                                        // @ts-ignore
                                        if (nodeIndex == i) {
                                            nodeIndex = i;
                                        }
                                    }
                                    else {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                        // @ts-ignore
                                        i = (nodeIndex ?? 0) + 1;
                                    }
                                    reduceRuleSelector(intersect.result);
                                    // @ts-ignore
                                    if (node != ast.chi[i]) {
                                        // @ts-ignore
                                        node = ast.chi[i];
                                    }
                                    previous = intersect.result;
                                    nodeIndex = i;
                                }
                            }
                        }
                    }
                    // @ts-ignore
                    if (recursive && previous != node) {
                        // @ts-ignore
                        if (!hasDeclaration(previous)) {
                            // @ts-ignore
                            // minifyRule(previous, <MinifyOptions>options, ast, context);
                            // } else {
                            doMinify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
                else {
                    if ('chi' in previous) {
                        // @ts-ignore
                        if (!hasDeclaration(previous)) {
                            // @ts-ignore
                            // minifyRule(previous, <MinifyOptions>options, ast, context);
                            // } else {
                            doMinify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
            }
            // else if ('chi' in node) {
            //
            //     doMinify(node, options, recursive, errors, nestingContent, context);
            // }
            if (!nestingContent &&
                // @ts-ignore
                previous != null &&
                // previous.optimized != null &&
                previous.typ == EnumToken.RuleNodeType &&
                previous.sel.includes('&')) {
                fixSelector(previous);
            }
            previous = node;
            nodeIndex = i;
        }
        // @ts-ignore
        if (recursive && node != null && ('chi' in node)) {
            // @ts-ignore
            if (node.typ == EnumToken.KeyframeAtRuleNodeType || !node.chi.some(n => n.typ == EnumToken.DeclarationNodeType)) {
                // @ts-ignore
                if (!(node.typ == EnumToken.AtRuleNodeType && node.nam != 'font-face')) {
                    doMinify(node, options, recursive, errors, nestingContent, context);
                }
            }
        }
        if (!nestingContent &&
            // @ts-ignore
            node != null &&
            // previous.optimized != null &&
            node.typ == EnumToken.RuleNodeType &&
            node.sel.includes('&')) {
            fixSelector(node);
        }
    }
    return ast;
}
function hasDeclaration(node) {
    // @ts-ignore
    for (let i = 0; i < node.chi?.length; i++) {
        // @ts-ignore
        if (node.chi[i].typ == EnumToken.CommentNodeType) {
            continue;
        }
        // @ts-ignore
        return node.chi[i].typ == EnumToken.DeclarationNodeType;
    }
    return true;
}
function reduceSelector(selector) {
    if (selector.length == 0) {
        return null;
    }
    selector = selector.reduce((acc, curr) => {
        // @ts-ignore
        if (curr.length > 0 && curr.at(-1).startsWith(':is(')) {
            // @ts-ignore
            const rules = splitRule(curr.at(-1).slice(4, -1)).map(x => {
                if (x[0] == '&' && x.length > 1) {
                    return x.slice(x[1] == ' ' ? 2 : 1);
                }
                return x;
            });
            const part = curr.slice(0, -1);
            for (const rule of rules) {
                acc.push(part.concat(rule));
            }
            return acc;
        }
        acc.push(curr);
        return acc;
    }, []);
    const optimized = [];
    const k = selector.reduce((acc, curr) => acc == 0 ? curr.length : (curr.length == 0 ? acc : Math.min(acc, curr.length)), 0);
    let i = 0;
    let j;
    let match;
    for (; i < k; i++) {
        const item = selector[0][i];
        match = true;
        for (j = 1; j < selector.length; j++) {
            if (item != selector[j][i]) {
                match = false;
                break;
            }
        }
        if (!match) {
            break;
        }
        optimized.push(item);
    }
    while (optimized.length > 0) {
        const last = optimized.at(-1);
        if ((last == ' ' || combinators.includes(last))) {
            optimized.pop();
            continue;
        }
        break;
    }
    selector.forEach((selector) => selector.splice(0, optimized.length));
    // combinator
    if (combinators.includes(optimized.at(-1))) {
        const combinator = optimized.pop();
        selector.forEach((selector) => selector.unshift(combinator));
    }
    let reducible = optimized.length == 1;
    if (optimized[0] == '&') {
        if (optimized[1] == ' ') {
            optimized.splice(0, 2);
        }
    }
    if (optimized.length == 0 ||
        (optimized[0].charAt(0) == '&' ||
            selector.length == 1)) {
        return {
            match: false,
            optimized,
            selector: selector.map((selector) => selector[0] == '&' && selector[1] == ' ' ? selector.slice(2) : (selector)),
            reducible: selector.length > 1 && selector.every((selector) => !combinators.includes(selector[0]))
        };
    }
    return {
        match: true,
        optimized,
        selector: selector.reduce((acc, curr) => {
            let hasCompound = true;
            if (hasCompound && curr.length > 0) {
                hasCompound = !['&'].concat(combinators).includes(curr[0].charAt(0));
            }
            // @ts-ignore
            if (hasCompound && curr[0] == ' ') {
                hasCompound = false;
                curr.unshift('&');
            }
            if (curr.length == 0) {
                curr.push('&');
                hasCompound = false;
            }
            if (reducible) {
                const chr = curr[0].charAt(0);
                // @ts-ignore
                reducible = chr == '.' || chr == ':' || isIdentStart(chr.codePointAt(0));
            }
            acc.push(hasCompound ? ['&'].concat(curr) : curr);
            return acc;
        }, []),
        reducible: selector.every((selector) => !['>', '+', '~', '&'].includes(selector[0]))
    };
}
/**
 * split selector string
 * @param buffer
 */
function splitRule(buffer) {
    const result = [[]];
    let str = '';
    for (let i = 0; i < buffer.length; i++) {
        let chr = buffer.charAt(i);
        if (isWhiteSpace(chr.charCodeAt(0))) {
            let k = i;
            while (k + 1 < buffer.length) {
                if (isWhiteSpace(buffer[k + 1].charCodeAt(0))) {
                    k++;
                    continue;
                }
                break;
            }
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            // @ts-ignore
            if (result.at(-1).length > 0) {
                // @ts-ignore
                result.at(-1).push(' ');
            }
            i = k;
            continue;
        }
        if (chr == ',') {
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            result.push([]);
            continue;
        }
        if (chr == '.') {
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            str += chr;
            continue;
        }
        if (combinators.includes(chr)) {
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            if (chr == '|' && buffer.charAt(i + 1) == '|') {
                chr += buffer.charAt(++i);
            }
            // @ts-ignore
            result.at(-1).push(chr);
            continue;
        }
        if (chr == ':') {
            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }
            if (buffer.charAt(i + 1) == ':') {
                chr += buffer.charAt(++i);
            }
            str += chr;
            continue;
        }
        str += chr;
        if (chr == '\\') {
            str += buffer.charAt(++i);
            continue;
        }
        if (chr == '"' || chr == "'") {
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                str += chr;
                if (chr == '//') {
                    str += buffer.charAt(++k);
                    continue;
                }
                if (chr == buffer.charAt(i)) {
                    break;
                }
            }
            continue;
        }
        if (chr == '(' || chr == '[') {
            const open = chr;
            const close = chr == '(' ? ')' : ']';
            let inParens = 1;
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                if (chr == '\\') {
                    str += buffer.slice(k, k + 2);
                    k++;
                    continue;
                }
                str += chr;
                if (chr == open) {
                    inParens++;
                }
                else if (chr == close) {
                    inParens--;
                }
                if (inParens == 0) {
                    break;
                }
            }
            i = k;
        }
    }
    if (str !== '') {
        // @ts-ignore
        result.at(-1).push(str);
    }
    return result;
}
function matchSelectors(selector1, selector2, parentType, errors) {
    let match = [[]];
    const j = Math.min(selector1.reduce((acc, curr) => Math.min(acc, curr.length), selector1.length > 0 ? selector1[0].length : 0), selector2.reduce((acc, curr) => Math.min(acc, curr.length), selector2.length > 0 ? selector2[0].length : 0));
    let i = 0;
    let k;
    let l;
    let token;
    let matching = true;
    let matchFunction = 0;
    let inAttr = 0;
    for (; i < j; i++) {
        k = 0;
        token = selector1[0][i];
        for (; k < selector1.length; k++) {
            if (selector1[k][i] != token) {
                matching = false;
                break;
            }
        }
        if (matching) {
            l = 0;
            for (; l < selector2.length; l++) {
                if (selector2[l][i] != token) {
                    matching = false;
                    break;
                }
            }
        }
        if (!matching) {
            break;
        }
        if (token == ',') {
            match.push([]);
        }
        else {
            if (token.endsWith('(')) {
                matchFunction++;
            }
            if (token.endsWith('[')) {
                inAttr++;
            }
            else if (token == ')') {
                matchFunction--;
            }
            else if (token == ']') {
                inAttr--;
            }
            match.at(-1).push(token);
        }
    }
    // invalid function
    if (matchFunction != 0 || inAttr != 0) {
        return null;
    }
    if (parentType != EnumToken.RuleNodeType) {
        for (const part of match) {
            if (part.length > 0 && combinators.includes(part[0].charAt(0))) {
                return null;
            }
        }
    }
    if (match.length > 1) {
        errors?.push({
            action: 'ignore',
            message: `minify: unsupported multilevel matching\n${JSON.stringify({
                match,
                selector1,
                selector2
            }, null, 1)}`
        });
        return null;
    }
    for (const part of match) {
        while (part.length > 0) {
            const token = part.at(-1);
            if (token == ' ' || combinators.includes(token) || notEndingWith.includes(token.at(-1))) {
                part.pop();
                continue;
            }
            break;
        }
    }
    if (match.every(t => t.length == 0)) {
        return null;
    }
    if (eq([['&']], match)) {
        return null;
    }
    function reduce(acc, curr) {
        if (acc === null) {
            return null;
        }
        let hasCompoundSelector = true;
        curr = curr.slice(match[0].length);
        while (curr.length > 0) {
            if (curr[0] == ' ') {
                hasCompoundSelector = false;
                curr.unshift('&');
                continue;
            }
            break;
        }
        // invalid function match
        if (curr.length > 0 && curr[0].endsWith('(') && curr.at(-1) != ')') {
            return null;
        }
        if (curr.length == 1 && combinators.includes(curr[0].charAt(0))) {
            return null;
        }
        if (hasCompoundSelector && curr.length > 0) {
            hasCompoundSelector = !['&'].concat(combinators).includes(curr[0].charAt(0));
        }
        if (curr[0] == ':is(') {
            let inFunction = 0;
            let canReduce = true;
            const isCompound = curr.reduce((acc, token, index) => {
                if (index == 0) {
                    inFunction++;
                    canReduce = curr[1] == '&';
                }
                else if (token.endsWith('(')) {
                    if (inFunction == 0) {
                        canReduce = false;
                    }
                    inFunction++;
                }
                else if (token == ')') {
                    inFunction--;
                }
                else if (token == ',') {
                    if (!canReduce) {
                        canReduce = curr[index + 1] == '&';
                    }
                    acc.push([]);
                }
                else
                    acc.at(-1)?.push(token);
                return acc;
            }, [[]]);
            if (inFunction > 0) {
                canReduce = false;
            }
            if (canReduce) {
                curr = isCompound.reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push(',');
                    }
                    acc.push(...curr);
                    return acc;
                }, []);
            }
        }
        acc.push(match.length == 0 ? ['&'] : (hasCompoundSelector && curr[0] != '&' && (curr.length == 0 || !combinators.includes(curr[0].charAt(0))) ? ['&'].concat(curr) : curr));
        return acc;
    }
    // @ts-ignore
    selector1 = selector1.reduce(reduce, []);
    // @ts-ignore
    selector2 = selector2.reduce(reduce, []);
    return selector1 == null || selector2 == null ? null : {
        eq: eq(selector1, selector2),
        match,
        selector1,
        selector2
    };
}
function fixSelector(node) {
    // @ts-ignore
    if (node.sel.includes('&')) {
        const attributes = parseString(node.sel);
        for (const attr of walkValues(attributes)) {
            if (attr.value.typ == EnumToken.PseudoClassFuncTokenType && attr.value.val == ':is') {
                let i = attr.value.chi.length;
                while (i--) {
                    if (attr.value.chi[i].typ == EnumToken.LiteralTokenType && attr.value.chi[i].val == '&') {
                        attr.value.chi.splice(i, 1);
                    }
                }
            }
        }
        node.sel = attributes.reduce((acc, curr) => acc + renderToken(curr), '');
    }
}
function wrapNodes(previous, node, match, ast, reducer, i, nodeIndex) {
    // @ts-ignore
    let pSel = match.selector1.reduce(reducer, []).join(',');
    // @ts-ignore
    let nSel = match.selector2.reduce(reducer, []).join(',');
    // @ts-ignore
    const wrapper = { ...previous, chi: [], sel: match.match.reduce(reducer, []).join(',') };
    // @ts-ignore
    Object.defineProperty(wrapper, 'raw', {
        ...definedPropertySettings,
        // @ts-ignore
        value: match.match.map(t => t.slice())
    });
    if (pSel == '&' || pSel === '') {
        // @ts-ignore
        wrapper.chi.push(...previous.chi);
        // @ts-ignore
        if ((nSel == '&' || nSel === '')) {
            // @ts-ignore
            wrapper.chi.push(...node.chi);
        }
        else {
            // @ts-ignore
            wrapper.chi.push(node);
        }
    }
    else {
        // @ts-ignore
        wrapper.chi.push(previous, node);
    }
    // @ts-ignore
    ast.chi.splice(i, 1, wrapper);
    // @ts-ignore
    ast.chi.splice(nodeIndex, 1);
    // @ts-ignore
    previous.sel = pSel;
    // @ts-ignore
    previous.raw = match.selector1;
    // @ts-ignore
    node.sel = nSel;
    // @ts-ignore
    node.raw = match.selector2;
    reduceRuleSelector(wrapper);
    return wrapper;
}
function diff(n1, n2, reducer, options = {}) {
    if (!('cache' in options)) {
        options.cache = new WeakMap();
    }
    let node1 = n1;
    let node2 = n2;
    let exchanged = false;
    if (node1.chi.length > node2.chi.length) {
        const t = node1;
        node1 = node2;
        node2 = t;
        exchanged = true;
    }
    let i = node1.chi.length;
    let j = node2.chi.length;
    if (i == 0 || j == 0) {
        return null;
    }
    const raw1 = node1.raw;
    const raw2 = node2.raw;
    if (raw1 != null && raw2 != null) {
        const prefixes1 = new Set;
        const prefixes2 = new Set;
        for (const token1 of raw1) {
            for (const t of token1) {
                if (t[0] == ':') {
                    const matches = t.match(/::?-([a-z]+)-/);
                    if (matches == null) {
                        continue;
                    }
                    prefixes1.add(matches[1]);
                    if (prefixes1.size > 1) {
                        break;
                    }
                }
            }
            if (prefixes1.size > 1) {
                break;
            }
        }
        for (const token2 of raw2) {
            for (const t of token2) {
                if (t[0] == ':') {
                    const matches = t.match(/::?-([a-z]+)-/);
                    if (matches == null) {
                        continue;
                    }
                    prefixes2.add(matches[1]);
                    if (prefixes2.size > 1) {
                        break;
                    }
                }
            }
            if (prefixes2.size > 1) {
                break;
            }
        }
        if (prefixes1.size != prefixes2.size) {
            return null;
        }
        for (const prefix of prefixes1) {
            if (!prefixes2.has(prefix)) {
                return null;
            }
        }
    }
    const css1 = options.cache.get(node1);
    const css2 = options.cache.get(node2);
    node1 = { ...node1, chi: node1.chi.slice() };
    node2 = { ...node2, chi: node2.chi.slice() };
    if (css1 != null) {
        options.cache.set(node1, css1);
    }
    if (css2 != null) {
        options.cache.set(node2, css2);
    }
    if (raw1 != null) {
        Object.defineProperty(node1, 'raw', { ...definedPropertySettings, value: raw1 });
    }
    if (raw2 != null) {
        Object.defineProperty(node2, 'raw', { ...definedPropertySettings, value: raw2 });
    }
    const intersect = [];
    while (i--) {
        if (node1.chi[i].typ == EnumToken.CommentNodeType) {
            continue;
        }
        j = node2.chi.length;
        if (j == 0) {
            break;
        }
        while (j--) {
            if (node2.chi[j].typ == EnumToken.CommentNodeType) {
                continue;
            }
            if (node1.chi[i].nam == node2.chi[j].nam) {
                if (node1.chi[i].typ == node2.chi[j].typ && eq(node1.chi[i], node2.chi[j])) {
                    intersect.push(node1.chi[i]);
                    node1.chi.splice(i, 1);
                    node2.chi.splice(j, 1);
                    options.cache.delete(node1);
                    options.cache.delete(node2);
                    break;
                }
            }
        }
    }
    const result = (intersect.length == 0 ? null : {
        ...node1,
        // @ts-ignore
        sel: [...new Set([...(n1?.raw?.reduce(reducer, []) ?? splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) ?? splitRule(n2.sel))])].join(','),
        chi: intersect.reverse()
    });
    if (result == null || [n1, n2].reduce((acc, curr) => {
        let css = options.cache.get(curr);
        if (css == null) {
            css = doRender(curr, options).code;
            options.cache.set(curr, css);
        }
        return curr.chi.length == 0 ? acc : acc + css.length;
    }, 0) <= [node1, node2, result].reduce((acc, curr) => {
        const css = doRender(curr, options).code;
        return curr.chi.length == 0 ? acc : acc + css.length;
    }, 0)) {
        return null;
    }
    return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2 };
}
function reduceRuleSelector(node) {
    if (node.raw == null) {
        Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: splitRule(node.sel) });
    }
    let optimized = reduceSelector(node.raw.reduce((acc, curr) => {
        acc.push(curr.slice());
        return acc;
    }, []));
    if (optimized != null) {
        Object.defineProperty(node, 'optimized', { ...definedPropertySettings, value: optimized });
    }
    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
        for (const selector of optimized.selector) {
            if (selector.length > 1 && selector[0] == '&' &&
                (combinators.includes(selector[1]) || !/^[a-zA-Z:]/.test(selector[1]))) {
                selector.shift();
            }
        }
        const unique = new Set;
        const raw = [
            [
                optimized.optimized[0], ':is('
            ].concat(optimized.selector.reduce((acc, curr) => {
                const sig = curr.join('');
                if (!unique.has(sig)) {
                    if (acc.length > 0) {
                        acc.push(',');
                    }
                    unique.add(sig);
                    acc.push(...curr);
                }
                return acc;
            }, [])).concat(')')
        ];
        const sel = raw[0].join('');
        if (sel.length < node.sel.length) {
            node.sel = sel;
            Object.defineProperty(node, 'raw', { ...definedPropertySettings, value: raw });
        }
    }
}

export { combinators, definedPropertySettings, minify, splitRule };
