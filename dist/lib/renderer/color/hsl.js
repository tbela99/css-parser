import { hwb2hsv } from './hsv.js';
import { getNumber } from './color.js';
import { hslvalues } from './rgb.js';
import { getComponents } from './utils/components.js';

function rgb2hsl(token) {
    const chi = getComponents(token);
    // @ts-ignore
    let t = chi[0];
    // @ts-ignore
    let r = getNumber(t);
    // @ts-ignore
    t = chi[1];
    // @ts-ignore
    let g = getNumber(t);
    // @ts-ignore
    t = chi[2];
    // @ts-ignore
    let b = getNumber(t);
    // @ts-ignore
    t = chi[3];
    // @ts-ignore
    let a = null;
    if (t != null) {
        // @ts-ignore
        a = getNumber(t) / 255;
    }
    return rgb2hslvalues(r, g, b, a);
}
// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
function hsv2hsl(h, s, v, a) {
    return [
        //[hue, saturation, lightness]
        //Range should be between 0 - 1
        h, //Hue stays the same
        //Saturation is very different between the two color spaces
        //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
        //Otherwise sat*val/(2-(2-sat)*val)
        //Conditional is not operating with hue, it is reassigned!
        s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h),
        h / 2, //Lightness is (2-sat)*val/2
        //See reassignment of hue above,
        // @ts-ignore
        a
    ];
}
function hwb2hsl(token) {
    // @ts-ignore
    return hsv2hsl(...hwb2hsv(...Object.values(hslvalues(token))));
}
function rgb2hslvalues(r, g, b, a = null) {
    r /= 255;
    g /= 255;
    b /= 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    if (max != min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    const hsl = [h, s, l];
    if (a != null && a < 1) {
        // @ts-ignore
        return hsl.concat([a]);
    }
    // @ts-ignore
    return hsl;
}

export { hsv2hsl, hwb2hsl, rgb2hsl, rgb2hslvalues };
