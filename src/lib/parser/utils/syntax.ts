// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token

import {AngleToken, DimensionToken, LengthToken, Token} from '../../../@types';
import {colorsFunc} from "../../renderer";
import {COLORS_NAMES} from "../../renderer/utils";

// '\\'
const REVERSE_SOLIDUS = 0x5c;
const dimensionUnits = [
    'q', 'cap', 'ch', 'cm', 'cqb', 'cqh', 'cqi', 'cqmax', 'cqmin', 'cqw', 'dvb',
    'dvh', 'dvi', 'dvmax', 'dvmin', 'dvw', 'em', 'ex', 'ic', 'in', 'lh', 'lvb',
    'lvh', 'lvi', 'lvmax', 'lvw', 'mm', 'pc', 'pt', 'px', 'rem', 'rlh', 'svb',
    'svh', 'svi', 'svmin', 'svw', 'vb', 'vh', 'vi', 'vmax', 'vmin', 'vw'
];

export function isLength(dimension: DimensionToken): boolean {

    return 'unit' in dimension && dimensionUnits.includes(dimension.unit.toLowerCase());
}

export function isResolution(dimension: DimensionToken): boolean {

    return 'unit' in dimension && ['dpi', 'dpcm', 'dppx', 'x'].includes(dimension.unit.toLowerCase());
}

export function isAngle(dimension: DimensionToken): boolean {

    return 'unit' in dimension && ['rad', 'turn', 'deg', 'grad'].includes(dimension.unit.toLowerCase());
}

export function isTime(dimension: DimensionToken): boolean {

    return 'unit' in dimension && ['ms', 's'].includes(dimension.unit.toLowerCase());
}

export function isFrequency(dimension: DimensionToken): boolean {

    return 'unit' in dimension && ['hz', 'khz'].includes(dimension.unit.toLowerCase());
}

export function isColor(token: Token): boolean {

    if (token.typ == 'Color') {

        return true;
    }
    if (token.typ == 'Iden') {
        // named color
        return token.val.toLowerCase() in COLORS_NAMES;
    }

    if (token.typ == 'Func' && token.chi.length > 0 && colorsFunc.includes(token.val)) {

        // @ts-ignore
        for (const v of token.chi) {

            if (!['Number', 'Angle', 'Perc', 'Comma', 'Whitespace', 'Literal'].includes(v.typ)) {

                return false;
            }
        }

        return true;
    }

    return false;
}

function isLetter(codepoint: number): boolean {

    // lowercase
    return (codepoint >= 0x61 && codepoint <= 0x7a) ||
        // uppercase
        (codepoint >= 0x41 && codepoint <= 0x5a)
}

function isNonAscii(codepoint: number): boolean {

    return codepoint >= 0x80;
}

export function isIdentStart(codepoint: number): boolean {

    // _
    return codepoint == 0x5f || isLetter(codepoint) || isNonAscii(codepoint);
}

export function isDigit(codepoint: number): boolean {

    return codepoint >= 0x30 && codepoint <= 0x39;
}

export function isIdentCodepoint(codepoint: number): boolean {

    // -
    return codepoint == 0x2d || isDigit(codepoint) || isIdentStart(codepoint);
}

export function isIdent(name: string): boolean {

    const j: number = name.length - 1;
    let i: number = 0;
    let codepoint: number = <number>name.charCodeAt(0);

    // -
    if (codepoint == 0x2d) {

        const nextCodepoint: number = <number>name.charCodeAt(1);

        if (Number.isNaN(nextCodepoint)) {

            return false;
        }

        // -
        if (nextCodepoint == 0x2d) {

            return true;
        }

        if (nextCodepoint == REVERSE_SOLIDUS) {

            return name.length > 2 && !isNewLine(<number>name.charCodeAt(2))
        }

        return true;
    }

    if (!isIdentStart(codepoint)) {

        return false;
    }

    while (i < j) {

        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = <number>name.charCodeAt(i);

        if (!isIdentCodepoint(codepoint)) {

            return false;
        }
    }

    return true;
}

