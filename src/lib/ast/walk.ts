import type {
    AstNode,
    Token,
    WalkAttributesResult,
    WalkerFilter,
    WalkerOption,
    WalkerOptions,
    WalkerValueFilter,
    WalkResult,
} from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "./types.ts";
import type { AstArena } from "./arena.ts";

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

/**
 * Walk ast nodes
 * @param arena the arena the nodes are stored in
 * @param node initial node id (or value token)
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * ```ts
 *
 * import {walk, EnumToken} from '@tbela99/css-parser';
 *
 * const result = await parse(css);
 *
 * for (const {node, parent, root, arena} of walk(result.arena, result.ast)) {
 *
 *     console.log(EnumToken[arena.dataTypes[node]]);
 * }
 * ```
 *
 * Using a {@link filter} function to control the ast traversal.  the filter function returns a value of type {@link WalkerOption}.
 *
 * ```ts
 * import {EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';
 *
 * const result = await transform(css);
 * const arena = result.arena;
 *
 * function filter(node) {
 *
 *     if (arena.dataTypes[node] == EnumToken.RuleNodeType && arena.strings[arena.name[node]].includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * }
 *
 * for (const {node} of walk(arena, result.ast, filter)) {
 *
 *     console.error([EnumToken[arena.dataTypes[node]]]);
 * }
 * ```
 */
export function walk(
    arena: AstArena,
    node: AstNode | Token,
    filter?: WalkerFilter | null,
    reverse?: boolean,
): Generator<WalkResult>;

/**
 * Walk ast nodes
 * @param arena the arena the nodes are stored in
 * @param node initial node id (or value token)
 * @param filter control the walk process
 */
export function walk(arena: AstArena, node: AstNode | Token, filter?: WalkerOptions | null): Generator<WalkResult>;

/**
 * Walk ast nodes. Nodes and value tokens (walked when `attributes` is set) are ids
 * @param arena
 * @param node initial node
 * @param filter control the walk process
 * @param reverse walk in reverse order
 *
 * @private
 */
export function* walk(
    arena: AstArena,
    node: AstNode | Token,
    filter?: WalkerFilter | WalkerOptions | null,
    reverse?: boolean,
): Generator<WalkResult> {
    const stack: Array<AstNode | Token> = [node];
    const root: AstNode | Token = node;

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

    const parentOf = (item: AstNode | Token): AstNode | Token => (item == root ? 0 : arena.parents[item]);

    const result = {
        node: 0,
        parent: 0,
        root,
        arena,
        parents: function* () {
            let parent: AstNode | Token = parentOf(node);

            while (parent != 0) {
                yield parent;
                parent = parentOf(parent);
            }
        },
    } as WalkResult;

    let option: WalkerOption = null;

    while (stack.length > 0) {
        node = stack.pop() as AstNode | Token;
        isNumeric = false;

        // enter node
        if (filter != null) {
            // @ts-expect-error
            option = filter(node, arena);
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
            result.parent = parentOf(node);

            yield result;
        }

        if (attributes && (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)) {
            // prelude tokens, declaration values or token children
            const values: Token[] = arena.subTokens(node);

            if (reverse) {
                for (let i = 0; i < values.length; i++) {
                    stack.push(values[i]);
                }
            } else {
                for (let i = values.length - 1; i >= 0; i--) {
                    stack.push(values[i]);
                }
            }
        }

        if (
            children &&
            arena.flags[node] & EnumAstNodeStatus.HasChildren &&
            (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)
        ) {
            // children are pushed in reverse so that they are popped in document order
            if (reverse) {
                for (let child = arena.firstChild[node]; child != 0; child = arena.nextSibling[child]) {
                    stack.push(child);
                }
            } else {
                for (let child = arena.lastChild[node]; child != 0; child = arena.previousSibling[child]) {
                    stack.push(child);
                }
            }
        }
    }
}

