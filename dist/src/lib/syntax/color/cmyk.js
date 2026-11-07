/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { EnumToken, ColorType } from '../../ast/types.js';
import { color2srgbvalues } from './color.js';
import { lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, hwb2srgbvalues, rgb2srgbvalues } from './srgb.js';
import { hsl2srgbvalues } from './rgb.js';

function rgb2cmykToken(arena, token) {
    let components = rgb2srgbvalues(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function hsl2cmykToken(arena, token) {
    let values = hsl2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}
function hwb2cmykToken(arena, token) {
    const values = hwb2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}
function lab2cmykToken(arena, token) {
    const components = lab2srgbvalues(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function lch2cmykToken(arena, token) {
    const components = lch2srgbvalues(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function oklab2cmyk(arena, token) {
    const components = oklab2srgbvalues(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function oklch2cmykToken(arena, token) {
    const components = oklch2srgbvalues(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}
function color2cmykToken(arena, token) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return cmyktoken(arena, srgb2cmykvalues(values[0], values[1], values[2], values[3]));
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
function cmyktoken(arena, values) {
    const chi = [];
    for (let index = 0; index < values.length; index++) {
        if (index == 4) {
            chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"));
        }
        chi.push(arena.createToken(EnumToken.PercentageTokenType, values[index] * 100));
    }
    return arena.createColor("device-cmyk", ColorType.DEVICE_CMYK, chi);
}

export { color2cmykToken, hsl2cmykToken, hwb2cmykToken, lab2cmykToken, lch2cmykToken, oklab2cmyk, oklch2cmykToken, rgb2cmykToken, srgb2cmykvalues };
