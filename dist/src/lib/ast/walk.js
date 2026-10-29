/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.7.0
	License: MIT
 */
import { PARENT, TOKENS } from '../syntax/constants.js';
import { EnumToken } from './types.js';

/**
 * Options for the walk function
 */
var WalkerOptionEnum;
(function (WalkerOptionEnum) {
    /**
     * ignore the current node and its children
     */
    WalkerOptionEnum[WalkerOptionEnum["Ignore"] = 1] = "Ignore";
    /**
     * stop walking the tree
     */
    WalkerOptionEnum[WalkerOptionEnum["Stop"] = 2] = "Stop";
    /**
     * ignore the current node and process its children
     */
    WalkerOptionEnum[WalkerOptionEnum["Children"] = 4] = "Children";
    /**
     * ignore the current node children
     */
    WalkerOptionEnum[WalkerOptionEnum["IgnoreChildren"] = 8] = "IgnoreChildren";
})(WalkerOptionEnum || (WalkerOptionEnum = {}));
/**
 * Event types for the walkValues function
 */
var WalkerEvent;
(function (WalkerEvent) {
    /**
     * enter node
     */
    WalkerEvent[WalkerEvent["Enter"] = 1] = "Enter";
    /**
     * leave node
     */
    WalkerEvent[WalkerEvent["Leave"] = 2] = "Leave";
})(WalkerEvent || (WalkerEvent = {}));
/**
 * Walk ast nodes
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * @private
 *
 * ```ts
 *
 * import {walk} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * for (const {node, parent, root} of walk(ast)) {
 *
 *     // do something with node
 * }
 * ```
 *
 * Using a {@link filter} function to control the ast traversal.  the filter function returns a value of type {@link WalkerOption}.
 *
 * ```ts
 * import {EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 *
 * html,
 * body {
 *     line-height: 1.474;
 * }
 *
 * .ruler {
 *
 *     height: 10px;
 * }
 * `;
 *
 * function filter(node) {
 *
 *     if (node.typ == EnumToken.AstRule && node.sel.includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * }
 *
 * const result = await transform(css);
 * for (const {node} of walk(result.ast, filter)) {
 *
 *     console.error([EnumToken[node.typ]]);
 * }
 *
 * // [ "StyleSheetNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * // [ "RuleNodeType" ]
 * // [ "DeclarationNodeType" ]
 * ```
 */
