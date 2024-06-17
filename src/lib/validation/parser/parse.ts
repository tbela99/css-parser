import {
    AmpersandToken,
    AtLeastOneToken,
    CloseBracketToken,
    CloseCurlyBraceToken,
    CloseParenthesisToken,
    ColumnToken,
    CommaToken,
    ExclamationToken,
    FinalToken,
    FunctionToken,
    KeywordToken,
    NumberToken,
    OpenBracketToken,
    OpenCurlyBraceToken,
    OpenParenthesisToken,
    OptionalToken,
    ParenthesisToken,
    PipeToken,
    Position,
    SeparatorToken,
    StarToken,
    ValidationAmpersandToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationDeclarationToken,
    ValidationFunctionToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationRootToken,
    ValidationToken,
    ValidationTokenEnum,
    WhitespaceToken
} from "./index";

declare type ValidationContext =
    ValidationRootToken
    | ValidationBracketToken
    | FunctionToken
    | ParenthesisToken;

interface ValidationTokenIteratorValue {
    value: ValidationToken;
    done: boolean;
}

// syntax: keyword | <'property'> | <function>

// "none | [ [<dashed-ident> || <try-tactic>] | inset-area( <'inset-area'> ) ]#"
// ""
// : "<outline-radius>{1,4} [ / <outline-radius>{1,4} ]?
// ""
// false | true
// [ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <box> | border | padding | content | text ] || [ <box> | border | padding | content ] ]#
// false | true | green | pipe
// keyword | <'property'> | <function>
// [<dashed-ident> || <try-tactic>]
// [ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <box> | border | padding | content | text ] || [ <box> | border | padding | content ] ]#
// none | [ [<dashed-ident> || <try-tactic>] | inset-area( <'inset-area'> ) ]

function* tokenize(syntax: string): Generator<ValidationToken> {

    let i: number = -1;
    let buffer: string = '';

    const position: Position = {

        ind: 0,
        lin: 1,
        col: 0
    }

    const currentPosition: Position = {

        ind: -1,
        lin: 1,
        col: 0
    }

    while (++i < syntax.length) {

        let chr: string = syntax.charAt(i);

        move(currentPosition, chr);

        switch (chr) {

            case ' ':
            case '|':
            case '#':
            case '+':
            case ',':
            case '[':
            case ']':
            case '(':
            case ')':
            case '*':
            case '{':
            case '}':
            case '?':
            case '!':
            case '&':

                if (buffer.length > 0) {

                    yield getTokenType(buffer, position, currentPosition);
                }

                if (chr == '|' || chr == '&') {

                    if (syntax.charAt(i + 1) == chr) {

                        move(currentPosition, chr);

                        yield getTokenType(chr + chr, position, currentPosition);
                        i++;
                        buffer = '';
                        continue;
                    }
                }

                Object.assign(position, currentPosition);
                yield getTokenType(chr, position, currentPosition);

                buffer = '';
                break;

            default:

                buffer += chr;
                break;
        }
    }

    if (buffer.length > 0) {

        yield getTokenType(buffer, position, currentPosition);
    }
}

export function parseSyntax(syntax: string): ValidationRootToken {

    const root: ValidationRootToken = {
        typ: ValidationTokenEnum.Root,
        chi: [],
        pos: {ind: 0, lin: 1, col: 0}
    } as ValidationRootToken;

    return minify(doParseSyntax(syntax, tokenize(syntax), root)) as ValidationRootToken;
}

