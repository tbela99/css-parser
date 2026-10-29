import type {
    AstDeclaration,
    AstNode,
    AstRuleList,
    FunctionToken,
    ParensToken,
    Token,
    WalkAttributesResult,
    WalkerFilter,
    WalkerOption,
    WalkerOptions,
    WalkerValueFilter,
    WalkResult,
} from "../../@types/index.d.ts";
import type { BinaryExpressionToken, MediaRangeQueryToken } from "../../@types/token.d.ts";
import { PARENT, TOKENS } from "../syntax/constants.ts";
import { EnumToken } from "./types.ts";

/**
 * Options for the walk function
 */
export enum WalkerOptionEnum {
    /**
     * ignore the current node and its children
     */
    Ignore = 1 << 0,
    /**
     * stop walking the tree
     */
    Stop = 1 << 1,
    /**
     * ignore the current node and process its children
     */
    Children = 1 << 2,
    /**
     * ignore the current node children
     */
    IgnoreChildren = 1 << 3,
}

/**
 * Event types for the walkValues function
 */
export enum WalkerEvent {
    /**
     * enter node
     */
    Enter = 0x1,
    /**
     * leave node
     */
    Leave = 0x2,
}

const maxQueueLength = 25000;

/**
 * Walk ast nodes
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
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
 * for (const {node} of walk(result.ast, filter, false)) {
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
export function walk(node: AstNode, filter?: WalkerFilter | null, reverse?: boolean): Generator<WalkResult>;

/**
 * Walk ast nodes
 * @param node initial node
 * @param filter control the walk process
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
 * for (const {node} of walk(result.ast, {filter, reverse: false})) {
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
export function walk(node: AstNode, filter?: WalkerOptions | null): Generator<WalkResult>;

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
export function* walk(
    node: AstNode | Token,
    filter?: WalkerFilter | WalkerOptions | null,
    reverse?: boolean,
): Generator<WalkResult> {
    const parents: Array<AstNode | Token> = [node];
    const root: AstRuleList = <AstRuleList>node;

    let options: WalkerOptions | null = filter as WalkerOptions | null;
    let isNumeric: boolean = false;
    let children: boolean = true;
    let attributes: boolean = false;

    if (options != null && typeof options == "object") {
        filter = options.filter as WalkerFilter;
        reverse = options.reverse;
        attributes = options.attributes as boolean;
        children = (options.children as boolean) ?? true;
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
    } as WalkResult;

    let option: WalkerOption = null;
    let source: Token[] | null = null;

    while (parents.length > 0) {
        node = parents.pop() as AstNode | Token;

        // enter node
        if (filter != null) {
            // @ts-expect-error
            option = filter(node);
            isNumeric = typeof option == "number";

            if (isNumeric) {
                if ((option as number) & WalkerOptionEnum.Ignore) {
                    continue;
                }

                if ((option as number) & WalkerOptionEnum.Stop) {
                    break;
                }
            }
        }

        if (!isNumeric || ((option as number) & WalkerOptionEnum.Children) === 0) {
            result.node = node;
            // @ts-expect-error
            result.parent = node[PARENT];

            yield result;
        }

        if (attributes) {
            source = null;

            if (Array.isArray(node[TOKENS])) {
                source = node[TOKENS] as Token[];
            } else if (node.typ == EnumToken.DeclarationNodeType) {
                source = (node as AstDeclaration).val as Token[];
            } else if ((node as BinaryExpressionToken | MediaRangeQueryToken).l != null) {
                // @ts-expect-error
                if (Array.isArray(node.l)) {
                    // @ts-expect-error
                    source = (node.l as Token[]).slice();
                } else {
                    // @ts-expect-error
                    source = [node.l as Token];
                }

                // @ts-expect-error
                if (node.r != null) {
                    // @ts-expect-error
                    if (Array.isArray(node.r)) {
                        // @ts-expect-error
                        source.push(...(node.r as Token[]).slice());
                    } else {
                        // @ts-expect-error
                        source = [node.r as Token];
                    }
                }

                // @ts-expect-error
                if (node.op != null && typeof node.op == "object") {
                    // @ts-expect-error
                    source.push(node.op as Token);
                }

                // @ts-expect-error
                if (node.op1 != null && typeof node.op1 == "object") {
                    // @ts-expect-error
                    source.push(node.op1 as Token);
                }

                // @ts-expect-error
                if (node.op2 != null && typeof node.op2 == "object") {
                    // @ts-expect-error
                    source.push(node.op2 as Token);
                }
            }

            if (source != null) {
                if (reverse) {
                    for (let i = 0; i < (node[TOKENS] as Token[]).length; i++) {
                        parents.push((node[TOKENS] as Token[])[i] as Token);
                        (node[TOKENS] as Token[])[i][PARENT] = node;
                    }
                } else {
                    for (let i = (node[TOKENS] as Token[]).length - 1; i >= 0; i--) {
                        parents.push((node[TOKENS] as Token[])[i] as Token);
                        (node[TOKENS] as Token[])[i][PARENT] = node;
                    }
                }
            }
        }

        if (
            children &&
            // @ts-expect-error
            node["chi"] != null &&
            (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)
        ) {
            // @ts-expect-error
            source = node.chi;

            if (reverse) {
                for (let i = 0; i < source!.length; i++) {
                    parents.push(source![i]);
                    source![i][PARENT] = node;
                }
            } else {
                for (let i = source!.length - 1; i >= 0; i--) {
                    parents.push(source![i]);
                    source![i][PARENT] = node;
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
export function* walkValues(
    values: Token[],
    root: AstNode | Token | null = null,
    filter?:
        | WalkerValueFilter
        | null
        | {
              event?: WalkerEvent;
              fn?: WalkerValueFilter;
              type?: EnumToken | EnumToken[] | ((token: Token) => boolean);
          },
    reverse?: boolean,
): Generator<WalkAttributesResult> {
    const nodes: Token[] = reverse ? values.slice() : values.toReversed();
    let previous: Token | null = null;

    if (filter != null && typeof filter == "function") {
        filter = {
            event: WalkerEvent.Enter,
            fn: filter,
        };
    } else if (filter == null) {
        filter = {
            event: WalkerEvent.Enter,
        };
    }

    let isNumeric: boolean = false;
    let value: Token;
    let option: WalkerOption;
    let node: Token | null;
    let i: number = -1;
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
            let result = node?.[PARENT] ?? root;
            while (result != null) {
                yield result;
                result = result[PARENT] ?? null;
            }
        },
    } as WalkAttributesResult;

    while (nodes.length > 0) {
        value = nodes.pop() as Token;
        option = null;

        if (filter.fn != null && eventType & WalkerEvent.Enter) {
            const isValid: boolean =
                filter.type == null ||
                value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == "function" && filter.type(value));

            if (isValid) {
                // @ts-expect-error
                option = filter.fn(
                    value,
                    value[PARENT] ?? root,
                    WalkerEvent.Enter,
                    // @ts-expect-error
                    function* () {
                        // @ts-expect-error
                        let parent = node[PARENT];

                        while (parent != null) {
                            yield parent;
                            parent = parent[PARENT] ?? null;
                        }
                    },
                );

                isNumeric = typeof option == "number";

                if (isNumeric && (option as number) & WalkerOptionEnum.Stop) {
                    return;
                }

                if (isNumeric && (option as number) & WalkerOptionEnum.Ignore) {
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
                    } else {
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
        result.nextValue = <Token>nodes[nodes.length - 1] ?? null;

        yield result;

        if (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0) {
            if ("chi" in value) {
                const source = value.chi as Token[];

                if (reverse) {
                    for (let i = 0; i < source.length; i++) {
                        nodes.push(source[i]);
                        source[i][PARENT] = value;
                    }
                } else {
                    for (let i = source.length - 1; i >= 0; i--) {
                        nodes.push(source[i]);
                        source[i][PARENT] = value;
                    }
                }
            } else {
                const values: Token[] = [];

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
                    } else {
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
                    } else {
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
                    } else {
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
                    } else {
                        for (let i = values.length - 1; i >= 0; i--) {
                            nodes.push(values[i]);
                            values[i][PARENT] = value;
                        }
                    }
                }
            }
        }

        if (eventType & WalkerEvent.Leave && filter.fn != null) {
            const isValid: boolean =
                filter.type == null ||
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
                    } else {
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
