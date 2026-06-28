import type { BinaryExpressionToken, ColorToken, FunctionToken, ParensToken, Token } from "../../../@types/index.d.ts";
type RGBKeyType = "r" | "g" | "b" | "alpha";
type HSLKeyType = "h" | "s" | "l" | "alpha";
type HWBKeyType = "h" | "w" | "b" | "alpha";
type LABKeyType = "l" | "a" | "b" | "alpha";
type OKLABKeyType = "l" | "a" | "b" | "alpha";
type XYZKeyType = "x" | "y" | "z" | "alpha";
type LCHKeyType = "l" | "c" | "h" | "alpha";
type OKLCHKeyType = "l" | "c" | "h" | "alpha";
export type RelativeColorTypes = RGBKeyType | HSLKeyType | HWBKeyType | LABKeyType | OKLABKeyType | LCHKeyType | OKLCHKeyType | XYZKeyType;
/**
 * Parse relative color components
 * @param relativeKeys
 * @param original
 * @param rExp
 * @param gExp
 * @param bExp
 * @param aExp
 * @returns
 */
export declare function parseRelativeColorComponents(relativeKeys: string, original: ColorToken, rExp: Token, gExp: Token, bExp: Token, aExp: Token | null): Record<RelativeColorTypes, Token> | null;
export declare function replaceValue(parent: FunctionToken | ParensToken | BinaryExpressionToken, value: Token, newValue: Token): void;
export {};
