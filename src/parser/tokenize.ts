import {
    isAtKeyword, isDigit, isFunction, isHash,
    isIdent, isIdentCodepoint, isIdentStart,
    isNewLine,
    isPseudo
} from "./utils";
import {update} from "./utils";
import {DashMatchToken, IncludesToken, Position, StringIterableIterator, StringIteratorResult, Token} from "../@types";

export function* tokenize(iterator: StringIterableIterator, position: Position): Generator<Token> {

    let result;
    let buffer: string = '';

    while (true) {

        result = iterator.next();

        if (result.done) {

            break;
        }

        if (/\s/.test(result.value)) {

            if (buffer.length > 0) {

                yield getType(buffer);

                buffer = '';
            }

            let whitespace: string = result.value;

            while (!result.done) {

                result = iterator.next();

                if (result.done) {

                    update(position, whitespace);
                    break;
                }

                if (!/\s/.test(result.value)) {

                    break;
                }

                whitespace += result.value;
            }

            yield {type: 'whitespace'};
            update(position, whitespace);

            if (result.done) {

                break;
            }
        }

        switch (result.value) {

            case '/':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer = '';
                }

                buffer += result.value;

                if (iterator.peek() == '*') {

                    while (!result.done) {

                        result = iterator.next();

                        if (result.done) {

                            yield {
                                type: 'bad-comment', value: buffer
                            }

                            update(position, buffer);
                            return;
                        }

                        if (result.value == '\\') {

                            buffer += result.value;
                            result = iterator.next();

                            if (result.done) {

                                yield {
                                    type: 'bad-comment',
                                    value: buffer
                                };
                                update(position, buffer);
                                return
                            }

                            buffer += result.value;
                            continue;
                        }

                        if (result.value == '*') {

                            buffer += result.value;

                            result = iterator.next();

                            if (result.done) {

                                yield {
                                    type: 'bad-comment', value: buffer
                                };
                                update(position, buffer);
                                return
                            }

                            buffer += result.value;

                            if (result.value == '/') {

                                yield {type: 'comment', value: buffer};
                                update(position, buffer);
                                buffer = '';
                                break;
                            }
                        } else {

                            buffer += result.value;
                        }
                    }
                }

                break;

            case '<':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);
                    buffer = '';
                }

                buffer += result.value;

                result = iterator.next();

                if (result.done) {

                    break;
                }

                if (iterator.peek(3) == '!--') {

                    while (!result.done) {

                        result = iterator.next();

                        if (result.done) {

                            break;
                        }

                        buffer += result.value;

                        if (result.value == '>' && iterator.prev(2) == '--') {

                            yield {
                                type: 'cdo-comment',
                                value: buffer
                            };
                            update(position, buffer);

                            buffer = '';
                            break;
                        }
                    }
                }

                if (result.done) {

                    yield {type: 'bad-cdo-comment', value: buffer};
                    update(position, buffer);

                    buffer = '';
                }

                break;

            case '\\':

                result = iterator.next();

                // EOF
                if (iterator.peek() === '') {

                    // end of stream ignore \\
                    yield getType(buffer);
                    update(position, buffer);

                    buffer = '';
                    break;
                }

                buffer += result.value;
                break;

            case '"':
            case "'":

                const quote: string = result.value;
                let hasNewLine: boolean = false;

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer = '';
                }

                buffer += result.value;

                while (!result.done) {

                    result = iterator.next();

                    if (result.done) {

                        yield {type: hasNewLine ? 'bad-string' : 'unclosed-string', value: buffer};
                        update(position, buffer);
                        return;
                    }

                    if (result.value == '\\') {

                        buffer += result.value;

                        result = iterator.next();

                        if (result.done) {

                            yield getType(buffer);
                            update(position, buffer);

                            return;
                        }

                        buffer += result.value;
                        continue;
                    }

                    if (result.value == quote) {

                        buffer += result.value;

                        yield {type: hasNewLine ? 'bad-string' : 'string', value: buffer};
                        update(position, buffer);

                        buffer = '';
                        break;
                    }

                    if (isNewLine(<number>result.value.codePointAt(0))) {

                        hasNewLine = true;
                    }

                    if (hasNewLine && result.value == ';') {

                        yield {type: 'bad-string', value: buffer};
                        update(position, buffer);

                        yield getType(result.value);
                        update(position, result.value);

                        buffer = '';
                        break;
                    }

                    buffer += result.value;
                }

                break;

            case '~':
            case '|':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    buffer = '';
                }

                buffer += result.value;
                result = iterator.next();

                if (result.done) {

                    yield getType(buffer);
                    update(position, buffer);

                    return;
                }

                if (result.value == '=') {

                    buffer += result.value;

                    yield <IncludesToken | DashMatchToken>{
                        type: buffer[0] == '~' ? 'includes' : 'dash-matches',
                        value: buffer
                    };

                    update(position, buffer);
                    buffer = '';
                    break;
                }

                yield getType(buffer);
                update(position, buffer);
                buffer = '';

                buffer += result.value;
                break;

            case ':':
            case ',':
            case ';':
            case '=':

                if (buffer.length > 0) {

                    update(position, buffer);
                    yield getType(buffer);
                    buffer = '';
                }

                if (result.value == ':' && isIdent(iterator.peek())) {

                    buffer += result.value;
                    break;
                }

                yield getType(result.value);
                update(position, result.value);
                break;

            case ')':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer = '';
                }

                yield {type: 'end-parens'};
                update(position, result.value);
                break;

            case '(':

                if (buffer.length == 0) {

                    yield {type: 'start-parens'};
                    update(position, result.value);
                } else {

                    buffer += result.value;

                    yield getType(buffer);
                    update(position, buffer);
                    buffer = '';
                }

                break;

            case '[':
            case ']':
            case '{':
            case '}':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer = '';
                }

                yield getBlockType(result.value);
                update(position, result.value);
                break;

            default:

                if (buffer === '') {

                    let code: number = <number>result.value.codePointAt(0);
                    let isNumber: boolean = isDigit(code);

                    // + or -
                    if (code == 0x2b || code == 0x2d || isNumber) {

                        buffer += result.value;

                        if (!isNumber && !isDigit(<number>iterator.peek().codePointAt(0))) {

                            break;
                        }

                        while (isDigit(<number>iterator.peek().codePointAt(0))) {

                            result = iterator.next();
                            buffer += result.value;
                        }

                        let dec = iterator.peek(2);

                        // .
                        if (dec.codePointAt(0) == 0x2e && isDigit(<number>dec.codePointAt(1))) {

                            result = iterator.next(2);
                            buffer += dec;

                            while (isDigit(<number>iterator.peek().codePointAt(0))) {

                                result = iterator.next();
                                buffer += result.value;
                            }
                        }

                        dec = iterator.peek(3);

                        code = <number>dec.codePointAt(0);

                        // E or e
                        if (code == 0x45 || code == 0x65) {

                            code = <number> dec.codePointAt(1);

                            if ((code == 0x2d || code == 0x2b) && isDigit(<number>dec.codePointAt(2))) {

                                buffer += dec;
                                result = iterator.next(3);
                            }

                            else if (isDigit(code)) {

                                result = iterator.next();
                                buffer += result.value;
                            }
                        }

                        while (isDigit(<number>iterator.peek().codePointAt(0))) {

                            result = iterator.next();
                            buffer += result.value;
                        }

                        code = <number>iterator.peek().codePointAt(0);

                        if (isIdentStart(code)) {

                            result = iterator.next();
                            let unit = result.value;

                            while (isIdentCodepoint(<number>iterator.peek().codePointAt(0))) {

                                result = iterator.next();
                                unit += result.value;
                            }

                            yield {
                                type: 'dimension',
                                value: buffer,
                                unit
                            }

                            update(position, buffer);
                            buffer = '';
                        }

                        // %
                        else if (code == 0x25) {

                            result = iterator.next();
                            // buffer += result.value;

                            yield {
                                type: 'percentage',
                                value: buffer
                            }

                            update(position, buffer);
                            buffer = '';
                        }

                        else {

                            yield {
                                type: 'number',
                                value: buffer
                            }

                            update(position, buffer);
                            buffer = '';
                        }

                        break;
                    }
                }

                buffer += result.value;
                break;
        }
    }

    if (buffer.length > 0) {

        yield getType(buffer);
        update(position, buffer);
    }
}

