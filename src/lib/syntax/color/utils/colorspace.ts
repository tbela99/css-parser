import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
import { equalsIgnoreCase } from "../../../parser/utils/text.ts";
import { getColorComponents } from "./components.ts";

/**
 * Return the color space of the color
 * @param arena
 * @param color
 * @returns
 */
export function getColorSpace(arena: AstArena, color: Token) {
    let name: string;

    const components: number[] | null = getColorComponents(arena, color);
    if (components == null || components.length < 3) {
        return null;
    }

    if (equalsIgnoreCase("color", arena.strings[arena.stringValue[color]])) {
        if (equalsIgnoreCase("from", arena.strings[arena.stringValue[components[0]]])) {
            name = arena.strings[arena.stringValue[components[2]]];
        } else {
            name = arena.strings[arena.stringValue[components[0]]];
        }
    } else if (equalsIgnoreCase("color-mix", arena.strings[arena.stringValue[color]])) {
        if (equalsIgnoreCase("in", arena.strings[arena.stringValue[components[0]]])) {
            name = arena.strings[arena.stringValue[components[1]]];
        } else {
            return "oklab";
        }
    } else {
        name = arena.strings[arena.stringValue[color]];
    }

    return name! === "device-cmyk"
        ? "cmyk"
        : name!.startsWith("xyz")
          ? "xyz"
          : ["srgb", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020", "rgb"].some((t) =>
                  equalsIgnoreCase(t, name),
              )
            ? "rgb"
            : name!.slice(-3);
}
