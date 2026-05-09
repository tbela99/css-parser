import { EnumToken, ColorType } from '../ast/types.js';
import { definedPropertySettings, whenElseFunc, transformFunctions, mathFuncs, colorsFunc, timingFunc, supportFunc, generalEnclosedFunc, timelineFunc, imageFunc, gridTemplateFunc, urlFunc, containerFunc } from '../syntax/constants.js';
import { isNumber, isPseudo, isIdent, isDigit, isNewLine, isWhiteSpace, isHexColor, isHash, isPercentage, parseDimension } from '../syntax/syntax.js';
import { getSyntaxConfig } from '../validation/config.js';

const syntaxDefinitions = getSyntaxConfig();
const SymbolsMapTokens = {
    // 'or': EnumToken.OrTokenType,
    // 'and': EnumToken.AndTokenType,
    // 'not': EnumToken.NotTokenType,
    // 'only': EnumToken.OnlyTokenType,
    "|": EnumToken.Pipe,
    "&": EnumToken.NestingSelectorTokenType,
    "||": EnumToken.ColumnCombinatorTokenType,
    "*": EnumToken.Star,
    "+": EnumToken.Plus,
    "~": EnumToken.Tilda,
    "=": EnumToken.DelimTokenType,
    "~=": EnumToken.IncludeMatchTokenType,
    "^=": EnumToken.StartMatchTokenType,
    "$=": EnumToken.EndMatchTokenType,
    "|=": EnumToken.DashMatchTokenType,
    "*=": EnumToken.ContainMatchTokenType,
    ",": EnumToken.Comma,
    ":": EnumToken.ColonTokenType,
    "::": EnumToken.DoubleColonTokenType,
    ";": EnumToken.SemiColonTokenType,
    "(": EnumToken.StartParensTokenType,
    ")": EnumToken.EndParensTokenType,
    "[": EnumToken.AttrStartTokenType,
    "]": EnumToken.AttrEndTokenType,
    "{": EnumToken.BlockStartTokenType,
    "}": EnumToken.BlockEndTokenType,
    "<=": EnumToken.LteTokenType,
    ">": EnumToken.GtTokenType,
    ">=": EnumToken.GteTokenType,
    " ": EnumToken.Whitespace,
    "\t": EnumToken.Whitespace,
    "\r": EnumToken.Whitespace,
    "\n": EnumToken.Whitespace,
    "\f": EnumToken.Whitespace,
    ...Object.keys(syntaxDefinitions.syntaxes).reduce((acc, curr) => (curr.endsWith("()") ? ((acc[curr.slice(0, -1)] = EnumToken.FunctionTokenDefType), acc) : acc), Object.create(null)),
    ...containerFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.ContainerFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...urlFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.UrlFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...gridTemplateFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.GridTemplateFuncTokenDefType;
        return acc;
    }, Object.create(null)),
    ...imageFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.ImageFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...timelineFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.TimelineFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...generalEnclosedFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.GeneralEnclosedFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...supportFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.SupportsFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...timingFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.TimingFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...colorsFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.ColorFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...mathFuncs.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.MathFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...transformFunctions.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.TransformFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...whenElseFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.WhenElseFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
};
// do not capture the value
const hintsEnum = new Set([
    EnumToken.CommaTokenType,
    EnumToken.ImportantTokenType,
    // EnumToken.WhitespaceTokenType,
    EnumToken.SemiColonTokenType,
]);
var TokenMap;
(function (TokenMap) {
    TokenMap[TokenMap["EXCLAMATION"] = 33] = "EXCLAMATION";
    TokenMap[TokenMap["SLASH"] = 47] = "SLASH";
    TokenMap[TokenMap["LOWERTHAN"] = 60] = "LOWERTHAN";
    TokenMap[TokenMap["HASH"] = 35] = "HASH";
    TokenMap[TokenMap["REVERSE_SOLIDUS"] = 92] = "REVERSE_SOLIDUS";
    TokenMap[TokenMap["DOUBLE_QUOTE"] = 34] = "DOUBLE_QUOTE";
    TokenMap[TokenMap["SINGLE_QUOTE"] = 39] = "SINGLE_QUOTE";
    TokenMap[TokenMap["DOT"] = 46] = "DOT";
    TokenMap[TokenMap["AT"] = 64] = "AT";
})(TokenMap || (TokenMap = {}));
function* consumeString(quoteStr, buffer, parseInfo) {
    const quote = quoteStr;
    let value;
    // let hasNewLine: boolean = false;
    if (buffer.length > 0) {
        yield yieldResult(buffer, parseInfo);
        buffer = "";
    }
    buffer += quoteStr;
    while ((value = peek(parseInfo))) {
        if (value == "\\") {
            const sequence = peek(parseInfo, 6);
            let escapeSequence = "";
            let codepoint;
            let i;
            for (i = 1; i < sequence.length; i++) {
                codepoint = sequence.charCodeAt(i);
                if (codepoint == 0x20 ||
                    (codepoint >= 0x61 && codepoint <= 0x66) ||
                    (codepoint >= 0x41 && codepoint <= 0x46) ||
                    (codepoint >= 0x30 && codepoint <= 0x39)) {
                    escapeSequence += sequence[i];
                    if (codepoint == 0x20) {
                        break;
                    }
                    continue;
                }
                break;
            }
            if (escapeSequence.trimEnd().length > 0) {
                const codepoint = parseInt(escapeSequence, 16);
                if (codepoint == 0 ||
                    // leading surrogate
                    (0xd800 <= codepoint && codepoint <= 0xdbff) ||
                    // trailing surrogate
                    (0xdc00 <= codepoint && codepoint <= 0xdfff)) {
                    buffer += String.fromCodePoint(0xfffd);
                }
                else {
                    buffer += String.fromCodePoint(codepoint);
                }
                next(parseInfo, escapeSequence.length + 1 + (isWhiteSpace(peek(parseInfo)?.charCodeAt(0)) ? 1 : 0));
                continue;
            }
            buffer += next(parseInfo, 2);
            continue;
        }
        if (value == quote) {
            buffer += value;
            yield yieldResult(buffer, parseInfo, 
            /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType);
            next(parseInfo);
            buffer = "";
            return;
        }
        if (isNewLine(value.charCodeAt(0))) {
            yield yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.BadStringTokenType);
            // buffer = "";
            return;
        }
        buffer += value;
        next(parseInfo);
    }
    // if (hasNewLine) {
    //     yield yieldResult(buffer, parseInfo, EnumToken.BadStringTokenType);
    // } else {
    // EOF - 'Unclosed-string' fixed
    yield yieldResult(buffer + quote, parseInfo, EnumToken.StringTokenType);
    // }
}
function getTokenType(val, hint) {
    let token = null;
    let dimension;
    if (hint != null) {
        token = hintsEnum.has(hint)
            ? { typ: hint }
            : Object.defineProperty({ typ: hint }, "val", {
                ...definedPropertySettings,
                value: val,
                enumerable: true,
            });
    }
    else {
        // if (v == 'currentcolor' || v == 'transparent' /* || v in COLORS_NAMES */) {
        //     token = <ColorToken>{
        //         typ: EnumToken.ColorTokenType,
        //         val: v,
        //         kin: ColorType.LIT
        //     };
        // }
        if (val.charAt(0) == "@" && isIdent(val.slice(1))) {
            token = {
                typ: EnumToken.AtRuleTokenType,
                nam: val.slice(1),
            };
        }
        else if (val.charAt(0) == "." && isIdent(val.slice(1))) {
            token = {
                typ: EnumToken.ClassSelectorTokenType,
                val,
            };
        }
        else if (val.charAt(0) == "#") {
            if (isHexColor(val)) {
                token = {
                    typ: EnumToken.ColorTokenType,
                    val: val,
                    kin: ColorType.HEX,
                };
            }
            else if (isHash(val)) {
                token = {
                    typ: EnumToken.HashTokenType,
                    val: val,
                };
            }
        }
        else if ("\"'".includes(val.charAt(0))) {
            token = {
                typ: EnumToken.UnclosedStringTokenType,
                val: val,
            };
        }
        else if (isNumber(val)) {
            token =
                val[0] === "-" || val[0] === "+"
                    ? {
                        typ: EnumToken.NumberTokenType,
                        sign: val[0],
                        val: +val,
                    }
                    : {
                        typ: EnumToken.NumberTokenType,
                        val: +val,
                    };
        }
        else if (isPercentage(val)) {
            token = {
                typ: EnumToken.PercentageTokenType,
                val: +val.slice(0, -1),
            };
        }
        else if ((dimension = parseDimension(val))) {
            token = dimension;
        }
        else if (isIdent(val)) {
            token = {
                typ: val.startsWith("--") ? EnumToken.DashedIdenTokenType : EnumToken.IdenTokenType,
                val,
            };
        }
    }
    if (token == null) {
        token = {
            typ: EnumToken.LiteralTokenType,
            val,
        };
    }
    return token;
}
function yieldResult(val, parseInfo, hint) {
    const token = getTokenType(val, hint);
    Object.defineProperty(token, "loc", {
        ...definedPropertySettings,
        value: {
            src: parseInfo.src,
            sta: { ...parseInfo.position },
            end: { ...parseInfo.currentPosition },
        },
    });
    parseInfo.position.ind = parseInfo.currentPosition.ind;
    parseInfo.position.lin = parseInfo.currentPosition.lin;
    parseInfo.position.col = Math.max(parseInfo.currentPosition.col, 1);
    if (token.loc.end.col == 0) {
        token.loc.end.col = 1;
    }
    return { token, bytesIn: parseInfo.currentPosition.ind + 1 };
}
function match(parseInfo, input) {
    const position = parseInfo.currentPosition.ind - parseInfo.offset;
    return parseInfo.stream.slice(position + 1, position + input.length + 1) == input;
}
function peek(parseInfo, count = 1) {
    if (count == 1) {
        return parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1);
    }
    const position = parseInfo.currentPosition.ind - parseInfo.offset;
    return parseInfo.stream.slice(position + 1, position + count + 1);
}
function prev(parseInfo) {
    return parseInfo.offset == parseInfo.currentPosition.ind
        ? parseInfo.buffer.slice(-1)
        : parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset - 1);
}
function next(parseInfo, count = 1) {
    let char = "";
    let chr = "";
    let position = parseInfo.currentPosition.ind - parseInfo.offset;
    while (count-- && (chr = parseInfo.stream.charAt(position + 1))) {
        char += chr;
        const codepoint = parseInfo.stream.charCodeAt(++position);
        ++parseInfo.currentPosition.ind;
        if (isNewLine(codepoint)) {
            parseInfo.currentPosition.lin++;
            parseInfo.currentPosition.col = 0;
        }
        else {
            parseInfo.currentPosition.col++;
        }
    }
    return char;
}
/**
 * tokenize css string
 * @param parseInfo
 * @param yieldEOFToken
 */
