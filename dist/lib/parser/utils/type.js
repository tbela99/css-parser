import { EnumToken } from '../../ast/types.js';
import { tokensfuncSet } from '../../syntax/constants.js';
import { isColor } from '../../syntax/syntax.js';

function matchType(val, properties) {
    if ((val.typ === EnumToken.IdenTokenType && properties.keywords.includes(val.val)) ||
        properties.types.some(
        // @ts-expect-error
        (t) => 
        // @ts-expect-error
        (val.typ === EnumToken.IdenTokenType && EnumToken[t] === EnumToken.ColorTokenType && isColor(val)) ||
            // @ts-expect-error
            EnumToken[t] === val.typ)) {
        return true;
    }
    if (val.typ === EnumToken.NumberTokenType && val.val === 0) {
        // @ts-ignore
        return properties.types.some((type) => {
            // @ts-ignore
            const typ = EnumToken[type];
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType;
        });
    }
    if (tokensfuncSet.has(val.typ) && val.typ === EnumToken.MathFunctionTokenType) {
        return val.chi.every((t) => [
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
        ].includes(t.typ) || matchType(t, properties));
    }
    return false;
}

export { matchType };
