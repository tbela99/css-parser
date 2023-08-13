import {Token, TokenizeResult} from "../../@types";
import {
    isDigit,
    isNewLine,
    isWhiteSpace
} from "./utils";

export function* tokenize(iterator: string): Generator<TokenizeResult> {

    let ind: number = -1;
    let lin: number = 1;
    let col: number = 0;

    const position = {

        ind: Math.max(ind, 0),
        lin: lin,
        col: Math.max(col, 1)
    };

    let value;
    let buffer: string = '';

    function consumeWhiteSpace(): number {

        let count: number = 0;

        while (isWhiteSpace(iterator.charAt(count + ind + 1).charCodeAt(0))) {

            count++;
        }

        next(count);
        return count;
    }

    function pushToken(token: string, hint?: string): TokenizeResult {

        const result = {token, hint, position: {...position}, bytesIn: ind};

        position.ind = ind;
        position.lin = lin;
        position.col = col == 0 ? 1 : col;
        return result;
    }

    function* consumeString(quoteStr: '"' | "'"): Generator<TokenizeResult> {

        const quote = quoteStr;
        let value;
        let hasNewLine: boolean = false;

        if (buffer.length > 0) {

            yield pushToken(buffer);
            buffer = '';
        }

        buffer += quoteStr;

        while (value = peek()) {

            if (value == '\\') {

                const sequence: string = peek(6);
                let escapeSequence: string = '';
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

                // not hex or new line
                // @ts-ignore
                if (i == 1 && !isNewLine(codepoint)) {

                    buffer += value + sequence[i];
                    next(2);
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

                    next(escapeSequence.length + 1);
                    continue;
                }

                buffer += next(2);
                continue;
            }

            if (value == quote) {

                buffer += value;
                yield pushToken(buffer, hasNewLine ? 'Bad-string' : 'String');
                next();
                // i += value.length;
                buffer = '';
                break;
            }

            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }

            if (hasNewLine && value == ';') {
                yield pushToken(buffer, 'Bad-string',);
                buffer = '';
                break;
            }

            buffer += value;
            next();
        }
    }

    function peek(count: number = 1): string {

        if (count == 1) {

            return iterator.charAt(ind + 1);
        }

        return iterator.slice(ind + 1, ind + count + 1);
    }

    function prev(count: number = 1): string {

        if (count == 1) {

            return ind == 0 ? '' : iterator.charAt(ind - 1);
        }

        return iterator.slice(ind - 1 - count, ind - 1);
    }

    function next(count: number = 1): string {

        let char: string = '';

        while (count-- > 0 && ind < iterator.length) {

            const codepoint: number = iterator.charCodeAt(++ind);

            if (isNaN(codepoint)) {

                return char;
            }

            char += iterator.charAt(ind);

            if (isNewLine(codepoint)) {

                lin++;
                col = 0;
            } else {

                col++;
            }
        }

        return char;
    }

    while (value = next()) {

        if (ind >= iterator.length) {
            if (buffer.length > 0) {
                yield pushToken(buffer);
                buffer = '';
            }
            break;
        }
        if (isWhiteSpace(value.charCodeAt(0))) {

            if (buffer.length > 0) {

                yield pushToken(buffer);
                buffer = '';
            }
            while (value = next()) {

                if (ind >= iterator.length) {
                    break;
                }
                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }

            yield pushToken('', 'Whitespace');

            buffer = '';

            if (ind >= iterator.length) {

                break;
            }
        }
        switch (value) {
            case '/':

                if (buffer.length > 0) {

                    yield  pushToken(buffer);

                    buffer = '';

                    if (peek() != '*') {

                        yield pushToken(value);
                        break;
                    }
                }
                buffer += value;
                if (peek() == '*') {

                    buffer += '*';
                    // i++;
                    next();

                    while (value = next()) {

                        if (ind >= iterator.length) {

                            yield pushToken(buffer, 'Bad-comment');
                            break;
                        }
                        if (value == '\\') {
                            buffer += value;
                            value = next();
                            if (ind >= iterator.length) {
                                yield pushToken(buffer, 'Bad-comment');
                                break;
                            }
                            buffer += value;
                            continue;
                        }
                        if (value == '*') {

                            buffer += value;
                            value = next();

                            if (ind >= iterator.length) {

                                yield pushToken(buffer, 'Bad-comment');
                                break;
                            }
                            buffer += value;
                            if (value == '/') {
                                yield pushToken(buffer, 'Comment');
                                buffer = '';
                                break;
                            }
                        } else {
                            buffer += value;
                        }
                    }
                }
                break;
            case '<':

                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }

                if (peek() == '=') {

                    yield pushToken('', 'Lte');
                    next();
                    break;
                }

                buffer += value;
                value = next();
                if (ind >= iterator.length) {
                    break;
                }

                if (peek(3) == '!--') {

                    while (value = next()) {

                        if (ind >= iterator.length) {
                            break;
                        }
                        buffer += value;
                        if (value == '>' && prev(2) == '--') {

                            yield pushToken(buffer, 'CDOCOMM');
                            buffer = '';
                            break;
                        }
                    }
                }

                if (ind >= iterator.length) {

                    yield pushToken(buffer, 'BADCDO');
                    buffer = '';
                }

                break;
            case '\\':

                value = next();

                // EOF
                if (ind + 1 >= iterator.length) {
                    // end of stream ignore \\
                    yield pushToken(buffer);
                    buffer = '';
                    break;
                }

                buffer += prev() + value;

                break;
            case '"':
            case "'":
                yield* consumeString(value);
                break;
            case '~':
            case '|':

                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= iterator.length) {
                    yield pushToken(buffer);
                    buffer = '';
                    break;
                }
                if (value == '=') {

                    buffer += value;
                    yield pushToken(buffer, buffer[0] == '~' ? 'Includes' : 'Dash-matches');

                    buffer = '';
                    break;
                }

                yield pushToken(buffer);

                while (isWhiteSpace(value.charCodeAt(0))) {

                    value = next();
                }

                buffer = value;
                break;

            case '>':

                if (buffer !== '') {
                    yield pushToken(buffer);
                    buffer = '';
                }

                if (peek() == '=') {

                    yield pushToken('', 'Gte');
                    next();
                }
                else {

                    yield pushToken('', 'Gt');
                }

                consumeWhiteSpace();
                break;
            case '.':

                const codepoint = peek().charCodeAt(0);

                if (!isDigit(codepoint) && buffer !== '') {
                    yield pushToken(buffer);
                    buffer = value;
                    break;
                }

                buffer += value;
                break;
            case '+':
            case ':':
            case ',':
            case '=':

                if (buffer.length > 0) {

                    yield pushToken(buffer);
                    buffer = '';
                }

                if (value == ':' && ':' == peek()) {

                    buffer += value + next();
                    break;
                }

                yield pushToken(value);
                buffer = '';

                if (value == '+' && isWhiteSpace(peek().charCodeAt(0))) {

                    yield pushToken(next());
                }
                while (isWhiteSpace(peek().charCodeAt(0))) {

                    next();
                }

                break;
            case ')':

                if (buffer.length > 0) {
                    yield pushToken(buffer);
                    buffer = '';
                }

                yield pushToken('', 'End-parens');
                break;
            case '(':

                if (buffer.length == 0) {

                    yield pushToken('', 'Start-parens');
                    break;
                }

                buffer += value;

                // @ts-ignore
                if (buffer == 'url(') {

                    yield pushToken(buffer);
                    buffer = '';

                    // consume either string or url token
                    let whitespace = '';

                    value = peek();

                    while (isWhiteSpace(value.charCodeAt(0))) {

                        whitespace += value;
                    }

                    if (whitespace.length > 0) {

                        next(whitespace.length);
                    }

                    value = peek();

                    if (value == '"' || value == "'") {

                        yield* consumeString(<'"' | "'">next());

                        break;
                    } else {

                        buffer = '';

                        do {

                            let cp = value.charCodeAt(0);

                            // EOF -
                            if (cp == null) {

                                yield pushToken('', 'Bad-url-token');
                                break;
                            }

                            // ')'
                            if (cp == 0x29 || cp == null) {

                                if (buffer.length == 0) {

                                    yield pushToken(buffer, 'Bad-url-token');
                                } else {

                                    yield pushToken(buffer, 'Url-token');
                                }

                                if (cp != null) {

                                    yield pushToken(next());
                                }

                                break;
                            }

                            if (isWhiteSpace(cp)) {

                                whitespace = next();

                                while (true) {

                                    value = peek();
                                    cp = value.charCodeAt(0);

                                    if (isWhiteSpace(cp)) {
                                        whitespace += value;
                                        continue;
                                    }

                                    break;
                                }

                                if (cp == null || cp == 0x29) {
                                    continue;
                                }

                                // bad url token
                                buffer += next(whitespace.length);

                                do {

                                    value = peek();
                                    cp = value.charCodeAt(0);

                                    if (cp == null || cp == 0x29) {
                                        break;
                                    }

                                    buffer += next();
                                }

                                while (true);

                                yield pushToken(buffer, 'Bad-url-token');
                                continue;
                            }

                            buffer += next();
                            value = peek();
                        }
                        while (true);
                        buffer = '';
                    }

                    break;
                }

                yield pushToken(buffer);
                buffer = '';
                break;

            case '[':
            case ']':
            case '{':
            case '}':
            case ';':

                if (buffer.length > 0) {

                    yield pushToken(buffer);
                    buffer = '';
                }

                yield pushToken(value);
                break;

            case '!':

                if (buffer.length > 0) {

                    yield pushToken(buffer);
                    buffer = '';
                }

                const important = peek(9);

                if (important == 'important') {

                    yield pushToken('', 'Important');
                    next(9);
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
        yield pushToken(buffer);
    }
}
