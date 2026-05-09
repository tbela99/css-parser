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
 * replace token in its parent node
 * @param parent
 * @param value
 * @param replacement
 */
function replaceToken(parent, value, replacement) {
    for (const node of Array.isArray(replacement) ? replacement : [replacement]) {
        if ("parent" in value && value.parent != node.parent) {
            Object.defineProperty(node, "parent", {
                ...definedPropertySettings,
                value: value.parent,
            });
        }
    }
    if (parent.typ == EnumToken.BinaryExpressionTokenType) {
        if (parent.l == value) {
            parent.l = replacement;
        }
        else {
            parent.r = replacement;
        }
    }
    else {
        const target = "val" in parent && Array.isArray(parent.val)
            ? parent.val
            : (parent.chi ?? parent);
        if (Array.isArray(target)) {
            // @ts-ignore
            const index = target.indexOf(value);
            if (index == -1) {
                return;
            }
            target.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]));
        }
        else if ("l" in target && target.l == value) {
            target.l = replacement;
        }
        else if ("r" in target && target.r == value) {
            target.r = replacement;
        }
    }
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

export { replaceToken, trimWhiteSpaceTokens };
