import { ColorType, EnumToken } from '../../ast/types.js';
import { color2srgbvalues } from './color.js';
import { lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, hwb2srgbvalues, rgb2srgbvalues } from './srgb.js';
import { hsl2srgbvalues } from './rgb.js';

function rgb2cmykToken(token) {
    let components = rgb2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function hsl2cmykToken(token) {
    let values = hsl2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}
function hwb2cmykToken(token) {
    const values = hwb2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}
function lab2cmykToken(token) {
    const components = lab2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function lch2cmykToken(token) {
    const components = lch2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function oklab2cmyk(token) {
    const components = oklab2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function oklch2cmykToken(token) {
    const components = oklch2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function color2cmykToken(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return cmyktoken(srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}
function srgb2cmykvalues(r, g, b, a = null) {
    const k = 1 - Math.max(r, g, b);
    const div = 1 - k;
    const c = k == 1 ? 0 : (1 - r - k) / div;
    const m = k == 1 ? 0 : (1 - g - k) / div;
    const y = k == 1 ? 0 : (1 - b - k) / div;
    const result = [c, m, y, k];
    if (a != null && a < 1) {
        result.push(a);
    }
    return result;
}
function cmyktoken(values) {
    return {
        typ: EnumToken.ColorTokenType,
        val: "device-cmyk",
        chi: values.reduce((acc, curr, index) => index < 4
            ? [
                ...acc,
                {
                    typ: EnumToken.PercentageTokenType,
                    // @ts-ignore
                    val: curr * 100,
                },
            ]
            : [
                ...acc,
                {
                    typ: EnumToken.LiteralTokenType,
                    val: "/",
                },
                {
                    typ: EnumToken.PercentageTokenType,
                    val: curr * 100,
                },
            ], []),
        kin: ColorType.DEVICE_CMYK,
    };
}

export { color2cmykToken, hsl2cmykToken, hwb2cmykToken, lab2cmykToken, lch2cmykToken, oklab2cmyk, oklch2cmykToken, rgb2cmykToken, srgb2cmykvalues };
