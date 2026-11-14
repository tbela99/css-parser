import type { Token } from "../../../@types/token.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { tokensfuncSet } from "../../syntax/constants.ts";
import type { AstArena } from "../../ast/arena.ts";

const trimTokenSpace: Set<EnumToken> = new Set([
    EnumToken.CommaTokenType,
    EnumToken.DelimTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ChildCombinatorTokenType,
    EnumToken.PipeTokenType,
    EnumToken.ColonTokenType,
]);
const trimSpaceAfter: Set<EnumToken> = new Set([
    ...tokensfuncSet.values(),
    EnumToken.ChildCombinatorTokenType,
    EnumToken.SupportsQueryConditionTokenType,
    EnumToken.SupportsQueryUnaryConditionTokenType,
    EnumToken.CommaTokenType,
    EnumToken.PipeTokenType,
]);

/**
 * remove leading, trailing and redundant whitespace tokens (in place)
 * @param arena
 * @param tokens
 */
export function trimWhiteSpaceTokens(arena: AstArena, tokens: Token[]): Token[] {
    let i: number = 0;

    if (tokens.length > 0 && arena.dataTypes[tokens[0]] === EnumToken.WhitespaceTokenType) {
        tokens.shift();
    }

    if (tokens.length > 0 && arena.dataTypes[tokens[tokens.length - 1]] === EnumToken.WhitespaceTokenType) {
        tokens.pop();
    }

    if (tokens.length === 1) {
        if (arena.dataTypes[tokens[0]] === EnumToken.WhitespaceTokenType) {
            tokens.length = 0;
        }

        return tokens;
    }

    for (; i < tokens.length; i++) {
        if (trimTokenSpace.has(arena.dataTypes[tokens[i]])) {
            if (i + 1 < tokens.length && arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }

            if (i > 0 && arena.dataTypes[tokens[i - 1]] === EnumToken.WhitespaceTokenType) {
                tokens.splice(--i, 1);
                continue;
            }
        }

        if (
            trimSpaceAfter.has(arena.dataTypes[tokens[i]]) &&
            i + 1 < tokens.length &&
            arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType
        ) {
            tokens.splice(i + 1, 1);
        }
    }

    return tokens;
}
