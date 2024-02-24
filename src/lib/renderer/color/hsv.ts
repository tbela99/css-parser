

export function hwb2hsv(h: number, w: number, b: number): [number, number, number]{

    return [h, 1 - w/(1 - b), 1 -b];
}

// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js

export function hsl2hsv(h: number,s: number,l: number): [number, number, number] {
    s*=l<.5?l:1-l;

    return[ //[hue, saturation, value]
        //Range should be between 0 - 1

        h, //Hue stays the same
        2*s/(l+s), //Saturation
        l+s //Value
    ]
}
