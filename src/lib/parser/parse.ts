import {
    isAtKeyword,
    isColor,
    isDimension,
    isFlex,
    isFunction,
    isHash,
    isHexColor,
    isIdent,
    isIdentColor,
    isIdentStart,
    isNumber,
    isPercentage,
    isPseudo,
    mathFuncs,
    mediaTypes,
    parseColor,
    parseDimension,
    pseudoElements
} from "../syntax/index.ts";
import {parseDeclarationNode} from './utils/index.ts';
import {colorsFunc, renderToken} from "../renderer/index.ts";
import {COLORS_NAMES} from "../syntax/color/index.ts";
import {
    ColorType,
    combinators,
    definedPropertySettings,
    EnumToken,
    expand,
    minify,
    SyntaxValidationResult,
    ValidationLevel,
    walk,
    WalkerOptionEnum,
    walkValues
} from "../ast/index.ts";
import {tokenize} from "./tokenize.ts";
import type {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstInvalidAtRule,
    AstInvalidDeclaration,
    AstInvalidRule,
    AstKeyframAtRule,
    AstKeyFrameRule,
    AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AtRuleToken,
    AtRuleVisitorHandler,
    AttrEndToken,
    AttrStartToken,
    AttrToken,
    BlockEndToken,
    BlockStartToken,
    ChildCombinatorToken,
    ClassSelectorToken,
    ColonToken,
    ColorToken,
    CommaToken,
    ContainMatchToken,
    DashMatchToken,
    DeclarationVisitorHandler,
    DelimToken,
    EndMatchToken,
    EqualMatchToken,
    ErrorDescription,
    FlexToken,
    FunctionImageToken,
    FunctionToken,
    FunctionURLToken,
    GreaterThanToken,
    HashToken,
    IdentToken,
    IncludeMatchToken,
    InvalidClassSelectorToken,
    LessThanToken,
    LiteralToken,
    Location,
    MatchExpressionToken,
    MediaQueryConditionToken,
    NameSpaceAttributeToken,
    NestingSelectorToken,
    NextSiblingCombinatorToken,
    NumberToken,
    ParensEndToken,
    ParensStartToken,
    ParensToken,
    ParseResult,
    ParseResultStats,
    ParserOptions,
    ParseTokenOptions,
    PercentageToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    PseudoElementToken,
    SemiColonToken,
    StartMatchToken,
    StringToken,
    SubsequentCombinatorToken,
    TimelineFunctionToken,
    TimingFunctionToken,
    Token,
    TokenizeResult,
    UnclosedStringToken,
    UniversalSelectorToken,
    UrlToken,
    WhitespaceToken
} from "../../@types/index.d.ts";
import {deprecatedSystemColors, funcLike, systemColors, timelineFunc, timingFunc} from "../syntax/color/utils/index.ts";
import {validateAtRule, validateSelector} from "../validation/index.ts";
import type {ValidationResult, ValidationSyntaxResult} from "../../@types/validation.d.ts";
import {validateAtRuleKeyframes} from "../validation/at-rules/index.ts";
import {validateKeyframeSelector} from "../validation/syntaxes/index.ts";
import {evaluateSyntax} from "../validation/syntax.ts";
import {splitTokenList} from "../validation/utils/index.ts";
import {buildExpression} from "../ast/math/index.ts";

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

function reject(reason?: any) {

    throw new Error(reason ?? 'Parsing aborted');
}

/**
 * parse css string
 * @param iterator
 * @param options
 */
