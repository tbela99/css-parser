import { toZero, is2DMatrix, identity } from './utils.js';
import { EnumToken } from '../types.js';
import { reduceNumber } from '../../renderer/render.js';
import { eq } from '../../parser/utils/eq.js';
import { getNumber } from '../../syntax/color/color.js';
import '../../syntax/color/utils/constants.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';

function parseMatrix(mat) {
    if (mat.typ == EnumToken.IdenTokenType) {
        return mat.val == 'none' ? identity() : null;
    }
    const children = mat.chi.filter((t) => t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType);
    const values = [];
    for (const child of children) {
        if (child.typ != EnumToken.NumberTokenType) {
            return null;
        }
        // @ts-ignore
        values.push(getNumber(child));
    }
    // @ts-ignore
    return matrix(values);
}
// use column-major order
function matrix(values) {
    const matrix = identity();
    if (values.length === 6) {
        matrix[0][0] = values[0];
        matrix[0][1] = values[1];
        matrix[1][0] = values[2];
        matrix[1][1] = values[3];
        matrix[3][0] = values[4];
        matrix[3][1] = values[5];
    }
    else if (values.length === 16) {
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
    }
    else {
        return null;
    }
    return matrix;
}
function serialize(matrix) {
    matrix = matrix.map(t => toZero(t.slice()));
    // @ts-ignore
    if (eq(matrix, identity())) {
        return {
            typ: EnumToken.IdenTokenType,
            val: 'none'
        };
    }
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
            ].reduce((acc, t) => {
                if (acc.length > 0) {
                    acc.push({ typ: EnumToken.CommaTokenType });
                }
                acc.push({
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(t)
                });
                return acc;
            }, [])
        };
    }
    return {
        typ: EnumToken.FunctionTokenType,
        val: 'matrix3d',
        chi: matrix.flat().reduce((acc, curr) => {
            if (acc.length > 0) {
                acc.push({ typ: EnumToken.CommaTokenType });
            }
            acc.push({
                typ: EnumToken.NumberTokenType,
                val: reduceNumber(curr)
            });
            return acc;
        }, [])
    };
}

export { matrix, parseMatrix, serialize };
