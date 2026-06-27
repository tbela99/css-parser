import { EnumToken } from "../ast/types.ts";
export declare const regMatchLinearGradient: RegExp;
export declare const regMatchRadialGradient: RegExp;
export declare const mFLT: Set<EnumToken>;
export declare const mFGT: Set<EnumToken>;
export declare const tokensMap: Map<EnumToken, EnumToken>;
export declare const urlTokenMatcher: RegExp;
export declare const tokensfuncDefMap: Map<EnumToken, EnumToken>;
export declare const tokensfuncSet: Set<EnumToken>;
export declare const colorPrecision = 6;
export declare const anglePrecision = 0.001;
export declare const colorRange: {
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
export declare const wildCardFuncs: string[];
export declare const mathFuncs: string[];
export declare const mediaTypes: string[];
export declare const pageMarginBoxType: Set<string>;
export declare const urlFunc: string[];
export declare const timelineFunc: string[];
export declare const gridTemplateFunc: string[];
export declare const generalEnclosedFunc: string[];
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
export declare const definedPropertySettings: {
    configurable: boolean;
    enumerable: boolean;
    writable: boolean;
};
export declare const combinators: string[];
