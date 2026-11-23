import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
import { ColorType } from "../../../ast/types.ts";
/**
 * Create a color token
 * @param arena
 * @param kind
 * @param components
 * @param alpha
 * @returns
 */
export declare function makeColor(arena: AstArena, kind: ColorType, components: Token[], alpha?: Token): Token | null;
