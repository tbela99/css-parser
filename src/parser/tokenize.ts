import {
    isAtKeyword, isDigit, isDimension, isFunction, isHash,
    isIdent, isIdentCodepoint, isIdentStart,
    isNewLine, isNumber, isPercentage,
    isPseudo, isWhiteSpace, parseDimension, update as updatePosition
} from "./utils";
import {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AtRuleToken,
    BadCommentToken,
    BadStringToken,
    DashMatchToken,
    ErrorDescription,
    FunctionToken,
    IncludesToken,
    Location,
    NodeTraverseCallback,
    NodeTraverseEventsMap,
    Position,
    PseudoSelectorToken,
    Token
} from "../@types";

// const badTokens: string[] = ['Whitespace', 'Semi-colon', 'Bad-string', 'Bad-comment', 'Bad-cdo-comment'];

export function tokenize(iterator: string, errors: ErrorDescription[], events: NodeTraverseEventsMap, trackLocation: boolean /*, callable: (token: Token) => void */): AstRuleStyleSheet {

    let value: string;
    let buffer: string = '';
    let i: number = -1;
    let ind: number = -1;
    let lin: number = 1;
    let col: number = 0;
    const stack: Array<AstNode | AstComment> = [];
    let total: number = iterator.length;

    const enterEvent: boolean = 'enter' in events;
    const exitEvent: boolean = 'exit' in events;

    const root: AstRuleStyleSheet = {
        typ: "StyleSheet",
        chi: []
    }

    if (trackLocation) {

        root.loc = {

            sta: {

                ind: 0,
                lin: 1,
                col: 1
            },

            end: {

                ind: -1,
                lin: 1,
                col: 0
            },
            src: ''
        }
    }

    const weakMap: WeakMap<Token, Position> = new WeakMap<Token, Position>;

    function update(css: string) {

        if (css === '') {

            return;
        }

        let codepoint: number;
        let offset: number;
        let i: number = 0;
        const j: number = css.length - 1;

        while (i <= j) {

            codepoint = <number>css.codePointAt(i);
            offset = codepoint < 256 ? 1 : String.fromCodePoint(codepoint).length;

            if (isNewLine(codepoint)) {

                lin++;
                col = 0;

                // \r\n
                if (codepoint == 0xd && css.codePointAt(i + 1) == 0xa) {

                    offset++;
                    ind++;
                }

            } else {

                col++;
            }

            ind++;
            i += offset;
        }
    }

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

            const pos = {ind, lin, col};

            if (pos.ind == -1) {

                pos.ind = 0;
            }

            if (pos.col == 0) {

                pos.col = 1;
            }

            weakMap.set(token, pos);
        }
    }

    const tokens: Token[] = [];

    let context = root;

    while (i < total) {

        value = next();

        if (i >= total) {

            if (buffer.length > 0) {

                pushToken(getType(buffer));
                update(buffer);
                buffer = '';
            }

            break;
        }

        if (isWhiteSpace(<number>value.codePointAt(0))) {

            if (buffer.length > 0) {

                pushToken(getType(buffer));
                update(buffer);

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
            update(whitespace);

            buffer = '';

            if (i >= total) {

                break;
            }
        }

        switch (value) {

            case '/':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(buffer);

                    buffer = '';
                }

                buffer += value;

                if (peek() == '*') {

                    buffer += '*';
                    i++;

                    while (i < total) {

                        value = next();

                        if (i >= total) {

                            pushToken({
                                typ: 'Bad-comment', val: buffer
                            });
                            update(buffer);

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

                                update(buffer);
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

                                update(buffer);
                                break;
                            }

                            buffer += value;

                            if (value == '/') {

                                pushToken({typ: 'Comment', val: buffer});
                                update(buffer);

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
                    update(buffer);
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

                            update(buffer);
                            buffer = '';
                            break;
                        }
                    }
                }

                if (i >= total) {

                    pushToken({typ: 'Bad-cdo-comment', val: buffer});
                    update(buffer);

                    buffer = '';
                }

                break;

            case '\\':

                value = next();

                // EOF
                if (i + 1 >= total) {

                    // end of stream ignore \\
                    pushToken(getType(buffer));
                    update(buffer);

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
                    update(buffer);

                    buffer = '';
                }

                buffer += value;

                while (i < total) {

                    value = peek();

                    if (i >= total) {

                        pushToken({typ: hasNewLine ? 'Bad-string' : 'Unclosed-string', val: buffer});
                        update(buffer);
                        break;
                    }

                    if (value == '\\') {

                        // buffer += value;

                        if (i >= total) {

                            // drop '\\' at the end
                            pushToken(getType(buffer));
                            update(buffer);

                            break;
                        }

                        buffer += next(2);
                        continue;
                    }

                    if (value == quote) {

                        buffer += value;

                        pushToken({typ: hasNewLine ? 'Bad-string' : 'String', val: buffer});
                        update(buffer);

                        i += value.length;
                        buffer = '';
                        break;
                    }

                    if (isNewLine(<number>value.codePointAt(0))) {

                        hasNewLine = true;
                    }

                    if (hasNewLine && value == ';') {

                        pushToken({typ: 'Bad-string', val: buffer});
                        update(buffer);

                        buffer = '';
                        break;
                    }

                    buffer += value;
                    i += value.length;
                }

                break;

            case '~':
            case '|':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(buffer);

                    buffer = '';
                }

                buffer += value;
                value = next();

                if (i >= total) {

                    pushToken(getType(buffer));
                    update(buffer);

                    buffer = '';
                    break;
                }

                if (value == '=') {

                    buffer += value;

                    pushToken(<IncludesToken | DashMatchToken>{
                        typ: buffer[0] == '~' ? 'Includes' : 'Dash-matches',
                        val: buffer
                    });

                    update(buffer);
                    buffer = '';
                    break;
                }

                pushToken(getType(buffer));
                update(buffer);

                buffer = value;
                break;

            case ':':
            case ',':
            case '=':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(buffer);
                    buffer = '';
                }

                if (value == ':' && isIdent(peek())) {

                    buffer += value;
                    break;
                }

                pushToken(getType(value));
                update(value);

                buffer = '';
                break;

            case ')':

                if (buffer.length > 0) {

                    pushToken(getType(buffer));
                    update(buffer);

                    buffer = '';
                }

                pushToken({typ: 'End-parens'});
                update(value);
                break;

            case '(':

                if (buffer.length == 0) {

                    pushToken({typ: 'Start-parens'});
                    update(value);
                } else {

                    buffer += value;

                    pushToken(getType(buffer));
                    update(buffer);
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
                    update(buffer);

                    buffer = '';
                }

                pushToken(getBlockType(value));
                update(value);

                let node = null;

                if (value == '{' || value == ';') {

                    node =  parseNode(root, context, tokens, events, errors, trackLocation, root.loc?.src || '', weakMap);

                    if (node != null) {

                        stack.push(node);

                        // @ts-ignore
                        context = node;

                    }

                    tokens.length = 0;

                } else if (value == '}') {

                    node = parseNode(root, context, tokens, events, errors, trackLocation, root.loc?.src || '', weakMap);
                    const previousNode = stack.pop();

                    if (previousNode != null && 'exit' in events &&  previousNode != root) {

                        // @ts-ignore
                        events.exit.forEach(callback => callback(<AstNode>previousNode, context, root))

                    }
                    // @ts-ignore
                    context = stack[stack.length - 1] || root;

                    tokens.length = 0;
                    buffer = '';
                }

                // @ts-ignore
                if (node != null && trackLocation && ['}', ';'].includes(value) && context.chi[context.chi.length - 1].loc.end == null) {

                    // @ts-ignore
                    context.chi[context.chi.length - 1].loc.end = {ind, lin, col};
                }

                break;

            default:

                buffer += value;
                break;
        }
    }

    if (buffer.length > 0) {

        pushToken(getType(buffer));
        update(buffer);
    }

    // pushToken({typ: 'EOF'});

    if (col == 0) {

        col = 1;
    }

    if (trackLocation) {

        // @ts-ignore
        root.loc.end = {ind, lin, col};


        for (const context of stack) {

            // @ts-ignore
            context.loc.end = {ind, lin, col};
        }
    }

    return root;
}

