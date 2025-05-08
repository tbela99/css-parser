import { hwb2hsv } from './hsv.js';
import { getNumber } from './color.js';
import { lch2rgb, lab2rgb, oklch2rgb, oklab2rgb, hex2rgb } from './rgb.js';
import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { hslvalues } from './srgb.js';
import '../sourcemap/lib/encode.js';

function hex2hsl(token) {
    // @ts-ignore
    return rgb2hslvalues(...hex2rgb(token));
}
function rgb2hsl(token) {
    const chi = getComponents(token);
    if (chi == null) {
        return null;
    }
    // @ts-ignore
    let t = chi[0];
    // @ts-ignore
    let r = getNumber(t);
    // @ts-ignore
    t = chi[1];
    // @ts-ignore
    let g = getNumber(t);
    // @ts-ignore
    t = chi[2];
    // @ts-ignore
    let b = getNumber(t);
    // @ts-ignore
    t = chi[3];
    // @ts-ignore
    let a = null;
    if (t != null && !(t.typ == EnumToken.IdenTokenType && t.val == 'none')) {
        // @ts-ignore
        a = getNumber(t) / 255;
    }
    const values = [r, g, b];
    if (a != null && a != 1) {
        values.push(a);
    }
    // @ts-ignore
    return rgb2hslvalues(...values);
}
// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
function hsv2hsl(h, s, v, a) {
    const result = [
        //[hue, saturation, lightness]
        //Range should be between 0 - 1
        h, //Hue stays the same
        //Saturation is very different between the two color spaces
        //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
        //Otherwise sat*val/(2-(2-sat)*val)
        //Conditional is not operating with hue, it is reassigned!
        s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h),
        h / 2, //Lightness is (2-sat)*val/2
    ];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hwb2hsl(token) {
    // @ts-ignore
    return hsv2hsl(...hwb2hsv(...Object.values(hslvalues(token))));
}
function lab2hsl(token) {
    // @ts-ignore
    return rgb2hslvalues(...lab2rgb(token));
}
function lch2hsl(token) {
    // @ts-ignore
    return rgb2hslvalues(...lch2rgb(token));
}
function oklab2hsl(token) {
    const t = oklab2rgb(token);
    // @ts-ignore
    return t == null ? null : rgb2hslvalues(...t);
}
function oklch2hsl(token) {
    const t = oklch2rgb(token);
    // @ts-ignore
    return t == null ? null : rgb2hslvalues(...t);
}
function rgb2hslvalues(r, g, b, a = null) {
    return srgb2hsl(r / 255, g / 255, b / 255, a);
}
function srgb2hsl(r, g, b, a = null) {
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    if (max != min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    const hsl = [h, s, l];
    if (a != null && a < 1) {
        // @ts-ignore
        return hsl.concat([a]);
    }
    // @ts-ignore
    return hsl;
}

export { hex2hsl, hsv2hsl, hwb2hsl, lab2hsl, lch2hsl, oklab2hsl, oklch2hsl, rgb2hsl, rgb2hslvalues, srgb2hsl };
