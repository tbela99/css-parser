import type {
    AstNode,
    AstRuleList,
    BinaryExpressionToken,
    FunctionToken,
    ParensToken,
    Token,
    WalkAttributesResult,
    WalkerFilter,
    WalkerOption,
    WalkerValueFilter,
    WalkResult
} from "../../@types/index.d.ts";
import {EnumToken} from "./types.ts";

/**
 * options for the walk function
 */
export enum WalkerOptionEnum {

    /**
     * ignore the current node and its children
     */
    Ignore = 0x1,
    /**
     * stop walking the tree
     */
    Stop = 0x2,
    /**
     * ignore node and process children
     */
    Children = 0x4,
    /**
     * ignore children
     */
    IgnoreChildren = 0x8
}

/**
 * event types for the walkValues function
 */
export enum WalkerValueEvent {

    /**
     * enter node
     */
    Enter = 0x1,
    /**
     * leave node
     */
    Leave = 0x2
}

/**
 * walk ast nodes
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
 * Using a filter to control the walk process:
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
 * for (const {node, parent, root} of walk(ast, (node) => {
 *
 *     if (node.typ == EnumToken.AstRule && node.sel.includes('html')) {
 *
 *         // skip the children of the current node
 *         return WalkerOptionEnum.IgnoreChildren;
 *     }
 * })) {
 *
 *     // do something with node
 * }
 * ```
 */
export function* walk(node: AstNode, filter?: WalkerFilter | null, reverse?: boolean): Generator<WalkResult> {

    const parents: AstNode[] = [node];
    const root: AstRuleList = <AstRuleList>node;

    const map: Map<AstNode, AstNode> = new Map;
    let isNumeric: boolean = false;

    while ((node = <AstNode>parents.shift())) {

        let option: WalkerOption = null;

        if (filter != null) {

            option = filter(node);
            isNumeric = typeof option == 'number';

            if (isNumeric) {

                if (((option as number) & WalkerOptionEnum.Ignore)) {

                    continue;
                }

                if (((option as number) & WalkerOptionEnum.Stop)) {

                    break;
                }
            }
        }

        if (!isNumeric || ((option as number) & WalkerOptionEnum.Children) === 0) {

            // @ts-ignore
            yield {node, parent: <AstRuleList>map.get(node), root};
        }

        if ('chi' in node && (!isNumeric || (((option as number) & WalkerOptionEnum.IgnoreChildren) === 0))) {

            parents.unshift(...<AstNode[]>(<AstRuleList>node).chi[reverse ? 'reverse' : 'slice']());

            for (const child of <AstNode[]>(<AstRuleList>node).chi.slice()) {

                map.set(child, node);
            }
        }
    }
}

/**
 * walk ast node value tokens
 * @param values
 * @param root
 * @param filter
 * @param reverse
 *
 * Example:
 *
 * ```ts
 *
 * import {EnumToken, walk} from '@tbela99/css-parser';
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
 * for (const {value} of walkValues(result.ast.chi[0].chi[0].val, null, null,true)) {
 *
 *     console.error([EnumToken[value.typ], value.val]);
 * }
 *
 */
export function* walkValues(values: Token[], root: AstNode | Token | null = null, filter?: WalkerValueFilter | null | {
    event?: WalkerValueEvent,
    fn?: WalkerValueFilter,
    type?: EnumToken | EnumToken[] | ((token: Token) => boolean)
}, reverse?: boolean): Generator<WalkAttributesResult> {

    // const set = new Set<Token>();
    const stack: Token[] = values.slice();
    const map: Map<Token, FunctionToken | ParensToken | BinaryExpressionToken> = new Map;

    let previous: Token | null = null;

    if (filter != null && typeof filter == 'function') {

        filter = {
            event: WalkerValueEvent.Enter,
            fn: filter
        }

    } else if (filter == null) {

        filter = {
            event: WalkerValueEvent.Enter
        }
    }

    let isNumeric: boolean = false;
    const eventType = filter.event ?? WalkerValueEvent.Enter;

    while (stack.length > 0) {

        let value: Token = reverse ? <Token>stack.pop() : <Token>stack.shift();
        let option: WalkerOption = null;

        if (filter.fn != null && (eventType & WalkerValueEvent.Enter)) {

            const isValid: boolean = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));

            if (isValid) {

                option = filter.fn(value, <FunctionToken | ParensToken>map.get(value) ?? root, WalkerValueEvent.Enter);

                isNumeric = typeof option == 'number';

                if (isNumeric && ((option as number) & WalkerOptionEnum.Stop)) {

                    return;
                }

                if (isNumeric && ((option as number) & WalkerOptionEnum.Ignore)) {

                    continue;
                }

                // @ts-ignore
                if (option != null && typeof option == 'object' && 'typ' in option) {

                    map.set(option, map.get(value) ?? root as FunctionToken | ParensToken);
                }
            }
        }

        // if ((eventType & WalkerValueEvent.Enter) && (!isNumeric || ((option as number) & WalkerOptionEnum.Children) === 0)) {

            yield {
                value,
                parent: <FunctionToken | ParensToken>map.get(value) ?? root,
                previousValue: previous,
                nextValue: <Token>stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        // }

        if ('chi' in value && (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)) {

            const sliced = (<FunctionToken | ParensToken>value).chi.slice();

            for (const child of sliced) {

                map.set(child, <FunctionToken | ParensToken>value);
            }

            stack[reverse ? 'push' : 'unshift'](...sliced);

        } else {

            const values: Token[] = [];

            if ('l' in value && value.l != null) {

                // @ts-ignore
                values[reverse ? 'push' : 'unshift'](value.l);
                // @ts-ignore
                map.set(value.l, value);
            }

            if ('op' in value && typeof value.op == 'object') {

                values[reverse ? 'push' : 'unshift'](value.op);
                // @ts-ignore
                map.set(value.op, value);
            }

            if ('r' in value && value.r != null) {

                if (Array.isArray(value.r)) {

                    for (const r of value.r) {

                        // @ts-ignore
                        values[reverse ? 'push' : 'unshift'](r);
                        // @ts-ignore
                        map.set(r, value);
                    }
                } else {

                    // @ts-ignore
                    values[reverse ? 'push' : 'unshift'](value.r);
                    // @ts-ignore
                    map.set(value.r, value);
                }
            }

            if (values.length > 0) {

                stack[reverse ? 'push' : 'unshift'](...values);
            }
        }

        if ((eventType & WalkerValueEvent.Leave) && filter.fn != null) {

            const isValid: boolean = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));

            if (isValid) {

                option = filter.fn(value, <FunctionToken | ParensToken>map.get(value), WalkerValueEvent.Leave);

                // @ts-ignore
                if (option != null && 'typ' in option) {

                    map.set(option, map.get(value) ?? root as FunctionToken | ParensToken);
                }
            }
        }

        // if ((eventType & WalkerValueEvent.Leave) && (!isNumeric && ((option as number) & WalkerOptionEnum.Children) === 0)) {
        //
        //     yield {
        //         value,
        //         parent: <FunctionToken | ParensToken>map.get(value) ?? root,
        //         previousValue: previous,
        //         nextValue: <Token>stack[0] ?? null,
        //         // @ts-ignore
        //         root: root ?? null
        //     };
        // }

        previous = value;
    }
}