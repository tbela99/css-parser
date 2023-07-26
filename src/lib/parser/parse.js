import { isAtKeyword, isDigit, isDimension, isFunction, isHash, isHexColor, isIdent, isIdentStart, isNewLine, isNumber, isPercentage, isPseudo, isWhiteSpace, parseDimension } from "./utils";
import { renderToken } from "../renderer";
import { COLORS_NAMES } from "../renderer/utils";
import { deduplicate } from "./deduplicate";
const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const funcLike = ['Start-parens', 'Func', 'UrlFunc', 'Pseudo-class-func'];
export async function parse(iterator, opt = {}) {
    const errors = [];
    const options = {
        src: '',
        sourcemap: false,
        compress: false,
        nestingRules: false,
        resolveImport: false,
        resolveUrls: false,
        removeEmpty: true,
        ...opt
    };
    if (options.resolveImport) {
        options.resolveUrls = true;
    }
    let ind = -1;
    let lin = 1;
    let col = 0;
    const tokens = [];
    const src = options.src;
    const stack = [];
    const ast = {
        typ: "StyleSheet",
        chi: []
    };
    const position = {
        ind: Math.max(ind, 0),
        lin: lin,
        col: Math.max(col, 1)
    };
    let value;
    let buffer = '';
    let total = iterator.length;
    let bytesIn = total;
    let map = new Map;
    let context = ast;
    if (options.sourcemap) {
        ast.loc = {
            sta: {
                ind: ind,
                lin: lin,
                col: col
            },
            src: ''
        };
    }
    function getType(val) {
        if (val === '') {
            throw new Error('empty string?');
        }
        if (val == ':') {
            return { typ: 'Colon' };
        }
        if (val == ')') {
            return { typ: 'End-parens' };
        }
        if (val == '(') {
            return { typ: 'Start-parens' };
        }
        if (val == '=') {
            return { typ: 'Delim', val };
        }
        if (val == ';') {
            return { typ: 'Semi-colon' };
        }
        if (val == ',') {
            return { typ: 'Comma' };
        }
        if (val == '<') {
            return { typ: 'Lt' };
        }
        if (val == '>') {
            return { typ: 'Gt' };
        }
        if (isPseudo(val)) {
            return val.endsWith('(') ? {
                typ: 'Pseudo-class-func',
                val: val.slice(0, -1),
                chi: []
            }
                : {
                    typ: 'Pseudo-class',
                    val
                };
        }
        if (isAtKeyword(val)) {
            return {
                typ: 'At-rule',
                val: val.slice(1)
            };
        }
        if (isFunction(val)) {
            val = val.slice(0, -1);
            return {
                typ: val == 'url' ? 'UrlFunc' : 'Func',
                val,
                chi: []
            };
        }
        if (isNumber(val)) {
            return {
                typ: 'Number',
                val
            };
        }
        if (isDimension(val)) {
            return parseDimension(val);
        }
        if (isPercentage(val)) {
            return {
                typ: 'Perc',
                val: val.slice(0, -1)
            };
        }
        if (val == 'currentColor') {
            return {
                typ: 'Color',
                val,
                kin: 'lit'
            };
        }
        if (isIdent(val)) {
            return {
                typ: 'Iden',
                val
            };
        }
        if (val.charAt(0) == '#' && isHash(val)) {
            return {
                typ: 'Hash',
                val
            };
        }
        if ('"\''.includes(val.charAt(0))) {
            return {
                typ: 'Unclosed-string',
                val
            };
        }
        return {
            typ: 'Literal',
            val
        };
    }
    // consume and throw away
    function consume(open, close) {
        let count = 1;
        let chr;
        while (true) {
            chr = next();
            if (chr == '\\') {
                if (peek() === '') {
                    break;
                }
                continue;
            }
            else if (chr == '/' && peek() == '*') {
                next();
                while (true) {
                    chr = next();
                    if (chr === '') {
                        break;
                    }
                    if (chr == '*' && peek() == '/') {
                        next();
                        break;
                    }
                }
            }
            else if (chr == close) {
                count--;
            }
            else if (chr == open) {
                count++;
            }
            if (chr === '' || count == 0) {
                break;
            }
        }
    }
    async function parseNode(tokens) {
        let i;
        let loc;
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == 'Comment') {
                // @ts-ignore
                context.chi.push(tokens[i]);
                const position = map.get(tokens[i]);
                loc = {
                    sta: position,
                    src
                };
                if (options.sourcemap) {
                    tokens[i].loc = loc;
                }
            }
            else if (tokens[i].typ != 'Whitespace') {
                break;
            }
        }
        tokens = tokens.slice(i);
        if (tokens.length == 0) {
            return null;
        }
        let delim = tokens.at(-1);
        if (delim.typ == 'Semi-colon' || delim.typ == 'Block-start' || delim.typ == 'Block-end') {
            tokens.pop();
        }
        else {
            delim = { typ: 'Semi-colon' };
        }
        // @ts-ignore
        while (['Whitespace', 'Bad-string', 'Bad-comment'].includes(tokens.at(-1)?.typ)) {
            tokens.pop();
        }
        if (tokens.length == 0) {
            return null;
        }
        if (tokens[0]?.typ == 'At-rule') {
            const atRule = tokens.shift();
            const position = map.get(atRule);
            if (atRule.val == 'charset' && position.ind > 0) {
                errors.push({ action: 'drop', message: 'invalid @charset', location: { src, ...position } });
                return null;
            }
            // @ts-ignore
            while (['Whitespace'].includes(tokens[0]?.typ)) {
                tokens.shift();
            }
            if (atRule.val == 'import') {
                // only @charset and @layer are accepted before @import
                if (context.chi.length > 0) {
                    let i = context.chi.length;
                    while (i--) {
                        const type = context.chi[i].typ;
                        if (type == 'Comment') {
                            continue;
                        }
                        if (type != 'AtRule') {
                            errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                            return null;
                        }
                        const name = context.chi[i].nam;
                        if (name != 'charset' && name != 'import' && name != 'layer') {
                            errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                            return null;
                        }
                        break;
                    }
                }
                // @ts-ignore
                if (tokens[0]?.typ != 'String' && tokens[0]?.typ != 'UrlFunc') {
                    errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1]?.typ != 'Url-token' && tokens[1]?.typ != 'String') {
                    errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                    return null;
                }
            }
            if (atRule.val == 'import') {
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1].typ == 'Url-token') {
                    tokens.shift();
                    // @ts-ignore
                    tokens[0].typ = 'String';
                    // @ts-ignore
                    tokens[0].val = `"${tokens[0].val}"`;
                }
                // @ts-ignore
                if (tokens[0].typ == 'String') {
                    if (options.resolveImport) {
                        const url = tokens[0].val.slice(1, -1);
                        try {
                            // @ts-ignore
                            const root = await options.load(url, options.src).then((src) => {
                                return parse(src, Object.assign({}, options, {
                                    compress: false,
                                    // @ts-ignore
                                    src: options.resolve(url, options.src).absolute
                                }));
                            });
                            bytesIn += root.bytesIn;
                            if (root.ast.chi.length > 0) {
                                context.chi.push(...root.ast.chi);
                            }
                            if (root.errors.length > 0) {
                                errors.push(...root.errors);
                            }
                            return null;
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack
            const raw = tokens.reduce((acc, curr) => {
                acc.push(renderToken(curr, { removeComments: true }));
                return acc;
            }, []);
            const node = {
                typ: 'AtRule',
                nam: renderToken(atRule, { removeComments: true }),
                val: raw.join('')
            };
            Object.defineProperty(node, 'raw', { enumerable: false, writable: false, value: raw });
            if (delim.typ == 'Block-start') {
                node.chi = [];
            }
            loc = {
                sta: position,
                src
            };
            if (options.sourcemap) {
                node.loc = loc;
            }
            // @ts-ignore
            context.chi.push(node);
            return delim.typ == 'Block-start' ? node : null;
        }
        else {
            // rule
            if (delim.typ == 'Block-start') {
                const position = map.get(tokens[0]);
                if (context.typ == 'Rule') {
                    if (tokens[0]?.typ == 'Iden') {
                        errors.push({ action: 'drop', message: 'invalid nesting rule', location: { src, ...position } });
                        return null;
                    }
                }
                const uniq = new Map;
                parseTokens(tokens, 'Rule', { compress: options.compress }).reduce((acc, curr, index, array) => {
                    if (curr.typ == 'Whitespace') {
                        if (array[index - 1]?.val == '+' || array[index + 1]?.val == '+') {
                            return acc;
                        }
                    }
                    let t = renderToken(curr, { compress: true });
                    if (t == ',') {
                        acc.push([]);
                    }
                    else {
                        acc[acc.length - 1].push(t);
                    }
                    return acc;
                }, [[]]).reduce((acc, curr) => {
                    acc.set(curr.join(''), curr);
                    return acc;
                }, uniq);
                const node = {
                    typ: 'Rule',
                    // @ts-ignore
                    sel: [...uniq.keys()].join(','),
                    chi: []
                };
                let raw = [...uniq.values()];
                Object.defineProperty(node, 'raw', { enumerable: false, writable: true, value: raw });
                loc = {
                    sta: position,
                    src
                };
                if (options.sourcemap) {
                    node.loc = loc;
                }
                // @ts-ignore
                context.chi.push(node);
                return node;
            }
            else {
                // declaration
                // @ts-ignore
                let name = null;
                // @ts-ignore
                let value = null;
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i].typ == 'Comment') {
                        continue;
                    }
                    if (tokens[i].typ == 'Colon') {
                        name = tokens.slice(0, i);
                        value = parseTokens(tokens.slice(i + 1), 'Declaration', {
                            parseColor: true,
                            src: options.src,
                            resolveUrls: options.resolveUrls,
                            resolve: options.resolve,
                            cwd: options.cwd
                        });
                    }
                }
                if (name == null) {
                    name = tokens;
                }
                const position = map.get(name[0]);
                if (name.length > 0) {
                    for (let i = 1; i < name.length; i++) {
                        if (name[i].typ != 'Whitespace' && name[i].typ != 'Comment') {
                            errors.push({
                                action: 'drop',
                                message: 'invalid declaration',
                                location: { src, ...position }
                            });
                            return null;
                        }
                    }
                }
                if (value == null) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                if (value.length == 0) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                const node = {
                    typ: 'Declaration',
                    // @ts-ignore
                    nam: renderToken(name.shift(), { removeComments: true }),
                    // @ts-ignore
                    val: value
                };
                while (node.val[0]?.typ == 'Whitespace') {
                    node.val.shift();
                }
                if (node.val.length == 0) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                // @ts-ignore
                context.chi.push(node);
                return null;
            }
        }
    }
    function peek(count = 1) {
        if (count == 1) {
            return iterator.charAt(ind + 1);
        }
        return iterator.slice(ind + 1, ind + count + 1);
    }
    function prev(count = 1) {
        if (count == 1) {
            return ind == 0 ? '' : iterator.charAt(ind - 1);
        }
        return iterator.slice(ind - 1 - count, ind - 1);
    }
    function next(count = 1) {
        let char = '';
        while (count-- > 0 && ind < total) {
            const codepoint = iterator.charCodeAt(++ind);
            if (isNaN(codepoint)) {
                return char;
            }
            char += iterator.charAt(ind);
            if (isNewLine(codepoint)) {
                lin++;
                col = 0;
            }
            else {
                col++;
            }
        }
        return char;
    }
    function pushToken(token) {
        tokens.push(token);
        map.set(token, { ...position });
        position.ind = ind;
        position.lin = lin;
        position.col = col == 0 ? 1 : col;
    }
    function consumeWhiteSpace() {
        let count = 0;
        while (isWhiteSpace(iterator.charAt(count + ind + 1).charCodeAt(0))) {
            count++;
        }
        next(count);
        return count;
    }
    function consumeString(quoteStr) {
        const quote = quoteStr;
        let value;
        let hasNewLine = false;
        if (buffer.length > 0) {
            pushToken(getType(buffer));
            buffer = '';
        }
        buffer += quoteStr;
        while (ind < total) {
            value = peek();
            if (ind >= total) {
                pushToken({ typ: hasNewLine ? 'Bad-string' : 'Unclosed-string', val: buffer });
                break;
            }
            if (value == '\\') {
                const sequence = peek(6);
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
                // not hex or new line
                // @ts-ignore
                if (i == 1 && !isNewLine(codepoint)) {
                    buffer += sequence[i];
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
                    }
                    else {
                        buffer += String.fromCodePoint(codepoint);
                    }
                    next(escapeSequence.length + 1);
                    continue;
                }
                // buffer += value;
                if (ind >= total) {
                    // drop '\\' at the end
                    pushToken(getType(buffer));
                    break;
                }
                buffer += next(2);
                continue;
            }
            if (value == quote) {
                buffer += value;
                pushToken({ typ: hasNewLine ? 'Bad-string' : 'String', val: buffer });
                next();
                // i += value.length;
                buffer = '';
                break;
            }
            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }
            if (hasNewLine && value == ';') {
                pushToken({ typ: 'Bad-string', val: buffer });
                buffer = '';
                break;
            }
            buffer += value;
            // i += value.length;
            next();
        }
    }
    while (ind < total) {
        value = next();
        if (ind >= total) {
            if (buffer.length > 0) {
                pushToken(getType(buffer));
                buffer = '';
            }
            break;
        }
        if (isWhiteSpace(value.charCodeAt(0))) {
            if (buffer.length > 0) {
                pushToken(getType(buffer));
                buffer = '';
            }
            while (ind < total) {
                value = next();
                if (ind >= total) {
                    break;
                }
                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }
            pushToken({ typ: 'Whitespace' });
            buffer = '';
            if (ind >= total) {
                break;
            }
        }
        switch (value) {
            case '/':
                if (buffer.length > 0 && tokens.at(-1)?.typ == 'Whitespace') {
                    pushToken(getType(buffer));
                    buffer = '';
                    if (peek() != '*') {
                        pushToken(getType(value));
                        break;
                    }
                }
                buffer += value;
                if (peek() == '*') {
                    buffer += '*';
                    // i++;
                    next();
                    while (ind < total) {
                        value = next();
                        if (ind >= total) {
                            pushToken({
                                typ: 'Bad-comment', val: buffer
                            });
                            break;
                        }
                        if (value == '\\') {
                            buffer += value;
                            value = next();
                            if (ind >= total) {
                                pushToken({
                                    typ: 'Bad-comment',
                                    val: buffer
                                });
                                break;
                            }
                            buffer += value;
                            continue;
                        }
                        if (value == '*') {
                            buffer += value;
                            value = next();
                            if (ind >= total) {
                                pushToken({
                                    typ: 'Bad-comment', val: buffer
                                });
                                break;
                            }
                            buffer += value;
                            if (value == '/') {
                                pushToken({ typ: 'Comment', val: buffer });
                                buffer = '';
                                break;
                            }
                        }
                        else {
                            buffer += value;
                        }
                    }
                }
                break;
            case '<':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= total) {
                    break;
                }
                if (peek(3) == '!--') {
                    while (ind < total) {
                        value = next();
                        if (ind >= total) {
                            break;
                        }
                        buffer += value;
                        if (value == '>' && prev(2) == '--') {
                            pushToken({
                                typ: 'CDOCOMM',
                                val: buffer
                            });
                            buffer = '';
                            break;
                        }
                    }
                }
                if (ind >= total) {
                    pushToken({ typ: 'BADCDO', val: buffer });
                    buffer = '';
                }
                break;
            case '\\':
                value = next();
                // EOF
                if (ind + 1 >= total) {
                    // end of stream ignore \\
                    pushToken(getType(buffer));
                    buffer = '';
                    break;
                }
                buffer += value;
                break;
            case '"':
            case "'":
                consumeString(value);
                break;
            case '~':
            case '|':
                if (tokens.at(-1)?.typ == 'Whitespace') {
                    tokens.pop();
                }
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= total) {
                    pushToken(getType(buffer));
                    buffer = '';
                    break;
                }
                if (value == '=') {
                    buffer += value;
                    pushToken({
                        typ: buffer[0] == '~' ? 'Includes' : 'Dash-matches',
                        val: buffer
                    });
                    buffer = '';
                    break;
                }
                pushToken(getType(buffer));
                while (isWhiteSpace(value.charCodeAt(0))) {
                    value = next();
                }
                buffer = value;
                break;
            case '>':
                if (tokens[tokens.length - 1]?.typ == 'Whitespace') {
                    tokens.pop();
                }
                if (buffer !== '') {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken({ typ: 'Gt' });
                consumeWhiteSpace();
                break;
            case '.':
                const codepoint = peek().charCodeAt(0);
                if (!isDigit(codepoint) && buffer !== '') {
                    pushToken(getType(buffer));
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
                    pushToken(getType(buffer));
                    buffer = '';
                }
                if (value == ':' && ':' == peek()) {
                    buffer += value + next();
                    break;
                }
                pushToken(getType(value));
                buffer = '';
                if (value == '+' && isWhiteSpace(peek().charCodeAt(0))) {
                    pushToken(getType(next()));
                }
                while (isWhiteSpace(peek().charCodeAt(0))) {
                    next();
                }
                break;
            case ')':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken({ typ: 'End-parens' });
                break;
            case '(':
                if (buffer.length == 0) {
                    pushToken({ typ: 'Start-parens' });
                }
                else {
                    buffer += value;
                    pushToken(getType(buffer));
                    buffer = '';
                    const token = tokens[tokens.length - 1];
                    if (token.typ == 'UrlFunc') {
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
                            consumeString(next());
                            let token = tokens[tokens.length - 1];
                            if (['String', 'Literal'].includes(token.typ) && urlTokenMatcher.test(token.val)) {
                                if (token.val.slice(1, 6) != 'data:') {
                                    if (token.typ == 'String') {
                                        token.val = token.val.slice(1, -1);
                                    }
                                    // @ts-ignore
                                    token.typ = 'Url-token';
                                }
                            }
                            break;
                        }
                        else {
                            buffer = '';
                            do {
                                let cp = value.charCodeAt(0);
                                // EOF -
                                if (cp == null) {
                                    pushToken({ typ: 'Bad-url-token', val: buffer });
                                    break;
                                }
                                // ')'
                                if (cp == 0x29 || cp == null) {
                                    if (buffer.length == 0) {
                                        pushToken({ typ: 'Bad-url-token', val: '' });
                                    }
                                    else {
                                        pushToken({ typ: 'Url-token', val: buffer });
                                    }
                                    if (cp != null) {
                                        pushToken(getType(next()));
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
                                    } while (true);
                                    pushToken({ typ: 'Bad-url-token', val: buffer });
                                    continue;
                                }
                                buffer += next();
                                value = peek();
                            } while (true);
                            buffer = '';
                        }
                    }
                }
                break;
            case '[':
            case ']':
            case '{':
            case '}':
            case ';':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken(getBlockType(value));
                let node = null;
                if (value == '{' || value == ';') {
                    node = await parseNode(tokens);
                    if (node != null) {
                        stack.push(node);
                        // @ts-ignore
                        context = node;
                    }
                    else if (value == '{') {
                        // node == null
                        // consume and throw away until the closing '}' or EOF
                        consume('{', '}');
                    }
                    tokens.length = 0;
                    map.clear();
                }
                else if (value == '}') {
                    await parseNode(tokens);
                    const previousNode = stack.pop();
                    // @ts-ignore
                    context = stack[stack.length - 1] || ast;
                    // @ts-ignore
                    if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                        context.chi.pop();
                    }
                    tokens.length = 0;
                    map.clear();
                    buffer = '';
                }
                break;
            case '!':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                const important = peek(9);
                if (important == 'important') {
                    if (tokens[tokens.length - 1]?.typ == 'Whitespace') {
                        tokens.pop();
                    }
                    pushToken({ typ: 'Important' });
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
        pushToken(getType(buffer));
    }
    if (tokens.length > 0) {
        await parseNode(tokens);
    }
    if (options.compress) {
        if (ast.chi.length > 0) {
            deduplicate(ast, options, true);
        }
    }
    return { ast, errors, bytesIn };
}
function parseTokens(tokens, nodeType, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.typ == 'Whitespace' && ((i == 0 ||
            i + 1 == tokens.length ||
            ['Comma'].includes(tokens[i + 1].typ) ||
            (i > 0 &&
                tokens[i + 1]?.typ != 'Literal' &&
                funcLike.includes(tokens[i - 1].typ) &&
                !['var', 'calc'].includes(tokens[i - 1].val))))) {
            tokens.splice(i--, 1);
            continue;
        }
        if (t.typ == 'Colon') {
            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == 'Func') {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = 'Pseudo-class-func';
                }
                else if (typ == 'Iden') {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = 'Pseudo-class';
                }
                if (typ == 'Func' || typ == 'Iden') {
                    tokens.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        if (t.typ == 'Attr-start') {
            let k = i;
            let inAttr = 1;
            while (++k < tokens.length) {
                if (tokens[k].typ == 'Attr-end') {
                    inAttr--;
                }
                else if (tokens[k].typ == 'Attr-start') {
                    inAttr++;
                }
                if (inAttr == 0) {
                    break;
                }
            }
            Object.assign(t, { typ: 'Attr', chi: tokens.splice(i + 1, k - i) });
            // @ts-ignore
            if (t.chi.at(-1).typ == 'Attr-end') {
                // @ts-ignore
                t.chi.pop();
                // @ts-ignore
                if (t.chi.length > 1) {
                    /*(<AttrToken>t).chi =*/
                    // @ts-ignore
                    parseTokens(t.chi, t.typ, options);
                }
                // @ts-ignore
                t.chi.forEach(val => {
                    if (val.typ == 'String') {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: 'Iden', val: slice });
                        }
                    }
                });
            }
            continue;
        }
        if (funcLike.includes(t.typ)) {
            let parens = 1;
            let k = i;
            while (++k < tokens.length) {
                if (tokens[k].typ == 'Colon') {
                    const typ = tokens[k + 1]?.typ;
                    if (typ != null) {
                        if (typ == 'Iden') {
                            tokens[k + 1].typ = 'Pseudo-class';
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        else if (typ == 'Func') {
                            tokens[k + 1].typ = 'Pseudo-class-func';
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        if (typ == 'Func' || typ == 'Iden') {
                            tokens.splice(k, 1);
                            k--;
                            continue;
                        }
                    }
                }
                if (funcLike.includes(tokens[k].typ)) {
                    parens++;
                }
                else if (tokens[k].typ == 'End-parens') {
                    parens--;
                }
                if (parens == 0) {
                    break;
                }
            }
            // @ts-ignore
            t.chi = tokens.splice(i + 1, k - i);
            // @ts-ignore
            if (t.chi.at(-1)?.typ == 'End-parens') {
                // @ts-ignore
                t.chi.pop();
            }
            let isColor = true;
            // @ts-ignore
            if (options.parseColor && ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk'].includes(t.val)) {
                // @ts-ignore
                for (const v of t.chi) {
                    if (v.typ == 'Func' && v.val == 'var') {
                        isColor = false;
                        break;
                    }
                }
                if (isColor) {
                    // @ts-ignore
                    t.typ = 'Color';
                    // @ts-ignore
                    t.kin = t.val;
                    // @ts-ignore
                    let m = t.chi.length;
                    while (m-- > 0) {
                        // @ts-ignore
                        if (t.chi[m].typ == 'Literal') {
                            // @ts-ignore
                            if (t.chi[m + 1]?.typ == 'Whitespace') {
                                // @ts-ignore
                                t.chi.splice(m + 1, 1);
                            }
                            // @ts-ignore
                            if (t.chi[m - 1]?.typ == 'Whitespace') {
                                // @ts-ignore
                                t.chi.splice(m - 1, 1);
                                m--;
                            }
                        }
                    }
                    continue;
                }
            }
            if (t.typ == 'UrlFunc') {
                // @ts-ignore
                if (t.chi[0]?.typ == 'String') {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);
                    // @ts-ignore
                    if (t.chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        t.chi[0].typ = 'Url-token';
                        // @ts-ignore
                        t.chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                    }
                }
                if (t.chi[0]?.typ == 'Url-token') {
                    if (options.src !== '' && options.resolveUrls) {
                        // @ts-ignore
                        t.chi[0].val = options.resolve(t.chi[0].val, options.src, options.cwd).relative;
                    }
                }
            }
            // @ts-ignore
            if (t.chi.length > 0) {
                // @ts-ignore
                parseTokens(t.chi, t.typ, options);
                if (t.typ == 'Pseudo-class-func' && t.val == ':is' && options.compress) {
                    //
                    const count = t.chi.filter(t => t.typ != 'Comment').length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == 'Comma' || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == 'Comma' && (tokens[i + 1]?.typ == 'Comma' || tokens.length == i + 1))) {
                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }
            continue;
        }
        if (options.parseColor) {
            if (t.typ == 'Iden') {
                // named color
                const value = t.val.toLowerCase();
                if (COLORS_NAMES[value] != null) {
                    Object.assign(t, {
                        typ: 'Color',
                        val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                        kin: 'hex'
                    });
                }
                continue;
            }
            if (t.typ == 'Hash' && isHexColor(t.val)) {
                // hex color
                // @ts-ignore
                t.typ = 'Color';
                // @ts-ignore
                t.kin = 'hex';
            }
        }
    }
    return tokens;
}
function getBlockType(chr) {
    if (chr == ';') {
        return { typ: 'Semi-colon' };
    }
    if (chr == '{') {
        return { typ: 'Block-start' };
    }
    if (chr == '}') {
        return { typ: 'Block-end' };
    }
    if (chr == '[') {
        return { typ: 'Attr-start' };
    }
    if (chr == ']') {
        return { typ: 'Attr-end' };
    }
    throw new Error(`unhandled token: '${chr}'`);
}
