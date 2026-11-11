/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { tokensfuncSet } from '../../syntax/constants.js';
import { isColor } from '../../syntax/syntax.js';

const mathTokenTypes = [
    EnumToken.Add,
    EnumToken.Mul,
    EnumToken.Div,
    EnumToken.Sub,
    EnumToken.LiteralTokenType,
    EnumToken.CommaTokenType,
    EnumToken.WhitespaceTokenType,
    EnumToken.DimensionTokenType,
    EnumToken.NumberTokenType,
    EnumToken.LengthTokenType,
    EnumToken.AngleTokenType,
    EnumToken.PercentageTokenType,
    EnumToken.ResolutionTokenType,
    EnumToken.TimeTokenType,
    EnumToken.BinaryExpressionTokenType,
];
/**
 * check if a token matches a shorthand property type
 * @param arena
 * @param val
 * @param properties
 */
function matchType(arena, val, properties) {
    const typ = arena.dataTypes[val];
    if ((typ === EnumToken.IdenTokenType && properties.keywords.includes(arena.strings[arena.stringValue[val]])) ||
        properties.types.some(
        // @ts-expect-error
        (t) => 
        // @ts-expect-error
        (typ === EnumToken.IdenTokenType && EnumToken[t] === EnumToken.ColorTokenType && isColor(arena, val)) ||
            // @ts-expect-error
            EnumToken[t] === typ)) {
        return true;
    }
    if (typ === EnumToken.NumberTokenType && arena.numericValue[val] === 0) {
        // @ts-ignore
        return properties.types.some((type) => {
            // @ts-ignore
            const typ = EnumToken[type];
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType;
        });
    }
    if (tokensfuncSet.has(typ) && typ === EnumToken.MathFunctionTokenType) {
        for (let t = arena.firstToken[val]; t != 0; t = arena.nextSibling[t]) {
            if (!mathTokenTypes.includes(arena.dataTypes[t]) && !matchType(arena, t, properties)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

export { matchType };
