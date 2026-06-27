import type { Token } from "../../../@types/token.d.ts";
import type { Matrix } from "./type.d.ts";
export declare function compute(transformLists: Token[]): {
    matrix: Token;
    cumulative: Token[];
    minified: Token[];
} | null;
export declare function computeMatrix(transformList: Token[], matrixVar: Matrix): Matrix | null;
