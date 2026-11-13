/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { EnumToken, ColorType } from '../../../ast/types.js';
import { equalsIgnoreCase } from '../../../parser/utils/text.js';
import { minmax, getNumber } from '../color.js';

/**
 * Create a color token
 * @param arena
 * @param kind
 * @param components
 * @param alpha
 * @returns
 */
function makeColor(arena, kind, components, alpha) {
    if (components.length < 3) {
        return null;
    }
    const alphaValue = alpha == null
        ? 1
        : arena.dataTypes[alpha] === EnumToken.IdenTokenType && equalsIgnoreCase(arena.strings[arena.stringValue[alpha]], "none")
            ? 0
            : minmax(getNumber(arena, alpha), 0, 1);
    components.length = 3;
    // the components may belong to another color token: a token belongs to one token list
    for (let i = 0; i < components.length; i++) {
        // inlined: arena.take(components[i])
        components[i] = arena.parents[components[i]] == 0 ? components[i] : arena.clone(components[i], true);
    }
    if (alphaValue !== 1) {
        components.push(arena.createToken(EnumToken.NumberTokenType, alphaValue));
    }
    if (kind === ColorType.LIT || kind === ColorType.HEX) {
        const val = "#" +
            components.reduce((acc, token, index) => {
                let value = getNumber(arena, token);
                if (index === 3) {
                    value *= 255;
                }
                return acc + Math.round(value).toString(16).padStart(2, "0");
            }, "");
        return arena.createColor(val, ColorType.HEX);
    }
    const hasAlpha = components.length === 4;
    let i = components.length;
    while (--i > 0) {
        components.splice(i, 0, arena.createToken(EnumToken.WhitespaceTokenType));
    }
    if (hasAlpha) {
        components[components.length - 2] = arena.createToken(EnumToken.LiteralTokenType, "/");
    }
    return arena.createColor(ColorType[kind].toLowerCase(), kind, components);
}

export { makeColor };
