import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { color2srgbvalues, toPrecisionAngle, getNumber, getAngle } from './color.js';
import { cmyk2srgbvalues } from './srgb.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { srgb2labvalues, xyz2lab, oklch2labvalues, oklab2labvalues, getLABComponents, hwb2labvalues, hsl2labvalues, rgb2labvalues, hex2labvalues } from './lab.js';
import '../../renderer/sourcemap/lib/encode.js';

function hex2lchToken(token) {
    const values = hex2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function rgb2lchToken(token) {
    const values = rgb2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function hsl2lchToken(token) {
    const values = hsl2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function hwb2lchToken(token) {
    const values = hwb2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function cmyk2lchToken(token) {
    const values = cmyk2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function lab2lchToken(token) {
    const values = lab2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function oklab2lchToken(token) {
    const values = oklab2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function oklch2lchToken(token) {
    const values = oklch2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function color2lchToken(token) {
    const values = color2lchvalues(token);
    if (values == null) {
        return null;
    }
    return lchToken(values);
}
function lchToken(values) {
    values[2] = toPrecisionAngle(values[2]);
    const chi = [
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.NumberTokenType, val: values[1] },
        { typ: EnumToken.NumberTokenType, val: values[2] },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: '/' }, { typ: EnumToken.PercentageTokenType, val: values[3] * 100 });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'lch',
        chi,
        kin: ColorType.LCH
    };
}
function hex2lchvalues(token) {
    const values = hex2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}
function rgb2lchvalues(token) {
    const values = rgb2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}
function hsl2lchvalues(token) {
    const values = hsl2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}
function hwb2lchvalues(token) {
    const values = hwb2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}
function lab2lchvalues(token) {
    const values = getLABComponents(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}
function srgb2lch(r, g, blue, alpha) {
    // @ts-ignore
    return labvalues2lchvalues(...srgb2labvalues(r, g, blue, alpha));
}
function oklab2lchvalues(token) {
    const values = oklab2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}
function cmyk2lchvalues(token) {
    const values = cmyk2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2lch(...values);
}
function oklch2lchvalues(token) {
    const values = oklch2labvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return labvalues2lchvalues(...values);
}
function color2lchvalues(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2lch(...values);
}
function labvalues2lchvalues(l, a, b, alpha = null) {
    let c = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * 180 / Math.PI;
    if (h < 0) {
        h += 360;
    }
    if (c < .0001) {
        c = h = 0;
    }
    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}
function xyz2lchvalues(x, y, z, alpha) {
    // @ts-ignore(
    const lch = labvalues2lchvalues(...xyz2lab(x, y, z));
    return alpha == null || alpha == 1 ? lch : lch.concat(alpha);
}
function getLCHComponents(token) {
    const components = getComponents(token);
    if (components == null) {
        return null;
    }
    for (let i = 0; i < components.length; i++) {
        if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.IdenTokenType].includes(components[i].typ)) {
            return null;
        }
    }
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 100 : 1);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const c = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 150 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const h = getAngle(t) * 360;
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(t);
    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}

export { cmyk2lchToken, cmyk2lchvalues, color2lchToken, color2lchvalues, getLCHComponents, hex2lchToken, hex2lchvalues, hsl2lchToken, hsl2lchvalues, hwb2lchToken, hwb2lchvalues, lab2lchToken, lab2lchvalues, labvalues2lchvalues, oklab2lchToken, oklab2lchvalues, oklch2lchToken, oklch2lchvalues, rgb2lchToken, rgb2lchvalues, srgb2lch, xyz2lchvalues };
