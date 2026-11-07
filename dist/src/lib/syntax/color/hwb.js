/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
import { getColorComponents } from './utils/components.js';
import { color2srgbvalues, getNumber, getAngle } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { cmyk2srgbvalues, lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, hslvalues } from './srgb.js';

function rgb2hwbToken(arena, token) {
    const values = rgb2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function hsl2hwbToken(arena, token) {
    const values = hsl2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // console.error(new Error("hsl2hwbToken"));
    return hwbToken(arena, values);
}
function cmyk2hwbToken(arena, token) {
    const values = cmyk2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function oklab2hwbToken(arena, token) {
    const values = oklab2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function oklch2hwbToken(arena, token) {
    const values = oklch2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function lab2hwbToken(arena, token) {
    const values = lab2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function lch2hwbToken(arena, token) {
    const values = lch2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function color2hwbToken(arena, token) {
    const values = color2hwbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return hwbToken(arena, values);
}
function hwbToken(arena, values) {
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.PercentageTokenType, values[1]),
        arena.createToken(EnumToken.PercentageTokenType, values[2]),
    ];
    if (values.length == 4) {
        chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"), arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    return arena.createColor("hwb", ColorType.HWB, chi);
}
function rgb2hwbvalues(arena, token) {
    const values = getColorComponents(arena, token).map((t, index) => {
        if (index == 3) {
            return getNumber(arena, t);
        }
        return getNumber(arena, t) / 255;
    });
    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function cmyk2hwbvalues(arena, token) {
    const values = cmyk2srgbvalues(arena, token);
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}
function hsl2hwbvalues(arena, token) {
    const values = hslvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return hslvalues2hwbvalues(values.h, values.s, values.l, values.a);
}
function lab2hwbvalues(arena, token) {
    const values = lab2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function lch2hwbvalues(arena, token) {
    const values = lch2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function oklab2hwbvalues(arena, token) {
    const values = oklab2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function oklch2hwbvalues(arena, token) {
    const values = oklch2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}
function color2hwbvalues(arena, token) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function hwbvalues(arena, token) {
    const components = getColorComponents(arena, token);
    if (components == null) {
        return null;
    }
    let t;
    // @ts-ignore
    let h = getAngle(arena, components[0]) * 360;
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    let w = getNumber(arena, t);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    let b = getNumber(arena, t);
    // if (arena.dataTypes[components[1]] == EnumToken.NumberTokenType) {
    w *= 100;
    // }
    // if (arena.dataTypes[components[2]] == EnumToken.NumberTokenType) {
    b *= 100;
    // }
    let a = null;
    if (components.length == 4) {
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        a = getNumber(arena, t);
    }
    return a == null ? { h, w, b } : { h, w, b, a };
}
function srgb2hwb(r, g, b, a = null) {
    // 1. Clamp inputs to the standard web-safe sRGB gamut [0.0, 1.0]
    const rClamp = Math.min(1, Math.max(0, r));
    const gClamp = Math.min(1, Math.max(0, g));
    const bClamp = Math.min(1, Math.max(0, b));
    const cMax = Math.max(rClamp, gClamp, bClamp);
    const cMin = Math.min(rClamp, gClamp, bClamp);
    const delta = cMax - cMin;
    // 2. Whiteness and Blackness calculations
    const w = cMin;
    const bl = 1 - cMax;
    // 3. Calculate Hue
    let h = 0;
    if (delta !== 0) {
        if (cMax === rClamp) {
            h = 60 * (((gClamp - bClamp) / delta) % 6);
        }
        else if (cMax === gClamp) {
            h = 60 * ((bClamp - rClamp) / delta + 2);
        }
        else if (cMax === bClamp) {
            h = 60 * ((rClamp - gClamp) / delta + 4);
        }
        if (h < 0) {
            h += 360;
        }
    }
    const result = [h, w * 100, bl * 100];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hslvalues2hwbvalues(h, s, l, a = null) {
    const sNorm = s / 100;
    const lNorm = l / 100;
    // Keep Hue cleanly bound to standard circle loops
    const hue = ((h % 360) + 360) % 360;
    // 1. Compute the intermediate HSV Value component (brightness peak)
    const v = lNorm + sNorm * Math.min(lNorm, 1 - lNorm);
    // 2. Compute Chroma
    const chroma = 2 * (v - lNorm);
    // 3. Extract Whiteness and Blackness
    const w = v - chroma;
    const b = 1 - v;
    const hwb = [hue, w * 100, b * 100];
    if (a != null && a != 1) {
        hwb.push(a);
    }
    return hwb;
}

export { cmyk2hwbToken, cmyk2hwbvalues, color2hwbToken, color2hwbvalues, hsl2hwbToken, hsl2hwbvalues, hslvalues2hwbvalues, hwbToken, hwbvalues, lab2hwbToken, lab2hwbvalues, lch2hwbToken, lch2hwbvalues, oklab2hwbToken, oklab2hwbvalues, oklch2hwbToken, oklch2hwbvalues, rgb2hwbToken, rgb2hwbvalues, srgb2hwb };
