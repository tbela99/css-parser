import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
import { ColorType, EnumToken } from "../../../ast/types.ts";
import { COLORS_NAMES } from "../../constants.ts";
import { expandHexValue } from "../hex.ts";
import { equalsIgnoreCase } from "../../../parser/utils/text.ts";

export function getColorComponents(arena: AstArena, token: Token): Token[] | null {
    if (arena.colorType[token] === ColorType.HEX || arena.colorType[token] === ColorType.LIT) {
        const val: string = arena.strings[arena.stringValue[token]];

        if (equalsIgnoreCase("currentcolor", val)) {
            return null;
        }

        const value: string = expandHexValue(
            arena.colorType[token] === ColorType.LIT ? COLORS_NAMES[val.toLowerCase()] : val,
        );
        // @ts-ignore
        return value
            .slice(1)
            .match(/([a-fA-F0-9]{2})/g)
            .map((t: string, index: number) =>
                arena.createToken(EnumToken.Number, index < 3 ? parseInt(t, 16) : parseInt(t, 16) / 255),
            );
    }

    const result: Token[] = [];

    for (let child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
        const typ: EnumToken = arena.dataTypes[child];

        if (
            typ === EnumToken.LiteralTokenType ||
            typ === EnumToken.CommentTokenType ||
            typ === EnumToken.CommaTokenType ||
            typ === EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        if (
            typ === EnumToken.FunctionTokenType ||
            typ === EnumToken.WildCardFunctionTokenType ||
            typ === EnumToken.MathFunctionTokenType
        ) {
            if ("var" === arena.strings[arena.stringValue[child]].toLowerCase()) {
                return null;
            }
        }

        if (
            typ === EnumToken.ColorTokenType &&
            equalsIgnoreCase("currentcolor", arena.strings[arena.stringValue[child]])
        ) {
            return null;
        }

        result.push(child);
    }

    return result;
}
