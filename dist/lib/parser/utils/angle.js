/**
 * convert angle to degrees
 * @param angle
 * @returns
 */
function toDegrees(angle) {
    switch (angle.unit) {
        // case "deg":
        //     return angle;
        case "rad":
            // @ts-expect-error
            angle.val *= 180 / Math.PI;
            angle.unit = "deg";
            return angle;
        case "grad":
            // @ts-expect-error
            angle.val *= 0.9;
            angle.unit = "deg";
            return angle;
        case "turn":
            // @ts-expect-error
            angle.val *= 360;
            angle.unit = "deg";
            return angle;
    }
    return angle;
}

export { toDegrees };