function* tokenize(parseInfo, yieldEOFToken = true) {
    if (typeof parseInfo == "string") {
        parseInfo = {
            stream: parseInfo,
            buffer: "",
            acc: "",
            src: "",
            offset: 0,
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 },
        };
    }
    let value;
    let nextValue;
    let buffer = parseInfo.buffer;
    let charCode;
    parseInfo.buffer = "";
    parseInfo.acc += parseInfo.stream;
    while ((value = next(parseInfo))) {
        nextValue = peek(parseInfo);
        if ((value === "-" || value === "+") && !isNumber(nextValue.charAt(0))) {
            if (value === "+") {
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }
                yield yieldResult(value, parseInfo);
                continue;
            }
            buffer += value;
            continue;
        }
        if (SymbolsMapTokens[value] === EnumToken.WhitespaceTokenType) {
            if (buffer.length > 0) {
                yield yieldResult(buffer, parseInfo);
                buffer = "";
            }
            while (SymbolsMapTokens[peek(parseInfo)] == EnumToken.WhitespaceTokenType) {
                value += next(parseInfo);
            }
            yield yieldResult(value, parseInfo, EnumToken.WhitespaceTokenType);
            continue;
        }
        if (value + nextValue in SymbolsMapTokens) {
            if (buffer.length > 0) {
                yield yieldResult(buffer, parseInfo);
                buffer = "";
            }
            yield yieldResult(value + next(parseInfo), parseInfo, SymbolsMapTokens[value + nextValue]);
            continue;
        }
        if (buffer + value in SymbolsMapTokens) {
            yield yieldResult(buffer + (value === "(" ? "" : value), parseInfo, SymbolsMapTokens[buffer + value]);
            buffer = "";
            continue;
        }
        if (value === "(") {
            if (buffer[0] === ":" && isPseudo(buffer)) {
                yield yieldResult(buffer, parseInfo, EnumToken.PseudoClassFunctionTokenDefType);
                buffer = "";
                continue;
            }
            else if (isIdent(buffer)) {
                yield yieldResult(buffer, parseInfo, EnumToken.FunctionTokenDefType);
                buffer = "";
                continue;
            }
        }
        if (value in SymbolsMapTokens) {
            if (buffer.length > 0) {
                yield yieldResult(buffer, parseInfo);
                buffer = "";
            }
            yield yieldResult(value, parseInfo, SymbolsMapTokens[value]);
            continue;
        }
        charCode = value.charCodeAt(0);
        switch (charCode) {
            case 33 /* TokenMap.EXCLAMATION */:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }
                if (match(parseInfo, "important")) {
                    yield yieldResult(value + next(parseInfo, 9), parseInfo, EnumToken.ImportantTokenType);
                    buffer = "";
                }
                break;
            case 47 /* TokenMap.SLASH */:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }
                if (!match(parseInfo, "*")) {
                    yield yieldResult(value, parseInfo, SymbolsMapTokens[value]);
                    break;
                }
                buffer += value + next(parseInfo);
                while ((value = next(parseInfo))) {
                    if (value == "*") {
                        buffer += value;
                        if (match(parseInfo, "/")) {
                            yield yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType);
                            buffer = "";
                            break;
                        }
                    }
                    else {
                        buffer += value;
                    }
                }
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo, EnumToken.BadCommentTokenType);
                    buffer = "";
                }
                break;
            case 60 /* TokenMap.LOWERTHAN */:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }
                if (match(parseInfo, "=")) {
                    yield yieldResult(value + next(parseInfo), parseInfo, EnumToken.LteTokenType);
                    break;
                }
                buffer += value;
                if (match(parseInfo, "!--")) {
                    buffer += next(parseInfo, 3);
                    while ((value = next(parseInfo))) {
                        buffer += value;
                        if (value == "-" && match(parseInfo, "->")) {
                            break;
                        }
                    }
                    if (value === "") {
                        yield yieldResult(buffer, parseInfo, EnumToken.BadCdoTokenType);
                    }
                    else {
                        yield yieldResult(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType);
                    }
                    buffer = "";
                }
                break;
            case 35 /* TokenMap.HASH */:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }
                buffer += value;
                break;
            case 92 /* TokenMap.REVERSE_SOLIDUS */:
                // EOF
                if (!(value = next(parseInfo))) {
                    // end of stream ignore \\
                    if (buffer.length > 0) {
                        yield yieldResult(buffer, parseInfo);
                        buffer = "";
                    }
                    break;
                }
                buffer += prev(parseInfo) + value;
                break;
            case 39 /* TokenMap.SINGLE_QUOTE */:
            case 34 /* TokenMap.DOUBLE_QUOTE */:
                yield* consumeString(value, buffer, parseInfo);
                buffer = "";
                break;
            case 46 /* TokenMap.DOT */:
                const codepoint = peek(parseInfo).charCodeAt(0);
                if (!isDigit(codepoint) && buffer !== "") {
                    yield yieldResult(buffer, parseInfo);
                    buffer = value;
                    break;
                }
                buffer += value;
                break;
            default:
                buffer += value;
                break;
        }
    }
    if (yieldEOFToken) {
        if (buffer.length > 0) {
            yield yieldResult(buffer, parseInfo);
        }
        yield yieldResult("", parseInfo, EnumToken.EOFTokenType);
    }
    else {
        parseInfo.buffer = buffer;
    }
}
/**
 * tokenize readable stream
 * @param input
 */
async function* tokenizeStream(input) {
    const parseInfo = {
        stream: "",
        buffer: "",
        acc: "",
        src: "",
        offset: 0,
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    };
    const decoder = new TextDecoder("utf-8");
    const reader = input.getReader();
    while (true) {
        const { done, value } = await reader.read();
        const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;
        if (!done) {
            if (parseInfo.stream.length > 2) {
                parseInfo.stream = parseInfo.stream.slice(-2) + stream;
                parseInfo.offset = parseInfo.currentPosition.ind - 1;
            }
            else {
                parseInfo.stream = stream;
                parseInfo.offset = Math.max(0, parseInfo.currentPosition.ind);
            }
        }
        yield* tokenize(parseInfo, done);
        if (done) {
            break;
        }
    }
}
/**
 * Update position
 * @param position
 * @param str
 */
function move(position, str) {
    let i = 0;
    for (; i < str.length; i++) {
        if (isNewLine(str[i].charCodeAt(0))) {
            position.lin++;
            position.col = 0;
        }
        else {
            position.col++;
        }
    }
}

export { TokenMap, consumeString, getTokenType, hintsEnum, match, move, next, peek, prev, tokenize, tokenizeStream, yieldResult };
