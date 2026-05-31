import type { FractionToken } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
export declare function gcd(x: number, y: number): number;
export declare function compute(a: number | FractionToken, b: number | FractionToken, op: EnumToken.Add | EnumToken.Sub | EnumToken.Mul | EnumToken.Div): number | FractionToken;
export declare function rem(...a: number[]): number;
export declare function simplify(a: number, b: number): [number, number];
