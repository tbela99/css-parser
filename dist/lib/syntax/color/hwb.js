import { hsl2hsv } from './hsv.js';
import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { color2srgbvalues, toPrecisionAngle, getAngle, getNumber } from './color.js';
import { cmyk2srgbvalues, lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues } from './srgb.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/sourcemap/lib/encode.js';

function rgb2hwbToken(token) {
    const values = rgb2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function hsl2hwbToken(token) {
    const values = hsl2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function cmyk2hwbToken(token) {
    const values = cmyk2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function oklab2hwbToken(token) {
    const values = oklab2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function oklch2hwbToken(token) {
    const values = oklch2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function lab2hwbToken(token) {
    const values = lab2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function lch2hwbToken(token) {
    const values = lch2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function color2hwbToken(token) {
    const values = color2hwbvalues(token);
    if (values == null) {
        return null;
    }
    return hwbToken(values);
}
function hwbToken(values) {
    values[0] = toPrecisionAngle(values[0] * 360);
    const chi = [
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.PercentageTokenType, val: values[1] * 100 },
        { typ: EnumToken.PercentageTokenType, val: values[2] * 100 },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: '/' }, { typ: EnumToken.PercentageTokenType, val: values[3] * 100 });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'hwb',
        chi,
        kin: ColorType.HWB
    };
}
function rgb2hwbvalues(token) {
    // @ts-ignore
    return srgb2hwb(...getComponents(token).map((t, index) => {
        if (index == 3) {
            return getNumber(t);
        }
        return getNumber(t) / 255;
    }));
}
function cmyk2hwbvalues(token) {
    // @ts-ignore
    return srgb2hwb(...cmyk2srgbvalues(token));
}
function hsl2hwbvalues(token) {
    // @ts-ignore
    return hslvalues2hwbvalues(...getComponents(token).map((t, index) => {
        if (index == 3 && (t.typ == EnumToken.IdenTokenType && t.val == 'none')) {
            return 1;
        }
        if (index == 0) {
            return getAngle(t);
        }
        return getNumber(t);
    }));
}
function lab2hwbvalues(token) {
    // @ts-ignore
    return srgb2hwb(...lab2srgbvalues(token));
}
function lch2hwbvalues(token) {
    // @ts-ignore
    return srgb2hwb(...lch2srgbvalues(token));
}
function oklab2hwbvalues(token) {
    // @ts-ignore
    return srgb2hwb(...oklab2srgbvalues(token));
}
function oklch2hwbvalues(token) {
    const values = oklch2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2hwb(...values);
}
function rgb2hue(r, g, b, fallback = 0) {
    let value = rgb2value(r, g, b);
    let whiteness = rgb2whiteness(r, g, b);
    let delta = value - whiteness;
    if (delta > 0) {
        // calculate segment
        let segment = value === r ? (g - b) / delta : (value === g
            ? (b - r) / delta
            : (r - g) / delta);
        // calculate shift
        let shift = value === r ? segment < 0
            ? 360 / 60
            : 0 / 60 : (value === g
            ? 120 / 60
            : 240 / 60);
        // calculate hue
        return (segment + shift) * 60;
    }
    return fallback;
}
function rgb2value(r, g, b) {
    return Math.max(r, g, b);
}
function rgb2whiteness(r, g, b) {
    return Math.min(r, g, b);
}
function color2hwbvalues(token) {
    // @ts-ignore
    return srgb2hwb(...color2srgbvalues(token));
}
function srgb2hwb(r, g, b, a = null, fallback = 0) {
    r *= 100;
    g *= 100;
    b *= 100;
    let hue = rgb2hue(r, g, b, fallback);
    let whiteness = rgb2whiteness(r, g, b);
    let value = Math.round(rgb2value(r, g, b));
    let blackness = 100 - value;
    const result = [hue / 360, whiteness / 100, blackness / 100];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hsv2hwb(h, s, v, a = null) {
    const result = [h, (1 - s) * v, 1 - v];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hslvalues2hwbvalues(h, s, l, a = null) {
    // @ts-ignore
    return hsv2hwb(...hsl2hsv(h, s, l, a));
}

export { cmyk2hwbToken, cmyk2hwbvalues, color2hwbToken, color2hwbvalues, hsl2hwbToken, hsl2hwbvalues, hslvalues2hwbvalues, hsv2hwb, hwbToken, lab2hwbToken, lab2hwbvalues, lch2hwbToken, lch2hwbvalues, oklab2hwbToken, oklab2hwbvalues, oklch2hwbToken, oklch2hwbvalues, rgb2hwbToken, rgb2hwbvalues, srgb2hwb };
