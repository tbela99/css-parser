import { hsl2hsv } from './hsv.js';

function rgb2hue(r, g, b, fallback = 0) {
    let value = rgb2value(r, g, b);
    let whiteness = rgb2whiteness(r, g, b);
    let delta = value - whiteness;
    if (delta > 0) {
        // calculate segment
        let segment = value === r ? (g - b) / delta : (value === g
            ? (b - r) / delta
            : (r - g) / delta);
        // calculate shift
        let shift = value === r ? segment < 0
            ? 360 / 60
            : 0 / 60 : (value === g
            ? 120 / 60
            : 240 / 60);
        // calculate hue
        return (segment + shift) * 60;
    }
    return fallback;
}
function rgb2value(r, g, b) {
    return Math.max(r, g, b);
}
function rgb2whiteness(r, g, b) {
    return Math.min(r, g, b);
}
function rgb2hwb(r, g, b, a = null, fallback = 0) {
    r *= 100 / 255;
    g *= 100 / 255;
    b *= 100 / 255;
    let hue = rgb2hue(r, g, b, fallback);
    let whiteness = rgb2whiteness(r, g, b);
    let value = Math.round(rgb2value(r, g, b));
    let blackness = 100 - value;
    const result = [hue / 360, whiteness / 100, blackness / 100];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hsv2hwb(h, s, v) {
    return [h, (1 - s) * v, 1 - v];
}
function hsl2hwb(h, s, l) {
    return hsv2hwb(...hsl2hsv(h, s, l));
}

export { hsl2hwb, hsv2hwb, rgb2hwb };