function* walk(node, filter, reverse) {
    const parents = [node];
    const root = node;
    let options = filter;
    let isNumeric = false;
    let children = true;
    let attributes = false;
    if (options != null && typeof options == "object") {
        filter = options.filter;
        reverse = options.reverse;
        attributes = options.attributes;
        children = options.children ?? true;
    }
    // @ts-expect-error
    const result = {
        node: null,
        parent: null,
        root,
        parents: function* () {
            let parent = node[PARENT];
            while (parent != null) {
                yield parent;
                parent = parent[PARENT];
            }
        },
    };
    let option = null;
    let source = null;
    while (parents.length > 0) {
        node = parents.pop();
        // enter node
        if (filter != null) {
            // @ts-expect-error
            option = filter(node);
            isNumeric = typeof option == "number";
            if (isNumeric) {
                if (option & WalkerOptionEnum.Ignore) {
                    continue;
                }
                if (option & WalkerOptionEnum.Stop) {
                    break;
                }
            }
        }
        if (!isNumeric || (option & WalkerOptionEnum.Children) === 0) {
            result.node = node;
            // @ts-expect-error
            result.parent = node[PARENT];
            yield result;
        }
        if (attributes) {
            source = null;
            if (Array.isArray(node[TOKENS])) {
                source = node[TOKENS];
            }
            else if (node.typ == EnumToken.DeclarationNodeType) {
                source = node.val;
            }
            else if (node.l != null) {
                // @ts-expect-error
                if (Array.isArray(node.l)) {
                    // @ts-expect-error
                    source = node.l.slice();
                }
                else {
                    // @ts-expect-error
                    source = [node.l];
                }
                // @ts-expect-error
                if (node.r != null) {
                    // @ts-expect-error
                    if (Array.isArray(node.r)) {
                        // @ts-expect-error
                        source.push(...node.r.slice());
                    }
                    else {
                        // @ts-expect-error
                        source = [node.r];
                    }
                }
                // @ts-expect-error
                if (node.op != null && typeof node.op == "object") {
                    // @ts-expect-error
                    source.push(node.op);
                }
                // @ts-expect-error
                if (node.op1 != null && typeof node.op1 == "object") {
                    // @ts-expect-error
                    source.push(node.op1);
                }
                // @ts-expect-error
                if (node.op2 != null && typeof node.op2 == "object") {
                    // @ts-expect-error
                    source.push(node.op2);
                }
            }
            if (source != null) {
                if (reverse) {
                    for (let i = 0; i < node[TOKENS].length; i++) {
                        parents.push(node[TOKENS][i]);
                        node[TOKENS][i][PARENT] = node;
                    }
                }
                else {
                    for (let i = node[TOKENS].length - 1; i >= 0; i--) {
                        parents.push(node[TOKENS][i]);
                        node[TOKENS][i][PARENT] = node;
                    }
                }
            }
        }
        if (children &&
            // @ts-expect-error
            node["chi"] != null &&
            (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0)) {
            // @ts-expect-error
            source = node.chi;
            if (reverse) {
                for (let i = 0; i < source.length; i++) {
                    parents.push(source[i]);
                    source[i][PARENT] = node;
                }
            }
            else {
                for (let i = source.length - 1; i >= 0; i--) {
                    parents.push(source[i]);
                    source[i][PARENT] = node;
                }
            }
        }
    }
}
/**
 * Walk ast node value tokens
 * @param values
 * @param root
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {AstDeclaration, EnumToken, transform, walkValues} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 * `;
 *
 * const result = await transform(css);
 * const declaration = result.ast.chi[0].chi[0] as AstDeclaration;
 *
 * // walk the node attribute's tokens in reverse order
 * for (const {value} of walkValues(declaration.val, null, null,true)) {
 *
 *     console.error([EnumToken[value.typ], value.val]);
 * }
 *
 * // [ "Color", "color" ]
 * // [ "FunctionTokenType", "calc" ]
 * // [ "Number", 0.15 ]
 * // [ "Add", undefined ]
 * // [ "Iden", "b" ]
 * // [ "Whitespace", undefined ]
 * // [ "FunctionTokenType", "calc" ]
 * // [ "Number", 0.24 ]
 * // [ "Add", undefined ]
 * // [ "Iden", "g" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "r" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "display-p3" ]
 * // [ "Whitespace", undefined ]
 * // [ "FunctionTokenType", "var" ]
 * // [ "DashedIden", "--base-color" ]
 * // [ "Whitespace", undefined ]
 * // [ "Iden", "from" ]
 * ```
 */
