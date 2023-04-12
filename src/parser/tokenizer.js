"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var _Tokenizer_root;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = void 0;
var utils_1 = require("./utils");
var match_pair_1 = require("./utils/match_pair");
var block_1 = require("./utils/block");
var syntax_1 = require("./utils/syntax");
var find_1 = require("./utils/find");
var ltrim_1 = require("./utils/ltrim");
var Tokenizer = /** @class */ (function () {
    function Tokenizer(root) {
        _Tokenizer_root.set(this, void 0);
        __classPrivateFieldSet(this, _Tokenizer_root, root, "f");
    }
    Tokenizer.prototype.parse = function (css) {
        var i, buffer, value, node, index, j, position, _a, _b, name_1, value_1, sep, blockType, body, _c, name_2, value_2, tokenizer;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    i = -1;
                    buffer = '';
                    j = css.length - 1;
                    position = __classPrivateFieldGet(this, _Tokenizer_root, "f").location.end;
                    _d.label = 1;
                case 1:
                    if (!(i++ < j)) return [3 /*break*/, 19];
                    _a = css[i];
                    switch (_a) {
                        case '/': return [3 /*break*/, 2];
                        case '\\': return [3 /*break*/, 7];
                        case ';': return [3 /*break*/, 8];
                        case '}': return [3 /*break*/, 8];
                        case '{': return [3 /*break*/, 13];
                    }
                    return [3 /*break*/, 17];
                case 2:
                    if (!(css[i + 1] == '*')) return [3 /*break*/, 6];
                    buffer = '';
                    index = (0, utils_1.parse_comment)(css, i);
                    if (!(index == null)) return [3 /*break*/, 4];
                    value = css.substring(i);
                    node = {
                        location: {
                            start: Object.assign({}, position),
                            end: Object.assign({}, (0, utils_1.update)(position, value))
                        },
                        type: 'InvalidComment',
                        value: value
                    };
                    node.location.end.column--;
                    return [4 /*yield*/, [node, 'enter']];
                case 3:
                    _d.sent();
                    return [2 /*return*/];
                case 4:
                    value = css.substring(i, index + 1);
                    node = {
                        location: {
                            start: Object.assign({}, position),
                            end: Object.assign({}, (0, utils_1.update)(position, value))
                        },
                        type: 'Comment',
                        value: value
                    };
                    node.location.end.column--;
                    return [4 /*yield*/, [node, 'enter']];
                case 5:
                    _d.sent();
                    i += index;
                    return [3 /*break*/, 18];
                case 6:
                    buffer += css[i];
                    return [3 /*break*/, 18];
                case 7:
                    buffer += css[i];
                    if (i < j) {
                        buffer += css[++i];
                    }
                    return [3 /*break*/, 18];
                case 8:
                    buffer = (0, ltrim_1.ltrim)(position, buffer);
                    if (!(buffer[0] == '@')) return [3 /*break*/, 9];
                    _b = (0, block_1.parseAtRule)(buffer), name_1 = _b[0], value_1 = _b[1];
                    if (!(0, syntax_1.isIdent)(name_1)) {
                        node = {
                            location: {
                                start: Object.assign({}, position),
                                end: Object.assign({}, (0, utils_1.update)(position, buffer))
                            },
                            type: 'InvalidAtRule',
                            value: value_1,
                            name: name_1
                        };
                    }
                    else {
                        node = {
                            location: {
                                start: Object.assign({}, position),
                                end: Object.assign({}, (0, utils_1.update)(position, buffer))
                            },
                            type: 'AtRule',
                            value: value_1,
                            name: name_1
                        };
                    }
                    return [3 /*break*/, 12];
                case 9:
                    sep = (0, find_1.find)(buffer, 0, ':');
                    if (!(sep == null)) return [3 /*break*/, 10];
                    // garbage
                    console.warn("warning:".concat((__classPrivateFieldGet(this, _Tokenizer_root, "f").location.src || '') + ':' + position.line + ':' + position.column, " cannot parse string \"").concat(buffer, "\""));
                    (0, utils_1.update)(position, buffer);
                    return [3 /*break*/, 12];
                case 10:
                    node = {
                        location: {
                            start: position,
                            end: Object.assign({}, (0, utils_1.update)(position, buffer))
                        },
                        type: 'Declaration',
                        name: buffer.substring(0, sep).trimEnd(),
                        value: buffer.substring(sep + 1).trim()
                    };
                    return [4 /*yield*/, [node, 'enter']];
                case 11:
                    _d.sent();
                    _d.label = 12;
                case 12:
                    (0, utils_1.update)(position, css[i]);
                    buffer = '';
                    return [3 /*break*/, 18];
                case 13:
                    buffer = (0, ltrim_1.ltrim)(position, buffer);
                    index = (0, match_pair_1.match_pair)(css, i, '{', '}');
                    if (index == null) {
                        // invalid block
                        return [3 /*break*/, 18];
                    }
                    blockType = (0, block_1.getType)(buffer);
                    // const match =
                    if (blockType == null) {
                        // invalid block
                        return [3 /*break*/, 18];
                    }
                    body = css.substring(i, index + 1);
                    if (blockType == 'AtRule') {
                        _c = (0, block_1.parseAtRule)(buffer), name_2 = _c[0], value_2 = _c[1];
                        if (!(0, syntax_1.isIdent)(name_2)) {
                            node = {
                                location: {
                                    start: Object.assign({}, position),
                                    end: Object.assign({}, (0, utils_1.update)(position, buffer))
                                },
                                type: 'InvalidAtRule',
                                value: value_2,
                                name: name_2,
                                body: body
                            };
                        }
                        else {
                            node = {
                                location: {
                                    start: Object.assign({}, position),
                                    end: Object.assign({}, (0, utils_1.update)(position, buffer))
                                },
                                type: 'AtRule',
                                value: value_2,
                                name: name_2,
                                children: []
                            };
                        }
                        //
                        // update(position, buffer + css.substring(i, index + 1));
                    }
                    else {
                        node = {
                            location: {
                                start: Object.assign({}, position),
                                end: Object.assign({}, (0, utils_1.update)(position, buffer))
                            },
                            type: 'Rule',
                            selector: buffer.trimEnd(),
                            children: []
                        };
                    }
                    // update(node.location.end, body);
                    return [4 /*yield*/, [node, 'enter']];
                case 14:
                    // update(node.location.end, body);
                    _d.sent();
                    tokenizer = new Tokenizer(node);
                    return [5 /*yield**/, __values(tokenizer.parse(body.substring(0, body.length - 1)))];
                case 15:
                    _d.sent();
                    node.location.end = (0, utils_1.update)(position, body);
                    node.location.end.column--;
                    return [4 /*yield*/, [node, 'exit']];
                case 16:
                    _d.sent();
                    i += index;
                    buffer = '';
                    return [3 /*break*/, 18];
                case 17:
                    buffer += css[i];
                    return [3 /*break*/, 18];
                case 18: return [3 /*break*/, 1];
                case 19:
                    if (buffer.trim() !== '') {
                        console.log({ buffer: buffer });
                    }
                    return [2 /*return*/];
            }
        });
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
_Tokenizer_root = new WeakMap();
