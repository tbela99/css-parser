import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
import { ColorType } from "../../../ast/types.ts";

/**
 * Return the color type of the color components
 * @param arena
 * @param color
 */
export function getColorType(arena: AstArena, color: Token): ColorType | null {
    if (arena.colorType[color] === ColorType.COLOR_MIX || arena.strings[arena.unit[color]] === "rel") {
        const token: Token | null = arena.getTokenAt(color, 2);

        if (token == null) {
            return null;
        }

        return arena.colorType[color] === ColorType.COLOR_MIX
            ? (ColorType[
                  arena.strings[arena.stringValue[token]]
                      ?.toUpperCase?.()
                      ?.replace?.("-", "_") as keyof typeof ColorType
              ] as ColorType)
            : getColorType(arena, token);
    }

    return arena.colorType[color];
}
