import type { AstArena } from "../../ast/arena.ts";
import type { Token } from "../../@types/index.d.ts";
export declare function srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function rgb2srgb(arena: AstArena, token: Token): number[] | null;
export declare function rgb2srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function hex2srgbvalues(arena: AstArena, token: Token): number[];
export declare function xyz2srgb(x: number, y: number, z: number, alpha?: number | null): number[];
export declare function hwb2srgbvalues(arena: AstArena, token: Token): number[] | null;
/**
 * convert hwb to sRGB
 */
export declare function hwb2srgb(h: number, w: number, b: number, alpha?: number): [number, number, number] | [number, number, number, number];
export declare function hsl2srgb(arena: AstArena, token: Token): number[] | null;
export declare function cmyk2srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function oklab2srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function oklch2srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function hslvalues(arena: AstArena, token: Token): {
    h: number;
    s: number;
    l: number;
    a?: number | null;
} | null;
export declare function hslvalues2srgbvalues(h: number, s: number, l: number, a?: number | null): number[];
export declare function lab2srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function lch2srgbvalues(arena: AstArena, token: Token): number[] | null;
export declare function srgb2lsrgbvalues(r: number, g: number, b: number, a?: number | null): number[];
export declare function lsrgb2srgbvalues(r: number, g: number, b: number, alpha?: number | null): number[];
