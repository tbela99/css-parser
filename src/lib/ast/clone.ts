import type { AstNode } from "../../@types/index.d.ts";
import type { Token } from "../../@types/token.d.ts";
import { EnumToken } from "../ast/types.ts";

/**
 * 
 * clone an ast node or value
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
    const properties = {};

    cloneMap?.set?.(node, clone);

    for (const [name, value] of Object.entries(Object.getOwnPropertyDescriptors(node))) {
        // @ts-expect-error
        if (value.value == null || typeof value.value != "object" || name == "parent") {
            // @ts-expect-error
            properties[name] = { ...value };
            // @ts-expect-error
        } else if (Array.isArray(value.value)) {
            // @ts-expect-error
            properties[name] = {
                // @ts-expect-error
                ...value,
                value:
                    !cloneChildren && name == checkNode
                        ? []
                        : // @ts-expect-error
                          value.value.map((c) => {
                              const newObj = cloneNode(c, cloneChildren, cloneMap);

                              cloneMap?.set?.(c, newObj);
                              return newObj;
                          }),
            };
        } else {
            // @ts-expect-error
            properties[name] = { ...value, value: cloneNode(value.value, clone) };
        }
    }

    return Object.defineProperties(clone, properties);
}