export async function doParse(iterator: string, options: ParserOptions = {}): Promise<ParseResult> {

    if (options.signal != null) {

        options.signal.addEventListener('abort', reject);
    }

    options = {
        src: '',
        sourcemap: false,
        minify: true,
        pass: 1,
        parseColor: true,
        nestingRules: true,
        resolveImport: false,
        resolveUrls: false,
        removeCharset: true,
        removeEmpty: true,
        removeDuplicateDeclarations: true,
        computeTransform: true,
        computeShorthand: true,
        computeCalcExpression: true,
        inlineCssVariables: false,
        setParent: true,
        removePrefix: false,
        validation: ValidationLevel.Default,
        lenient: true,
        ...options
    }

    if (typeof options.validation == 'boolean') {

        options.validation = options.validation ? ValidationLevel.All : ValidationLevel.None;
    }

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
    const stats: ParseResultStats = {
        src: options.src ?? '',
        bytesIn: 0,
        importedBytesIn: 0,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: []
    };

    let ast: AstRuleStyleSheet = {
        typ: EnumToken.StyleSheetNodeType,
        chi: []
    };

    let tokens: TokenizeResult[] = [];
    let map: Map<Token, Location> = new Map<Token, Location>;
    let context: AstRuleList | AstInvalidAtRule | AstInvalidRule = ast;

    if (options.sourcemap) {

        ast.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1
            },
            end: {
                ind: 0,
                lin: 1,
                col: 1
            },
            src: ''
        };
    }

    const iter: Generator<TokenizeResult> = tokenize(iterator);
    let item: TokenizeResult;
    let node: AstAtRule | AstRule | AstKeyFrameRule | AstKeyframAtRule | AstInvalidRule | AstDeclaration | AstComment | null;
    const rawTokens: TokenizeResult[] = [];
    const imports: AstAtRule[] = [];

    while (item = iter.next().value) {

        stats.bytesIn = item.bytesIn;

        rawTokens.push(item);

        if (item.hint != null && BadTokensTypes.includes(item.hint)) {

            // bad token
            continue;
        }

        if (item.hint != EnumToken.EOFTokenType) {

            tokens.push(item);
        } else if (ast.loc != null) {

            for (let i = stack.length - 1; i >= 0; i--) {

                stack[i].loc!.end = {...item.end};
            }

            ast.loc.end = item.end;
        }

        if (item.token == ';' || item.token == '{') {

            node = parseNode(tokens, context, options, errors, src, map, rawTokens);
            rawTokens.length = 0;

            if (node != null) {

                if ('chi' in node) {

                    stack.push(<AstAtRule | AstRule | AstKeyFrameRule | AstInvalidRule>node);
                    context = node as AstRuleList;

                } else if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).nam == 'import') {

                    imports.push(node);
                }

            } else if (item.token == '{') {

                let inBlock = 1;

                tokens = [item];

                do {

                    item = iter.next().value;

                    if (item == null) {

                        break;
                    }

                    tokens.push(item);

                    if (item.token == '{') {

                        inBlock++;
                    } else if (item.token == '}') {

                        inBlock--;
                    }
                }

                while (inBlock != 0);

                if (tokens.length > 0) {

                    errors.push({
                        action: 'drop',
                        message: 'invalid block',
                        rawTokens: tokens.slice()
                    });
                }
            }

            tokens = [];
            map = new Map;
        } else if (item.token == '}') {

            parseNode(tokens, context, options, errors, src, map, rawTokens);
            rawTokens.length = 0;

            if (context.loc != null) {

                context.loc.end = item.end;
            }

            const previousNode = stack.pop() as AstRuleList;

            context = (stack[stack.length - 1] ?? ast) as AstRuleList;

            if (previousNode != null && previousNode.typ == EnumToken.InvalidRuleTokenType) {

                const index: number = context.chi.findIndex(node => node == previousNode);

                if (index > -1) {

                    context.chi.splice(index, 1);
                }
            }

            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {

                context.chi.pop();
            }

            tokens = [];
            map = new Map;
        }
    }

    if (tokens.length > 0) {

        node = parseNode(tokens, context, options, errors, src, map, rawTokens);
        rawTokens.length = 0;

        if (node != null) {

            if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).nam == 'import') {

                imports.push(node);
            } else if ('chi' in node && node.typ != EnumToken.InvalidRuleTokenType) {

                stack.push(node);
                context = node as AstRuleList;
            }
        }

        if (context != null && context.typ == EnumToken.InvalidRuleTokenType) {

            // @ts-ignore
            const index: number = context.chi.findIndex((node: AstNode): boolean => node == context);

            if (index > -1) {

                (context as AstInvalidRule).chi.splice(index, 1);
            }
        }
    }

    if (imports.length > 0 && options.resolveImport) {

        await Promise.all(imports.map(async (node: AstAtRule) => {

            const token = (node.tokens as Token[])[0] as UrlToken | StringToken;
            const url: string = token.typ == EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;

            try {

                const root: ParseResult = await options.load!(url, <string>options.src).then((src: string) => {

                    return doParse(src, Object.assign({}, options, {
                        minify: false,
                        setParent: false,
                        src: options.resolve!(url, options.src as string).absolute
                    }))
                });

                stats.importedBytesIn += root.stats.bytesIn;
                stats.imports.push(root.stats);

                node.parent!.chi.splice(node.parent!.chi.indexOf(node), 1, ...root.ast.chi);

                if (root.errors.length > 0) {

                    errors.push(...root.errors);
                }

            } catch (error) {

                // @ts-ignore
                errors.push({action: 'ignore', message: 'doParse: ' + error.message as string, error});
            }
        }));
    }

    while (stack.length > 0 && context != ast) {

        const previousNode: AstAtRule | AstRule = stack.pop() as AstAtRule | AstRule;

        context = (stack[stack.length - 1] ?? ast) as AstRuleList;

        // remove empty nodes
        if (options.removeEmpty && previousNode != null && previousNode.chi!.length == 0 && context.chi[context.chi.length - 1] == previousNode) {

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

                (typeof options.visitor.Declaration == 'function' || options.visitor.Declaration?.[(<AstDeclaration>result.node).nam] != null)
            ) {

                const callable: DeclarationVisitorHandler = typeof options.visitor.Declaration == 'function' ? options.visitor.Declaration : options.visitor.Declaration[(<AstDeclaration>result.node).nam];
                const results: AstDeclaration | AstDeclaration[] | void | null = await callable(<AstDeclaration>result.node);

                if (results == null || (Array.isArray(results) && results.length == 0)) {

                    continue;
                }

                result.parent!.chi.splice(result.parent!.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
            } else if (options.visitor.Rule != null && result.node.typ == EnumToken.RuleNodeType) {

                const results: AstRule | AstRule[] | void | null = await options.visitor.Rule(<AstRule>result.node);

                if (results == null || (Array.isArray(results) && results.length == 0)) {

                    continue;
                }

                result.parent!.chi.splice(result.parent!.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
            } else if (options.visitor.AtRule != null &&
                result.node.typ == EnumToken.AtRuleNodeType &&
                // @ts-ignore
                (typeof options.visitor.AtRule == 'function' || options.visitor.AtRule?.[(<AstAtRule>result.node).nam] != null)) {

                const callable: AtRuleVisitorHandler = typeof options.visitor.AtRule == 'function' ? options.visitor.AtRule : options.visitor.AtRule[(<AstAtRule>result.node).nam];
                const results: AstAtRule | AstAtRule[] | void | null = await callable(<AstAtRule>result.node);

                if (results == null || (Array.isArray(results) && results.length == 0)) {

                    continue;
                }

                result.parent!.chi.splice(result.parent!.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
            }
        }
    }

    if (options.minify) {

        if (ast.chi.length > 0) {

            let passes: number = options.pass ?? 1 as number;

            while (passes--) {

                minify(ast, options, true, errors, false);
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
    }
}

function getLastNode(context: AstRuleList | AstInvalidRule | AstInvalidAtRule): AstNode | null {

    let i: number = (context.chi as AstNode[]).length;

    while (i--) {

        if ([EnumToken.CommentTokenType, EnumToken.CDOCOMMTokenType, EnumToken.WhitespaceTokenType].includes((context.chi as AstNode[])[i].typ)) {

            continue;
        }

        return (context.chi as AstNode[])[i];
    }

    return null;
}

function parseNode(results: TokenizeResult[], context: AstRuleList | AstInvalidRule | AstInvalidAtRule, options: ParserOptions, errors: ErrorDescription[], src: string, map: Map<Token, Location>, rawTokens: TokenizeResult[]): AstRule | AstAtRule | AstKeyFrameRule | AstKeyframAtRule | AstInvalidRule | AstDeclaration | AstComment | null {

    let tokens: Token[] = [] as Token[];

    for (const t of results) {

        const node: Token = getTokenType(t.token, t.hint);
        map.set(node, {sta: t.sta, end: t.end, src});

        tokens.push(node);
    }

    let i: number;
    let loc: Location;

    for (i = 0; i < tokens.length; i++) {

        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {

            const location: Location = <Location>map.get(tokens[i]);

            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {

                errors.push({
                    action: 'drop',
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    location
                });
                continue;
            }

            loc = location;

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
    }

    while ([EnumToken.WhitespaceTokenType, EnumToken.BadStringTokenType, EnumToken.BadCommentTokenType].includes((tokens as Token[]).at(-1)?.typ as EnumToken)) {

        tokens.pop();
    }

    if (tokens.length == 0) {
        return null;
    }

    if (tokens[0]?.typ == EnumToken.AtRuleTokenType) {

        const atRule: AtRuleToken = <AtRuleToken>tokens.shift();
        const location: Location = <Location>map.get(atRule);

        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
            tokens.shift();
        }

        rawTokens.shift();

        if (atRule.val == 'import') {

            // only @charset and @layer are accepted before @import
            // @ts-ignore
            if (context.chi.length > 0) {
                // @ts-ignore
                let i = context.chi.length;
                while (i--) {
                    // @ts-ignore
                    const type = context.chi[i].typ;
                    if (type == EnumToken.CommentNodeType) {
                        continue;
                    }
                    if (type != EnumToken.AtRuleNodeType) {

                        // @ts-ignore
                        if (!(type == EnumToken.InvalidAtRuleTokenType &&
                            // @ts-ignore
                            ['charset', 'layer', 'import'].includes((<AstInvalidAtRule>context.chi[i]).nam as string))) {

                            errors.push({action: 'drop', message: 'invalid @import', location});
                            return null;
                        }
                    }

                    // @ts-ignore
                    const name: string = (<AstAtRule>context.chi[i]).nam;

                    if (name != 'charset' && name != 'import' && name != 'layer') {
                        errors.push({action: 'drop', message: 'invalid @import', location});
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
                    location
                });

                return null;
            }

            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1]?.typ != EnumToken.UrlTokenTokenType && tokens[1]?.typ != EnumToken.StringTokenType) {

                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @import',
                    location
                });

                return null;
            }
        }

        if (atRule.val == 'import') {

            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType) {

                if (tokens[1].typ == EnumToken.UrlTokenTokenType || tokens[1].typ == EnumToken.StringTokenType) {

                    tokens.shift();

                    if ((tokens[0] as Token)?.typ == EnumToken.UrlTokenTokenType) {

                        // @ts-ignore
                        tokens[0].typ = EnumToken.StringTokenType;
                        // @ts-ignore
                        tokens[0].val = `"${tokens[0].val}"`;
                    }

                    // @ts-ignore
                    while (tokens[1]?.typ == EnumToken.WhitespaceTokenType || tokens[1]?.typ == EnumToken.CommentTokenType) {

                        tokens.splice(1, 1);
                    }

                    // @ts-ignore
                    if (tokens[1]?.typ == EnumToken.EndParensTokenType) {

                        tokens.splice(1, 1);
                    }
                }
            }
        }

        // https://www.w3.org/TR/css-nesting-1/#conditionals
        // allowed nesting at-rules
        // there must be a top level rule in the stack
        if (atRule.val == 'charset') {

            let spaces: number = 0;

            // https://developer.mozilla.org/en-US/docs/Web/CSS/@charset
            for (let k = 0; k < rawTokens.length; k++) {

                if (rawTokens[k].hint == EnumToken.WhitespaceTokenType) {

                    spaces += rawTokens[k].len;
                    continue;
                }

                if (rawTokens[k].hint == EnumToken.CommentTokenType) {

                    continue;
                }

                if (rawTokens[k].hint == EnumToken.CDOCOMMTokenType) {
                    continue;
                }

                if (spaces > 1) {

                    errors.push({
                        action: 'drop',
                        message: '@charset must have only one space',
                        // @ts-ignore
                        location
                    });

                    return null;
                }

                if (rawTokens[k].hint != EnumToken.StringTokenType || rawTokens[k].token[0] != '"') {

                    errors.push({
                        action: 'drop',
                        message: '@charset expects a "<charset>"',
                        location
                    });

                    return null;
                }

                break;
            }

            if (options.removeCharset) {

                return null;
            }
        }

        const t: Token[] = parseAtRulePrelude(parseTokens(tokens, {minify: options.minify}), atRule) as Token[];

        const raw: string[] = t.reduce((acc: string[], curr: Token) => {

            acc.push(renderToken(curr, {removeComments: true, convertColor: false}));
            return acc
        }, []);

        const nam: string = renderToken(atRule, {removeComments: true});
        // @ts-ignore
        const node: AstAtRule | AstKeyframAtRule = {
            typ: /^(-[a-z]+-)?keyframes$/.test(nam) ? EnumToken.KeyframeAtRuleNodeType : EnumToken.AtRuleNodeType,
            nam,
            val: raw.join('')
        };

        Object.defineProperties(node, {
            tokens: {...definedPropertySettings, enumerable: false, value: t.slice()},
            raw: {...definedPropertySettings, value: raw}
        });

        if (delim.typ == EnumToken.BlockStartTokenType) {

            node.chi = [];
        }

        loc = map.get(atRule)!;

        if (options.sourcemap) {
            node.loc = loc;

            node.loc.end = {...map.get(delim)!.end};
        }

        let isValid: boolean = true;

        if (node.nam == 'else') {

            const prev = getLastNode(context);

            if (prev != null && prev.typ == EnumToken.AtRuleNodeType && ['when', 'else'].includes((<AstAtRule>prev).nam)) {

                if ((<AstAtRule>prev).nam == 'else') {

                    isValid = Array.isArray((<AstAtRule>prev).tokens) && ((<AstAtRule>prev).tokens as Token[]).length > 0;
                }
            } else {

                isValid = false;
            }
        }

        // @ts-ignore
        const valid: ValidationResult = options.validation == ValidationLevel.None ? {
            valid: SyntaxValidationResult.Valid,
            error: '',
            matches: [],
            node,
            syntax: '@' + node.nam
        } as ValidationResult : isValid ? (node.typ == EnumToken.KeyframeAtRuleNodeType ? validateAtRuleKeyframes(<AstKeyframAtRule>node, options, context as AstNode) : validateAtRule(node, options, context as AstNode)) : {
            valid: SyntaxValidationResult.Drop,
            node,
            matches: [] as Token[],
            syntax: '@' + node.nam,
            error: '@' + node.nam + ' not allowed here',
            tokens
        } as ValidationResult;

        if (valid.valid == SyntaxValidationResult.Drop) {

            errors.push({
                action: 'drop',
                message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, {minify: false}), '') + '"',
                // @ts-ignore
                location: {src, ...(map.get(valid.node) ?? location)}
            });

            // @ts-ignore
            node.typ = EnumToken.InvalidAtRuleTokenType;
        } else {

            node.val = (node.tokens as Token[]).reduce((acc, curr) => acc + renderToken(curr, {
                minify: false,
                convertColor: false,
                removeComments: true
            }), '');
        }

        context.chi!.push(node);
        Object.defineProperties(node, {
            parent: {...definedPropertySettings, value: context},
            validSyntax: {...definedPropertySettings, value: valid.valid == SyntaxValidationResult.Valid}
        });

        return node;
    } else {
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {

            const location: Location = <Location>map.get(tokens[0]);
            const uniq = new Map<string, string[]>;

            parseTokens(tokens, {minify: true});

            const ruleType: EnumToken = context.typ == EnumToken.KeyframeAtRuleNodeType ? EnumToken.KeyFrameRuleNodeType : EnumToken.RuleNodeType;

            if (ruleType == EnumToken.RuleNodeType) {

                parseSelector(tokens);
            }

            const node: AstRule | AstKeyFrameRule = {
                typ: ruleType,
                sel: [...tokens.reduce((acc: string[][], curr: Token, index: number, array: Token[]) => {

                    if (curr.typ == EnumToken.CommentTokenType) {

                        return acc;
                    }

                    if (curr.typ == EnumToken.WhitespaceTokenType) {

                        if (
                            trimWhiteSpace.includes(array[index - 1]?.typ) ||
                            trimWhiteSpace.includes(array[index + 1]?.typ) ||
                            combinators.includes((<LiteralToken>array[index - 1])?.val) ||
                            combinators.includes((<LiteralToken>array[index + 1])?.val)) {

                            return acc;
                        }
                    }

                    if (ruleType == EnumToken.KeyFrameRuleNodeType) {

                        if (curr.typ == EnumToken.IdenTokenType && (curr as IdentToken).val == 'from') {

                            Object.assign(curr, {typ: EnumToken.PercentageTokenType, val: '0'})
                        } else if (curr.typ == EnumToken.PercentageTokenType && (curr as PercentageToken).val == '100') {

                            Object.assign(curr, {typ: EnumToken.IdenTokenType, val: 'to'})
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

                    let i: number = 0;

                    for (; i < curr.length; i++) {

                        if (i + 1 < curr.length && curr[i] == '*') {

                            if (curr[i] == '*') {

                                let index: number = curr[i + 1] == ' ' ? 2 : 1;

                                if (!['>', '~', '+'].includes(curr[index])) {

                                    curr.splice(i, index);
                                }
                            }
                        }
                    }

                    acc.set(curr.join(''), curr);
                    return acc;
                }, uniq).keys()].join(','),
                chi: []
            };

            Object.defineProperty(node, 'tokens', {
                ...definedPropertySettings,
                enumerable: false,
                value: tokens.slice()
            });

            loc = location;

            if (options.sourcemap) {
                node.loc = loc;
            }

            // @ts-ignore
            context.chi.push(node);
            Object.defineProperty(node, 'parent', {...definedPropertySettings, value: context});

            // @ts-ignore
            const valid: ValidationResult = options.validation == ValidationLevel.None ? {
                valid: SyntaxValidationResult.Valid,
                node,
                matches: [], syntax: null,
                error: null
            } as ValidationResult : ruleType == EnumToken.KeyFrameRuleNodeType ? validateKeyframeSelector(tokens, options) : validateSelector(tokens, options, context as AstNode);

            if (valid.valid != SyntaxValidationResult.Valid) {

                // @ts-ignore
                node.typ = EnumToken.InvalidRuleTokenType;
                node.sel = tokens.reduce((acc: string, curr: Token) => acc + renderToken(curr, {minify: false}), '');

                errors.push({
                    action: 'drop',
                    message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, {minify: false}), '') + '"',
                    // @ts-ignore
                    location
                });
            }

            Object.defineProperty(node, 'validSyntax', {
                ...definedPropertySettings,
                value: valid.valid == SyntaxValidationResult.Valid
            });
            return node;
        } else {

            let name: Token[] | null = null;
            let value: Token[] | null = null;
            let i: number = 0;

            for (; i < tokens.length; i++) {

                if (tokens[i].typ == EnumToken.LiteralTokenType && (tokens[i] as LiteralToken).val.length > 1) {

                    const start: string = (tokens[i] as LiteralToken).val.charAt(0);
                    const val: string = (tokens[i] as LiteralToken).val.slice(1);

                    if (['/', '*'].includes(start) && isNumber(val)) {

                        tokens.splice(i, 1, {
                            typ: EnumToken.LiteralTokenType,
                            val: (tokens[i] as LiteralToken).val.charAt(0)
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: (tokens[i] as LiteralToken).val.slice(1)
                        });
                    } else if (start == '/' && isFunction(val)) {

                        tokens.splice(i, 1, {typ: EnumToken.LiteralTokenType, val: '/'}, getTokenType(val));
                    }
                }
            }

            parseTokens(tokens, {...options, parseColor: true});

            for (i = 0; i < tokens.length; i++) {

                if (tokens[i].typ == EnumToken.CommentTokenType) {

                    continue;
                }

                if (name == null && [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType].includes(tokens[i].typ)) {

                    name = tokens.slice(0, i + 1);

                } else if (name == null && tokens[i].typ == EnumToken.ColorTokenType && [ColorType.SYS, ColorType.DPSYS].includes((<ColorToken>tokens[i]).kin)) {

                    name = tokens.slice(0, i + 1);
                    tokens[i].typ = EnumToken.IdenTokenType;

                } else if (name != null && funcLike.concat([
                    EnumToken.LiteralTokenType,
                    EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType,
                    EnumToken.PseudoClassTokenType, EnumToken.PseudoClassFuncTokenType
                ]).includes(tokens[i].typ)) {

                    if ((<IdentToken>tokens[i]).val?.charAt?.(0) == ':') {

                        Object.assign(tokens[i], getTokenType((<IdentToken>tokens[i]).val.slice(1)));

                        if ('chi' in tokens[i]) {

                            (<FunctionToken>tokens[i]).typ = EnumToken.FunctionTokenType;

                            if (colorsFunc.includes((tokens[i] as FunctionToken).val) && isColor(tokens[i])) {

                                parseColor(tokens[i]);
                            }
                        }

                        tokens.splice(i--, 0, {typ: EnumToken.ColonTokenType});
                        continue;
                    }

                    if ('chi' in tokens[i]) {

                        (<FunctionToken>tokens[i]).typ = EnumToken.FunctionTokenType;
                    }

                    value = tokens.slice(i);
                }

                if (tokens[i].typ == EnumToken.ColonTokenType) {

                    name = tokens.slice(0, i);
                    value = tokens.slice(i + 1);
                    break;
                }
            }

            if (name == null) {

                name = tokens;
            }

            const location: Location = <Location>map.get(name[0]);

            if (name.length > 0) {

                for (let i = 1; i < name.length; i++) {

                    if (name[i].typ != EnumToken.WhitespaceTokenType && name[i].typ != EnumToken.CommentTokenType) {

                        errors.push(<ErrorDescription>{
                            action: 'drop',
                            message: 'doParse: invalid declaration',
                            location
                        });

                        return null;
                    }
                }
            }

            const nam: string = renderToken(name.shift() as Token, {removeComments: true})

            if (value == null || (!nam.startsWith('--') && value.length == 0)) {

                errors.push(<ErrorDescription>{
                    action: 'drop',
                    message: 'doParse: invalid declaration',
                    location
                });

                if (options.lenient) {

                    const node = <AstInvalidDeclaration>{
                        typ: EnumToken.InvalidDeclarationNodeType,
                        nam,
                        val: []
                    }

                    if (options.sourcemap) {

                        node.loc = location;
                        node.loc.end = {...map.get(delim)!.end};
                    }

                    context.chi!.push(node);
                }

                return null;
            }

            for (const {value: token} of walkValues(value as Token[], null, {

                fn: (node: AstNode | Token) => node.typ == EnumToken.FunctionTokenType && (node as FunctionToken).val == 'calc' ? WalkerOptionEnum.IgnoreChildren : null,
                type: EnumToken.FunctionTokenType
            })) {

                if (token.typ == EnumToken.FunctionTokenType && (token as FunctionToken).val == 'calc') {

                    for (const {value: node, parent} of walkValues((token as FunctionToken).chi, token)) {

                        // fix expressions starting with '/' or '*' such as '/4' in (1 + 1)/4
                        if (node.typ == EnumToken.LiteralTokenType && (node as LiteralToken).val.length > 0) {

                            if ((node as LiteralToken).val[0] == '/' || (node as LiteralToken).val[0] == '*') {

                                (parent as FunctionToken).chi.splice((parent as FunctionToken).chi.indexOf(node), 1, {typ: (node as LiteralToken).val[0] == '/' ? EnumToken.Div : EnumToken.Mul}, ...parseString((node as LiteralToken).val.slice(1)));
                            }
                        }
                    }
                }
            }

            const node: AstDeclaration = {
                typ: EnumToken.DeclarationNodeType,
                nam,
                val: value
            }

            if (options.sourcemap) {

                node.loc = location;
                node.loc.end = {...map.get(delim)!.end};
            }

            // do not allow declarations in style sheets
            if (context.typ == EnumToken.StyleSheetNodeType && options.lenient) {

                // @ts-ignore
                node.typ = EnumToken.InvalidDeclarationNodeType;
                context.chi!.push(node);
                return null;
            }

            const result: AstDeclaration | null = parseDeclarationNode(node, errors, location);

            Object.defineProperty(result, 'parent', {...definedPropertySettings, value: context});

            if (result != null) {

                if (options.validation == ValidationLevel.All) {

                    const valid: ValidationSyntaxResult = evaluateSyntax(result, options);

                    Object.defineProperty(result, 'validSyntax', {
                        ...definedPropertySettings,
                        value: valid.valid == SyntaxValidationResult.Valid
                    });

                    if (valid.valid == SyntaxValidationResult.Drop) {

                        errors.push(<ErrorDescription>{
                            action: 'drop',
                            message: valid.error,
                            syntax: valid.syntax,
                            node: valid.node,
                            location: map.get(valid.node as Token) ?? valid.node?.loc ?? result.loc ?? location
                        });

                        if (!options.lenient) {

                            return null;
                        }

                        // @ts-ignore
                        node.typ = EnumToken.InvalidDeclarationNodeType;
                    }
                }

                context.chi!.push(result);
            }

            return null;
        }
    }
}

