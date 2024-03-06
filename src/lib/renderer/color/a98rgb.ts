import {a982lrgb, lsrgb2srgb} from "./srgb";

export function a98rgb2srgbvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    //  @ts-ignore
    return lsrgb2srgb(...a982lrgb(r, g, b, a));
}