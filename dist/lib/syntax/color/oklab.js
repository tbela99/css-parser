import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { color2srgbvalues, toPrecisionValue, getNumber } from './color.js';
import { srgb2lsrgbvalues, lch2srgbvalues, lab2srgbvalues, cmyk2srgbvalues, hwb2srgbvalues, hsl2srgb, rgb2srgb, hex2srgbvalues, lsrgb2srgbvalues } from './srgb.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { lchvalues2labvalues } from './lab.js';
import { getOKLCHComponents } from './oklch.js';
import '../../renderer/sourcemap/lib/encode.js';

function hex2oklabToken(token) {
    const values = hex2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function rgb2oklabToken(token) {
    const values = rgb2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function hsl2oklabToken(token) {
    const values = hsl2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function hwb2oklabToken(token) {
    const values = hwb2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function cmyk2oklabToken(token) {
    const values = cmyk2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function lab2oklabToken(token) {
    const values = lab2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function lch2oklabToken(token) {
    const values = lch2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function oklch2oklabToken(token) {
    const values = oklch2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function color2oklabToken(token) {
    const values = color2oklabvalues(token);
    if (values == null) {
        return null;
    }
    return oklabToken(values);
}
function oklabToken(values) {
    const chi = [
        { typ: EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
        { typ: EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
        { typ: EnumToken.NumberTokenType, val: toPrecisionValue(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: '/' }, {
            typ: EnumToken.PercentageTokenType,
            val: values[3] * 100
        });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'oklab',
        chi,
        kin: ColorType.OKLAB
    };
}
function hex2oklabvalues(token) {
    const values = hex2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(...values);
}
function rgb2oklabvalues(token) {
    const values = rgb2srgb(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(...values);
}
function hsl2oklabvalues(token) {
    const values = hsl2srgb(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(...values);
}
function hwb2oklabvalues(token) {
    // @ts-ignore
    return srgb2oklab(...hwb2srgbvalues(token));
}
function cmyk2oklabvalues(token) {
    const values = cmyk2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(...values);
}
function lab2oklabvalues(token) {
    const values = lab2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(...values);
}
function lch2oklabvalues(token) {
    const values = lch2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(...values);
}
function oklch2oklabvalues(token) {
    const values = getOKLCHComponents(token);
    // @ts-ignore
    return values == null ? null : lchvalues2labvalues(...values);
}
function color2oklabvalues(token) {
    const values = color2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(...values);
}
function srgb2oklab(r, g, blue, alpha) {
    [r, g, blue] = srgb2lsrgbvalues(r, g, blue);
    let L = Math.cbrt(0.41222147079999993 * r + 0.5363325363 * g + 0.0514459929 * blue);
    let M = Math.cbrt(0.2119034981999999 * r + 0.6806995450999999 * g + 0.1073969566 * blue);
    let S = Math.cbrt(0.08830246189999998 * r + 0.2817188376 * g + 0.6299787005000002 * blue);
    const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
    const a = r == g && g == blue ? 0 : 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
    const b = r == g && g == blue ? 0 : 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
    return alpha == null || alpha == 1 ? [l, a, b] : [l, a, b, alpha];
}
function getOKLABComponents(token) {
    const components = getComponents(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const a = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const b = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);
    // @ts-ignore
    let alpha = null;
    if (components.length > 3) {
        alpha = getNumber(components[3]);
    }
    const rgb = [l, a, b];
    if (alpha != 1 && alpha != null) {
        rgb.push(alpha);
    }
    return rgb;
}
function OKLab_to_XYZ(l, a, b, alpha = null) {
    // Given OKLab, convert to XYZ relative to D65
    const LMStoXYZ = [
        [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
        [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
        [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
    ];
    const OKLabtoLMS = [
        [1.0000000000000000, 0.3963377773761749, 0.2158037573099136],
        [1.0000000000000000, -0.1055613458156586, -0.0638541728258133],
        [1.0000000000000000, -0.0894841775298119, -1.2914855480194092]
    ];
    const LMSnl = multiplyMatrices(OKLabtoLMS, [l, a, b]);
    const xyz = multiplyMatrices(LMStoXYZ, LMSnl.map((c) => c ** 3));
    if (alpha != null) {
        xyz.push(alpha);
    }
    return xyz;
}
// from https://www.w3.org/TR/css-color-4/#color-conversion-code
function OKLab_to_sRGB(l, a, b) {
    let L = Math.pow(l * 0.99999999845051981432 +
        0.39633779217376785678 * a +
        0.21580375806075880339 * b, 3);
    let M = Math.pow(l * 1.0000000088817607767 -
        0.1055613423236563494 * a -
        0.063854174771705903402 * b, 3);
    let S = Math.pow(l * 1.0000000546724109177 -
        0.089484182094965759684 * a -
        1.2914855378640917399 * b, 3);
    return lsrgb2srgbvalues(
    /* r: */
    4.076741661347994 * L -
        3.307711590408193 * M +
        0.230969928729428 * S, 
    /*  g: */
    -1.2684380040921763 * L +
        2.6097574006633715 * M -
        0.3413193963102197 * S, 
    /*  b: */
    -0.004196086541837188 * L -
        0.7034186144594493 * M +
        1.7076147009309444 * S);
}

export { OKLab_to_XYZ, OKLab_to_sRGB, cmyk2oklabToken, cmyk2oklabvalues, color2oklabToken, getOKLABComponents, hex2oklabToken, hex2oklabvalues, hsl2oklabToken, hsl2oklabvalues, hwb2oklabToken, hwb2oklabvalues, lab2oklabToken, lab2oklabvalues, lch2oklabToken, lch2oklabvalues, oklch2oklabToken, oklch2oklabvalues, rgb2oklabToken, rgb2oklabvalues, srgb2oklab };
