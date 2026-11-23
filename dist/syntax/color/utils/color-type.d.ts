import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
import { ColorType } from "../../../ast/types.ts";
/**
 * Return the color type of the color components
 * @param arena
 * @param color
 */
export declare function getColorType(arena: AstArena, color: Token): ColorType | null;
