"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_comment = void 0;
function parse_comment(str, index) {
    var currentIndex = index;
    if (str[currentIndex] != '/' || str[++currentIndex] != '*') {
        return null;
    }
    while (currentIndex++ < str.length) {
        if (str[currentIndex] == '*' && str[currentIndex + 1] == '/') {
            return currentIndex + 1;
        }
    }
    return null;
}
exports.parse_comment = parse_comment;
