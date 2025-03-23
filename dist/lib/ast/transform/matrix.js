import { is2DMatrix } from './utils.js';
import { EnumToken } from '../types.js';
import { reduceNumber } from '../../renderer/render.js';

function serialize(matrix) {
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
        chi: matrix[0].concat(matrix[1]).concat(matrix[2]).concat(matrix[3]).reduce((acc, t) => {
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

export { serialize };
