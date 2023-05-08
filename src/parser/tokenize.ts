import {
    isAtKeyword, isDigit, isFunction, isHash,
    isIdent, isIdentCodepoint, isIdentStart,
    isNewLine,
    isPseudo, isWhiteSpace
} from "./utils";
import {update} from "./utils";
import {
    AstAtRule, AstDeclaration,
    AstNode, AstRule, AtRuleToken, BadCommentToken, BadStringToken,
    DashMatchToken, FunctionToken, IncludesToken, Location,
    Position, PseudoSelectorToken, Token
} from "../@types";

export function tokenize(iterator: string, root: AstNode, position: Position, trackLocation: boolean /*, callable: (token: Token) => void */): void {

    let value: string;
    let buffer: string = '';
    let i: number = -1;
    let total: number = iterator.length;

    const weakMap: WeakMap<Token, Position> = new WeakMap<Token, Position>;

    function peek(count: number = 1): string {

        if (count == 1) {

            return iterator.charAt(i + 1);
        }

        return iterator.slice(i, i + count);
    }

    function prev(count: number = 1) {

        if (count == 1) {

            return i == 0 ? '' : iterator.charAt(i - 1);
        }

        return iterator.slice(i - 1 - count, i - 1);
    }

    function next(count: number = 1) {

        let char: string = '';

        while (count-- > 0 && i < total) {

            const codepoint: number = <number>iterator.codePointAt(++i);

            if (codepoint < 0x80) {

                char += iterator.charAt(i);
            } else {

                if (codepoint == null) {

                    return char;
                }

                const chr: string = String.fromCodePoint(codepoint);

                i += chr.length - 1;
                char += chr;
            }
        }

        return char;
    }

    function pushToken(token: Token) {

        tokens.push(token);

        if (trackLocation) {

            weakMap.set(token, {...position});
        }
    }

    const tokens: Token[] = [];

    const stack = [root];
    let context = root;

    while (i < total) {

        value = next();

        if (i >= total) {

            if (buffer.length > 0) {

                pushToken(getType(buffer));
                buffer = '';
            }

            break;
        }

        if (isWhiteSpace(<number>value.codePointAt(0))) {

            if (buffer.length > 0) {

                pushToken(getType(buffer));

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

            pushToken({typ: 'Whitespace'});
            update(position, whitespace);

            buffer = '';

            if (i >= total) {

                break;
            }
        }

        switch (value) {

            case '/':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                buffer += value;

                if (peek() == '*') {

                    while (i < total) {

                        value = next();

                        if (i >= total) {

                            pushToken({
                                typ: 'Bad-comment', val: buffer
                            });

                            update(position, buffer);
                            break;
                        }

                        if (value == '\\') {

                            buffer += value;
                            value = next();

                            if (i >= total) {

                                pushToken({
                                    typ: 'Bad-comment',
                                    val: buffer
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

                                pushToken({
                                    typ: 'Bad-comment', val: buffer
                                });

                                update(position, buffer);
                                break;
                            }

                            buffer += value;

                            if (value == '/') {

                                pushToken({typ: 'Comment', val: buffer});
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

                    pushToken(getType(buffer));
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

                            pushToken({
                                typ: 'Cdo-comment',
                                val: buffer
                            });

                            update(position, buffer);
                            buffer = '';
                            break;
                        }
                    }
                }

                if (i >= total) {

                    pushToken({typ: 'Bad-cdo-comment', val: buffer});

                    update(position, buffer);
                    buffer = '';
                }

                break;

            case '\\':

                value = next();

                // EOF
                if (i + 1 >= total) {

                    // end of stream ignore \\
                    pushToken(getType(buffer));

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

                    pushToken(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                buffer += value;

                while (i < total) {

                    value = next();

                    if (i >= total) {

                        pushToken({typ: hasNewLine ? 'Bad-string' : 'Unclosed-string', val: buffer});
                        update(position, buffer);
                        return;
                    }

                    if (value == '\\') {

                        buffer += value;

                        value = next();

                        if (i >= total) {

                            pushToken(getType(buffer));
                            update(position, buffer);

                            return;
                        }

                        buffer += value;
                        continue;
                    }

                    if (value == quote) {

                        buffer += value;

                        pushToken({typ: hasNewLine ? 'Bad-string' : 'String', val: buffer});
                        update(position, buffer);

                        buffer = '';
                        break;
                    }

                    if (isNewLine(<number>value.codePointAt(0))) {

                        hasNewLine = true;
                    }

                    if (hasNewLine && value == ';') {

                        pushToken({typ: 'Bad-string', val: buffer});
                        update(position, buffer);

                        pushToken(getType(value));
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

                    pushToken(getType(buffer));
                    buffer = '';
                }

                buffer += value;
                value = next();

                if (i >= total) {

                    pushToken(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                    break;
                }

                if (value == '=') {

                    buffer += value;

                    pushToken(<IncludesToken | DashMatchToken>{
                        typ: buffer[0] == '~' ? 'Includes' : 'Dash-matches',
                        val: buffer
                    });

                    update(position, buffer);
                    buffer = '';
                    break;
                }

                pushToken(getType(buffer));

                update(position, buffer);
                buffer = value;
                break;

            case ':':
            case ',':
            case '=':

                if (buffer.length > 0) {

                    update(position, buffer);
                    pushToken(getType(buffer));
                    buffer = '';
                }

                if (value == ':' && isIdent(peek())) {

                    buffer += value;
                    break;
                }

                pushToken(getType(value));
                update(position, value);
                buffer = '';
                break;

            case ')':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                pushToken({typ: 'End-parens'});
                update(position, value);
                break;

            case '(':

                if (buffer.length == 0) {

                    pushToken({typ: 'Start-parens'});
                    update(position, value);
                } else {

                    buffer += value;

                    pushToken(getType(buffer));
                    update(position, buffer);
                    buffer = '';
                }

                break;

            case '[':
            case ']':
            case '{':
            case '}':
            case ';':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(position, buffer);

                    buffer = '';
                }

                pushToken(getBlockType(value));

                if (value == '{' || value == ';') {

                    const node = parseNode(context, tokens, trackLocation, root.loc?.src || '', weakMap);

                    if (node != null) {

                        stack.push(node);
                        context = node;
                    }

                    tokens.length = 0;
                } else if (value == '}') {

                    parseNode(context, tokens, trackLocation, root.loc?.src || '', weakMap);
                    stack.pop();
                    context = stack[stack.length - 1] || root;

                    tokens.length = 0;
                    buffer = '';
                }

                update(position, value);

                // @ts-ignore
                if (trackLocation && ['}', ';'].includes(value) && context.chi[context.chi.length - 1].loc.end == null) {

                    // @ts-ignore
                    context.chi[context.chi.length - 1].loc.end = {...position};
                }

                break;

            default:

                if (buffer === '') {

                    // parse number or dimension or percentage
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

                            code = <number>dec.codePointAt(1);

                            if ((code == 0x2d || code == 0x2b) && isDigit(<number>dec.codePointAt(2))) {

                                buffer += dec;
                                value = next(3);
                            } else if (isDigit(code)) {

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

                            pushToken({
                                typ: 'Dimension',
                                val: buffer,
                                unit
                            });

                            update(position, buffer);
                            buffer = '';
                        }

                        // %
                        else if (code == 0x25) {

                            value = next();
                            // buffer += value;

                            pushToken({
                                typ: 'Percentage',
                                val: buffer
                            });

                            update(position, buffer);
                            buffer = '';
                        } else {

                            pushToken({
                                typ: 'Number',
                                val: buffer
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

        // pushToken(getType(buffer));
        update(position, buffer);
    }

    // pushToken({typ: 'EOF'});
}

function parseNode(root: AstNode, tokens: Token[], trackLocation: boolean, src: string, weakMap: WeakMap<Token, Position>) {

    let i: number = 0;
    for (i = 0; i < tokens.length; i++) {

        if (tokens[i].typ == 'Comment') {

            // @ts-ignore
            root.chi.push(tokens[i]);

            if (trackLocation) {

                const position: Position = <Position>weakMap.get(tokens[i]);

                (<AstNode>tokens[i]).loc = <Location>{
                    sta: position,
                    // @ts-ignore
                    end: update({...position}, tokens[i].val),
                    src
                }
            }
        } else if (tokens[i].typ != 'Whitespace') {

            break;
        }
    }

    tokens = tokens.slice(i);

    const delim: Token = <Token>tokens.pop();

    while (['whitespace'].includes(tokens[tokens.length - 1]?.typ)) {

        tokens.pop();
    }

    if (tokens.length == 0) {

        return null;
    }

    if (tokens[0]?.typ == 'At-rule') {

        const atRule: AtRuleToken = <AtRuleToken>tokens.shift();

        while (['Whitespace'].includes(tokens[0]?.typ)) {

            tokens.shift();
        }

        const node: AstAtRule = {
            typ: 'AtRule',
            nam: [{typ: 'Ident', val: atRule.val}],
            val: tokens
        }


        if (delim.typ == 'Block-start') {

            node.chi = [];
        }

        if (trackLocation) {

            const position: Position = <Position> weakMap.get(atRule);

            node.loc = <Location>{
                sta: position,
                // end: weakMap.get(delim),
                src
            }
        }

        // @ts-ignore
        root.chi.push(node);

        if (delim.typ == 'Block-start') {

            return node;
        }
    } else {

        // rule
        if (delim.typ == 'Block-start') {

            const node: AstRule = {

                typ: 'Rule',
                sel: tokens,
                chi: []
            }

            if (trackLocation) {

                const position: Position = <Position> weakMap.get(tokens[0]);

                console.debug({'tokens[0]': tokens[0], position})

                node.loc = <Location>{
                    sta: position,
                    // end: weakMap.get(delim),
                    src
                }
            }

            // @ts-ignore
            root.chi.push(node);
            return node;
        } else {

            // declaration
            let name: Token[];
            let value: Token[];

            for (let i = 0; i < tokens.length; i++) {

                if (tokens[i].typ == 'Comment') {

                    continue;
                }

                if (tokens[i].typ == 'Colon') {

                    name = tokens.slice(0, i);
                    value = tokens.slice(i + 1);
                } else if (['function', 'pseudo-selector'].includes(tokens[i].typ) && (<FunctionToken | PseudoSelectorToken>tokens[i]).val.startsWith(':')) {

                    (<FunctionToken | PseudoSelectorToken>tokens[i]).val = (<FunctionToken | PseudoSelectorToken>tokens[i]).val.slice(1);

                    if (tokens[i].typ == 'Pseudo-selector') {

                        tokens[i].typ = 'Ident';
                    }

                    name = tokens.slice(0, i);
                    value = tokens.slice(i);
                }
            }

            const node: AstDeclaration = {

                typ: 'Declaration',
                // @ts-ignore
                nam: name,
                // @ts-ignore
                val: value
            }

            while (node.val[0]?.typ == 'Whitespace') {

                node.val.shift();
            }


            if (trackLocation) {

                const position: Position = <Position> weakMap.get(node.nam[0]);

                node.loc = <Location>{
                    sta: position,
                    // end: weakMap.get(delim),
                    src
                }
            }

            // @ts-ignore
            root.chi.push(node);
            return null;
        }
    }

}

function getBlockType(chr: '{' | '}' | '[' | ']' | ';'): Token {

    if (chr == ';') {

        return {typ: 'Semi-colon'};
    }

    if (chr == '{') {

        return {typ: 'Block-start'};
    }

    if (chr == '}') {

        return {typ: 'Block-end'};
    }

    if (chr == '[') {

        return {typ: 'Attr-start'};
    }

    if (chr == ']') {

        return {typ: 'Attr-end'};
    }

    throw new Error(`unhandled token: '${chr}'`);
}

function getType(value: string): Token {

    if (value === '') {

        throw new Error('empty string?');
    }

    if (value == ':') {

        return {typ: 'Colon'};
    }

    if (value == ';') {

        return {typ: 'Semi-colon'};
    }

    if (value == ',') {

        return {typ: 'Comma'};
    }

    if (value == '<') {

        return {typ: 'Less-than'};
    }

    if (value == '>') {

        return {typ: 'Greater-than'};
    }

    if (isPseudo(value)) {

        return {
            typ: 'Pseudo-selector',
            val: value
            // buffer: buffer.slice()
        }
    }

    if (isAtKeyword(value)) {

        return {
            typ: 'At-rule',
            val: value.slice(1)
            // buffer: buffer.slice()
        }
    }

    if (isFunction(value)) {

        return {
            typ: 'Function',
            val: value.slice(0, -1)
        }
    }

    if (isIdent(value)) {

        return {
            typ: 'Ident',
            val: value
        }
    }

    if (value.charAt(0) == '#' && isHash(value)) {

        return {
            typ: 'Hash',
            val: value
        }
    }

    if ('"\''.includes(value.charAt(0))) {

        return {
            typ: 'Unclosed-string',
            val: value
        }
    }

    return {
        typ: 'Literal',
        val: value
    }
}