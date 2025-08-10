import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../parse.js';
import '../tokenize.js';
import './config.js';
import { mathFuncs } from '../../syntax/syntax.js';
import '../../syntax/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

function matchType(val, properties) {
    if (val.typ == EnumToken.IdenTokenType && properties.keywords.includes(val.val) ||
        // @ts-ignore
        (properties.types.some((t) => EnumToken[t] == val.typ))) {
        return true;
    }
    if (val.typ == EnumToken.NumberTokenType && val.val == 0) {
        // @ts-ignore
        return properties.types.some((type) => {
            // @ts-ignore
            const typ = EnumToken[type];
            return typ == EnumToken.LengthTokenType || typ == EnumToken.AngleTokenType;
        });
    }
    if (val.typ == EnumToken.FunctionTokenType) {
        if (mathFuncs.includes(val.val)) {
            return val.chi.every(((t) => [EnumToken.Add, EnumToken.Mul, EnumToken.Div, EnumToken.Sub, EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.DimensionTokenType, EnumToken.NumberTokenType, EnumToken.LengthTokenType, EnumToken.AngleTokenType, EnumToken.PercentageTokenType, EnumToken.ResolutionTokenType, EnumToken.TimeTokenType, EnumToken.BinaryExpressionTokenType].includes(t.typ) || matchType(t, properties)));
        }
        // match type defined like function 'symbols()', 'url()', 'attr()' etc.
        // return properties.types.includes((<FunctionToken>val).val + '()')
    }
    return false;
}

export { matchType };
