
// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token

import exp from "constants";
import {DimensionToken} from "../../@types";

// export const num = `(((\\+|-)?(?=\\d*[.eE])([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE](\\+|-)?[0-9]+)?)|(\\d+|(\\d*\\.\\d+)))`;
// export const nl = `\n|\r\n|\r|\f`;
// export const nonascii = `[^\u{0}-\u{0ed}]`;
// export const unicode = `\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?`;
// export const escape = `(${unicode})|(\\[^\n\r\f0-9a-f])`;
// export const nmstart = `[_a-z]|${nonascii}|${escape}`;
// export const nmchar = `[_a-z0-9-]|${nonascii}|${escape}`
// export const ident = `[-]{0,2}(${nmstart})(${nmchar})*`;
// export const string1 	= `\"([^\n\r\f\\"]|\\${nl}|${escape})*\"`;
// export const string2 =	`\'([^\n\r\f\\']|\\${nl}|${escape})*\'`;
// export const string =	`(${string1})|(${string2})`;
//
// const name = `${nmchar}+`;
// const hash = `#${name}`;

// '\\'
const REVERSE_SOLIDUS = 0x5c;

function isLetter(codepoint:number) {

    // lowercase
    return (codepoint >= 0x61 && codepoint <= 0x7a) ||
        // uppercase
        (codepoint >= 0x41 && codepoint <= 0x5a)
}

function isNonAscii(codepoint: number) {

    return codepoint >= 0x80;
}

export function isIdentStart(codepoint: number) {

    // _
    return codepoint == 0x5f || isLetter(codepoint) || isNonAscii(codepoint);
}

export function isDigit(codepoint: number) {

    return codepoint >= 0x30 && codepoint <= 0x39;
}

export function isIdentCodepoint(codepoint: number) {

    // -
    return codepoint == 0x2d || isDigit(codepoint) || isIdentStart(codepoint);
}

export function isIdent(name: string): boolean {

    const j: number = name.length - 1;
    let i: number = 0;
    let codepoint: number = <number>name.codePointAt(0);

    // -
    if (codepoint == 0x2d) {

        const nextCodepoint: number = <number>name.codePointAt(1);

        if (nextCodepoint == null) {

            return false;
        }

        // -
        if (nextCodepoint == 0x2d) {

            return true;
        }

        if (nextCodepoint == REVERSE_SOLIDUS) {

            return name.length > 2 && !isNewLine(<number>name.codePointAt(2))
        }

        return true;
    }

    if (!isIdentStart(codepoint)) {

        return false;
    }

    while (i < j) {

        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = <number>name.codePointAt(i);

        if (!isIdentCodepoint(codepoint)) {

            return false;
        }
    }

    return true;
}


export function isPseudo(name: string): boolean {

    if (name.charAt(0) != ':') {

        return false;
    }

    return isIdent(name.charAt(1) == ':' ? name.slice(2) : name.slice(1))
}

export function isHash(name: string): boolean {

    if (name.charAt(0) != '#') {

        return false;
    }

    if (isIdent(name.charAt(1))) {

        return true;
    }

    return true;
}

export function isNumber (name: string) {

    let codepoint: number = <number>name.codePointAt(0);
    let i: number = 0;
    const j = name.length;

    // '+' '-'
    if ([0x2b, 0x2d].includes(codepoint)){

        i++;
    }

    // consume digits
    while (i < j) {

        codepoint = <number>name.codePointAt(i);

        if(isDigit(codepoint)) {

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

        if (!isDigit(<number>name.codePointAt(++i))) {

            return false;
        }
    }

    while (++i < j) {

        codepoint = <number>name.codePointAt(i);

        if(isDigit(codepoint)) {

            continue;
        }

        // 'E' 'e'
        if (codepoint == 0x45 || codepoint == 0x65) {

            break;
        }

        return false;
    }

    // 'E' 'e'
    if (codepoint == 0x45 || codepoint == 0x65) {

        if (i == j) {

            return false;
        }

        codepoint = <number>name.codePointAt(i + 1);

        // '+' '-'
        if ([0x2b, 0x2d].includes(codepoint)) {

            i++;
        }

        codepoint = <number>name.codePointAt(i + 1);

        if (!isDigit(codepoint)) {

            return false;
        }
    }

    while (++i < j) {

        codepoint = <number>name.codePointAt(i);

        if(!isDigit(codepoint)) {

            return false;
        }
    }

    return true;
}

export function isDimension(name: string) {

    let index: number = 0;

    while (index ++ < name.length) {

        if (isDigit(<number>name.codePointAt(name.length - index))) {

            index--;
            break;
        }

        if (index == 3) {

            break;
        }
    }

    if (index == 0 || index > 3) {

        return false;
    }

    return isIdentStart(<number>name.codePointAt(name.length - index)) && isNumber(name.slice(0, -index));
}

export function isPercentage(name: string) {

    return name.endsWith('%') && isNumber(name.slice(0, -1));
}

export function parseDimension(name: string): DimensionToken {

    let index: number = 0;

    while (index ++ < name.length) {

        if (isDigit(<number>name.codePointAt(name.length - index))) {

            index--;
            break;
        }

        if (index == 3) {

            break;
        }
    }

    return {typ: 'Dimension', val: name.slice(0, -index), unit: name.slice(-index)};
}

export function isHexColor(name: string) {

    if (name.charAt(0) != '#' || ![4, 5, 7, 9].includes(name.length)) {

        return false;
    }

    for (let chr of name) {

        let codepoint = <number> chr.codePointAt(0);

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

export function isHexDigit(name: string) {

    if (name.length  || name.length > 6) {

        return false;
    }

    for (let chr of name) {

        let codepoint = <number> chr.codePointAt(0);

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

function isEscape(name: string) {

    return name.codePointAt(0) == REVERSE_SOLIDUS && !isNewLine(<number>name.codePointAt(1));
}

export function isFunction(name: string): boolean {

    return name.endsWith('(') && isIdent(name.slice(0, -1));
}

export function isAtKeyword(name: string): boolean {

    return name.codePointAt(0) == 0x40 && isIdent(name.slice(1));
}

export function isNewLine(codepoint: number): boolean {

    // \n \r \f
    return codepoint == 0xa || codepoint == 0xc || codepoint == 0xd;
}

export function isWhiteSpace(codepoint: number): boolean {

    return codepoint == 0x9 || codepoint == 0x20 || isNewLine(codepoint);
}