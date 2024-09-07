import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { lab2lchvalues } from './lch.js';
import { srgb2oklab, hex2oklab, rgb2oklab, hsl2oklab, hwb2oklab, lab2oklab, lch2oklab, getOKLABComponents } from './oklab.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function hex2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...hex2oklab(token));
}
function rgb2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...rgb2oklab(token));
}
function hsl2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...hsl2oklab(token));
}
function hwb2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...hwb2oklab(token));
}
function lab2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...lab2oklab(token));
}
function lch2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...lch2oklab(token));
}
function oklab2oklch(token) {
    // @ts-ignore
    return lab2lchvalues(...getOKLABComponents(token));
}
function srgb2oklch(r, g, blue, alpha) {
    // @ts-ignore
    return lab2lchvalues(...srgb2oklab(r, g, blue, alpha));
}
function getOKLCHComponents(token) {
    const components = getComponents(token);
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

export { getOKLCHComponents, hex2oklch, hsl2oklch, hwb2oklch, lab2oklch, lch2oklch, oklab2oklch, rgb2oklch, srgb2oklch };
