import { EnumToken } from "../types.ts";
/**
 * fraction: numerator and denominator
 */
export type Fraction = [number, number];
export declare function gcd(x: number, y: number): number;
/**
 * compute an arithmetic operation. fractions are returned when shorter than the decimal value
 * @param a
 * @param b
 * @param op
 */
export declare function compute(a: number | Fraction, b: number | Fraction, op: EnumToken.Add | EnumToken.Sub | EnumToken.Mul | EnumToken.Div): number | Fraction;
export declare function rem(...a: number[]): number;
export declare function simplify(a: number, b: number): [number, number];
