import type { AngleToken, ColorToken, FractionToken, IdentToken, NumberToken, PercentageToken } from "../../../@types/index.d.ts";
import { ColorType } from "../../ast/types.ts";
/**
 * Converts a color to another color space
 * @param token
 * @param to
 *
 * @private
 *
 * ```ts
 *
 *     const token = {typ: EnumToken.ColorTokenType, kin: ColorType.HEX, val: '#F00'}
 *     const result = convertColor(token, ColorType.LCH);
 *
 * ```
 */
export declare function convertColor(token: ColorToken, to: ColorType): ColorToken | null;
export declare function hex2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function rgb2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function hsl2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function hwb2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function cmyk2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function lab2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function oklab2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function lch2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function oklch2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function color2colorToken(token: ColorToken, to: ColorType): ColorToken | null;
export declare function minmax(value: number, min: number, max: number): number;
export declare function color2srgbvalues(token: ColorToken): number[] | null;
/**
 * clamp color values
 * @param token
 */
export declare function clamp(token: ColorToken): ColorToken;
export declare function getNumber(token: NumberToken | PercentageToken | IdentToken | FractionToken): number;
/**
 * convert angle to turn
 * @param token
 */
export declare function getAngle(token: NumberToken | AngleToken | IdentToken): number;
export declare function toPrecisionValue(value: number): number;
export declare function toPrecisionAngle(angle: number): number;
