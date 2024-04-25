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

export function* walkValues(values: Token[], root: AstNode | null = null, filter?: WalkerValueFilter): Generator<WalkAttributesResult> {

    const stack: Token[] = values.slice();
    const map: Map<Token, FunctionToken | ParensToken | BinaryExpressionToken> = new Map;

    let value: Token;

    while ((value = <Token>stack.shift())) {

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
            yield {value, parent: <FunctionToken | ParensToken>map.get(value), root};
        }

        if (option !== 'ignore-children' && 'chi' in value) {

            for (const child of (<FunctionToken | ParensToken>value).chi.slice()) {

                map.set(child, <FunctionToken | ParensToken>value);
            }

            stack.unshift(...(<FunctionToken | ParensToken>value).chi);
        }

        else if (value.typ == EnumToken.BinaryExpressionTokenType) {

            map.set(value.l, <FunctionToken | ParensToken | BinaryExpressionToken>value);
            map.set(value.r, <FunctionToken | ParensToken | BinaryExpressionToken>value);
            stack.unshift(value.l, value.r);
        }
    }
}