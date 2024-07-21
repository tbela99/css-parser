import {isDigit, isNewLine, isNonPrintable, isWhiteSpace} from "./utils";
import type {Position, TokenizeResult} from "../../@types/index.d.ts";
import {EnumToken} from "../ast";

declare type InputStream = string;
declare interface ParseInfo {

    stream: InputStream;
    position: Position;
    currentPosition: Position;
}

function consumeWhiteSpace(parseInfo: ParseInfo): number {

    let count: number = 0;

    while (isWhiteSpace(parseInfo.stream.charAt(count + parseInfo.currentPosition.ind + 1).charCodeAt(0))) {

        count++;
    }

    next(parseInfo, count);
    return count;
}


function pushToken(token: string, parseInfo: ParseInfo, hint?: EnumToken): TokenizeResult {

    const result = {token, hint, position: {...parseInfo.position}, bytesIn: parseInfo.currentPosition.ind + 1};

    parseInfo.position.ind = parseInfo.currentPosition.ind;
    parseInfo.position.lin = parseInfo.currentPosition.lin;
    parseInfo.position.col = Math.max(parseInfo.currentPosition.col, 1);

    return result;
}

function* consumeString(quoteStr: '"' | "'", buffer: string, parseInfo: ParseInfo): Generator<TokenizeResult> {

    const quote = quoteStr;
    let value;
    let hasNewLine: boolean = false;

    if (buffer.length > 0) {

        yield pushToken(buffer, parseInfo);
        buffer = '';
    }

    buffer += quoteStr;

    while (value = peek(parseInfo)) {

        if (value == '\\') {

            const sequence: string = peek(parseInfo, 6);
            let escapeSequence: string = '';
            let codepoint: number;
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

                const codepoint = Number(`0x${escapeSequence.trimEnd()}`);

                if (codepoint == 0 ||
                    // leading surrogate
                    (0xD800 <= codepoint && codepoint <= 0xDBFF) ||
                    // trailing surrogate
                    (0xDC00 <= codepoint && codepoint <= 0xDFFF)) {
                    buffer += String.fromCodePoint(0xFFFD);
                } else {

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
    } else {

        // EOF - 'Unclosed-string' fixed
        yield pushToken(buffer + quote, parseInfo, EnumToken.StringTokenType);
    }
}

function peek(parseInfo: ParseInfo, count: number = 1): string {

    if (count == 1) {

        return parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1);
    }

    return parseInfo.stream.slice(parseInfo.currentPosition.ind + 1, parseInfo.currentPosition.ind + count + 1);
}

function prev(parseInfo: ParseInfo, count: number = 1): string {

    if (count == 1) {

        return parseInfo.currentPosition.ind == 0 ? '' : parseInfo.stream.charAt(parseInfo.currentPosition.ind - 1);
    }

    return parseInfo.stream.slice(parseInfo.currentPosition.ind - 1 - count, parseInfo.currentPosition.ind - 1);
}

function next(parseInfo: ParseInfo, count: number = 1): string {

    let char: string = '';
    let chr: string = '';

    if (count < 0) {

        return '';
    }

    while (count-- && (chr = parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1))) {

        char += chr;
        const codepoint: number = parseInfo.stream.charCodeAt(++parseInfo.currentPosition.ind);

        if (isNaN(codepoint)) {

            return char;
        }

        if (isNewLine(codepoint)) {

            parseInfo.currentPosition.lin++;
            parseInfo.currentPosition.col = 0;
        } else {

            parseInfo.currentPosition.col++;
        }
    }

    return char;
}


