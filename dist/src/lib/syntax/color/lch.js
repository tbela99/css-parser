/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { getColorComponents } from './utils/components.js';
import { color2srgbvalues, getNumber, getAngle } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { srgb2labvalues, xyz2lab, oklch2labvalues, oklab2labvalues, getLABComponents, hwb2labvalues, hsl2labvalues, rgb2labvalues, hex2labvalues } from './lab.js';
import { cmyk2srgbvalues } from './srgb.js';

function hex2lchToken(arena, token) {
    const values = hex2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function rgb2lchToken(arena, token) {
    const values = rgb2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function hsl2lchToken(arena, token) {
    const values = hsl2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function hwb2lchToken(arena, token) {
    const values = hwb2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function cmyk2lchToken(arena, token) {
    const values = cmyk2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function lab2lchToken(arena, token) {
    const values = lab2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function oklab2lchToken(arena, token) {
    const values = oklab2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function oklch2lchToken(arena, token) {
    const values = oklch2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function color2lchToken(arena, token) {
    const values = color2lchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return lchToken(arena, values);
}
function lchToken(arena, values) {
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];
    if (values.length == 4) {
        chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"), arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    return arena.createColor("lch", ColorType.LCH, chi);
}
function hex2lchvalues(arena, token) {
    const values = hex2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function rgb2lchvalues(arena, token) {
    const values = rgb2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function hsl2lchvalues(arena, token) {
    const values = hsl2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function hwb2lchvalues(arena, token) {
    const values = hwb2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function lab2lchvalues(arena, token) {
    const values = getLABComponents(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function srgb2lch(r, g, blue, alpha) {
    let values = srgb2labvalues(r, g, blue, alpha);
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function oklab2lchvalues(arena, token) {
    const values = oklab2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function cmyk2lchvalues(arena, token) {
    const values = cmyk2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2lch(values[0], values[1], values[2], values[3]);
}
function oklch2lchvalues(arena, token) {
    const values = oklch2labvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function color2lchvalues(arena, token) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2lch(values[0], values[1], values[2], values[3]);
}
function labvalues2lchvalues(l, a, b, alpha = null) {
    let c = Math.sqrt(a * a + b * b);
    let h = (Math.atan2(b, a) * 180) / Math.PI;
    if (h < 0) {
        h += 360;
    }
    if (c < 0.0001) {
        c = h = 0;
    }
    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}
function xyz2lchvalues(x, y, z, alpha) {
    const values = xyz2lab(x, y, z);
    const lch = labvalues2lchvalues(values[0], values[1], values[2]);
    return alpha == null || alpha == 1 ? lch : lch.concat(alpha);
}
function getLCHComponents(arena, token) {
    const components = getColorComponents(arena, token);
    if (components == null) {
        return null;
    }
    for (let i = 0; i < components.length; i++) {
        if (![
            EnumToken.NumberTokenType,
            EnumToken.PercentageTokenType,
            EnumToken.AngleTokenType,
            EnumToken.IdenTokenType,
        ].includes(arena.dataTypes[components[i]])) {
            return null;
        }
    }
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 100 : 1);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const c = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 150 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const h = getAngle(arena, t) * 360;
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(arena, t);
    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}

export { cmyk2lchToken, cmyk2lchvalues, color2lchToken, color2lchvalues, getLCHComponents, hex2lchToken, hex2lchvalues, hsl2lchToken, hsl2lchvalues, hwb2lchToken, hwb2lchvalues, lab2lchToken, lab2lchvalues, labvalues2lchvalues, oklab2lchToken, oklab2lchvalues, oklch2lchToken, oklch2lchvalues, rgb2lchToken, rgb2lchvalues, srgb2lch, xyz2lchvalues };
