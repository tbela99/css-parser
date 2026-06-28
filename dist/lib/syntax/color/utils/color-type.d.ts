import type { ColorToken } from "../../../../@types/index.js";
import { ColorType } from "../../../ast/types.ts";
/**
 * Return the color type of the color components
 */
export declare function getColorType(color: ColorToken): ColorType | null;
