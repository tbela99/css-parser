import { colorsFunc } from '../renderer/render.js';
import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../parser/utils/config.js';
import { COLORS_NAMES } from '../renderer/color/utils/constants.js';

// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
// '\\'
const REVERSE_SOLIDUS = 0x5c;
const dimensionUnits = new Set([
    'q', 'cap', 'ch', 'cm', 'cqb', 'cqh', 'cqi', 'cqmax', 'cqmin', 'cqw', 'dvb',
    'dvh', 'dvi', 'dvmax', 'dvmin', 'dvw', 'em', 'ex', 'ic', 'in', 'lh', 'lvb',
    'lvh', 'lvi', 'lvmax', 'lvw', 'mm', 'pc', 'pt', 'px', 'rem', 'rlh', 'svb',
    'svh', 'svi', 'svmin', 'svw', 'vb', 'vh', 'vi', 'vmax', 'vmin', 'vw'
]);
const fontFormat = ['collection', 'embedded-opentype', 'opentype', 'svg', 'truetype', 'woff', 'woff2'];
const colorFontTech = ['color-colrv0', 'color-colrv1', 'color-svg', 'color-sbix', 'color-cbdt'];
const fontFeaturesTech = ['features-opentype', 'features-aat', 'features-graphite', 'incremental-patch', 'incremental-range', 'incremental-auto', 'variations', 'palettes'];
// https://drafts.csswg.org/mediaqueries/#media-types
const mediaTypes = ['all', 'print', 'screen',
    /* deprecated */
    'aural', 'braille', 'embossed', 'handheld', 'projection', 'tty', 'tv', 'speech'];
