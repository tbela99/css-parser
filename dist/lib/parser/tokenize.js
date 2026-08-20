import { EnumToken, ColorType } from '../ast/types.js';
import { LOC, wildCardFuncs, whenElseFunc, transformFunctions, mathFuncs, colorsFunc, timingFunc, supportFunc, timelineFunc, imageFunc, gridTemplateFunc, urlFunc, containerFunc, pseudoElements } from '../syntax/constants.js';
import { isDigit, isWhiteSpace, isIdent, isHexColor, isHash, isNumber, isPercentage, parseDimension, isNewLine, isIdentStart, isIdentCodepoint, isNonPrintable } from '../syntax/syntax.js';
import { SourceFile } from './source.js';
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
function consumeString(parseInfo) {
    const quote = next(parseInfo).charCodeAt(0);
    let charCode;
    let decodeSegments = false;
    const result = [];
    while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
        if (charCode == 92 /* TokenMap.REVERSE_SOLIDUS */) {
            if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
                next(parseInfo, 2);
                continue;
            }
            const sequence = peek(parseInfo, 7);
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
                // const codepoint = parseInt(escapeSequence, 16);
                // TODO set decode flag ON
                // if (
                //     codepoint == 0 ||
                //     // leading surrogate
                //     (0xd800 <= codepoint && codepoint <= 0xdbff) ||
                //     // trailing surrogate
                //     (0xdc00 <= codepoint && codepoint <= 0xdfff)
                // ) {
                //     buffer += String.fromCodePoint(0xfffd);
                // } else {
                //     buffer += String.fromCodePoint(codepoint);
                // }
                const length = escapeSequence.length +
                    1 +
                    (isWhiteSpace(parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0))
                        ? 1
                        : 0);
                decodeSegments = true;
                next(parseInfo, length);
                continue;
            }
            next(parseInfo, 2);
            continue;
        }
        if (charCode == quote) {
            next(parseInfo);
            result.push(yieldResult(parseInfo, 
            /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType, decodeSegments ? { decodeSegments } : null));
            return result;
        }
        if (isNewLine(charCode)) {
            next(parseInfo);
            result.push(yieldResult(parseInfo, EnumToken.BadStringTokenType));
            return result;
        }
        next(parseInfo);
    }
    // EOF - 'Unclosed-string' fixed
    result.push(yieldResult(parseInfo, EnumToken.StringTokenType));
    return result;
}
function yieldResult(parseInfo, hint, options) {
    let val = parseInfo.stream.slice(parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
    let token = null;
    let dimension;
    if (options?.decodeSegments) {
        val = val.replace(/\\([0-9a-fA-F]{1,6})(?:\s)?/g, (_, sequence) => {
            const codepoint = parseInt(sequence, 16);
            if (codepoint == 0 ||
                // leading surrogate
                (0xd800 <= codepoint && codepoint <= 0xdbff) ||
                // trailing surrogate
                (0xdc00 <= codepoint && codepoint <= 0xdfff) ||
                codepoint > 0x10ffff) {
                return "\uFFFD";
            }
            return String.fromCodePoint(codepoint);
        });
    }
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
        srcId: parseInfo.source.id,
        sta: parseInfo.position,
        end: parseInfo.currentPosition,
    };
    parseInfo.position = parseInfo.currentPosition;
    return { token, bytesIn: parseInfo.currentPosition };
}
function match(parseInfo, input) {
    let position = parseInfo.currentPosition - parseInfo.offset;
    for (let i = 0; i < input.length; i++) {
        if (parseInfo.stream[position + i] != input.charAt(i)) {
            return false;
        }
    }
    return true;
}
function peek(parseInfo, count = 1) {
    if (count == 1) {
        return parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset);
    }
    const position = parseInfo.currentPosition - parseInfo.offset;
    return parseInfo.stream.slice(position, position + count);
}
function next(parseInfo, count = 1) {
    let position = parseInfo.currentPosition - parseInfo.offset;
    let char = count == 1 ? parseInfo.stream.charAt(position) : parseInfo.stream.slice(position, position + count);
    let i = 0;
    let codepoint;
    for (; i < char.length; i++) {
        codepoint = char[i].charCodeAt(0);
        if (codepoint == 0xa || // \n
            codepoint == 0xb || // \v
            codepoint == 0xc || // \f
            codepoint == 0xd || // \r
            codepoint == 0x2028 || // \u2028
            codepoint == 0x2029 // \u2029
        ) {
            // \r\n
            if (codepoint == 0xa && i > 0 && char.charCodeAt(i - 1) == 0xd) ;
            else {
                parseInfo.source.lineStarts.lineStarts.push(position + i);
            }
        }
    }
    parseInfo.currentPosition += char.length;
    return char;
}
function isIdentToken(parseInfo, start, end) {
    let j = parseInfo.currentPosition - parseInfo.offset;
    let i = parseInfo.position - parseInfo.offset;
    if (start != null) {
        if (end == null) {
            if (start < 0) {
                j += start;
            }
            else {
                i += start;
            }
        }
        else {
            if (end < 0) {
                j += end;
            }
            else {
                j = parseInfo.position + end;
            }
        }
    }
    j--;
    let codepoint = parseInfo.stream.charCodeAt(i);
    // -
    if (codepoint == 0x2d) {
        let nextCodepoint;
        if ((nextCodepoint = parseInfo.stream.charCodeAt(i + 1)) != nextCodepoint) {
            return false;
        }
        if (isDigit(nextCodepoint)) {
            return false;
        }
        codepoint = nextCodepoint;
        i++;
    }
    if (codepoint !== 0x2d && !isIdentStart(codepoint)) {
        return false;
    }
    if (codepoint == 92 /* TokenMap.REVERSE_SOLIDUS */) {
        codepoint = parseInfo.stream.charCodeAt(i + 1);
        // if (!isIdentCodepoint(codepoint)) {
        //     return false;
        // }
        i += String.fromCodePoint(codepoint).length;
        // if (i < j) {
        //     codepoint = name.charCodeAt(i) as number;
        //     if (!isIdentCodepoint(codepoint)) {
        //         return false;
        //     }
        // }
    }
    while (i < j) {
        i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
        codepoint = parseInfo.stream.charCodeAt(i);
        if (codepoint == 92 /* TokenMap.REVERSE_SOLIDUS */) {
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            codepoint = parseInfo.stream.charCodeAt(i);
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            continue;
        }
        if (codepoint !== 0x2d && !isIdentCodepoint(codepoint)) {
            return false;
        }
    }
    return true;
}
function isPseudo(parseInfo) {
    let position = parseInfo.currentPosition - parseInfo.offset;
    let endPosition = parseInfo.currentPosition - parseInfo.offset;
    return (parseInfo.stream.charAt(position) == ":" &&
        parseInfo.stream.charAt(endPosition - 1) == "(" &&
        (parseInfo.stream.charAt(position + 1) == ":"
            ? isIdentToken(parseInfo, 2, -1)
            : isIdentToken(parseInfo, 1, -1))) ||
        parseInfo.stream.charAt(position + 1) == ":"
        ? isIdentToken(parseInfo, 2)
        : isIdentToken(parseInfo, 1);
}
function startsWith(parseInfo, input) {
    let i = 0;
    let j = input.length;
    while (i < j) {
        if (parseInfo.stream.charAt(parseInfo.position - parseInfo.offset + i) != input.charAt(i)) {
            return false;
        }
        i++;
    }
    return true;
}
function isURLToken(parseInfo) {
    let i = parseInfo.position - parseInfo.offset;
    let c;
    while (++i < parseInfo.currentPosition) {
        c = parseInfo.stream.charCodeAt(i);
        // single quote or double quote or start parenthesis or close parenthesis
        if (isNonPrintable(c) || c == 0x27 || c == 0x22 || c == 0x28 || c == 0x29) {
            return false;
        }
        // valid escape
        if (c == 92 /* TokenMap.REVERSE_SOLIDUS */) {
            i++;
            if (i >= parseInfo.currentPosition) {
                return false;
            }
            c = parseInfo.stream.charCodeAt(i);
            // c is not '\n' or '\r' or '\f'
            if (c == 0x6e || c == 0x72 || c == 0x66) {
                return false;
            }
            continue;
        }
        // is white space
        if (c == 0x20 || c == 0x09) {
            break;
        }
    }
    return i == parseInfo.currentPosition;
}
/**
 * Tokenize CSS string
 * @param parseInfo
 * @param yieldEOFToken
 */