function doParseSyntax(syntax: string, iterator: Iterator<ValidationTokenIteratorValue> | Generator<ValidationToken>, context: ValidationContext): ValidationContext {

    let item: ValidationTokenIteratorValue;
    let hasPipe: boolean = false;
    let i: number;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        switch (item.value.typ) {

            case ValidationTokenEnum.Star:
            case ValidationTokenEnum.HashMark:
            case ValidationTokenEnum.AtLeastOnce:
            case ValidationTokenEnum.Exclamation:
            case ValidationTokenEnum.QuestionMark:
            case ValidationTokenEnum.OpenCurlyBrace:

                i = context.chi.length;

                while (i--) {

                    if (context.chi[i].typ != ValidationTokenEnum.Whitespace) {

                        break;
                    }
                }

                if (item.value.typ == ValidationTokenEnum.Exclamation) {

                    (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isRepeatableGroup = true;
                } else if (item.value.typ == ValidationTokenEnum.QuestionMark) {

                    (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isOptional = true;
                } else if (item.value.typ == ValidationTokenEnum.Star) {

                    (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isRepeatable = true;
                } else if (item.value.typ == ValidationTokenEnum.AtLeastOnce) {

                    (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).atLeastOnce = true;
                } else if (item.value.typ == ValidationTokenEnum.HashMark) {

                    (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isList = true;
                } else if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {

                    (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence = {

                        min: 0,
                        max: 0
                    };

                    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

                        if (item.value.typ == ValidationTokenEnum.Number) {
                            // @ts-ignore
                            if ((context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence.min == 0) {

                                // @ts-ignore
                                (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence.min = +(item.value as NumberToken).val;
                            } else {

                                // @ts-ignore
                                (context.chi[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence.max = +(item.value as NumberToken).val;
                            }
                        }

                        if (item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {

                            break;
                        }
                    }
                }

                break;

            case ValidationTokenEnum.DeclarationType:
            case ValidationTokenEnum.Whitespace:
            case ValidationTokenEnum.Separator:
            case ValidationTokenEnum.PropertyType:
            case ValidationTokenEnum.Keyword:
            case ValidationTokenEnum.Comma:
            case ValidationTokenEnum.Number:

                context.chi.push(item.value);
                break;

            case ValidationTokenEnum.Pipe:
            case ValidationTokenEnum.Column:
            case ValidationTokenEnum.Ampersand:

                hasPipe = true;
                context.chi.push(item.value);
                break;

            case ValidationTokenEnum.OpenBracket:

                context.chi.push(Object.assign(parseBrackets(syntax, iterator as Iterator<ValidationTokenIteratorValue>, {pos: item.value.pos}) as ValidationToken, {pos: item.value.pos}));
                break;

            case ValidationTokenEnum.OpenParenthesis:

                const name: string = (context.chi.pop() as KeywordToken)?.val ?? '';

                context.chi.push(
                    Object.assign(parseParenthesis(syntax, iterator as Iterator<ValidationTokenIteratorValue>, {pos: item.value.pos}) as ValidationToken, {
                        val: name,
                        pos: item.value.pos
                    }, name === '' ? {typ: ValidationTokenEnum.ParentsToken} : {}) as ValidationFunctionToken);

                break;

            case ValidationTokenEnum.CloseParenthesis:

                break;

            default:

                throw new Error(`unsupported token at ${item.value.pos.lin}:${item.value.pos.col} : unexpected token '${JSON.stringify(item.value)}'
                '${syntax.slice(item.value.pos.ind + 1, item.value.pos.ind + 10)}...\n'${syntax}'`);
        }
    }

    if (hasPipe) {

        let l: number;
        let r: number;
        i = context.chi.length;

        while (i--) {

            if (
                [ValidationTokenEnum.Pipe, ValidationTokenEnum.Column, ValidationTokenEnum.Ampersand].includes(context.chi[i].typ)) {

                l = i - 1;

                while (l >= 0 && context.chi[l].typ == ValidationTokenEnum.Whitespace) {

                    l--;
                }

                r = i + 1;

                while (r < context.chi.length - 1 && context.chi[r].typ == ValidationTokenEnum.Whitespace) {

                    r++;
                }

                const token = {
                    typ: context.chi[i].typ == ValidationTokenEnum.Pipe ? ValidationTokenEnum.PipeToken : (context.chi[i].typ == ValidationTokenEnum.Ampersand ? ValidationTokenEnum.AmpersandToken : ValidationTokenEnum.ColumnToken),
                    l: context.chi.slice(l, i),
                    r: context.chi.slice(i + 1, r + 1)
                }

                context.chi.splice(l, r - l + 1, token as ValidationPipeToken);
                i = l;
            }
        }
    }


    return context;
}

function parseParenthesis(syntax: string, iterator: Iterator<ValidationTokenIteratorValue>, startPosition: {
    pos: Position
}) {

    const token = {
        typ: ValidationTokenEnum.Function,
        val: '',
        chi: [] as ValidationToken[],
        pos: startPosition.pos
    }

    let match: number = 1;

    let tokens: ValidationToken[] = [];
    let item: ValidationTokenIteratorValue;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        if (item.value.typ == ValidationTokenEnum.OpenParenthesis) {

            match++;
        } else if (item.value.typ == ValidationTokenEnum.CloseParenthesis) {

            match--;
        }

        if (match == 0) {

            break;
        }

        tokens.push(item.value);
    }

    return doParseSyntax(syntax, tokens[Symbol.iterator]() as Iterator<ValidationTokenIteratorValue>, token as ValidationContext) as ValidationBracketToken;
}

function parseBrackets(syntax: string, iterator: Iterator<ValidationTokenIteratorValue> | Generator<ValidationTokenIteratorValue>, startPosition: {
    pos: Position
}): ValidationBracketToken {

    const token = {
        typ: ValidationTokenEnum.Bracket,
        chi: [] as ValidationToken[],
        pos: startPosition.pos
    }

    let match: number = 1;

    let tokens: ValidationToken[] = [];
    let item: ValidationTokenIteratorValue;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        if (item.value.typ == ValidationTokenEnum.OpenBracket) {

            match++;
        } else if (item.value.typ == ValidationTokenEnum.CloseBracket) {

            match--;
        }

        if (match == 0) {

            break;
        }

        tokens.push(item.value);
    }

    return doParseSyntax(syntax, tokens[Symbol.iterator]() as Iterator<ValidationTokenIteratorValue>, token as ValidationContext) as ValidationBracketToken;
}

function getTokenType(token: string, position: Position, currentPosition: Position): ValidationToken {

    const pos: Position = {...position};

    Object.assign(position, currentPosition);

    if (token.match(/^\s+$/)) {

        return <WhitespaceToken>{
            typ: ValidationTokenEnum.Whitespace,
            pos
        };
    }

    if (token.match(/^\d+$/)) {

        return <NumberToken>{
            typ: ValidationTokenEnum.Number,
            val: Number(token),
            pos
        };
    }

    if (token == '!') {

        return <ExclamationToken>{
            typ: ValidationTokenEnum.Exclamation,
            pos
        };
    }

    if (token == '#') {

        return <FinalToken>{
            typ: ValidationTokenEnum.HashMark,
            pos
        };
    }

    if (token == '/') {

        return <SeparatorToken>{
            typ: ValidationTokenEnum.Separator,
            pos
        };
    }

    if (token == '+') {

        return <AtLeastOneToken>{
            typ: ValidationTokenEnum.AtLeastOnce,
            pos
        };
    }

    if (token == '|') {

        return <PipeToken>{
            typ: ValidationTokenEnum.Pipe,
            pos
        };
    }

    if (token == '&&') {

        return <AmpersandToken>{
            typ: ValidationTokenEnum.Ampersand,
            pos
        };
    }

    if (token == '||') {

        return <ColumnToken>{
            typ: ValidationTokenEnum.Column,
            pos
        };
    }

    if (token == ',') {

        return <CommaToken>{
            typ: ValidationTokenEnum.Comma,
            pos
        };
    }

    if (token == '[') {

        return <OpenBracketToken>{
            typ: ValidationTokenEnum.OpenBracket,
            pos
        };
    }

    if (token == ']') {

        return <CloseBracketToken>{
            typ: ValidationTokenEnum.CloseBracket,
            pos
        };
    }

    if (token == '(') {

        return <OpenParenthesisToken>{
            typ: ValidationTokenEnum.OpenParenthesis,
            pos
        };
    }

    if (token == ')') {

        return <CloseParenthesisToken>{
            typ: ValidationTokenEnum.CloseParenthesis,
            pos
        };
    }

    if (token == '{') {

        return <OpenCurlyBraceToken>{
            typ: ValidationTokenEnum.OpenCurlyBrace,
            pos
        };
    }

    if (token == '}') {

        return <CloseCurlyBraceToken>{
            typ: ValidationTokenEnum.CloseCurlyBrace,
            pos
        };
    }

    if (token == '*') {

        return <StarToken>{
            typ: ValidationTokenEnum.Star,
            pos
        };
    }

    if (token == '?') {

        return <OptionalToken>{
            typ: ValidationTokenEnum.QuestionMark,
            pos
        };
    }

    if (token.startsWith("<'")) {

        return <ValidationDeclarationToken>{
            typ: ValidationTokenEnum.DeclarationType,
            val: token.slice(2, -2),
            pos
        };
    }

    if (token.startsWith('<')) {

        return <ValidationPropertyToken>{
            typ: ValidationTokenEnum.PropertyType,
            val: token.slice(1, -1),
            pos
        };
    }

    return <KeywordToken>{
        typ: ValidationTokenEnum.Keyword,
        val: token,
        pos
    };
}

function move(position: Position, chr: string): Position {

    for (const c of chr) {

        position.col++;
        position.ind += c.length;
    }

    return position;
}

export function render(token: ValidationToken): string {

    switch (token.typ) {

        case ValidationTokenEnum.Root:

            return (token as ValidationRootToken).chi.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '');

        case ValidationTokenEnum.Whitespace:

            return ' ';

        case ValidationTokenEnum.HashMark:

            return '#';

        case ValidationTokenEnum.Pipe:

            return '|';

        case ValidationTokenEnum.PipeToken:

            return (token as ValidationPipeToken).l.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '') + ' | ' + (token as ValidationPipeToken).r.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '');

        case ValidationTokenEnum.ColumnToken:

            return (token as ValidationColumnToken).l.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '') + ' || ' + (token as ValidationColumnToken).r.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '');

        case ValidationTokenEnum.AmpersandToken:

            return (token as ValidationAmpersandToken).l.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '') + ' && ' + (token as ValidationAmpersandToken).r.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '');

        case ValidationTokenEnum.Function:
        case ValidationTokenEnum.ParentsToken:

            return (token as ValidationFunctionToken).val + '(' + (token as ValidationFunctionToken).chi.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '') + ')' + renderAttributes(token);

        case ValidationTokenEnum.Comma:

            return ',';

        case ValidationTokenEnum.Keyword:

            return (token as KeywordToken).val + renderAttributes(token);

        case ValidationTokenEnum.OpenBracket:

            return '[';

        case ValidationTokenEnum.QuestionMark:

            return '?';

        case ValidationTokenEnum.Separator:

            return '/';

        case ValidationTokenEnum.Bracket:

            return '[' + (token as ValidationBracketToken).chi.reduce((acc: string, curr: ValidationToken) => acc + render(curr), '') + ']' + renderAttributes(token);

        case ValidationTokenEnum.PropertyType:

            return '<' + (token as ValidationPropertyToken).val + '>' + renderAttributes(token);

        case ValidationTokenEnum.DeclarationType:

            return "<'" + (token as ValidationPropertyToken).val + "'>" + renderAttributes(token);

        case ValidationTokenEnum.Number:

            return (token as NumberToken).val + '';

        default:

            throw new Error('Unhandled token: ' + JSON.stringify(token));
    }
}

