/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { ColorType, EnumToken } from '../../../ast/types.js';
import { COLORS_NAMES } from '../../constants.js';
import { expandHexValue } from '../hex.js';
import { equalsIgnoreCase } from '../../../parser/utils/text.js';

function getColorComponents(arena, token) {
    if (arena.colorType[token] == ColorType.HEX || arena.colorType[token] == ColorType.LIT) {
        const val = arena.strings[arena.stringValue[token]];
        if (equalsIgnoreCase("currentcolor", val)) {
            return null;
        }
        const value = expandHexValue(arena.colorType[token] == ColorType.LIT ? COLORS_NAMES[val.toLowerCase()] : val);
        // @ts-ignore
        return value
            .slice(1)
            .match(/([a-fA-F0-9]{2})/g)
            .map((t, index) => arena.createToken(EnumToken.Number, index < 3 ? parseInt(t, 16) : parseInt(t, 16) / 255));
    }
    const result = [];
    for (let child = arena.firstToken[token]; child != 0; child = arena.nextSibling[child]) {
        const typ = arena.dataTypes[child];
        if (typ == EnumToken.LiteralTokenType ||
            typ == EnumToken.CommentTokenType ||
            typ == EnumToken.CommaTokenType ||
            typ == EnumToken.WhitespaceTokenType) {
            continue;
        }
        if (typ === EnumToken.FunctionTokenType ||
            typ === EnumToken.WildCardFunctionTokenType ||
            typ === EnumToken.MathFunctionTokenType) {
            if ("var" == arena.strings[arena.stringValue[child]].toLowerCase()) {
                return null;
            }
        }
        if (typ == EnumToken.ColorTokenType &&
            equalsIgnoreCase("currentcolor", arena.strings[arena.stringValue[child]])) {
            return null;
        }
        result.push(child);
    }
    return result;
}

export { getColorComponents };
