import {
    isAtKeyword,
    isColor,
    isDimension, isFlex,
    isFunction,
    isHash,
    isHexColor,
    isIdent,
    isIdentStart,
    isNumber,
    isPercentage,
    isPseudo, parseDeclaration,
    parseDimension
} from "./utils";
import {renderToken} from "../renderer";
import {COLORS_NAMES} from "../renderer/color";
import {combinators, definedPropertySettings, EnumToken, expand, funcLike, minify, walk, walkValues} from "../ast";
import {tokenize} from "./tokenize";
import {
    TimelineFunctionToken,
    TimingFunctionToken,
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AtRuleToken,
    AtRuleVisitorHandler,
    AttrEndToken,
    AttrStartToken,
    BlockEndToken,
    BlockStartToken,
    ColonToken,
    ColorToken,
    CommaToken,
    ContainMatchToken,
    DashMatchToken,
    DeclarationVisitorHandler,
    DelimToken,
    EndMatchToken,
    ErrorDescription,
    FunctionImageToken,
    FunctionToken,
    FunctionURLToken,
    GreaterThanToken,
    HashToken,
    IdentToken,
    IncludeMatchToken,
    LessThanToken,
    LiteralToken,
    Location,
    MatchExpressionToken,
    NameSpaceAttributeToken,
    NumberToken,
    ParensEndToken,
    ParensStartToken,
    ParensToken,
    ParseResult,
    ParserOptions,
    ParseTokenOptions,
    PercentageToken,
    Position,
    PseudoClassFunctionToken,
    PseudoClassToken,
    SemiColonToken,
    StartMatchToken,
    Token,
    TokenizeResult,
    UnclosedStringToken,
    UrlToken,
    WhitespaceToken, FlexToken
} from "../../@types";

export const urlTokenMatcher: RegExp = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const trimWhiteSpace: EnumToken[] = [EnumToken.CommentTokenType, EnumToken.GtTokenType, EnumToken.GteTokenType, EnumToken.LtTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType];
const BadTokensTypes: EnumToken[] = [
    EnumToken.BadCommentTokenType,
    EnumToken.BadCdoTokenType,
    EnumToken.BadUrlTokenType,
    EnumToken.BadStringTokenType
];

const enumTokenHints: Set<EnumToken> = new Set([
    EnumToken.WhitespaceTokenType, EnumToken.SemiColonTokenType, EnumToken.ColonTokenType, EnumToken.BlockStartTokenType,
    EnumToken.BlockStartTokenType, EnumToken.AttrStartTokenType, EnumToken.AttrEndTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType,
    EnumToken.CommaTokenType, EnumToken.GtTokenType, EnumToken.LtTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.CommaTokenType,
    EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DashMatchTokenType, EnumToken.ContainMatchTokenType,
    EnumToken.EOFTokenType
]);

const webkitPseudoAliasMap: Record<string, string> = {
    '-webkit-autofill': 'autofill'
}

function reject(reason?: any) {

    throw new Error(reason ?? 'Parsing aborted');
}

