import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../parse.js';
import { renderToken } from '../../renderer/render.js';
import '../../renderer/color/utils/constants.js';

// https://www.w3.org/TR/css-values-4/#math-function
const funcList = ['clamp', 'calc'];
const unMappedTokensType = [EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.ImportantTokenType, EnumToken.CommentTokenType];
const numberTokenTypes = [EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.DimensionTokenType, EnumToken.AngleTokenType, EnumToken.LengthTokenType];
function compareTokens(a, b) {
    // @ts-ignore
    if (a.propertyName != b.propertyName) {
        return false;
    }
    // @ts-ignore
    if (numberTokenTypes.includes(a.typ) && numberTokenTypes.includes(b.typ) && (a.val == '0' || b.val == '0')) {
        // @ts-ignore
        return a.val == b.val;
    }
    if (a.typ != b.typ) {
        return false;
    }
    return renderToken(a) == renderToken(b);
}
function copyNodeProperties(target, source) {
    const descriptors = Object.entries(Object.getOwnPropertyDescriptors(source));
    for (const val of target) {
        if (val.typ == EnumToken.WhitespaceTokenType ||
            val.typ == EnumToken.CommaTokenType ||
            val.typ == EnumToken.ImportantTokenType ||
            val.typ == EnumToken.CommentTokenType) {
            continue;
        }
        for (const [name, property] of descriptors) {
            if (!property.enumerable) {
                Object.defineProperty(val, name, property);
            }
        }
    }
    return target;
}
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

export { compareTokens, copyNodeProperties, funcList, matchType, unMappedTokensType };
