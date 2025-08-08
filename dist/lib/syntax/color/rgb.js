import { color2srgbvalues, minmax } from './color.js';
import { COLORS_NAMES } from './utils/constants.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { expandHexValue } from './hex.js';
import { hslvalues, hslvalues2srgbvalues, lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, cmyk2srgbvalues, hwb2srgbvalues } from './srgb.js';
import '../../renderer/sourcemap/lib/encode.js';

function srgb2rgb(value) {
    return minmax(Math.round(value * 255), 0, 255);
}
function hex2RgbToken(token) {
    return rgb2RgbToken(hex2rgbvalues(token));
}
function hsl2RgbToken(token) {
    const values = hsl2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function hwb2RgbToken(token) {
    const values = hwb2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function cmyk2RgbToken(token) {
    const values = cmyk2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function oklab2RgbToken(token) {
    const values = oklab2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function oklch2RgbToken(token) {
    const values = oklch2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function lab2RgbToken(token) {
    const values = lab2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function lch2RgbToken(token) {
    const values = lch2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values);
}
function color2RgbToken(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(values.map((t, index) => index == 3 ? t : srgb2rgb(t)));
}
function rgb2RgbToken(values) {
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]) },
        { typ: EnumToken.NumberTokenType, val: String(values[1]) },
        { typ: EnumToken.NumberTokenType, val: String(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed() });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'rgb',
        chi,
        kin: ColorType.RGB
    };
}
function hex2rgbvalues(token) {
    const value = expandHexValue(token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb = [];
    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }
    if (rgb.length == 4) {
        if (rgb[3] == 255) {
            rgb.pop();
        }
        else {
            rgb[3] = +(rgb[3] / 255).toFixed(2);
        }
    }
    return rgb;
}
function hwb2rgbvalues(token) {
    return hwb2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
}
function hsl2rgbvalues(token) {
    let { h, s, l, a } = hslvalues(token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    return hslvalues2srgbvalues(h, s, l).map((t) => minmax(Math.round(t * 255), 0, 255)).concat(a == 1 || a == null ? [] : [a]);
}
function hsl2srgbvalues(token) {
    let { h, s, l, a } = hslvalues(token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    return hslvalues2srgbvalues(h, s, l).concat(a == 1 || a == null ? [] : [a]);
}
function cmyk2rgbvalues(token) {
    return cmyk2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
}
function oklab2rgbvalues(token) {
    return oklab2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
}
function oklch2rgbvalues(token) {
    return oklch2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
}
function lab2rgbvalues(token) {
    return lab2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
}
function lch2rgbvalues(token) {
    return lch2srgbvalues(token)?.map?.((t, index) => index == 3 ? t : srgb2rgb(t)) ?? null;
}

export { cmyk2RgbToken, cmyk2rgbvalues, color2RgbToken, hex2RgbToken, hex2rgbvalues, hsl2RgbToken, hsl2rgbvalues, hsl2srgbvalues, hwb2RgbToken, hwb2rgbvalues, lab2RgbToken, lab2rgbvalues, lch2RgbToken, lch2rgbvalues, oklab2RgbToken, oklab2rgbvalues, oklch2RgbToken, oklch2rgbvalues, srgb2rgb };
