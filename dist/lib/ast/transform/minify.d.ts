import type { FunctionToken, Token } from "../../../@types/index.d.ts";
import type { Matrix } from "./type.d.ts";
export declare function minify(matrix: Matrix): Token[] | null;
export declare function eqMatrix(a: FunctionToken | Matrix, b: Token[]): boolean;
export declare function minifyTransformFunctions(transform: FunctionToken): FunctionToken;
