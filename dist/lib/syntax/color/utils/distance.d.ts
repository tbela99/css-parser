import type { ColorToken } from "../../../../@types/index.d.ts";
/**
 * Calculate the distance between two okLab colors.
 * @param okLab1
 * @param okLab2
 *
 * @private
 */
export declare function okLabDistance(okLab1: [number, number, number], okLab2: [number, number, number]): number;
/**
 * Check if two colors are close in okLab space.
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
export declare function isOkLabClose(color1: ColorToken, color2: ColorToken, threshold?: number): boolean;
