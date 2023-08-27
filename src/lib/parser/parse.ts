import {
    isAtKeyword,
    isColor,
    isDimension,
    isFunction,
    isHash,
    isHexColor,
    isIdent,
    isIdentStart,
    isNumber,
    isPercentage,
    isPseudo,
    parseDimension
} from "./utils";
import {renderToken} from "../renderer";
import {COLORS_NAMES} from "../renderer/utils";
import {combinators, EnumToken, minify, NodeType} from "../ast";
import {tokenize} from "./tokenize";
import {
    AstComment,
    AstNode,
    AstRuleList,
    AstRuleStyleSheet,

    ErrorDescription,
    ParseResult,
    ParserOptions,
    Position,
    Token,
    TokenizeResult,
    Location,
    AstDeclaration,
    AstRule,
    LiteralToken,
    AstAtRule,
    UrlToken,
    AtRuleToken,
    SemiColonToken,
    BlockEndToken,
    AttrStartToken,
    WhitespaceToken,
    BlockStartToken,
    HashToken,
    UnclosedStringToken,
    IdentToken,
    ColorToken,
    ColonToken,
    ParensEndToken,
    ParensStartToken,
    DelimToken,
    CommaToken,
    LessThanToken,
    GreaterThanToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    FunctionURLToken,
    FunctionToken,
    NumberToken, AttrEndToken, PercentageToken, ParseTokenOptions, VariableScopeInfo
} from "../../@types";

export const urlTokenMatcher: RegExp = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;

const trimWhiteSpace: EnumToken[] = [EnumToken.GtTokenType, EnumToken.GteTokenType, EnumToken.LtTokenType, EnumToken.LteTokenType];
const funcLike: EnumToken[] = [EnumToken.StartParensTokenType, EnumToken.FunctionTokenType, EnumToken.UrlFunctionTokenType, EnumToken.PseudoClassFuncTokenType];
const BadTokensTypes = [EnumToken.BadCommentTokenType,
    EnumToken.BadCdoTokenType,
    EnumToken.BadUrlTokenType,
    EnumToken.BadStringTokenType];

/**
 *
 * @param iterator
 * @param opt
 */
