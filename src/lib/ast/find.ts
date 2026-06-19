import type { Token } from "../../@types/token.d.ts";
import type { AstDeclaration, AstNode, AstValueMatcher, TokenSearchResult } from "../../@types/ast.d.ts";
import { EnumToken } from "./types.ts";
import { walk, walkValues } from "./walk.ts";

/**
 * Search the ast tree and return the first match
 * 
 * ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
import { find, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const node = find(result.ast, nodeMatcher);

     console.log({node});
 
    ```
 *
 * @param ast
 * @param matcher
 * @returns
 */
export function find(ast: AstNode, matcher: (node: AstNode) => boolean): AstNode | null {
    for (const { node } of walk(ast)) {
        if (matcher(node)) {
            return node;
        }
    }

    return null;
}

/**
 * Search the ast tree by checking each node's value token and return the first match
 * 
 * ```ts
 *  // find the first ast node which contains the length token '30px'
import { findByValue, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain the length token '30px'
  const nodeMatcher = (value: Token) =>
      return value.typ == EnumToken.LengthTokenType && (value as LengthToken).val == 30 && (value as LengthToken).unit == 'px' ; 

     const result  = await transform(css);     
     const { node, value } = findByValue(result.ast, nodeMatcher) ?? {};

     console.log({node, value});
 
    ```
 *
 * @param ast 
 * @param matcher 
 * @returns 
 */
export function findByValue(
    ast: AstNode,
    matcher: AstValueMatcher,
): { node: AstNode; value: TokenSearchResult } | null {
    let source: Token[] | null;

    for (const { node } of walk(ast)) {
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

/** 
 * Search the ast tree and return all matches
 * 
 * ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
import { findAll, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const nodes = findAll(result.ast, nodeMatcher);

     console.log({nodes});
 
    ```
 *
 * @param ast
 * @param matcher
 * @returns
 */
export function findAll(ast: AstNode, matcher: (node: AstNode) => boolean): AstNode[] {
    const result: AstNode[] = [];

    for (const { node } of walk(ast)) {
        if (matcher(node)) {
            result.push(node);
        }
    }

    return result;
}

/**
 * Search the ast tree and return the last match.
 * 
 * ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
import { findLast, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const node = findLast(result.ast, nodeMatcher);

     console.log({node});
 
    ```
 *
 * @param ast 
 * @param matcher 
 * @returns 
 */
export function findLast(ast: AstNode, matcher: (node: AstNode) => boolean): AstNode | null {
    for (const { node } of walk(ast, null, true)) {
        if (matcher(node)) {
            return node;
        }
    }

    return null;
}
/**
 * Find the node's value token of the specified ast node
 * 
 * ```ts
// find the first ast declaration node which name is 'aspect-ratio'
import { findValue, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const found = findValue(result.ast.chi[0], nodeMatcher);

     console.log({found}); // 'button' token of the selector
  
```
 *
 * @param ast
 * @param matcher
 * @returns
 */

export function findValue(
    ast: AstNode | Token,
    matcher: (
        node: AstNode,
        parent?: AstNode | Token | null,
        root?: AstNode | null,
        parents?: Generator<Token> | null,
    ) => boolean,
): TokenSearchResult | null {
    let tokens: Token[] | null = null;

    if (
        ast != null &&
        (ast.typ === EnumToken.StyleSheetNodeType ||
            ast.typ === EnumToken.RuleNodeType ||
            ast.typ === EnumToken.AtRuleNodeType ||
            ast.typ === EnumToken.KeyFramesRuleNodeType ||
            ast.typ === EnumToken.KeyframesAtRuleNodeType)
    ) {
        if (Array.isArray(ast.tokens)) {
            tokens = ast.tokens;
        }
    } else if (ast?.typ === EnumToken.DeclarationNodeType) {
        tokens = (ast as AstDeclaration).val;
    } else if (ast != null) {
        if (matcher(ast, ast?.parent)) {
            return { node: ast, parent: ast?.parent, root: null, parents: null };
        }

        if (Array.isArray(ast.chi)) {
            tokens = ast.chi;
        }
    }

    if (Array.isArray(tokens)) {
        for (const { value, parent, root: rootNode, parents } of walkValues(tokens, ast)) {
            if (matcher(value, parent, rootNode, parents)) {
                return { node: value, parent, root: rootNode, parents };
            }
        }
    }

    return null;
}