// https://www.w3.org/TR/css-values-4/#math-function
const mathFuncs = ['calc', 'clamp', 'min', 'max', 'round', 'mod', 'rem', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'sqrt', 'hypot', 'log', 'exp', 'abs', 'sign'];
function isLength(dimension) {
    return 'unit' in dimension && dimensionUnits.has(dimension.unit.toLowerCase());
}
function isResolution(dimension) {
    return 'unit' in dimension && ['dpi', 'dpcm', 'dppx', 'x'].includes(dimension.unit.toLowerCase());
}
function isAngle(dimension) {
    return 'unit' in dimension && ['rad', 'turn', 'deg', 'grad'].includes(dimension.unit.toLowerCase());
}
function isTime(dimension) {
    return 'unit' in dimension && ['ms', 's'].includes(dimension.unit.toLowerCase());
}
function isFrequency(dimension) {
    return 'unit' in dimension && ['hz', 'khz'].includes(dimension.unit.toLowerCase());
}
function isColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['srgb', 'srgb-linear', 'lab', 'oklab', 'lch', 'oklch', 'xyz', 'xyz-d50', 'xyz-d65', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'rgb', 'hsl', 'hwb'].includes(token.val.toLowerCase());
}
function isRectangularOrthogonalColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'lab', 'oklab', 'xyz', 'xyz-d50', 'xyz-d65'].includes(token.val.toLowerCase());
}
function isPolarColorspace(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['hsl', 'hwb', 'lch', 'oklch'].includes(token.val);
}
function isHueInterpolationMethod(token) {
    if (token.typ != EnumToken.IdenTokenType) {
        return false;
    }
    return ['shorter', 'longer', 'increasing', 'decreasing'].includes(token.val);
}
function isColor(token) {
    if (token.typ == EnumToken.ColorTokenType) {
        return true;
    }
    if (token.typ == EnumToken.IdenTokenType) {
        // named color
        return token.val.toLowerCase() in COLORS_NAMES;
    }
    let isLegacySyntax = false;
    if (token.typ == EnumToken.FunctionTokenType && token.chi.length > 0 && colorsFunc.includes(token.val)) {
        if (token.val == 'light-dark') {
            const children = token.chi.filter((t) => [EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.LiteralTokenType, EnumToken.ColorTokenType, EnumToken.FunctionTokenType, EnumToken.PercentageTokenType].includes(t.typ));
            if (children.length != 2) {
                return false;
            }
            if (isColor(children[0]) && isColor(children[1])) {
                return true;
            }
        }
        if (token.val == 'color') {
            const children = token.chi.filter((t) => [EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.LiteralTokenType, EnumToken.ColorTokenType, EnumToken.FunctionTokenType, EnumToken.PercentageTokenType].includes(t.typ));
            const isRelative = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'from';
            if (children.length < 4 || children.length > 8) {
                return false;
            }
            if (!isRelative && !isColorspace(children[0])) {
                return false;
            }
            for (let i = 1; i < children.length - 2; i++) {
                if (children[i].typ == EnumToken.IdenTokenType) {
                    if (children[i].val != 'none' &&
                        !(isRelative && ['alpha', 'r', 'g', 'b', 'x', 'y', 'z'].includes(children[i].val) || isColorspace(children[i]))) {
                        return false;
                    }
                }
                if (children[i].typ == EnumToken.FunctionTokenType && !mathFuncs.includes(children[i].val)) {
                    return false;
                }
            }
            if (children.length == 4 || (isRelative && children.length == 6)) {
                return true;
            }
            if (children.length == 8 || children.length == 6) {
                const sep = children.at(-2);
                const alpha = children.at(-1);
                // @ts-ignore
                if ((children.length > 6 || !isRelative) && sep.typ != EnumToken.LiteralTokenType || sep.val != '/') {
                    return false;
                }
                if (alpha.typ == EnumToken.IdenTokenType && alpha.val != 'none') {
                    return false;
                }
                else {
                    // @ts-ignore
                    if (alpha.typ == EnumToken.PercentageTokenType) {
                        if (+alpha.val < 0 || +alpha.val > 100) {
                            return false;
                        }
                    }
                    else if (alpha.typ == EnumToken.NumberTokenType) {
                        if (+alpha.val < 0 || +alpha.val > 1) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        else if (token.val == 'color-mix') {
            const children = token.chi.reduce((acc, t) => {
                if (t.typ == EnumToken.CommaTokenType) {
                    acc.push([]);
                }
                else {
                    if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ)) {
                        acc[acc.length - 1].push(t);
                    }
                }
                return acc;
            }, [[]]);
            if (children.length == 3) {
                if (children[0].length > 3 ||
                    children[0][0].typ != EnumToken.IdenTokenType ||
                    children[0][0].val != 'in' ||
                    !isColorspace(children[0][1]) ||
                    (children[0].length == 3 && !isHueInterpolationMethod(children[0][2])) ||
                    children[1].length > 2 ||
                    children[1][0].typ != EnumToken.ColorTokenType ||
                    children[2].length > 2 ||
                    children[2][0].typ != EnumToken.ColorTokenType) {
                    return false;
                }
                if (children[1].length == 2) {
                    if (!(children[1][1].typ == EnumToken.PercentageTokenType || (children[1][1].typ == EnumToken.NumberTokenType && children[1][1].val == '0'))) {
                        return false;
                    }
                }
                if (children[2].length == 2) {
                    if (!(children[2][1].typ == EnumToken.PercentageTokenType || (children[2][1].typ == EnumToken.NumberTokenType && children[2][1].val == '0'))) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        else {
            const keywords = ['from', 'none'];
            if (['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch'].includes(token.val)) {
                keywords.push('alpha', ...token.val.slice(-3).split(''));
            }
            // @ts-ignore
            for (const v of token.chi) {
                if (v.typ == EnumToken.CommaTokenType) {
                    isLegacySyntax = true;
                }
                if (v.typ == EnumToken.IdenTokenType) {
                    if (!(keywords.includes(v.val) || v.val.toLowerCase() in COLORS_NAMES)) {
                        return false;
                    }
                    if (keywords.includes(v.val)) {
                        if (isLegacySyntax) {
                            return false;
                        }
                        if (v.val == 'from' && ['rgba', 'hsla'].includes(token.val)) {
                            return false;
                        }
                    }
                    continue;
                }
                if (v.typ == EnumToken.FunctionTokenType && (mathFuncs.includes(v.val) || v.val == 'var' || colorsFunc.includes(v.val))) {
                    continue;
                }
                if (![EnumToken.ColorTokenType, EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.AngleTokenType, EnumToken.PercentageTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType].includes(v.typ)) {
                    return false;
                }
            }
        }
        return true;
    }
    return false;
}
function isLetter(codepoint) {
    // lowercase
    return (codepoint >= 0x61 && codepoint <= 0x7a) ||
        // uppercase
        (codepoint >= 0x41 && codepoint <= 0x5a);
}
function isNonAscii(codepoint) {
    return codepoint >= 0x80;
}
function isIdentStart(codepoint) {
    // _
    return codepoint == 0x5f || isLetter(codepoint) || isNonAscii(codepoint) || codepoint == REVERSE_SOLIDUS;
}
function isDigit(codepoint) {
    return codepoint >= 0x30 && codepoint <= 0x39;
}
function isIdentCodepoint(codepoint) {
    // -
    return codepoint == 0x2d || isDigit(codepoint) || isIdentStart(codepoint);
}
function isIdent(name) {
    const j = name.length - 1;
    let i = 0;
    let codepoint = name.charCodeAt(0);
    // -
    if (codepoint == 0x2d) {
        const nextCodepoint = name.charCodeAt(1);
        if (Number.isNaN(nextCodepoint)) {
            return false;
        }
        // -
        if (nextCodepoint == 0x2d) {
            return true;
        }
        if (nextCodepoint == REVERSE_SOLIDUS) {
            return name.length > 2 && !isNewLine(name.charCodeAt(2));
        }
        return true;
    }
    if (!isIdentStart(codepoint)) {
        return false;
    }
    if (codepoint == REVERSE_SOLIDUS) {
        codepoint = name.codePointAt(i + 1);
        if (!isIdentCodepoint(codepoint)) {
            return false;
        }
        i += String.fromCodePoint(codepoint).length;
        if (i < j) {
            codepoint = name.codePointAt(i);
            if (!isIdentCodepoint(codepoint)) {
                return false;
            }
        }
    }
    while (i < j) {
        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = name.charCodeAt(i);
        if (codepoint == REVERSE_SOLIDUS) {
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            codepoint = name.charCodeAt(i);
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            continue;
        }
        if (!isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
}
function isNonPrintable(codepoint) {
    // null -> backspace
    return (codepoint >= 0 && codepoint <= 0x8) ||
        // tab
        codepoint == 0xb ||
        // delete
        codepoint == 0x7f ||
        (codepoint >= 0xe && codepoint <= 0x1f);
}
function isPseudo(name) {
    return name.charAt(0) == ':' &&
        ((name.endsWith('(') && isIdent(name.charAt(1) == ':' ? name.slice(2, -1) : name.slice(1, -1))) ||
            isIdent(name.charAt(1) == ':' ? name.slice(2) : name.slice(1)));
}
function isHash(name) {
    return name.charAt(0) == '#' && isIdent(name.charAt(1));
}
function isNumber(name) {
    if (name.length == 0) {
        return false;
    }
    let codepoint = name.charCodeAt(0);
    let i = 0;
    const j = name.length;
    if (j == 1 && !isDigit(codepoint)) {
        return false;
    }
    // '+' '-'
    if ([0x2b, 0x2d].includes(codepoint)) {
        i++;
    }
    // consume digits
    while (i < j) {
        codepoint = name.charCodeAt(i);
        if (isDigit(codepoint)) {
            i++;
            continue;
        }
        // '.' 'E' 'e'
        if (codepoint == 0x2e || codepoint == 0x45 || codepoint == 0x65) {
            break;
        }
        return false;
    }
    // '.'
    if (codepoint == 0x2e) {
        if (!isDigit(name.charCodeAt(++i))) {
            return false;
        }
    }
    while (i < j) {
        codepoint = name.charCodeAt(i);
        if (isDigit(codepoint)) {
            i++;
            continue;
        }
        // 'E' 'e'
        if (codepoint == 0x45 || codepoint == 0x65) {
            i++;
            break;
        }
        return false;
    }
    // 'E' 'e'
    if (codepoint == 0x45 || codepoint == 0x65) {
        if (i == j) {
            return false;
        }
        codepoint = name.charCodeAt(i + 1);
        // '+' '-'
        if ([0x2b, 0x2d].includes(codepoint)) {
            i++;
        }
        codepoint = name.charCodeAt(i + 1);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    while (++i < j) {
        codepoint = name.charCodeAt(i);
        if (!isDigit(codepoint)) {
            return false;
        }
    }
    return true;
}
function isDimension(name) {
    let index = name.length;
    while (index--) {
        if (isLetter(name.charCodeAt(index))) {
            continue;
        }
        index++;
        break;
    }
    const number = name.slice(0, index);
    return number.length > 0 && isIdentStart(name.charCodeAt(index)) && isNumber(number);
}
function isPercentage(name) {
    return name.endsWith('%') && isNumber(name.slice(0, -1));
}
function isFlex(name) {
    return name.endsWith('fr') && isNumber(name.slice(0, -2));
}
function parseDimension(name) {
    let index = name.length;
    while (index--) {
        if (isLetter(name.charCodeAt(index))) {
            continue;
        }
        index++;
        break;
    }
    const dimension = {
        typ: EnumToken.DimensionTokenType,
        val: name.slice(0, index),
        unit: name.slice(index)
    };
    if (isAngle(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.AngleTokenType;
    }
    else if (isLength(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.LengthTokenType;
    }
    else if (isTime(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.TimeTokenType;
    }
    else if (isResolution(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.ResolutionTokenType;
        if (dimension.unit == 'dppx') {
            dimension.unit = 'x';
        }
    }
    else if (isFrequency(dimension)) {
        // @ts-ignore
        dimension.typ = EnumToken.FrequencyTokenType;
    }
    return dimension;
}
function isHexColor(name) {
    if (name.charAt(0) != '#' || ![4, 5, 7, 9].includes(name.length)) {
        return false;
    }
    for (let chr of name.slice(1)) {
        let codepoint = chr.charCodeAt(0);
        if (!isDigit(codepoint) &&
            // A-F
            !(codepoint >= 0x41 && codepoint <= 0x46) &&
            // a-f
            !(codepoint >= 0x61 && codepoint <= 0x66)) {
            return false;
        }
    }
    return true;
}
/*
export function isHexDigit(name: string): boolean {

    if (name.length || name.length > 6) {

        return false;
    }

    for (let chr of name) {

        let codepoint = <number>chr.charCodeAt(0);

        if (!isDigit(codepoint) &&
            // A F
            !(codepoint >= 0x41 && codepoint <= 0x46) &&
            // a f
            !(codepoint >= 0x61 && codepoint <= 0x66)) {

            return false;
        }
    }

    return true;
}
*/
function isFunction(name) {
    return name.endsWith('(') && isIdent(name.slice(0, -1));
}
function isAtKeyword(name) {
    return name.charCodeAt(0) == 0x40 && isIdent(name.slice(1));
}
function isNewLine(codepoint) {
    // \n \r \f
    return codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}
function isWhiteSpace(codepoint) {
    return codepoint == 0x9 || codepoint == 0x20 ||
        // isNewLine
        codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}

export { colorFontTech, fontFeaturesTech, fontFormat, isAngle, isAtKeyword, isColor, isColorspace, isDigit, isDimension, isFlex, isFrequency, isFunction, isHash, isHexColor, isHueInterpolationMethod, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNonPrintable, isNumber, isPercentage, isPolarColorspace, isPseudo, isRectangularOrthogonalColorspace, isResolution, isTime, isWhiteSpace, mathFuncs, mediaTypes, parseDimension };
