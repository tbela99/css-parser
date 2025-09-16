import type {Matrix} from "./utils.ts";
import {identity, is2DMatrix} from "./utils.ts";
import {EnumToken} from "../types.ts";
import type {FunctionToken, IdentToken, Token} from "../../../@types/index.d.ts";
import {eq} from "../../parser/utils/eq.ts";
import {getNumber} from "../../syntax/color/index.ts";
import type {NumberToken} from "../../validation/index.ts";

export function parseMatrix(mat: FunctionToken | IdentToken): Matrix | null {

    if (mat.typ == EnumToken.IdenTokenType) {

        return mat.val == 'none' ? identity() : null;
    }

    const children = (mat as FunctionToken).chi.filter((t: Token) => t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType);
    const values: number[] = [];

    for (const child of children) {

        if (child.typ != EnumToken.NumberTokenType) {

            return null;
        }

        // @ts-ignore
        values.push(getNumber(child as NumberToken));
    }

    // @ts-ignore
    return matrix(values);
}

// use column-major order
export function matrix(values: [number, number, number, number, number, number] | [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]): Matrix | null {

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

export function serialize(matrix: Matrix): Token {

    matrix = matrix.slice() as Matrix;

    // @ts-ignore
    if (eq(matrix, identity())) {

        return {
            typ: EnumToken.IdenTokenType,
            val: 'none'
        }
    }

    if (is2DMatrix(matrix)) {

        // https://drafts.csswg.org/css-transforms-2/#two-dimensional-subset
        return {
            typ: EnumToken.FunctionTokenType,
            val: 'matrix',
            chi: [
                matrix[0],
                matrix[1],
                matrix[4],
                matrix[4 + 1],
                matrix[3 * 4],
                matrix[3 * 4 + 1]
            ].reduce((acc, t) => {

                if (acc.length > 0) {

                    acc.push({typ: EnumToken.CommaTokenType});
                }

                acc.push({
                    typ: EnumToken.NumberTokenType,
                    val: t
                })

                return acc
            }, [] as Token[])
        }
    }

    return {
        typ: EnumToken.FunctionTokenType,
        val: 'matrix3d',
        chi: matrix.reduce((acc: Token[], curr: number) => {

            if (acc.length > 0) {

                acc.push({typ: EnumToken.CommaTokenType});
            }

            acc.push({
                typ: EnumToken.NumberTokenType,
                val: curr
            })

            return acc;
        }, [] as Token[])
    }
}
