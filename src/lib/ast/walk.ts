import {AstNode, AstRuleList, Token} from "../../@types";

export function* walk(node: AstNode, parent?: AstRuleList, root?: AstRuleList): Generator<{
    node: AstNode,
    parent?: AstRuleList,
    root?: AstRuleList
}> {

    yield {node, parent, root};

    if ('chi' in node) {

        for (const child of <Array<AstNode>>node.chi) {

            yield* walk(<AstNode>child, <AstRuleList>node, <AstRuleList>(root ?? node));
        }
    }
}

export function* walkValues(values: Token[], parent?: Token): Generator<{ value: Token, parent: Token | null }> {

    for (const value of values) {

        // @ts-ignore
        yield {value, parent};

        if ('chi' in value) {

            yield* walkValues(<Token[]>value.chi, value);
        }
    }
}