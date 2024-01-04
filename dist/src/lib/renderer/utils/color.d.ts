import { AngleToken, ColorToken, NumberToken } from "../../../@types";
export declare const COLORS_NAMES: {
    [key: string]: string;
};
export declare const NAMES_COLORS: {
    [key: string]: string;
};
export declare function rgb2Hex(token: ColorToken): string;
export declare function hsl2Hex(token: ColorToken): string;
export declare function hwb2hex(token: ColorToken): string;
export declare function cmyk2hex(token: ColorToken): string;
export declare function getAngle(token: NumberToken | AngleToken): number;
