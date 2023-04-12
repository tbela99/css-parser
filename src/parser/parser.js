"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _Parser_instances, _Parser_options, _Parser_observer, _Parser_lexer, _Parser_root, _Parser_createRoot;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
var observer_1 = require("../observer");
var tokenizer_1 = require("./tokenizer");
var Parser = /** @class */ (function () {
    function Parser(options) {
        if (options === void 0) { options = {
            strict: false
        }; }
        _Parser_instances.add(this);
        _Parser_options.set(this, void 0);
        _Parser_observer.set(this, void 0);
        _Parser_lexer.set(this, void 0);
        _Parser_root.set(this, void 0);
        __classPrivateFieldSet(this, _Parser_options, options, "f");
        __classPrivateFieldSet(this, _Parser_observer, new observer_1.Observer(), "f");
        __classPrivateFieldSet(this, _Parser_root, __classPrivateFieldGet(this, _Parser_instances, "m", _Parser_createRoot).call(this), "f");
        __classPrivateFieldSet(this, _Parser_lexer, new tokenizer_1.Tokenizer(__classPrivateFieldGet(this, _Parser_root, "f")), "f");
    }
    Parser.prototype.parse = function (css) {
        var _a;
        var stack = [];
        var context = __classPrivateFieldGet(this, _Parser_root, "f");
        for (var _i = 0, _b = __classPrivateFieldGet(this, _Parser_lexer, "f").parse(css); _i < _b.length; _i++) {
            var _c = _b[_i], node = _c[0], direction = _c[1];
            if (direction == 'enter') {
                // @ts-ignore
                if (node.type == 'StyleSheet') {
                    // @ts-ignore
                    (_a = context.children).push.apply(_a, node.children);
                }
                else {
                    // @ts-ignore
                    context.children.push(node);
                }
                // @ts-ignore
                if ('children' in node) {
                    stack.push(node);
                    // @ts-ignore
                    context = node;
                }
            }
            else if (direction == 'exit') {
                stack.pop();
                // @ts-ignore
                context = stack[stack.length - 1] || __classPrivateFieldGet(this, _Parser_root, "f");
            }
        }
        return this;
    };
    Parser.prototype.compact = function () {
        var _a;
        var i = __classPrivateFieldGet(this, _Parser_root, "f").children.length - 1;
        console.log({ i: i });
        while (i--) {
            var node = __classPrivateFieldGet(this, _Parser_root, "f").children[i];
            // @ts-ignore
            if (node.type == 'AtRule' && node.name == 'media' && node.value == 'all') {
                // @ts-ignore
                (_a = __classPrivateFieldGet(this, _Parser_root, "f").children).splice.apply(_a, __spreadArray([i, 1], node.children, false));
                i += node.children.length;
            }
        }
        console.log(__classPrivateFieldGet(this, _Parser_root, "f"));
        i = __classPrivateFieldGet(this, _Parser_root, "f").children.length - 1;
        console.log({ i: i });
        return this;
    };
    Parser.prototype.getAst = function () {
        return __classPrivateFieldGet(this, _Parser_root, "f");
    };
    return Parser;
}());
exports.Parser = Parser;
_Parser_options = new WeakMap(), _Parser_observer = new WeakMap(), _Parser_lexer = new WeakMap(), _Parser_root = new WeakMap(), _Parser_instances = new WeakSet(), _Parser_createRoot = function _Parser_createRoot() {
    return {
        type: "StyleSheet",
        location: {
            start: {
                index: 0,
                line: 1,
                column: 1
            },
            end: {
                index: 0,
                line: 1,
                column: 1
            }
        },
        children: []
    };
};
