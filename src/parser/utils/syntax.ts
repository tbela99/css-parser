
// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token

export const num = `[0-9]+|[0-9]*\\.[0-9]+`;
export const nl = `\n|\r\n|\r|\f`;
export const nonascii = `[^\u{0}-\u{0ed}]`;
export const unicode = `\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?`;
export const escape = `(${unicode})|(\\[^\n\r\f0-9a-f])`;
export const nmstart = `[_a-z]|${nonascii}|${escape}`;
export const nmchar = `[_a-z0-9-]|${nonascii}|${escape}`
export const ident = `[-]{0,2}(${nmstart})(${nmchar})*`;
export const string1 	= `\"([^\n\r\f\\"]|\\${nl}|${escape})*\"`;
export const string2 =	`\'([^\n\r\f\\']|\\${nl}|${escape})*\'`;
export const string =	`(${string1})|(${string2})`;

const name = `${nmchar}+`;
const hash = `#${name}`;

export function isIdent(name: string): boolean {

    return name != null && new RegExp(`^${ident}$`).test(name)
}

export function isHash(name: string): boolean {

    return name != null && new RegExp(`^(${hash})$`).test(name)
}

export function isNumber(name: string): boolean {

    return name != null && new RegExp(`^(${num})$`).test(name)
}

export function isDimension(name: string): boolean {

    return name != null && new RegExp(`^(${num})(${ident})$`).test(name)
}

export function isPercentage(name: string): boolean {

    return name != null && new RegExp(`^(${num})%$`).test(name)
}

export function isFunction(name: string): boolean {

    return name != null && new RegExp(`^(${ident})\\($`).test(name)
}

export function isAtKeyword(name: string): boolean {

    return name != null && new RegExp(`^@${ident}$`).test(name)
}

export function isString(value: string) {

    return value != null && new RegExp(`^${string}$`, 'sm').test(value)
}

export function isNewLine(str: string): boolean {

    return str == '\n' || str == '\r\n' || str == '\r' || str == '\f';
}

export function isWhiteSpace(str: string): boolean {

    return /^\s$/sm.test(str);
}