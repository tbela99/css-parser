import { funcLike, ColorKind } from '../../renderer/color/utils/constants.js';
import { EnumToken } from '../types.js';
import '../minify.js';
import '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import '../../renderer/sourcemap/lib/encode.js';
import { minmax } from '../../renderer/color/color.js';

function reduceNumber(val) {
    val = String(+val);
    if (val === '0') {
        return '0';
    }
    const chr = val.charAt(0);
    if (chr == '-') {
        const slice = val.slice(0, 2);
        if (slice == '-0') {
            return val.length == 2 ? '0' : '-' + val.slice(2);
        }
    }
    if (chr == '0') {
        return val.slice(1);
    }
    return val;
}
/**
 * clamp color values
 * @param token
 */
function clamp(token) {
    if (token.kin == ColorKind.RGB || token.kin == ColorKind.RGBA) {
        token.chi.filter((token) => ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(token.typ)).forEach((token, index) => {
            if (index <= 2) {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 255));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100));
                }
            }
            else {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 1));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100));
                }
            }
        });
    }
    return token;
}
function getNumber(token) {
    if (token.typ == EnumToken.IdenTokenType && token.val == 'none') {
        return 0;
    }
    // @ts-ignore
    return token.typ == EnumToken.PercentageTokenType ? token.val / 100 : +token.val;
}
/**
 * convert angle to turn
 * @param token
 */
function getAngle(token) {
    if (token.typ == EnumToken.IdenTokenType) {
        if (token.val == 'none') {
            return 0;
        }
    }
    if (token.typ == EnumToken.AngleTokenType) {
        switch (token.unit) {
            case 'deg':
                // @ts-ignore
                return token.val / 360;
            case 'rad':
                // @ts-ignore
                return token.val / (2 * Math.PI);
            case 'grad':
                // @ts-ignore
                return token.val / 400;
            case 'turn':
                // @ts-ignore
                return +token.val;
        }
    }
    // @ts-ignore
    return token.val / 360;
}
function filterValues(values) {
    let i = 0;
    for (; i < values.length; i++) {
        if (values[i].typ == EnumToken.ImportantTokenType && values[i - 1]?.typ == EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        }
        else if (funcLike.includes(values[i].typ) && !['var', 'calc'].includes(values[i].val) && values[i + 1]?.typ == EnumToken.WhitespaceTokenType) {
            values.splice(i + 1, 1);
        }
    }
    return values;
}

export { clamp, filterValues, getAngle, getNumber, reduceNumber };
