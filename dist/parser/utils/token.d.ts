import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * remove leading, trailing and redundant whitespace tokens (in place)
 * @param arena
 * @param tokens
 */
export declare function trimWhiteSpaceTokens(arena: AstArena, tokens: Token[]): Token[];
