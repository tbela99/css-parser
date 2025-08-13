import { multiply, identity, epsilon, decompose, round, toZero } from './utils.js';
import { EnumToken } from '../types.js';
import { computeMatrix } from './compute.js';
import { parseMatrix } from './matrix.js';

// translate → rotate → skew → scale
function minify(matrix) {
    const decomposed = decompose(matrix);
    if (decomposed == null) {
        return null;
    }
    const transforms = new Set(['translate', 'scale', 'skew', 'perspective', 'rotate']);
    const scales = new Set(['x', 'y', 'z']);
    const skew = new Set(['x', 'y']);
    let result = [];
    // check identity
    if (round(decomposed.translate[0]) == 0 && round(decomposed.translate[1]) == 0 && round(decomposed.translate[2]) == 0) {
        transforms.delete('translate');
    }
    if (round(decomposed.scale[0]) == 1 && round(decomposed.scale[1]) == 1 && round(decomposed.scale[2]) == 1) {
        transforms.delete('scale');
    }
    if (round(decomposed.skew[0]) == 0 && round(decomposed.skew[1]) == 0) {
        transforms.delete('skew');
    }
    if (round(decomposed.perspective[2]) == 0) {
        transforms.delete('perspective');
    }
    if (round(decomposed.rotate[3]) == 0) {
        transforms.delete('rotate');
    }
    if (transforms.has('translate')) {
        let coordinates = new Set(['x', 'y', 'z']);
        for (let i = 0; i < 3; i++) {
            if (round(decomposed.translate[i]) == 0) {
                coordinates.delete(i == 0 ? 'x' : i == 1 ? 'y' : 'z');
            }
        }
        if (coordinates.size == 1) {
            if (coordinates.has('x')) {
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'translate',
                    chi: [{ typ: EnumToken.LengthTokenType, val: round(decomposed.translate[0]), unit: 'px' }]
                });
            }
            else {
                let axis = coordinates.has('y') ? 'y' : 'z';
                let index = axis == 'y' ? 1 : 2;
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'translate' + axis.toUpperCase(),
                    chi: [{ typ: EnumToken.LengthTokenType, val: round(decomposed.translate[index]), unit: 'px' }]
                });
            }
        }
        else if (coordinates.has('z')) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'translate3d',
                chi: [
                    decomposed.translate[0] == 0 ? {
                        typ: EnumToken.NumberTokenType,
                        val: 0
                    } : { typ: EnumToken.LengthTokenType, val: round(decomposed.translate[0]), unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    decomposed.translate[1] == 0 ? {
                        typ: EnumToken.NumberTokenType,
                        val: 0
                    } : { typ: EnumToken.LengthTokenType, val: round(decomposed.translate[1]), unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.LengthTokenType, val: round(decomposed.translate[2]), unit: 'px' }
                ]
            });
        }
        else {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'translate',
                chi: [
                    { typ: EnumToken.LengthTokenType, val: round(decomposed.translate[0]), unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.LengthTokenType, val: round(decomposed.translate[1]), unit: 'px' }
                ]
            });
        }
    }
    if (transforms.has('rotate')) {
        const [x, y, z, angle] = decomposed.rotate;
        if (y == 0 && z == 0) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'rotateX',
                chi: [
                    {
                        typ: EnumToken.AngleTokenType,
                        val: round(angle),
                        unit: 'deg'
                    }
                ]
            });
        }
        else if (x == 0 && z == 0) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'rotateY',
                chi: [
                    {
                        typ: EnumToken.AngleTokenType,
                        val: round(angle),
                        unit: 'deg'
                    }
                ]
            });
        }
        else if (x == 0 && y == 0) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'rotate',
                chi: [
                    {
                        typ: EnumToken.AngleTokenType,
                        val: round(angle),
                        unit: 'deg'
                    }
                ]
            });
        }
        else {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'rotate3d',
                chi: [
                    {
                        typ: EnumToken.NumberTokenType,
                        val: round(x)
                    },
                    { typ: EnumToken.CommaTokenType },
                    {
                        typ: EnumToken.NumberTokenType,
                        val: round(y)
                    },
                    { typ: EnumToken.CommaTokenType },
                    {
                        typ: EnumToken.NumberTokenType,
                        val: round(z)
                    },
                    { typ: EnumToken.CommaTokenType },
                    {
                        typ: EnumToken.AngleTokenType,
                        val: round(angle),
                        unit: 'deg'
                    }
                ]
            });
        }
    }
    if (transforms.has('skew')) {
        // if (round(decomposed.skew[0]) == 0) {
        //
        //     skew.delete('x');
        // }
        if (round(decomposed.skew[1]) == 0) {
            skew.delete('y');
        }
        for (let i = 0; i < 2; i++) {
            decomposed.skew[i] = round(Math.atan(decomposed.skew[i]) * 180 / Math.PI);
        }
        if (skew.size == 1) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'skew' + (skew.has('x') ? '' : 'Y'),
                chi: [
                    { typ: EnumToken.AngleTokenType, val: round(decomposed.skew[0]), unit: 'deg' }
                ]
            });
        }
        else {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'skew',
                chi: [
                    { typ: EnumToken.AngleTokenType, val: round(decomposed.skew[0]), unit: 'deg' },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.AngleTokenType, val: round(decomposed.skew[1]), unit: 'deg' }
                ]
            });
        }
    }
    if (transforms.has('scale')) {
        const [sx, sy, sz] = toZero(decomposed.scale);
        if (sz == 1) {
            scales.delete('z');
        }
        if (sy == 1) {
            scales.delete('y');
        }
        if (sx == 1) {
            scales.delete('x');
        }
        if (scales.size == 1) {
            let prefix = scales.has('x') ? '' : scales.has('y') ? 'Y' : 'Z';
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'scale' + prefix,
                chi: [
                    { typ: EnumToken.NumberTokenType, val: round(prefix == 'Z' ? sz : prefix == 'Y' ? sy : sx) }
                ]
            });
        }
        else if (!scales.has('z')) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'scale',
                chi: [
                    { typ: EnumToken.NumberTokenType, val: round(sx) },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.NumberTokenType, val: round(sy) },
                ]
            });
        }
        else {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'scale3d',
                chi: [
                    { typ: EnumToken.NumberTokenType, val: round(sx) },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.NumberTokenType, val: round(sy) },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.NumberTokenType, val: round(sz) }
                ]
            });
        }
    }
    // identity
    return result.length == 0 || (result.length == 1 && eqMatrix(identity(), result)) ? [
        {
            typ: EnumToken.IdenTokenType,
            val: 'none'
        }
    ] : result;
}
function eqMatrix(a, b) {
    // console.error(JSON.stringify({a, b}, null, 1));
    let mat = identity();
    let tmp = identity();
    // @ts-ignore
    const data = (Array.isArray(a) ? a : parseMatrix(a));
    // toZero(data);
    // console.error({data});
    for (const transform of b) {
        tmp = computeMatrix([transform], identity());
        if (tmp == null) {
            return false;
        }
        mat = multiply(mat, tmp);
    }
    // toZero(mat);
    // console.error({mat});
    if (mat == null) {
        return false;
    }
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (Math.abs(mat[i * 4 + j] - data[i * 4 + j]) > epsilon) {
                return false;
            }
        }
    }
    return true;
}

export { eqMatrix, minify };
