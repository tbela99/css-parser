import {hwb2hsv} from "./hsv";

export function rgb2hsl(r: number, g: number, b: number, a?: number | null): [number, number, number, number | null] {

    r /= 255;
    g /= 255;
    b /= 255;

    let max: number = Math.max(r, g, b);
    let min: number = Math.min(r, g, b);
    let h: number = 0;
    let s: number = 0;
    let l: number = (max + min) / 2;

    if (max != min) {
        let d: number = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [ h, s, l, a == 1 ? null : a ?? null ];
}

// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
export function hsv2hsl(h: number,s: number,v: number): [number, number, number] {
    return[
        //[hue, saturation, lightness]
        //Range should be between 0 - 1
        h, //Hue stays the same

        //Saturation is very different between the two color spaces
        //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
        //Otherwise sat*val/(2-(2-sat)*val)
        //Conditional is not operating with hue, it is reassigned!
        s*v/((h=(2-s)*v)<1?h:2-h),

        h/2 //Lightness is (2-sat)*val/2
        //See reassignment of hue above
    ]
}


export function hwb2hsl(h: number, w: number, b: number): [number, number, number] {

    return hsv2hsl(...hwb2hsv(h, w, b));
}