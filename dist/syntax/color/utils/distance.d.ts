import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
/**
 * Calculate the distance between two okLab colors.
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 * @param arena
 * @param color1
 * @param color2
 */
export declare function okLabDistance(arena: AstArena, color1: Token, color2: Token): number | null;
/**
 * Check if two colors are close in okLab space.
 * @param arena
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
export declare function isOkLabClose(arena: AstArena, color1: Token, color2: Token, threshold?: number): boolean;
