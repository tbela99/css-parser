/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
import { color2srgbvalues, getNumber } from './color.js';
import { lch2rgbvalues, lab2rgbvalues, cmyk2rgbvalues } from './rgb.js';
import { getColorComponents } from './utils/components.js';
import { hex2srgbvalues, oklch2srgbvalues, oklab2srgbvalues } from './srgb.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { hwbvalues } from './hwb.js';

function hex2HslToken(arena, token) {
    let values = hex2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, srgb2hslvalues(values[0], values[1], values[2], values[3]));
}
function rgb2HslToken(arena, token) {
    const values = rgb2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function hwb2HslToken(arena, token) {
    const values = hwb2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function cmyk2HslToken(arena, token) {
    const values = cmyk2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function oklab2HslToken(arena, token) {
    const values = oklab2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function oklch2HslToken(arena, token) {
    const values = oklch2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function lab2HslToken(arena, token) {
    const values = lab2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function lch2HslToken(arena, token) {
    const values = lch2hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, values);
}
function color2HslToken(arena, token) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hslToken(arena, srgb2hslvalues(values[0], values[1], values[2], values[3]));
}
function hslToken(arena, values) {
    if (values[1] == 0) {
        values[0] = 0;
    }
    if (values[2] == 1 || values[2] == 0) {
        values[0] = 0;
        values[1] = 0;
    }
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.PercentageTokenType, values[1]),
        arena.createToken(EnumToken.PercentageTokenType, values[2]),
    ];
    if (values.length == 4 && values[3] != 1) {
        chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"), arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    return arena.createColor("hsl", ColorType.HSL, chi);
}
function rgb2hslvalues(arena, token) {
    const chi = getColorComponents(arena, token);
    if (chi == null || chi.length < 3) {
        return null;
    }
    // @ts-ignore
    let t = chi[0];
    // @ts-ignore
    let r = getNumber(arena, t);
    // @ts-ignore
    t = chi[1];
    // @ts-ignore
    let g = getNumber(arena, t);
    // @ts-ignore
    t = chi[2];
    // @ts-ignore
    let b = getNumber(arena, t);
    // @ts-ignore
    let a = null;
    if (chi.length == 4) {
        a = getNumber(arena, chi[3]);
    }
    const values = [r, g, b];
    if (a != null && a != 1) {
        values.push(a);
    }
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function cmyk2hslvalues(arena, token) {
    const values = cmyk2rgbvalues(arena, token);
    return values == null ? null : rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function hwb2hslvalues(arena, token) {
    const { h, w, b, a } = hwbvalues(arena, token) ?? {};
    if (h == null || w == null || b == null) {
        return null;
    }
    const wNorm = w / 100;
    const bNorm = b / 100;
    const hue = ((h % 360) + 360) % 360;
    if (wNorm + bNorm >= 1) {
        const grayLightness = wNorm / (wNorm + bNorm);
        return [hue, 0, grayLightness * 100];
    }
    const lightness = (1 - bNorm + wNorm) / 2;
    let saturation = 0;
    if (lightness > 0 && lightness < 1) {
        const chroma = 1 - wNorm - bNorm;
        saturation = chroma / (1 - Math.abs(2 * lightness - 1));
    }
    const hsl = [hue, saturation * 100, lightness * 100];
    if (a != null && a != 1) {
        hsl.push(a);
    }
    return hsl;
}
function lab2hslvalues(arena, token) {
    const values = lab2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function lch2hslvalues(arena, token) {
    const values = lch2rgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function oklab2hslvalues(arena, token) {
    const t = oklab2srgbvalues(arena, token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
}
function oklch2hslvalues(arena, token) {
    const t = oklch2srgbvalues(arena, token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
}
function rgbvalues2hslvalues(r, g, b, a = null) {
    return srgb2hslvalues(r / 255, g / 255, b / 255, a);
}
function srgb2hslvalues(r, g, b, a = null) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case r:
                h = 60 * (((g - b) / delta) % 6);
                break;
            case g:
                h = 60 * ((b - r) / delta + 2);
                break;
            case b:
                h = 60 * ((r - g) / delta + 4);
                break;
        }
    }
    h = ((h % 360) + 360) % 360;
    const hsl = [h, s * 100, l * 100];
    if (a != null && a < 1) {
        // @ts-ignore
        return hsl.concat([a]);
    }
    // @ts-ignore
    return hsl;
}

export { cmyk2HslToken, cmyk2hslvalues, color2HslToken, hex2HslToken, hwb2HslToken, hwb2hslvalues, lab2HslToken, lab2hslvalues, lch2HslToken, lch2hslvalues, oklab2HslToken, oklab2hslvalues, oklch2HslToken, oklch2hslvalues, rgb2HslToken, rgb2hslvalues, rgbvalues2hslvalues, srgb2hslvalues };
