import {AstNode, AstRuleList, FunctionToken, ParensToken, Token, WalkAttributesResult, WalkResult} from "../../@types";

export function* walk(node: AstNode): Generator<WalkResult> {

    const parents: AstNode[] = [node];
     const root = <AstRuleList>node;

     const weakMap: WeakMap<AstNode, AstNode> = new WeakMap;

     while (parents.length > 0) {

         node = <AstNode>parents.shift();

         // @ts-ignore
         yield {node, parent: weakMap.get(node), root};

         if ('chi' in node) {

             for (const child of <AstNode[]>(<AstRuleList>node).chi) {

                 weakMap.set(child, node);
             }

             parents.unshift(...<AstNode[]>(<AstRuleList>node).chi);
         }
     }
}

export function* walkValues(values: Token[]): Generator<WalkAttributesResult> {

    const stack: Token[] = values.slice();
    const weakMap: WeakMap<Token, FunctionToken | ParensToken> = new WeakMap;

    let value: Token;

    while (stack.length > 0) {

        value = <Token> stack.shift();

        // @ts-ignore
        yield {value, parent: <FunctionToken | ParensToken>weakMap.get(value)};

        if ('chi' in value) {

            for (const child of (<FunctionToken | ParensToken>value).chi) {

                weakMap.set(child, <FunctionToken | ParensToken>value);
            }

            stack.unshift(...(<FunctionToken | ParensToken>value).chi);
        }
    }
}