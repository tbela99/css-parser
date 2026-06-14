import { EnumToken } from './types.js';
import { walk, walkValues } from './walk.js';

/**
 * search the ast tree and return the first match
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
function find(ast, matcher) {
    for (const { node } of walk(ast)) {
        if (matcher(node)) {
            return node;
        }
    }
    return null;
}
/**
 * search the ast tree by checking each node's value and return the first match
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

 // find declaration which contain a '30px'
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
function findByValue(ast, matcher) {
    let source;
    for (const { node } of walk(ast)) {
        source = null;
        if (node.typ === EnumToken.DeclarationNodeType) {
            source = node.val;
        }
        else if (Array.isArray(node.tokens)) {
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
function findAll(ast, matcher) {
    const result = [];
    for (const { node } of walk(ast)) {
        if (matcher(node)) {
            result.push(node);
        }
    }
    return result;
}
/**
 * search the ast tree and return the last match
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
function findLast(ast, matcher) {
    for (const { node } of walk(ast, null, true)) {
        if (matcher(node)) {
            return node;
        }
    }
    return null;
}

export { find, findAll, findByValue, findLast };
