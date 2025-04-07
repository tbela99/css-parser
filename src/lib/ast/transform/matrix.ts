import {identity, is2DMatrix, Matrix} from "./utils.ts";
import {EnumToken} from "../types.ts";
import type {Token} from "../../../@types/index.d.ts";
import {reduceNumber} from "../../renderer/render.ts";

export function matrix(values: [number, number, number, number, number, number] | [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]): Matrix | null {

    const matrix = identity();

    if (values.length === 6) {

        matrix[0][0] = values[0];
        matrix[0][1] = values[1];
        matrix[1][0] = values[2];
        matrix[1][1] = values[3];
        matrix[3][0] = values[4];
        matrix[3][1] = values[5];
    } else if (values.length === 16) {

        matrix[0][0] = values[0];
        matrix[0][1] = values[1];
        matrix[0][2] = values[2];
        matrix[0][3] = values[3];
        matrix[1][0] = values[4];
        matrix[1][1] = values[5];
        matrix[1][2] = values[6];
        matrix[1][3] = values[7];
        matrix[2][0] = values[8];
        matrix[2][1] = values[9];
        matrix[2][2] = values[10];
        matrix[2][3] = values[11];
        matrix[3][0] = values[12];
        matrix[3][1] = values[13];
        matrix[3][2] = values[14];
        matrix[3][3] = values[15];
    } else {

        throw new RangeError('expecting 6 or 16 values');
    }

    return matrix;
}

export function serialize(matrix: Matrix): Token {

    if (is2DMatrix(matrix)) {

        // https://drafts.csswg.org/css-transforms-2/#two-dimensional-subset
        return {
            typ: EnumToken.FunctionTokenType,
            val: 'matrix',
            chi: [
                matrix[0][0],
                matrix[0][1],
                matrix[1][0],
                matrix[1][1],
                matrix[3][0],
                matrix[3][1]
                ].reduce((acc,t) => {

                    if (acc.length > 0) {

                        acc.push({ typ: EnumToken.CommaTokenType });
                    }

                    acc.push({
                        typ: EnumToken.NumberTokenType,
                        val: reduceNumber(t.toPrecision(6))
                    })

                    return acc
            }, [] as Token[])
        }
    }

    let m: Token[] = [];

    // console.error(JSON.stringify({matrix},null, 1));

    for (let i = 0; i < matrix.length; i++) {

        for (let j = 0; j < matrix[i].length; j ++) {

            if (m.length > 0) {

                m.push({typ: EnumToken.CommaTokenType})
            }

            m.push({
                typ: EnumToken.NumberTokenType,
                val: reduceNumber(matrix[j][i].toPrecision(6))
            })
        }
    }


    return {
        typ: EnumToken.FunctionTokenType,
        val: 'matrix3d',
        chi: m
    }
}