export async function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    const startTime: number = performance.now();
    const errors: ErrorDescription[] = [];
    const options: ParserOptions = {
        src: '',
        sourcemap: false,
        minify: true,
        nestingRules: false,
        resolveImport: false,
        resolveUrls: false,
        removeCharset: false,
        removeEmpty: true,
        ...opt
    };

    if (options.resolveImport) {
        options.resolveUrls = true;
    }

    const src: string = <string>options.src;
    const stack: Array<AstNode | AstComment> = [];
    const ast: AstRuleStyleSheet = {
        typ: NodeType.StyleSheetNodeType,
        chi: []
    };

    let tokens: TokenizeResult[] = [];
    let map: Map<Token, Position> = new Map<Token, Position>;
    let bytesIn: number = 0;
    let context: AstRuleList = ast;

    if (options.sourcemap) {
        ast.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1
            },
            src: ''
        };
    }

    async function parseNode(results: TokenizeResult[]) {

        let tokens: Token[] = results.map(mapToken);

        let i: number;
        let loc: Location;

        for (i = 0; i < tokens.length; i++) {

            if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {

                const position: Position = <Position>map.get(tokens[i]);

                if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != NodeType.StyleSheetNodeType) {

                    errors.push({
                        action: 'drop',
                        message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                        location: {src, ...position}
                    });
                    continue;
                }

                loc = <Location>{
                    sta: position,
                    src
                };

                // @ts-ignore
                context.chi.push(tokens[i]);

                if (options.sourcemap) {

                    tokens[i].loc = loc
                }

            } else if (tokens[i].typ != EnumToken.WhitespaceTokenType) {
                break;
            }
        }

        tokens = tokens.slice(i);
        if (tokens.length == 0) {
            return null;
        }

        let delim: Token = <Token>tokens.at(-1);

        if (delim.typ == EnumToken.SemiColonTokenType || delim.typ == EnumToken.BlockStartTokenType || delim.typ == EnumToken.BlockEndTokenType) {
            tokens.pop();
        } else {
            delim = <SemiColonToken>{typ: EnumToken.SemiColonTokenType};
        }

        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType, EnumToken.BadStringTokenType, EnumToken.BadCommentTokenType].includes(tokens.at(-1)?.typ)) {
            tokens.pop();
        }

        if (tokens.length == 0) {
            return null;
        }

        if (tokens[0]?.typ == EnumToken.AtRuleTokenType) {

            const atRule: AtRuleToken = <AtRuleToken>tokens.shift();
            const position: Position = <Position>map.get(atRule);

            if (atRule.val == 'charset') {

                if (position.ind > 0) {

                    errors.push({action: 'drop', message: 'parse: invalid @charset', location: {src, ...position}});
                    return null;
                }

                if (options.removeCharset) {

                    return null;
                }
            }

            // @ts-ignore
            while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
                tokens.shift();
            }

            if (atRule.val == 'import') {

                // only @charset and @layer are accepted before @import
                if (context.chi.length > 0) {
                    let i = context.chi.length;
                    while (i--) {
                        const type = context.chi[i].typ;
                        if (type == NodeType.CommentNodeType) {
                            continue;
                        }
                        if (type != NodeType.AtRuleNodeType) {
                            errors.push({action: 'drop', message: 'invalid @import', location: {src, ...position}});
                            return null;
                        }

                        const name = (<AstAtRule>context.chi[i]).nam;

                        if (name != 'charset' && name != 'import' && name != 'layer') {
                            errors.push({action: 'drop', message: 'invalid @import', location: {src, ...position}});
                            return null;
                        }

                        break;
                    }
                }

                // @ts-ignore
                if (tokens[0]?.typ != EnumToken.StringTokenType && tokens[0]?.typ != EnumToken.UrlFunctionTokenType) {

                    errors.push({action: 'drop', message: 'parse: invalid @import', location: {src, ...position}});
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1]?.typ != EnumToken.UrlTokenTokenType && tokens[1]?.typ != EnumToken.StringTokenType) {

                    errors.push({action: 'drop', message: 'parse: invalid @import', location: {src, ...position}});
                    return null;
                }
            }

            if (atRule.val == 'import') {

                // @ts-ignore
                if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1].typ == EnumToken.UrlTokenTokenType) {
                    tokens.shift();
                    // @ts-ignore
                    tokens[0].typ = EnumToken.StringTokenType;
                    // @ts-ignore
                    tokens[0].val = `"${tokens[0].val}"`;
                }
                // @ts-ignore
                if (tokens[0].typ == EnumToken.StringTokenType) {

                    if (options.resolveImport) {

                        const url: string = (<UrlToken>tokens[0]).val.slice(1, -1);

                        try {

                            // @ts-ignore
                            const root: ParseResult = await options.load(url, <string>options.src).then((src: string) => {

                                return parse(src, Object.assign({}, options, {
                                    minify: false,
                                    // @ts-ignore
                                    src: options.resolve(url, options.src).absolute
                                }))
                            });

                            bytesIn += root.stats.bytesIn;

                            if (root.ast.chi.length > 0) {

                                // @todo - filter charset, layer and scope
                                context.chi.push(...root.ast.chi);
                            }

                            if (root.errors.length > 0) {
                                errors.push(...root.errors);
                            }

                            return null;
                        } catch (error) {

                            // @ts-ignore
                            errors.push({action: 'ignore', message: 'parse: ' + error.message, error});
                        }
                    }
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack

            const raw = parseTokens(tokens, {minify: options.minify}).reduce((acc: string[], curr: Token) => {

                acc.push(renderToken(curr, {removeComments: true}));

                return acc
            }, []);

            const node: AstAtRule = {
                typ: NodeType.AtRuleNodeType,
                nam: renderToken(atRule, {removeComments: true}),
                val: raw.join('')
            };

            Object.defineProperty(node, 'raw', {enumerable: false, configurable: true, writable: true, value: raw});

            if (delim.typ == EnumToken.BlockStartTokenType) {

                node.chi = [];
            }

            loc = <Location>{
                sta: position,
                src
            };

            if (options.sourcemap) {
                node.loc = loc;
            }

            // @ts-ignore
            context.chi.push(node);
            return delim.typ == EnumToken.BlockStartTokenType ? node : null;
        } else {
            // rule
            if (delim.typ == EnumToken.BlockStartTokenType) {

                const position: Position = <Position>map.get(tokens[0]);

                const uniq = new Map<string, string[]>;
                parseTokens(tokens, {minify: true}).reduce((acc: string[][], curr: Token, index: number, array: Token[]) => {

                    if (curr.typ == EnumToken.WhitespaceTokenType) {

                        if (
                            trimWhiteSpace.includes(array[index - 1]?.typ) ||
                            trimWhiteSpace.includes(array[index + 1]?.typ) ||
                            combinators.includes((<LiteralToken>array[index - 1])?.val) ||
                            combinators.includes((<LiteralToken>array[index + 1])?.val)) {

                            return acc;
                        }
                    }

                    let t = renderToken(curr, {minify: false});
                    if (t == ',') {
                        acc.push([]);
                    } else {
                        acc[acc.length - 1].push(t);
                    }
                    return acc;
                }, [[]]).reduce((acc: Map<string, string[]>, curr: string[]) => {

                    acc.set(curr.join(''), curr);
                    return acc;
                }, uniq);

                const node: AstRule = {
                    typ: NodeType.RuleNodeType,
                    // @ts-ignore
                    sel: [...uniq.keys()].join(','),
                    chi: []
                };

                let raw = [...uniq.values()];

                Object.defineProperty(node, 'raw', {enumerable: false, configurable: true, writable: true, value: raw});

                loc = <Location>{
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

                    if (tokens[i].typ == EnumToken.CommentTokenType) {

                        continue;
                    }

                    if (tokens[i].typ == EnumToken.ColonTokenType) {

                        name = tokens.slice(0, i);
                        value = parseTokens(tokens.slice(i + 1), {
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
                        if (name[i].typ != EnumToken.WhitespaceTokenType && name[i].typ != EnumToken.CommentTokenType) {

                            errors.push(<ErrorDescription>{
                                action: 'drop',
                                message: 'parse: invalid declaration',
                                location: {src, ...position}
                            });

                            return null;
                        }
                    }
                }

                if (value == null || value.length == 0) {

                    errors.push(<ErrorDescription>{
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: {src, ...position}
                    });
                    return null;
                }

                const node: AstDeclaration = {
                    typ: NodeType.DeclarationNodeType,
                    // @ts-ignore
                    nam: renderToken(name.shift(), {removeComments: true}),
                    // @ts-ignore
                    val: value
                }

                while (node.val[0]?.typ == EnumToken.WhitespaceTokenType) {
                    node.val.shift();
                }

                if (node.val.length == 0) {

                    errors.push(<ErrorDescription>{
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: {src, ...position}
                    });

                    return null;
                }

                // @ts-ignore
                context.chi.push(node);
                return null;
            }
        }
    }

    function mapToken(token: TokenizeResult): Token {

        const node = getTokenType(token.token, token.hint);

        map.set(node, token.position);
        return node;
    }

    const iter = tokenize(iterator);
    let item: TokenizeResult;

    while (item = iter.next().value) {

        bytesIn = item.bytesIn;

        // parse error
        if (item.hint != null && BadTokensTypes.includes(item.hint)) {

            // bad token
            continue;
        }

        tokens.push(item);

        if (item.token == ';' || item.token == '{') {

            let node = await parseNode(tokens);

            if (node != null) {

                stack.push(node);
                // @ts-ignore
                context = node;
            } else if (item.token == '{') {
                // node == null
                // consume and throw away until the closing '}' or EOF

                let inBlock = 1;

                do {

                    item = iter.next().value;

                    if (item == null) {

                        break;
                    }

                    if (item.token == '{') {

                        inBlock++;
                    } else if (item.token == '}') {

                        inBlock--;
                    }
                }

                while (inBlock != 0);
            }

            tokens = [];
            map = new Map;
        } else if (item.token == '}') {

            await parseNode(tokens);
            const previousNode = stack.pop();

            // @ts-ignore
            context = stack[stack.length - 1] || ast;
            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }

            tokens = [];
            map = new Map;
        }
    }

    if (tokens.length > 0) {

        await parseNode(tokens);
    }

    while (stack.length > 0 && context != ast) {

        const previousNode = stack.pop();

        // @ts-ignore
        context = stack[stack.length - 1] || ast;
        // @ts-ignore
        if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
            context.chi.pop();
            continue;
        }

        break;
    }


    const endParseTime: number = performance.now();

    if (options.minify) {

        if (ast.chi.length > 0) {

            const info: Map<string, VariableScopeInfo> = new Map;

            minify(ast, options, true, errors, false, info);

            if (options.inlineCssVariable) {

                let i: number;

                for (const [key, value] of info) {

                    for (const parent of [...value.parent]) {

                        // @ts-ignore
                        for (i = 0; i < (<Token[]> parent.chi).length; i++) {

                            // @ts-ignore
                            if (NodeType.CommentNodeType == parent.chi[i].typ) {

                                continue;
                            }

                            // @ts-ignore
                            if (NodeType.DeclarationNodeType != parent.chi[i].typ) {

                                break;
                            }

                            // @ts-ignore
                            if ((<AstDeclaration> parent.chi[i]).nam == key) {

                                // @ts-ignore
                                parent.chi.splice(i, 1);
                                i--;
                            }
                        }

                        // @ts-ignore
                        if ('parent' in parent && parent.chi.length == 0) {

                            // @ts-ignore
                            for (i = 0; i < parent.parent.chi.length; i++) {

                                // @ts-ignore
                                if (parent.parent.chi[i] == parent) {

                                    // @ts-ignore
                                    parent.parent.chi.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const endTime: number = performance.now();

    return {
        ast,
        errors,
        stats: {
            bytesIn,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    }
}

export function parseString(src: string, options = {location: false}): Token[] {

    return parseTokens([...tokenize(src)].map(t => {

        const token = getTokenType(t.token, t.hint);

        if (options.location) {

            Object.assign(token, {loc: t.position});
        }

        return token;
    }));
}

function getTokenType(val: string, hint?: EnumToken): Token {

    if (val === '' && hint == null) {
        throw new Error('empty string?');
    }

    if (hint != null) {

        return <Token>([
            EnumToken.WhitespaceTokenType, EnumToken.SemiColonTokenType, EnumToken.ColonTokenType, EnumToken.BlockStartTokenType,
            EnumToken.BlockStartTokenType, EnumToken.AttrStartTokenType, EnumToken.AttrEndTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType,
            EnumToken.CommaTokenType, EnumToken.GtTokenType, EnumToken.LtTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.EOFTokenType
        ].includes(hint) ? {typ: hint} : {typ: hint, val});
    }

    if (val == ' ') {

        return <WhitespaceToken>{typ: EnumToken.WhitespaceTokenType};
    }

    if (val == ';') {

        return <SemiColonToken>{typ: EnumToken.SemiColonTokenType};
    }

    if (val == '{') {

        return <BlockStartToken>{typ: EnumToken.BlockStartTokenType};
    }

    if (val == '}') {

        return <BlockEndToken>{typ: EnumToken.BlockEndTokenType};
    }

    if (val == '[') {

        return <AttrStartToken>{typ: EnumToken.AttrStartTokenType};
    }

    if (val == ']') {
        return <AttrEndToken>{typ: EnumToken.AttrEndTokenType};
    }

    if (val == ':') {

        return <ColonToken>{typ: EnumToken.ColonTokenType};
    }
    if (val == ')') {

        return <ParensEndToken>{typ: EnumToken.EndParensTokenType};
    }
    if (val == '(') {

        return <ParensStartToken>{typ: EnumToken.StartParensTokenType};
    }
    if (val == '=') {

        return <DelimToken>{typ: EnumToken.DelimTokenType, val};
    }
    if (val == ';') {

        return <SemiColonToken>{typ: EnumToken.SemiColonTokenType};
    }
    if (val == ',') {

        return <CommaToken>{typ: EnumToken.CommaTokenType};
    }
    if (val == '<') {

        return <LessThanToken>{typ: EnumToken.LtTokenType};
    }
    if (val == '>') {

        return <GreaterThanToken>{typ: EnumToken.GtTokenType};
    }

    if (isPseudo(val)) {

        return val.endsWith('(') ? <PseudoClassFunctionToken>{
                typ: EnumToken.PseudoClassFuncTokenType,
                val: val.slice(0, -1),
                chi: <Token[]>[]
            }
            : <PseudoClassToken>{
                typ: EnumToken.PseudoClassTokenType,
                val
            };
    }

    if (isAtKeyword(val)) {
        return <AtRuleToken>{
            typ: EnumToken.AtRuleTokenType,
            val: val.slice(1)
        };
    }

    if (isFunction(val)) {
        val = val.slice(0, -1);
        return <FunctionURLToken | FunctionToken>{
            typ: val == 'url' ? EnumToken.UrlFunctionTokenType : EnumToken.FunctionTokenType,
            val,
            chi: <Token[]>[]
        };
    }

    if (isNumber(val)) {
        return <NumberToken>{
            typ: EnumToken.NumberTokenType,
            val
        };
    }

    if (isDimension(val)) {

        return parseDimension(val);
    }

    if (isPercentage(val)) {
        return <PercentageToken>{
            typ: EnumToken.PercentageTokenType,
            val: val.slice(0, -1)
        };
    }

    const v = val.toLowerCase();
    if (v == 'currentcolor' || val == 'transparent' || v in COLORS_NAMES) {
        return <ColorToken>{
            typ: EnumToken.ColorTokenType,
            val,
            kin: 'lit'
        };
    }

    if (isIdent(val)) {

        return <IdentToken>{
            typ: EnumToken.IdenTokenType,
            val
        };
    }

    if (val.charAt(0) == '#' && isHexColor(val)) {

        return <ColorToken>{
            typ: EnumToken.ColorTokenType,
            val,
            kin: 'hex'
        };
    }

    if (val.charAt(0) == '#' && isHash(val)) {
        return <HashToken>{
            typ: EnumToken.HashTokenType,
            val
        };
    }

    if ('"\''.includes(val.charAt(0))) {
        return <UnclosedStringToken>{
            typ: EnumToken.UnclosedStringTokenType,
            val
        };
    }
    return <LiteralToken>{
        typ: EnumToken.LiteralTokenType,
        val
    };
}

function parseTokens(tokens: Token[], options: ParseTokenOptions = {}) {

    for (let i = 0; i < tokens.length; i++) {

        const t = tokens[i];

        if (t.typ == EnumToken.WhitespaceTokenType && ((i == 0 ||
                i + 1 == tokens.length ||
                [EnumToken.CommaTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType].includes(tokens[i + 1].typ)) ||
            (i > 0 &&
                // tokens[i + 1]?.typ != Literal ||
                // funcLike.includes(tokens[i - 1].typ) &&
                // !['var', 'calc'].includes((<FunctionToken>tokens[i - 1]).val)))) &&
                trimWhiteSpace.includes(tokens[i - 1].typ)))) {

            tokens.splice(i--, 1);
            continue;
        }

        if (t.typ == EnumToken.ColonTokenType) {

            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == EnumToken.FunctionTokenType) {

                    (<PseudoClassFunctionToken>tokens[i + 1]).val = ':' + (<PseudoClassFunctionToken>tokens[i + 1]).val;
                    tokens[i + 1].typ = EnumToken.PseudoClassFuncTokenType;
                } else if (typ == EnumToken.IdenTokenType) {

                    (<PseudoClassToken>tokens[i + 1]).val = ':' + (<PseudoClassToken>tokens[i + 1]).val;
                    tokens[i + 1].typ = EnumToken.PseudoClassTokenType;
                }

                if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {

                    tokens.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }

        if (t.typ == EnumToken.AttrStartTokenType) {

            let k: number = i;
            let inAttr: number = 1;

            while (++k < tokens.length) {
                if (tokens[k].typ == EnumToken.AttrEndTokenType) {
                    inAttr--;
                } else if (tokens[k].typ == EnumToken.AttrStartTokenType) {
                    inAttr++;
                }
                if (inAttr == 0) {
                    break;
                }
            }

            Object.assign(t, {typ: EnumToken.AttrTokenType, chi: tokens.splice(i + 1, k - i)});

            // @ts-ignore
            if (t.chi.at(-1).typ == EnumToken.AttrEndTokenType) {
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
                    if (val.typ == EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
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
                if (tokens[k].typ == EnumToken.ColonTokenType) {
                    const typ = tokens[k + 1]?.typ;
                    if (typ != null) {
                        if (typ == EnumToken.IdenTokenType) {

                            tokens[k + 1].typ = EnumToken.PseudoClassTokenType;
                            (<PseudoClassToken>tokens[k + 1]).val = ':' + (<PseudoClassToken>tokens[k + 1]).val;
                        } else if (typ == EnumToken.FunctionTokenType) {

                            (<PseudoClassFunctionToken>tokens[k + 1]).typ = EnumToken.PseudoClassFuncTokenType;
                            (<PseudoClassFunctionToken>tokens[k + 1]).val = ':' + (<PseudoClassFunctionToken>tokens[k + 1]).val;
                        }
                        if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {

                            tokens.splice(k, 1);
                            k--;
                            continue;
                        }
                    }
                }

                if (funcLike.includes(tokens[k].typ)) {
                    parens++;
                } else if (tokens[k].typ == EnumToken.EndParensTokenType) {
                    parens--;
                }

                if (parens == 0) {
                    break;
                }
            }

            // @ts-ignore
            t.chi = tokens.splice(i + 1, k - i);
            // @ts-ignore
            if (t.chi.at(-1)?.typ == EnumToken.EndParensTokenType) {
                // @ts-ignore
                t.chi.pop();
            }

            // @ts-ignore
            if (options.parseColor && t.typ == EnumToken.FunctionTokenType && isColor(t)) {

                // if (isColor) {
                // @ts-ignore
                t.typ = EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = t.val;
                // @ts-ignore
                let m = t.chi.length;

                while (m-- > 0) {
                    // @ts-ignore
                    if ([EnumToken.LiteralTokenType].concat(trimWhiteSpace).includes(t.chi[m].typ)) {
                        // @ts-ignore
                        if (t.chi[m + 1]?.typ == EnumToken.WhitespaceTokenType) {

                            // @ts-ignore
                            t.chi.splice(m + 1, 1);
                        }
                        // @ts-ignore
                        if (t.chi[m - 1]?.typ == EnumToken.WhitespaceTokenType) {

                            // @ts-ignore
                            t.chi.splice(m - 1, 1);
                            m--;
                        }
                    }
                }

                continue;
            }

            if (t.typ == EnumToken.UrlFunctionTokenType) {
                // @ts-ignore
                if (t.chi[0]?.typ == EnumToken.StringTokenType) {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);
                    // @ts-ignore
                    if (t.chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        t.chi[0].typ = EnumToken.UrlTokenTokenType;
                        // @ts-ignore
                        t.chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                    }
                }

                if (t.chi[0]?.typ == EnumToken.UrlTokenTokenType) {
                    if (options.src !== '' && options.resolveUrls) {
                        // @ts-ignore
                        t.chi[0].val = options.resolve(t.chi[0].val, options.src, options.cwd).relative;
                    }
                }
            }

            // @ts-ignore
            if (t.chi.length > 0) {
                // @ts-ignore
                parseTokens(t.chi, options);
                if (t.typ == EnumToken.PseudoClassFuncTokenType && t.val == ':is' && options.minify) {
                    //
                    const count = t.chi.filter(t => t.typ != EnumToken.CommentTokenType).length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == EnumToken.CommaTokenType && (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1))) {

                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }

            continue;
        }

        if (options.parseColor) {

            if (t.typ == EnumToken.IdenTokenType) {
                // named color
                const value = t.val.toLowerCase();

                if (value in COLORS_NAMES) {
                    Object.assign(t, {
                        typ: EnumToken.ColorTokenType,
                        val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                        kin: 'hex'
                    });
                }

                continue;
            }

            if (t.typ == EnumToken.HashTokenType && isHexColor(t.val)) {
                // hex color
                // @ts-ignore
                t.typ = EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = 'hex';
            }
        }
    }

    return tokens;
}