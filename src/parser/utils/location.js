"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
var syntax_1 = require("./syntax");
function update(location, str) {
    var i = -1;
    var j = str.length - 1;
    while (i++ < j) {
        if ((str[i] == '\r' && str[i + 1] == '\n') || (0, syntax_1.isNewLine)(str[i])) {
            location.line++;
            location.column = 1;
            if (str[i] == '\r' && str[i + 1] == '\n') {
                i++;
                location.index++;
            }
        }
        else {
            location.column++;
        }
        location.index++;
    }
    return location;
}
exports.update = update;
