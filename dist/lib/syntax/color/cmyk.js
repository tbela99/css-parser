import { ColorType, EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { color2srgbvalues, toPrecisionValue } from './color.js';
import { hsl2srgbvalues } from './rgb.js';
import './utils/constants.js';
import { lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, hwb2srgbvalues, rgb2srgbvalues } from './srgb.js';
import '../../renderer/sourcemap/lib/encode.js';

function rgb2cmykToken(token) {
    const components = rgb2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}
function hsl2cmykToken(token) {
    const values = hsl2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...values));
}
function hwb2cmykToken(token) {
    const values = hwb2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...values));
}
function lab2cmykToken(token) {
    const components = lab2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}
function lch2cmykToken(token) {
    const components = lch2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}
function oklab2cmyk(token) {
    const components = oklab2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}
function oklch2cmykToken(token) {
    const components = oklch2srgbvalues(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}
function color2cmykToken(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...values));
}
function srgb2cmykvalues(r, g, b, a = null) {
    const k = 1 - Math.max(r, g, b);
    const c = k == 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k == 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k == 1 ? 0 : (1 - b - k) / (1 - k);
    const result = [c, m, y, k];
    if (a != null && a < 1) {
        result.push(a);
    }
    return result;
}
function cmyktoken(values) {
    return {
        typ: EnumToken.ColorTokenType,
        val: 'device-cmyk',
        chi: values.reduce((acc, curr, index) => index < 4 ? [...acc, {
                typ: EnumToken.PercentageTokenType,
                // @ts-ignore
                val: toPrecisionValue(curr) * 100
            }] : [...acc, {
                typ: EnumToken.LiteralTokenType,
                val: '/'
            }, {
                typ: EnumToken.PercentageTokenType,
                val: toPrecisionValue(curr) * 100
            }], []),
        kin: ColorType.DEVICE_CMYK
    };
}

export { color2cmykToken, hsl2cmykToken, hwb2cmykToken, lab2cmykToken, lch2cmykToken, oklab2cmyk, oklch2cmykToken, rgb2cmykToken, srgb2cmykvalues };
