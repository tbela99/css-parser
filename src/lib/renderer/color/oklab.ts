import {multiplyMatrices} from "./utils";
import {XYZ_to_sRGB} from "./xyz";

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
export function OKLab_to_sRGB(l: number, a: number, b: number): number[] {

    // @ts-ignore
    return  XYZ_to_sRGB(...OKLab_to_XYZ(l, a, b));
}


export function OKLab_to_XYZ(l: number, a: number, b: number): number[] {

    // Given OKLab, convert to XYZ relative to D65
    const LMStoXYZ: number[][] =  [
        [  1.2268798733741557,  -0.5578149965554813,   0.28139105017721583 ],
        [ -0.04057576262431372,  1.1122868293970594,  -0.07171106666151701 ],
        [ -0.07637294974672142, -0.4214933239627914,   1.5869240244272418  ]
    ];
    const OKLabtoLMS: number[][] = [
        [ 0.99999999845051981432,  0.39633779217376785678,   0.21580375806075880339  ],
        [ 1.0000000088817607767,  -0.1055613423236563494,   -0.063854174771705903402 ],
        [ 1.0000000546724109177,  -0.089484182094965759684, -1.2914855378640917399   ]
    ];

    const LMSnl: number[] = multiplyMatrices(OKLabtoLMS, [l, a, b]);
    return multiplyMatrices(LMStoXYZ, LMSnl.map((c: number) => c ** 3));
}