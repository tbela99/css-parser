import { EnumToken, ColorType } from '../../../ast/types.js';
import { walkValues } from '../../../ast/walk.js';
import { COLORS_NAMES } from '../../constants.js';
import { expandHexValue } from '../hex.js';
import { isColor, parseColor } from '../../syntax.js';
import { equalsIgnoreCase } from '../../../parser/utils/text.js';

function getColorComponents(token) {
    if (token.typ === EnumToken.IdenTokenType) {
        if (isColor(token)) {
            parseColor(token);
        }
        else {
            return null;
        }
    }
    if (token.kin == ColorType.HEX || token.kin == ColorType.LIT) {
        if (equalsIgnoreCase('currentcolor', token.val)) {
            return null;
        }
        const value = expandHexValue(token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
        // @ts-ignore
        return value
            .slice(1)
            .match(/([a-fA-F0-9]{2})/g)
            .map((t, index) => {
            return { typ: EnumToken.Number, val: index < 3 ? parseInt(t, 16) : parseInt(t, 16) / 255 };
        });
    }
    const result = [];
    for (const child of token.chi) {
        if ([
            EnumToken.LiteralTokenType,
            EnumToken.CommentTokenType,
            EnumToken.CommaTokenType,
            EnumToken.WhitespaceTokenType,
        ].includes(child.typ)) {
            continue;
        }
        if (child.typ === EnumToken.IdenTokenType && isColor(child)) {
            parseColor(child);
        }
        if (child.typ === EnumToken.FunctionTokenType ||
            child.typ === EnumToken.WildCardFunctionTokenType ||
            child.typ === EnumToken.MathFunctionTokenType) {
            if ("var" == child.val.toLowerCase()) {
                return null;
            }
            else {
                for (const { value } of walkValues(child.chi)) {
                    if (value.typ == EnumToken.WildCardFunctionTokenDefType &&
                        "var" === value.val.toLowerCase()) {
                        return null;
                    }
                }
            }
        }
        if (child.typ == EnumToken.ColorTokenType && equalsIgnoreCase("currentcolor", child.val)) {
            return null;
        }
        result.push(child);
    }
    return result;
}

export { getColorComponents };
