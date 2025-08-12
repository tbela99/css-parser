import { is2DMatrix, identity } from './utils.js';
import { EnumToken } from '../types.js';
import { eq } from '../../parser/utils/eq.js';
import { getNumber } from '../../syntax/color/color.js';
import '../../syntax/color/utils/constants.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/sourcemap/lib/encode.js';

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
        matrix[0 * 4 + 0] = values[0];
        matrix[0 * 4 + 1] = values[1];
        matrix[1 * 4 + 0] = values[2];
        matrix[1 * 4 + 1] = values[3];
        matrix[3 * 4 + 0] = values[4];
        matrix[3 * 4 + 1] = values[5];
    }
    else if (values.length === 16) {
        matrix[0 * 4 + 0] = values[0];
        matrix[0 * 4 + 1] = values[1];
        matrix[0 * 4 + 2] = values[2];
        matrix[0 * 4 + 3] = values[3];
        matrix[1 * 4 + 0] = values[4];
        matrix[1 * 4 + 1] = values[5];
        matrix[1 * 4 + 2] = values[6];
        matrix[1 * 4 + 3] = values[7];
        matrix[2 * 4 + 0] = values[8];
        matrix[2 * 4 + 1] = values[9];
        matrix[2 * 4 + 2] = values[10];
        matrix[2 * 4 + 3] = values[11];
        matrix[3 * 4 + 0] = values[12];
        matrix[3 * 4 + 1] = values[13];
        matrix[3 * 4 + 2] = values[14];
        matrix[3 * 4 + 3] = values[15];
    }
    else {
        return null;
    }
    return matrix;
}
function serialize(matrix) {
    matrix = matrix.slice();
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
                matrix[0 * 4 + 0],
                matrix[0 * 4 + 1],
                matrix[1 * 4 + 0],
                matrix[1 * 4 + 1],
                matrix[3 * 4 + 0],
                matrix[3 * 4 + 1]
            ].reduce((acc, t) => {
                if (acc.length > 0) {
                    acc.push({ typ: EnumToken.CommaTokenType });
                }
                acc.push({
                    typ: EnumToken.NumberTokenType,
                    val: t
                });
                return acc;
            }, [])
        };
    }
    return {
        typ: EnumToken.FunctionTokenType,
        val: 'matrix3d',
        chi: matrix.reduce((acc, curr) => {
            if (acc.length > 0) {
                acc.push({ typ: EnumToken.CommaTokenType });
            }
            acc.push({
                typ: EnumToken.NumberTokenType,
                val: curr
            });
            return acc;
        }, [])
    };
}

export { matrix, parseMatrix, serialize };