function parseNode(root: AstRuleStyleSheet, context: AstRuleList, tokens: Token[], events: NodeTraverseEventsMap, errors: ErrorDescription[], trackLocation: boolean, src: string, weakMap: WeakMap<Token, Position>) {

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
                    end: updatePosition({...position}, tokens[i].val),
                    src
                }
            }

            // @ts-ignore
            'enter' in events && events.enter.forEach(callback => callback(<AstNode>tokens[i], context, root))

        } else if (tokens[i].typ != 'Whitespace') {

            break;
        }
    }

    tokens = tokens.slice(i);

    const delim: Token = <Token>tokens.pop();

    while (['Whitespace', 'Bad-string', 'Bad-comment'].includes(tokens[tokens.length - 1]?.typ)) {

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

            const position: Position = <Position>weakMap.get(atRule);

            node.loc = <Location>{
                sta: position,
                // end: weakMap.get(delim),
                src
            }
        }

        // @ts-ignore
        root.chi.push(node);

        if (delim.typ == 'Block-start') {

            // @ts-ignore
            'enter' in events && events.enter.forEach(callback => callback(<AstNode>node, context, root))

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

                const position: Position = <Position>weakMap.get(tokens[0]);

                node.loc = <Location>{
                    sta: position,
                    // end: weakMap.get(delim),
                    src
                }
            }

            // @ts-ignore
            root.chi.push(node);

            // @ts-ignore
            'enter' in events && events.enter.forEach(callback => callback(<AstNode>node, context, root))

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
                } else if (['Function', 'Pseudo-selector'].includes(tokens[i].typ) && (<FunctionToken | PseudoSelectorToken>tokens[i]).val.startsWith(':')) {

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
                nam: name == null ? tokens : name,
                // @ts-ignore
                val: value
            }

            const position: Position = <Position>weakMap.get(node.nam[0]);

            if (node.val == null) {

                errors.push({action: 'drop', message: 'invalid declaration', location: {src, ...position}});
                return null;
            }

            while (node.val[0]?.typ == 'Whitespace') {

                node.val.shift();
            }

            if (node.val.length == 0) {

                errors.push({action: 'drop', message: 'invalid declaration', location: {src, ...position}});
                return null;
            }

            if (trackLocation) {

                node.loc = <Location>{
                    sta: position,
                    // end: weakMap.get(delim),
                    src
                }
            }

            // @ts-ignore
            root.chi.push(node);
            // @ts-ignore
            'enter' in events && events.enter.forEach(callback => callback(<AstNode>node, context, root))

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

