import { EnumToken } from "../../ast/types.ts";
import type { ParserOptions, Token } from "../../../@types/index.d.ts";

export function stripCommaToken(tokenList: number[], options: ParserOptions): number[] | null {
    let result: number[] = [];
    let typ: EnumToken;
    let last: number;
    const arena = options.arena!;

    for (let i = 0; i < tokenList.length; i++) {

        typ = arena.getType(tokenList[i]);
        if (typ != EnumToken.WhitespaceTokenType) {
            last = tokenList[i];
        }

        if (typ == EnumToken.CommentTokenType || typ == EnumToken.CommaTokenType) {
            continue;
        }

        result.push(tokenList[i]);
    }

    return result;
}

export function splitTokenList(tokenList: number[], options: ParserOptions, split: EnumToken[] = [EnumToken.CommaTokenType], includeSplitToken: boolean = false): number[][] {

    const arena = options.arena!;
    return tokenList.reduce(
        (acc: number[][], curr: number): number[][] => {
            if (split.includes(arena.getType(curr))) {

                if (includeSplitToken && Array.isArray(acc[acc.length - 1])) {

                    acc[acc.length - 1].push(curr);
                }

                acc.push([]);
            } else {
                acc[acc.length - 1].push(curr);
            }

            return acc;
        },
        [[]] as number[][],
    );
}
