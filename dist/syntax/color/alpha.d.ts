import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * Compute alpha color
 * @param arena
 * @param color
 * @param alpha
 * @returns
 */
export declare function alpha(arena: AstArena, color: Token, alpha: Token): Token | null;
