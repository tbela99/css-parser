import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * convert angle to degrees (in place)
 * @param arena
 * @param angle
 * @returns
 */
export declare function toDegrees(arena: AstArena, angle: Token): Token;
