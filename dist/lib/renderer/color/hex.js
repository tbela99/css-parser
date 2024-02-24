import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { NAMES_COLORS, getNumber } from './color.js';
import { hsl2rgb, hwb2rgb, cmyk2rgb, oklab2rgb, oklch2rgb, lab2rgb, lch2rgb } from './rgb.js';
import '../sourcemap/lib/encode.js';

function toHexString(acc, value) {
    return acc + value.toString(16).padStart(2, '0');
}
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
function rgb2hex(token) {
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
function hsl2hex(token) {
    return `${hsl2rgb(token).reduce(toHexString, '#')}`;
}
function hwb2hex(token) {
    return `${hwb2rgb(token).reduce(toHexString, '#')}`;
}
function cmyk2hex(token) {
    return `#${cmyk2rgb(token).reduce(toHexString, '')}`;
}
function oklab2hex(token) {
    return `${oklab2rgb(token).reduce(toHexString, '#')}`;
}
function oklch2hex(token) {
    return `${oklch2rgb(token).reduce(toHexString, '#')}`;
}
function lab2hex(token) {
    return `${lab2rgb(token).reduce(toHexString, '#')}`;
}
function lch2hex(token) {
    return `${lch2rgb(token).reduce(toHexString, '#')}`;
}

export { cmyk2hex, expandHexValue, hsl2hex, hwb2hex, lab2hex, lch2hex, oklab2hex, oklch2hex, reduceHexValue, rgb2hex };
