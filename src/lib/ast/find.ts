import type { Token } from "../../@types/token.d.ts";
import type { AstDeclaration, AstNode } from "../../@types/ast.d.ts";
import { EnumToken } from "./types.ts";
import { walk, walkValues } from "./walk.ts";

export interface TokenSearchResult {
    node: Token | null;
    parent: AstNode | Token | null;
    root: AstNode | Token | null;
    parents: Generator<Token> | null;
}

export function find(root: AstNode, matcher: (node: AstNode) => boolean): AstNode | null {
    if (matcher(root)) {
        return root;
    }

    if (Array.isArray(root.chi)) {
        for (const { node } of walk(root.val)) {
            if (matcher(node)) {
                return node;
            }
        }
    }

    return null;
}

/**
 * find not by checking its value
 * 
 * ```ts
 * 
 * // find declaration which contain a color
  const nodeMatcher = (value: Token, node: AstNode) =>
    node.typ === EnumToken.DeclarationNodeType &&
     value.typ === EnumToken.ColorTokenType;

     const { node, value } = findByAttribute(astNode, nodeMatcher) ?? {};
 
    ```
 *
 * @param root 
 * @param matcher 
 * @returns 
 */
export function findByValue(
    root: AstNode,
    matcher: (token: Token, node?: AstNode) => boolean,
): { node: AstNode; value: TokenSearchResult } | null {
    let source: Token[] | null;

    for (const { node } of walk(root)) {
        source = null;

        if (node.typ === EnumToken.DeclarationNodeType) {
            source = (node as AstDeclaration).val;
        } else if (Array.isArray(node.tokens)) {
            source = node.tokens;
        }

        if (source == null) {
            continue;
        }

        for (const { value, parent, root: rootNode, parents } of walkValues(source, node)) {
            if (matcher(value, node)) {
                return { node, value: { node: value, parent, root: rootNode, parents } };
            }
        }
    }

    return null;
}

export function findAll(root: AstNode, matcher: (node: AstNode) => boolean) {
    const result: AstNode[] = [];

    if (matcher(root)) {
        result.push(root);
    }

    if (Array.isArray(root.chi)) {
        for (const { node } of walk(root.val)) {
            if (matcher(node)) {
                result.push(node);
            }
        }
    }

    return result;
}

export function findLast(root: AstNode, matcher: (node: AstNode) => boolean) {
    if (matcher(root)) {
        return root;
    }

    if (Array.isArray(root.chi)) {
        for (const { node } of walk(root.chi, null, true)) {
            if (matcher(node)) {
                return node;
            }
        }
    }

    return null;
}

export function findToken(
    root: AstNode | Token,
    matcher: (
        node: AstNode,
        parent?: AstNode | Token | null,
        root?: AstNode | null,
        parents?: Generator<Token> | null,
    ) => boolean,
): TokenSearchResult | null {
    let tokens: Token[] | null = null;

    if (
        root != null &&
        (root.typ === EnumToken.StyleSheetNodeType ||
            root.typ === EnumToken.RuleNodeType ||
            root.typ === EnumToken.AtRuleNodeType ||
            root.typ === EnumToken.KeyFramesRuleNodeType ||
            root.typ === EnumToken.KeyframesAtRuleNodeType)
    ) {
        if (Array.isArray(root.tokens)) {
            tokens = root.tokens;
        }

        return null;
    } else if (root?.typ === EnumToken.DeclarationNodeType) {
        tokens = (root as AstDeclaration).val;
    } else if (root != null) {
        if (matcher(root, root?.parent)) {
            return { node: root, parent: root?.parent, root: null, parents: null };
        }

        if (Array.isArray(root.chi)) {
            tokens = root.chi;
        }
    }

    if (Array.isArray(tokens)) {
        for (const { value, parent, root: rootNode, parents } of walkValues(tokens, root)) {
            if (matcher(value, parent, rootNode, parents)) {
                return { node: value, parent, root: rootNode, parents };
            }
        }

        return null;
    }

    return null;
}
