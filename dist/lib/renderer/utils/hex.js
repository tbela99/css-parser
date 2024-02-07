import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { NAMES_COLORS, getNumber, getAngle } from './color.js';
import { hsl2rgb } from './rgb.js';
import '../sourcemap/lib/encode.js';

function reduceHexValue(value) {
    const named_color = NAMES_COLORS[expandHexValue(value)];
    if (value.length == 7) {
        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6]) {
            value = `#${value[1]}${value[3]}${value[5]}`;
        }
    }
    else if (value.length == 9) {
        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6] &&
            value[7] == value[8]) {
            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
        }
    }
    return named_color != null && named_color.length <= value.length ? named_color : value;
}
function expandHexValue(value) {
    if (value.length == 4) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    if (value.length == 5) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
    }
    return value;
}
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

export { cmyk2hex, expandHexValue, hsl2Hex, hwb2hex, reduceHexValue, rgb2Hex };
