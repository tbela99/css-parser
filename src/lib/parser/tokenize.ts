import type {ParseInfo, TokenizeResult} from "../../@types/index.d.ts";
import {EnumToken} from "../ast/index.ts";
import {isDigit, isIdent, isIdentStart, isNewLine, isNonPrintable, isWhiteSpace} from "../syntax/index.ts";

const enum TokenMap {

    SLASH = 47, // '/'
    AMPERSAND = 38, // '&', AMPERSAND
    LOWERTHAN = 60, // '<', LESS THAN
    HASH = 35, // '#', HASH
    REVERSE_SOLIDUS = 92, // '\', REVERSE SOLIDUS
    DOUBLE_QUOTE = 34, // '"', DOUBLEQ
    SINGLE_QUOTE = 39, // "'", SINGLEQ
    // ^
    CIRCUMFLEX = 94, // '^', CIRC
    TILDA = 126, // '~', TILDE
    PIPE = 124, // '|', PIPE
    DOLLAR = 36, // '$', DOLLAR
    GREATER_THAN = 62, // '>', GREATERTHAN
    DOT = 46, // '.', DOT
    PLUS = 43, // '+', PLUS
    STAR = 42, // '*', STAR
    COLON = 58, // ':', COLON
    COMMA = 44, // ',', COMMA
    EQUAL = 61, // '=', EQUAL
    CLOSE_PAREN = 41, // ')', CLOSE PARENTHESIS
    OPEN_PAREN = 40, // '(', OPEN PARENTHESIS
    OPEN_BRACKET = 91, // '[', OPEN BRACKET PARE
    CLOSE_BRACKET = 93,     // N
    OPEN_CURLY_BRACE = 123, // '{', OPEN CURLY BRACE
    CLOSE_CURLY_BRACE = 125, // '}', CLOSE CURLY BRACE
    SEMICOLON = 59, // ';', SEMICOLON
    EXCLAMATION = 33, // '!', EXCLAMATION
    AT = 64, // '@', AT
}

function consumeWhiteSpace(parseInfo: ParseInfo): number {

    let count: number = 0;

    while (isWhiteSpace(parseInfo.stream.charCodeAt(count + parseInfo.currentPosition.ind + 1))) {

        count++;
    }

    next(parseInfo, count);
    return count;
}

