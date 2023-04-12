"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match_pair = void 0;
function match_pair(str, index, open, close) {
    var count = 1;
    var currentIndex = index;
    var j = str.length;
    while (currentIndex++ < j) {
        if (str[currentIndex] == '\\') {
            currentIndex++;
            continue;
        }
        if (str[currentIndex] == close) {
            count--;
            if (count == 0) {
                return currentIndex;
            }
        }
        else if (str[currentIndex] == open) {
            count++;
        }
    }
    return null;
}
exports.match_pair = match_pair;
