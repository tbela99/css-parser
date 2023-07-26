import { getConfig, isIdentStart } from "./utils";
import { PropertyList } from "./declaration";
import { eq } from "./utils/eq";
import { render } from "../renderer";
const configuration = getConfig();
const combinators = ['+', '>', '~'];
export function deduplicate(ast, options = {}, recursive = false) {
    // @ts-ignore
    if (('chi' in ast) && ast.chi?.length > 0) {
        let i = 0;
        let previous;
        let node;
        let nodeIndex;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {
            // @ts-ignore
            if (ast.chi[i].typ == 'Comment') {
                continue;
            }
            // @ts-ignore
            node = ast.chi[i];
            // @ts-ignore
            if (previous == node) {
                // console.error('idem!');
                // @ts-ignore
                ast.chi.splice(i, 1);
                i--;
                continue;
            }
            if (node.typ == 'AtRule' && node.nam == 'font-face') {
                continue;
            }
            if (node.typ == 'AtRule' && node.val == 'all') {
                // @ts-ignore
                ast.chi?.splice(i, 1, ...node.chi);
                i--;
                continue;
            }
            // @ts-ignore
            if (node.typ == 'Rule') {
                reduceRuleSelector(node);
                let wrapper;
                // @ts-ignore
                if (options.nestingRules) {
                    // if (node.sel == '.card>hr') {
                    //
                    //     console.error({idem: previous == node, previous, node});
                    // }
                    // @ts-ignore
                    if (previous != null) {
                        // @ts-ignore
                        if (node.optimized != null &&
                            // @ts-ignore
                            previous.optimized != null &&
                            // @ts-ignore
                            node.optimized.optimized.length > 0 &&
                            // @ts-ignore
                            previous.optimized.optimized.length > 0 &&
                            // @ts-ignore
                            node.optimized.optimized[0] == previous.optimized.optimized[0]) {
                            // @ts-ignore
                            if (hasOnlyDeclarations(previous)) {
                                // @ts-ignore
                                let pSel = reduceRawTokens(previous.optimized.selector);
                                if (pSel === '') {
                                    // @ts-ignore
                                    pSel = previous.optimized.optimized.slice(1).join('').trim();
                                }
                                // @ts-ignore
                                let nSel = reduceRawTokens(node.optimized.selector);
                                if (nSel === '') {
                                    // @ts-ignore
                                    nSel = node.optimized.optimized.slice(1).join('').trim();
                                }
                                // @ts-ignore
                                wrapper = { ...node, chi: [], sel: node.optimized.optimized[0] };
                                // @ts-ignore
                                Object.defineProperty(wrapper, 'raw', {
                                    enumerable: false,
                                    writable: true,
                                    // @ts-ignore
                                    value: [[node.optimized.optimized[0].slice()]]
                                });
                                // @ts-ignore
                                previous.sel = pSel === '' ? '&' : pSel; // reduceRawTokens(previous.optimized.selector);
                                // @ts-ignore
                                previous.raw = pSel === '' ? [['&']] : previous.optimized.selector.slice();
                                // @ts-ignore
                                node.sel = nSel === '' ? '&' : nSel; // reduceRawTokens(node.optimized.selector);
                                // @ts-ignore
                                node.raw = nSel === '' ? [['&']] : node.optimized.selector.slice();
                                // @ts-ignore
                                wrapper.chi.push(previous, node);
                                // @ts-ignore
                                ast.chi.splice(i, 1, wrapper);
                                // @ts-ignore
                                ast.chi.splice(nodeIndex, 1);
                            }
                        }
                    }
                    // @ts-ignore
                    if (wrapper != null) {
                        // @ts-ignore
                        while (i < ast.chi.length) {
                            // @ts-ignore
                            const nextNode = ast.chi[i];
                            // @ts-ignore
                            if (nextNode.typ != 'Rule' || nextNode.raw == null) {
                                break;
                            }
                            reduceRuleSelector(nextNode);
                            // @ts-ignore
                            if (nextNode.raw.length != 1 || !eq(wrapper.raw[0], nextNode.raw[0].slice(0, wrapper.raw[0].length))) {
                                break;
                            }
                            // @ts-ignore
                            nextNode.raw[0].splice(0, wrapper.raw[0].length);
                            // @ts-ignore
                            trimRawToken(nextNode.raw[0]);
                            // @ts-ignore
                            if (nextNode.raw[0].length == 0 ||
                                // @ts-ignore
                                (nextNode.raw.length == 1 && nextNode.raw[0] == '&')) {
                                if (hasOnlyDeclarations(wrapper)) {
                                    // @ts-ignore
                                    wrapper.chi.push(...nextNode.chi);
                                    // @ts-ignore
                                    ast.chi.splice(i, 1);
                                    continue;
                                }
                                else {
                                    // @ts-ignore
                                    nextNode.raw[0].push('&');
                                }
                            }
                            // @ts-ignore
                            nextNode.sel = nextNode.raw.reduce((acc, curr) => {
                                acc.push(curr.join(''));
                                return acc;
                            }, []).join(',');
                            // @ts-ignore
                            wrapper.chi.push(nextNode);
                            // @ts-ignore
                            ast.chi.splice(i, 1);
                            node = wrapper;
                        }
                        deduplicate(wrapper, options, recursive);
                        nodeIndex = i;
                        // @ts-ignore
                        previous = ast.chi[i];
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
                            enumerable: false,
                            writable: true,
                            // @ts-ignore
                            value: [[node.optimized.optimized[0]]]
                        });
                        // @ts-ignore
                        node.sel = reduceRawTokens(node.optimized.selector);
                        // @ts-ignore
                        node.raw = node.optimized.selector.slice();
                        // @ts-ignore
                        wrapper.chi.push(node);
                        // @ts-ignore
                        ast.chi.splice(i, 1, wrapper);
                        node = wrapper;
                    }
                }
            }
            // @ts-ignore
            if (previous != null && 'chi' in previous && ('chi' in node)) {
                // @ts-ignore
                if (previous.typ == node.typ) {
                    let shouldMerge = true;
                    // @ts-ignore
                    let k = previous.chi.length;
                    while (k-- > 0) {
                        // @ts-ignore
                        if (previous.chi[k].typ == 'Comment') {
                            continue;
                        }
                        // @ts-ignore
                        shouldMerge = previous.chi[k].typ == 'Declaration';
                        break;
                    }
                    if (shouldMerge) {
                        // @ts-ignore
                        if ((node.typ == 'Rule' && node.sel == previous.sel) ||
                            // @ts-ignore
                            (node.typ == 'AtRule') && node.val != 'font-face' && node.val == previous.val) {
                            // @ts-ignore
                            node.chi.unshift(...previous.chi);
                            // @ts-ignore
                            ast.chi.splice(nodeIndex, 1);
                            // @ts-ignore
                            if (hasDeclaration(node)) {
                                deduplicateRule(node);
                            }
                            else {
                                deduplicate(node, options, recursive);
                            }
                            i--;
                            previous = node;
                            nodeIndex = i;
                            continue;
                        }
                        else if (node.typ == 'Rule' && previous?.typ == 'Rule') {
                            const intersect = diff(previous, node, options);
                            if (intersect != null) {
                                if (intersect.node1.chi.length == 0) {
                                    // @ts-ignore
                                    ast.chi.splice(i--, 1);
                                    // @ts-ignore
                                    node = ast.chi[i];
                                }
                                else {
                                    // @ts-ignore
                                    ast.chi.splice(i, 1, intersect.node1);
                                    node = intersect.node1;
                                }
                                if (intersect.node2.chi.length == 0) {
                                    // @ts-ignore
                                    ast.chi.splice(nodeIndex, 1, intersect.result);
                                    previous = intersect.result;
                                }
                                else {
                                    // @ts-ignore
                                    ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                    previous = intersect.result;
                                    // @ts-ignore
                                    i = nodeIndex;
                                }
                            }
                        }
                    }
                }
                // @ts-ignore
                if (recursive && previous != node) {
                    // @ts-ignore
                    if (hasDeclaration(previous)) {
                        deduplicateRule(previous);
                    }
                    else {
                        deduplicate(previous, options, recursive);
                    }
                }
            }
            previous = node;
            nodeIndex = i;
        }
        // @ts-ignore
        if (recursive && node != null && ('chi' in node)) {
            // @ts-ignore
            if (node.chi.some(n => n.typ == 'Declaration')) {
                deduplicateRule(node);
            }
            else {
                // @ts-ignore
                if (!(node.typ == 'AtRule' && node.nam != 'font-face')) {
                    deduplicate(node, options, recursive);
                }
            }
        }
    }
    return ast;
}
function hasOnlyDeclarations(node) {
    let k = node.chi.length;
    while (k--) {
        if (node.chi[k].typ == 'Comment') {
            continue;
        }
        return node.chi[k].typ == 'Declaration';
    }
    return true;
}
export function hasDeclaration(node) {
    // @ts-ignore
    for (let i = 0; i < node.chi?.length; i++) {
        // @ts-ignore
        if (node.chi[i].typ == 'Comment') {
            continue;
        }
        // @ts-ignore
        return node.chi[i].typ == 'Declaration';
    }
    return true;
}
export function deduplicateRule(ast) {
    // @ts-ignore
    if (!('chi' in ast) || ast.chi?.length <= 1) {
        return ast;
    }
    // @ts-ignore
    const j = ast.chi.length;
    let k = 0;
    let map = new Map;
    // @ts-ignore
    for (; k < j; k++) {
        // @ts-ignore
        const node = ast.chi[k];
        if (node.typ == 'Comment') {
            // @ts-ignore
            map.set(node, node);
            continue;
        }
        else if (node.typ != 'Declaration') {
            break;
        }
        if (node.nam in configuration.map ||
            node.nam in configuration.properties) {
            // @ts-ignore
            const shorthand = node.nam in configuration.map ? configuration.map[node.nam].shorthand : configuration.properties[node.nam].shorthand;
            if (!map.has(shorthand)) {
                map.set(shorthand, new PropertyList());
            }
            map.get(shorthand).add(node);
        }
        else {
            map.set(node.nam, node);
        }
    }
    const children = [];
    for (let child of map.values()) {
        if (child instanceof PropertyList) {
            // @ts-ignore
            children.push(...child);
        }
        else {
            // @ts-ignore
            children.push(child);
        }
    }
    // @ts-ignore
    ast.chi = children.concat(ast.chi?.slice(k));
    return ast;
}
function reduceRawTokens(raw) {
    return raw.reduce((acc, curr) => {
        acc.push(curr.join(''));
        return acc;
    }, []).join(',');
}
function trimRawToken(raw) {
    while (raw.length > 0) {
        if (raw[0] == ' ') {
            raw.shift();
            continue;
        }
        break;
    }
}
function splitRule(buffer) {
    const result = [];
    let str = '';
    for (let i = 0; i < buffer.length; i++) {
        let chr = buffer.charAt(i);
        if (chr == ',') {
            if (str !== '') {
                result.push(str);
                str = '';
            }
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
        result.push(str);
    }
    return result;
}
function reduceRuleSelector(node) {
    // @ts-ignore
    if (node.raw != null) {
        // @ts-ignore
        let optimized = reduceSelector(node.raw.reduce((acc, curr) => {
            acc.push(curr.slice());
            return acc;
        }, []));
        if (optimized != null) {
            Object.defineProperty(node, 'optimized', { enumerable: false, writable: true, value: optimized });
        }
        if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
            const raw = [
                [
                    optimized.optimized[0], ':is('
                ].concat(optimized.selector.reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push(',');
                    }
                    acc.push(...curr);
                    return acc;
                }, [])).concat(')')
            ];
            const sel = raw[0].join('');
            if (sel.length < node.sel.length) {
                node.sel = sel;
                // node.raw = raw;
                Object.defineProperty(node, 'raw', { enumerable: false, writable: true, value: raw });
            }
        }
    }
}
function diff(n1, n2, options = {}) {
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
        // @ts-ignore
        return null;
    }
    // @ts-ignore
    const raw1 = node1.raw;
    // @ts-ignore
    const optimized1 = node1.optimized;
    // @ts-ignore
    const raw2 = node2.raw;
    // @ts-ignore
    const optimized2 = node2.optimized;
    node1 = { ...node1, chi: node1.chi.slice() };
    node2 = { ...node2, chi: node2.chi.slice() };
    if (raw1 != null) {
        Object.defineProperty(node1, 'raw', { enumerable: false, writable: true, value: raw1 });
    }
    if (optimized1 != null) {
        Object.defineProperty(node1, 'optimized', { enumerable: false, writable: true, value: optimized1 });
    }
    if (raw2 != null) {
        Object.defineProperty(node2, 'raw', { enumerable: false, writable: true, value: raw2 });
    }
    if (optimized2 != null) {
        Object.defineProperty(node2, 'optimized', { enumerable: false, writable: true, value: optimized2 });
    }
    const intersect = [];
    while (i--) {
        if (node1.chi[i].typ == 'Comment') {
            continue;
        }
        j = node2.chi.length;
        if (j == 0) {
            break;
        }
        while (j--) {
            if (node2.chi[j].typ == 'Comment') {
                continue;
            }
            if (node1.chi[i].nam == node2.chi[j].nam) {
                if (eq(node1.chi[i], node2.chi[j])) {
                    intersect.push(node1.chi[i]);
                    node1.chi.splice(i, 1);
                    node2.chi.splice(j, 1);
                    break;
                }
            }
        }
    }
    // @ts-ignore
    const result = (intersect.length == 0 ? null : {
        ...node1,
        // @ts-ignore
        sel: [...new Set([...(n1?.raw?.reduce(reducer, []) || splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) || splitRule(n2.sel))])].join(),
        chi: intersect.reverse()
    });
    if (result == null || [n1, n2].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0) <= [node1, node2, result].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0)) {
        // @ts-ignore
        return null;
    }
    return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node2 : node2 };
}
export function reduceSelector(selector) {
    if (selector.length == 0) {
        return null;
    }
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
    selector.forEach((selector) => selector.splice(0, optimized.length));
    // combinator
    if (combinators.includes(optimized.at(-1))) {
        const combinator = optimized.pop();
        selector.forEach(selector => selector.unshift(combinator));
    }
    if (optimized.at(-1) == ' ') {
        optimized.pop();
    }
    let reducible = optimized.length == 1;
    if (optimized.length == 0 ||
        optimized[0].charAt(0) == '&' ||
        selector.length == 1) {
        return {
            match: false,
            optimized,
            selector,
            reducible: selector.length > 1 && selector.every((selector) => !['>', '+', '~'].includes(selector[0]))
        };
    }
    return {
        match: true,
        optimized,
        selector: selector.reduce((acc, curr) => {
            // @ts-ignore
            if (curr.length > 0 && curr[0] == ' ') {
                curr.shift();
            }
            if (curr.length == 0) {
                curr.push('&');
            }
            if (reducible) {
                const chr = curr[0].charAt(0);
                // @ts-ignore
                reducible = chr == '.' || chr == ':' || isIdentStart(chr.codePointAt(0));
            }
            acc.push(curr);
            return acc;
        }, []),
        reducible: selector.every((selector) => !['>', '+', '~', '&'].includes(selector[0]))
    };
}
function reducer(acc, curr) {
    acc.push(curr.join(''));
    return acc;
}
