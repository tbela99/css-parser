import '../../parser/parse.js';
import { isRectangularOrthogonalColorspace } from '../../parser/utils/syntax.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { convert } from './color.js';
import './utils/constants.js';
import '../sourcemap/lib/encode.js';

function colorMix(colorSpace, hueInterpolationMethod, color1, percentage1, color2, percentage2) {
    if (!isRectangularOrthogonalColorspace(colorSpace)) {
        return null;
    }
    const supported = ['srgb', 'display-p3'];
    if (!supported.includes(colorSpace.val.toLowerCase())) {
        return null;
    }
    if (percentage1 == null) {
        if (percentage2 == null) {
            // @ts-ignore
            percentage1 = { typ: EnumToken.NumberTokenType, val: '.5' };
            // @ts-ignore
            percentage2 = { typ: EnumToken.NumberTokenType, val: '.5' };
        }
        else {
            if (+percentage2.val <= 0) {
                return null;
            }
            if (+percentage2.val >= 100) {
                // @ts-ignore
                percentage2 = { typ: EnumToken.NumberTokenType, val: '1' };
            }
            // @ts-ignore
            percentage1 = { typ: EnumToken.NumberTokenType, val: String(1 - percentage2.val / 100) };
        }
    }
    else {
        // @ts-ignore
        if (percentage1.val <= 0) {
            return null;
        }
        if (percentage2 == null) {
            // @ts-ignore
            if (percentage1.val >= 100) {
                // @ts-ignore
                percentage1 = { typ: EnumToken.NumberTokenType, val: '1' };
            }
            // @ts-ignore
            percentage2 = { typ: EnumToken.NumberTokenType, val: String(1 - percentage1.val / 100) };
        }
        else {
            // @ts-ignore
            if (percentage2.val <= 0) {
                return null;
            }
        }
    }
    if (colorSpace.val.localeCompare('srgb', undefined, { sensitivity: 'base' }) == 0) {
        const c1 = convert(color1, 'rgb');
        const c2 = convert(color2, 'rgb');
        if (c1 == null || c2 == null) {
            return null;
        }
        // @ts-ignore
        return { ...c1, chi: c1.chi.reduce((acc, curr, i) => {
                // @ts-ignore
                acc.push({ ...curr, val: String(percentage1.val * curr.val + percentage2.val * c2.chi[i].val) });
                return acc;
                // @ts-ignore
            }, [])
            // .concat({...percentage1, val: String((+percentage1.val + +percentage2.val) / 2)})
        };
    }
    // normalize percentages
    return null;
}

export { colorMix };
