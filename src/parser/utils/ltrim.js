"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ltrim = void 0;
var syntax_1 = require("./syntax");
var location_1 = require("./location");
function ltrim(position, buffer) {
    var l = -1;
    var k = buffer.length - 1;
    while (l++ < k) {
        if (!(0, syntax_1.isWhiteSpace)(buffer[l])) {
            break;
        }
    }
    // console.log({l, k, b: buffer.substring(l)})
    if (l > 0) {
        (0, location_1.update)(position, buffer.slice(0, l));
        return buffer.substring(l);
    }
    return buffer;
}
exports.ltrim = ltrim;
