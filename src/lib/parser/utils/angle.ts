import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../../ast/arena.ts";

/**
 * convert angle to degrees (in place)
 * @param arena
 * @param angle
 * @returns
 */
export function toDegrees(arena: AstArena, angle: Token): Token {
    switch (arena.strings[arena.unit[angle]]) {
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
