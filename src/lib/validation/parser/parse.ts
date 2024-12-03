import {
    AmpersandToken,
    AtLeastOneToken,
    CloseBracketToken,
    CloseCurlyBraceToken,
    CloseParenthesisToken,
    ColumnToken,
    ExclamationToken,
    FinalToken,
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
    ValidationAtRuleDefinitionToken,
    ValidationAtRuleToken,
    ValidationBracketToken,
    ValidationCharacterToken,
    ValidationColumnToken,
    ValidationCommaToken,
    ValidationDeclarationDefinitionToken,
    ValidationDeclarationNameToken,
    ValidationDeclarationToken,
    ValidationFunctionDefinitionToken,
    ValidationFunctionToken,
    ValidationKeywordToken,
    ValidationParensToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationPseudoClassFunctionToken,
    ValidationPseudoClassToken,
    ValidationRootToken,
    ValidationSemiColonToken,
    ValidationStringToken,
    ValidationToken,
    ValidationTokenEnum,
    ValidationWhitespaceToken
} from "./index";
import {isIdent, isPseudo} from '../../syntax';

declare type ValidationContext =
    ValidationRootToken
    | ValidationBracketToken
    | ValidationFunctionToken
    | ParenthesisToken
    | ValidationAtRuleDefinitionToken;

interface ValidationTokenIteratorValue {
    value: ValidationToken;
    done: boolean;
}

const skipped = [

    ValidationTokenEnum.Star,
    ValidationTokenEnum.HashMark,
    ValidationTokenEnum.AtLeastOnce,
    ValidationTokenEnum.Exclamation,
    ValidationTokenEnum.QuestionMark,
    ValidationTokenEnum.OpenCurlyBrace
];

const objectProperties = {
    enumerable: false,
    writable: true,
    configurable: true
}

const fetchInit = {headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:129.0) Gecko/20100101 Firefox/129.0'}}
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

function* tokenize(syntax: string, position: Position = {ind: 0, lin: 1, col: 0}, currentPosition: Position = {
    ind: -1,
    lin: 1,
    col: 0
}): Generator<ValidationToken> {

    let i: number = -1;
    let buffer: string = '';

    while (++i < syntax.length) {

        let chr: string = syntax.charAt(i);

        move(currentPosition, chr);

        switch (chr) {

            case '\\':

                if (buffer.length > 0) {

                    yield getTokenType(buffer, position, currentPosition);
                    buffer = '';
                }

                buffer += chr;
                chr = syntax.charAt(++i);
                buffer += chr;
                move(currentPosition, chr);
                break;

            case ';':

                if (buffer.length > 0) {

                    yield getTokenType(buffer, position, currentPosition);
                    buffer = '';
                }

                yield getTokenType(chr, position, currentPosition);
                buffer = '';
                break;

            case ':':

                if (isIdent(buffer)) {

                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.DeclarationNameToken,
                        val: buffer
                    }, 'pos', {...objectProperties, value: {...position}}) as ValidationDeclarationNameToken;

                    buffer = '';
                    move(currentPosition, chr);
                    break;
                }

                buffer += chr;
                break;

            case '"':
            case "'":

                if (buffer.length > 0) {

                    yield getTokenType(buffer, position, currentPosition);
                    buffer = '';
                }

                buffer += chr;
                while (i + 1 < syntax.length) {

                    chr = syntax.charAt(++i);
                    buffer += chr;
                    move(currentPosition, chr);

                    if (chr == '\\') {

                        chr = syntax.charAt(++i);
                        buffer += chr;
                        move(currentPosition, chr);
                        continue;
                    }

                    if (chr == buffer.charAt(0)) {

                        break;
                    }
                }

                // check for type "<property>" or "<'property'>"
                if (buffer.at(1) == '<' && buffer.at(-2) == '>') {

                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.Character,
                        val: chr
                    }, 'pos', {...objectProperties, value: {...position}}) as ValidationCharacterToken;

                    position = {...currentPosition};
                    move(currentPosition, chr);

                    buffer = buffer.slice(1, -1);

                    yield* tokenize(buffer, position, currentPosition);

                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.Character,
                        val: chr
                    }, 'pos', {...objectProperties, value: {...position}}) as ValidationCharacterToken;

                    position = {...currentPosition};
                    move(currentPosition, chr);

                    buffer = '';
                    break;
                }

                yield getTokenType(buffer, position, currentPosition);
                buffer = '';
                break;

            case '<':

                buffer += chr;

                while (i + 1 < syntax.length) {

                    chr = syntax.charAt(++i);
                    buffer += chr;

                    move(currentPosition, chr);

                    if (chr == '>') {

                        break;
                    }
                }

                yield getTokenType(buffer, position, currentPosition);
                buffer = '';

                break;

            case ' ':
            case '\t':
            case '\n':
            case '\r':
            case '\f':
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

    const root: ValidationRootToken = Object.defineProperty({
        typ: ValidationTokenEnum.Root,
        chi: [] as ValidationToken[]
    }, 'pos', {...objectProperties, value: {ind: 0, lin: 1, col: 0}}) as ValidationRootToken;

    return minify(doParseSyntax(syntax, tokenize(syntax), root)) as ValidationRootToken;
}

