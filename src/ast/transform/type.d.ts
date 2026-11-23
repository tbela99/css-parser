/**
 * 4x4 matrix, column-major order
 */
export declare type Matrix = Float64Array;

/**
 * decomposition of a 3d matrix (see `decompose()`): translate → rotate → skew → scale
 */
export interface DecomposedMatrix3D {
    translateX: number;
    translateY: number;
    translateZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    skewXY: number;
    skewXZ: number;
    skewYZ: number;
    /**
     * rotation axis
     */
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    /**
     * rotation angle in degrees
     */
    rotateAngle: number;
    perspectiveX: number;
    perspectiveY: number;
    perspectiveZ: number;
    perspectiveW: number;
}
