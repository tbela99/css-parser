import type { Token } from "../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * Compute color mix
 * @param arena
 * @param args
 * @returns
 */
export declare function colorMix(arena: AstArena, ...args: Token[]): Token | null;