function matchParens(syntax: string, iterator: Iterator<ValidationTokenIteratorValue> | Generator<ValidationToken>): ValidationToken[] {

    let item: ValidationTokenIteratorValue;
    let func: ValidationFunctionToken | ValidationParensToken | ValidationPseudoClassFunctionToken | null = null;
    let items: ValidationToken[] = [];

    let match: number = 0;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        switch (item.value.typ) {

            case ValidationTokenEnum.OpenParenthesis:

                if (match > 0) {

                    func!.chi.push(item.value);
                } else if (match == 0) {

                    func = items.at(-1) as ValidationFunctionToken | ValidationPseudoClassFunctionToken;

                    if (func == null) {

                        func = Object.defineProperty({

                            typ: ValidationTokenEnum.Parens,
                            val: '',
                            chi: [] as ValidationToken[]
                        }, 'pos', {...objectProperties, value: item.value.pos}) as ValidationParensToken;

                        items.push(func);
                    } else {

                        // @ts-ignore
                        func.typ = func.typ == ValidationTokenEnum.PseudoClassToken ? ValidationTokenEnum.PseudoClassFunctionToken : ValidationTokenEnum.Function;
                        func.chi = [];
                    }
                }

                match++;
                break;

            case ValidationTokenEnum.CloseParenthesis:

                match--;

                if (match > 0) {

                    func!.chi.push(item.value);
                }

                break;

            default:

                if (match > 0) {

                    func!.chi.push(item.value);

                } else {

                    items.push(item.value);
                }

                break;
        }
    }

    for (const item of items) {

        if ('chi' in item) {

            // @ts-ignore
            item.chi = matchParens(syntax, ((item as ValidationContext).chi as ValidationToken[])[Symbol.iterator]());
        }
    }

    return items;
}

function matchBrackets(syntax: string, iterator: Iterator<ValidationTokenIteratorValue>): ValidationToken[] {

    let item: ValidationTokenIteratorValue;
    let bracket: ValidationBracketToken | null = null;
    let items: ValidationToken[] = [];

    let match: number = 0;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        switch (item.value.typ) {

            case ValidationTokenEnum.OpenBracket:

                if (match > 0) {

                    bracket!.chi.push(item.value);
                } else if (match == 0) {

                    bracket = Object.defineProperty({
                        typ: ValidationTokenEnum.Bracket,
                        chi: [] as ValidationToken[]
                    }, 'pos', {...objectProperties, value: item.value.pos}) as ValidationBracketToken;

                    items.push(bracket);
                }

                match++;
                break;

            case ValidationTokenEnum.CloseBracket:

                match--;

                if (match > 0) {

                    bracket!.chi.push(item.value);
                }

                break;

            default:

                if (match > 0) {

                    bracket!.chi.push(item.value);

                } else {

                    items.push(item.value);
                }

                break;
        }
    }

    for (const item of items) {

        if ('chi' in item) {

            // @ts-ignore
            item.chi = matchBrackets(syntax, ((item as ValidationContext).chi as ValidationToken[])[Symbol.iterator]());
        }
    }

    return items;
}

