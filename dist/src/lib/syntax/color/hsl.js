/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.9
	License: MIT
 */
import { color2srgbvalues, getNumber } from './color.js';
import { lch2rgbvalues, lab2rgbvalues, cmyk2rgbvalues } from './rgb.js';
import { getColorComponents } from './utils/components.js';
import { hex2srgbvalues, oklch2srgbvalues, oklab2srgbvalues } from './srgb.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { hwbvalues } from './hwb.js';

function hex2HslToken(token) {
    let values = hex2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return hslToken(srgb2hslvalues(values[0], values[1], values[2], values[3]));
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
    return hslToken(srgb2hslvalues(values[0], values[1], values[2], values[3]));
}
function hslToken(values) {
    if (values[1] == 0) {
        values[0] = 0;
    }
    if (values[2] == 1 || values[2] == 0) {
        values[0] = 0;
        values[1] = 0;
    }
    const chi = [
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.PercentageTokenType, val: values[1] },
        { typ: EnumToken.PercentageTokenType, val: values[2] },
    ];
    if (values.length == 4 && values[3] != 1) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: "/" }, {
            typ: EnumToken.PercentageTokenType,
            val: values[3] * 100,
        });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: "hsl",
        chi,
        kin: ColorType.HSL,
    };
}
function rgb2hslvalues(token) {
    const chi = getColorComponents(token);
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
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function cmyk2hslvalues(token) {
    const values = cmyk2rgbvalues(token);
    return values == null ? null : rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function hwb2hslvalues(token) {
    const { h, w, b, a } = hwbvalues(token) ?? {};
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
function lab2hslvalues(token) {
    const values = lab2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function lch2hslvalues(token) {
    const values = lch2rgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}
function oklab2hslvalues(token) {
    const t = oklab2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
}
function oklch2hslvalues(token) {
    const t = oklch2srgbvalues(token);
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