function renderAttributes(token: ValidationToken): string {

    let result: string = '';

    if (token.isList) {

        result += '#';
    }

    if (token.isOptional) {

        result += '?';
    }

    if (token.isRepeatableGroup) {

        result += '!';
    }

    if (token.isRepeatable) {

        result += '*';
    }

    if (token.atLeastOnce) {

        result += '+';
    }

    if (token.occurence != null) {

        if (token.occurence.max == 0 || token.occurence.max == token.occurence.min || Number.isNaN(token.occurence.max)) {

            result += '{' + token.occurence.min + '}';
        } else {

            result += '{' + token.occurence.min + ',' + token.occurence.max + '}';
        }
    }

    return result;
}

function minify(ast: ValidationToken | ValidationToken[]): ValidationToken | ValidationToken[] {

    if (Array.isArray(ast)) {

        if (ast.length > 0 && (ast.at(-1) as ValidationToken).typ == ValidationTokenEnum.Whitespace) {

            ast.pop();
        }

        if (ast.length > 0 && ast[0].typ == ValidationTokenEnum.Whitespace) {

            ast.shift();
        }

        for (let i = 0; i < ast.length; i++) {

            if ([ValidationTokenEnum.ColumnToken, ValidationTokenEnum.PipeToken, ValidationTokenEnum.AmpersandToken].includes(ast[i].typ)) {

                minify((ast[i] as ValidationPipeToken | ValidationColumnToken).l as ValidationToken[]);
                minify((ast[i] as ValidationPipeToken | ValidationColumnToken).r as ValidationToken[]);

            } else if ('chi' in ast[i]) {

                minify((ast[i] as ValidationFunctionToken | ValidationBracketToken).chi as ValidationToken[]);

            } else if (ast[i].typ == ValidationTokenEnum.Separator) {

                if (ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {

                    ast.splice(i + 1, 1);
                }

                if (ast[i - 1]?.typ == ValidationTokenEnum.Whitespace) {

                    ast.splice(--i, 1);
                }
            }
        }
    } else {

        if ([ValidationTokenEnum.ColumnToken, ValidationTokenEnum.PipeToken].includes(ast.typ)) {

            minify((ast as ValidationPipeToken | ValidationColumnToken).l as ValidationToken[]);
            minify((ast as ValidationPipeToken | ValidationColumnToken).r as ValidationToken[]);

        } else if ('chi' in ast) {

            minify((ast as ValidationFunctionToken | ValidationBracketToken).chi as ValidationToken[]);
        }
    }

    return ast;
}

export function cleanup(ast: { [key: string]: any }) {

    const {pos, ...response} = ast;

    for (const [key, value] of Object.entries(response)) {

        if (Array.isArray(value)) {

            response[key] = value.map(e => cleanup(e));
        } else if (typeof value == 'object') {

            response[key] = cleanup(value);
        }
    }

    return response;
}

interface ParsedSyntax {
    syntax: string
    ast: ValidationToken[]
}

interface ParsedFunctionSyntax {
    syntax: string;
    ast: ValidationToken[];
    mdn_url: string;
}

export async function parseDeclarationsSyntax() {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/properties.json').then(r => r.json()) as Record<string, {
        syntax: string
    }>;

    const json = {} as Record<string, ParsedSyntax>;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key == '--*') {

            continue;
        }

        json[key] = {
            syntax: values.syntax,
            ast: parseSyntax(values.syntax).chi
        };
    }

    return cleanup(json);
}

export async function parseFunctionsSyntax() {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/functions.json').then(r => r.json()) as Record<string, {
        syntax: string;
        mdn_url: string;
    }>;

    const json = {} as Record<string, ParsedFunctionSyntax>;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key == '--*') {

            continue;
        }

        json[key.slice(0, -2)] = {
            syntax: values.syntax,
            ast: parseSyntax(values.syntax).chi,
            mdn_url: values.mdn_url
        };
    }

    return cleanup(json);
}

export async function parseAllSyntaxes() {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/syntaxes.json').then(r => r.json()) as Record<string, {
        syntax: string;
    }>;

    const json = {} as Record<string, ParsedSyntax>;

    for (const [key, values] of Object.entries(syntaxes)) {

        json[key] = {
            syntax: values.syntax,
            ast: parseSyntax(values.syntax).chi
        };
    }

    return cleanup(json);
}

