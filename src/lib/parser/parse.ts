import {
    isAtKeyword,
    isColor,
    isDimension,
    isFlex,
    isFunction,
    isHash,
    isHexColor,
    isIdent,
    isIdentStart,
    isNumber,
    isPercentage,
    isPseudo,
    mathFuncs,
    mediaTypes,
    parseDimension,
    pseudoElements,
    webkitPseudoAliasMap
} from "../syntax/index.ts";
import {parseDeclarationNode} from './utils/index.ts';
import {renderToken} from "../renderer/index.ts";
import {COLORS_NAMES} from "../renderer/color/index.ts";
import {
    combinators,
    definedPropertySettings,
    EnumToken,
    expand,
    funcLike,
    minify,
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
    ParserOptions,
    ParseTokenOptions,
    PercentageToken,
    Position,
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
import {deprecatedSystemColors, systemColors} from "../renderer/color/utils/index.ts";
import {validateAtRule, validateSelector} from "../validation/index.ts";
import type {ValidationResult} from "../../@types/validation.d.ts";
import {validateAtRuleKeyframes} from "../validation/at-rules/index.ts";
import {validateKeyframeSelector} from "../validation/syntaxes/index.ts";

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
        validation: true,
        lenient: true,
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
    let context: AstRuleList | AstInvalidAtRule | AstInvalidRule = ast;

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
    const rawTokens: TokenizeResult[] = [];

    while (item = iter.next().value) {

        stats.bytesIn = item.bytesIn;

        rawTokens.push(item);

        // doParse error
        if (item.hint != null && BadTokensTypes.includes(item.hint)) {

            // bad token
            continue;
        }

        if (item.hint != EnumToken.EOFTokenType) {

            tokens.push(item);
        }

        if (item.token == ';' || item.token == '{') {

            let node: AstAtRule | AstRule | AstKeyFrameRule | AstKeyframAtRule | AstInvalidRule | null = await parseNode(tokens, context, stats, options, errors, src, map, rawTokens);
            rawTokens.length = 0;

            if (node != null) {

                // @ts-ignore
                stack.push(<AstAtRule | AstRule | AstKeyFrameRule | AstInvalidRule>node);
                // @ts-ignore
                context = node;
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

            await parseNode(tokens, context, stats, options, errors, src, map, rawTokens);
            rawTokens.length = 0;

            const previousNode = stack.pop() as AstNode;

            // @ts-ignore
            context = stack[stack.length - 1] ?? ast;

            // @ts-ignore
            if (previousNode != null && previousNode.typ == EnumToken.InvalidRuleTokenType) {

                // @ts-ignore
                const index: number = context.chi.findIndex(node => node == previousNode);

                if (index > -1) {

                    // @ts-ignore
                    context.chi.splice(index, 1);
                }
            }

            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                // @ts-ignore
                context.chi.pop();
            }

            tokens = [];
            map = new Map;
        }
    }

    if (tokens.length > 0) {

        await parseNode(tokens, context, stats, options, errors, src, map, rawTokens);
        rawTokens.length = 0;

        if (context != null && context.typ == EnumToken.InvalidRuleTokenType) {

            // @ts-ignore
            const index: number = context.chi.findIndex((node: AstNode): boolean => node == context);

            if (index > -1) {

                (context as AstInvalidRule).chi.splice(index, 1);
            }
        }
    }

    while (stack.length > 0 && context != ast) {

        const previousNode: AstAtRule | AstRule = <AstAtRule | AstRule>stack.pop();

        // @ts-ignore
        context = stack[stack.length - 1] ?? ast;

        // remove empty nodes
        // @ts-ignore
        if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
            // @ts-ignore
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

async function parseNode(results: TokenizeResult[], context: AstRuleList | AstInvalidRule | AstInvalidAtRule, stats: {
    bytesIn: number;
    importedBytesIn: number;
}, options: ParserOptions, errors: ErrorDescription[], src: string, map: Map<Token, Position>, rawTokens: TokenizeResult[]): Promise<AstRule | AstAtRule | AstKeyFrameRule | AstKeyframAtRule | AstInvalidRule | null> {

    let tokens: Token[] = [] as Token[];

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

        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
            tokens.shift();
        }

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

                            errors.push({action: 'drop', message: 'invalid @import', location: {src, ...position}});
                            return null;
                        }

                    }

                    // @ts-ignore
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

            // @ts-ignore
            if (tokens[0].typ == EnumToken.StringTokenType) {

                if (options.resolveImport) {

                    const url: string = (<UrlToken>tokens[0]).val.slice(1, -1);

                    try {

                        // @ts-ignore
                        const root: ParseResult = await options.load(url, <string>options.src).then((src: string) => {

                            return doParse(src, Object.assign({}, options, {
                                minify: false,
                                setParent: false,
                                // @ts-ignore
                                src: options.resolve(url, options.src).absolute
                            }))
                        });

                        stats.importedBytesIn += root.stats.bytesIn;

                        if (root.ast.chi.length > 0) {

                            // @todo - filter charset, layer and scope
                            // @ts-ignore
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
        if (atRule.val == 'charset') {

            let spaces: number = 0;

            // https://developer.mozilla.org/en-US/docs/Web/CSS/@charset
            for (let k = 1; k < rawTokens.length; k++) {

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
                        location: {src, ...(map.get(atRule) ?? position)}
                    });

                    return null;
                }

                if (rawTokens[k].hint != EnumToken.StringTokenType || rawTokens[k].token[0] != '"') {

                    errors.push({
                        action: 'drop',
                        message: '@charset expects a "<charset>"',
                        // @ts-ignore
                        location: {src, ...(map.get(atRule) ?? position)}
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

            acc.push(renderToken(curr, {removeComments: true}));
            return acc
        }, []);

        const nam: string = renderToken(atRule, {removeComments: true});

        // @ts-ignore
        const node: AstAtRule | AstKeyframAtRule = {
            typ: /^(-[a-z]+-)?keyframes$/.test(nam) ? EnumToken.KeyframeAtRuleNodeType : EnumToken.AtRuleNodeType,
            nam,
            // tokens: t,
            val: raw.join('')
        };

        Object.defineProperties(node, {
            tokens: {...definedPropertySettings, enumerable: false, value: tokens.slice()},
            raw: {...definedPropertySettings, value: raw}
        });

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

        if (options.validation) {

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

            const valid: ValidationResult = isValid ? (node.typ == EnumToken.KeyframeAtRuleNodeType ? validateAtRuleKeyframes(<AstKeyframAtRule>node, options, context) : validateAtRule(node, options, context)) : {
                valid: ValidationLevel.Drop,
                node,
                matches: [] as Token[],
                syntax: '@' + node.nam,
                error: '@' + node.nam + ' not allowed here',
                tokens
            } as ValidationResult;

            if (valid.valid == ValidationLevel.Drop) {

                errors.push({
                    action: 'drop',
                    message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, {minify: false}), '') + '"',
                    // @ts-ignore
                    location: {src, ...(map.get(valid.node) ?? position)}
                });

                // @ts-ignore
                node.typ = EnumToken.InvalidAtRuleTokenType;
            } else {

                node.val = (node.tokens as Token[]).reduce((acc, curr) => acc + renderToken(curr, {
                    minify: false,
                    removeComments: true
                }), '');
            }
        }

        // @ts-ignore
        context.chi.push(node);

        Object.defineProperty(node, 'parent', {...definedPropertySettings, value: context});

        return delim.typ == EnumToken.BlockStartTokenType ? node : null;
    } else {
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {

            const position: Position = <Position>map.get(tokens[0]);
            const uniq = new Map<string, string[]>;

            parseTokens(tokens, {minify: true});

            const ruleType: EnumToken = context.typ == EnumToken.KeyframeAtRuleNodeType ? EnumToken.KeyFrameRuleNodeType : EnumToken.RuleNodeType;

            if (ruleType == EnumToken.RuleNodeType) {

                parseSelector(tokens);
            }

            if (options.validation) {

                // @ts-ignore
                const valid: ValidationResult = ruleType == EnumToken.KeyFrameRuleNodeType ? validateKeyframeSelector(tokens, options) : validateSelector(tokens, options, context);

                if (valid.valid != ValidationLevel.Valid) {

                    const node: AstInvalidRule = {
                        typ: EnumToken.InvalidRuleTokenType,
                        sel: tokens.reduce((acc: string, curr: Token) => acc + renderToken(curr, {minify: false}), ''),
                        chi: []
                    }

                    errors.push({
                        action: 'drop',
                        message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, {minify: false}), '') + '"',
                        // @ts-ignore
                        location: {src, ...(map.get(valid.node) ?? position)}
                    });

                    // @ts-ignore
                    context.chi.push(node);
                    Object.defineProperty(node, 'parent', {...definedPropertySettings, value: context});

                    return node;
                }
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
                        // uniqTokens.push([]);
                    } else {

                        acc[acc.length - 1].push(t);
                        // uniqTokens[uniqTokens.length - 1].push(curr);
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
            Object.defineProperty(node, 'parent', {...definedPropertySettings, value: context});

            return node;
        } else {

            let name: Token[] | null = null;
            let value: Token[] | null = null;

            for (let i = 0; i < tokens.length; i++) {

                if (tokens[i].typ == EnumToken.CommentTokenType) {

                    continue;
                }

                if (name == null && [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType].includes(tokens[i].typ)) {

                    name = tokens.slice(0, i + 1);

                } else if (name != null && funcLike.concat([
                    EnumToken.LiteralTokenType,
                    EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType,
                    EnumToken.PseudoClassTokenType, EnumToken.PseudoClassFuncTokenType
                ]).includes(tokens[i].typ)) {

                    if ((<IdentToken>tokens[i]).val.charAt(0) == ':') {

                        Object.assign(tokens[i], getTokenType((<IdentToken>tokens[i]).val.slice(1)));
                    }

                    if ('chi' in tokens[i]) {

                        (<FunctionToken>tokens[i]).typ = EnumToken.FunctionTokenType;
                    }

                    value = parseTokens(tokens.slice(i), {
                        parseColor: options.parseColor,
                        src: options.src,
                        resolveUrls: options.resolveUrls,
                        resolve: options.resolve,
                        cwd: options.cwd
                    });

                    break;
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

                    break;
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

            const nam: string = renderToken(name.shift() as Token, {removeComments: true})

            if (value == null || (!nam.startsWith('--') && value.length == 0)) {

                errors.push(<ErrorDescription>{
                    action: 'drop',
                    message: 'doParse: invalid declaration',
                    location: {src, ...position}
                });
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

                                (parent as FunctionToken).chi.splice((parent as FunctionToken).chi.indexOf(node), 1,{typ:  (node as LiteralToken).val[0] == '/' ? EnumToken.Div : EnumToken.Mul}, ...parseString((node as LiteralToken).val.slice(1)));
                            }
                        }
                    }
                }
            }

            const node: AstDeclaration = {
                typ: EnumToken.DeclarationNodeType,
                // @ts-ignore
                nam,
                // @ts-ignore
                val: value
            }

            const result: AstDeclaration | null = parseDeclarationNode(node, errors, src, position);

            if (result != null) {

                // @ts-ignore
                context.chi.push(result);
                Object.defineProperty(result, 'parent', {...definedPropertySettings, value: context});
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
function parseAtRulePrelude(tokens: Token[], atRule: AtRuleToken): Token[] {

    // @ts-ignore
    for (const {value, parent} of walkValues(tokens, null, null, true)) {

        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType
        ) {

            continue;
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

                valueIndex = i;
                break;
            }

            if (valueIndex == -1) {

                // @ts-ignore
                // value.chi[nameIndex].typ = EnumToken.MediaFeatureTokenType;
                continue;
                // return tokens;
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
                    if (node.typ == EnumToken.ColorTokenType && (node as ColorToken).kin == 'dpsys') {

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

    for (const {value, previousValue, nextValue, parent} of walkValues(tokens)) {

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

            // @ts-ignore
            else if (value.typ == EnumToken.WhitespaceTokenType) {

                if (nextValue != null && nextValue.typ == EnumToken.LiteralTokenType) {

                    if (['>', '+', '~'].includes((<LiteralToken>nextValue).val)) {

                        switch ((<LiteralToken>value).val) {

                            case '>':
                                // @ts-ignore
                                nextValue.typ = EnumToken.ChildCombinatorTokenType;
                                break;

                            case '+':
                                // @ts-ignore
                                nextValue.typ = EnumToken.NextSiblingCombinatorTokenType;
                                break;

                            case '~':
                                // @ts-ignore
                                nextValue.typ = EnumToken.SubsequentSiblingCombinatorTokenType;
                                break;
                        }

                        // @ts-ignore
                        delete (<LiteralToken>nextValue).val;

                        continue;
                    }
                }

                if (previousValue != null && [
                    EnumToken.ChildCombinatorTokenType,
                    EnumToken.DescendantCombinatorTokenType,
                    EnumToken.NextSiblingCombinatorTokenType,
                    EnumToken.SubsequentSiblingCombinatorTokenType,
                    EnumToken.ColumnCombinatorTokenType,
                    EnumToken.NameSpaceAttributeTokenType,
                    EnumToken.CommaTokenType
                ].includes(previousValue.typ)) {

                    continue;
                }

                // @ts-ignore
                value.typ = EnumToken.DescendantCombinatorTokenType;
            } else if (value.typ == EnumToken.LiteralTokenType) {

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

                // @ts-ignore
                if ((<DelimToken>value).typ == EnumToken.DelimTokenType) {

                    // @ts-ignore
                    (<NextSiblingCombinatorToken>value).typ = EnumToken.NextSiblingCombinatorTokenType;

                } else if (['*', '>', '+', '~'].includes((<LiteralToken>value).val)) {

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
                    // @ts-ignore
                    delete value.val;
                }

            } else if (value.typ == EnumToken.ColorTokenType) {

                if ((value as ColorToken).kin == 'lit' || (value as ColorToken).kin == 'hex' || (value as ColorToken).kin == 'sys' || (value as ColorToken).kin == 'dpsys') {

                    if ((value as ColorToken).kin == 'hex') {

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

// export async function parseDeclarations(src: string, options: ParserOptions = {}): Promise<AstDeclaration[]> {
//
//     return doParse(`.x{${src}`, options).then((result: ParseResult) => <AstDeclaration[]>(<AstRule>result.ast.chi[0]).chi.filter(t => t.typ == EnumToken.DeclarationNodeType));
// }

/**
 * parse string
 * @param src
 * @param options
 */
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

    if (hint != null) {

        return enumTokenHints.has(hint) ? <Token>{typ: hint} : <Token>{typ: hint, val};
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

        return <DelimToken>{typ: EnumToken.DelimTokenType};
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

        if (systemColors.has(val.toLowerCase())) {
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val,
                kin: 'sys'
            };
        }

        if (deprecatedSystemColors.has(val.toLowerCase())) {
            return <ColorToken>{
                typ: EnumToken.ColorTokenType,
                val,
                kin: 'dpsys'
            };
        }


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

/**
 * parse token list
 * @param tokens
 * @param options
 */
export function parseTokens(tokens: Token[], options: ParseTokenOptions = {}): Token[] {

    for (let i = 0; i < tokens.length; i++) {

        const t: Token = tokens[i];

        if (t.typ == EnumToken.PseudoClassFuncTokenType) {

            if ((t as PseudoClassFunctionToken).val.slice(1) in webkitPseudoAliasMap) {

                (t as PseudoClassFunctionToken).val = ':' + webkitPseudoAliasMap[(t as PseudoClassFunctionToken).val.slice(1)];
            }

        } else if (t.typ == EnumToken.PseudoClassTokenType) {

            if ((t as PseudoClassToken).val.slice(1) in webkitPseudoAliasMap) {

                (t as PseudoClassToken).val = ':' + webkitPseudoAliasMap[(t as PseudoClassToken).val.slice(1)];
            }
        }

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

                    (<PseudoClassFunctionToken>tokens[i + 1]).val = ':' + ((<PseudoClassFunctionToken>tokens[i + 1]).val in webkitPseudoAliasMap ? webkitPseudoAliasMap[(<PseudoClassFunctionToken>tokens[i + 1]).val] : (<PseudoClassFunctionToken>tokens[i + 1]).val);
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
                /*(<AttrToken>t).chi =*/
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
                    };

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
                (t as ColorToken).kin = t.val;

                // @ts-ignore
                if (((t as ColorToken).chi as Token[])[0].typ == EnumToken.IdenTokenType) {

                    // @ts-ignore
                    if (((t as ColorToken).chi as Token[])[0].val == 'from') {

                        // @ts-ignore
                        (t as ColorToken).cal = 'rel';
                    }

                    // @ts-ignore
                    else if ((t as ColorToken).val == 'color-mix' && ((t as ColorToken).chi as Token[])[0].val == 'in') {

                        // @ts-ignore
                        (t as ColorToken).cal = 'mix';
                    } else { // @ts-ignore
                        if ((t as ColorToken).val == 'color') {
                            // @ts-ignore
                            (t as ColorToken).cal = 'col';
                        }
                    }
                }

                const filter: EnumToken[] = [EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType];

                if ((t as FunctionToken).val != 'light-dark') {

                    filter.push(EnumToken.CommaTokenType);
                }

                (t as FunctionToken).chi = (t as FunctionToken).chi.filter((t: Token): boolean => !filter.includes(t.typ));
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
                    //
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

            continue;
        }

        if (options.parseColor) {

            if (t.typ == EnumToken.IdenTokenType) {
                // named color
                const value: string = (t as IdentToken).val.toLowerCase();

                if (value in COLORS_NAMES) {
                    Object.assign(t, {
                        typ: EnumToken.ColorTokenType,
                        val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                        kin: 'hex'
                    });
                }

                continue;
            }

            if (t.typ == EnumToken.HashTokenType && isHexColor((t as HashToken).val)) {
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