function matchAtRule(syntax: string, iterator: Iterator<ValidationTokenIteratorValue>): ValidationToken[] {

    const children: ValidationToken[] = [];
    let item: ValidationTokenIteratorValue;
    let token: ValidationAtRuleDefinitionToken | null = null;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        if (item.value.typ == ValidationTokenEnum.AtRule || item.value.typ == ValidationTokenEnum.AtRuleDefinition) {

            token = Object.defineProperty({
                ...item.value,
                typ: ValidationTokenEnum.AtRuleDefinition
            }, 'pos', {...objectProperties, value: item.value.pos}) as ValidationAtRuleDefinitionToken;

            children.push(token);

            item = iterator.next() as ValidationTokenIteratorValue;

            if (item.done) {

                break;
            }

            if (item.value.typ != ValidationTokenEnum.Whitespace) {

                console.error('unexpected token', item.value);
            }

            item = iterator.next() as ValidationTokenIteratorValue;

            if (item.done) {

                break;
            }

            // if ([ValidationTokenEnum.Pipe, ValidationTokenEnum.OpenBracket].includes(item.value.typ)) {
            //
            //     children.push(item.value);
            //     continue;
            // }

            if (item.value.typ != ValidationTokenEnum.OpenCurlyBrace) {

                if (!('prelude' in token)) {

                    token.prelude = [];
                }

                token.prelude!.push(item.value);
            }

            let braces: number = 0;
            let previousItem: ValidationToken | null = item.value;

            while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

                if (item.value.typ == ValidationTokenEnum.DeclarationNameToken) {

                    iterator.next();

                    const t: ValidationDeclarationDefinitionToken = Object.defineProperty({
                        typ: ValidationTokenEnum.DeclarationDefinitionToken,
                        nam: (<ValidationDeclarationNameToken>item.value).val,
                        val: iterator.next().value as ValidationToken
                    }, 'pos', {
                        ...objectProperties,
                        value: item.value.pos
                    }) as ValidationDeclarationDefinitionToken;

                    if (braces > 0) {

                        token.chi!.push(t);
                    } else {

                        token.prelude!.push(t);
                    }

                    previousItem = t;
                    continue;
                }

                if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {
                    previousItem = item.value;
                    continue
                }

                if (item.value.typ == ValidationTokenEnum.Whitespace && previousItem?.typ == ValidationTokenEnum.OpenCurlyBrace) {

                    braces++;

                    if (braces == 1) {

                        previousItem = item.value;
                        continue;
                    }
                }

                if (previousItem?.typ == ValidationTokenEnum.Whitespace && item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {

                    braces--;

                    if (braces == 0) {

                        break;
                    }
                }

                if (braces == 0) {

                    if (!('prelude' in token)) {

                        token.prelude = [];
                    }

                    token.prelude!.push(item.value);

                } else {

                    if (!('chi' in token)) {

                        token.chi = [];
                    }

                    token.chi!.push(item.value);
                }

                previousItem = item.value;
            }

            if ('prelude' in token) {

                if (token?.prelude?.length == 1 && token.prelude[0].typ == ValidationTokenEnum.Whitespace) {

                    delete token.prelude;
                } else {

                    const t = {typ: ValidationTokenEnum.Root, chi: token.prelude} as ValidationRootToken;

                    doParseSyntax(syntax, t.chi[Symbol.iterator]() as Iterator<ValidationTokenIteratorValue> | Generator<ValidationToken>, t);
                    token.prelude = t.chi;
                    minify(token.prelude);
                }
            }

            // @ts-ignore
            if (token?.chi?.length > 0) {

                minify(doParseSyntax(syntax, (<ValidationToken[]>token.chi)[Symbol.iterator]() as Iterator<ValidationTokenIteratorValue> | Generator<ValidationToken>, token));
            }

        } else {

            children.push(item.value);
        }
    }

    return children;
}

