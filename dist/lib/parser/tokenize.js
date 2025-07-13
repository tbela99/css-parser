import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import './parse.js';
import './utils/config.js';
import { isWhiteSpace, isIdentStart, isIdent, isNewLine, isDigit, isNonPrintable } from '../syntax/syntax.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';

var TokenMap;
(function (TokenMap) {
    TokenMap[TokenMap["SLASH"] = 47] = "SLASH";
    TokenMap[TokenMap["AMPERSAND"] = 38] = "AMPERSAND";
    TokenMap[TokenMap["LOWERTHAN"] = 60] = "LOWERTHAN";
    TokenMap[TokenMap["HASH"] = 35] = "HASH";
    TokenMap[TokenMap["REVERSE_SOLIDUS"] = 92] = "REVERSE_SOLIDUS";
    TokenMap[TokenMap["DOUBLE_QUOTE"] = 34] = "DOUBLE_QUOTE";
    TokenMap[TokenMap["SINGLE_QUOTE"] = 39] = "SINGLE_QUOTE";
    // ^
    TokenMap[TokenMap["CIRCUMFLEX"] = 94] = "CIRCUMFLEX";
    TokenMap[TokenMap["TILDA"] = 126] = "TILDA";
    TokenMap[TokenMap["PIPE"] = 124] = "PIPE";
    TokenMap[TokenMap["DOLLAR"] = 36] = "DOLLAR";
    TokenMap[TokenMap["GREATER_THAN"] = 62] = "GREATER_THAN";
    TokenMap[TokenMap["DOT"] = 46] = "DOT";
    TokenMap[TokenMap["PLUS"] = 43] = "PLUS";
    TokenMap[TokenMap["STAR"] = 42] = "STAR";
    TokenMap[TokenMap["COLON"] = 58] = "COLON";
    TokenMap[TokenMap["COMMA"] = 44] = "COMMA";
    TokenMap[TokenMap["EQUAL"] = 61] = "EQUAL";
    TokenMap[TokenMap["CLOSE_PAREN"] = 41] = "CLOSE_PAREN";
    TokenMap[TokenMap["OPEN_PAREN"] = 40] = "OPEN_PAREN";
    TokenMap[TokenMap["OPEN_BRACKET"] = 91] = "OPEN_BRACKET";
    TokenMap[TokenMap["CLOSE_BRACKET"] = 93] = "CLOSE_BRACKET";
    TokenMap[TokenMap["OPEN_CURLY_BRACE"] = 123] = "OPEN_CURLY_BRACE";
    TokenMap[TokenMap["CLOSE_CURLY_BRACE"] = 125] = "CLOSE_CURLY_BRACE";
    TokenMap[TokenMap["SEMICOLON"] = 59] = "SEMICOLON";
    TokenMap[TokenMap["EXCLAMATION"] = 33] = "EXCLAMATION";
    TokenMap[TokenMap["AT"] = 64] = "AT";
})(TokenMap || (TokenMap = {}));
function consumeWhiteSpace(parseInfo) {
    let count = 0;
    while (isWhiteSpace(parseInfo.stream.charAt(count + parseInfo.currentPosition.ind + 1).charCodeAt(0))) {
        count++;
    }
    next(parseInfo, count);
    return count;
}
function pushToken(token, parseInfo, hint) {
    const result = {
        token,
        len: parseInfo.currentPosition.ind - parseInfo.position.ind - 1,
        hint,
        sta: { ...parseInfo.position },
        end: { ...parseInfo.currentPosition },
        bytesIn: parseInfo.currentPosition.ind + 1
    };
    parseInfo.position.ind = parseInfo.currentPosition.ind;
    parseInfo.position.lin = parseInfo.currentPosition.lin;
    parseInfo.position.col = Math.max(parseInfo.currentPosition.col, 1);
    if (result.end.col == 0) {
        result.end.col = 1;
    }
    return result;
}
function* consumeString(quoteStr, buffer, parseInfo) {
    const quote = quoteStr;
    let value;
    let hasNewLine = false;
    if (buffer.length > 0) {
        yield pushToken(buffer, parseInfo);
        buffer = '';
    }
    buffer += quoteStr;
    while (value = peek(parseInfo)) {
        if (value == '\\') {
            const sequence = peek(parseInfo, 6);
            let escapeSequence = '';
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
            if (i == 1) {
                buffer += value + sequence[i];
                next(parseInfo, 2);
                continue;
            }
            if (escapeSequence.trimEnd().length > 0) {
                const codepoint = parseInt(escapeSequence, 16);
                if (codepoint == 0 ||
                    // leading surrogate
                    (0xD800 <= codepoint && codepoint <= 0xDBFF) ||
                    // trailing surrogate
                    (0xDC00 <= codepoint && codepoint <= 0xDFFF)) {
                    buffer += String.fromCodePoint(0xFFFD);
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
            yield pushToken(buffer, parseInfo, hasNewLine ? EnumToken.BadStringTokenType : EnumToken.StringTokenType);
            next(parseInfo);
            // i += value.length;
            buffer = '';
            return;
        }
        if (isNewLine(value.charCodeAt(0))) {
            hasNewLine = true;
        }
        if (hasNewLine && value == ';') {
            yield pushToken(buffer + value, parseInfo, EnumToken.BadStringTokenType);
            buffer = '';
            next(parseInfo);
            break;
        }
        buffer += value;
        next(parseInfo);
    }
    if (hasNewLine) {
        yield pushToken(buffer, parseInfo, EnumToken.BadStringTokenType);
    }
    else {
        // EOF - 'Unclosed-string' fixed
        yield pushToken(buffer + quote, parseInfo, EnumToken.StringTokenType);
    }
}
function match(parseInfo, input) {
    return parseInfo.stream.slice(parseInfo.currentPosition.ind + 1, parseInfo.currentPosition.ind + input.length + 1) == input;
}
function peek(parseInfo, count = 1) {
    if (count == 1) {
        return parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1);
    }
    return parseInfo.stream.slice(parseInfo.currentPosition.ind + 1, parseInfo.currentPosition.ind + count + 1);
}
function prev(parseInfo, count = 1) {
    if (count == 1) {
        return parseInfo.currentPosition.ind == 0 ? '' : parseInfo.stream.charAt(parseInfo.currentPosition.ind - 1);
    }
    return parseInfo.stream.slice(parseInfo.currentPosition.ind - 1 - count, parseInfo.currentPosition.ind - 1);
}
function next(parseInfo, count = 1) {
    let char = '';
    let chr = '';
    if (count < 0) {
        return '';
    }
    while (count-- && (chr = parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1))) {
        char += chr;
        const codepoint = parseInfo.stream.charCodeAt(++parseInfo.currentPosition.ind);
        if (isNaN(codepoint)) {
            return char;
        }
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
 * @param stream
 */
function* tokenize(stream) {
    const parseInfo = {
        stream,
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    };
    let value;
    let buffer = '';
    let charCode;
    while (value = next(parseInfo)) {
        charCode = value.charCodeAt(0);
        if (isWhiteSpace(charCode)) {
            if (buffer.length > 0) {
                yield pushToken(buffer, parseInfo);
                buffer = '';
            }
            while (value = next(parseInfo)) {
                charCode = value.charCodeAt(0);
                if (!isWhiteSpace(charCode)) {
                    break;
                }
            }
            yield pushToken('', parseInfo, EnumToken.WhitespaceTokenType);
            buffer = '';
        }
        switch (charCode) {
            case 47 /* TokenMap.SLASH */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                    if (!match(parseInfo, '*')) {
                        yield pushToken(value, parseInfo);
                        break;
                    }
                }
                buffer += value;
                if (match(parseInfo, '*')) {
                    buffer += next(parseInfo);
                    while (value = next(parseInfo)) {
                        if (value == '*') {
                            buffer += value;
                            if (match(parseInfo, '/')) {
                                yield pushToken(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType);
                                buffer = '';
                                break;
                            }
                        }
                        else {
                            buffer += value;
                        }
                    }
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo, EnumToken.BadCommentTokenType);
                        buffer = '';
                    }
                }
                break;
            case 38 /* TokenMap.AMPERSAND */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                yield pushToken(value, parseInfo);
                break;
            case 60 /* TokenMap.LOWERTHAN */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                if (match(parseInfo, '=')) {
                    yield pushToken('', parseInfo, EnumToken.LteTokenType);
                    next(parseInfo);
                    break;
                }
                buffer += value;
                if (match(parseInfo, '!--')) {
                    buffer += next(parseInfo, 3);
                    while (value = next(parseInfo)) {
                        buffer += value;
                        if (value == '-' && match(parseInfo, '->')) {
                            break;
                        }
                    }
                    if (value === '') {
                        yield pushToken(buffer, parseInfo, EnumToken.BadCdoTokenType);
                    }
                    else {
                        yield pushToken(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType);
                    }
                    buffer = '';
                }
                break;
            case 35 /* TokenMap.HASH */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                buffer += value;
                break;
            case 92 /* TokenMap.REVERSE_SOLIDUS */:
                // EOF
                if (!(value = next(parseInfo))) {
                    // end of stream ignore \\
                    if (buffer.length > 0) {
                        yield pushToken(buffer, parseInfo);
                        buffer = '';
                    }
                    break;
                }
                buffer += prev(parseInfo) + value;
                break;
            case 39 /* TokenMap.SINGLE_QUOTE */:
            case 34 /* TokenMap.DOUBLE_QUOTE */:
                yield* consumeString(value, buffer, parseInfo);
                buffer = '';
                break;
            case 94 /* TokenMap.CIRCUMFLEX */:
            case 126 /* TokenMap.TILDA */:
            case 124 /* TokenMap.PIPE */:
            case 36 /* TokenMap.DOLLAR */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                if (charCode == 124 /* TokenMap.PIPE */) {
                    if (match(parseInfo, '|')) {
                        next(parseInfo);
                        yield pushToken('', parseInfo, EnumToken.ColumnCombinatorTokenType);
                    }
                    else if (match(parseInfo, '=')) {
                        buffer += next(parseInfo);
                        yield pushToken(buffer, parseInfo);
                    }
                    else {
                        yield pushToken('|', parseInfo);
                    }
                    buffer = '';
                    continue;
                }
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                buffer += value;
                if (!(value = peek(parseInfo))) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                    break;
                }
                // ~=
                // ^=
                // $=
                // |=
                if (match(parseInfo, '=')) {
                    next(parseInfo);
                    switch (buffer.charCodeAt(0)) {
                        case 126 /* TokenMap.TILDA */:
                            yield pushToken(buffer, parseInfo, EnumToken.IncludeMatchTokenType);
                            break;
                        case 94 /* TokenMap.CIRCUMFLEX */:
                            yield pushToken(buffer, parseInfo, EnumToken.StartMatchTokenType);
                            break;
                        case 36 /* TokenMap.DOLLAR */:
                            yield pushToken(buffer, parseInfo, EnumToken.EndMatchTokenType);
                            break;
                        case 124 /* TokenMap.PIPE */:
                            yield pushToken(buffer, parseInfo, EnumToken.DashMatchTokenType);
                            break;
                    }
                    buffer = '';
                    break;
                }
                yield pushToken(buffer, parseInfo);
                buffer = '';
                break;
            case 62 /* TokenMap.GREATER_THAN */:
                if (buffer !== '') {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                if (match(parseInfo, '=')) {
                    yield pushToken('', parseInfo, EnumToken.GteTokenType);
                    next(parseInfo);
                }
                else {
                    yield pushToken('', parseInfo, EnumToken.GtTokenType);
                }
                consumeWhiteSpace(parseInfo);
                break;
            case 46 /* TokenMap.DOT */:
                const codepoint = peek(parseInfo).charCodeAt(0);
                if (!isDigit(codepoint) && buffer !== '') {
                    yield pushToken(buffer, parseInfo);
                    buffer = value;
                    break;
                }
                buffer += value;
                break;
            case 58 /* TokenMap.COLON */:
            case 43 /* TokenMap.PLUS */:
            case 42 /* TokenMap.STAR */:
            case 44 /* TokenMap.COMMA */:
            case 61 /* TokenMap.EQUAL */:
                if (buffer.length > 0 && buffer != ':') {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                const val = peek(parseInfo);
                if (val == '=') {
                    next(parseInfo);
                    yield pushToken(value + val, parseInfo, EnumToken.ContainMatchTokenType);
                    break;
                }
                if (value == ':') {
                    if (isWhiteSpace(val.codePointAt(0))) {
                        yield pushToken(value, parseInfo, EnumToken.ColonTokenType);
                        buffer = '';
                        break;
                    }
                    buffer += value;
                    break;
                }
                yield pushToken(value, parseInfo);
                buffer = '';
                if (['+', '*', '/'].includes(value) && isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                    yield pushToken(next(parseInfo), parseInfo);
                }
                while (isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                    next(parseInfo);
                }
                break;
            case 41 /* TokenMap.CLOSE_PAREN */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                break;
            case 40 /* TokenMap.OPEN_PAREN */:
                if (buffer.length == 0) {
                    yield pushToken(value, parseInfo);
                    break;
                }
                buffer += value;
                // @ts-ignore
                if (buffer == 'url(') {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                    consumeWhiteSpace(parseInfo);
                    value = peek(parseInfo);
                    // let cp: number;
                    let whitespace = '';
                    let hasWhiteSpace = false;
                    let errorState = false;
                    if (value == '"' || value == "'") {
                        const quote = value;
                        let inquote = true;
                        let hasNewLine = false;
                        buffer = next(parseInfo);
                        while (value = next(parseInfo)) {
                            charCode = value.charCodeAt(0);
                            // consume an invalid string
                            if (inquote) {
                                buffer += value;
                                if (isNewLine(charCode)) {
                                    hasNewLine = true;
                                    while (value = next(parseInfo)) {
                                        buffer += value;
                                        if (value == ';') {
                                            inquote = false;
                                            break;
                                        }
                                    }
                                    if (value === '') {
                                        yield pushToken(buffer, parseInfo, EnumToken.BadUrlTokenType);
                                        buffer = '';
                                        break;
                                    }
                                    charCode = value.charCodeAt(0);
                                }
                                // '\\'
                                if (charCode == 0x5c) {
                                    buffer += next(parseInfo);
                                }
                                else if (value == quote) {
                                    inquote = false;
                                }
                                continue;
                            }
                            if (!inquote) {
                                if (isWhiteSpace(charCode)) {
                                    whitespace += value;
                                    while (value = peek(parseInfo)) {
                                        hasWhiteSpace = true;
                                        if (isWhiteSpace(value?.charCodeAt(0))) {
                                            whitespace += next(parseInfo);
                                            continue;
                                        }
                                        break;
                                    }
                                    if (!(value = next(parseInfo))) {
                                        yield pushToken(buffer, parseInfo, hasNewLine ? EnumToken.BadUrlTokenType : EnumToken.UrlTokenTokenType);
                                        buffer = '';
                                        break;
                                    }
                                }
                                charCode = value.charCodeAt(0);
                                // ')'
                                if (charCode == 0x29) {
                                    yield pushToken(buffer, parseInfo, hasNewLine ? EnumToken.BadStringTokenType : EnumToken.StringTokenType);
                                    yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                                    buffer = '';
                                    break;
                                }
                                while (value = next(parseInfo)) {
                                    charCode = value.charCodeAt(0);
                                    if (charCode == 0x5c) {
                                        buffer += value + next(parseInfo);
                                        continue;
                                    }
                                    if (charCode == 0x29) {
                                        yield pushToken(buffer, parseInfo, EnumToken.BadStringTokenType);
                                        yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                                        buffer = '';
                                        break;
                                    }
                                    buffer += value;
                                }
                                if (hasNewLine) {
                                    yield pushToken(buffer, parseInfo, EnumToken.BadStringTokenType);
                                    buffer = '';
                                }
                                break;
                            }
                            buffer += value;
                        }
                        break;
                    }
                    else {
                        buffer = '';
                        while (value = next(parseInfo)) {
                            charCode = value.charCodeAt(0);
                            // ')'
                            if (charCode == 0x29) {
                                yield pushToken(buffer, parseInfo, EnumToken.UrlTokenTokenType);
                                yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                                buffer = '';
                                break;
                            }
                            if (isWhiteSpace(charCode)) {
                                hasWhiteSpace = true;
                                whitespace = value;
                                while (isWhiteSpace(peek(parseInfo)?.charCodeAt(0))) {
                                    whitespace += next(parseInfo);
                                }
                                continue;
                            }
                            if (isNonPrintable(charCode) ||
                                // '"'
                                charCode == 0x22 ||
                                // "'"
                                charCode == 0x27 ||
                                // \('
                                charCode == 0x28 ||
                                hasWhiteSpace) {
                                errorState = true;
                            }
                            if (errorState) {
                                buffer += whitespace + value;
                                while (value = peek(parseInfo)) {
                                    charCode = value.charCodeAt(0);
                                    if (charCode == 0x5c) {
                                        buffer += next(parseInfo, 2);
                                        continue;
                                    }
                                    // ')'
                                    if (charCode == 0x29) {
                                        break;
                                    }
                                    buffer += next(parseInfo);
                                }
                                yield pushToken(buffer, parseInfo, EnumToken.BadUrlTokenType);
                                buffer = '';
                                break;
                            }
                            buffer += value;
                        }
                    }
                    if (buffer !== '') {
                        yield pushToken(buffer, parseInfo, EnumToken.UrlTokenTokenType);
                        buffer = '';
                        break;
                    }
                    break;
                }
                yield pushToken(buffer, parseInfo);
                buffer = '';
                break;
            case 91 /* TokenMap.OPEN_BRACKET */:
            case 93 /* TokenMap.CLOSE_BRACKET */:
            case 123 /* TokenMap.OPEN_CURLY_BRACE */:
            case 125 /* TokenMap.CLOSE_CURLY_BRACE */:
            case 59 /* TokenMap.SEMICOLON */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                yield pushToken(value, parseInfo);
                break;
            case 33 /* TokenMap.EXCLAMATION */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                if (match(parseInfo, 'important')) {
                    yield pushToken('', parseInfo, EnumToken.ImportantTokenType);
                    next(parseInfo, 9);
                    buffer = '';
                    break;
                }
                buffer = '!';
                break;
            case 64 /* TokenMap.AT */:
                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }
                buffer = value;
                {
                    let val = peek(parseInfo);
                    if (val == '-' || isIdentStart(val.charCodeAt(0))) {
                        buffer = next(parseInfo);
                        val = peek(parseInfo);
                        while (isIdent(val) || val == '-') {
                            buffer += next(parseInfo);
                            val = peek(parseInfo);
                        }
                        yield pushToken(buffer, parseInfo, EnumToken.AtRuleTokenType);
                        buffer = '';
                    }
                }
                break;
            default:
                buffer += value;
                if (buffer.length == 1) {
                    if (buffer == 'h') {
                        if (match(parseInfo, 'ttp://') || match(parseInfo, 'ttps://')) {
                            let val = peek(parseInfo);
                            while (val != ')' && val != ';' && !isWhiteSpace(val.charCodeAt(0))) {
                                buffer += next(parseInfo);
                                val = peek(parseInfo);
                            }
                            yield pushToken(buffer, parseInfo);
                            buffer = '';
                            break;
                        }
                    }
                }
                break;
        }
    }
    if (buffer.length > 0) {
        yield pushToken(buffer, parseInfo);
    }
    yield pushToken('', parseInfo, EnumToken.EOFTokenType);
}

export { tokenize };
