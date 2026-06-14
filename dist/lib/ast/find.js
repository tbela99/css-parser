import { EnumToken } from './types.js';
import { walk, walkValues } from './walk.js';

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
function findByValue(root, matcher) {
    let source;
    for (const { node } of walk(root)) {
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

export { findByValue };