/**
 * Walk node values
 * @param arena
 * @param tokens token ids
 * @param root root node or token
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {EnumToken, transform, walkValues} from '@tbela99/css-parser';
 *
 * const css = `
 * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
 * `;
 *
 * const result = await transform(css);
 * const arena = result.arena;
 * const declaration = arena.firstChild[arena.firstChild[result.ast]];
 *
 * // walk the node attribute's tokens in reverse order
 * for (const {value} of walkValues(arena, arena.tokens(declaration), declaration, null, true)) {
 *
 *     console.error([EnumToken[arena.dataTypes[value]], arena.getValue(value)]);
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
    arena: AstArena,
    tokens: Token[],
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
    const nodes: Token[] = [];
    let previous: Token | null = null;

    if (reverse) {
        for (let i = 0; i < tokens.length; i++) {
            nodes.push(tokens[i]);
        }
    } else {
        for (let i = tokens.length - 1; i >= 0; i--) {
            nodes.push(tokens[i]);
        }
    }

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
    let node: Token = 0;

    const eventType = filter.event ?? WalkerEvent.Enter;

    // parent of a token: the owner of the token list or the structured token owning the field list
    const parentOf = (token: Token): Token | AstNode | null => {
        let parent: Token = arena.parents[token];

        if (parent == 0) {
            return root ?? null;
        }

        if (arena.dataTypes[parent] == EnumToken.ListTokenType) {
            parent = arena.parents[parent];
        }

        return parent == 0 ? (root ?? null) : parent;
    };

    // @ts-ignore
    const result = {
        value: 0,
        parent: null,
        previousValue: null,
        nextValue: null,
        root: root ?? null,
        parents: function* () {
            let parent: Token | AstNode | null = parentOf(node);

            while (parent != null && parent != 0) {
                yield parent;

                if (parent == root) {
                    break;
                }

                parent = parentOf(parent);
            }
        },
    } as WalkAttributesResult;

    while (nodes.length > 0) {
        value = nodes.pop() as Token;
        node = value;
        option = null;

        if (filter.fn != null && eventType & WalkerEvent.Enter) {
            const isValid: boolean =
                filter.type == null ||
                arena.dataTypes[value] == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(arena.dataTypes[value])) ||
                (typeof filter.type == "function" && filter.type(value));

            if (isValid) {
                // @ts-expect-error
                option = filter.fn(value, parentOf(value), WalkerEvent.Enter, result.parents);

                isNumeric = typeof option == "number";

                if (isNumeric && (option as number) & WalkerOptionEnum.Stop) {
                    return;
                }

                if (isNumeric && (option as number) & WalkerOptionEnum.Ignore) {
                    continue;
                }

                // tokens returned by the filter are visited too
                if (option != null && !isNumeric) {
                    const op: Token[] = Array.isArray(option) ? (option as Token[]) : [option as Token];

                    if (reverse) {
                        for (let i = 0; i < op.length; i++) {
                            nodes.push(op[i]);
                        }
                    } else {
                        for (let i = op.length - 1; i >= 0; i--) {
                            nodes.push(op[i]);
                        }
                    }
                }
            }
        }

        result.value = value;
        result.parent = parentOf(value);
        result.previousValue = previous;
        result.nextValue = nodes.length > 0 ? nodes[nodes.length - 1] : null;

        yield result;

        if (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0) {
            const children: Token[] = arena.subTokens(value);

            if (reverse) {
                for (let i = 0; i < children.length; i++) {
                    nodes.push(children[i]);
                }
            } else {
                for (let i = children.length - 1; i >= 0; i--) {
                    nodes.push(children[i]);
                }
            }
        }

        if (eventType & WalkerEvent.Leave && filter.fn != null) {
            const isValid: boolean =
                filter.type == null ||
                arena.dataTypes[value] == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(arena.dataTypes[value])) ||
                (typeof filter.type == "function" && filter.type(value));

            if (isValid) {
                // @ts-expect-error
                option = filter.fn(value, parentOf(value), WalkerEvent.Leave, result.parents);

                if (option != null && typeof option != "number") {
                    const op: Token[] = Array.isArray(option) ? (option as Token[]) : [option as Token];

                    if (reverse) {
                        for (let i = 0; i < op.length; i++) {
                            nodes.push(op[i]);
                        }
                    } else {
                        for (let i = op.length - 1; i >= 0; i--) {
                            nodes.push(op[i]);
                        }
                    }
                }
            }
        }

        previous = value;
    }
}
