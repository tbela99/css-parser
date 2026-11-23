import { EnumToken } from "../../ast/types.ts";
import type { Token } from "../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * remove comma and comment tokens
 * @param arena
 * @param tokenList
 */
export declare function stripCommaToken(arena: AstArena, tokenList: Token[]): Token[] | null;
/**
 * split a token list
 * @param arena
 * @param tokenList
 * @param split
 * @param includeSplitToken
 */
export declare function splitTokenList(arena: AstArena, tokenList: Token[], split?: EnumToken[], includeSplitToken?: boolean): Token[][];
