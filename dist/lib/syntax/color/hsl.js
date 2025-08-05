import { hwb2hsv } from './hsv.js';
import { color2srgbvalues, toPrecisionAngle, getNumber } from './color.js';
import { lch2rgbvalues, lab2rgbvalues, cmyk2rgbvalues } from './rgb.js';
import { ColorKind } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { hex2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, hslvalues } from './srgb.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/sourcemap/lib/encode.js';

function hex2HslToken(token) {
    // @ts-ignore
    return hslToken(srgb2hslvalues(...hex2srgbvalues(token)));
}
function rgb2HslToken(token) {
    const values = rgb2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function hwb2HslToken(token) {
    const values = hwb2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function cmyk2HslToken(token) {
    const values = cmyk2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function oklab2HslToken(token) {
    const values = oklab2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function oklch2HslToken(token) {
    const values = oklch2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function lab2HslToken(token) {
    const values = lab2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function lch2HslToken(token) {
    const values = lch2hslvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(values);
}
function color2HslToken(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return hslToken(srgb2hslvalues(...values));
}
function hslToken(values) {
    values[0] = toPrecisionAngle(values[0] * 360);
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]), uni: 'deg' },
        { typ: EnumToken.PercentageTokenType, val: String(values[1] * 100) },
        { typ: EnumToken.PercentageTokenType, val: String(values[2] * 100) },
    ];
    if (values.length == 4 && values[3] != 1) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: '/' }, { typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed() });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'hsl',
        chi,
        kin: ColorKind.HSL
    };
}
function rgb2hslvalues(token) {
    const chi = getComponents(token);
    if (chi == null || chi.length < 3) {
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
    let a = null;
    if (chi.length == 4) {
        a = getNumber(chi[3]);
    }
    const values = [r, g, b];
    if (a != null && a != 1) {
        values.push(a);
    }
    // @ts-ignore
    return rgbvalues2hslvalues(...values);
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
function cmyk2hslvalues(token) {
    const values = cmyk2rgbvalues(token);
    // @ts-ignore
    return values == null ? null : rgbvalues2hslvalues(...values);
}
function hwb2hslvalues(token) {
    // @ts-ignore
    return hsv2hsl(...hwb2hsv(...Object.values(hslvalues(token))));
}
function lab2hslvalues(token) {
    // @ts-ignore
    return rgbvalues2hslvalues(...lab2rgbvalues(token));
}
function lch2hslvalues(token) {
    // @ts-ignore
    return rgbvalues2hslvalues(...lch2rgbvalues(token));
}
function oklab2hslvalues(token) {
    const t = oklab2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(...t);
}
function oklch2hslvalues(token) {
    const t = oklch2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(...t);
}
function rgbvalues2hslvalues(r, g, b, a = null) {
    return srgb2hslvalues(r / 255, g / 255, b / 255, a);
}
function srgb2hslvalues(r, g, b, a = null) {
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

export { cmyk2HslToken, cmyk2hslvalues, color2HslToken, hex2HslToken, hsv2hsl, hwb2HslToken, hwb2hslvalues, lab2HslToken, lab2hslvalues, lch2HslToken, lch2hslvalues, oklab2HslToken, oklab2hslvalues, oklch2HslToken, oklch2hslvalues, rgb2HslToken, rgb2hslvalues, rgbvalues2hslvalues, srgb2hslvalues };
