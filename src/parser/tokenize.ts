import {
    ident,
    isAtKeyword, isDimension,
    isFunction, isHash,
    isIdent,
    isNewLine,
    isNumber,
    isPercentage,
    isString,
    num
} from "./utils";
import {update} from "./utils";
import {DashMatchToken, IncludesToken, Position, Token} from "../@types";

export function* tokenize(iterator: Iterator<string>, position: Position): Generator<Token> {

    let result: IteratorResult<string>;

    const buffer: string[] = [];

    while (true) {

        result = iterator.next();

        if (result.done) {

            break;
        }

        if (/\s/.test(result.value)) {

            if (buffer.length > 0) {

                yield getType(buffer);
                update(position, buffer);

                buffer.length = 0;
            }

            const whitespace: string[] = [result.value];

            while (!result.done) {

                result = iterator.next();

                if (result.done) {

                    update(position, whitespace);
                    break;
                }

                if (!/\s/.test(result.value)) {

                    break;
                }

                whitespace.push(result.value);
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

                    buffer.length = 0;
                }

                buffer.push(result.value);

                result = iterator.next();

                if (result.done) {

                    yield getType(buffer);
                    update(position, buffer);

                    return;
                }

                buffer.push(result.value);

                if (result.value != '*') {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                    buffer.push(result.value);
                    break;
                }

                while (!result.done) {

                    result = iterator.next();

                    if (result.done) {

                        yield {type: 'bad-comment', value: buffer.join('')
                            };
                        update(position, buffer);
                        return;
                    }

                    if (result.value == '\\') {

                        buffer.push(result.value);
                        result = iterator.next();

                        if (result.done) {

                            yield {type: 'bad-comment', 
                                value: buffer.join('')};
                            update(position, buffer);
                            return
                        }

                        buffer.push(result.value);
                        continue;
                    }

                    if (result.value == '*') {

                        buffer.push(result.value);

                        result = iterator.next();

                        if (result.done) {

                            yield {type: 'bad-comment', value: buffer.join('')
                                };
                            update(position, buffer);
                            return
                        }

                        buffer.push(result.value);

                        if (result.value == '/') {

                            yield {type: 'comment', value: buffer.join('')};
                            update(position, buffer);
                            buffer.length = 0;
                            break;
                        }
                    } else {

                        buffer.push(result.value);
                    }
                }

                break;

            case '<':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);
                    buffer.length = 0;
                }

                buffer.push(result.value);

                result = iterator.next();

                if (result.done) {

                    break;
                }

                if (result.value != '!') {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                    buffer.push(result.value);
                    break;
                }

                buffer.push(result.value);

                result = iterator.next();

                if (result.done) {

                    break;
                }

                if (result.value != '-') {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                    buffer.push(result.value);
                    break;
                }

                buffer.push(result.value);

                result = iterator.next();

                if (result.done) {

                    break;
                }

                if (result.value != '-') {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                    buffer.push(result.value);
                    break;
                }

                buffer.push(result.value);

                while (!result.done) {

                    result = iterator.next();

                    if (result.done) {

                        break;
                    }

                    buffer.push(result.value);

                    if (result.value == '>' && buffer[buffer.length - 2] == '-' && buffer[buffer.length - 3] == '-') {

                        yield {
                            type: 'cdo-comment',
                            value: buffer.join('')
                        };
                        update(position, buffer);

                        buffer.length = 0;
                        break;
                    }
                }

                if (result.done) {

                    yield {type: 'bad-cdo-comment', value: buffer.join('')};
                    update(position, buffer);

                    buffer.length = 0;
                }

                break;

            case '\\':

                buffer.push(result.value);
                result = iterator.next();

                if (result.done) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                }

                buffer.push(result.value);

                break;

            case '"':
            case "'":

                const quote: string = result.value;
                let hasNewLine: boolean = false;

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                }

                buffer.push(result.value);

                while (!result.done) {

                    result = iterator.next();

                    if (result.done) {

                        yield {type: hasNewLine ? 'bad-string' : 'unclosed-string', value: buffer.join('')};
                        update(position, buffer);
                        return;
                    }

                    if (result.value == '\\') {

                        buffer.push(result.value);

                        result = iterator.next();

                        if (result.done) {

                            yield getType(buffer);
                            update(position, buffer);
                            return;
                        }

                        buffer.push(result.value);
                        continue;
                    }

                    if (result.value == quote) {

                        buffer.push(result.value);

                        yield {type: hasNewLine ? 'bad-string' : 'string', value: buffer.join('')};
                        update(position, buffer);

                        buffer.length = 0;
                        break;
                    }

                    if (isNewLine(result.value)) {

                        hasNewLine = true;
                    }

                    if (hasNewLine && result.value == ';') {

                        yield {type: 'bad-string', value: buffer.join('')};
                        update(position, buffer);

                        yield getType([result.value]);
                        update(position, [result.value]);

                        buffer.length = 0;
                        break;
                    }

                    buffer.push(result.value);
                }

                break;

            case '~':
            case '|':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    buffer.length = 0;
                }

                buffer.push(result.value);
                result = iterator.next();

                if (result.done) {

                    yield getType(buffer);
                    update(position, buffer);

                    return;
                }

                if (result.value == '=') {

                    buffer.push(result.value);

                    yield <IncludesToken | DashMatchToken>{type: buffer[0] == '~' ? 'includes' : 'dash-matches', value: buffer.join('')};

                    update(position, buffer);
                    buffer.length = 0;
                    break;
                }

                yield getType(buffer);
                update(position, buffer);
                buffer.length = 0;

                buffer.push(result.value);
                break;

            case ':':
            case ',':
            case ';':
            case '=':

                if (buffer.length > 0) {

                    update(position, buffer);
                    yield getType(buffer);
                    buffer.length = 0;
                }

                yield getType([result.value]);
                update(position, [result.value]);
                break;

            case ')':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                }

                yield {type: 'end-parens'};
                update(position, [result.value]);
                break;

            case '(':

                if (buffer.length == 0) {

                    yield {type: 'start-parens'};
                    update(position, [result.value]);
                } else {

                    buffer.push(result.value);

                    yield getType(buffer);
                    update(position, buffer);
                    buffer.length = 0;
                }

                break;

            case '[':
            case ']':
            case '{':
            case '}':

                if (buffer.length > 0) {

                    yield getType(buffer);
                    update(position, buffer);

                    buffer.length = 0;
                }

                yield getBlockType(result.value);
                update(position, [result.value]);
                break;

            default:

                buffer.push(result.value);
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

function getType(buffer: string[]): Token {

    const value = buffer.join('');

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

    if (isAtKeyword(value)) {

        return {
            type: 'at-rule',
            value: value.slice(1),
            // buffer: buffer.slice()
        }
    }

    if (isNumber(value)) {

        return {
            type: 'number',
            value: value,
            // buffer: buffer.slice()
        }
    }

    if (isPercentage(value)) {

        return {
            type: 'percentage',
            value: value.slice(0, -1)
        }
    }

    if (isDimension(value)) {

        const match: RegExpMatchArray = <RegExpMatchArray>value.match(new RegExp(`^(${num})(${ident})$`))

        return {
            type: 'dimension',
            value: match[1],
            unit: match[2]
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

    if (isString(value)) {

        return {
            type: 'string',
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