import {AstNode, AstRuleList, Token, WalkResult} from "../../@types";

export function* walk(node: AstNode): Generator<{
    node: AstNode,
    parent?: AstRuleList,
    root?: AstRuleList
}> {

    // @ts-ignore
    yield* doWalk(node, null, null);
}

function* doWalk(node: AstNode, parent?: AstRuleList, root?: AstRuleList): Generator<WalkResult> {

    yield {node, parent, root};

    if ('chi' in node) {

        for (const child of <Array<AstNode>>node.chi) {

            yield* doWalk(<AstNode>child, <AstRuleList>node, <AstRuleList>(root ?? node))
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