function matchToken(syntax: string, iterator: Iterator<ValidationTokenIteratorValue>, validationToken: ValidationTokenEnum.Ampersand | ValidationTokenEnum.Pipe | ValidationTokenEnum.Column): ValidationToken[] {

    let children: ValidationToken[] = [];
    let item: ValidationTokenIteratorValue;
    let token: ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken | null = null;
    let i: number;

    if (validationToken == ValidationTokenEnum.Ampersand) {

        // @ts-ignore
        children = [...iterator] as ValidationToken[];

        let offsetL: number;
        let offsetR: number;

        for (i = 0; i < children.length; i++) {

            if (children[i].typ == ValidationTokenEnum.Ampersand) {

                offsetR = i + 1;
                offsetL = i - 1;

                while (offsetR < children.length - 1 && children[offsetR].typ == ValidationTokenEnum.Whitespace) {

                    offsetR++;
                }

                while (offsetR + 1 < children.length && skipped.includes(children[offsetR + 1].typ)) {

                    offsetR++;
                }

                while (offsetL > 0 && (children[offsetL].typ == ValidationTokenEnum.Whitespace || skipped.includes(children[offsetL].typ))) {

                    offsetL--;
                }

                token = Object.defineProperty({

                    typ: ValidationTokenEnum.AmpersandToken,
                    l: children.slice(offsetL, i),
                    r: children.slice(i + 1, offsetR + 1)
                }, 'pos', {...objectProperties, value: children[i].pos}) as ValidationAmpersandToken;

                i = offsetL;

                children.splice(offsetL, offsetR - offsetL + 1, token);
            } else if ('chi' in children[i]) {

                // @ts-ignore
                children[i].chi = matchToken(syntax, children[i].chi[Symbol.iterator](), validationToken);
            } else if ('l' in children[i]) {

                // @ts-ignore
                children[i].l = matchToken(syntax, children[i].l[Symbol.iterator](), validationToken);
                // @ts-ignore
                children[i].r = matchToken(syntax, children[i].r[Symbol.iterator](), validationToken);
            }
        }

        return children;
    }

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        if (item.value.typ == validationToken) {

            token = Object.defineProperty({

                typ: item.value.typ == ValidationTokenEnum.Pipe ? ValidationTokenEnum.PipeToken : ValidationTokenEnum.ColumnToken,
                // @ts-ignore
                l: matchToken(syntax, children.slice()[Symbol.iterator](), validationToken),
                r: matchToken(syntax, iterator, validationToken)
            }, 'pos', {
                ...objectProperties,
                value: item.value.pos
            }) as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken;

            children.length = 0;
            children.push(token);

            while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

                children.push(item.value as ValidationToken);

                if ('chi' in item.value) {
                    // @ts-ignore
                    item.value.chi = matchToken(syntax, (item.value.chi as ValidationToken[])[Symbol.iterator](), validationToken);
                } else if ('l' in item.value) {
                    // @ts-ignore
                    item.value.l = matchToken(syntax, (item.value.l as ValidationToken[])[Symbol.iterator](), validationToken);
                    // @ts-ignore
                    item.value.r = matchToken(syntax, (item.value.r as ValidationToken[])[Symbol.iterator](), validationToken);
                }
            }

            // @ts-ignore
            return children;

        } else {

            children.push(item.value as ValidationToken);

            if ('chi' in item.value) {

                // @ts-ignore
                item.value.chi = matchToken(syntax, (item.value.chi as ValidationToken[])[Symbol.iterator](), validationToken);
            } else if ('l' in item.value) {
                // @ts-ignore
                item.value.l = matchToken(syntax, (item.value.l as ValidationToken[])[Symbol.iterator](), validationToken);
                // @ts-ignore
                item.value.r = matchToken(syntax, (item.value.r as ValidationToken[])[Symbol.iterator](), validationToken);
            }
        }
    }

    return children;
}

