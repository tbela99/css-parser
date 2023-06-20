import { tokenize } from './tokenize.js';
import { PropertyList } from './declaration/list.js';
import { eq } from './utils/eq.js';
import '../renderer/utils/color.js';

function parse(css, opt = {}) {
    const errors = [];
    const options = {
        src: '',
        location: false,
        processImport: false,
        deduplicate: false,
        removeEmpty: true,
        ...opt
    };
    if (css.length == 0) {
        // @ts-ignore
        return null;
    }
    // @ts-ignore
    const ast = tokenize(css, errors, options);
    if (options.deduplicate) {
        deduplicate(ast);
    }
    return { ast, errors };
}
function diff(node1, node2) {
    // @ts-ignore
    return node1.chi.every((val) => {
        if (val.typ == 'Comment') {
            return true;
        }
        if (val.typ != 'Declaration') {
            return false;
        }
        return node2.chi.some(v => eq(v, val));
    });
}
function deduplicate(ast) {
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
                            i--;
                            previous = node;
                            nodeIndex = i;
                            continue;
                        }
                        else if (node.typ == 'Rule') {
                            if (diff(node, previous) && diff(previous, node)) {
                                if (node.typ == 'Rule') {
                                    previous.sel += ',' + node.sel;
                                }
                                // @ts-ignore
                                ast.chi.splice(i, 1);
                                i--;
                                // previous = node;
                                // nodeIndex = i;
                            }
                        }
                    }
                }
                // @ts-ignore
                if (previous != node) {
                    // @ts-ignore
                    if (previous.chi.some(n => n.typ == 'Declaration')) {
                        deduplicateRule(previous);
                    }
                    else {
                        deduplicate(previous);
                    }
                }
            }
            previous = node;
            nodeIndex = i;
        }
        // @ts-ignore
        if (node != null && ('chi' in node)) {
            // @ts-ignore
            if (node.chi.some(n => n.typ == 'Declaration')) {
                deduplicateRule(node);
            }
            else {
                deduplicate(node);
            }
        }
    }
    return ast;
}
function deduplicateRule(ast) {
    if (!('chi' in ast) || ast.chi?.length == 0) {
        return ast;
    }
    // @ts-ignore
    const j = ast.chi.length;
    let k = 0;
    const properties = new PropertyList();
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
    // @ts-ignore
    // ast.chi.splice(0, k - 1, ...properties);
    return ast;
}

export { deduplicate, deduplicateRule, parse };
