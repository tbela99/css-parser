"use strict";
// https://www.w3.org/TR/CSS21/syndata.html#syntax
// https://www.w3.org/TR/2021/CRD-css-syntax-3-20211224/#typedef-ident-token
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWhiteSpace = exports.isNewLine = exports.isIdent = void 0;
var nonascii = "[^\0-\u00ED]";
var unicode = "\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?";
var escape = "".concat(unicode, "|\\[^\n\r\f0-9a-f]");
var nmstart = "[_a-z]|".concat(nonascii, "|").concat(escape);
var nmchar = "[_a-z0-9-]|".concat(nonascii, "|").concat(escape);
var ident = "[-]{0,2}".concat(nmstart).concat(nmchar, "*");
function isIdent(name) {
    return name != null && new RegExp("^".concat(ident, "$")).test(name);
}
exports.isIdent = isIdent;
function isNewLine(str) {
    return str == '\n' || str == '\r\n' || str == '\r' || str == '\f';
}
exports.isNewLine = isNewLine;
function isWhiteSpace(str) {
    return /^\s$/sm.test(str);
}
exports.isWhiteSpace = isWhiteSpace;
