import { EnumToken } from '../../ast/types.js';
import { definedPropertySettings, tokensfuncSet } from '../../syntax/constants.js';

const trimTokenSpace = new Set([
    EnumToken.CommaTokenType,
    EnumToken.DelimTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ChildCombinatorTokenType,
]);
const trimSpaceAfter = new Set([
    ...tokensfuncSet.values(),
    EnumToken.ChildCombinatorTokenType,
    EnumToken.SupportsQueryConditionTokenType,
    EnumToken.SupportsQueryUnaryConditionTokenType,
]);
/**
 * Replace token in its parent node
 * @param parent
 * @param node
 * @param replacement
 * @throws TypeError replacement is null
 * @throws ReferenceError node not found in parent
 */
function replaceNodeOrValue(parent, node, replacement) {
    if (replacement == null || (Array.isArray(replacement) && replacement.length === 0)) {
        throw new TypeError(`replacement is null`);
    }
    for (const node of Array.isArray(replacement) ? replacement : [replacement]) {
        if ("parent" in node && node.parent != node.parent) {
            Object.defineProperty(node, "parent", {
                ...definedPropertySettings,
                value: node.parent,
            });
        }
    }
    if (parent.typ == EnumToken.BinaryExpressionTokenType) {
        if (parent.l == node) {
            parent.l = replacement;
        }
        else if (parent.r == node) {
            parent.r = replacement;
        }
        else {
            throw new ReferenceError("Node not found");
        }
    }
    else {
        const target = "val" in parent && Array.isArray(parent.val)
            ? parent.val
            : (parent.chi ?? parent);
        if (Array.isArray(target)) {
            // @ts-ignore
            const index = target.indexOf(node);
            if (index == -1) {
                throw new ReferenceError("Node not found");
            }
            target.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]));
        }
        else if ("l" in target && target.l == node) {
            target.l = replacement;
        }
        else if ("r" in target && target.r == node) {
            target.r = replacement;
        }
        else {
            throw new ReferenceError("Node not found");
        }
    }
    return true;
}
function trimWhiteSpaceTokens(tokens) {
    let i = 0;
    if (tokens[0]?.typ === EnumToken.WhitespaceTokenType) {
        tokens.shift();
    }
    if (tokens[tokens.length - 1]?.typ === EnumToken.WhitespaceTokenType) {
        tokens.pop();
    }
    if (tokens.length === 1) {
        if (tokens[0].typ === EnumToken.WhitespaceTokenType) {
            tokens.length = 0;
        }
        return tokens;
    }
    for (; i < tokens.length; i++) {
        if (trimSpaceAfter.has(tokens[i].typ) && tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
            tokens.splice(i + 1, 1);
        }
        else if (trimTokenSpace.has(tokens[i].typ)) {
            if (tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }
            if (i > 0 && tokens[i - 1].typ === EnumToken.Whitespace) {
                tokens.splice(--i, 1);
            }
        }
    }
    return tokens;
}

export { replaceNodeOrValue, trimWhiteSpaceTokens };
