import type { DecomposedMatrix3D, Matrix } from "./type.d.ts";
export declare const epsilon = 0.00001;
export declare function identity(): Matrix;
export declare function multiply(matrixA: Matrix, matrixB: Matrix): Matrix;
export declare function round(number: number): number;
export declare function decompose(original: Matrix): DecomposedMatrix3D | null;
export declare function toZero(v: number[]): number[];
export declare function toZero(v: Matrix): Matrix;
export declare function is2DMatrix(matrix: Matrix): boolean;
