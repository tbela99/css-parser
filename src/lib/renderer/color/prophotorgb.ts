import {prophotoRgb2lsrgb, lsrgb2srgb} from "./srgb";

export function prophotoRgb2srgbvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    // @ts-ignore
    return lsrgb2srgb(...prophotoRgb2lsrgb(r, g, b, a))
}