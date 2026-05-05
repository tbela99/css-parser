import type {
    AstAtRule,
    AstDeclaration,
    AstKeyFrameRule,
    AstKeyframesAtRule,
    AstKeyframesRule,
    AstNode,
    AstRule,
} from "../../../@types/ast.d.ts";
import type {
    BinaryExpressionToken,
    FunctionToken,
    MediaQueryConditionToken,
    ParensToken,
    Token,
} from "../../../@types/token.ts";
import { EnumToken } from "../../ast/types.ts";
import { definedPropertySettings, tokensfuncSet } from "../../syntax/constants.ts";

const trimTokenSpace: Set<EnumToken> = new Set([
    EnumToken.CommaTokenType,
    EnumToken.DelimTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ChildCombinatorTokenType,
]);
const trimSpaceAfter: Set<EnumToken> = new Set([
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
export function replaceToken(
    parent:
        | BinaryExpressionToken
        | (AstNode &
              (
                  | { chi: Token[] }
                  | {
                        val: Token[];
                    }
              )),
    value: Token,
    replacement: Token | Token[],
) {
    for (const node of Array.isArray(replacement) ? replacement : [replacement]) {
        if ("parent" in value && value.parent != node.parent) {
            Object.defineProperty(node, "parent", {
                ...definedPropertySettings,
                value: value.parent,
            });
        }
    }

    if (parent.typ == EnumToken.BinaryExpressionTokenType) {
        if ((parent as BinaryExpressionToken).l == value) {
            (parent as BinaryExpressionToken).l = replacement as Token;
        } else {
            (parent as BinaryExpressionToken).r = replacement as Token;
        }
    } else {
        const target =
            "val" in parent! && Array.isArray((parent as AstDeclaration).val)
                ? (parent as AstDeclaration).val
                : (((
                      parent as
                          | FunctionToken
                          | ParensToken
                          | AstAtRule
                          | AstKeyframesAtRule
                          | AstKeyFrameRule
                          | AstRule
                          | AstKeyframesRule
                  ).chi as Token[]) ?? parent);

        if (Array.isArray(target)) {
            // @ts-ignore
            const index: number = target.indexOf(value);

            if (index == -1) {
                return;
            }

            target.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]));
        } else if ("l" in target && (target as BinaryExpressionToken | MediaQueryConditionToken).l == value) {
            (target as BinaryExpressionToken | MediaQueryConditionToken).l = replacement as Token;
        } else if ("r" in target && (target as BinaryExpressionToken | MediaQueryConditionToken).r == value) {
            (target as BinaryExpressionToken | MediaQueryConditionToken).r = replacement as Token;
        }
    }
}

export function trimWhiteSpaceTokens(tokens: Token[]): Token[] {
    let i: number = 0;

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
        } else if (trimTokenSpace.has(tokens[i].typ)) {
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
