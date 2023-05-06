
// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token

import exp from "constants";

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
        (codepoint >= 42 && codepoint <= 0x5a)
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