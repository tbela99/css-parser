import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 *
 * @param arena
 * @param token
 */
export declare function rgb2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function hsl2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function hwb2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function lab2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function lch2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function oklab2cmyk(arena: AstArena, token: Token): Token | null;
export declare function oklch2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function color2cmykToken(arena: AstArena, token: Token): Token | null;
export declare function srgb2cmykvalues(r: number, g: number, b: number, a?: number | null): number[];
