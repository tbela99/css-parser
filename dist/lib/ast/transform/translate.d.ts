import type { Matrix } from "./type.d.ts";
export declare function translateX(x: number, from: Matrix): Matrix;
export declare function translateY(y: number, from: Matrix): Matrix;
export declare function translateZ(z: number, from: Matrix): Matrix;
export declare function translate(translate: [number] | [number, number], from: Matrix): Matrix;
export declare function translate3d(translate: [number, number, number], from: Matrix): Matrix;