function getBlockType(chr: '{' | '}' | '[' | ']'): Token {

    if (chr == '{') {

        return {type: 'block-start'};
    }

    if (chr == '}') {

        return {type: 'block-end'};
    }

    if (chr == '[') {

        return {type: 'attr-start'};
    }

    if (chr == ']') {

        return {type: 'attr-end'};
    }

    throw new Error(`unhandled token: '${chr}'`);
}

function getType(value: string): Token {

    if (value === '') {

        throw new Error('empty string?');
    }

    if (value == ':') {

        return {type: 'colon'};
    }

    if (value == ';') {

        return {type: 'semi-colon'};
    }

    if (value == ',') {

        return {type: 'comma'};
    }

    if (value == '<') {

        return {type: 'less-than'};
    }

    if (value == '>') {

        return {type: 'greater-than'};
    }

    if (isPseudo(value)) {

        return {
            type: 'pseudo-selector',
            value
            // buffer: buffer.slice()
        }
    }

    if (isAtKeyword(value)) {

        return {
            type: 'at-rule',
            value: value.slice(1),
            // buffer: buffer.slice()
        }
    }

    if (isFunction(value)) {

        return {
            type: 'function',
            value: value.slice(0, -1)
        }
    }

    if (isIdent(value)) {

        return {
            type: 'ident',
            value
        }
    }

    if (value.charAt(0) == '#' && isHash(value)) {

        return {
            type: 'hash',
            value
        }
    }

    if ('"\''.includes(value.charAt(0))) {

        return {
            type: 'unclosed-string',
            value
        }
    }

    return {
        type: 'literal',
        value
    }
}