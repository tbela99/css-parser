import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../parser/tokenize.js';
import '../parser/utils/config.js';
import './color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';

function length2Px(value) {
    let result = null;
    if (value.typ == EnumToken.NumberTokenType) {
        result = +value.val;
    }
    else {
        switch (value.unit) {
            case 'cm':
                // @ts-ignore
                result = value.val * 37.8;
                break;
            case 'mm':
                // @ts-ignore
                result = value.val * 3.78;
                break;
            case 'Q':
                // @ts-ignore
                result = value.val * 37.8 / 40;
                break;
            case 'in':
                // @ts-ignore
                result = value.val / 96;
                break;
            case 'pc':
                // @ts-ignore
                result = value.val / 16;
                break;
            case 'pt':
                // @ts-ignore
                result = value.val * 4 / 3;
                break;
            case 'px':
                result = +value.val;
                break;
        }
    }
    return isNaN(result) ? null : result;
}
/**
 * minify number
 * @param val
 */
function minifyNumber(val) {
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

export { length2Px, minifyNumber };
