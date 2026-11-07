/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { color2srgbvalues, minmax } from './color.js';
import { expandHexValue } from './hex.js';
import { hslvalues, hslvalues2srgbvalues, lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, cmyk2srgbvalues, hwb2srgbvalues } from './srgb.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { COLORS_NAMES } from '../constants.js';

function srgb2rgb(value) {
    return minmax(Math.round(value * 255), 0, 255);
}
function hex2RgbToken(arena, token) {
    return rgb2RgbToken(arena, hex2rgbvalues(arena, token));
}
function hsl2RgbToken(arena, token) {
    const values = hsl2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function hwb2RgbToken(arena, token) {
    const values = hwb2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function cmyk2RgbToken(arena, token) {
    const values = cmyk2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function oklab2RgbToken(arena, token) {
    const values = oklab2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function oklch2RgbToken(arena, token) {
    const values = oklch2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function lab2RgbToken(arena, token) {
    const values = lab2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function lch2RgbToken(arena, token) {
    const values = lch2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values);
}
function color2RgbToken(arena, token) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgb2RgbToken(arena, values.map((t, index) => (index == 3 ? t : srgb2rgb(t))));
}
function rgb2RgbToken(arena, values) {
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];
    if (values.length == 4) {
        chi.push(arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    return arena.createColor("rgb", ColorType.RGB, chi);
}
function hex2rgbvalues(arena, token) {
    const value = expandHexValue(arena.colorType[token] == ColorType.LIT
        ? COLORS_NAMES[arena.strings[arena.stringValue[token]].toLowerCase()]
        : arena.strings[arena.stringValue[token]]);
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
function hwb2rgbvalues(arena, token) {
    return hwb2srgbvalues(arena, token)?.map?.((t, index) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}
function hsl2rgbvalues(arena, token) {
    let { h, s, l, a } = hslvalues(arena, token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    return hslvalues2srgbvalues(h, s, l)
        .map((t) => minmax(Math.round(t * 255), 0, 255))
        .concat(a == 1 || a == null ? [] : [a]);
}
function hsl2srgbvalues(arena, token) {
    let { h, s, l, a } = hslvalues(arena, token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    return hslvalues2srgbvalues(h, s, l).concat(a == 1 || a == null ? [] : [a]);
}
function cmyk2rgbvalues(arena, token) {
    return cmyk2srgbvalues(arena, token)?.map?.((t, index) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}
function oklab2rgbvalues(arena, token) {
    return oklab2srgbvalues(arena, token)?.map?.((t, index) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}
function oklch2rgbvalues(arena, token) {
    return oklch2srgbvalues(arena, token)?.map?.((t, index) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}
function lab2rgbvalues(arena, token) {
    return lab2srgbvalues(arena, token)?.map?.((t, index) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}
function lch2rgbvalues(arena, token) {
    return lch2srgbvalues(arena, token)?.map?.((t, index) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}

export { cmyk2RgbToken, cmyk2rgbvalues, color2RgbToken, hex2RgbToken, hex2rgbvalues, hsl2RgbToken, hsl2rgbvalues, hsl2srgbvalues, hwb2RgbToken, hwb2rgbvalues, lab2RgbToken, lab2rgbvalues, lch2RgbToken, lch2rgbvalues, oklab2RgbToken, oklab2rgbvalues, oklch2RgbToken, oklch2rgbvalues, srgb2rgb };
