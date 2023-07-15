import { PropertyList } from './declaration/list.js';
import { eq } from './utils/eq.js';
import { getConfig } from './utils/config.js';
import { render } from '../renderer/render.js';

const configuration = getConfig();
function deduplicate(ast, options = {}, recursive = false) {
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
                            (node.typ == 'AtRule') && node.val == previous.val) {
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
                                    ast.chi.splice(i, 1);
                                }
                                else {
                                    // @ts-ignore
                                    ast.chi.splice(i, 1, intersect.node1);
                                }
                                if (intersect.node2.chi.length == 0) {
                                    // @ts-ignore
                                    ast.chi.splice(nodeIndex, 1, intersect.result);
                                }
                                else {
                                    // @ts-ignore
                                    ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
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
                deduplicate(node, options, recursive);
            }
        }
    }
    return ast;
}
function hasDeclaration(node) {
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
function deduplicateRule(ast, options = {}) {
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
    /*
    // @ts-ignore

    const properties: PropertyList = new PropertyList();

    for (; k < j; k++) {

        // @ts-ignore
        if ('Comment' == ast.chi[k].typ || 'Declaration' == ast.chi[k].typ) {

            // @ts-ignore
            properties.add(ast.chi[k]);
            continue;
        }

        break;
    }

    // @ts-ignore
    ast.chi = [...properties].concat(ast.chi.slice(k));
    */
    //
    // @ts-ignore
    // ast.chi.splice(0, k - 1, ...properties);
    return ast;
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
            continue;
        }
    }
    if (str !== '') {
        result.push(str);
    }
    return result;
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
    node1 = { ...node1, chi: node1.chi.slice() };
    node2 = { ...node2, chi: node2.chi.slice() };
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
        sel: [...new Set([...(n1.raw || splitRule(n1.sel)).concat(n2.raw || splitRule(n2.sel))])].join(),
        chi: intersect.reverse()
    });
    if (result == null || [n1, n2].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0) <= [node1, node2, result].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0)) {
        // @ts-ignore
        return null;
    }
    return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node2 : node2 };
}

export { deduplicate, deduplicateRule, hasDeclaration };
