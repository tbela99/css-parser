import { decompose, identity } from './utils.js';
import { EnumToken } from '../types.js';
import { eq } from '../../parser/utils/eq.js';

function minify(matrix) {
    const decomposed = decompose(matrix);
    // console.error({decomposed});
    if (decomposed == null) {
        return null;
    }
    const transforms = new Set([
        'translate', 'scale', 'skew', 'perspective', 'rotate'
    ]);
    const scales = new Set(['x', 'y', 'z']);
    const result = [];
    // check identity
    if (decomposed.translate[0] == 0 && decomposed.translate[1] == 0 && decomposed.translate[2] == 0) {
        transforms.delete('translate');
    }
    if (decomposed.scale[0] == 1 && decomposed.scale[1] == 1 && decomposed.scale[2] == 1) {
        transforms.delete('scale');
    }
    if (decomposed.skew[0] == 0 && decomposed.skew[1] == 0 && decomposed.skew[2] == 0) {
        transforms.delete('skew');
    }
    if (decomposed.perspective[0] == 0 && decomposed.perspective[1] == 0 && decomposed.perspective[2] == 0 && decomposed.perspective[3] == 1) {
        transforms.delete('perspective');
    }
    if (decomposed.rotate[3] == 0) {
        transforms.delete('rotate');
    }
    if (transforms.has('translate')) {
        let coordinates = new Set(['x', 'y', 'z']);
        for (let i = 0; i < 3; i++) {
            if (decomposed.translate[i] == 0) {
                coordinates.delete(i == 0 ? 'x' : i == 1 ? 'y' : 'z');
            }
        }
        if (coordinates.size == 3) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'translate',
                chi: [
                    { typ: EnumToken.LengthTokenType, val: decomposed.translate[0] + '', unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.LengthTokenType, val: decomposed.translate[1] + '', unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.LengthTokenType, val: decomposed.translate[2] + '', unit: 'px' }
                ]
            });
        }
        else if (coordinates.size == 1) {
            if (coordinates.has('x')) {
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'translate',
                    chi: [{ typ: EnumToken.LengthTokenType, val: decomposed.translate[0] + '', unit: 'px' }]
                });
            }
            else {
                let axis = coordinates.has('y') ? 'y' : 'z';
                let index = axis == 'y' ? 1 : 2;
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'translate' + axis.toUpperCase(),
                    chi: [{ typ: EnumToken.LengthTokenType, val: decomposed.translate[index] + '', unit: 'px' }]
                });
            }
        }
        else if (coordinates.has('z')) {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'translate',
                chi: [
                    decomposed.translate[0] == 0 ? {
                        typ: EnumToken.NumberTokenType,
                        'val': '0'
                    } : { typ: EnumToken.LengthTokenType, val: decomposed.translate[0] + '', unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    decomposed.translate[1] == 0 ? {
                        typ: EnumToken.NumberTokenType,
                        'val': '0'
                    } : { typ: EnumToken.LengthTokenType, val: decomposed.translate[1] + '', unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    { typ: EnumToken.LengthTokenType, val: decomposed.translate[2] + '', unit: 'px' }
                ]
            });
        }
        else {
            result.push({
                typ: EnumToken.FunctionTokenType,
                val: 'translate',
                chi: [
                    decomposed.translate[0] == 0 ? {
                        typ: EnumToken.NumberTokenType,
                        'val': '0'
                    } : { typ: EnumToken.LengthTokenType, val: decomposed.translate[0] + '', unit: 'px' },
                    { typ: EnumToken.CommaTokenType },
                    decomposed.translate[1] == 0 ? {
                        typ: EnumToken.NumberTokenType,
                        'val': '0'
                    } : { typ: EnumToken.LengthTokenType, val: decomposed.translate[1] + '', unit: 'px' }
                ]
            });
        }
    }
    // scale(x, x) -> scale(x)
    // scale(1, sy) -> scaleY(sy)
    // scale3d(1, 1, sz) -> scaleZ(sz)
    // scaleX() scale(Y) scaleZ() -> scale3d()
    if (transforms.has('scale')) {
        const [sx, sy, sz] = decomposed.scale;
        if (!(sx == 1 && sy == 1 && sz == 1)) {
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
                        { typ: EnumToken.NumberTokenType, val: '' + (prefix == 'Z' ? sz : prefix == 'Y' ? sy : sx) }
                    ]
                });
            }
            else if (!scales.has('z')) {
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'scale',
                    chi: [
                        { typ: EnumToken.NumberTokenType, val: '' + sx },
                        { typ: EnumToken.WhitespaceTokenType },
                        { typ: EnumToken.NumberTokenType, val: '' + sy },
                    ]
                });
            }
            else {
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'scale3d',
                    chi: [
                        { typ: EnumToken.NumberTokenType, val: '' + sx },
                        { typ: EnumToken.CommaTokenType },
                        { typ: EnumToken.NumberTokenType, val: '' + sy },
                        { typ: EnumToken.CommaTokenType },
                        { typ: EnumToken.NumberTokenType, val: '' + sz }
                    ]
                });
            }
        }
    }
    if (transforms.has('rotate')) {
        const [x, y, z, angle] = decomposed.rotate;
        // console.error({x, y, z, angle});
        if (angle != 0 && !(x == 0 && y == 0 && z == 0)) {
            if (y == 0 && z == 0) {
                result.push({
                    typ: EnumToken.FunctionTokenType,
                    val: 'rotateX',
                    chi: [
                        {
                            typ: EnumToken.AngleTokenType,
                            val: '' + angle,
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
                            val: '' + angle,
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
                            val: '' + angle,
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
                            val: '' + x
                        },
                        { typ: EnumToken.CommaTokenType },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: '' + y
                        },
                        { typ: EnumToken.CommaTokenType },
                        {
                            typ: EnumToken.NumberTokenType,
                            val: '' + z
                        },
                        { typ: EnumToken.CommaTokenType },
                        {
                            typ: EnumToken.AngleTokenType,
                            val: '' + angle,
                            unit: 'deg'
                        }
                    ]
                });
            }
        }
    }
    // identity
    return transforms.size > 1 ? null : result.length == 0 || eq(result, identity()) ? [
        {
            typ: EnumToken.IdenTokenType,
            val: 'none'
        }
    ] : result;
}

export { minify };
