import { decompose } from './utils.js';
import { EnumToken } from '../types.js';

function minify(matrix) {
    const decomposed = decompose(matrix);
    if (decomposed == null) {
        return null;
    }
    const transforms = new Set(['translate', 'scale', 'skew', 'perspective']);
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
    if (transforms.size == 0) {
        // identity
        return [{
                typ: EnumToken.FunctionTokenType,
                val: 'scale',
                chi: [
                    { typ: EnumToken.NumberTokenType, val: '1' }
                ]
            }
        ];
    }
    if (transforms.size == 1) {
        if (transforms.has('translate')) {
            let coordinates = new Set(['x', 'y', 'z']);
            for (let i = 0; i < 3; i++) {
                if (decomposed.translate[i] == 0) {
                    coordinates.delete(i == 0 ? 'x' : i == 1 ? 'y' : 'z');
                }
            }
            if (coordinates.size == 3) {
                return [{
                        typ: EnumToken.FunctionTokenType,
                        val: 'translate',
                        chi: [
                            { typ: EnumToken.LengthTokenType, val: decomposed.translate[0] + '', unit: 'px' },
                            { typ: EnumToken.CommaTokenType },
                            { typ: EnumToken.LengthTokenType, val: decomposed.translate[1] + '', unit: 'px' },
                            { typ: EnumToken.CommaTokenType },
                            { typ: EnumToken.LengthTokenType, val: decomposed.translate[2] + '', unit: 'px' }
                        ]
                    }];
            }
            if (coordinates.size == 1) {
                if (coordinates.has('x')) {
                    return [{
                            typ: EnumToken.FunctionTokenType,
                            val: 'translate',
                            chi: [{ typ: EnumToken.LengthTokenType, val: decomposed.translate[0] + '', unit: 'px' }]
                        }];
                }
                let axis = coordinates.has('y') ? 'y' : 'z';
                let index = axis == 'y' ? 1 : 2;
                return [{
                        typ: EnumToken.FunctionTokenType,
                        val: 'translate' + axis.toUpperCase(),
                        chi: [{ typ: EnumToken.LengthTokenType, val: decomposed.translate[index] + '', unit: 'px' }]
                    }];
            }
            if (coordinates.has('z')) {
                return [{
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
                    }];
            }
            return [{
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
                }];
        }
    }
    return null;
}

export { minify };
