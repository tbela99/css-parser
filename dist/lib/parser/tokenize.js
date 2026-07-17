import { EnumToken, ColorType } from '../ast/types.js';
import { LOC, wildCardFuncs, whenElseFunc, transformFunctions, mathFuncs, colorsFunc, timingFunc, supportFunc, timelineFunc, imageFunc, gridTemplateFunc, urlFunc, containerFunc, pseudoElements } from '../syntax/constants.js';
import { isDigit, isPseudo, isIdent, isWhiteSpace, isNumber, isHexColor, isHash, isPercentage, parseDimension, isNewLine } from '../syntax/syntax.js';
import { equalsIgnoreCase } from './utils/text.js';

const SymbolsMapTokens = {
    "+": EnumToken.Plus,
    "=": EnumToken.DelimTokenType,
    "|": EnumToken.Pipe,
    "||": EnumToken.ColumnCombinatorTokenType,
    "|=": EnumToken.DashMatchTokenType,
    "&": EnumToken.NestingSelectorTokenType,
    "*": EnumToken.Star,
    "*=": EnumToken.ContainMatchTokenType,
    "~": EnumToken.Tilda,
    "~=": EnumToken.IncludeMatchTokenType,
    "^=": EnumToken.StartMatchTokenType,
    "$=": EnumToken.EndMatchTokenType,
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
    ...pseudoElements.reduce((acc, curr) => {
        acc[curr] = EnumToken.PseudoElementTokenType;
        return acc;
    }, Object.create(null)),
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
    // ...generalEnclosedFunc.reduce((acc, curr: string) => {
    //     acc[curr + "("] = EnumToken.GeneralEnclosedFunctionTokenDefType;
    //     return acc;
    // }, Object.create(null)),
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
        acc[curr.toLowerCase() + "("] = EnumToken.TransformFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...whenElseFunc.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.WhenElseFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...wildCardFuncs.reduce((acc, curr) => {
        acc[curr + "("] = EnumToken.WildCardFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
};
// do not capture the value
const hintsEnum = new Set([
    EnumToken.CommaTokenType,
    EnumToken.ImportantTokenType,
    EnumToken.SemiColonTokenType,
    EnumToken.BlockStartTokenType,
    EnumToken.BlockEndTokenType,
    EnumToken.StartParensTokenType,
    EnumToken.EndParensTokenType,
    EnumToken.ColonTokenType,
    EnumToken.EOFTokenType,
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
    TokenMap[TokenMap["PIPE"] = 124] = "PIPE";
    TokenMap[TokenMap["EQUALS"] = 61] = "EQUALS";
    TokenMap[TokenMap["AMPERSAND"] = 38] = "AMPERSAND";
    TokenMap[TokenMap["STAR"] = 42] = "STAR";
    TokenMap[TokenMap["TILDA"] = 126] = "TILDA";
    TokenMap[TokenMap["CARET"] = 94] = "CARET";
    TokenMap[TokenMap["DOLLAR"] = 36] = "DOLLAR";
    TokenMap[TokenMap["COMMA"] = 44] = "COMMA";
    TokenMap[TokenMap["COLON"] = 58] = "COLON";
    TokenMap[TokenMap["SEMICOLON"] = 59] = "SEMICOLON";
    TokenMap[TokenMap["LEFT_PARENTHESIS"] = 40] = "LEFT_PARENTHESIS";
    TokenMap[TokenMap["RIGHT_PARENTHESIS"] = 41] = "RIGHT_PARENTHESIS";
    TokenMap[TokenMap["LEFT_BRACKETS"] = 91] = "LEFT_BRACKETS";
    TokenMap[TokenMap["RIGHT_BRACKETS"] = 93] = "RIGHT_BRACKETS";
    TokenMap[TokenMap["LEFT_BRACE"] = 123] = "LEFT_BRACE";
    TokenMap[TokenMap["RIGHT_BRACE"] = 125] = "RIGHT_BRACE";
    TokenMap[TokenMap["PLUS"] = 43] = "PLUS";
    TokenMap[TokenMap["MINUS"] = 45] = "MINUS";
    TokenMap[TokenMap["GREATERTHAN"] = 62] = "GREATERTHAN";
})(TokenMap || (TokenMap = {}));
function consumeString(quoteStr, buffer, parseInfo) {
    const quote = quoteStr;
    let value;
    const result = [];
    if (buffer.length > 0) {
        result.push(yieldResult(buffer, parseInfo));
        buffer = "";
    }
    buffer += quoteStr;
    while ((value = parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1))) {
        if (value == "\\") {
            if ("\\" == parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset + 2)) {
                buffer += next(parseInfo, 2);
                continue;
            }
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
                next(parseInfo, escapeSequence.length +
                    1 +
                    (isWhiteSpace(parseInfo.stream
                        .charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1)
                        ?.charCodeAt(0))
                        ? 1
                        : 0));
                continue;
            }
            buffer += next(parseInfo, 2);
            continue;
        }
        if (value == quote) {
            buffer += value;
            result.push(yieldResult(buffer, parseInfo, 
            /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType));
            next(parseInfo);
            buffer = "";
            return result;
        }
        if (isNewLine(value.charCodeAt(0))) {
            result.push(yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.BadStringTokenType));
            return result;
        }
        buffer += value;
        next(parseInfo);
    }
    // EOF - 'Unclosed-string' fixed
    result.push(yieldResult(buffer + quote, parseInfo, EnumToken.StringTokenType));
    return result;
}
function yieldResult(val, parseInfo, hint) {
    let token = null;
    let dimension;
    if (hint != null) {
        let searchArray = null;
        switch (hint) {
            case EnumToken.TransformFunctionTokenDefType:
                searchArray = transformFunctions;
                break;
            case EnumToken.ColorFunctionTokenDefType:
                searchArray = colorsFunc;
                break;
            case EnumToken.ContainerFunctionTokenDefType:
                searchArray = containerFunc;
                break;
            case EnumToken.UrlFunctionTokenDefType:
                searchArray = urlFunc;
                break;
            case EnumToken.GridTemplateFuncTokenDefType:
                searchArray = gridTemplateFunc;
                break;
            case EnumToken.ImageFunctionTokenDefType:
                searchArray = imageFunc;
                break;
            case EnumToken.TimelineFunctionTokenDefType:
                searchArray = timelineFunc;
                break;
            // case EnumToken.GeneralEnclosedFunctionTokenDefType:
            //     searchArray = generalEnclosedFunc;
            //     break;
            case EnumToken.SupportsFunctionTokenDefType:
                searchArray = supportFunc;
                break;
            case EnumToken.TimingFunctionTokenDefType:
                searchArray = timingFunc;
                break;
            case EnumToken.MathFunctionTokenDefType:
                searchArray = mathFuncs;
                break;
            case EnumToken.WhenElseFunctionTokenDefType:
                searchArray = whenElseFunc;
                break;
            case EnumToken.WildCardFunctionTokenDefType:
                searchArray = wildCardFuncs;
                break;
        }
        if (searchArray != null) {
            val = searchArray.find((v) => equalsIgnoreCase(v, val));
        }
        token = hintsEnum.has(hint) ? { typ: hint } : { typ: hint, val };
    }
    else {
        let slice = val.slice(1);
        const chr = val.charAt(0);
        if (chr == "@" && isIdent(slice)) {
            token = {
                typ: EnumToken.AtRuleTokenType,
                nam: slice,
            };
        }
        else if (chr == "." && isIdent(slice)) {
            token = {
                typ: EnumToken.ClassSelectorTokenType,
                val,
            };
        }
        else if (chr == "#") {
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
        else if ("\"'".includes(chr)) {
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
    // return token;
    token[LOC] = {
        src: parseInfo.src,
        sta: { ...parseInfo.position },
        end: { ...parseInfo.currentPosition },
    };
    parseInfo.position.ind = parseInfo.currentPosition.ind;
    parseInfo.position.lin = parseInfo.currentPosition.lin;
    parseInfo.position.col = parseInfo.currentPosition.col;
    return { token, bytesIn: parseInfo.currentPosition.ind + 1 };
}
function match(parseInfo, input) {
    let position = parseInfo.currentPosition.ind - parseInfo.offset;
    for (let i = 0; i < input.length; i++) {
        if (parseInfo.stream[position + i + 1] != input.charAt(i)) {
            return false;
        }
    }
    return true;
}
function peek(parseInfo, count = 1) {
    if (count == 1) {
        return parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1);
    }
    const position = parseInfo.currentPosition.ind - parseInfo.offset;
    return parseInfo.stream.slice(position + 1, position + count + 1);
}
function next(parseInfo, count = 1) {
    let position = parseInfo.currentPosition.ind - parseInfo.offset;
    let char = count == 1 ? parseInfo.stream.charAt(position + 1) : parseInfo.stream.slice(position + 1, position + 1 + count);
    let i = 0;
    for (; i < char.length; i++) {
        const codepoint = char[i].charCodeAt(0);
        if (codepoint == 0xa ||
            codepoint == 0xb ||
            codepoint == 0xc ||
            codepoint == 0xd ||
            codepoint == 0x2028 ||
            codepoint == 0x2029) {
            parseInfo.currentPosition.lin++;
            parseInfo.currentPosition.col = 1;
        }
        else {
            parseInfo.currentPosition.col++;
        }
    }
    parseInfo.currentPosition.ind += char.length;
    return char;
}
/**
 * Tokenize css string
 * @param parseInfo
 * @param yieldEOFToken
 */
function tokenize(parseInfo, yieldEOFToken = true) {
    if (typeof parseInfo == "string") {
        parseInfo = {
            stream: parseInfo,
            buffer: "",
            src: "",
            offset: 0,
            time: 0,
            position: { ind: 0, lin: 1, col: 0 },
            currentPosition: { ind: -1, lin: 1, col: 0 },
        };
    }
    let value;
    let nextValue;
    let buffer = parseInfo.buffer;
    let charCode;
    let nextCharCode;
    const startTime = performance.now();
    const result = [];
    // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
    const endPosition = parseInfo.stream.length - 10;
    parseInfo.buffer = "";
    while ((value = next(parseInfo))) {
        nextValue = parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1);
        charCode = value.charCodeAt(0);
        nextCharCode = nextValue.charCodeAt(0);
        switch (charCode) {
            case 61 /* TokenMap.EQUALS */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.DelimTokenType));
                break;
            // '+' or '-'
            case 43 /* TokenMap.PLUS */:
            case 45 /* TokenMap.MINUS */:
                if (charCode === 43 /* TokenMap.PLUS */ && !isNumber(nextValue)) {
                    if (buffer.length > 0) {
                        result.push(yieldResult(buffer, parseInfo));
                        buffer = "";
                    }
                    result.push(yieldResult(value, parseInfo, SymbolsMapTokens[value]));
                    break;
                }
                buffer += value;
                break;
            // '{'
            case 123 /* TokenMap.LEFT_BRACE */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.BlockStartTokenType));
                break;
            // '}'
            case 125 /* TokenMap.RIGHT_BRACE */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.BlockEndTokenType));
                break;
            // '('
            case 40 /* TokenMap.LEFT_PARENTHESIS */:
                if (buffer.length > 0) {
                    if (buffer[0] === ":" && isPseudo(buffer)) {
                        result.push(yieldResult(buffer, parseInfo, EnumToken.PseudoClassFunctionTokenDefType));
                        buffer = "";
                        break;
                    }
                    else if (isIdent(buffer)) {
                        const hint = buffer.startsWith("--")
                            ? EnumToken.CustomFunctionTokenDefType
                            : (SymbolsMapTokens[buffer.toLowerCase() + "("] ?? EnumToken.FunctionTokenDefType);
                        result.push(yieldResult(buffer, parseInfo, hint));
                        buffer = "";
                        if (hint === EnumToken.UrlFunctionTokenDefType) {
                            value = peek(parseInfo);
                            // consume an <url>
                            while (isWhiteSpace((charCode = value.charCodeAt(0)))) {
                                buffer += next(parseInfo);
                                value = peek(parseInfo);
                                charCode = value.charCodeAt(0);
                                if (value === "/" && match(parseInfo, "/*")) {
                                    if (buffer.length > 0) {
                                        result.push(yieldResult(buffer, parseInfo));
                                        buffer = "";
                                    }
                                    buffer += next(parseInfo, 2);
                                    while ((value = next(parseInfo))) {
                                        if (value == "*") {
                                            buffer += value;
                                            if (match(parseInfo, "/")) {
                                                result.push(yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType));
                                                buffer = "";
                                                break;
                                            }
                                        }
                                        else {
                                            buffer += value;
                                        }
                                    }
                                    if (buffer.length > 0) {
                                        result.push(yieldResult(buffer, parseInfo, EnumToken.BadCommentTokenType));
                                        buffer = "";
                                    }
                                    value = peek(parseInfo);
                                    charCode = value.charCodeAt(0);
                                }
                            }
                            if (buffer.length > 0) {
                                result.push(yieldResult(buffer, parseInfo, EnumToken.WhitespaceTokenType));
                                buffer = "";
                            }
                            if (value === ")" || value === '"' || value === "'") {
                                break;
                            }
                            do {
                                buffer += next(parseInfo);
                                value = peek(parseInfo);
                                charCode = value.charCodeAt(0);
                            } while (value !== ")" &&
                                !isWhiteSpace(charCode) &&
                                !(value === "/" && match(parseInfo, "/*")));
                            if (buffer.length > 0) {
                                result.push(yieldResult(buffer, parseInfo, peek(parseInfo) === ""
                                    ? EnumToken.BadUrlTokenType
                                    : EnumToken.UrlTokenTokenType));
                                buffer = "";
                            }
                        }
                        break;
                    }
                }
                result.push(yieldResult(value, parseInfo, EnumToken.StartParensTokenType));
                buffer = "";
                break;
            // ')'
            case 41 /* TokenMap.RIGHT_PARENTHESIS */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.EndParensTokenType));
                break;
            // '['
            case 91 /* TokenMap.LEFT_BRACKETS */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.AttrStartTokenType));
                break;
            // ']'
            case 93 /* TokenMap.RIGHT_BRACKETS */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.AttrEndTokenType));
                break;
            case 59 /* TokenMap.SEMICOLON */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.SemiColonTokenType));
                break;
            case 58 /* TokenMap.COLON */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (nextCharCode == 58 /* TokenMap.COLON */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.DoubleColonTokenType));
                    break;
                }
                result.push(yieldResult(value, parseInfo, EnumToken.ColonTokenType));
                break;
            // \n \r \f \v \t space
            case 0x9:
            case 0x20:
            case 0xa:
            case 0xb:
            case 0xc:
            case 0xd:
            case 0x2028:
            case 0x2029:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                buffer += value;
                nextCharCode = parseInfo.stream
                    .charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1)
                    .charCodeAt(0);
                while (nextCharCode == 0x20 ||
                    (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                    nextCharCode == 0x2028 ||
                    nextCharCode == 0x2029) {
                    value += next(parseInfo);
                    nextCharCode = parseInfo.stream
                        .charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1)
                        .charCodeAt(0);
                }
                result.push(yieldResult(value, parseInfo, EnumToken.WhitespaceTokenType));
                buffer = "";
                break;
            case 44 /* TokenMap.COMMA */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.CommaTokenType));
                break;
            case 36 /* TokenMap.DOLLAR */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (nextCharCode == 61 /* TokenMap.EQUALS */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.EndMatchTokenType));
                    break;
                }
                buffer += value;
                break;
            case 126 /* TokenMap.TILDA */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (nextCharCode == 61 /* TokenMap.EQUALS */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.IncludeMatchTokenType));
                    break;
                }
                result.push(yieldResult(value, parseInfo, EnumToken.Tilda));
                buffer = "";
                break;
            // case '^':
            case 94 /* TokenMap.CARET */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (nextCharCode == 61 /* TokenMap.EQUALS */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.StartMatchTokenType));
                    break;
                }
                buffer += value;
                break;
            case 42 /* TokenMap.STAR */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (nextCharCode == 61 /* TokenMap.EQUALS */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.ContainMatchTokenType));
                    break;
                }
                result.push(yieldResult(value, parseInfo, EnumToken.Star));
                buffer = "";
                break;
            case 38 /* TokenMap.AMPERSAND */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(value, parseInfo, EnumToken.NestingSelectorTokenType));
                buffer = "";
                break;
            case 124 /* TokenMap.PIPE */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                // '||'
                if (nextCharCode == 124 /* TokenMap.PIPE */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.ColumnCombinatorTokenType));
                    break;
                }
                else if (nextCharCode == 61 /* TokenMap.EQUALS */) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.DashMatchTokenType));
                    break;
                }
                result.push(yieldResult(value, parseInfo, EnumToken.Pipe));
                buffer = "";
                break;
            case 33 /* TokenMap.EXCLAMATION */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (match(parseInfo, "important")) {
                    result.push(yieldResult(value + next(parseInfo, 9), parseInfo, EnumToken.ImportantTokenType));
                    buffer = "";
                    break;
                }
                buffer += value;
                break;
            case 47 /* TokenMap.SLASH */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (!match(parseInfo, "*")) {
                    result.push(yieldResult(value, parseInfo, SymbolsMapTokens[value]));
                    break;
                }
                buffer += value + next(parseInfo);
                while ((value = next(parseInfo))) {
                    if (value == "*") {
                        buffer += value;
                        if (match(parseInfo, "/")) {
                            result.push(yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType));
                            buffer = "";
                            break;
                        }
                    }
                    else {
                        buffer += value;
                    }
                }
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo, EnumToken.BadCommentTokenType));
                    buffer = "";
                }
                break;
            case 62 /* TokenMap.GREATERTHAN */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (match(parseInfo, "=")) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.GteTokenType));
                    break;
                }
                result.push(yieldResult(value, parseInfo, EnumToken.GtTokenType));
                buffer = "";
                break;
            case 60 /* TokenMap.LOWERTHAN */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                if (match(parseInfo, "=")) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.LteTokenType));
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
                        result.push(yieldResult(buffer, parseInfo, EnumToken.BadCdoTokenType));
                    }
                    else {
                        result.push(yieldResult(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType));
                    }
                    buffer = "";
                }
                break;
            case 35 /* TokenMap.HASH */:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                buffer += value;
                break;
            case 92 /* TokenMap.REVERSE_SOLIDUS */:
                // EOF
                if (!(value = next(parseInfo))) {
                    // end of stream ignore \\
                    if (buffer.length > 0) {
                        result.push(yieldResult(buffer, parseInfo));
                        buffer = "";
                    }
                    break;
                }
                buffer +=
                    (parseInfo.offset == parseInfo.currentPosition.ind
                        ? parseInfo.buffer.slice(-1)
                        : parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset - 1)) + value;
                break;
            case 39 /* TokenMap.SINGLE_QUOTE */:
            case 34 /* TokenMap.DOUBLE_QUOTE */:
                result.push(...consumeString(value, buffer, parseInfo));
                buffer = "";
                break;
            case 46 /* TokenMap.DOT */:
                const codepoint = parseInfo.stream
                    .charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1)
                    .charCodeAt(0);
                if (!isDigit(codepoint) && buffer !== "") {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = value;
                    break;
                }
                buffer += value;
                break;
            default:
                buffer += value;
                break;
        }
        if (!yieldEOFToken &&
            endPosition <= parseInfo.stream.length - parseInfo.currentPosition.ind + parseInfo.offset) {
            break;
        }
    }
    if (yieldEOFToken) {
        if (buffer.length > 0) {
            result.push(yieldResult(buffer, parseInfo));
        }
        result.push(yieldResult("", parseInfo, EnumToken.EOFTokenType));
    }
    else {
        parseInfo.buffer = buffer;
    }
    parseInfo.time += performance.now() - startTime;
    return result;
}
/**
 * tokenize readable stream
 * @param input
 */
async function* tokenizeStream(input, parseInfo) {
    parseInfo ??= {
        stream: "",
        buffer: "",
        src: "",
        offset: 0,
        time: 0,
        position: { ind: 0, lin: 1, col: 0 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    };
    const decoder = new TextDecoder("utf-8");
    const reader = input.getReader();
    while (true) {
        const { done, value } = await reader.read();
        const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;
        if (!done) {
            if (typeof parseInfo.stream != "string") {
                parseInfo.stream = stream;
            }
            else {
                parseInfo.stream = (parseInfo.stream.slice(parseInfo.currentPosition.ind - parseInfo.offset + 1) +
                    stream);
            }
            parseInfo.offset = parseInfo.currentPosition.ind + 1;
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

export { SymbolsMapTokens, TokenMap, consumeString, hintsEnum, match, move, next, peek, tokenize, tokenizeStream, yieldResult };
