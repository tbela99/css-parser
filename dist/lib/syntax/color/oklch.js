import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { color2srgbvalues, toPrecisionAngle, getNumber, getAngle } from './color.js';
import { srgb2oklab, lch2oklabvalues, getOKLABComponents, lab2oklabvalues, hwb2oklabvalues, hsl2oklabvalues, rgb2oklabvalues, hex2oklabvalues } from './oklab.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { cmyk2srgbvalues } from './srgb.js';
import { labvalues2lchvalues } from './lch.js';
import '../../renderer/sourcemap/lib/encode.js';

function hex2oklchToken(token) {
    const values = hex2oklchvalues(token);
    return oklchToken(values);
}
function rgb2oklchToken(token) {
    const values = rgb2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function hsl2oklchToken(token) {
    const values = hsl2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function hwb2oklchToken(token) {
    const values = hwb2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function cmyk2oklchToken(token) {
    const values = cmyk2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function lab2oklchToken(token) {
    const values = lab2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function oklab2oklchToken(token) {
    const values = oklab2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function lch2oklchToken(token) {
    const values = lch2oklchvalues(token);
    if (values == null) {
        return null;
    }
    return oklchToken(values);
}
function color2oklchToken(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return oklchToken(srgb2oklch(...values));
}
function oklchToken(values) {
    values[2] = toPrecisionAngle(values[2]);
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]) },
        { typ: EnumToken.NumberTokenType, val: String(values[1]) },
        { typ: EnumToken.NumberTokenType, val: String(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: '/' }, {
            typ: EnumToken.PercentageTokenType,
            val: (values[3] * 100).toFixed()
        });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'oklch',
        chi,
        kin: ColorType.OKLCH
    };
}
function hex2oklchvalues(token) {
    // @ts-ignore
    return labvalues2lchvalues(...hex2oklabvalues(token));
}
function rgb2oklchvalues(token) {
    const values = rgb2oklabvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return labvalues2lchvalues(...values);
}
function hsl2oklchvalues(token) {
    // @ts-ignore
    return labvalues2lchvalues(...hsl2oklabvalues(token));
}
function hwb2oklchvalues(token) {
    // @ts-ignore
    return labvalues2lchvalues(...hwb2oklabvalues(token));
}
function cmyk2oklchvalues(token) {
    const values = cmyk2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2oklch(...values);
}
function lab2oklchvalues(token) {
    // @ts-ignore
    return labvalues2lchvalues(...lab2oklabvalues(token));
}
function lch2oklchvalues(token) {
    // @ts-ignore
    return labvalues2lchvalues(...lch2oklabvalues(token));
}
function oklab2oklchvalues(token) {
    // @ts-ignore
    return labvalues2lchvalues(...getOKLABComponents(token));
}
function srgb2oklch(r, g, blue, alpha) {
    // @ts-ignore
    return labvalues2lchvalues(...srgb2oklab(r, g, blue, alpha));
}
function getOKLCHComponents(token) {
    const components = getComponents(token);
    if (components == null) {
        return null;
    }
    for (let i = 0; i < components.length; i++) {
        if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.IdenTokenType].includes(components[i].typ)) {
            return [];
        }
    }
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const c = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const h = getAngle(t) * 360;
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null || (t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t);
    return [l, c, h, alpha];
}

export { cmyk2oklchToken, cmyk2oklchvalues, color2oklchToken, getOKLCHComponents, hex2oklchToken, hex2oklchvalues, hsl2oklchToken, hsl2oklchvalues, hwb2oklchToken, hwb2oklchvalues, lab2oklchToken, lab2oklchvalues, lch2oklchToken, lch2oklchvalues, oklab2oklchToken, oklab2oklchvalues, rgb2oklchToken, rgb2oklchvalues, srgb2oklch };
