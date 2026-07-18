import type { AstNode } from "../../@types/index.d.ts";
import type { Token } from "../../@types/token.d.ts";
import { EnumToken } from "../ast/types.ts";

/**
 *
 * Clone an ast node or value
 * @param node
 * @param cloneChildren
 * @param cloneMap
 * @returns
 */
export function cloneNode(
    node: AstNode | Token,
    cloneChildren: boolean = false,
    cloneMap: Map<Token | AstNode, Token | AstNode> | null = null,
): AstNode | Token {
    const checkNode = node.typ == EnumToken.DeclarationNodeType ? "val" : "chi";

    const clone = {} as Token | AstNode;
    cloneMap?.set?.(node, clone);

    for (const [name, value] of Object.entries(node)) {
        if (value == null || typeof value != "object") {
            clone[name] = value;
        } else if (Array.isArray(value)) {
            clone[name] =
                !cloneChildren && name == checkNode
                    ? []
                    : value.map((c) => {
                          const newObj = cloneNode(c, cloneChildren, cloneMap);

                          cloneMap?.set?.(c, newObj);
                          return newObj;
                      });
        } else {
            clone[name] = { ...value };
        }
    }

    for (const symbol of Object.getOwnPropertySymbols(node)) {
        clone[symbol] = node[symbol];
    }

    return clone;
}
