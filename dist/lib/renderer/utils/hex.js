import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { getNumber, getAngle } from './color.js';
import { hsl2rgb } from './rgb.js';
import '../sourcemap/lib/encode.js';

function rgb2Hex(token) {
    let value = '#';
    let t;
    // @ts-ignore
    for (let i = 0; i < 3; i++) {
        // @ts-ignore
        t = token.chi[i];
        // @ts-ignore
        value += (t.val == 'none' ? '0' : Math.round(t.typ == EnumToken.PercentageTokenType ? 255 * t.val / 100 : t.val)).toString(16).padStart(2, '0');
    }
    // @ts-ignore
    if (token.chi.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') ||
            (t.typ == EnumToken.NumberTokenType && +t.val < 1) ||
            (t.typ == EnumToken.PercentageTokenType && +t.val < 100)) {
            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0');
        }
    }
    return value;
}
function hsl2Hex(token) {
    let t;
    // @ts-ignore
    let h = getAngle(token.chi[0]);
    // @ts-ignore
    t = token.chi[1];
    // @ts-ignore
    let s = getNumber(t);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    let l = getNumber(t);
    let a = null;
    if (token.chi?.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') || (t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            // @ts-ignore
            (t.typ == EnumToken.NumberTokenType && t.val < 1)) {
            // @ts-ignore
            a = getNumber(t);
        }
    }
    return `#${hsl2rgb(h, s, l, a).reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function hwb2hex(token) {
    let t;
    // @ts-ignore
    let h = getAngle(token.chi[0]);
    // @ts-ignore
    t = token.chi[1];
    // @ts-ignore
    let white = getNumber(t);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    let black = getNumber(t);
    let a = null;
    if (token.chi?.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') ||
            (t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            (t.typ == EnumToken.NumberTokenType && +t.val < 1)) {
            // @ts-ignore
            a = getNumber(t);
        }
    }
    const rgb = hsl2rgb(h, 1, .5, a);
    let value;
    for (let i = 0; i < 3; i++) {
        value = rgb[i] / 255;
        value *= (1 - white - black);
        value += white;
        rgb[i] = Math.round(value * 255);
    }
    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}
function cmyk2hex(token) {
    // @ts-ignore
    let t = token.chi[0];
    // @ts-ignore
    const c = getNumber(t);
    // @ts-ignore
    t = token.chi[1];
    // @ts-ignore
    const m = getNumber(t);
    // @ts-ignore
    t = token.chi[2];
    // @ts-ignore
    const y = getNumber(t);
    // @ts-ignore
    t = token.chi[3];
    // @ts-ignore
    const k = getNumber(t);
    const rgb = [
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];
    // @ts-ignore
    if (token.chi.length >= 9) {
        // @ts-ignore
        t = token.chi[8];
        // @ts-ignore
        rgb.push(Math.round(255 * getNumber(t)));
    }
    return `#${rgb.reduce((acc, curr) => acc + curr.toString(16).padStart(2, '0'), '')}`;
}

export { cmyk2hex, hsl2Hex, hwb2hex, rgb2Hex };
