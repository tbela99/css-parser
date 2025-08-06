import type {ColorToken} from "../../../../@types/index.d.ts";
import {convertColor} from "../color.ts";
import {getOKLABComponents} from "../oklab.ts";
import {ColorType} from "../../../ast/index.ts";


export function okLabDistance(okLab1: [number, number, number], okLab2: [number, number, number]): number {

    return Math.sqrt(Math.pow(okLab1[0] - okLab2[0], 2) + Math.pow(okLab1[1] - okLab2[1], 2) + Math.pow(okLab1[2] - okLab2[2], 2));
}

export function isOkLabClose(color1: ColorToken, color2: ColorToken, threshold: number = 2.3): boolean {

    color1 = convertColor(color1, ColorType.OKLAB) as ColorToken;
    color2 = convertColor(color2, ColorType.OKLAB ) as ColorToken;

    // console.error(JSON.stringify({color1, color2}, null, 1));

    if (color1 == null || color2 == null) {
        return false;
    }

    const okLab1: [number, number, number] = getOKLABComponents(color1) as [number, number, number];
    const okLab2: [number, number, number] = getOKLABComponents(color2) as [number, number, number];

    if (okLab1 == null || okLab2 == null) {
        return false;
    }

    return okLabDistance(okLab1, okLab2) < threshold;
}