function getType(val: string): Token {

    if (val === '') {

        throw new Error('empty string?');
    }

    if (val == ':') {

        return {typ: 'Colon'};
    }

    if (val == '=') {

        return {typ: 'Delim', val};
    }
    if (val == ';') {

        return {typ: 'Semi-colon'};
    }

    if (val == ',') {

        return {typ: 'Comma'};
    }

    if (val == '<') {

        return {typ: 'Less-than'};
    }

    if (val == '>') {

        return {typ: 'Greater-than'};
    }

    if (isPseudo(val)) {

        return {
            typ: 'Pseudo-selector',
            val
            // buffer: buffer.slice()
        }
    }

    if (isAtKeyword(val)) {

        return {
            typ: 'At-rule',
            val: val.slice(1)
            // buffer: buffer.slice()
        }
    }

    if (isFunction(val)) {

        return {
            typ: 'Function',
            val: val.slice(0, -1)
        }
    }

    if (isNumber(val)) {

        return {
            typ: 'Number',
            val
        }
    }

    if (isDimension(val)) {

        return parseDimension(val);
    }

    if (isPercentage(val)) {

        return  {
            typ: 'Percentage',
            val: val.slice(0, -1)
        }
    }

    if (isIdent(val)) {

        return {
            typ: 'Ident',
            val
        }
    }

    if (val.charAt(0) == '#' && isHash(val)) {

        return {
            typ: 'Hash',
            val
        }
    }

    if ('"\''.includes(val.charAt(0))) {

        return {
            typ: 'Unclosed-string',
            val
        }
    }

    return {
        typ: 'Literal',
        val
    }
}