export async function doParse(iterator: string, options: ParserOptions = {}): Promise<ParseResult> {

    // return new Promise(async (resolve, reject) => {

        if (options.signal != null) {

            options.signal.addEventListener('abort', reject);
        }

        options = {
            src: '',
            sourcemap: false,
            minify: true,
            parseColor: true,
            nestingRules: false,
            resolveImport: false,
            resolveUrls: false,
            removeCharset: false,
            removeEmpty: true,
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            inlineCssVariables: false,
            ...options
        };

        if (options.expandNestingRules) {

            options.nestingRules = false;
        }

        if (options.resolveImport) {
            options.resolveUrls = true;
        }

        const startTime: number = performance.now();
        const errors: ErrorDescription[] = [];
        const src: string = <string>options.src;
        const stack: Array<AstNode | AstComment> = [];
        const stats = {
            bytesIn: 0,
            importedBytesIn: 0,
            parse: `0ms`,
            minify: `0ms`,
            total: `0ms`
        };

        let ast: AstRuleStyleSheet = {
            typ: EnumToken.StyleSheetNodeType,
            chi: []
        };

        let tokens: TokenizeResult[] = [];
        let map: Map<Token, Position> = new Map<Token, Position>;
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

        const iter: Generator<TokenizeResult> = tokenize(iterator);
        let item: TokenizeResult;

        while (item = iter.next().value) {

            stats.bytesIn = item.bytesIn;

            //
            // doParse error
            if (item.hint != null && BadTokensTypes.includes(item.hint)) {

                // bad token
                continue;
            }

            if (item.hint != EnumToken.EOFTokenType) {

                tokens.push(item);
            }

            if (item.token == ';' || item.token == '{') {

                let node: AstAtRule | AstRule | null = await parseNode(tokens, context, stats, options, errors, src, map);

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

                await parseNode(tokens, context, stats, options, errors, src, map);
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

            await parseNode(tokens, context, stats, options, errors, src, map);
        }

        while (stack.length > 0 && context != ast) {

            const previousNode: AstAtRule | AstRule = <AstAtRule | AstRule>stack.pop();

            // @ts-ignore
            context = stack[stack.length - 1] ?? ast;
            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
                continue;
            }

            break;
        }

        const endParseTime: number = performance.now();

        if (options.expandNestingRules) {

            ast = <AstRuleStyleSheet>expand(ast);
        }

        if (options.visitor != null) {

            for (const result of walk(ast)) {

                if (
                    result.node.typ == EnumToken.DeclarationNodeType &&

                    // @ts-ignore
                    (typeof options.visitor.Declaration == 'function' || options.visitor.Declaration?.[(<AstDeclaration>result.node).nam] != null)
                ) {

                    const callable: DeclarationVisitorHandler = typeof options.visitor.Declaration == 'function' ? options.visitor.Declaration : options.visitor.Declaration[(<AstDeclaration>result.node).nam];
                    const results: AstDeclaration | AstDeclaration[] | void | null = await callable(<AstDeclaration>result.node);

                    if (results == null || (Array.isArray(results) && results.length == 0)) {

                        continue;
                    }

                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                } else if (options.visitor.Rule != null && result.node.typ == EnumToken.RuleNodeType) {

                    const results: AstRule | AstRule[] | void | null = await options.visitor.Rule(<AstRule>result.node);

                    if (results == null || (Array.isArray(results) && results.length == 0)) {

                        continue;
                    }

                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                } else if (options.visitor.AtRule != null &&
                    result.node.typ == EnumToken.AtRuleNodeType &&
                    // @ts-ignore
                    (typeof options.visitor.AtRule == 'function' || options.visitor.AtRule?.[(<AstAtRule>result.node).nam] != null)) {

                    const callable: AtRuleVisitorHandler = typeof options.visitor.AtRule == 'function' ? options.visitor.AtRule : options.visitor.AtRule[(<AstAtRule>result.node).nam];
                    const results: AstAtRule | AstAtRule[] | void | null = await callable(<AstAtRule>result.node);

                    if (results == null || (Array.isArray(results) && results.length == 0)) {

                        continue;
                    }

                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
            }
        }

        if (options.minify) {

            if (ast.chi.length > 0) {

                minify(ast, options, true, errors, false);
            }
        }

        const nodes: Array<AstRule | AstAtRule | AstRuleStyleSheet> = [ast];
        let node: AstNode;

        while ((node = nodes.shift()!)) {

            // @ts-ignore
            if (node.chi.length > 0) {

                // @ts-ignore
                for (const child of node.chi) {

                    Object.defineProperty(child, 'parent', {...definedPropertySettings, value: node});

                    if ('chi' in child && child.chi.length > 0) {

                        // @ts-ignore
                        nodes.push(<AstRule | AstAtRule>child);
                    }
                }
            }
        }
        const endTime: number = performance.now();

        if (options.signal != null) {

            options.signal.removeEventListener('abort', reject);
        }

        stats.bytesIn += stats.importedBytesIn;

        return <ParseResult>{
            ast,
            errors,
            stats: {
                ...stats,
                parse: `${(endParseTime - startTime).toFixed(2)}ms`,
                minify: `${(endTime - endParseTime).toFixed(2)}ms`,
                total: `${(endTime - startTime).toFixed(2)}ms`
            }
        };
    // });
}


async function parseNode(results: TokenizeResult[], context: AstRuleList, stats: {
    bytesIn: number;
    importedBytesIn: number;
}, options: ParserOptions, errors: ErrorDescription[], src: string, map: Map<Token, Position>): Promise<AstRule | AstAtRule | null> {

    let tokens: Token[] = [];

    for (const t of results) {

        const node: Token = getTokenType(t.token, t.hint);
        map.set(node, t.position);

        tokens.push(node);
    }

    let i: number;
    let loc: Location;

    for (i = 0; i < tokens.length; i++) {

        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {

            const position: Position = <Position>map.get(tokens[i]);

            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {

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

                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @charset',
                    location: {src, ...position}
                });
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
                    if (type == EnumToken.CommentNodeType) {
                        continue;
                    }
                    if (type != EnumToken.AtRuleNodeType) {
                        errors.push({action: 'drop', message: 'invalid @import', location: {src, ...position}});
                        return null;
                    }

                    const name: string = (<AstAtRule>context.chi[i]).nam;

                    if (name != 'charset' && name != 'import' && name != 'layer') {
                        errors.push({action: 'drop', message: 'invalid @import', location: {src, ...position}});
                        return null;
                    }

                    break;
                }
            }

            // @ts-ignore
            if (tokens[0]?.typ != EnumToken.StringTokenType && tokens[0]?.typ != EnumToken.UrlFunctionTokenType) {

                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @import',
                    location: {src, ...position}
                });
                return null;
            }
            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1]?.typ != EnumToken.UrlTokenTokenType && tokens[1]?.typ != EnumToken.StringTokenType) {

                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @import',
                    location: {src, ...position}
                });
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

                            return doParse(src, Object.assign({}, options, {
                                minify: false,
                                // @ts-ignore
                                src: options.resolve(url, options.src).absolute
                            }))
                        });

                        stats.importedBytesIn += root.stats.bytesIn;

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
                        errors.push({action: 'ignore', message: 'doParse: ' + error.message, error});
                    }
                }
            }
        }
        // https://www.w3.org/TR/css-nesting-1/#conditionals
        // allowed nesting at-rules
        // there must be a top level rule in the stack

        const raw: string[] = parseTokens(tokens, {minify: options.minify}).reduce((acc: string[], curr: Token) => {

            acc.push(renderToken(curr, {removeComments: true}));

            return acc
        }, []);

        const node: AstAtRule = {
            typ: EnumToken.AtRuleNodeType,
            nam: renderToken(atRule, {removeComments: true}),
            val: raw.join('')
        };

        Object.defineProperty(node, 'raw', {...definedPropertySettings, value: raw});

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

                let t: string = renderToken(curr, {minify: false});

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
                typ: EnumToken.RuleNodeType,
                // @ts-ignore
                sel: [...uniq.keys()].join(','),
                chi: []
            };

            let raw: string[][] = [...uniq.values()];

            Object.defineProperty(node, 'raw', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: raw
            });

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
        } else {

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
                        parseColor: options.parseColor,
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
            const position: Position = <Position>map.get(name[0]);

            if (name.length > 0) {

                for (let i = 1; i < name.length; i++) {
                    if (name[i].typ != EnumToken.WhitespaceTokenType && name[i].typ != EnumToken.CommentTokenType) {

                        errors.push(<ErrorDescription>{
                            action: 'drop',
                            message: 'doParse: invalid declaration',
                            location: {src, ...position}
                        });

                        return null;
                    }
                }
            }

            if (value == null || value.length == 0) {

                errors.push(<ErrorDescription>{
                    action: 'drop',
                    message: 'doParse: invalid declaration',
                    location: {src, ...position}
                });
                return null;
            }

            const node: AstDeclaration = {
                typ: EnumToken.DeclarationNodeType,
                // @ts-ignore
                nam: renderToken(name.shift(), {removeComments: true}),
                // @ts-ignore
                val: value
            }

            const result: AstDeclaration | null = parseDeclaration(node, errors, src, position);

            if (result != null) {

                // @ts-ignore
                context.chi.push(node);
            }

            return null;
        }
    }
}

