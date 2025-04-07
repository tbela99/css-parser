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
                    val: reduceNumber(t.toPrecision(6))
                });
                return acc;
            }, [])
        };
    }
    let m = [];
    // console.error(JSON.stringify({matrix},null, 1));
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (m.length > 0) {
                m.push({ typ: EnumToken.CommaTokenType });
            }
            m.push({
                typ: EnumToken.NumberTokenType,
                val: reduceNumber(matrix[j][i].toPrecision(6))
            });
        }
    }
    return {
        typ: EnumToken.FunctionTokenType,
        val: 'matrix3d',
        chi: m
    };
}

export { serialize };
