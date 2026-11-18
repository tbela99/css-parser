import { is2DMatrix, isIdentity } from "./utils.ts";
import type { AstArena } from "../arena.ts";
import { EnumToken } from "../types.ts";
import type { Token } from "../../../@types/index.d.ts";
import type { Matrix } from "./type.d.ts";

/**
 * set the values of a `matrix()` (6 values) or of a `matrix3d()` (16 values) function, column-major order. the other
 * values of a `matrix()` are the values of the identity matrix
 * @param values
 * @param count number of values: 6 or 16
 * @param matrix the matrix that receives the values
 */
export function setMatrixValues(values: ArrayLike<number>, count: number, matrix: Matrix): Matrix {
    if (count === 6) {
        matrix[0] = values[0];
        matrix[1] = values[1];
        matrix[2] = 0;
        matrix[3] = 0;
        matrix[4] = values[2];
        matrix[4 + 1] = values[3];
        matrix[4 + 2] = 0;
        matrix[4 + 3] = 0;
        matrix[2 * 4] = 0;
        matrix[2 * 4 + 1] = 0;
        matrix[2 * 4 + 2] = 1;
        matrix[2 * 4 + 3] = 0;
        matrix[3 * 4] = values[4];
        matrix[3 * 4 + 1] = values[5];
        matrix[3 * 4 + 2] = 0;
        matrix[3 * 4 + 3] = 1;
    } else {
        for (let i = 0; i < 16; i++) {
            matrix[i] = values[i];
        }
    }

    return matrix;
}

/**
 * the tokens of a matrix: `none`, `matrix()` if it is a 2d matrix, `matrix3d()` otherwise
 * @param arena
 * @param matrix
 */
export function serialize(arena: AstArena, matrix: Matrix): Token {
    if (isIdentity(matrix)) {
        return arena.createToken(EnumToken.IdenTokenType, "none");
    }

    // https://drafts.csswg.org/css-transforms-2/#two-dimensional-subset
    const is2D: boolean = is2DMatrix(matrix);
    const count: number = is2D ? 6 : 16;
    const tokens: Token[] = new Array(count * 2 - 1);

    for (let i = 0; i < count; i++) {
        if (i > 0) {
            tokens[i * 2 - 1] = arena.createToken(EnumToken.CommaTokenType);
        }

        // matrix(a, b, c, d, e, f): values 0, 1, 4, 5, 12, 13
        tokens[i * 2] = arena.createToken(
            EnumToken.NumberTokenType,
            matrix[is2D ? (i < 2 ? i : i < 4 ? i + 2 : i + 8) : i],
        );
    }

    return arena.createFunction(EnumToken.TransformFunctionTokenType, is2D ? "matrix" : "matrix3d", tokens);
}
