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
import {EnumToken} from "./types";
import {renderToken} from "../renderer";

export enum WalkerValueEvent {
    Enter,
    Leave
}

export function* walk(node: AstNode, filter?: WalkerFilter): Generator<WalkResult> {

    const parents: AstNode[] = [node];
    const root: AstRuleList = <AstRuleList>node;

    const map: Map<AstNode, AstNode> = new Map;

    while ((node = <AstNode>parents.shift())) {

        let option: WalkerOption = null;

        if (filter != null) {

            option = filter(node);

            if (option === 'ignore') {

                continue;
            }

            if (option === 'stop') {

                break;
            }
        }

        // @ts-ignore
        if (option !== 'children') {

            // @ts-ignore
            yield {node, parent: <AstRuleList>map.get(node), root};
        }

        if (option !== 'ignore-children' && 'chi' in node) {

            parents.unshift(...<AstNode[]>(<AstRuleList>node).chi);

            for (const child of <AstNode[]>(<AstRuleList>node).chi.slice()) {

                map.set(child, node);
            }
        }
    }
}

export function* walkValues(values: Token[], root: AstNode | Token | null = null, filter?: WalkerValueFilter | {
    event: WalkerValueEvent,
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

    while (stack.length > 0) {

        let value: Token =  reverse ? <Token> stack.pop() : <Token> stack.shift();
        let option: WalkerOption = null;

        if (filter.fn != null && filter.event == WalkerValueEvent.Enter) {

            const isValid: boolean = filter.type == null || value.typ == filter.type ||
                (Array.isArray(filter.type) && filter.type.includes(value.typ)) ||
                (typeof filter.type == 'function' && filter.type(value));

            if (isValid) {

                option = filter.fn(value, <FunctionToken | ParensToken>map.get(value) ?? root, WalkerValueEvent.Enter);

                if (option === 'ignore') {

                    continue;
                }

                if (option === 'stop') {

                    break;
                }

                // @ts-ignore
                if (option != null && typeof option == 'object' && 'typ' in option) {

                    map.set(option, map.get(value) ?? root as FunctionToken | ParensToken);
                }
            }
        }

        // @ts-ignore
        if (filter.event == WalkerValueEvent.Enter && option !== 'children') {

            yield {
                value,
                parent: <FunctionToken | ParensToken>map.get(value) ?? root,
                previousValue: previous,
                nextValue: <Token>stack[0] ?? null,
                // @ts-ignore
                root: root ?? null
            };
        }

        if (option !== 'ignore-children' && 'chi' in value) {

            const sliced = (<FunctionToken | ParensToken>value).chi.slice();

            for (const child of sliced) {

                map.set(child, <FunctionToken | ParensToken>value);
            }

            if (reverse) {

                stack.push(...sliced);
            }
            else {

                stack.unshift(...sliced);
            }

        } else if (value.typ == EnumToken.BinaryExpressionTokenType) {

            map.set(value.l, map.get(value) ?? root as FunctionToken | ParensToken);
            map.set(value.r, map.get(value) ?? root as FunctionToken | ParensToken);

            stack.unshift(value.l, value.r);
        }

        if (filter.event == WalkerValueEvent.Leave && filter.fn != null) {

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

        // @ts-ignore
        if (filter.event == WalkerValueEvent.Leave && option !== 'children') {

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