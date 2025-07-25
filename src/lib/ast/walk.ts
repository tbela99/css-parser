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

export enum WalkerOptionEnum {

    Ignore,
    Stop,
    Children,
    IgnoreChildren
}

export enum WalkerValueEvent {
    Enter,
    Leave
}

/**
 * walk ast nodes
 * @param node
 * @param filter
 */
export function* walk(node: AstNode, filter?: WalkerFilter): Generator<WalkResult> {

    const parents: AstNode[] = [node];
    const root: AstRuleList = <AstRuleList>node;

    const map: Map<AstNode, AstNode> = new Map;

    while ((node = <AstNode>parents.shift())) {

        let option: WalkerOption = null;

        if (filter != null) {

            option = filter(node);

            if (option === WalkerOptionEnum.Ignore) {

                continue;
            }

            if (option === WalkerOptionEnum.Stop) {

                break;
            }
        }

        // @ts-ignore
        if (option !== 'children') {

            // @ts-ignore
            yield {node, parent: <AstRuleList>map.get(node), root};
        }

        if (option !== WalkerOptionEnum.IgnoreChildren && 'chi' in node) {

            parents.unshift(...<AstNode[]>(<AstRuleList>node).chi);

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
 */
export function* walkValues(values: Token[], root: AstNode | Token | null = null, filter?: WalkerValueFilter | {
    event?: WalkerValueEvent,
    fn?: WalkerValueFilter,
    type?: EnumToken | EnumToken[] | ((token: Token) => boolean)
}, reverse?: boolean): Generator<WalkAttributesResult> {

    // const set = new Set<Token>();
    const stack: Token[] = values.slice();
    const map: Map<Token, FunctionToken | ParensToken | BinaryExpressionToken> = new Map;

    let previous: Token | null = null;
    // let parent: FunctionToken | ParensToken | BinaryExpressionToken | null = null;

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

    const eventType = filter.event ?? WalkerValueEvent.Enter;

    while (stack.length > 0) {

        let value: Token = reverse ? <Token>stack.pop() : <Token>stack.shift();
        let option: WalkerOption = null;

        if (filter.fn != null && eventType == WalkerValueEvent.Enter) {

            const isValid: boolean = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));

            if (isValid) {

                option = filter.fn(value, <FunctionToken | ParensToken>map.get(value) ?? root);

                if (option === WalkerOptionEnum.Ignore) {

                    continue;
                }

                if (option === WalkerOptionEnum.Stop) {

                    break;
                }

                // @ts-ignore
                if (option != null && typeof option == 'object' && 'typ' in option) {

                    map.set(option, map.get(value) ?? root as FunctionToken | ParensToken);
                }
            }
        }

        if (eventType == WalkerValueEvent.Enter && option !== WalkerOptionEnum.Children) {

            yield {
                value,
                parent: <FunctionToken | ParensToken>map.get(value) ?? root,
                previousValue: previous,
                nextValue: <Token>stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        }

        if (option !== WalkerOptionEnum.IgnoreChildren && 'chi' in value) {

            const sliced = (<FunctionToken | ParensToken>value).chi.slice();

            for (const child of sliced) {

                map.set(child, <FunctionToken | ParensToken>value);
            }

            if (reverse) {

                stack.push(...sliced);
            } else {

                stack.unshift(...sliced);
            }

        } else {

            const values: Token[] = [];

            if ('l' in value && value.l != null) {

                // @ts-ignore
                values.push(value.l);
                // @ts-ignore
                map.set(value.l, value);
            }

            if ('op' in value && typeof value.op == 'object') {

                values.push(value.op);
                // @ts-ignore
                map.set(value .op, value);
            }

            if ('r' in value && value.r != null) {

                if (Array.isArray(value.r)) {

                    for (const r of value.r) {

                        // @ts-ignore
                        values.push(r);
                        // @ts-ignore
                        map.set(r, value);
                    }
                }

                else {

                    // @ts-ignore
                    values.push(value.r);
                    // @ts-ignore
                    map.set(value.r, value);
                }
            }

            if (values.length > 0) {

                stack.unshift(...values);
            }
        }

        if (eventType == WalkerValueEvent.Leave && filter.fn != null) {

            const isValid: boolean = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));

            if (isValid) {

                option = filter.fn(value, <FunctionToken | ParensToken>map.get(value));

                // @ts-ignore
                if (option != null && 'typ' in option) {

                    map.set(option, map.get(value) ?? root as FunctionToken | ParensToken);
                }
            }
        }

        if (eventType == WalkerValueEvent.Leave && option !== WalkerOptionEnum.Children) {

            yield {
                value,
                parent: <FunctionToken | ParensToken>map.get(value) ?? root,
                previousValue: previous,
                nextValue: <Token>stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        }

        previous = value;
    }
}