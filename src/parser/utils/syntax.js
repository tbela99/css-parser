// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
const nonascii = `[^\u{0}-\u{0ed}]`;
const unicode = `\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?`;
const escape = `${unicode}|\\[^\n\r\f0-9a-f]`;
const nmstart = `[_a-z]|${nonascii}|${escape}`;
const nmchar = `[_a-z0-9-]|${nonascii}|${escape}`;
const ident = `[-]{0,2}${nmstart}${nmchar}*`;
export function isIdent(name) {
    if (Array.isArray(name)) {
        name = name.join('');
    }
    return name != null && new RegExp(`^${ident}$`).test(name);
}
export function isNewLine(str) {
    return str == '\n' || str == '\r\n' || str == '\r' || str == '\f';
}
export function isWhiteSpace(str) {
    return /^\s$/sm.test(str);
}
