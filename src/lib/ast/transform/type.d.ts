export declare type Point = [number, number, number];
export declare type Matrix = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
];

export interface DecomposedMatrix3D {
    skew: [number, number, number];
    scale: [number, number, number];
    rotate: [number, number, number, number];
    translate: [number, number, number];
    perspective: [number, number, number, number];
}