function* walkValues(values, root = null, filter, reverse) {
    const nodes = reverse ? values.slice() : values.toReversed();
    let previous = null;
    if (filter != null && typeof filter == "function") {
        filter = {
            event: WalkerEvent.Enter,
            fn: filter,
        };
    }
    else if (filter == null) {
        filter = {
            event: WalkerEvent.Enter,
        };
    }
    let isNumeric = false;
    let value;
    let option;
    let node;
    const eventType = filter.event ?? WalkerEvent.Enter;
    // @ts-ignore
    const result = {
        value: null,
        parent: null,
        previousValue: null,
        nextValue: null,
        //
        root: root ?? null,
        parents: function* () {
            // @ts-ignore
            let result = root;
            while (result != null) {
                yield result;
                result = result[PARENT] ?? null;
            }
        },
    };
    while (nodes.length > 0) {
        value = nodes.pop();
        option = null;
        if (filter.fn != null && eventType & WalkerEvent.Enter) {
            const isValid = filter.type == null ||
                value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == "function" && filter.type(value));
            if (isValid) {
                // @ts-expect-error
                option = filter.fn(value, value[PARENT] ?? root, WalkerEvent.Enter, 
                // @ts-expect-error
                function* () {
                    // @ts-expect-error
                    let parent = node[PARENT];
                    while (parent != null) {
                        yield parent;
                        parent = parent[PARENT] ?? null;
                    }
                });
                isNumeric = typeof option == "number";
                if (isNumeric && option & WalkerOptionEnum.Stop) {
                    return;
                }
                if (isNumeric && option & WalkerOptionEnum.Ignore) {
                    continue;
                }
                //
                if (option != null && typeof option == "object" && ("typ" in option || Array.isArray(option))) {
                    const op = Array.isArray(option) ? option : [option];
                    if (reverse) {
                        for (let i = 0; i < op.length; i++) {
                            nodes.push(op[i]);
                            op[i][PARENT] = value;
                        }
                    }
                    else {
                        for (let i = op.length - 1; i >= 0; i--) {
                            nodes.push(op[i]);
                            op[i][PARENT] = value;
                        }
                    }
                }
            }
        }
        result.value = value;
        result.parent = value[PARENT] ?? root;
        result.previousValue = previous;
        result.nextValue = nodes[nodes.length - 1] ?? null;
        yield result;
        if (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
            if ("chi" in value) {
                const source = value.chi;
                if (reverse) {
                    for (let i = 0; i < source.length; i++) {
                        nodes.push(source[i]);
                        source[i][PARENT] = value;
                    }
                }
                else {
                    for (let i = source.length - 1; i >= 0; i--) {
                        nodes.push(source[i]);
                        source[i][PARENT] = value;
                    }
                }
            }
            else {
                const values = [];
                if ("op2" in value && value.op2 != null) {
                    values.push(value.op2);
                    value.op2[PARENT] = value;
                }
                if ("op1" in value && value.op1 != null) {
                    values.push(value.op1);
                    value.op1[PARENT] = value;
                }
                // @ts-expect-error
                if ("op" in value && value.op.typ != null) {
                    // @ts-expect-error
                    values.push(value.op);
                    // @ts-expect-error
                    value.op[PARENT] = value;
                }
                if ("r" in value && value.r != null) {
                    if (Array.isArray(value.r)) {
                        for (let i = value.r.length - 1; i >= 0; i--) {
                            values.push(value.r[i]);
                            value.r[i][PARENT] = value;
                        }
                    }
                    else {
                        values.push(value.r);
                        value.r[PARENT] = value;
                    }
                }
                if ("l" in value && value.l != null) {
                    if (Array.isArray(value.l)) {
                        for (let i = value.l.length - 1; i >= 0; i--) {
                            values.push(value.l[i]);
                            value.l[i][PARENT] = value;
                        }
                    }
                    else {
                        values.push(value.l);
                        value.l[PARENT] = value;
                    }
                }
                if ("op" in value && typeof value.op == "object") {
                    // @ts-expect-error
                    values.push(value.op);
                    // @ts-expect-error
                    if (value.op[PARENT] != value) {
                        // @ts-expect-error
                        value.op[PARENT] = value;
                    }
                }
                if ("r" in value && value.r != null) {
                    if (Array.isArray(value.r)) {
                        for (const r of value.r) {
                            //
                            values.push(r);
                            if (r[PARENT] != value) {
                                //
                                r[PARENT] = value;
                            }
                        }
                    }
                    else {
                        //
                        values.push(value.r);
                        if (value.r[PARENT] != value) {
                            //
                            value.r[PARENT] = value;
                        }
                    }
                }
                if (values.length > 0) {
                    if (reverse) {
                        for (let i = 0; i < values.length; i++) {
                            nodes.push(values[i]);
                            values[i][PARENT] = value;
                        }
                    }
                    else {
                        for (let i = values.length - 1; i >= 0; i--) {
                            nodes.push(values[i]);
                            values[i][PARENT] = value;
                        }
                    }
                }
            }
        }
        if (eventType & WalkerEvent.Leave && filter.fn != null) {
            const isValid = filter.type == null ||
                value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == "function" && filter.type(value));
            if (isValid) {
                // @ts-ignore
                option = filter.fn(value, value[PARENT], WalkerEvent.Leave);
                // @ts-ignore
                if (option != null && ("typ" in option || Array.isArray(option))) {
                    const op = Array.isArray(option) ? option : [option];
                    if (reverse) {
                        for (let i = 0; i < op.length; i++) {
                            nodes.push(op[i]);
                            op[i][PARENT] = value;
                        }
                    }
                    else {
                        for (let i = op.length - 1; i >= 0; i--) {
                            nodes.push(op[i]);
                            op[i][PARENT] = value;
                        }
                    }
                }
            }
        }
        previous = value;
    }
}

export { WalkerEvent, WalkerOptionEnum, walk, walkValues };
