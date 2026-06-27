import type { FunctionToken, IdentToken, Token } from "../../../@types/index.d.ts";
import type { Matrix } from "./type.d.ts";
export declare function parseMatrix(mat: FunctionToken | IdentToken): Matrix | null;
export declare function matrix(values: [number, number, number, number, number, number] | [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
]): Matrix | null;
export declare function serialize(matrix: Matrix): Token;
