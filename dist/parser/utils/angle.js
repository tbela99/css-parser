/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
/**
 * convert angle to degrees (in place)
 * @param arena
 * @param angle
 * @returns
 */
function toDegrees(arena, angle) {
    switch (arena.resolveString(arena.unit[angle])) {
        // case "deg":
        //     return angle;
        case "rad":
            arena.numericValue[angle] *= 180 / Math.PI;
            arena.unit[angle] = arena.internString("deg");
            return angle;
        case "grad":
            arena.numericValue[angle] *= 0.9;
            arena.unit[angle] = arena.internString("deg");
            return angle;
        case "turn":
            arena.numericValue[angle] *= 360;
            arena.unit[angle] = arena.internString("deg");
            return angle;
    }
    return angle;
}

export { toDegrees };
