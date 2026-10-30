import type {
    AstDeclaration,
    AstNode,
    AstRuleList,
    ComposesSelectorToken,
    ContainerStyleRangeToken,
    FunctionToken,
    IfConditionToken,
    MatchExpressionToken,
    SupportsQueryConditionToken,
    Token,
    WalkAttributesResult,
    WalkerFilter,
    WalkerOption,
    WalkerOptions,
    WalkerValueFilter,
    WalkResult,
    WhenElseUnaryConditionToken,
} from "../../@types/index.d.ts";
import type { BinaryExpressionToken, IfElseConditionToken, MediaRangeQueryToken } from "../../@types/token.d.ts";
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
    let source: Token[] = [];

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
            source.length = 0;

            if (Array.isArray(node[TOKENS])) {
                // source = node[TOKENS] as Token[];

                if (reverse) {
                    for (const token of node[TOKENS] as Token[]) {
                        parents.push(token);
                        token[PARENT] = node;
                    }
                } else {
                    for (let i = (node[TOKENS] as Token[]).length - 1; i >= 0; i--) {
                        parents.push((node[TOKENS] as Token[])[i]);
                        (node[TOKENS] as Token[])[i][PARENT] = node;
                    }
                }
            } else if (node.typ == EnumToken.DeclarationNodeType) {
                // source = (node as AstDeclaration).val as Token[];

                if (reverse) {
                    for (const token of (node as AstDeclaration).val as Token[]) {
                        parents.push(token);
                        token[PARENT] = node;
                    }
                } else {
                    for (let i = ((node as AstDeclaration).val as Token[]).length - 1; i >= 0; i--) {
                        parents.push(((node as AstDeclaration).val as Token[])[i]);
                        ((node as AstDeclaration).val as Token[])[i][PARENT] = node;
                    }
                }
            } else {
                source.length = 0;

                switch (node.typ) {
                    case EnumToken.BinaryExpressionTokenType:
                    case EnumToken.IfElseConditionTokenType:
                        source.push((node as BinaryExpressionToken | IfElseConditionToken).l);
                        (node as BinaryExpressionToken | IfElseConditionToken).l[PARENT] = node;

                        source.push((node as BinaryExpressionToken | IfElseConditionToken).r);
                        (node as BinaryExpressionToken | IfElseConditionToken).r[PARENT] = node;

                        break;

                    case EnumToken.MatchExpressionTokenType:
                        source.push((node as MatchExpressionToken).l);
                        (node as MatchExpressionToken).l[PARENT] = node;

                        source.push((node as MatchExpressionToken).op);
                        (node as MatchExpressionToken).op[PARENT] = node;

                        source.push((node as MatchExpressionToken).r);
                        (node as MatchExpressionToken).r[PARENT] = node;

                        break;

                    case EnumToken.SupportsQueryConditionTokenType:
                    case EnumToken.MediaQueryConditionTokenType:
                        for (let i = 0; i < (node as SupportsQueryConditionToken).l.length; i++) {
                            const element = (node as SupportsQueryConditionToken).l[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        source.push((node as SupportsQueryConditionToken).op);
                        (node as SupportsQueryConditionToken).op[PARENT] = node;

                        for (let i = 0; i < (node as SupportsQueryConditionToken).r.length; i++) {
                            const element = (node as SupportsQueryConditionToken).r[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        break;

                    case EnumToken.WhenElseQueryConditionTokenType:
                        source.push((node as WhenElseUnaryConditionToken).l);
                        (node as WhenElseUnaryConditionToken).l[PARENT] = node;

                        for (let i = 0; i < (node as WhenElseUnaryConditionToken).r.length; i++) {
                            const element = (node as WhenElseUnaryConditionToken).r[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        break;

                    case EnumToken.ComposesSelectorNodeType:
                        for (let i = 0; i < (node as ComposesSelectorToken).l.length; i++) {
                            const element = (node as ComposesSelectorToken).l[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        if ((node as ComposesSelectorToken).r != null) {
                            source.push((node as ComposesSelectorToken).r as Token);
                            ((node as ComposesSelectorToken).r as Token)[PARENT] = node;
                        }

                        break;

                    case EnumToken.IfConditionTokenType:
                        for (let i = 0; i < (node as IfConditionToken).l.length; i++) {
                            const element = (node as IfConditionToken).l[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        for (let i = 0; i < (node as IfConditionToken).r.length; i++) {
                            const element = (node as IfConditionToken).r[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        break;

                    case EnumToken.ContainerStyleRangeTokenType:
                        for (let i = 0; i < (node as ContainerStyleRangeToken).l.length; i++) {
                            const element = (node as ContainerStyleRangeToken).l[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        for (let i = 0; i < (node as ContainerStyleRangeToken).op.length; i++) {
                            const element = (node as ContainerStyleRangeToken).op[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        for (let i = 0; i < (node as ContainerStyleRangeToken).r.length; i++) {
                            const element = (node as ContainerStyleRangeToken).r[i];
                            source.push(element);
                            element[PARENT] = node;
                        }
                        break;

                    case EnumToken.MediaRangeQueryTokenType:
                        for (let i = 0; i < (node as MediaRangeQueryToken).l.length; i++) {
                            const element = (node as MediaRangeQueryToken).l[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        source.push((node as MediaRangeQueryToken).op1);
                        (node as MediaRangeQueryToken).op1[PARENT] = node;

                        for (let i = 0; i < (node as MediaRangeQueryToken).val.length; i++) {
                            const element = (node as MediaRangeQueryToken).val[i];
                            source.push(element);
                            element[PARENT] = node;
                        }

                        source.push((node as MediaRangeQueryToken).op2);
                        (node as MediaRangeQueryToken).op2[PARENT] = node;

                        for (let i = 0; i < (node as MediaRangeQueryToken).r.length; i++) {
                            const element = (node as MediaRangeQueryToken).r[i];
                            source.push(element);
                            element[PARENT] = node;
                        }
                        break;
                }

                if (source.length > 0) {
                    if (reverse) {
                        for (let i = 0; i < source.length; i++) {
                            parents.push(source[i]);
                            source[i][PARENT] = node;
                        }
                    } else {
                        for (let i = source.length - 1; i >= 0; i--) {
                            parents.push(source[i]);
                            source[i][PARENT] = node;
                        }
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

            if (reverse) {
                // @ts-expect-error
                for (let i = 0; i < (node.chi as AstNode[])!.length; i++) {
                    // @ts-expect-error
                    parents.push((node.chi as AstNode[])![i]);
                    // @ts-expect-error
                    (node.chi as AstNode[])![i][PARENT] = node;
                }
            } else {
                // @ts-expect-error
                for (let i = (node.chi as AstNode[])!.length - 1; i >= 0; i--) {
                    // @ts-expect-error
                    parents.push((node.chi as AstNode[])![i]);
                    // @ts-expect-error
                    (node.chi as AstNode[])![i][PARENT] = node;
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
    let node: Token | null;

    const values: Token[] = [];
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
            //
            if ((value as FunctionToken).chi != null) {
                const source = (value as FunctionToken).chi as Token[];

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
                values.length = 0;

                switch (value.typ) {
                    case EnumToken.BinaryExpressionTokenType:
                    case EnumToken.IfElseConditionTokenType:
                        values.push((value as BinaryExpressionToken | IfElseConditionToken).l);
                        (value as BinaryExpressionToken | IfElseConditionToken).l[PARENT] = value;

                        values.push((value as BinaryExpressionToken | IfElseConditionToken).r);
                        (value as BinaryExpressionToken | IfElseConditionToken).r[PARENT] = value;

                        break;

                    case EnumToken.MatchExpressionTokenType:
                        values.push((value as MatchExpressionToken).l);
                        (value as MatchExpressionToken).l[PARENT] = value;

                        values.push((value as MatchExpressionToken).op);
                        (value as MatchExpressionToken).op[PARENT] = value;

                        values.push((value as MatchExpressionToken).r);
                        (value as MatchExpressionToken).r[PARENT] = value;

                        break;

                    case EnumToken.SupportsQueryConditionTokenType:
                    case EnumToken.MediaQueryConditionTokenType:
                        for (let i = 0; i < (value as SupportsQueryConditionToken).l.length; i++) {
                            const element = (value as SupportsQueryConditionToken).l[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        values.push((value as SupportsQueryConditionToken).op);
                        (value as SupportsQueryConditionToken).op[PARENT] = value;

                        for (let i = 0; i < (value as SupportsQueryConditionToken).r.length; i++) {
                            const element = (value as SupportsQueryConditionToken).r[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        break;

                    case EnumToken.ComposesSelectorNodeType:
                        for (let i = 0; i < (value as ComposesSelectorToken).l.length; i++) {
                            const element = (value as ComposesSelectorToken).l[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        if ((value as ComposesSelectorToken).r != null) {
                            values.push((value as ComposesSelectorToken).r as Token);
                            ((value as ComposesSelectorToken).r as Token)[PARENT] = value;
                        }

                        break;

                    case EnumToken.WhenElseQueryConditionTokenType:
                        values.push((value as WhenElseUnaryConditionToken).l);
                        (value as WhenElseUnaryConditionToken).l[PARENT] = value;

                        for (let i = 0; i < (value as WhenElseUnaryConditionToken).r.length; i++) {
                            const element = (value as WhenElseUnaryConditionToken).r[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        break;

                    case EnumToken.IfConditionTokenType:
                        for (let i = 0; i < (value as IfConditionToken).l.length; i++) {
                            const element = (value as IfConditionToken).l[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        for (let i = 0; i < (value as IfConditionToken).r.length; i++) {
                            const element = (value as IfConditionToken).r[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        break;

                    case EnumToken.ContainerStyleRangeTokenType:
                        for (let i = 0; i < (value as ContainerStyleRangeToken).l.length; i++) {
                            const element = (value as ContainerStyleRangeToken).l[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        for (let i = 0; i < (value as ContainerStyleRangeToken).op.length; i++) {
                            const element = (value as ContainerStyleRangeToken).op[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        for (let i = 0; i < (value as ContainerStyleRangeToken).r.length; i++) {
                            const element = (value as ContainerStyleRangeToken).r[i];
                            values.push(element);
                            element[PARENT] = value;
                        }
                        break;

                    case EnumToken.MediaRangeQueryTokenType:
                        for (let i = 0; i < (value as MediaRangeQueryToken).l.length; i++) {
                            const element = (value as MediaRangeQueryToken).l[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        values.push((value as MediaRangeQueryToken).op1);
                        (value as MediaRangeQueryToken).op1[PARENT] = value;

                        for (let i = 0; i < (value as MediaRangeQueryToken).val.length; i++) {
                            const element = (value as MediaRangeQueryToken).val[i];
                            values.push(element);
                            element[PARENT] = value;
                        }

                        values.push((value as MediaRangeQueryToken).op2);
                        (value as MediaRangeQueryToken).op2[PARENT] = value;

                        for (let i = 0; i < (value as MediaRangeQueryToken).r.length; i++) {
                            const element = (value as MediaRangeQueryToken).r[i];
                            values.push(element);
                            element[PARENT] = value;
                        }
                        break;
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
