import {
    isAtKeyword, isDigit, isFunction, isHash,
    isIdent, isIdentCodepoint, isIdentStart,
    isNewLine,
    isPseudo, isWhiteSpace
} from "./utils";
import {update} from "./utils";
import {DashMatchToken, IncludesToken, Position, Token} from "../@types";

export function tokenize(iterator: string[], position: Position, callable: (token: Token) => void): void {

    let value: string;
    let buffer: string = '';
    let i: number = -1;
    let total: number = iterator.length;

    function peek(count: number = 1): string {

        if (count == 1) {

            return iterator[i + 1];
        }

        return iterator.slice(i, i + count).join('');
    }

    function prev(count: number = 1) {

        if (count == 1) {

            return i == 0 ? '' : iterator[i - 1];
        }

        return iterator.slice(i - 1 - count, i - 1).join('');
    }

    function next(count: number = 1) {

        if (count == 1) {

            return iterator[++i];
        }

        const chr: string = iterator.slice(i + 1, i + 1 + count).join('');

        i += count;

        return chr;
    }

    while(i < total) {

        value = next();

        if (i >= total) {

            if (buffer.length > 0) {

                callable(getType(buffer)) ;
                buffer = '';
            }

            break;
        }

        if (isWhiteSpace(<number>value.codePointAt(0))) {

            if (buffer.length > 0) {

                callable(getType(buffer)) ;

                buffer = '';
            }

            let whitespace: string = value;

            while (i < total) {

                value = next();

                if (i >= total) {

                    break;
                }

                if (!isWhiteSpace(<number>value.codePointAt(0))) {

                    break;
                }

                whitespace += value;
            }

            callable({type: 'whitespace'}) ;
            update(position, whitespace);

            buffer = '';

            if (i >= total) {

                break;
            }
        }

        switch (value) {

            case '/':

                if (buffer.length > 0) {

                    callable(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                buffer += value;

                if (peek() == '*') {

                    while (i < total) {

                        value = next();

                        if (i >= total) {

                            callable({
                                type: 'bad-comment', value: buffer
                            });

                            update(position, buffer);
                            return;
                        }

                        if (value == '\\') {

                            buffer += value;
                            value = next();

                            if (i >= total) {

                                callable({
                                    type: 'bad-comment',
                                    value: buffer
                                });
                                update(position, buffer);
                                break;
                            }

                            buffer += value;
                            continue;
                        }

                        if (value == '*') {

                            buffer += value;

                            value = next();

                            if (i >= total) {

                                callable({
                                    type: 'bad-comment', value: buffer
                                });
                                update(position, buffer);
                                break;
                            }

                            buffer += value;

                            if (value == '/') {

                                callable({type: 'comment', value: buffer});
                                update(position, buffer);
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

                    callable(getType(buffer));
                    update(position, buffer);
                    buffer = '';
                }

                buffer += value;

                value = next();

                if (i >= total) {

                    break;
                }

                if (peek(3) == '!--') {

                    while (i < total) {

                        value = next();

                        if (i >= total) {

                            break;
                        }

                        buffer += value;

                        if (value == '>' && prev(2) == '--') {

                            callable({
                                type: 'cdo-comment',
                                value: buffer
                            });
                            
                            update(position, buffer);

                            buffer = '';
                            break;
                        }
                    }
                }

                if (i >= total) {

                    callable({type: 'bad-cdo-comment', value: buffer});
                    update(position, buffer);

                    buffer = '';
                }

                break;

            case '\\':

                value = next();

                // EOF
                if (i + 1 >= total) {

                    // end of stream ignore \\
                    callable(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                    break;
                }

                buffer += value;
                break;

            case '"':
            case "'":

                const quote: string = value;
                let hasNewLine: boolean = false;

                if (buffer.length > 0) {

                    callable(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                buffer += value;

                while (i < total) {

                    value = next();

                    if (i >= total) {

                        callable({type: hasNewLine ? 'bad-string' : 'unclosed-string', value: buffer});
                        update(position, buffer);
                        return;
                    }

                    if (value == '\\') {

                        buffer += value;

                        value = next();

                        if (i >= total) {

                            callable(getType(buffer));
                            update(position, buffer);

                            return;
                        }

                        buffer += value;
                        continue;
                    }

                    if (value == quote) {

                        buffer += value;

                        callable({type: hasNewLine ? 'bad-string' : 'string', value: buffer});
                        update(position, buffer);

                        buffer = '';
                        break;
                    }

                    if (isNewLine(<number>value.codePointAt(0))) {

                        hasNewLine = true;
                    }

                    if (hasNewLine && value == ';') {

                        callable({type: 'bad-string', value: buffer});
                        update(position, buffer);

                        callable(getType(value));
                        update(position, value);

                        buffer = '';
                        break;
                    }

                    buffer += value;
                }

                break;

            case '~':
            case '|':

                if (buffer.length > 0) {

                    callable(getType(buffer));
                    buffer = '';
                }

                buffer += value;
                value = next();

                if (i >= total) {

                    callable(getType(buffer));
                    update(position, buffer);

                    return;
                }

                if (value == '=') {

                    buffer += value;

                    callable(<IncludesToken | DashMatchToken>{
                        type: buffer[0] == '~' ? 'includes' : 'dash-matches',
                        value: buffer
                    });

                    update(position, buffer);
                    buffer = '';
                    break;
                }

                callable(getType(buffer));
                update(position, buffer);
                buffer = '';

                buffer += value;
                break;

            case ':':
            case ',':
            case ';':
            case '=':

                if (buffer.length > 0) {

                    update(position, buffer);
                    callable(getType(buffer));
                    buffer = '';
                }

                if (value == ':' && isIdent(peek())) {

                    buffer += value;
                    break;
                }

                callable(getType(value));
                update(position, value);
                break;

            case ')':

                if (buffer.length > 0) {

                    callable(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                callable({type: 'end-parens'});
                update(position, value);
                break;

            case '(':

                if (buffer.length == 0) {

                    callable({type: 'start-parens'});
                    update(position, value);
                } else {

                    buffer += value;

                    callable(getType(buffer));
                    update(position, buffer);
                    buffer = '';
                }

                break;

            case '[':
            case ']':
            case '{':
            case '}':

                if (buffer.length > 0) {

                    callable(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                callable(getBlockType(value));
                update(position, value);
                break;

            default:

                if (buffer === '') {

                    let code: number = <number>value.codePointAt(0);
                    let isNumber: boolean = isDigit(code);

                    // + or -
                    if (code == 0x2b || code == 0x2d || isNumber) {

                        buffer += value;

                        if (!isNumber && !isDigit(<number>peek().codePointAt(0))) {

                            break;
                        }

                        while (isDigit(<number>peek().codePointAt(0))) {

                            value = next();
                            buffer += value;
                        }

                        let dec = peek(2);

                        // .
                        if (dec.codePointAt(0) == 0x2e && isDigit(<number>dec.codePointAt(1))) {

                            value = next(2);
                            buffer += dec;

                            while (isDigit(<number>peek().codePointAt(0))) {

                                value = next();
                                buffer += value;
                            }
                        }

                        dec = peek(3);

                        code = <number>dec.codePointAt(0);

                        // E or e
                        if (code == 0x45 || code == 0x65) {

                            code = <number> dec.codePointAt(1);

                            if ((code == 0x2d || code == 0x2b) && isDigit(<number>dec.codePointAt(2))) {

                                buffer += dec;
                                value = next(3);
                            }

                            else if (isDigit(code)) {

                                value = next();
                                buffer += value;
                            }
                        }

                        while (isDigit(<number>peek().codePointAt(0))) {

                            value = next();
                            buffer += value;
                        }

                        code = <number>peek().codePointAt(0);

                        if (isIdentStart(code)) {

                            value = next();
                            let unit = value;

                            while (isIdentCodepoint(<number>peek().codePointAt(0))) {

                                value = next();
                                unit += value;
                            }

                            callable({
                                type: 'dimension',
                                value: buffer,
                                unit
                            });

                            update(position, buffer);
                            buffer = '';
                        }

                        // %
                        else if (code == 0x25) {

                            value = next();
                            // buffer += value;

                            callable({
                                type: 'percentage',
                                value: buffer
                            });

                            update(position, buffer);
                            buffer = '';
                        }

                        else {

                            callable({
                                type: 'number',
                                value: buffer
                            });

                            update(position, buffer);
                            buffer = '';
                        }

                        break;
                    }
                }

                buffer += value;
                break;
        }
    }

    if (buffer.length > 0) {

        callable(getType(buffer));
        update(position, buffer);
    }

    callable({type: 'EOF'});
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