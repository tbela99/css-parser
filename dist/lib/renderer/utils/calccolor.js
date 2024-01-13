import { COLORS_NAMES } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { reduceNumber } from '../render.js';

function parseRelativeColor(original, rExp, gExp, bExp, aExp) {
    let r;
    let g;
    let b;
    let a = null;
    let keys = {};
    let values = {};
    // console.debug(original);
    switch (original.kin) {
        case 'lit':
        case 'hex':
            let value = original.val.toLowerCase();
            if (original.kin == 'lit') {
                if (original.val.toLowerCase() in COLORS_NAMES) {
                    value = COLORS_NAMES[original.val.toLowerCase()];
                }
                else {
                    return null;
                }
            }
            if (value.length == 4) {
                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
            }
            else if (value.length == 5) {
                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3] + value[4] + value[4];
            }
            r = parseInt(value.slice(1, 3), 16);
            g = parseInt(value.slice(3, 5), 16);
            b = parseInt(value.slice(5, 7), 16);
            a = value.length == 9 ? parseInt(value.slice(7, 9), 16) : null;
            keys = (a == null ? { r: rExp, g: gExp, b: bExp } : {
                r: rExp,
                g: gExp,
                b: bExp,
                a: aExp
            });
            values = (a == null ? { r, g, b } : { r, g, b, a });
            break;
        default:
            return null;
    }
    return computeComponentValue(keys, values);
}
function computeComponentValue(expr, values) {
    for (const [key, exp] of Object.entries(expr)) {
        // if (exp == null) {
        //
        //     continue;
        // }
        if ([EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.LengthTokenType].includes(exp.typ)) ;
        else if (exp.typ == EnumToken.IdenTokenType && exp.val in values) {
            if (typeof values[exp.val] == 'number') {
                expr[exp.val] = {
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(values[exp.val])
                };
            }
        }
    }
    return expr;
}

export { parseRelativeColor };
