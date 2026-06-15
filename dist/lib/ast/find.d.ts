import type { Token } from "../../@types/token.d.ts";
import type { AstNode, AstValueMatcher, TokenSearchResult } from "../../@types/ast.d.ts";
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
export declare function find(ast: AstNode, matcher: (node: AstNode) => boolean): AstNode | null;
/**
 * search the ast tree by checking each node's value token and return the first match
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
export declare function findByValue(ast: AstNode, matcher: AstValueMatcher): {
    node: AstNode;
    value: TokenSearchResult;
} | null;
/**
 * search the ast tree and return all matches
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
export declare function findAll(ast: AstNode, matcher: (node: AstNode) => boolean): AstNode[];
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
export declare function findLast(ast: AstNode, matcher: (node: AstNode) => boolean): AstNode | null;
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
export declare function findValue(ast: AstNode | Token, matcher: (node: AstNode, parent?: AstNode | Token | null, root?: AstNode | null, parents?: Generator<Token> | null) => boolean): TokenSearchResult | null;