export async function parseDeclarations(src: string, options: ParserOptions = {}): Promise<AstDeclaration[]> {

    return doParse(`.x{${src}`, options).then((result: ParseResult) => <AstDeclaration[]>(<AstRule>result.ast.chi[0]).chi);
}

export function parseString(src: string, options: { location: boolean } = {location: false}): Token[] {

    return parseTokens([...tokenize(src)].map(t => {

        const token: Token = getTokenType(t.token, t.hint);

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

        return enumTokenHints.has(hint) ? <Token>{typ: hint} :  <Token>{typ: hint, val};
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

        if (val == 'url') {

            return <FunctionURLToken>{
                typ: EnumToken.UrlFunctionTokenType,
                val,
                chi: <Token[]>[]
            };
        }

        if (['linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient', 'image', 'image-set', 'element', 'cross-fade'].includes(val)) {
            return <FunctionImageToken>{
                typ: EnumToken.ImageFunctionTokenType,
                val,
                chi: <Token[]>[]
            };
        }

        if (['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'steps', 'cubic-bezier'].includes(val)) {
            return <TimingFunctionToken>{
                typ: EnumToken.TimingFunctionTokenType,
                val,
                chi: <Token[]>[]
            };
        }

        if (['view', 'scroll'].includes(val)) {
            return <TimelineFunctionToken>{
                typ: EnumToken.TimelineFunctionTokenType,
                val,
                chi: <Token[]>[]
            };
        }

        return <FunctionToken>{
            typ: EnumToken.FunctionTokenType,
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

    if (isPercentage(val)) {
        return <PercentageToken>{
            typ: EnumToken.PercentageTokenType,
            val: val.slice(0, -1)
        };
    }

    if (isFlex(val)) {
        return <FlexToken>{
            typ: EnumToken.FlexTokenType,
            val: val.slice(0, -2)
        };
    }

    if (isDimension(val)) {

        return parseDimension(val);
    }

    const v: string = val.toLowerCase();
    if (v == 'currentcolor' || v == 'transparent' || v in COLORS_NAMES) {
        return <ColorToken>{
            typ: EnumToken.ColorTokenType,
            val: v,
            kin: 'lit'
        };
    }

    if (isIdent(val)) {

        return <IdentToken>{
            typ: val.startsWith('--') ? EnumToken.DashedIdenTokenType : EnumToken.IdenTokenType,
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

export function parseTokens(tokens: Token[], options: ParseTokenOptions = {}) {

    for (let i = 0; i < tokens.length; i++) {

        const t: Token = tokens[i];

        if (t.typ == EnumToken.WhitespaceTokenType && ((i == 0 ||
                i + 1 == tokens.length ||
                [EnumToken.CommaTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType].includes(tokens[i + 1].typ)) ||
            (i > 0 &&
                // tokens[i + 1]?.typ != Literal ||
                // funcLike.includes(tokens[i - 1].typ) &&
                // !['var', 'calc'].includes((<FunctionToken>tokens[i - 1]).val)))) &&
                trimWhiteSpace.includes(tokens[i - 1].typ)))) {

            tokens.splice(i--, 1);
            continue;
        }

        if (t.typ == EnumToken.ColonTokenType) {

            const typ: EnumToken = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == EnumToken.FunctionTokenType) {

                    (<PseudoClassFunctionToken>tokens[i + 1]).val = ':' + (<PseudoClassFunctionToken>tokens[i + 1]).val;
                    tokens[i + 1].typ = EnumToken.PseudoClassFuncTokenType;
                } else if (typ == EnumToken.IdenTokenType) {

                    if ((<PseudoClassToken>tokens[i + 1]).val in webkitPseudoAliasMap) {

                        (<PseudoClassToken>tokens[i + 1]).val = webkitPseudoAliasMap[(<PseudoClassToken>tokens[i + 1]).val];
                    }
                    (<PseudoClassToken>tokens[i + 1]).val = ':' + (<PseudoClassToken>tokens[i + 1]).val;
                    tokens[i + 1].typ = EnumToken.PseudoClassTokenType;
                }

                if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {

                    tokens.splice(i, 1);
                    i--;
                }
            }

            continue;
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
            }

            // @ts-ignore
            if (t.chi.length > 1) {
                /*(<AttrToken>t).chi =*/
                // @ts-ignore
                parseTokens(t.chi, t.typ, options);
            }

            let m: number = (<Token[]>t.chi).length;
            let val: Token;

            for (m = 0; m < (<Token[]>t.chi).length; m++) {

                val = (<Token[]>t.chi)[m];

                if (val.typ == EnumToken.StringTokenType) {
                    const slice = val.val.slice(1, -1);
                    if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                        Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
                    }
                } else if (val.typ == EnumToken.LiteralTokenType && val.val == '|') {

                    let upper: number = m;
                    let lower: number = m;

                    while (++upper < (<Token[]>t.chi).length) {

                        if ((<Token[]>t.chi)[upper].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    while (lower-- > 0) {

                        if ((<Token[]>t.chi)[lower].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    // @ts-ignore
                    (<Token[]>t.chi)[m] = <NameSpaceAttributeToken>{
                        typ: EnumToken.NameSpaceAttributeTokenType,
                        l: (<Token[]>t.chi)[lower],
                        r: (<Token[]>t.chi)[upper]
                    };

                    (<Token[]>t.chi).splice(upper, 1);

                    if (lower >= 0) {

                        (<Token[]>t.chi).splice(lower, 1);
                        m--;
                    }
                } else if ([
                    EnumToken.DashMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType
                ].includes((<Token[]>t.chi)[m].typ)) {

                    let upper: number = m;
                    let lower: number = m;

                    while (++upper < (<Token[]>t.chi).length) {

                        if ((<Token[]>t.chi)[upper].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    while (lower-- > 0) {

                        if ((<Token[]>t.chi)[lower].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    val = (<Token[]>t.chi)[lower];

                    if (val.typ == EnumToken.StringTokenType) {
                        const slice: string = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
                        }
                    }

                    val = (<Token[]>t.chi)[upper];

                    if (val.typ == EnumToken.StringTokenType) {
                        const slice: string = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
                        }
                    }

                    (<Token[]>t.chi)[m] = <MatchExpressionToken>{
                        typ: EnumToken.MatchExpressionTokenType,
                        op: <EnumToken.DashMatchTokenType | EnumToken.StartMatchTokenType | EnumToken.ContainMatchTokenType |
                            EnumToken.EndMatchTokenType | EnumToken.IncludeMatchTokenType>(<DashMatchToken | StartMatchToken | ContainMatchToken | EndMatchToken | IncludeMatchToken>(<Token[]>t.chi)[m]).typ,
                        l: (<Token[]>t.chi)[lower],
                        r: (<Token[]>t.chi)[upper]
                    };

                    (<Token[]>t.chi).splice(upper, 1);
                    (<Token[]>t.chi).splice(lower, 1);

                    upper = m;
                    m--;

                    while (upper < (<Token[]>t.chi).length && (<Token[]>t.chi)[upper].typ == EnumToken.WhitespaceTokenType) {
                        upper++;
                    }

                    if (upper < (<Token[]>t.chi).length &&
                        (<Token[]>t.chi)[upper].typ == EnumToken.Iden &&
                        ['i', 's'].includes((<IdentToken>(<Token[]>t.chi)[upper]).val.toLowerCase())) {

                        (<MatchExpressionToken>(<Token[]>t.chi)[m]).attr = <'i' | 's'>(<IdentToken>(<Token[]>t.chi)[upper]).val;
                        (<Token[]>t.chi).splice(upper, 1);
                    }
                }
            }

            m = (<Token[]>t.chi).length;

            while ((<Token[]>t.chi).at(-1)?.typ == EnumToken.WhitespaceTokenType) {

                (<Token[]>t.chi).pop();
            }

            continue;
        }

        if (funcLike.includes(t.typ)) {

            let parens: number = 1;
            let k: number = i;

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
            if (t.chi.length > 0) {

                // @ts-ignore
                parseTokens(t.chi, options);
            }

            if (t.typ == EnumToken.FunctionTokenType && (<FunctionToken>t).val == 'calc') {

                for (const {value, parent} of walkValues((<FunctionToken>t).chi)) {

                    if (value.typ == EnumToken.WhitespaceTokenType) {

                        const p = <FunctionToken | ParensToken>(parent ?? t);

                        for (let i = 0; i < (p).chi.length; i++) {

                            // @ts-ignore
                            if ((<FunctionToken | ParensToken>p).chi[i] == value) {

                                // @ts-ignore
                                (p).chi.splice(i, 1);
                                i--;
                                break;
                            }
                        }

                    } else if (value.typ == EnumToken.LiteralTokenType && ['+', '-', '/', '*'].includes((<LiteralToken>value).val)) {

                        // @ts-ignore
                        value.typ = (<LiteralToken>value).val == '+' ? EnumToken.Add : ((<LiteralToken>value).val == '-' ? EnumToken.Sub : ((<LiteralToken>value).val == '*' ? EnumToken.Mul : EnumToken.Div));

                        // @ts-ignore
                        delete value.val;
                    }
                }

            } else if (t.typ == EnumToken.FunctionTokenType && ['minmax', 'fit-content', 'repeat'].includes((<FunctionToken>t).val)) {

                // @ts-ignore
                t.typ = EnumToken.GridTemplateFuncTokenType;
            } else if (t.typ == EnumToken.StartParensTokenType) {

                // @ts-ignore
                t.typ = EnumToken.ParensTokenType;
            }

            // @ts-ignore
            if (options.parseColor && t.typ == EnumToken.FunctionTokenType && isColor(t)) {

                // @ts-ignore
                t.typ = EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = t.val;

                if (t.chi[0].typ == EnumToken.IdenTokenType) {

                    if (t.chi[0].val == 'from') {

                        // @ts-ignore
                        t.cal = 'rel';
                    }

                    // @ts-ignore
                    else if (t.val == 'color-mix' && t.chi[0].val == 'in') {

                        // @ts-ignore
                        t.cal = 'mix';
                    } else if (t.val == 'color') {
                        // @ts-ignore
                        t.cal = 'col';
                        // t.chi = t.chi.filter((t: Token) => [EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(t.typ));
                    }
                }

                t.chi = t.chi.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommentTokenType].includes(t.typ));
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
                const value: string = t.val.toLowerCase();

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