/**
 * parse at-rule prelude
 * @param tokens
 * @param atRule
 */
export function parseAtRulePrelude(tokens: Token[], atRule: AtRuleToken | AstAtRule): Token[] {

    // @ts-ignore
    for (const {value, parent} of walkValues(tokens, null, null, true)) {

        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType
        ) {

            continue;
        }

        if (value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType) {

            if (parent?.typ == EnumToken.ParensTokenType) {

                const index: number = parent.chi.indexOf(value);
                let i: number = index;

                while (i--) {

                    if (parent.chi[i].typ == EnumToken.IdenTokenType || parent.chi[i].typ == EnumToken.DashedIdenTokenType) {

                        break;
                    }
                }

                if (i >= 0) {

                    const token: Token = getTokenType((parent.chi[index] as PseudoClassToken | PseudoClassFunctionToken).val.slice(1) + (funcLike.includes(parent.chi[index].typ) ? '(' : ''));

                    (parent.chi[index] as PseudoClassToken | PseudoClassFunctionToken).val = (token as PseudoClassToken | PseudoClassFunctionToken).val;
                    (parent.chi[index] as PseudoClassToken | PseudoClassFunctionToken).typ = (token as PseudoClassToken | PseudoClassFunctionToken).typ;

                    if (parent.chi[index].typ == EnumToken.FunctionTokenType && isColor(parent.chi[index])) {

                        parseColor(parent.chi[index]);
                    }

                    parent.chi.splice(i, index - i + 1, {
                        typ: EnumToken.MediaQueryConditionTokenType,
                        l: parent.chi[i],
                        r: parent.chi.slice(index),
                        op: {
                            typ: EnumToken.ColonTokenType
                        } as ColonToken
                    } as MediaQueryConditionToken)
                }
            }
        }

        if (atRule.val == 'page' && value.typ == EnumToken.PseudoClassTokenType) {

            if ([':left', ':right', ':first', ':blank'].includes((<PseudoClassToken>value).val)) {

                // @ts-ignore
                value.typ = EnumToken.PseudoPageTokenType;
            }
        }

        if (atRule.val == 'layer') {

            if (parent == null && value.typ == EnumToken.LiteralTokenType) {

                if ((<LiteralToken>value).val.charAt(0) == '.') {

                    if (isIdent((<LiteralToken>value).val.slice(1))) {

                        // @ts-ignore
                        (<ClassSelectorToken>value).typ = EnumToken.ClassSelectorTokenType;
                    }
                }
            }
        }

        if (value.typ == EnumToken.IdenTokenType) {

            if (parent == null && mediaTypes.some((t: string) => {

                if ((value as IdentToken).val.localeCompare(t, 'en', {sensitivity: 'base'}) == 0) {

                    // @ts-ignore
                    value.typ = EnumToken.MediaFeatureTokenType;
                    return true;
                }

                return false;
            })) {

                continue;
            }

            if (value.typ == EnumToken.IdenTokenType && 'and'.localeCompare((value as IdentToken).val, 'en', {sensitivity: 'base'}) == 0) {

                // @ts-ignore
                value.typ = EnumToken.MediaFeatureAndTokenType;
                continue;
            }

            if (value.typ == EnumToken.IdenTokenType && 'or'.localeCompare((value as IdentToken).val, 'en', {sensitivity: 'base'}) == 0) {

                // @ts-ignore
                value.typ = EnumToken.MediaFeatureOrTokenType;
                continue;
            }

            if (value.typ == EnumToken.IdenTokenType &&
                ['not', 'only'].some((t: string): boolean => t.localeCompare((value as IdentToken).val, 'en', {sensitivity: 'base'}) == 0)) {

                // @ts-ignore
                const array: Token[] = parent?.chi ?? tokens as Token[];
                const startIndex: number = array.indexOf(value);
                let index: number = startIndex + 1;

                if (index == 0) {

                    continue;
                }

                while (index < array.length && [EnumToken.CommentTokenType, EnumToken.WhitespaceTokenType].includes(array[index].typ)) {

                    index++;
                }

                if (array[index] == null || array[index].typ == EnumToken.CommaTokenType) {

                    continue;
                }

                Object.assign(array[startIndex], {
                    typ: (value as IdentToken).val.toLowerCase() == 'not' ? EnumToken.MediaFeatureNotTokenType : EnumToken.MediaFeatureOnlyTokenType,
                    val: array[index]
                });

                array.splice(startIndex + 1, index - startIndex);
                continue;
            }
        }

        if (value.typ == EnumToken.FunctionTokenType && value.val == 'selector') {

            parseSelector(value.chi);
        }

        if (value.typ == EnumToken.ParensTokenType || (value.typ == EnumToken.FunctionTokenType && ['media', 'supports', 'style', 'scroll-state'].includes((<FunctionToken>value).val))) {

            let i: number;
            let nameIndex: number = -1;
            let valueIndex: number = -1;

            const dashedIdent: boolean = value.typ == EnumToken.FunctionTokenType && (value as FunctionToken).val == 'style';

            for (let i = 0; i < (value as FunctionToken | ParensToken).chi.length; i++) {

                if ((value as FunctionToken | ParensToken).chi[i].typ == EnumToken.CommentTokenType || (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.WhitespaceTokenType) {

                    continue;
                }

                if ((dashedIdent && (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.DashedIdenTokenType) || (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.IdenTokenType || (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.FunctionTokenType || (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.ColorTokenType) {

                    nameIndex = i;
                }

                break;
            }

            if (nameIndex == -1) {

                continue;
            }

            for (let i = nameIndex + 1; i < (value as FunctionToken | ParensToken).chi.length; i++) {

                if ((value as FunctionToken | ParensToken).chi[i].typ == EnumToken.CommentTokenType || (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.WhitespaceTokenType) {

                    continue;
                }

                if ((value as FunctionToken | ParensToken).chi[i].typ == EnumToken.LiteralTokenType && ((value as FunctionToken | ParensToken).chi[i] as LiteralToken).val.startsWith(':') && isDimension(((value as FunctionToken | ParensToken).chi[i] as LiteralToken).val.slice(1))) {

                    (value as ParensToken | FunctionToken).chi.splice(i, 1, {
                            typ: EnumToken.ColonTokenType,
                        },
                        Object.assign((value as FunctionToken | ParensToken).chi[i], parseDimension(((value as FunctionToken | ParensToken).chi[i] as LiteralToken).val.slice(1)))
                    );

                    i--;
                    continue;
                }

                if (nameIndex != -1 && (value as FunctionToken | ParensToken).chi[i].typ == EnumToken.PseudoClassTokenType) {

                    (value as ParensToken | FunctionToken).chi.splice(i, 1, {
                            typ: EnumToken.ColonTokenType,
                        },
                        Object.assign((value as FunctionToken | ParensToken).chi[i], {
                            typ: EnumToken.IdenTokenType,
                            val: ((value as FunctionToken | ParensToken).chi[i] as LiteralToken).val.slice(1)
                        })
                    );

                    i--;
                    continue;
                }

                valueIndex = i;
                break;
            }

            if (valueIndex == -1) {

                continue;
            }

            for (i = nameIndex + 1; i < (value as FunctionToken | ParensToken).chi.length; i++) {

                if ([
                    EnumToken.GtTokenType, EnumToken.LtTokenType,
                    EnumToken.GteTokenType, EnumToken.LteTokenType,
                    EnumToken.ColonTokenType
                ].includes((value as FunctionToken | ParensToken).chi[valueIndex].typ)) {

                    const val = (value as FunctionToken | ParensToken).chi.splice(valueIndex, 1)[0] as Token;
                    const node = (value as FunctionToken | ParensToken).chi.splice(nameIndex, 1)[0] as IdentToken;

                    // 'background'
                    // @ts-ignore
                    if (node.typ == EnumToken.ColorTokenType && (node as ColorToken).kin == ColorType.DPSYS) {

                        // @ts-ignore
                        delete node.kin;
                        node.typ = EnumToken.IdenTokenType;
                    }

                    while ((value as FunctionToken | ParensToken).chi[0]?.typ == EnumToken.WhitespaceTokenType) {

                        (value as FunctionToken | ParensToken).chi.shift();
                    }

                    const t: Token[] = [<MediaQueryConditionToken>{
                        typ: EnumToken.MediaQueryConditionTokenType,
                        l: node,
                        op: {typ: val.typ},
                        r: (value as FunctionToken | ParensToken).chi.slice()
                    }];

                    (value as FunctionToken | ParensToken).chi.length = 0;
                    (value as FunctionToken | ParensToken).chi.push(...t);
                }
            }
        }
    }

    return tokens;
}

/**
 * parse selector
 * @param tokens
 */
export function parseSelector(tokens: Token[]): Token[] {

    for (const {value, parent} of walkValues(tokens)) {

        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType ||
            value.typ == EnumToken.IdenTokenType ||
            value.typ == EnumToken.HashTokenType) {

            continue;
        }

        if (parent == null) {

            if (value.typ == EnumToken.GtTokenType) {

                // @ts-ignore
                value.typ = EnumToken.ChildCombinatorTokenType;
            }

            else if (value.typ == EnumToken.LiteralTokenType) {

                if ((<LiteralToken>value).val.charAt(0) == '&') {

                    // @ts-ignore
                    (<NestingSelectorToken>value).typ = EnumToken.NestingSelectorTokenType;
                    // @ts-ignore
                    delete value.val;
                } else if ((<LiteralToken>value).val.charAt(0) == '.') {

                    if (!isIdent((<LiteralToken>value).val.slice(1))) {

                        // @ts-ignore
                        (<InvalidClassSelectorToken>value).typ = EnumToken.InvalidClassSelectorTokenType;
                    } else {

                        // @ts-ignore
                        (<ClassSelectorToken>value).typ = EnumToken.ClassSelectorTokenType;
                    }
                }

                if (['*', '>', '+', '~'].includes((<LiteralToken>value).val)) {

                    switch ((<LiteralToken>value).val) {

                        case '*':
                            // @ts-ignore
                            (<UniversalSelectorToken>value).typ = EnumToken.UniversalSelectorTokenType;
                            break;
                        case '>':
                            // @ts-ignore
                            (<ChildCombinatorToken>value).typ = EnumToken.ChildCombinatorTokenType;
                            break;
                        case '+':
                            // @ts-ignore
                            (<NextSiblingCombinatorToken>value).typ = EnumToken.NextSiblingCombinatorTokenType;
                            break;
                        case '~':
                            // @ts-ignore
                            (<SubsequentCombinatorToken>value).typ = EnumToken.SubsequentSiblingCombinatorTokenType;
                            break;
                    }

                    // @ts-ignore
                    delete value.val;
                }

            } else if (value.typ == EnumToken.ColorTokenType) {

                if ((value as ColorToken).kin == ColorType.LIT || (value as ColorToken).kin == ColorType.HEX || (value as ColorToken).kin == ColorType.SYS || (value as ColorToken).kin == ColorType.DPSYS) {

                    if ((value as ColorToken).kin == ColorType.HEX) {

                        if (!isIdent((value as ColorToken).val.slice(1))) {

                            continue;
                        }

                        // @ts-ignore
                        value.typ = EnumToken.HashTokenType;
                    } else {

                        // @ts-ignore
                        value.typ = EnumToken.IdenTokenType;
                    }

                    // @ts-ignore
                    delete value.kin;
                }
            }
        }
    }

    let i: number = 0;
    const combinators: EnumToken[] = [
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType
    ];

    for (; i < tokens.length; i++) {

        if (combinators.includes(tokens[i].typ)) {

            if (i + 1 < tokens.length && [EnumToken.WhitespaceTokenType, EnumToken.DescendantCombinatorTokenType].includes(tokens[i + 1].typ)) {

                tokens.splice(i + 1, 1);
            }

            if (i > 0 && [EnumToken.WhitespaceTokenType, EnumToken.DescendantCombinatorTokenType].includes(tokens[i - 1].typ)) {

                tokens.splice(i - 1, 1);
                i--;
                continue;
            }
        }

        if (tokens[i].typ == EnumToken.WhitespaceTokenType) {

            tokens[i].typ = EnumToken.DescendantCombinatorTokenType;
        }
    }

    return tokens;
}

/**
 * parse css string
 * @param src
 * @param options
 */
export function parseString(src: string, options: { location: boolean } = {location: false}): Token[] {

    return parseTokens([...tokenize(src)].reduce((acc, t) => {

        if (t.hint == EnumToken.EOFTokenType) {

            return acc;
        }

        const token: Token = getTokenType(t.token, t.hint);

        if (options.location) {

            Object.assign(token, {loc: t.sta});
        }

        acc.push(token)

        return acc;
    }, [] as Token[]));
}

export function getTokenType(val: string, hint?: EnumToken): Token {

    if (hint != null) {

        return enumTokenHints.has(hint) ? <Token>{typ: hint} : <Token>{typ: hint, val};
    }

    switch (val) {
        case ' ':
            return <WhitespaceToken>{typ: EnumToken.WhitespaceTokenType};
        case ';':
            return <SemiColonToken>{typ: EnumToken.SemiColonTokenType};
        case '{':
            return <BlockStartToken>{typ: EnumToken.BlockStartTokenType};
        case '}':
            return <BlockEndToken>{typ: EnumToken.BlockEndTokenType};
        case '[':
            return <AttrStartToken>{typ: EnumToken.AttrStartTokenType};
        case ']':
            return <AttrEndToken>{typ: EnumToken.AttrEndTokenType};
        case ':':
            return <ColonToken>{typ: EnumToken.ColonTokenType};
        case ')':
            return <ParensEndToken>{typ: EnumToken.EndParensTokenType};
        case '(':
            return <ParensStartToken>{typ: EnumToken.StartParensTokenType};
        case '=':
            return <DelimToken>{typ: EnumToken.DelimTokenType};
        case ',':
            return <CommaToken>{typ: EnumToken.CommaTokenType};
        case '<':
            return <LessThanToken>{typ: EnumToken.LtTokenType};
        case '>':
            return <GreaterThanToken>{typ: EnumToken.GtTokenType};
    }

    if (isPseudo(val)) {

        return val.endsWith('(') ? <PseudoClassFunctionToken>{
                typ: EnumToken.PseudoClassFuncTokenType,
                val: val.slice(0, -1),
                chi: <Token[]>[]
            }
            : (
                // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
                val.startsWith('::') || pseudoElements.includes(val) ? <PseudoElementToken>{
                        typ: EnumToken.PseudoElementTokenType,
                        val
                    } :
                    <PseudoClassToken>{
                        typ: EnumToken.PseudoClassTokenType,
                        val
                    });
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

        if (['linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient', 'image', 'image-set', 'element', 'cross-fade', 'paint'].includes(val)) {
            return <FunctionImageToken>{
                typ: EnumToken.ImageFunctionTokenType,
                val,
                chi: <Token[]>[]
            };
        }

        if (timingFunc.includes(val.toLowerCase())) {
            return <TimingFunctionToken>{
                typ: EnumToken.TimingFunctionTokenType,
                val,
                chi: <Token[]>[]
            };
        }

        if (timelineFunc.includes(val)) {
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
        }
    }

    if (isNumber(val)) {
        return <NumberToken>{
            typ: EnumToken.NumberTokenType,
            val
        }
    }

    if (isPercentage(val)) {
        return <PercentageToken>{
            typ: EnumToken.PercentageTokenType,
            val: val.slice(0, -1)
        }
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
            kin: ColorType.LIT
        };
    }

    if (isIdent(val)) {

        if (systemColors.has(v)) {
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val,
                kin: ColorType.SYS
            };
        }

        if (deprecatedSystemColors.has(v)) {
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val,
                kin: ColorType.DPSYS
            };
        }

        return <IdentToken>{
            typ: val.startsWith('--') ? EnumToken.DashedIdenTokenType : EnumToken.IdenTokenType,
            val
        }
    }

    if (val.charAt(0) == '#' && isHexColor(val)) {

        return <ColorToken>{
            typ: EnumToken.ColorTokenType,
            val,
            kin: ColorType.HEX
        }
    }

    if (val.charAt(0) == '#' && isHash(val)) {
        return <HashToken>{
            typ: EnumToken.HashTokenType,
            val
        }
    }

    if ('"\''.includes(val.charAt(0))) {
        return <UnclosedStringToken>{
            typ: EnumToken.UnclosedStringTokenType,
            val
        }
    }

    return <LiteralToken>{
        typ: EnumToken.LiteralTokenType,
        val
    }
}

/**
 * parse token array into a tree structure
 * @param tokens
 * @param options
 */
export function parseTokens(tokens: Token[], options: ParseTokenOptions = {}): Token[] {

    for (let i = 0; i < tokens.length; i++) {

        const t: Token = tokens[i];

        if (t.typ == EnumToken.WhitespaceTokenType && ((i == 0 ||
                i + 1 == tokens.length ||
                [EnumToken.CommaTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType].includes(tokens[i + 1].typ)) ||
            (i > 0 && trimWhiteSpace.includes(tokens[i - 1].typ)))) {

            tokens.splice(i--, 1);
            continue;
        }

        if (t.typ == EnumToken.ColonTokenType) {

            const typ: EnumToken = tokens[i + 1]?.typ;

            if (typ != null) {

                if (typ == EnumToken.FunctionTokenType) {

                    tokens[i + 1].typ = EnumToken.PseudoClassFuncTokenType;
                } else if (typ == EnumToken.IdenTokenType) {

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

            const attr: AttrToken = Object.assign(t, {
                typ: inAttr == 0 ? EnumToken.AttrTokenType : EnumToken.InvalidAttrTokenType,
                chi: tokens.splice(i + 1, k - i)
            } as AttrToken) as AttrToken;

            // @ts-ignore
            if (attr.chi.at(-1).typ == EnumToken.AttrEndTokenType) {
                // @ts-ignore
                attr.chi.pop();
            }

            // @ts-ignore
            if (attr.chi.length > 1) {

                // @ts-ignore
                parseTokens(attr.chi, (t as AttrToken).typ, options);
            }

            let m: number = (<Token[]>attr.chi).length;
            let val: Token;

            for (m = 0; m < (<Token[]>attr.chi).length; m++) {

                val = (<Token[]>attr.chi)[m];

                if (val.typ == EnumToken.StringTokenType) {
                    const slice = (val as StringToken).val.slice(1, -1);
                    if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                        Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
                    }
                } else if (val.typ == EnumToken.LiteralTokenType && (val as LiteralToken).val == '|') {

                    let upper: number = m;
                    let lower: number = m;

                    while (++upper < (<Token[]>attr.chi).length) {

                        if ((<Token[]>attr.chi)[upper].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    while (lower-- > 0) {

                        if ((<Token[]>attr.chi)[lower].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    // @ts-ignore
                    (<Token[]>attr.chi)[m] = <NameSpaceAttributeToken>{
                        typ: EnumToken.NameSpaceAttributeTokenType,
                        l: (<Token[]>attr.chi)[lower],
                        r: (<Token[]>attr.chi)[upper]
                    };

                    (<Token[]>attr.chi).splice(upper, 1);

                    if (lower >= 0) {

                        (<Token[]>attr.chi).splice(lower, 1);
                        m--;
                    }
                } else if ([
                    EnumToken.DashMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DelimTokenType
                ].includes((<Token[]>attr.chi)[m].typ)) {

                    let upper: number = m;
                    let lower: number = m;

                    while (++upper < (<Token[]>attr.chi).length) {

                        if ((<Token[]>attr.chi)[upper].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    while (lower-- > 0) {

                        if ((<Token[]>attr.chi)[lower].typ == EnumToken.CommentTokenType) {

                            continue;
                        }

                        break;
                    }

                    val = (<Token[]>attr.chi)[lower];

                    if (val.typ == EnumToken.StringTokenType) {
                        const slice: string = (val as StringToken).val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
                        }
                    }

                    val = (<Token[]>attr.chi)[upper];

                    if (val.typ == EnumToken.StringTokenType) {
                        const slice: string = (val as StringToken).val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, {typ: EnumToken.IdenTokenType, val: slice});
                        }
                    }

                    // @ts-ignore
                    const typ = <EnumToken.DashMatchTokenType | EnumToken.StartMatchTokenType | EnumToken.ContainMatchTokenType |
                        EnumToken.EndMatchTokenType | EnumToken.IncludeMatchTokenType>(<DashMatchToken | StartMatchToken | ContainMatchToken | EndMatchToken | IncludeMatchToken | EqualMatchToken>(<Token[]>(t as AttrStartToken).chi)[m]).typ;


                    // @ts-ignore
                    (<Token[]>(t as AttrStartToken).chi)[m] = <MatchExpressionToken>{
                        typ: EnumToken.MatchExpressionTokenType,
                        op: {
                            // @ts-ignore
                            typ: typ == EnumToken.DelimTokenType ? EnumToken.EqualMatchTokenType : typ
                        },
                        l: (<Token[]>(t as AttrStartToken).chi)[lower],
                        r: (<Token[]>(t as AttrStartToken).chi)[upper]
                    }

                    if (isIdentColor(((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).l)) {

                        ((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).l.typ = EnumToken.IdenTokenType;
                    }

                    if (isIdentColor(((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).r)) {

                        ((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).r.typ = EnumToken.IdenTokenType;
                    }

                    (<Token[]>(t as AttrStartToken).chi).splice(upper, 1);
                    (<Token[]>(t as AttrStartToken).chi).splice(lower, 1);

                    upper = m;
                    m--;

                    while (upper < ((t as AttrStartToken).chi as Token[]).length && (<Token[]>(t as AttrStartToken).chi)[upper].typ == EnumToken.WhitespaceTokenType) {
                        upper++;
                    }

                    if (upper < ((t as AttrStartToken).chi as Token[]).length &&
                        (<Token[]>(t as AttrStartToken).chi)[upper].typ == EnumToken.IdenTokenType &&
                        ['i', 's'].includes((<IdentToken>(<Token[]>(t as AttrStartToken).chi)[upper]).val.toLowerCase())) {

                        (<MatchExpressionToken>(<Token[]>(t as AttrStartToken).chi)[m]).attr = <'i' | 's'>(<IdentToken>(<Token[]>(t as AttrStartToken).chi)[upper]).val;
                        (<Token[]>(t as AttrStartToken).chi).splice(upper, 1);
                    }
                }
            }

            m = (<Token[]>(t as AttrStartToken).chi).length;

            while ((<Token[]>(t as AttrStartToken).chi).at(-1)?.typ == EnumToken.WhitespaceTokenType) {

                (<Token[]>(t as AttrStartToken).chi).pop();
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

            if (t.typ == EnumToken.FunctionTokenType && mathFuncs.includes((<FunctionToken>t).val)) {

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

                t.chi = splitTokenList(t.chi).reduce((acc: Token[], t: Token[]): Token[] => {

                    if (acc.length > 0) {
                        acc.push({typ: EnumToken.CommaTokenType});
                    }

                    acc.push(buildExpression(t));
                    return acc;
                }, []);

            } else if (t.typ == EnumToken.FunctionTokenType && ['minmax', 'fit-content', 'repeat'].includes((<FunctionToken>t).val)) {

                // @ts-ignore
                t.typ = EnumToken.GridTemplateFuncTokenType;
            } else if (t.typ == EnumToken.StartParensTokenType) {

                // @ts-ignore
                t.typ = EnumToken.ParensTokenType;
            }

            // @ts-ignore
            if (options.parseColor && t.typ == EnumToken.FunctionTokenType && isColor(t)) {

                parseColor(t);
                continue;
            }

            if (t.typ == EnumToken.UrlFunctionTokenType) {

                // @ts-ignore
                if ((t as FunctionURLToken).chi[0]?.typ == EnumToken.StringTokenType) {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);

                    // @ts-ignore
                    if ((t as FunctionURLToken).chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        (t as FunctionURLToken).chi[0].typ = EnumToken.UrlTokenTokenType;

                        // @ts-ignore
                        (t as FunctionURLToken).chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                    }
                }

                if ((t as FunctionURLToken).chi[0]?.typ == EnumToken.UrlTokenTokenType) {
                    if (options.src !== '' && options.resolveUrls) {
                        // @ts-ignore
                        (t as FunctionURLToken).chi[0].val = options.resolve((t as FunctionURLToken).chi[0].val, options.src, options.cwd).relative;
                    }
                }
            }

            // @ts-ignore
            if (t.chi.length > 0) {
                if (t.typ == EnumToken.PseudoClassFuncTokenType && (t as PseudoClassFunctionToken).val == ':is' && options.minify) {

                    const count: number = (t as PseudoClassFunctionToken).chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType).length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == EnumToken.CommaTokenType && (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1))) {

                        tokens.splice(i, 1, ...(t as PseudoClassFunctionToken).chi);
                        i = Math.max(0, i - (t as PseudoClassFunctionToken).chi.length);
                    }
                }
            }
        }
    }

    return tokens;
}