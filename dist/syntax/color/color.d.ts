import type { Token } from "../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { ColorType } from "../../ast/types.ts";
/**
 * Converts a color to another color space
 * @param arena
 * @param token
 * @param to
 *
 * ```ts
 *
 *     const token = arena.createColor('#F00', ColorType.HEX)
 *     const result = convertColor(arena, token, ColorType.LCH);
 *
 * ```
 */
export declare function convertColor(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function hex2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function rgb2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function hsl2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function hwb2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function cmyk2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function lab2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function oklab2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function lch2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function oklch2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function color2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null;
export declare function minmax(value: number, min: number, max: number): number;
export declare function color2srgbvalues(arena: AstArena, token: Token): number[] | null;
/**
 * clamp color values
 * @param arena
 * @param token
 */
export declare function clamp(arena: AstArena, token: Token): Token;
/**
 * numeric value of a number, percentage, fraction or `none` token. percentages are divided by 100
 * @param arena
 * @param token
 */
export declare function getNumber(arena: AstArena, token: Token): number;
/**
 * convert angle to turn
 * @param arena
 * @param token
 */
export declare function getAngle(arena: AstArena, token: Token): number;
