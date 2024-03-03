import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { hex2lab, rgb2lab, hsl2lab, hwb2lab, getLABComponents, oklab2lab, oklch2lab } from './lab.js';
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
function oklab2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...oklab2lab(token));
}
function oklch2lch(token) {
    // @ts-ignore
    return lab2lchvalues(...oklch2lab(token));
}
function lab2lchvalues(l, a, b, alpha = null) {
    const c = Math.sqrt(a * a + b * b);
    const h = Math.atan2(b, a) * 180 / Math.PI;
    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}
function getLCHComponents(token) {
    const components = getComponents(token);
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
    const h = getAngle(t);
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(t);
    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}

export { getLCHComponents, hex2lch, hsl2lch, hwb2lch, lab2lch, lab2lchvalues, oklab2lch, oklch2lch, rgb2lch };
