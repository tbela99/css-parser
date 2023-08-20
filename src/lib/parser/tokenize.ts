import {Token, TokenizeResult, TokenType} from "../../@types";
import {
    isDigit,
    isNewLine, isNonPrintable,
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

    function pushToken(token: string, hint?: TokenType): TokenizeResult {

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

                    next(escapeSequence.length + 1 + (isWhiteSpace(peek()?.charCodeAt(0)) ? 1 : 0));

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
                return;
            }

            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }

            if (hasNewLine && value == ';') {

                yield pushToken(buffer + value, 'Bad-string');
                buffer = '';
                next();
                break;
            }

            buffer += value;
            next();
        }

        if (hasNewLine) {

            yield pushToken(buffer, 'Bad-string');
        } else {

            // EOF - 'Unclosed-string' fixed
            yield pushToken(buffer + quote, 'String');
        }

        buffer = '';
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

        if (isWhiteSpace(value.charCodeAt(0))) {

            if (buffer.length > 0) {

                yield pushToken(buffer);
                buffer = '';
            }
            while (value = next()) {

                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }

            yield pushToken('', 'Whitespace');

            buffer = '';
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

                    buffer += next();

                    while (value = next()) {

                        if (value == '*') {

                            buffer += value;

                            if (peek() == '/') {
                                yield pushToken(buffer + next(), 'Comment');
                                buffer = '';
                                break;
                            }
                        } else {
                            buffer += value;
                        }
                    }

                    yield pushToken(buffer, 'Bad-comment');
                    buffer = '';
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

                if (peek(3) == '!--') {

                    buffer += next(3);

                    while (value = next()) {

                        buffer += value;
                        if (value == '-' && peek(2) == '->') {

                            break;
                        }
                    }

                    if (value === '') {

                        yield pushToken(buffer, 'Bad-cdo');
                    }

                    else {

                        yield pushToken(buffer + next(2), 'CDOCOMM');
                    }

                    buffer = '';
                }

                break;
            case '\\':

                // EOF
                if (!(value = next())) {
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

                if (!(value = next())) {
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
                } else {

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

                    yield pushToken(value);
                    break;
                }

                buffer += value;

                // @ts-ignore
                if (buffer == 'url(') {

                    yield pushToken(buffer);
                    buffer = '';

                    consumeWhiteSpace();
                    value = peek();

                    let cp : number;
                    let whitespace: string = '';
                    let hasWhiteSpace = false;
                    let errorState = false;

                    if (value == '"' || value == "'") {

                        const quote = value;
                        let inquote = true;
                        let hasNewLine = false;
                        buffer = next();

                        while (value = next()) {

                            cp = value.charCodeAt(0);

                            // consume an invalid string
                            if (inquote) {

                                buffer += value;

                                if (isNewLine(cp)) {

                                    hasNewLine = true;

                                    while(value = next()) {

                                        buffer += value;

                                        if (value == ';') {

                                            inquote = false;
                                            break;
                                        }
                                    }

                                    if (value === '') {

                                        yield pushToken(buffer, 'Bad-string');
                                        buffer = '';
                                        break;
                                    }

                                    cp = value.charCodeAt(0);
                                }

                                // '\\'
                                if (cp == 0x5c) {

                                    buffer += next();
                                }

                                else if (value == quote) {

                                    inquote = false;
                                }

                                continue;
                            }

                            if (!inquote) {

                                if (isWhiteSpace(cp)) {

                                    whitespace += value;

                                    while (value = peek()) {

                                        hasWhiteSpace = true;

                                        if (isWhiteSpace(value?.charCodeAt(0))) {

                                            whitespace += next();
                                            continue;
                                        }

                                        break;
                                    }

                                    if (!(value = next())) {

                                        yield pushToken(buffer, hasNewLine ? 'Bad-url-token' : 'Url-token');
                                        buffer = '';
                                        break;
                                    }
                                }

                                cp = value.charCodeAt(0);

                                // ')'
                                if (cp == 0x29) {

                                    yield pushToken(buffer, hasNewLine ? 'Bad-string' : 'String');
                                    yield pushToken('', 'End-parens');
                                    buffer = '';
                                    break;
                                }

                                while(value = next()) {

                                    cp = value.charCodeAt(0);

                                    if (cp == 0x5c) {

                                        buffer += value + next();
                                        continue;
                                    }

                                    if (cp == 0x29) {

                                        yield pushToken(buffer, 'Bad-string');
                                        yield pushToken('', 'End-parens');
                                        buffer = '';
                                        break;
                                    }

                                    buffer += value;
                                }

                                if (hasNewLine) {

                                    yield pushToken(buffer, 'Bad-string');
                                    buffer = '';
                                }

                                break;
                            }

                            buffer += value;
                        }

                        break;
                    } else {

                        buffer = '';

                        while (value = next()) {

                            cp = value.charCodeAt(0);

                            // ')'
                            if (cp == 0x29) {

                                yield pushToken(buffer, 'Url-token');
                                yield pushToken('', 'End-parens');
                                buffer = '';
                                break;
                            }

                            if (isWhiteSpace(cp)) {

                                hasWhiteSpace = true;
                                whitespace = value;

                                while(isWhiteSpace(peek()?.charCodeAt(0))) {

                                    whitespace += next();
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

                                while(value = peek()) {

                                    cp = value.charCodeAt(0);

                                    if (cp == 0x5c) {

                                        buffer += next(2);
                                        continue;
                                    }

                                    // ')'
                                    if (cp == 0x29) {

                                        break;
                                    }

                                    buffer += next();
                                }

                                yield pushToken(buffer, 'Bad-url-token');
                                buffer = '';
                                break;
                            }

                            buffer += value;
                        }
                    }

                    if (buffer !== '') {

                        yield pushToken(buffer, 'Url-token');
                        buffer = '';
                        break;
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

                if (peek(9) == 'important') {

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

    // yield pushToken('', 'EOF');
}
