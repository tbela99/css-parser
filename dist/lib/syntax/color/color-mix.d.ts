import type { ColorToken, IdentToken, NumberToken, PercentageToken } from "../../../@types/index.d.ts";
export declare function colorMix(colorSpace: IdentToken, hueInterpolationMethod: IdentToken | null, color1: ColorToken, percentage1: PercentageToken | NumberToken | null, color2: ColorToken, percentage2: PercentageToken | NumberToken | null): ColorToken | null;
