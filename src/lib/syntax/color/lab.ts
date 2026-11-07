import { D50, e, k } from "../constants.ts";
import type { AstArena } from "../../ast/arena.ts";
import { getColorComponents } from "./utils/components.ts";
import { srgb2xyz_d65, XYZ_D50_to_D65 } from "./xyz.ts";
import type { Token } from "../../../@types/index.d.ts";
import {
    cmyk2srgbvalues,
    hex2srgbvalues,
    hsl2srgb,
    hwb2srgbvalues,
    oklch2srgbvalues,
    rgb2srgb,
    xyz2srgb,
} from "./srgb.ts";
import { getLCHComponents } from "./lch.ts";
import { getOKLABComponents, OKLab_to_XYZ } from "./oklab.ts";
import { color2srgbvalues, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { XYZ_D65_to_D50 } from "./xyzd50.ts";

export function hex2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hex2labvalues(arena, token);

    return values == null ? null : labToken(arena, values);
}

export function rgb2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = rgb2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function hsl2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hsl2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function hwb2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hwb2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function cmyk2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = cmyk2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function lch2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lch2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function oklab2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklab2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function oklch2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklch2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

export function color2labToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = color2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labToken(arena, values);
}

function labToken(arena: AstArena, values: number[]): Token | null {
    const chi: Token[] = <Token[]>[
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];

    if (values.length == 4) {
        chi.push(
            arena.createToken(EnumToken.LiteralTokenType, "/"),
            arena.createToken(EnumToken.PercentageTokenType, values[3] * 100),
        );
    }

    return arena.createColor("lab", ColorType.LAB, chi);
}

// L: 0% = 0.0, 100% = 100.0
// for a and b: -100% = -125, 100% = 125

export function hex2labvalues(arena: AstArena, token: Token): number[] | null {
    let values: number[] | null = hex2srgbvalues(arena, token);

    // @ts-ignore
    return values == null ? null : srgb2labvalues(values[0], values[1], values[2], values[3]);
}

export function rgb2labvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = rgb2srgb(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2labvalues(values[0], values[1], values[2], values[3]);
}

export function cmyk2labvalues(arena: AstArena, token: Token) {
    const values: number[] | null = cmyk2srgbvalues(arena, token);

    // @ts-ignore
    return values == null ? null : srgb2labvalues(values[0], values[1], values[2], values[3]);
}

export function hsl2labvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = hsl2srgb(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2labvalues(values[0], values[1], values[2], values[3]);
}

export function hwb2labvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = hwb2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2labvalues(values[0], values[1], values[2], values[3]);
}

export function lch2labvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = getLCHComponents(arena, token);

    // @ts-ignore
    return values == null ? null : lchvalues2labvalues(values[0], values[1], values[2], values[3]);
}

export function oklab2labvalues(arena: AstArena, token: Token): number[] | null {
    let values: number[] | null = getOKLABComponents(arena, token);

    if (values == null) {
        return null;
    }

    values = OKLab_to_XYZ(values[0], values[1], values[2], values[3]);
    values = XYZ_D65_to_D50(values[0], values[1], values[2], values[3]);

    return xyz2lab(values[0], values[1], values[2], values[3]);
}

export function oklch2labvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = oklch2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2labvalues(values[0], values[1], values[2], values[3]);
}

export function color2labvalues(arena: AstArena, token: Token): number[] | null {
    const val: number[] | null = color2srgbvalues(arena, token);

    if (val == null) {
        return null;
    }

    return srgb2labvalues(val[0], val[1], val[2], val[3]);
}

export function srgb2labvalues(r: number, g: number, b: number, a: number | null): number[] {
    let result: number[] = srgb2xyz_d65(r, g, b);
    result = xyz2lab(result[0], result[1], result[2]);

    // Fixes achromatic RGB colors having a _slight_ chroma due to floating-point errors
    // and approximated computations in sRGB <-> CIELab.
    // See: https://github.com/d3/d3-color/pull/46
    if (r === b && b === g) {
        result[1] = result[2] = 0;
    }

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function xyz2lab(x: number, y: number, z: number, a: number | null = null): number[] {
    // Assuming XYZ is relative to D50, convert to CIE Lab
    // from CIE standard, which now defines these as a rational fraction
    // var e = 216/24389;  // 6^3/29^3
    // var k = 24389/27;   // 29^3/3^3

    // compute xyz, which is XYZ scaled relative to reference white
    const xyz: number[] = [x, y, z].map((value: number, i: number) => value / D50[i]);

    // now compute f
    const f: number[] = xyz.map((value: number): number => (value > e ? Math.cbrt(value) : (k * value + 16) / 116));

    const result: number[] = [
        116 * f[1] - 16, // L
        500 * (f[0] - f[1]), // a
        200 * (f[1] - f[2]), // b
    ];
    // L in range [0,100]. For use in CSS, add a percent

    if (a != null && a != 1) {
        result.push(a);
    }

    return result;
}

export function lchvalues2labvalues(l: number, c: number, h: number, a: number | null = null): number[] {
    // l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180
    const result: number[] = [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function getLABComponents(arena: AstArena, token: Token): number[] | null {
    const components: Token[] | null = getColorComponents(arena, token);

    if (components == null) {
        return null;
    }

    for (let i = 0; i < components.length; i++) {
        if (
            ![
                EnumToken.NumberTokenType,
                EnumToken.PercentageTokenType,
                EnumToken.AngleTokenType,
                EnumToken.IdenTokenType,
            ].includes(arena.dataTypes[components[i]])
        ) {
            return null;
        }
    }

    // @ts-ignore
    let t: Token = components[0];

    // @ts-ignore
    const l: number = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 100 : 1);

    // @ts-ignore
    t = components[1];

    // @ts-ignore
    const a: number = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 125 : 1);

    // @ts-ignore
    t = components[2];

    // @ts-ignore
    const b: number = getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 125 : 1);

    // @ts-ignore
    t = components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(arena, t);

    const result: number[] = [l, a, b];

    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }

    return result;
}

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// D50 LAB
export function Lab_to_sRGB(l: number, a: number, b: number): number[] {
    const xyz_d50: number[] = Lab_to_XYZ(l, a, b);
    // @ts-ignore
    const xyz_d65: number[] = XYZ_D50_to_D65(xyz_d50[0], xyz_d50[1], xyz_d50[2]);

    // @ts-ignore
    return xyz2srgb(xyz_d65[0], xyz_d65[1], xyz_d65[2]);
}

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
export function Lab_to_XYZ(l: number, a: number, b: number): number[] {
    // Convert Lab to D50-adapted XYZ
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    const k: number = 24389 / 27; // 29^3/3^3
    const e: number = 216 / 24389; // 6^3/29^3
    const f: number[] = [];

    // compute f, starting with the luminance-related term
    f[1] = (l + 16) / 116;
    f[0] = a / 500 + f[1];
    f[2] = f[1] - b / 200;

    // compute xyz
    const xyz: number[] = [
        Math.pow(f[0], 3) > e ? Math.pow(f[0], 3) : (116 * f[0] - 16) / k,
        l > k * e ? Math.pow((l + 16) / 116, 3) : l / k,
        Math.pow(f[2], 3) > e ? Math.pow(f[2], 3) : (116 * f[2] - 16) / k,
    ];

    // Compute XYZ by scaling xyz by reference white
    return xyz.map((value: number, i: number) => value * D50[i]);
}