function pushToken(token: string, parseInfo: ParseInfo, hint?: EnumToken): TokenizeResult {

    const result = {
        token,
        len: parseInfo.currentPosition.ind - parseInfo.position.ind - 1,
        hint,
        sta: {...parseInfo.position},
        end: {...parseInfo.currentPosition},
        bytesIn: parseInfo.currentPosition.ind + 1
    } as TokenizeResult;

    parseInfo.position.ind = parseInfo.currentPosition.ind;
    parseInfo.position.lin = parseInfo.currentPosition.lin;
    parseInfo.position.col = Math.max(parseInfo.currentPosition.col, 1);

    if (result.end.col == 0) {

        result.end.col = 1
    }

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

            if (escapeSequence.trimEnd().length > 0) {

                const codepoint = parseInt(escapeSequence, 16);

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

function match(parseInfo: ParseInfo, input: string): boolean {

    return parseInfo.stream.slice(parseInfo.currentPosition.ind + 1, parseInfo.currentPosition.ind + input.length + 1) == input;
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

    while (count-- && (chr = parseInfo.stream.charAt(parseInfo.currentPosition.ind + 1))) {

        char += chr;
        const codepoint: number = parseInfo.stream.charCodeAt(++parseInfo.currentPosition.ind);

        if (isNewLine(codepoint)) {

            parseInfo.currentPosition.lin++;
            parseInfo.currentPosition.col = 0;
        } else {

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
export function* tokenize(parseInfo: ParseInfo, yieldEOFToken: boolean = true): Generator<TokenizeResult> {

    let value: string;
    let buffer: string = parseInfo.buffer;
    let charCode: number;

    parseInfo.buffer = '';

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

            case TokenMap.SLASH:

                if (buffer.length > 0) {

                    yield  pushToken(buffer, parseInfo);

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

                        } else {
                            buffer += value;
                        }
                    }

                    if (buffer.length > 0) {

                        yield pushToken(buffer, parseInfo, EnumToken.BadCommentTokenType);
                        buffer = '';
                    }
                }

                break;

            case TokenMap.AMPERSAND:

                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                yield pushToken(value, parseInfo);
                break;

            case TokenMap.LOWERTHAN:

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
                    } else {

                        yield pushToken(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType);
                    }

                    buffer = '';
                }

                break;

            case TokenMap.HASH:

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                buffer += value;
                break;

            case TokenMap.REVERSE_SOLIDUS:

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

            case  TokenMap.SINGLE_QUOTE:
            case TokenMap.DOUBLE_QUOTE:

                yield* consumeString(value as '"' | "'", buffer, parseInfo);
                buffer = '';
                break;

            case TokenMap.CIRCUMFLEX:
            case TokenMap.TILDA:
            case TokenMap.PIPE:
            case TokenMap.DOLLAR:

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                if (charCode == TokenMap.PIPE) {

                    if (match(parseInfo, '|')) {

                        next(parseInfo);

                        yield pushToken('', parseInfo, EnumToken.ColumnCombinatorTokenType);
                    } else if (match(parseInfo, '=')) {

                        buffer += next(parseInfo);
                        yield pushToken(buffer, parseInfo);
                    } else {

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

                        case TokenMap.TILDA:
                            yield pushToken(buffer, parseInfo, EnumToken.IncludeMatchTokenType);
                            break;
                        case TokenMap.CIRCUMFLEX:
                            yield pushToken(buffer, parseInfo, EnumToken.StartMatchTokenType);
                            break;
                        case TokenMap.DOLLAR:
                            yield pushToken(buffer, parseInfo, EnumToken.EndMatchTokenType);
                            break;
                        case TokenMap.PIPE:
                            yield pushToken(buffer, parseInfo, EnumToken.DashMatchTokenType);
                            break;
                    }

                    buffer = '';
                    break;
                }

                yield pushToken(buffer, parseInfo);
                buffer = '';
                break;

            case TokenMap.GREATER_THAN:

                if (buffer !== '') {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                if (match(parseInfo, '=')) {

                    yield pushToken('', parseInfo, EnumToken.GteTokenType);
                    next(parseInfo);
                } else {

                    yield pushToken('', parseInfo, EnumToken.GtTokenType);
                }

                consumeWhiteSpace(parseInfo);
                break;

            case TokenMap.DOT:

                const codepoint = peek(parseInfo).charCodeAt(0);

                if (!isDigit(codepoint) && buffer !== '') {
                    yield pushToken(buffer, parseInfo);
                    buffer = value;
                    break;
                }

                buffer += value;
                break;
            case TokenMap.COLON:

            case TokenMap.PLUS:
            case TokenMap.STAR:
            case TokenMap.COMMA:
            case TokenMap.EQUAL:

                if (buffer.length > 0 && buffer != ':') {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                const val: string = peek(parseInfo);

                if (val == '=') {

                    next(parseInfo);

                    yield pushToken(value + val, parseInfo, EnumToken.ContainMatchTokenType);
                    break;
                }

                if (value == ':') {

                    if (isWhiteSpace(val.codePointAt(0) as number)) {

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
            case TokenMap.CLOSE_PAREN:

                if (buffer.length > 0) {
                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                yield pushToken('', parseInfo, EnumToken.EndParensTokenType);
                break;
            case TokenMap.OPEN_PAREN:

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
                    let whitespace: string = '';
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
                                } else if (value == quote) {

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
                    } else {

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

                            // if (isWhiteSpace(charCode)) {
                            //
                            //     hasWhiteSpace = true;
                            //     whitespace = value;
                            //
                            //     while (isWhiteSpace(peek(parseInfo)?.charCodeAt(0))) {
                            //
                            //         whitespace += next(parseInfo);
                            //     }
                            //
                            //     continue;
                            // }

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

                            // if (errorState) {
                            //
                            //     buffer += whitespace + value;
                            //
                            //     while (value = peek(parseInfo)) {
                            //
                            //         charCode = value.charCodeAt(0);
                            //
                            //         if (charCode == 0x5c) {
                            //
                            //             buffer += next(parseInfo, 2);
                            //             continue;
                            //         }
                            //
                            //         // ')'
                            //         if (charCode == 0x29) {
                            //
                            //             break;
                            //         }
                            //
                            //         buffer += next(parseInfo);
                            //     }
                            //
                            //     yield pushToken(buffer, parseInfo, EnumToken.BadUrlTokenType);
                            //     buffer = '';
                            //     break;
                            // }

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

            case TokenMap.OPEN_BRACKET:
            case TokenMap.CLOSE_BRACKET:
            case TokenMap.OPEN_CURLY_BRACE:
            case TokenMap.CLOSE_CURLY_BRACE:
            case TokenMap.SEMICOLON:

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                yield pushToken(value, parseInfo);
                break;

            case  TokenMap.EXCLAMATION:

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

            case TokenMap.AT:

                if (buffer.length > 0) {

                    yield pushToken(buffer, parseInfo);
                    buffer = '';
                }

                buffer = value;

            {
                let val: string = peek(parseInfo);

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

                            let val: string = peek(parseInfo);
                            while (val != ')' && val != ';'&& !isWhiteSpace(val.charCodeAt(0))) {

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

    if (yieldEOFToken) {

        if (buffer.length > 0) {
            yield pushToken(buffer, parseInfo);
        }

        yield pushToken('', parseInfo, EnumToken.EOFTokenType);
    }

    else {

        parseInfo.buffer = buffer;
    }
}

/**
 * tokenize css stream
 * @param input
 */
export async function* tokenizeStream(input: ReadableStream): AsyncGenerator<TokenizeResult> {

    const parseInfo: ParseInfo = {
        stream: '',
        buffer: '',
        position: {ind: 0, lin: 1, col: 1},
        currentPosition: {ind: -1, lin: 1, col: 0}
    };

    const decoder = new TextDecoder('utf-8');
    const reader = input.getReader();

    while (true) {

        const {done, value} = await reader.read();

        parseInfo.stream += decoder.decode(value, {stream: true});
        yield *tokenize(parseInfo, done);

        if (done) {
            break;
        }
    }
}
