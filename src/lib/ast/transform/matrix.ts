import { identity, is2DMatrix } from "./utils.ts";
import type { AstArena } from "../arena.ts";
import { EnumToken } from "../types.ts";
import type { Token } from "../../../@types/index.d.ts";
import { eq } from "../../parser/utils/eq.ts";
import { getNumber } from "../../syntax/color/color.ts";
import type { Matrix } from "./type.d.ts";

export function parseMatrix(arena: AstArena, mat: Token): Matrix | null {
    if (arena.dataTypes[mat] === EnumToken.IdenTokenType) {
        return arena.strings[arena.stringValue[mat]] === "none" ? identity() : null;
    }

    const children = arena.tokens(mat).filter(
        (t: Token) => arena.dataTypes[t] === EnumToken.NumberTokenType || arena.dataTypes[t] === EnumToken.IdenTokenType,
    );
    const values: number[] = [];

    for (const child of children) {
        if (arena.dataTypes[child] !== EnumToken.NumberTokenType) {
            return null;
        }

        // @ts-ignore
        values.push(getNumber(arena, child));
    }

    // @ts-ignore
    return matrix(values);
}

// use column-major order
export function matrix(
    values:
        | [number, number, number, number, number, number]
        | [
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
              number,
          ],
): Matrix | null {
    const matrix = identity();

    if (values.length === 6) {
        matrix[0] = values[0];
        matrix[1] = values[1];
        matrix[4] = values[2];
        matrix[4 + 1] = values[3];
        matrix[3 * 4] = values[4];
        matrix[3 * 4 + 1] = values[5];
    } else if (values.length === 16) {
        matrix[0] = values[0];
        matrix[1] = values[1];
        matrix[2] = values[2];
        matrix[3] = values[3];
        matrix[4] = values[4];
        matrix[4 + 1] = values[5];
        matrix[4 + 2] = values[6];
        matrix[4 + 3] = values[7];
        matrix[2 * 4] = values[8];
        matrix[2 * 4 + 1] = values[9];
        matrix[2 * 4 + 2] = values[10];
        matrix[2 * 4 + 3] = values[11];
        matrix[3 * 4] = values[12];
        matrix[3 * 4 + 1] = values[13];
        matrix[3 * 4 + 2] = values[14];
        matrix[3 * 4 + 3] = values[15];
    } else {
        return null;
    }

    return matrix;
}

export function serialize(arena: AstArena, matrix: Matrix): Token {
    matrix = matrix.slice() as Matrix;

    // @ts-ignore
    if (eq(matrix, identity())) {
        return arena.createToken(EnumToken.IdenTokenType, "none");
    }

    if (is2DMatrix(matrix)) {
        // https://drafts.csswg.org/css-transforms-2/#two-dimensional-subset
        return arena.createFunction(EnumToken.TransformFunctionTokenType, "matrix", [matrix[0], matrix[1], matrix[4], matrix[4 + 1], matrix[3 * 4], matrix[3 * 4 + 1]].reduce((acc, t) => {
                if (acc.length > 0) {
                    acc.push(arena.createToken(EnumToken.CommaTokenType));
                }

                acc.push(arena.createToken(EnumToken.NumberTokenType, t));

                return acc;
            }, [] as Token[]),
        );
    }

    return arena.createFunction(EnumToken.TransformFunctionTokenType, "matrix3d", matrix.reduce((acc: Token[], curr: number) => {
            if (acc.length > 0) {
                acc.push(arena.createToken(EnumToken.CommaTokenType));
            }

            acc.push(arena.createToken(EnumToken.NumberTokenType, curr));

            return acc;
        }, [] as Token[]),
    );
}
