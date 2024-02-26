import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../parse.js';
import '../../renderer/color/color.js';
import '../../renderer/sourcemap/lib/encode.js';

// https://www.w3.org/TR/css-values-4/#math-function
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
    if (val.typ == EnumToken.FunctionTokenType) {
        if (funcList.includes(val.val)) {
            return val.chi.every(((t) => [EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType].includes(t.typ) || matchType(t, properties)));
        }
        // match type defined like function 'symbols()', 'url()', 'attr()' etc.
        // return properties.types.includes((<FunctionToken>val).val + '()')
    }
    return false;
}

export { funcList, matchType };
