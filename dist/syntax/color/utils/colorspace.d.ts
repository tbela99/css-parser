import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
/**
 * Return the color space of the color
 * @param arena
 * @param color
 * @returns
 */
export declare function getColorSpace(arena: AstArena, color: Token): string | null;
