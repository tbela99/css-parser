import {AstNode, AstRuleList, FunctionToken, Token, WalkAttributesResult, WalkResult} from "../../@types";

export function* walk(node: AstNode, parent?: AstRuleList, root?: AstRuleList): Generator<WalkResult> {

    yield {node, parent, root};

    if ('chi' in node) {

        for (const child of <Array<AstNode>>node.chi) {

            yield* walk(<AstNode>child, <AstRuleList>node, <AstRuleList>(root ?? node));
        }
    }
}

export function* walkValues(values: Token[], parent?: FunctionToken): Generator<WalkAttributesResult> {

    for (const value of values) {

        // @ts-ignore
        yield {value, parent};

        if ('chi' in value) {

            yield* walkValues(<Token[]>value.chi, <FunctionToken>value);
        }
    }
}