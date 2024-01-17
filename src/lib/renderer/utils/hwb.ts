import {hsl2hsv} from "./hsv";

function rgb2hue(r: number, g: number, b: number, fallback: number = 0) {

    let value: number = rgb2value(r, g, b);
    let whiteness: number = rgb2whiteness(r, g, b);

    let delta: number = value - whiteness;

    if (delta > 0) {

        // calculate segment
        let segment: number = value === r ? (g - b) / delta : (value === g
            ? (b - r) / delta
            : (r - g) / delta);

        // calculate shift
        let shift: number = value === r ? segment < 0
            ? 360 / 60
            : 0 / 60 : (value === g
            ? 120 / 60
            : 240 / 60);

        // calculate hue
        return (segment + shift) * 60;
    }

    return fallback;
}

function rgb2value(r: number, g: number, b: number): number {
    return Math.max(r, g, b);
}

function rgb2whiteness(r: number, g: number, b: number): number {

    return Math.min(r, g, b);
}

export function rgb2hwb(r: number, g: number, b: number, a: number | null = null, fallback: number = 0): number[] {

    r *= 100 / 255;
    g *= 100 / 255;
    b *= 100 / 255;

    let hue: number = rgb2hue(r, g, b, fallback);
    let whiteness: number = rgb2whiteness(r, g, b);
    let value: number = Math.round(rgb2value(r, g, b));
    let blackness: number = 100 - value;

    const result: number[] = [hue / 360, whiteness / 100, blackness / 100];

    if (a != null) {
        result.push(a);
    }

    return result;
}


export function hsv2hwb(h: number, s: number, v: number): number[] {

    return [h, (1 - s) * v, 1 - v];
}

export function hsl2hwb(h: number, s: number, l: number): number[] {

    return hsv2hwb(...hsl2hsv(h, s, l));
}