function tokenize(parseInfo, yieldEOFToken = true) {
    if (typeof parseInfo == "string") {
        parseInfo = {
            stream: parseInfo,
            source: new SourceFile(parseInfo, [], ""),
            offset: 0,
            time: 0,
            position: 0,
            currentPosition: 0,
        };
    }
    let charCode;
    let nextCharCode;
    const startTime = performance.now();
    const result = [];
    // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
    const endPosition = parseInfo.stream.length - 1;
    // NaN is not equal to NaN
    while ((charCode = peek(parseInfo).charCodeAt(0)) == charCode) {
        switch (charCode) {
            case 61 /* TokenMap.EQUALS */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.DelimTokenType));
                break;
            // '+' or '-'
            case 43 /* TokenMap.PLUS */:
            case 45 /* TokenMap.MINUS */:
                nextCharCode = peek(parseInfo).charCodeAt(0);
                // not a number
                if (charCode === 43 /* TokenMap.PLUS */ && !(nextCharCode >= 0x30 && nextCharCode <= 0x39)) {
                    if (parseInfo.position < parseInfo.currentPosition) {
                        result.push(yieldResult(parseInfo));
                    }
                    next(parseInfo);
                    result.push(yieldResult(parseInfo, SymbolsMapTokens[parseInfo.stream
                        .slice(parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset)
                        .toLowerCase()]));
                    break;
                }
                next(parseInfo);
                break;
            // '{'
            case 123 /* TokenMap.LEFT_BRACE */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.BlockStartTokenType));
                break;
            // '}'
            case 125 /* TokenMap.RIGHT_BRACE */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.BlockEndTokenType));
                break;
            // '('
            case 40 /* TokenMap.LEFT_PARENTHESIS */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    if (parseInfo.stream[parseInfo.position - parseInfo.offset] === ":" && isPseudo(parseInfo)) {
                        next(parseInfo);
                        result.push(yieldResult(parseInfo, EnumToken.PseudoClassFunctionTokenDefType));
                        break;
                    }
                    else if (isIdentToken(parseInfo)) {
                        const hint = startsWith(parseInfo, "--")
                            ? EnumToken.CustomFunctionTokenDefType
                            : (SymbolsMapTokens[parseInfo.stream
                                .slice(parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset)
                                .toLowerCase() + "("] ?? EnumToken.FunctionTokenDefType);
                        result.push(yieldResult(parseInfo, hint));
                        next(parseInfo);
                        // consume '('
                        parseInfo.position = parseInfo.currentPosition;
                        if (hint === EnumToken.UrlFunctionTokenDefType) {
                            // consume an <url>
                            while (isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                                next(parseInfo);
                            }
                            charCode = peek(parseInfo).charCodeAt(0);
                            let values = null;
                            if (charCode == 34 /* TokenMap.DOUBLE_QUOTE */ || charCode == 39 /* TokenMap.SINGLE_QUOTE */) {
                                values = consumeString(parseInfo);
                            }
                            else {
                                do {
                                    next(parseInfo);
                                    // value = peek(parseInfo);
                                    charCode = peek(parseInfo).charCodeAt(0);
                                } while (
                                // !(value === "/" && match(parseInfo, "/*") &&
                                charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */ &&
                                    parseInfo.currentPosition < endPosition);
                            }
                            if (values != null) {
                                // NaN is not equal to NaN
                                if ((charCode = peek(parseInfo).charCodeAt(0)) != charCode) {
                                    for (let i = 0; i < values.length; i++) {
                                        values[i].token.typ = EnumToken.BadUrlTokenType;
                                    }
                                }
                                result.push(...values);
                            }
                            else if (parseInfo.position < parseInfo.currentPosition) {
                                result.push(yieldResult(parseInfo, 
                                // parseInfo.position < parseInfo.currentPosition
                                (charCode = peek(parseInfo).charCodeAt(0)) != charCode || !isURLToken(parseInfo)
                                    ? EnumToken.BadUrlTokenType
                                    : EnumToken.UrlTokenTokenType));
                            }
                        }
                        break;
                    }
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.StartParensTokenType));
                break;
            // ')'
            case 41 /* TokenMap.RIGHT_PARENTHESIS */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.EndParensTokenType));
                break;
            // '['
            case 91 /* TokenMap.LEFT_BRACKETS */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.AttrStartTokenType));
                break;
            // ']'
            case 93 /* TokenMap.RIGHT_BRACKETS */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.AttrEndTokenType));
                break;
            case 59 /* TokenMap.SEMICOLON */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.SemiColonTokenType));
                break;
            case 58 /* TokenMap.COLON */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                if (peek(parseInfo).charCodeAt(0) == 58 /* TokenMap.COLON */) {
                    next(parseInfo);
                    result.push(yieldResult(parseInfo, EnumToken.DoubleColonTokenType));
                    break;
                }
                result.push(yieldResult(parseInfo, EnumToken.ColonTokenType));
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
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);
                while (nextCharCode == 0x20 ||
                    (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                    nextCharCode == 0x2028 ||
                    nextCharCode == 0x2029) {
                    next(parseInfo);
                    nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);
                }
                result.push(yieldResult(parseInfo, EnumToken.WhitespaceTokenType));
                break;
            case 44 /* TokenMap.COMMA */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.CommaTokenType));
                break;
            case 36 /* TokenMap.DOLLAR */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, "$=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.EndMatchTokenType));
                    break;
                }
                next(parseInfo);
                break;
            case 126 /* TokenMap.TILDA */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, "~=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.IncludeMatchTokenType));
                    break;
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.Tilda));
                break;
            // case '^':
            case 94 /* TokenMap.CARET */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, "^=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.StartMatchTokenType));
                    break;
                }
                next(parseInfo);
                break;
            case 42 /* TokenMap.STAR */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, "*=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.ContainMatchTokenType));
                    break;
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.Star));
                break;
            case 38 /* TokenMap.AMPERSAND */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.NestingSelectorTokenType));
                break;
            case 124 /* TokenMap.PIPE */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                // '||'
                if (match(parseInfo, "||")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.ColumnCombinatorTokenType));
                    break;
                }
                else if (match(parseInfo, "|=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.DashMatchTokenType));
                    break;
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.Pipe));
                break;
            case 33 /* TokenMap.EXCLAMATION */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, "!important")) {
                    next(parseInfo, 10);
                    result.push(yieldResult(parseInfo, EnumToken.ImportantTokenType));
                    break;
                }
                next(parseInfo);
                break;
            case 47 /* TokenMap.SLASH */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (!match(parseInfo, "/*")) {
                    next(parseInfo);
                    result.push(yieldResult(parseInfo, SymbolsMapTokens[parseInfo.stream.slice(parseInfo.position, parseInfo.currentPosition)]));
                    break;
                }
                next(parseInfo, 2);
                while ((charCode = next(parseInfo).charCodeAt(0)) == charCode) {
                    if (charCode == 42 /* TokenMap.STAR */) {
                        if (match(parseInfo, "/")) {
                            next(parseInfo);
                            result.push(yieldResult(parseInfo, EnumToken.CommentTokenType));
                            break;
                        }
                    }
                    // else {
                    // buffer += value;
                    // }
                }
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo, EnumToken.BadCommentTokenType));
                }
                break;
            case 62 /* TokenMap.GREATERTHAN */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, ">=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.GteTokenType));
                    break;
                }
                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.GtTokenType));
                break;
            case 60 /* TokenMap.LOWERTHAN */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                if (match(parseInfo, "<=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.LteTokenType));
                    break;
                }
                next(parseInfo);
                if (match(parseInfo, "!--")) {
                    next(parseInfo, 3);
                    while ((charCode = next(parseInfo).charCodeAt(0)) == charCode) {
                        if (charCode == 45 /* TokenMap.MINUS */ && match(parseInfo, "->")) {
                            break;
                        }
                    }
                    if (parseInfo.currentPosition >= endPosition) {
                        result.push(yieldResult(parseInfo, EnumToken.BadCdoTokenType));
                    }
                    else {
                        next(parseInfo, 2);
                        result.push(yieldResult(parseInfo, EnumToken.CDOCOMMTokenType));
                    }
                }
                break;
            case 35 /* TokenMap.HASH */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                next(parseInfo);
                break;
            case 92 /* TokenMap.REVERSE_SOLIDUS */:
                if (!yieldEOFToken && parseInfo.stream.length == parseInfo.currentPosition - parseInfo.offset + 1) {
                    break;
                }
                next(parseInfo);
                // EOF
                if (!peek(parseInfo)) {
                    if (!yieldEOFToken) {
                        break;
                    }
                    // end of stream ignore \\
                    if (parseInfo.position < parseInfo.currentPosition) {
                        result.push(yieldResult(parseInfo));
                    }
                    break;
                }
                next(parseInfo);
                break;
            case 39 /* TokenMap.SINGLE_QUOTE */:
            case 34 /* TokenMap.DOUBLE_QUOTE */:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }
                result.push(...consumeString(parseInfo));
                break;
            case 46 /* TokenMap.DOT */:
                const codepoint = parseInfo.stream
                    .charAt(parseInfo.currentPosition - parseInfo.offset + 1)
                    .charCodeAt(0);
                if (!isDigit(codepoint) && parseInfo.position !== parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                    next(parseInfo, 2);
                    break;
                }
                next(parseInfo);
                break;
            default:
                next(parseInfo);
                break;
        }
        if (!yieldEOFToken && endPosition <= parseInfo.currentPosition - parseInfo.offset + 1) {
            break;
        }
    }
    if (yieldEOFToken) {
        if (parseInfo.position < parseInfo.currentPosition) {
            result.push(yieldResult(parseInfo));
        }
        result.push(yieldResult(parseInfo, EnumToken.EOFTokenType));
    }
    parseInfo.time += performance.now() - startTime;
    return result;
}
/**
 * tokenize readable stream
 * @param input
 * @param parseInfo
 */
async function* tokenizeStream(input, parseInfo) {
    const decoder = new TextDecoder("utf-8");
    const reader = input.getReader();
    parseInfo.stream = "";
    while (true) {
        const { done, value } = await reader.read();
        const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;
        if (!done) {
            parseInfo.source.append(stream);
            parseInfo.stream = (parseInfo.stream.slice(parseInfo.position - parseInfo.offset) + stream);
            parseInfo.offset = parseInfo.offset = parseInfo.position;
        }
        else {
            parseInfo.stream = "";
        }
        yield* tokenize(parseInfo, done);
        if (done) {
            break;
        }
    }
}

export { SymbolsMapTokens, TokenMap, consumeString, hintsEnum, match, next, peek, tokenize, tokenizeStream, yieldResult };
