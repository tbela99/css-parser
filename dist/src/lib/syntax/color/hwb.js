/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.7.0
	License: MIT
 */
import { getColorComponents } from './utils/components.js';
import { color2srgbvalues, getNumber, getAngle } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { cmyk2srgbvalues, lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues, hslvalues } from './srgb.js';

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
    // console.error(new Error("hsl2hwbToken"));
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
    const chi = [
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.PercentageTokenType, val: values[1] },
        { typ: EnumToken.PercentageTokenType, val: values[2] },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: "/" }, {
            typ: EnumToken.PercentageTokenType,
            val: values[3] * 100,
        });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: "hwb",
        chi,
        kin: ColorType.HWB,
    };
}
function rgb2hwbvalues(token) {
    const values = getColorComponents(token).map((t, index) => {
        if (index == 3) {
            return getNumber(t);
        }
        return getNumber(t) / 255;
    });
    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function cmyk2hwbvalues(token) {
    const values = cmyk2srgbvalues(token);
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}
function hsl2hwbvalues(token) {
    const values = hslvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return hslvalues2hwbvalues(values.h, values.s, values.l, values.a);
}
function lab2hwbvalues(token) {
    const values = lab2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function lch2hwbvalues(token) {
    const values = lch2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function oklab2hwbvalues(token) {
    const values = oklab2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function oklch2hwbvalues(token) {
    const values = oklch2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}
function color2hwbvalues(token) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}
function hwbvalues(token) {
    const components = getColorComponents(token);
    if (components == null) {
        return null;
    }
    let t;
    // @ts-ignore
    let h = getAngle(components[0]) * 360;
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    let w = getNumber(t);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    let b = getNumber(t);
    // if (components[1].typ == EnumToken.NumberTokenType) {
    w *= 100;
    // }
    // if (components[2].typ == EnumToken.NumberTokenType) {
    b *= 100;
    // }
    let a = null;
    if (components.length == 4) {
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        a = getNumber(t);
    }
    return a == null ? { h, w, b } : { h, w, b, a };
}
function srgb2hwb(r, g, b, a = null, fallback = 0) {
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
