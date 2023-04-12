"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAtRule = exports.getType = void 0;
function getType(block) {
    var ch = block.trimStart()[0];
    if (ch == '@') {
        return 'AtRule';
    }
    if (/\S/.test(ch)) {
        return 'Rule';
    }
    return null;
}
exports.getType = getType;
function parseAtRule(block) {
    var match = block.trimStart().match(/^@(\S+)(\s*(.*?))?\s*$/sm);
    if (match) {
        return [match[1], match[3]];
    }
    return [];
}
exports.parseAtRule = parseAtRule;
