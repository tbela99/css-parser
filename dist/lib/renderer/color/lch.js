import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { srgb2lab, xyz2lab, oklch2lab, oklab2lab, getLABComponents, hwb2lab, hsl2lab, rgb2lab, hex2lab } from './lab.js';
import '../sourcemap/lib/encode.js';

function hex2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...hex2lab(token));
}
function rgb2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...rgb2lab(token));
}
function hsl2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...hsl2lab(token));
}
function hwb2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...hwb2lab(token));
}
function lab2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...getLABComponents(token));
}
function srgb2lch(r, g, blue, alpha) {
    // @ts-ignore
    return lab2lchvalues(...srgb2lab(r, g, blue, alpha));
}
function oklab2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...oklab2lab(token));
}
function oklch2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...oklch2lab(token));
}
function lab2lchvalues(l, a, b, alpha = null) {
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
    const lch = lab2lchvalues(...xyz2lab(x, y, z));
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

export { getLCHComponents, hex2lch, hsl2lch, hwb2lch, lab2lch, lab2lchvalues, oklab2lch, oklch2lch, rgb2lch, srgb2lch, xyz2lchvalues };
