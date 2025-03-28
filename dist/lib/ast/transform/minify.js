import { decompose } from './utils.js';
import { EnumToken } from '../types.js';
import { gcd } from '../math/math.js';

function minify(matrix) {
    const decomposed = decompose(matrix);
    if (decomposed == null) {
        return null;
    }
    const transforms = new Set(['translate', 'scale', 'skew', 'perspective']);
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
    // if (transforms.size == 0) {
    //
    //     // identity
    //     return [{
    //         typ: EnumToken.FunctionTokenType,
    //         val: 'scale',
    //         chi: [
    //             {typ: EnumToken.NumberTokenType, val: '1'}
    //         ]
    //     }
    //     ];
    // }
    if (transforms.size == 1) {
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
    }
    {
        const { x, y, z, angle } = getRotation3D(matrix);
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
    // scale(x, x) -> scale(x)
    // scale(1, sy) -> scaleY(sy)
    // scale3d(1, 1, sz) -> scaleZ(sz)
    // scaleX() scale(Y) scaleZ() -> scale3d()
    // identity
    return result.length == 0 ? [
        {
            typ: EnumToken.FunctionTokenType,
            val: 'scale',
            chi: [
                { typ: EnumToken.NumberTokenType, val: '1' }
            ]
        }
    ] : result;
}
// Fonction pour calculer rotate3d à partir de matrix3d
function getRotation3D(matrix) {
    // Extraire la sous-matrice 3x3 de rotation
    const r11 = matrix[0][0], r12 = matrix[0][1], r13 = matrix[0][2];
    const r21 = matrix[1][0], r22 = matrix[1][1], r23 = matrix[1][2];
    const r31 = matrix[2][0], r32 = matrix[2][1], r33 = matrix[2][2];
    // Calculer la trace (somme des éléments diagonaux)
    const trace = r11 + r22 + r33;
    // Calculer l’angle de rotation (en radians)
    const cosTheta = (trace - 1) / 2;
    // Calculer sin(θ) avec le signe correct
    const sinThetaRaw = Math.sqrt(1 - cosTheta * cosTheta);
    const xRaw = r32 - r23; // -0.467517
    const yRaw = r13 - r31; // 0.776535
    const zRaw = r21 - r12; // 0.776535
    // Déterminer le signe de sin(θ) basé sur la direction
    const sinTheta = (xRaw < 0 && yRaw > 0 && zRaw > 0) ? -sinThetaRaw : sinThetaRaw;
    // Calculer l’angle avec atan2
    const angle = +(Math.atan2(sinTheta, cosTheta) * 180 / Math.PI).toFixed(12);
    let x, y, z;
    if (Math.abs(sinTheta) < 1e-6) { // Cas où l’angle est proche de 0° ou 180°
        const x1 = r32 - r23;
        const y1 = r13 - r31;
        const z1 = r21 - r12;
        switch (Math.max(x1, y1, z1)) {
            case x1:
                x = 1;
                y = 0;
                z = 0;
                break;
            case y1:
                x = 0;
                y = 1;
                z = 0;
                break;
            default:
                x = 0;
                y = 0;
                z = 1;
                break;
        }
    }
    else {
        x = (r32 - r23) / (2 * sinTheta);
        y = (r13 - r31) / (2 * sinTheta);
        z = (r21 - r12) / (2 * sinTheta);
    }
    // Normaliser le vecteur (optionnel, mais utile pour vérification)
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length > 0) {
        x /= length;
        y /= length;
        z /= length;
    }
    const x1 = gcd(x, gcd(y, z));
    if (x1 != 0) {
        x /= x1;
        y /= x1;
        z /= x1;
    }
    return { x, y, z, angle };
}

export { minify };