function parseTokens(syntax: string, iterator: Iterator<ValidationTokenIteratorValue>): ValidationToken[] {

    const items: ValidationToken[] = [];
    let item: ValidationTokenIteratorValue;
    let i: number;

    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

        switch (item.value.typ) {

            case ValidationTokenEnum.Star:
            case ValidationTokenEnum.HashMark:
            case ValidationTokenEnum.AtLeastOnce:
            case ValidationTokenEnum.Exclamation:
            case ValidationTokenEnum.QuestionMark:
            case ValidationTokenEnum.OpenCurlyBrace:

                i = items.length;

                while (i--) {

                    if (items[i].typ != ValidationTokenEnum.Whitespace) {

                        break;
                    }
                }

                if (item.value.typ == ValidationTokenEnum.Exclamation) {

                    (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isRepeatableGroup = true;
                } else if (item.value.typ == ValidationTokenEnum.QuestionMark) {

                    (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isOptional = true;
                } else if (item.value.typ == ValidationTokenEnum.Star) {

                    (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isRepeatable = true;
                } else if (item.value.typ == ValidationTokenEnum.AtLeastOnce) {

                    (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).atLeastOnce = true;
                } else if (item.value.typ == ValidationTokenEnum.HashMark) {

                    (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).isList = true;
                } else if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {

                    (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence = {

                        min: 0,
                        max: 0
                    };

                    while ((item = iterator.next() as ValidationTokenIteratorValue) && !item.done) {

                        if (item.value.typ == ValidationTokenEnum.Number) {
                            // @ts-ignore
                            if ((items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence.min == 0) {

                                // @ts-ignore
                                (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence.min = +(item.value as NumberToken).val;
                            } else {

                                // @ts-ignore
                                (items[i] as ValidationBracketToken | ValidationPropertyToken | ValidationDeclarationToken).occurence.max = +(item.value as NumberToken).val;
                            }
                        }

                        if (item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {

                            break;
                        }
                    }
                }

                break;

            default:

                items.push(item.value);
                break;
        }
    }

    for (i = 0; i < items.length; i++) {

        if ('chi' in items[i]) {
            // @ts-ignore
            items[i].chi = parseTokens(syntax, (items[i].chi as ValidationToken[])[Symbol.iterator]());
        } else if ('l' in items[i]) {
            // @ts-ignore
            items[i].l = parseTokens(syntax, (items[i].l as ValidationToken[])[Symbol.iterator]());
            // @ts-ignore
            items[i].r = parseTokens(syntax, (items[i].r as ValidationToken[])[Symbol.iterator]());
        }

        if (items[i].isOptional || items[i].isRepeatable) {

            if (i <= 1) {

                let k: number = i;

                while (++k < items.length) {

                    if (items[k].typ == ValidationTokenEnum.Whitespace) {

                        continue;
                    }

                    if (items[k].typ == ValidationTokenEnum.Comma) {

                        items.splice(i, k - i + 1, Object.defineProperty({

                            typ: ValidationTokenEnum.Bracket,
                            chi: items.slice(i, k + 1)
                        }, 'pos', {...objectProperties, value: items[i].pos}) as ValidationBracketToken);
                    }

                    break;
                }

            } else {

                let k: number = i;

                while (--k > 0) {

                    if (items[k].typ == ValidationTokenEnum.Whitespace) {

                        continue;
                    }

                    if (items[k].typ == ValidationTokenEnum.Comma) {

                        items.splice(k, i - k + 1, Object.defineProperty({

                            typ: ValidationTokenEnum.Bracket,
                            chi: items.slice(k, i + 1)
                        }, 'pos', {...objectProperties, value: items[k].pos}) as ValidationBracketToken);
                        i = k - 1;
                    }

                    break;
                }
            }
        }
    }

    return items;
}

function doParseSyntax(syntax: string, iterator: Iterator<ValidationTokenIteratorValue> | Generator<ValidationToken>, context: ValidationContext): ValidationContext {

    context.chi = matchParens(syntax, iterator);
    // @ts-ignore
    context.chi = matchAtRule(syntax, context.chi[Symbol.iterator]());
    // @ts-ignore
    context.chi = matchBrackets(syntax, context.chi[Symbol.iterator]());
    // @ts-ignore
    context.chi = matchToken(syntax, context.chi[Symbol.iterator](), ValidationTokenEnum.Column) as ValidationColumnToken[];
    // @ts-ignore
    context.chi = matchToken(syntax, context.chi[Symbol.iterator](), ValidationTokenEnum.Pipe) as ValidationPipeToken[];
    // @ts-ignore
    context.chi = parseTokens(syntax, context.chi[Symbol.iterator]()) as ValidationSemicolonToken[];
    // @ts-ignore
    context.chi = matchToken(syntax, context.chi[Symbol.iterator](), ValidationTokenEnum.Ampersand) as ValidationAmpersandToken[];
    return context;
}

function getTokenType(token: string, position: Position, currentPosition: Position): ValidationToken {

    const pos: Position = {...position};

    Object.assign(position, currentPosition);

    if (token.charAt(0) == '"' || token.charAt(0) == "'") {

        return <ValidationStringToken>Object.defineProperty({
            typ: ValidationTokenEnum.StringToken,
            val: token
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == ';') {

        return <ValidationSemiColonToken>Object.defineProperty({
            typ: ValidationTokenEnum.SemiColon
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token.match(/^\s+$/)) {

        return <ValidationWhitespaceToken>Object.defineProperty({
            typ: ValidationTokenEnum.Whitespace,
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token.match(/^\d+$/)) {

        return <NumberToken>Object.defineProperty({
            typ: ValidationTokenEnum.Number,
            val: Number(token)
        }, 'pos', {...objectProperties, value: pos});
    }

    if (isPseudo(token)) {

        return <ValidationPseudoClassToken>Object.defineProperty({
            typ: ValidationTokenEnum.PseudoClassToken,
            val: token
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '!') {

        return <ExclamationToken>Object.defineProperty({
            typ: ValidationTokenEnum.Exclamation
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '#') {

        return <FinalToken>Object.defineProperty({
            typ: ValidationTokenEnum.HashMark
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '/') {

        return <SeparatorToken>Object.defineProperty({
            typ: ValidationTokenEnum.Separator
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '+') {

        return <AtLeastOneToken>Object.defineProperty({
            typ: ValidationTokenEnum.AtLeastOnce
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '|') {

        return <PipeToken>Object.defineProperty({
            typ: ValidationTokenEnum.Pipe
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '&&') {

        return <AmpersandToken>Object.defineProperty({
            typ: ValidationTokenEnum.Ampersand
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '||') {

        return <ColumnToken>Object.defineProperty({
            typ: ValidationTokenEnum.Column
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == ',') {

        return <ValidationCommaToken>Object.defineProperty({
            typ: ValidationTokenEnum.Comma
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '[') {

        return <OpenBracketToken>Object.defineProperty({
            typ: ValidationTokenEnum.OpenBracket
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == ']') {

        return <CloseBracketToken>Object.defineProperty({
            typ: ValidationTokenEnum.CloseBracket
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '(') {

        return <OpenParenthesisToken>Object.defineProperty({
            typ: ValidationTokenEnum.OpenParenthesis
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == ')') {

        return <CloseParenthesisToken>Object.defineProperty({
            typ: ValidationTokenEnum.CloseParenthesis
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '{') {

        return <OpenCurlyBraceToken>Object.defineProperty({
            typ: ValidationTokenEnum.OpenCurlyBrace
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '}') {

        return <CloseCurlyBraceToken>Object.defineProperty({
            typ: ValidationTokenEnum.CloseCurlyBrace
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '*') {

        return <StarToken>Object.defineProperty({
            typ: ValidationTokenEnum.Star
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token == '?') {

        return <OptionalToken>Object.defineProperty({
            typ: ValidationTokenEnum.QuestionMark
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token.startsWith("<'")) {

        return <ValidationDeclarationToken>Object.defineProperty({
            typ: ValidationTokenEnum.DeclarationType,
            val: token.slice(2, -2)
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token.startsWith('<')) {

        // <number [1,1000]>
        // <length [0,∞]>
        let match = token.match(/<([a-z0-9-]+)(\s+\[([0-9]+),(([0-9]+)|∞)\])?>/);

        if (match == null) {

            let match = token.match(/<([a-zA-Z0-9-]+)\(\)>/);

            if (match != null) {

                return <ValidationFunctionDefinitionToken>Object.defineProperty({
                    typ: ValidationTokenEnum.ValidationFunctionDefinition,
                    val: match[1]
                }, 'pos', {...objectProperties, value: pos});
            }

            throw new Error('invalid token at position: ' + position.lin + ':' + position.col + ' ' + token);
        }

        if (match[2] != null) {

            return <ValidationPropertyToken>Object.defineProperty({
                typ: ValidationTokenEnum.PropertyType,
                val: match[1],
                range: [+match[3], match[4] == '∞' ? Infinity : +match[4]]
            }, 'pos', {...objectProperties, value: pos});
        }

        return <ValidationPropertyToken>Object.defineProperty({
            typ: ValidationTokenEnum.PropertyType,
            val: token.slice(1, -1)
        }, 'pos', {...objectProperties, value: pos});
    }

    if (token.startsWith('@') && isIdent(token.slice(1))) {

        return <ValidationAtRuleToken>Object.defineProperty({
            typ: ValidationTokenEnum.AtRule,
            val: token.slice(1)
        }, 'pos', {...objectProperties, value: pos});
    }

    return <ValidationKeywordToken>Object.defineProperty({
        typ: ValidationTokenEnum.Keyword,
        val: token
    }, 'pos', {...objectProperties, value: pos});
}

function move(position: Position, chr: string): Position {

    for (const c of chr) {

        position.col++;
        position.ind += c.length;
    }

    return position;
}

export function renderSyntax(token: ValidationToken): string {

    let glue: string;
    switch (token.typ) {

        case ValidationTokenEnum.Root:

            return (token as ValidationRootToken).chi.reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr), '');

        case ValidationTokenEnum.Whitespace:

            return ' ';

        case ValidationTokenEnum.ValidationFunctionDefinition:

            return '<' + (token as ValidationFunctionDefinitionToken).val + '()>';

        case ValidationTokenEnum.HashMark:

            return '#';

        case ValidationTokenEnum.Pipe:

            return '|';

        case ValidationTokenEnum.Column:

            return '||';

        case ValidationTokenEnum.PipeToken:
        case ValidationTokenEnum.ColumnToken:
        case ValidationTokenEnum.AmpersandToken:

            glue = token.typ == ValidationTokenEnum.PipeToken ? '|' : (token.typ == ValidationTokenEnum.ColumnToken ? '||' : '&&');

            return (token as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).l.reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr), '') +
                glue +
                (token as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).r.reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr), '');

        case ValidationTokenEnum.Function:
        case ValidationTokenEnum.PseudoClassFunctionToken:
        case ValidationTokenEnum.Parens:

            return (token as ValidationFunctionToken).val + '(' + (token as ValidationFunctionToken).chi.reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr), '') + ')' + renderAttributes(token);

        case ValidationTokenEnum.Comma:

            return ',';

        case ValidationTokenEnum.Keyword:

            return (token as ValidationKeywordToken).val + renderAttributes(token);

        case ValidationTokenEnum.OpenBracket:

            return '[';

        case ValidationTokenEnum.Ampersand:

            return '&&';

        case ValidationTokenEnum.QuestionMark:

            return '?';

        case ValidationTokenEnum.Separator:

            return '/';

        case ValidationTokenEnum.Bracket:

            return '[' + (token as ValidationBracketToken).chi.reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr), '') + ']' + renderAttributes(token);

        case ValidationTokenEnum.PropertyType:

            return '<' + (token as ValidationPropertyToken).val + '>' + renderAttributes(token);

        case ValidationTokenEnum.DeclarationType:

            return "<'" + (token as ValidationPropertyToken).val + "'>" + renderAttributes(token);

        case ValidationTokenEnum.Number:
        case ValidationTokenEnum.PseudoClassToken:
        case ValidationTokenEnum.StringToken:

            return (token as NumberToken).val + '';

        case ValidationTokenEnum.SemiColon:

            return ';';

        case ValidationTokenEnum.AtRuleDefinition:

            return '@' + (token as ValidationAtRuleDefinitionToken).val + ((token as ValidationAtRuleDefinitionToken).prelude == null ? '' : ' ' + ((token as ValidationAtRuleDefinitionToken).prelude as ValidationToken[]).reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr), ''));

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

        // @ts-ignore
        while (ast.length > 0 && ast[0].typ == ValidationTokenEnum.Whitespace) {

            // @ts-ignore
            ast.shift();
        }


        while (ast.length > 0 && (ast.at(-1) as ValidationToken).typ == ValidationTokenEnum.Whitespace) {

            ast.pop();
        }

        for (let i = 0; i < ast.length; i++) {

            // if ([ValidationTokenEnum.ColumnToken, ValidationTokenEnum.PipeToken, ValidationTokenEnum.AmpersandToken].includes(ast[i].typ)) {

            // for (const j of (ast[i] as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).l) {

            minify(ast[i]);
            // }

            // for (const j of (ast[i] as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).r) {
            //
            //     minify(j);
            // }

            // } else

            //     if ('chi' in ast[i]) {
            //
            //     minify((ast[i] as ValidationFunctionToken | ValidationBracketToken).chi as ValidationToken[]);
            //
            // } else

            if (ast[i].typ == ValidationTokenEnum.Whitespace && ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {

                ast.splice(i + 1, 1);
                i--;
                continue;
            }

            if (ast[i].typ == ValidationTokenEnum.Separator) {

                if (ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {

                    ast.splice(i + 1, 1);
                }

                if (ast[i - 1]?.typ == ValidationTokenEnum.Whitespace) {

                    ast.splice(--i, 1);
                }
            }
        }

        return ast;

    }
    // else {

    // if ([ValidationTokenEnum.ColumnToken, ValidationTokenEnum.PipeToken, ValidationTokenEnum.AmpersandToken].includes(ast.typ)) {

    // for (const j of (ast as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).l) {

    if ('l' in ast) {

        minify((ast as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).l);
    }
    // }

    // for (const j of (ast as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).r) {

    if ('r' in ast) {

        minify((ast as ValidationPipeToken | ValidationColumnToken | ValidationAmpersandToken).r);
    }

    if ('chi' in ast) {

        minify((ast as ValidationFunctionToken | ValidationBracketToken).chi as ValidationToken[]);
    }

    if ('prelude' in ast) {

        minify((ast as ValidationAtRuleDefinitionToken).prelude as ValidationToken[]);
    }

    return ast;
}

export function cleanup(ast: { [key: string]: any }) {

    return ast;
}

interface ParsedSyntax {
    syntax: string
    ast?: ValidationToken[]
}

type ParsedSyntaxes = Record<string, ParsedSyntax>

export async function parseDeclarationsSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/properties.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key == '--*') {

            continue;
        }

        console.error(' >> parseDeclarationsSyntax >> ' + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntax).chi
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseFunctionsSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/functions.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
        // mdn_url: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key == '--*') {

            continue;
        }

        console.error(' >> parseFunctionsSyntax >> ' + key);

        json[key.slice(0, -2)] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntax).chi,
            // mdn_url: values.mdn_url
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseSelectorsSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/selectors.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
        // mdn_url: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        if (key.match(/[A-Z]/)) {

            continue;
        }

        console.error(' >> parseSelectorsSyntax >> ' + key);

        json[key] = {
            syntax: values.syntax.startsWith('/*') ? key : values.syntax,
            // ast: parseSyntax(values.syntax.startsWith('/*') ? key : values.syntax).chi,
            // mdn_url: values.mdn_url
        };
    }

    for (const k of [':host', ':autofill']) {


        if (!(k in json)) {

            json[k] = {
                syntax: k,
                // ast: parseSyntax(k).chi
            };
        }
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseAtRulesSyntax(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/at-rules.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
        // mdn_url: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        console.error(' >> parseAtRulesSyntax >> ' + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntax).chi,
            // mdn_url: values.mdn_url
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

export async function parseAllSyntaxes(): Promise<ParsedSyntaxes> {

    const syntaxes = await fetch('https://raw.githubusercontent.com/mdn/data/main/css/syntaxes.json', fetchInit).then(r => r.json()) as Record<string, {
        syntax: string;
    }>;

    const json = {} as ParsedSyntaxes;

    for (const [key, values] of Object.entries(syntaxes)) {

        console.error(' >> parseAllSyntaxes >> ' + key);

        json[key] = {
            syntax: values.syntax,
            // ast: parseSyntax(values.syntax).chi
        };
    }

    return cleanup(json) as ParsedSyntaxes;
}

