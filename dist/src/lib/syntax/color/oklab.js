/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { getColorComponents } from './utils/components.js';
import { multiplyMatrices } from './utils/matrix.js';
import { srgb2lsrgbvalues, lch2srgbvalues, lab2srgbvalues, cmyk2srgbvalues, hwb2srgbvalues, hsl2srgb, rgb2srgb, hex2srgbvalues, lsrgb2srgbvalues } from './srgb.js';
import { getNumber, color2srgbvalues } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { getOKLCHComponents } from './oklch.js';
import { lchvalues2labvalues } from './lab.js';

function hex2oklabToken(arena, token) {
    const values = hex2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function rgb2oklabToken(arena, token) {
    const values = rgb2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function hsl2oklabToken(arena, token) {
    const values = hsl2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function hwb2oklabToken(arena, token) {
    const values = hwb2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function cmyk2oklabToken(arena, token) {
    const values = cmyk2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function lab2oklabToken(arena, token) {
    const values = lab2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function lch2oklabToken(arena, token) {
    const values = lch2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function oklch2oklabToken(arena, token) {
    const values = oklch2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function color2oklabToken(arena, token) {
    const values = color2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklabToken(arena, values);
}
function oklabToken(arena, values) {
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];
    if (values.length == 4 && values[3] != 1) {
        chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"), arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    return arena.createColor("oklab", ColorType.OKLAB, chi);
}
function hex2oklabvalues(arena, token) {
    const values = hex2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(values[0], values[1], values[2], values[3]);
}
function rgb2oklabvalues(arena, token) {
    const values = rgb2srgb(arena, token);
    if (values == null) {
        return null;
    }
    return srgb2oklab(values[0], values[1], values[2], values[3]);
}
function hsl2oklabvalues(arena, token) {
    const values = hsl2srgb(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(values[0], values[1], values[2], values[3]);
}
function hwb2oklabvalues(arena, token) {
    const values = hwb2srgbvalues(arena, token);
    return values == null ? null : srgb2oklab(values[0], values[1], values[2], values[3]);
}
function cmyk2oklabvalues(arena, token) {
    const values = cmyk2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(values[0], values[1], values[2], values[3]);
}
function lab2oklabvalues(arena, token) {
    const values = lab2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(values[0], values[1], values[2], values[3]);
}
function lch2oklabvalues(arena, token) {
    const values = lch2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(values[0], values[1], values[2], values[3]);
}
function oklch2oklabvalues(arena, token) {
    const values = getOKLCHComponents(arena, token);
    // @ts-ignore
    return values == null ? null : lchvalues2labvalues(values[0], values[1], values[2], values[3]);
}
function color2oklabvalues(arena, token) {
    const values = color2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(values[0], values[1], values[2], values[3]);
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
function getOKLABComponents(arena, token) {
    const components = getColorComponents(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(arena, t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const a = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 0.4 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const b = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 0.4 : 1);
    // @ts-ignore
    let alpha = null;
    if (components.length > 3) {
        alpha = getNumber(arena, components[3]);
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
        [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
        [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
    ];
    const OKLabtoLMS = [
        [1.0, 0.3963377773761749, 0.2158037573099136],
        [1.0, -0.1055613458156586, -0.0638541728258133],
        [1.0, -0.0894841775298119, -1.2914855480194092],
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
    let L = Math.pow(l * 0.99999999845051981432 + 0.39633779217376785678 * a + 0.21580375806075880339 * b, 3);
    let M = Math.pow(l * 1.0000000088817607767 - 0.1055613423236563494 * a - 0.063854174771705903402 * b, 3);
    let S = Math.pow(l * 1.0000000546724109177 - 0.089484182094965759684 * a - 1.2914855378640917399 * b, 3);
    return lsrgb2srgbvalues(
    /* r: */
    4.076741661347994 * L - 3.307711590408193 * M + 0.230969928729428 * S, 
    /*  g: */
    -1.2684380040921763 * L + 2.6097574006633715 * M - 0.3413193963102197 * S, 
    /*  b: */
    -0.004196086541837188 * L - 0.7034186144594493 * M + 1.7076147009309444 * S);
}

export { OKLab_to_XYZ, OKLab_to_sRGB, cmyk2oklabToken, cmyk2oklabvalues, color2oklabToken, getOKLABComponents, hex2oklabToken, hex2oklabvalues, hsl2oklabToken, hsl2oklabvalues, hwb2oklabToken, hwb2oklabvalues, lab2oklabToken, lab2oklabvalues, lch2oklabToken, lch2oklabvalues, oklch2oklabToken, oklch2oklabvalues, rgb2oklabToken, rgb2oklabvalues, srgb2oklab };
