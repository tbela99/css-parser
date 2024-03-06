import {rec20202lsrgb, lsrgb2srgb} from "./srgb";

export function rec20202srgb(r: number, g: number, b: number, a: number | null = null): number[] {

    // @ts-ignore
    return lsrgb2srgb(...rec20202lsrgb(r, g, b, a));
}