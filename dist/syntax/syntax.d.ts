import type { ErrorDescription, Token } from "../../@types/index.d.ts";
import { type AstArena } from "../ast/arena.ts";
import { EnumToken } from "../ast/types.ts";
export declare const flexUnits: Array<string>;
export declare const frequencyUnits: Array<string>;
export declare const timeUnits: Array<string>;
export declare const angleUnits: Array<string>;
export declare const resolutionUnits: Array<string>;
export declare const dimensionUnits: Array<string>;
export declare const pseudoAliasMap: Record<string, string>;
export declare const renamedStandardProperties: Map<string, string>;
/**
 * true if the unit is a length unit
 * @param unit
 */
export declare function isLengthUnit(unit: string): boolean;
/**
 * true if the unit is a resolution unit
 * @param unit
 */
export declare function isResolutionUnit(unit: string): boolean;
/**
 * true if the unit is an angle unit
 * @param unit
 */
export declare function isAngleUnit(unit: string): boolean;
/**
 * true if the unit is a time unit
 * @param unit
 */
export declare function isTimeUnit(unit: string): boolean;
/**
 * true if the unit is a frequency unit
 * @param unit
 */
export declare function isFrequencyUnit(unit: string): boolean;
/**
 * true if the unit is a flex unit
 * @param unit
 */
export declare function isFlexUnit(unit: string): boolean;
export declare function isLength(arena: AstArena, dimension: Token): boolean;
export declare function isResolution(arena: AstArena, dimension: Token): boolean;
export declare function isAngle(arena: AstArena, dimension: Token): boolean;
export declare function isTime(arena: AstArena, dimension: Token): boolean;
export declare function isFrequency(arena: AstArena, dimension: Token): boolean;
/**
 * Reduce color stops
 * @param arena
 * @param stops
 * @returns
 */
export declare function reduceColorStops(arena: AstArena, stops: Token[]): Token[];
/**
 * Reduce background-position values.
 * @param arena
 * @param positions
 * @param position
 */
export declare function reducegradientBackgroundPosition(arena: AstArena, positions: Token[], position: string): void;
/**
 * Reduce conic-gradient color stops
 * @param arena
 * @param stops
 * @returns
 */
export declare function reduceConicColorStops(arena: AstArena, stops: Token[]): Token[];
/**
 * is rectangular orthogonal colorspace
 * @param arena
 * @param token
 * @returns
 */
export declare function isRectangularOrthogonalColorspace(arena: AstArena, token: Token): boolean;
/**
 * Is polar colorspace
 * @param arena
 * @param token
 * @returns
 */
export declare function isPolarColorspace(arena: AstArena, token: Token): boolean;
/**
 * Is ident color
 * @param arena
 * @param token
 * @returns
 */
export declare function isIdentColor(arena: AstArena, token: Token): boolean;
/**
 * true if the identifier is a color: a system color, a named color, `currentcolor` or `transparent`, ignoring the case
 * @param str
 */
export declare function isColorName(str: string): boolean;
export declare function isColor(arena: AstArena, token: Token, errors?: ErrorDescription[]): boolean;
/**
 * parse a color token: set the color type of identifiers and color functions
 * @param arena
 * @param token
 */
export declare function parseColor(arena: AstArena, token: Token): Token;
export declare function isLetter(codepoint: number): boolean;
export declare function isIdentStart(codepoint: number): boolean;
export declare function isDigit(codepoint: number): boolean;
export declare function isIdentCodepoint(codepoint: number): boolean;
export declare const isIdent: (name: string) => boolean;
export declare function isNonPrintable(codepoint: number): boolean;
export declare function isPseudo(name: string): boolean;
export declare function isHash(name: string): boolean;
export declare function isFlex(arena: AstArena, dimension: Token): boolean;
export declare function parseDimension(name: string): {
    typ: EnumToken;
    val: number;
    unit: string;
} | null;
export declare function isFunction(name: string): boolean;
export declare function isNewLine(codepoint: number): boolean;
export declare function isWhiteSpace(codepoint: number): boolean;
/**
 * Convert length to px
 * @param value
 * @returns
 */
export declare function length2Px(arena: AstArena, value: Token): number | null;
/**
 * minify number
 * @param val
 */
export declare function minifyNumber(val: string | number): string;
export declare function toPrecisionValue(value: number | string, precision?: number): number;
export declare function toPrecisionAngle(angle: number, precision?: number, correctValue?: boolean): number;
