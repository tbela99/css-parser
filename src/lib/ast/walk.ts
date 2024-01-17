import {
    AstNode,
    AstRuleList, BinaryExpressionToken,
    FunctionToken,
    ParensToken,
    Token,
    WalkAttributesResult,
    WalkerFilter,
    WalkerOption,
    WalkerValueFilter,
    WalkResult
} from "../../@types";
import {EnumToken} from "./types";

export function* walk(node: AstNode, filter?: WalkerFilter): Generator<WalkResult> {

    const parents: AstNode[] = [node];
    const root: AstRuleList = <AstRuleList>node;

    const weakMap: WeakMap<AstNode, AstNode> = new WeakMap;

    while (parents.length > 0) {

        node = <AstNode>parents.shift();

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
            yield {node, parent: <AstRuleList>weakMap.get(node), root};
        }

        if (option !== 'ignore-children' && 'chi' in node) {

            parents.unshift(...<AstNode[]>(<AstRuleList>node).chi);

            for (const child of <AstNode[]>(<AstRuleList>node).chi.slice()) {

                weakMap.set(child, node);
            }
        }
    }
}

export function* walkValues(values: Token[], root: AstNode | null = null, filter?: WalkerValueFilter): Generator<WalkAttributesResult> {

    const stack: Token[] = values.slice();
    const weakMap: WeakMap<Token, FunctionToken | ParensToken | BinaryExpressionToken> = new WeakMap;

    let value: Token;

    while (stack.length > 0) {

        value = <Token>stack.shift();

        let option: WalkerOption = null;

        if (filter != null) {

            option = filter(value);

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
            yield {value, parent: <FunctionToken | ParensToken>weakMap.get(value), root};
        }

        if (option !== 'ignore-children' && 'chi' in value) {

            for (const child of (<FunctionToken | ParensToken>value).chi.slice()) {

                weakMap.set(child, <FunctionToken | ParensToken>value);
            }

            stack.unshift(...(<FunctionToken | ParensToken>value).chi);
        }

        else if (value.typ == EnumToken.BinaryExpressionTokenType) {

            weakMap.set(value.l, <FunctionToken | ParensToken | BinaryExpressionToken>value);
            weakMap.set(value.r, <FunctionToken | ParensToken | BinaryExpressionToken>value);
            stack.unshift(value.l, value.r);
        }
    }
}