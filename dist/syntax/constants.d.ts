import { EnumToken } from "../ast/types.ts";
/**
 * Used by the validation parser
 */
export declare const LOC: unique symbol;
/**
 * the units of the validation data, in their canonical spelling (`Hz`, `Q`, `dB`)
 */
export declare const validationUnits: string[];
export declare const regMatchLinearGradient: RegExp;
export declare const regMatchRadialGradient: RegExp;
export declare const mFLT: Set<EnumToken>;
export declare const mFGT: Set<EnumToken>;
export declare const tokensMap: Map<EnumToken, EnumToken>;
export declare const urlTokenMatcher: RegExp;
export declare const tokensfuncDefMap: Map<EnumToken, EnumToken>;
export declare const tokensfuncSet: Set<EnumToken>;
/**
 * true if the token type is a function definition (`name(`), like `tokensfuncDefMap.has(type)`
 * @param type
 */
export declare function isFunctionDefType(type: EnumToken | null | undefined): boolean;
/**
 * true if the token type is a function, like `tokensfuncSet.has(type)`
 * @param type
 */
export declare function isFunctionType(type: EnumToken | null | undefined): boolean;
/**
 * Epsilon
 */
export declare const epsilon = 0.00001;
/**
 * Color distance precision
 */
export declare const colorDistancePrecision = 0.00001;
/**
 * Color precision
 */
export declare const colorPrecision = 6;
/**
 * Angle precision
 */
export declare const anglePrecision = 3;
/**
 * Color range definitions
 */
export declare const colorRange: {
    rgb: {
        r: number[];
        g: number[];
        b: number[];
    };
    lab: {
        l: number[];
        a: number[];
        b: number[];
    };
    lch: {
        l: number[];
        c: number[];
        h: number[];
    };
    oklab: {
        l: number[];
        a: number[];
        b: number[];
    };
    oklch: {
        l: number[];
        a: number[];
        b: number[];
    };
};
export declare const pseudoElements: string[];
export declare const wildCardFuncs: string[];
export declare const mathFuncs: string[];
export declare const mediaTypes: string[];
export declare const pageMarginBoxType: Set<string>;
export declare const urlFunc: string[];
export declare const timelineFunc: string[];
export declare const gridTemplateFunc: string[];
export declare const supportFunc: string[];
export declare const whenElseFunc: string[];
export declare const containerFunc: string[];
export declare const timingFunc: string[];
export declare const colorsFunc: string[];
export declare const imageFunc: string[];
export declare const transformFunctions: string[];
export declare const funcLike: EnumToken[];
export declare const colorFuncColorSpace: string[];
export declare const D50: number[];
export declare const k: number;
export declare const e: number;
export declare const nonStandardColors: Set<string>;
export declare const systemColors: Set<string>;
export declare const deprecatedSystemColors: Set<string>;
export declare const COLORS_NAMES: {
    [key: string]: string;
};
export declare const NAMES_COLORS: {
    [key: string]: string;
};
export declare const trimTokenSpace: Set<EnumToken>;
export declare const combinators: string[];
