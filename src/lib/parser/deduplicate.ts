import {AstAtRule, AstDeclaration, AstNode, AstRule, AstRuleList, ParserOptions, TransformOptions} from "../../@types";
import {PropertyList} from "./declaration";
import {eq} from "./utils/eq";
import {render} from "../renderer";
import {getConfig, isIdentStart} from "./utils";

const configuration = getConfig();

export function deduplicate(ast: AstNode, options: ParserOptions = {}, recursive: boolean = false) {

    // @ts-ignore
    if (('chi' in ast) && ast.chi?.length > 0) {

        let i: number = 0;
        let previous: AstNode;
        let node: AstNode;
        let nodeIndex: number;

        // @ts-ignore
        for (; i < <number>ast.chi.length; i++) {

            // @ts-ignore
            if (ast.chi[i].typ == 'Comment') {

                continue;
            }

            // @ts-ignore
            node = ast.chi[i];

            if (node.typ == 'AtRule' && (<AstAtRule>node).nam == 'font-face') {

                continue;
            }

            if (node.typ == 'AtRule' && (<AstAtRule>node).val == 'all') {

                // @ts-ignore
                ast.chi?.splice(i, 1, ...(<AstAtRule>node).chi);
                i--;
                continue;
            }

            // @ts-ignore
            if (node.typ == 'Rule') {

                reduceRuleSelector(<AstRule>node);

                // @ts-ignore
                if (options.nestingRules && node.raw != null && previous?.raw != null && node.raw.length == 1 && previous.raw.length == 1) {

                    const match: string[] = [];

                    // @ts-ignore
                    while (node.raw[0].length > 0 && previous.raw[0].length > 0) {

                        // @ts-ignore
                        if (node.raw[0][0] != previous.raw[0][0]) {

                            break;
                        }

                        // @ts-ignore
                        match.push(node.raw[0].shift());
                        // @ts-ignore
                        previous.raw[0].shift();
                    }

                    if (match.length > 0) {

                        // @ts-ignore
                        const wrapper = <AstRule>{...previous, chi: []};

                        // @ts-ignore
                        if (previous.raw[0].length == 0) {

                            // @ts-ignore
                            wrapper.chi.push(...previous.chi);
                        } else {

                            // @ts-ignore
                            previous.sel = previous.raw.reduce((acc, curr) => {

                                acc.push(curr.join(''))
                                return acc;
                            }, []).join(',');

                            // @ts-ignore
                            wrapper.chi.push(previous);
                        }

                        // @ts-ignore
                        if (node.raw[0].length == 0) {

                            // @ts-ignore
                            if (previous.raw.length == 0) {

                                // @ts-ignore
                                wrapper.chi.push(...node.chi);
                            } else {

                                if (hasOnlyDeclarations(wrapper)) {

                                    wrapper.chi.push(...node.chi);
                                } else {

                                    // @ts-ignore
                                    node.raw[0].push('&');
                                    // @ts-ignore
                                    node.sel = node.raw.reduce((acc, curr) => {

                                        acc.push(curr.join(''))
                                        return acc;
                                    }, []).join(',');

                                    // @ts-ignore
                                    wrapper.chi.push(node);
                                }
                            }
                        } else {

                            // @ts-ignore
                            node.sel = node.raw.reduce((acc, curr) => {

                                acc.push(curr.join(''))
                                return acc;
                            }, []).join(',');

                            // @ts-ignore
                            wrapper.chi.push(node);
                        }

                        Object.defineProperty(wrapper, 'raw', {enumerable: false, writable: true, value: [match]});

                        // @ts-ignore
                        ast.chi.splice(i, 1, wrapper);
                        // @ts-ignore
                        ast.chi.splice(nodeIndex, 1);

                        // @ts-ignore
                        while (i < ast.chi.length) {

                            // @ts-ignore
                            const nextNode = <AstRule>ast.chi[i];

                            // @ts-ignore
                            if (nextNode.typ != 'Rule' || nextNode.raw == null) {

                                break;
                            }

                            reduceRuleSelector(<AstRule>nextNode);

                            // @ts-ignore
                            if (nextNode.raw.length != 1 || !eq(wrapper.raw[0], nextNode.raw[0].slice(0, wrapper.raw[0].length))) {

                                break;
                            }

                            // @ts-ignore
                            nextNode.raw[0].splice(0, wrapper.raw[0].length);

                            // @ts-ignore
                            if (nextNode.raw[0].length == 0 ||
                                // @ts-ignore
                                (nextNode.raw.length == 1 && nextNode.raw[0] == '&')) {

                                if (hasOnlyDeclarations(wrapper)) {

                                    wrapper.chi.push(...nextNode.chi);
                                    // @ts-ignore
                                    ast.chi.splice(i, 1);
                                    continue;

                                } else {

                                    // @ts-ignore
                                    nextNode.raw[0].push('&');
                                }
                            }

                            // @ts-ignore
                            nextNode.sel = nextNode.raw.reduce((acc, curr) => {

                                acc.push(curr.join(''))
                                return acc;
                            }, []).join(',');

                            wrapper.chi.push(nextNode);
                            // @ts-ignore
                            ast.chi.splice(i, 1);
                        }

                        deduplicateRule(wrapper);

                        nodeIndex = --i;
                        // @ts-ignore
                        previous = ast.chi[i];
                        continue;
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
                        if ((node.typ == 'Rule' && (<AstRule>node).sel == (<AstAtRule>previous).sel) ||
                            // @ts-ignore
                            (node.typ == 'AtRule') && (<AstRule>node).val != 'font-face' && (<AstRule>node).val == (<AstRule>previous).val) {

                            // @ts-ignore
                            node.chi.unshift(...previous.chi);
                            // @ts-ignore
                            ast.chi.splice(nodeIndex, 1);

                            // @ts-ignore
                            if (hasDeclaration(node)) {

                                deduplicateRule(node);
                            } else {

                                deduplicate(node, options, recursive);
                            }
                            i--;
                            previous = node;
                            nodeIndex = i;
                            continue;
                        } else if (node.typ == 'Rule' && previous?.typ == 'Rule') {

                            const intersect = diff(<AstRule>previous, <AstRule>node, options);

                            if (intersect != null) {

                                if (intersect.node1.chi.length == 0) {
                                    // @ts-ignore
                                    ast.chi.splice(i--, 1);
                                    // @ts-ignore
                                    node = ast.chi[i];
                                } else {
                                    // @ts-ignore
                                    ast.chi.splice(i, 1, intersect.node1);
                                    node = intersect.node1;
                                }

                                if (intersect.node2.chi.length == 0) {
                                    // @ts-ignore
                                    ast.chi.splice(nodeIndex, 1, intersect.result);
                                    previous = intersect.result;
                                } else {

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
                    } else {

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
            } else {

                if (!(node.typ == 'AtRule' && (<AstAtRule>node).nam != 'font-face')) {

                    deduplicate(node, options, recursive);
                }
            }
        }
    }

    return ast;
}

function hasOnlyDeclarations(node: AstRule) {

    let k = node.chi.length;

    while (k--) {

        if (node.chi[k].typ == 'Comment') {

            continue;
        }

        return node.chi[k].typ == 'Declaration';
    }

    return true;
}

export function hasDeclaration(node: AstAtRule | AstRule | AstRuleList): boolean {

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

export function deduplicateRule(ast: AstNode, options: ParserOptions = {}): AstNode {

    // @ts-ignore
    if (!('chi' in ast) || ast.chi?.length <= 1) {

        return ast;
    }

    // @ts-ignore
    const j: number = <number>ast.chi.length;

    let k: number = 0;
    let map: Map<AstNode | string, AstNode | PropertyList> = new Map;

    // @ts-ignore
    for (; k < j; k++) {

        // @ts-ignore
        const node = <AstNode>ast.chi[k];

        if (node.typ == 'Comment') {

            // @ts-ignore
            map.set(node, node);
            continue;
        } else if (node.typ != 'Declaration') {

            break;
        }

        if ((<AstDeclaration>node).nam in configuration.map ||
            (<AstDeclaration>node).nam in configuration.properties) {

            // @ts-ignore
            const shorthand: string = (<AstDeclaration>node).nam in configuration.map ? configuration.map[(<AstDeclaration>node).nam].shorthand : configuration.properties[(<AstDeclaration>node).nam].shorthand;

            if (!map.has(shorthand)) {

                map.set(shorthand, new PropertyList());
            }

            (<PropertyList>map.get(shorthand)).add(<AstDeclaration>node);
        } else {

            map.set((<AstDeclaration>node).nam, node);
        }
    }

    const children: AstNode[] = [];

    for (let child of map.values()) {

        if (child instanceof PropertyList) {

            // @ts-ignore
            children.push(...child);
        } else {

            // @ts-ignore
            children.push(child);
        }
    }

    // @ts-ignore
    ast.chi = children.concat(ast.chi?.slice(k))

    return ast;
}


function splitRule(buffer: string): string[] {

    const result: string[] = [];

    let str: string = '';

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

            let inStr = 1;
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
                } else if (chr == close) {

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

function reduceRuleSelector(node: AstRule) {

    // @ts-ignore
    if (node.raw != null) {

        // @ts-ignore
        let optimized = reduceSelector(node.raw);

        if (optimized != null) {

            Object.defineProperty(node, 'optimized', {enumerable: false, writable: true, value: optimized});
        }

        if (optimized != null && optimized.match && optimized.reducible) {

            const raw = [
                [
                    optimized.optimized[0], ':is('].concat(optimized.selector.reduce((acc, curr) => {

                    if (acc.length > 0) {

                        acc.push(',');
                    }

                    acc.push(...curr);

                    return acc
                }, [])).concat(')')
            ];

            const sel = raw[0].join('');

            if (sel.length < node.sel.length) {

                node.sel = sel;
                // node.raw = raw;
                Object.defineProperty(node, 'raw', {enumerable: false, writable: true, value: raw});
            }
        }
    }
}

function diff(n1: AstRule, n2: AstRule, options: TransformOptions = {}): null | {
    result: AstRule,
    node1: AstRule,
    node2: AstRule
} {

    let node1 = n1;
    let node2 = n2;
    let exchanged = false;

    if (node1.chi.length > node2.chi.length) {

        const t = node1;

        node1 = node2;
        node2 = t;
        exchanged = true;
    }

    let i: number = node1.chi.length;
    let j: number = node2.chi.length;

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

    node1 = {...node1, chi: node1.chi.slice()};
    node2 = {...node2, chi: node2.chi.slice()};

    if (raw1 != null) {

        Object.defineProperty(node1, 'raw', {enumerable: false, writable: true, value: raw1});
    }

    if (optimized1 != null) {

        Object.defineProperty(node1, 'optimized', {enumerable: false, writable: true, value: optimized1});
    }

    if (raw2 != null) {

        Object.defineProperty(node2, 'raw', {enumerable: false, writable: true, value: raw2});
    }

    if (optimized2 != null) {

        Object.defineProperty(node2, 'optimized', {enumerable: false, writable: true, value: optimized2});
    }

    const intersect = <AstDeclaration[]>[];

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

            if ((<AstDeclaration>node1.chi[i]).nam == (<AstDeclaration>node2.chi[j]).nam) {

                if (eq(node1.chi[i], node2.chi[j])) {

                    intersect.push(<AstDeclaration>node1.chi[i]);

                    node1.chi.splice(i, 1);
                    node2.chi.splice(j, 1);
                    break;
                }
            }
        }
    }

    // @ts-ignore
    const result = <AstRule>(intersect.length == 0 ? null : {
        ...node1,
        // @ts-ignore
        sel: [...new Set([...(n1?.raw?.reduce(reducer, []) || splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) || splitRule(n2.sel))])].join(),
        chi: intersect.reverse()
    });

    if (result == null || [n1, n2].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0) <= [node1, node2, result].reduce((acc, curr) => curr.chi.length == 0 ? acc : acc + render(curr, options).code.length, 0)) {

        // @ts-ignore
        return null;
    }

    return {result, node1: exchanged ? node2 : node1, node2: exchanged ? node2 : node2};
}

export function reduceSelector(selector: string[][]): null | {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
} {

    if (selector.length < 2) {

        return null;
    }

    const optimized: string[] = [];
    const k: number = selector.reduce((acc, curr) => acc == 0 ? curr.length : (curr.length == 0 ? acc : Math.min(acc, curr.length)), 0);

    let i: number = 0;
    let j: number;
    let match: boolean;

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

    if (optimized.at(-1) == ' ') {

        optimized.pop();
    }

    let reducible = optimized.length == 1;

    if (optimized.length == 0) {

        return {match: false, optimized, selector, reducible};
    }

    return {
        match: true,
        optimized,
        selector: selector.reduce((acc, curr) => {

            const slice = curr.slice(optimized.length);

            // @ts-ignore
            if (slice.length > 0 && slice[0] == ' ') {

                slice.shift();
            }

            if (slice.length == 0) {

                slice.push('&');
            }

            if (reducible) {

                const chr = slice[0].charAt(0);

                // @ts-ignore
                reducible = chr == '.' || chr == ':' || isIdentStart(chr.codePointAt(0))
            }

            acc.push(slice);

            return acc
        }, <string[][]>[]),
        reducible
    };
}


function reducer(acc: string[], curr: string[]): string[] {

    acc.push(curr.join(''));
    return acc;
}