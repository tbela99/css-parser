import { FractionToken } from "../../../../@types";
import { EnumToken } from "../../types";
export declare const gcd: (x: number, y: number) => number;
export declare function compute(a: number | FractionToken, b: number | FractionToken, op: EnumToken.Add | EnumToken.Sub | EnumToken.Mul | EnumToken.Div): number | FractionToken;
export declare function simplify(a: number, b: number): [number, number];
