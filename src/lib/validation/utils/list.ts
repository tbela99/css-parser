import { EnumToken } from "../../ast/types.ts";
import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";

/**
 * remove comma and comment tokens
 * @param arena
 * @param tokenList
 */
export function stripCommaToken(arena: AstArena, tokenList: Token[]): Token[] | null {
    let result: Token[] = [];

    for (let i = 0; i < tokenList.length; i++) {
        const typ: EnumToken = arena.dataTypes[tokenList[i]];

        if (typ == EnumToken.CommentTokenType || typ == EnumToken.CommaTokenType) {
            continue;
        }

        result.push(tokenList[i]);
    }

    return result;
}

/**
 * split a token list
 * @param arena
 * @param tokenList
 * @param split
 * @param includeSplitToken
 */
export function splitTokenList(
    arena: AstArena,
    tokenList: Token[],
    split: EnumToken[] = [EnumToken.CommaTokenType],
    includeSplitToken: boolean = false,
): Token[][] {
    const result: Token[][] = [[]];

    for (let i = 0; i < tokenList.length; i++) {
        const curr: Token = tokenList[i];

        if (split.includes(arena.dataTypes[curr])) {
            if (includeSplitToken) {
                result[result.length - 1].push(curr);
            }

            result.push([]);
        } else {
            result[result.length - 1].push(curr);
        }
    }

    return result;
}
