import {AstNode, AstRuleList} from "../../@types";

export function* walk(node: AstNode): Generator<{
    node: AstNode,
    parent?: AstRuleList,
    root?: AstRuleList
}> {

    // @ts-ignore
    yield* doWalk(node, null, null);
}

function* doWalk(node: AstNode, parent?: AstRuleList, root?: AstRuleList): Generator<{
    node: AstNode,
    parent?: AstRuleList,
    root?: AstRuleList
}> {

    yield {node, parent, root};

    if ('chi' in node) {

        for (const child of <Array<AstNode>>node.chi) {

            yield* doWalk(<AstNode>child, <AstRuleList>node, <AstRuleList>(root == null ? node : root))
        }
    }
}