import { EnumToken } from '../../ast/types.js';
import '../parse.js';
import '../../renderer/utils/color.js';

const funcList = ['clamp', 'calc'];
function matchType(val, properties) {
    if (val.typ == EnumToken.IdenTokenType && properties.keywords.includes(val.val) ||
        // @ts-ignore
        (properties.types.some((t) => EnumToken[t] == val.typ))) {
        return true;
    }
    if (val.typ == EnumToken.NumberTokenType && val.val == '0') {
        // @ts-ignore
        return properties.types.some((type) => {
            // @ts-ignore
            const typ = EnumToken[type];
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType;
        });
    }
    if (val.typ == EnumToken.FunctionTokenType && funcList.includes(val.val)) {
        return val.chi.every((t => [EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType].includes(t.typ) || matchType(t, properties)));
    }
    return false;
}

export { funcList, matchType };