export function* tokenize(stream: InputStream): Generator<TokenizeResult> {

    const parseInfo: ParseInfo = {
        stream,
        position: {ind: 0, lin: 1, col: 1},
        currentPosition: {ind: -1, lin: 1, col: 0}
    };

    let value;
    let buffer: string = '';
    while (value = next(parseInfo)) {

        if (isWhiteSpace(value.charCodeAt(0))) {

            if (buffer.length > 0) {

                yield pushToken(buffer, parseInfo);
                buffer = '';
            }
            while (value = next(parseInfo)) {

                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }

            yield pushToken('', parseInfo, EnumToken.WhitespaceTokenType);

            buffer = '';
        }
        switch (value) {
            case '/':

                if (buffer.length > 0) {

                    yield  pushToken(buffer, parseInfo);

                    buffer = '';

                    if (peek(parseInfo) != '*') {

                        yield pushToken(value, parseInfo);
                        break;
                    }
                }

                buffer += value;

                if (peek(parseInfo) == '*') {

                    buffer += next(parseInfo);

                    while (value = next(parseInfo)) {

                        if (value == '*') {

                            buffer += value;

                            if (peek(parseInfo) == '/') {
                                yield pushToken(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType);
                                buffer = '';
                                break;
                            }
                        } else {
                            buffer += value;
                        }
                    }

                    yield pushToken(buffer, parseInfo, EnumToken.BadCommentTokenType);
                    buffer = '';
                }

                break;

            case '<':

                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                if (peek(parseInfo) == '=') {

                    yield pushToken('', parseInfo, EnumToken.LteTokenType);
                    next(parseInfo);
                    break;
                }

                buffer += value;

                if (peek(parseInfo, 3) == '!--') {

                    buffer += next(parseInfo, 3);

                    while (value = next(parseInfo)) {

                        buffer += value;
                        if (value == '-' && peek(parseInfo, 2) == '->') {

                            break;
                        }
                    }

                    if (value === '') {

                        yield pushToken(buffer, parseInfo, EnumToken.BadCdoTokenType);
                    } else {

                        yield pushToken(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType);
                    }

                    buffer = '';
                }

                break;
            case '\\':

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
            case '"':
            case "'":
                yield* consumeString(value, buffer, parseInfo);
                buffer = '';
                break;
            case '^':
            case '~':
            case '|':
            case '$':

                if (value == '|' && peek(parseInfo) == '|') {

                    next(parseInfo);
                    yield pushToken('', parseInfo, EnumToken.ColumnCombinatorTokenType);
                    buffer = '';
                    break;
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
                if (peek(parseInfo) == '=') {

                    next(parseInfo);
                    switch (buffer.charAt(0)) {

                        case '~':
                            yield pushToken(buffer, parseInfo, EnumToken.IncludeMatchTokenType);
                            break;
                        case '^':
                            yield pushToken(buffer, parseInfo, EnumToken.StartMatchTokenType);
                            break;
                        case '$':
                            yield pushToken(buffer, parseInfo, EnumToken.EndMatchTokenType);
                            break;
                        case '|':
                            yield pushToken(buffer, parseInfo, EnumToken.DashMatchTokenType);
                            break;
                    }

                    buffer = '';
                    break;
                }

                yield pushToken(buffer, parseInfo);
                buffer = '';
                break;

            case '>':

                if (buffer !== '') {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                if (peek(parseInfo) == '=') {

                    yield pushToken('', parseInfo, EnumToken.GteTokenType);
                    next(parseInfo);
                } else {

                    yield pushToken('', parseInfo, EnumToken.GtTokenType);
                }

                consumeWhiteSpace(parseInfo);
                break;
            case '.':

                const codepoint = peek(parseInfo).charCodeAt(0);

                if (!isDigit(codepoint) && buffer !== '') {
                    yield pushToken(buffer, parseInfo);
                    buffer = value;
                    break;
                }

                buffer += value;
                break;
            case '+':
            case '*':
            case ':':
            case ',':
            case '=':

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                const val: string = peek(parseInfo);

                if (val == '=') {

                    next(parseInfo);

                    yield pushToken(value + val, parseInfo, EnumToken.ContainMatchTokenType);
                    break;
                }

                if (value == ':' && ':' == val) {

                    buffer += value + next(parseInfo);
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
            case ')':

                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                break;
            case '(':

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

                    let cp: number;
                    let whitespace: string = '';
                    let hasWhiteSpace = false;
                    let errorState = false;

                    if (value == '"' || value == "'") {

                        const quote = value;
                        let inquote = true;
                        let hasNewLine = false;
                        buffer = next(parseInfo);

                        while (value = next(parseInfo)) {

                            cp = value.charCodeAt(0);

                            // consume an invalid string
                            if (inquote) {

                                buffer += value;

                                if (isNewLine(cp)) {

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

                                    cp = value.charCodeAt(0);
                                }

                                // '\\'
                                if (cp == 0x5c) {

                                    buffer += next(parseInfo);
                                } else if (value == quote) {

                                    inquote = false;
                                }

                                continue;
                            }

                            if (!inquote) {

                                if (isWhiteSpace(cp)) {

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

                                cp = value.charCodeAt(0);

                                // ')'
                                if (cp == 0x29) {

                                    yield pushToken(buffer, parseInfo, hasNewLine ? EnumToken.BadStringTokenType : EnumToken.StringTokenType);
                                    yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                                    buffer = '';
                                    break;
                                }

                                while (value = next(parseInfo)) {

                                    cp = value.charCodeAt(0);

                                    if (cp == 0x5c) {

                                        buffer += value + next(parseInfo);
                                        continue;
                                    }

                                    if (cp == 0x29) {

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
                    } else {

                        buffer = '';

                        while (value = next(parseInfo)) {

                            cp = value.charCodeAt(0);

                            // ')'
                            if (cp == 0x29) {

                                yield pushToken(buffer, parseInfo, EnumToken.UrlTokenTokenType);
                                yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                                buffer = '';
                                break;
                            }

                            if (isWhiteSpace(cp)) {

                                hasWhiteSpace = true;
                                whitespace = value;

                                while (isWhiteSpace(peek(parseInfo)?.charCodeAt(0))) {

                                    whitespace += next(parseInfo);
                                }

                                continue;
                            }

                            if (isNonPrintable(cp) ||
                                // '"'
                                cp == 0x22 ||
                                // "'"
                                cp == 0x27 ||
                                // \('
                                cp == 0x28 ||
                                hasWhiteSpace) {

                                errorState = true;
                            }

                            if (errorState) {

                                buffer += whitespace + value;

                                while (value = peek(parseInfo)) {

                                    cp = value.charCodeAt(0);

                                    if (cp == 0x5c) {

                                        buffer += next(parseInfo, 2);
                                        continue;
                                    }

                                    // ')'
                                    if (cp == 0x29) {

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

            case '[':
            case ']':
            case '{':
            case '}':
            case ';':

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                yield pushToken(value, parseInfo);
                break;

            case '!':

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                if (peek(parseInfo, 9) == 'important') {

                    yield pushToken('', parseInfo, EnumToken.ImportantTokenType);
                    next(parseInfo, 9);
                    buffer = '';
                    break;
                }

                buffer = '!';
                break;
            default:
                buffer += value;
                break;
        }
    }

    if (buffer.length > 0) {
        yield pushToken(buffer, parseInfo);
    }

    // yield pushToken('', EnumToken.EOFTokenType);
}
