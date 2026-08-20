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
            // @ts-ignore
            clone[name] = value;
        } else if (Array.isArray(value)) {
            // @ts-ignore
            clone[name] = [];

            if (cloneChildren || name !== checkNode) {
                for (const c of value) {
                    const newObj = cloneNode(c, cloneChildren, cloneMap);
                    cloneMap?.set?.(c, newObj);
                    // @ts-ignore
                    clone[name].push(newObj);
                }
            }
        } else {
            // @ts-ignore
            clone[name] = { ...value };
        }
    }

    for (const symbol of Object.getOwnPropertySymbols(node)) {
        // @ts-ignore
        clone[symbol] = node[symbol];
    }

    return clone;
}
