"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = void 0;
/**
 * find the position of chr
 * @param str
 * @param start
 * @param chr
 */
function find(str, start, chr) {
    var position = start - 1;
    var k;
    var j = str.length - 1;
    while (position++ < j) {
        if (str[position] == '\\') {
            position++;
        }
        else if (str[position] == '"' || str[position] == "'") {
            // match quoted string
            var match = str[position];
            k = position;
            while (k++ < j) {
                if (str[k] == '\\') {
                    k++;
                }
                else if (str[k] == match) {
                    break;
                }
            }
            position = k;
        }
        else if (str[position] == '/' && str[position + 1] == '*') {
            k = position + 1;
            while (k++ < j) {
                if (str[k] == '\\') {
                    k++;
                }
                else if (str[k] == '*' && str[k + 1] == '/') {
                    k++;
                    break;
                }
            }
            position = k;
        }
        else if (str[position] === chr) {
            return position;
        }
    }
    return null;
}
exports.find = find;