export function isNonPrintable(codepoint: number): boolean {

    // null -> backspace
    return (codepoint >= 0 && codepoint <= 0x8) ||
        // tab
        codepoint == 0xb ||
        // delete
        codepoint == 0x7f ||
        (codepoint  >= 0xe && codepoint <= 0x1f);
}

export function isPseudo(name: string): boolean {

    return  name.charAt(0) == ':' &&
        (
            (name.endsWith('(') && isIdent(name.charAt(1) == ':' ? name.slice(2, -1) : name.slice(1, -1))) ||
            isIdent(name.charAt(1) == ':' ? name.slice(2) : name.slice(1))
        );
}

export function isHash(name: string): boolean {

    return name.charAt(0) == '#' && isIdent(name.charAt(1));
}

export function isNumber(name: string): boolean {

    if (name.length == 0) {

        return false;
    }

    let codepoint: number = <number>name.charCodeAt(0);
    let i: number = 0;
    const j: number = name.length;

    if (j == 1 && !isDigit(codepoint)) {

        return false;
    }

    // '+' '-'
    if ([0x2b, 0x2d].includes(codepoint)) {

        i++;
    }

    // consume digits
    while (i < j) {

        codepoint = <number>name.charCodeAt(i);

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

        if (!isDigit(<number>name.charCodeAt(++i))) {

            return false;
        }
    }

    while (i < j) {

        codepoint = <number>name.charCodeAt(i);

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

        codepoint = <number>name.charCodeAt(i + 1);

        // '+' '-'
        if ([0x2b, 0x2d].includes(codepoint)) {

            i++;
        }

        codepoint = <number>name.charCodeAt(i + 1);

        if (!isDigit(codepoint)) {

            return false;
        }
    }

    while (++i < j) {

        codepoint = <number>name.charCodeAt(i);

        if (!isDigit(codepoint)) {

            return false;
        }
    }

    return true;
}

export function isDimension(name: string) {

    let index: number = name.length;

    while (index--) {

        if (isLetter(<number>name.charCodeAt(index))) {

            continue
        }

        index++;
        break;
    }

    const number: string = name.slice(0, index);
    return number.length > 0 && isIdentStart(name.charCodeAt(index)) && isNumber(number);
}

export function isPercentage(name: string) {

    return name.endsWith('%') && isNumber(name.slice(0, -1));
}

export function parseDimension(name: string): DimensionToken | LengthToken | AngleToken {

    let index: number = name.length;

    while (index--) {

        if (isLetter(<number>name.charCodeAt(index))) {

            continue
        }

        index++;
        break;
    }

    const dimension = <DimensionToken>{typ: 'Dimension', val: name.slice(0, index), unit: name.slice(index)};

    if (isAngle(dimension)) {

        // @ts-ignore
        dimension.typ = 'Angle';
    } else if (isLength(dimension)) {

        // @ts-ignore
        dimension.typ = 'Length';
    } else if (isTime(dimension)) {

        // @ts-ignore
        dimension.typ = 'Time';
    } else if (isResolution(dimension)) {

        // @ts-ignore
        dimension.typ = 'Resolution';

        if (dimension.unit == 'dppx') {

            dimension.unit = 'x';
        }
    } else if (isFrequency(dimension)) {

        // @ts-ignore
        dimension.typ = 'Frequency';
    }

    return dimension;
}

export function isHexColor(name: string): boolean {

    if (name.charAt(0) != '#' || ![4, 5, 7, 9].includes(name.length)) {

        return false;
    }

    for (let chr of name.slice(1)) {

        let codepoint = <number>chr.charCodeAt(0);

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

function isEscape(name: string): boolean {

    return name.charCodeAt(0) == REVERSE_SOLIDUS && !isNewLine(<number>name.charCodeAt(1));
}

export function isFunction(name: string): boolean {

    return name.endsWith('(') && isIdent(name.slice(0, -1));
}

export function isAtKeyword(name: string): boolean {

    return name.charCodeAt(0) == 0x40 && isIdent(name.slice(1));
}

export function isNewLine(codepoint: number): boolean {

    // \n \r \f
    return codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}

export function isWhiteSpace(codepoint: number): boolean {

    return codepoint == 0x9 || codepoint == 0x20 ||
        // isNewLine
        codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}