/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { getColorComponents } from './utils/components.js';
import { color2srgbvalues, getNumber, getAngle } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { labvalues2lchvalues } from './lch.js';
import { srgb2oklab, lch2oklabvalues, getOKLABComponents, lab2oklabvalues, hwb2oklabvalues, hsl2oklabvalues, rgb2oklabvalues, hex2oklabvalues } from './oklab.js';
import { cmyk2srgbvalues } from './srgb.js';

function hex2oklchToken(arena, token) {
    const values = hex2oklchvalues(arena, token);
    return values == null ? null : oklchToken(arena, values);
}
function rgb2oklchToken(arena, token) {
    const values = rgb2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function hsl2oklchToken(arena, token) {
    const values = hsl2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function hwb2oklchToken(arena, token) {
    const values = hwb2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function cmyk2oklchToken(arena, token) {
    const values = cmyk2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function lab2oklchToken(arena, token) {
    const values = lab2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function oklab2oklchToken(arena, token) {
    const values = oklab2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function lch2oklchToken(arena, token) {
    const values = lch2oklchvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, values);
}
function color2oklchToken(arena, token) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return oklchToken(arena, srgb2oklch(values[0], values[1], values[2], values[3]));
}
function oklchToken(arena, values) {
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];
    if (values.length === 4) {
        chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"), arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    return arena.createColor("oklch", ColorType.OKLCH, chi);
}
function hex2oklchvalues(arena, token) {
    const values = hex2oklabvalues(arena, token);
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function rgb2oklchvalues(arena, token) {
    const values = rgb2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function hsl2oklchvalues(arena, token) {
    const values = hsl2oklabvalues(arena, token);
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function hwb2oklchvalues(arena, token) {
    const values = hwb2oklabvalues(arena, token);
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function cmyk2oklchvalues(arena, token) {
    const values = cmyk2srgbvalues(arena, token);
    return values == null ? null : srgb2oklch(values[0], values[1], values[2], values[3]);
}
function lab2oklchvalues(arena, token) {
    const values = lab2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function lch2oklchvalues(arena, token) {
    const values = lch2oklabvalues(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function oklab2oklchvalues(arena, token) {
    const values = getOKLABComponents(arena, token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function srgb2oklch(r, g, blue, alpha) {
    const values = srgb2oklab(r, g, blue, alpha);
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}
function getOKLCHComponents(arena, token) {
    const components = getColorComponents(arena, token);
    if (components == null) {
        return null;
    }
    for (let i = 0; i < components.length; i++) {
        if (![
            EnumToken.NumberTokenType,
            EnumToken.PercentageTokenType,
            EnumToken.AngleTokenType,
            EnumToken.IdenTokenType,
        ].includes(arena.dataTypes[components[i]])) {
            return [];
        }
    }
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(arena, t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const c = getNumber(arena, t) * (arena.dataTypes[t] === EnumToken.PercentageTokenType ? 0.4 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const h = getAngle(arena, t) * 360;
    // @ts-ignore
    t = components[3];
    const alpha = t == null || (arena.dataTypes[t] === EnumToken.IdenTokenType && arena.strings[arena.stringValue[t]] === "none")
        ? 1
        : getNumber(arena, t);
    return [l, c, h, alpha];
}

export { cmyk2oklchToken, cmyk2oklchvalues, color2oklchToken, getOKLCHComponents, hex2oklchToken, hex2oklchvalues, hsl2oklchToken, hsl2oklchvalues, hwb2oklchToken, hwb2oklchvalues, lab2oklchToken, lab2oklchvalues, lch2oklchToken, lch2oklchvalues, oklab2oklchToken, oklab2oklchvalues, rgb2oklchToken, rgb2oklchvalues, srgb2oklch };
