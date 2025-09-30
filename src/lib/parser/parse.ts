import {
    isAtKeyword,
    isColor,
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
import {renderToken} from "../renderer/index.ts";
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
    WalkerEvent,
    WalkerOptionEnum,
    walkValues
} from "../ast/index.ts";
import {tokenize, tokenizeStream} from "./tokenize.ts";
import type {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstInvalidAtRule,
    AstInvalidDeclaration,
    AstInvalidRule,
    AstKeyFrameRule,
    AstKeyframesAtRule,
    AstKeyframesRule,
    AstNode,
    AstRule,
    AstRuleList,
    AstStyleSheet,
    AtRuleToken,
    AttrEndToken,
    AttrStartToken,
    AttrToken,
    BinaryExpressionToken,
    BlockEndToken,
    BlockStartToken,
    ClassSelectorToken,
    ColonToken,
    ColorToken,
    CommaToken,
    ComposesSelectorToken,
    ContainMatchToken,
    DashedIdentToken,
    DashMatchToken,
    DelimToken,
    DimensionToken,
    EndMatchToken,
    EqualMatchToken,
    ErrorDescription,
    FunctionImageToken,
    FunctionToken,
    FunctionURLToken,
    GenericVisitorAstNodeHandlerMap,
    GenericVisitorHandler,
    GenericVisitorResult,
    GreaterThanToken,
    HashToken,
    IdentToken,
    IncludeMatchToken,
    LessThanToken,
    LiteralToken,
    LoadResult,
    Location,
    MatchExpressionToken,
    MediaQueryConditionToken,
    NameSpaceAttributeToken,
    NumberToken,
    ParensEndToken,
    ParensStartToken,
    ParensToken,
    ParseInfo,
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
    TimelineFunctionToken,
    TimingFunctionToken,
    Token,
    TokenizeResult,
    UnclosedStringToken,
    UrlToken,
    WhitespaceToken
} from "../../@types/index.d.ts";
import {
    colorsFunc,
    deprecatedSystemColors,
    funcLike,
    systemColors,
    timelineFunc,
    timingFunc
} from "../syntax/color/utils/index.ts";
import {validateAtRule, validateSelector} from "../validation/index.ts";
import type {ValidationResult, ValidationSyntaxResult} from "../../@types/validation.d.ts";
import {validateAtRuleKeyframes} from "../validation/at-rules/index.ts";
import {validateKeyframeSelector} from "../validation/syntaxes/index.ts";
import {evaluateSyntax, isNodeAllowedInContext} from "../validation/syntax.ts";
import {splitTokenList} from "../validation/utils/index.ts";
import {buildExpression} from "../ast/math/index.ts";
import {hash, hashAlgorithms} from "../parser/utils/hash.ts";

declare type T = AstDeclaration | AstAtRule | AstRule | AstKeyframesRule | AstKeyframesAtRule;

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

function normalizeVisitorKeyName(keyName: string): string {

    return keyName.replace(/-([a-z])/g, (all: string, one: string): string => one.toUpperCase());
}

export function replaceToken(parent: BinaryExpressionToken | (AstNode & ({ chi: Token[] } | {
    val: Token[]
})), value: Token, replacement: Token | Token[]) {

    for (const node of (Array.isArray(replacement) ? replacement : [replacement])) {

        if ('parent' in value && value.parent != node.parent) {
            Object.defineProperty(node, 'parent', {
                ...definedPropertySettings,
                value: value.parent
            })
        }
    }

    if (parent!.typ == EnumToken.BinaryExpressionTokenType) {

        if ((parent as BinaryExpressionToken).l == value) {

            (parent as BinaryExpressionToken).l = replacement as Token;
        } else {

            (parent as BinaryExpressionToken).r = replacement as Token;
        }
    } else {

        const target = 'val' in parent! && Array.isArray((parent as AstDeclaration).val) ? (parent as AstDeclaration).val : (parent as FunctionToken | ParensToken | AstAtRule | AstKeyframesAtRule | AstKeyFrameRule | AstRule | AstKeyframesRule).chi as Token[];

        // @ts-ignore
        const index: number = target.indexOf(value);

        if (index == -1) {

            return;
        }

        target.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]));
    }
}

async function generateScopedName(
    localName: string,
    filePath: string,
    pattern: string,
    hashLength = 5,
): Promise<string> {

    if (localName.startsWith('--')) {

        localName = localName.slice(2);
    }

    const matches = /.*?(([^/]+)\/)?([^/\\]*?)(\.([^?]+))?([?].*)?$/.exec(filePath);
    const folder = matches?.[2]?.replace?.(/[^A-Za-z0-9_-]/g, "_") ?? '';
    const fileBase = matches?.[3] ?? '';
    const ext = matches?.[5] ?? '';
    const path = filePath.replace(/[^A-Za-z0-9_-]/g, "_");
    // sanitize localName for safe char set (replace spaces/illegal chars)
    const safeLocal: string = localName.replace(/[^A-Za-z0-9_-]/g, "_");
    const hashString: string = `${localName}::${filePath}`;

    let result: string = '';
    let inParens: number = 0;
    let key: string = '';
    let position: number = 0;

    // Compose final scoped name. Ensure the entire class doesn't start with digit:
    for (const char of pattern) {

        position += char.length;

        if (char == '[') {

            inParens++;

            if (inParens != 1) {

                throw new Error(`Unexpected character: '${char}:${position - 1}'`);
            }

            continue;
        }

        if (char == ']') {

            inParens--;

            if (inParens != 0) {

                throw new Error(`Unexpected character: '${char}:${position - 1}'`);
            }

            let hashAlgo: string | null = null;
            let length: number | null = null;

            if (key.includes(':')) {

                const parts: string[] = key.split(':');

                if (parts.length == 2) {

                    // @ts-ignore
                    [key, length] = parts;

                    // @ts-ignore
                    if (key == 'hash' && hashAlgorithms.includes(length as string)) {

                        // @ts-ignore
                        hashAlgo = length;
                        length = null;
                    }
                }

                if (parts.length == 3) {

                    // @ts-ignore
                    [key, hashAlgo, length] = parts;
                }

                if (length != null && !Number.isInteger(+length)) {

                    throw new Error(`Unsupported hash length: '${length}'. expecting format [hash:length] or [hash:hash-algo:length]`);
                }
            }

            switch (key) {

                case 'hash':

                    result += await hash(hashString, length ?? hashLength, hashAlgo as string);
                    break;

                case 'name':

                    result += length != null ? fileBase.slice(0, +length) : fileBase;
                    break;

                case 'local':

                    result += length != null ? safeLocal.slice(0, +length) : localName;
                    break;

                case 'ext':

                    result += length != null ? ext.slice(0, +length) : ext;
                    break;

                case 'path':
                    result += length != null ? path.slice(0, +length) : path;
                    break;

                case 'folder':
                    result += length != null ? folder.slice(0, +length) : folder;
                    break;

                default:

                    throw new Error(`Unsupported key: '${key}'`);
            }

            key = '';
            continue;
        }

        if (inParens > 0) {

            key += char;
        } else {

            result += char;
        }
    }

    // if leading char is digit, prefix underscore (very rare)
    return (/^[0-9]/.test(result) ? '_' : '') + result;
}

/**
 * parse css string
 * @param iter
 * @param options
 *
 * @private
 */
export async function doParse(iter: Generator<TokenizeResult> | AsyncGenerator<TokenizeResult>, options: ParserOptions = {}): Promise<ParseResult> {

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

    if (options.module) {

        options.expandNestingRules = true;
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
        nodesCount: 0,
        tokensCount: 0,
        importedBytesIn: 0,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: []
    };

    let ast: AstStyleSheet = {
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

    let valuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
    let preValuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
    let postValuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
    let preVisitorsHandlersMap: Map<'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule',
        Array<GenericVisitorAstNodeHandlerMap<T> |
            Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
    >;
    let visitorsHandlersMap: Map<'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule',
        Array<GenericVisitorAstNodeHandlerMap<T> |
            Record<string, GenericVisitorAstNodeHandlerMap<T>>>>;
    let postVisitorsHandlersMap: Map<'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule',
        Array<GenericVisitorAstNodeHandlerMap<T> |
            Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
    >;

    const rawTokens: TokenizeResult[] = [];
    const imports: AstAtRule[] = [];

    let item: TokenizeResult;
    let node: AstAtRule | AstRule | AstKeyFrameRule | AstKeyframesAtRule | AstInvalidRule | AstDeclaration | AstComment | null;
    // @ts-ignore ignore error
    let isAsync: boolean = typeof iter[Symbol.asyncIterator] === 'function';

    if (options.visitor != null) {

        valuesHandlers = new Map as Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
        preValuesHandlers = new Map as Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
        postValuesHandlers = new Map as Map<EnumToken, Array<GenericVisitorHandler<Token>>>;

        preVisitorsHandlersMap = new Map;
        visitorsHandlersMap = new Map;
        postVisitorsHandlersMap = new Map;

        const visitors = Object.entries(options.visitor);
        let key: string;
        let value: any;
        let i: number;

        for (i = 0; i < visitors.length; i++) {

            key = visitors[i][0];
            value = visitors[i][1];

            if (Number.isInteger(+key)) {

                visitors.splice(i + 1, 0, ...Object.entries(value));
                continue;
            }

            if (Array.isArray(value)) {

                // @ts-ignore
                visitors.splice(i + 1, 0, ...value.map((item) => [key, item]));
                continue;
            }

            if (key in EnumToken) {

                if (typeof value == 'function') {

                    if (!valuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {

                        valuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                    }

                    valuesHandlers.get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!.push(value);
                } else if (typeof value == 'object' && 'type' in value && 'handler' in value && value.type in WalkerEvent) {

                    if (value.type == WalkerEvent.Enter) {

                        if (!preValuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {

                            preValuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                        }

                        preValuesHandlers.get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!.push(value.handler);
                    } else if (value.type == WalkerEvent.Leave) {

                        if (!postValuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {

                            postValuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                        }

                        postValuesHandlers.get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!.push(value.handler);
                    }
                } else {

                    errors.push({action: 'ignore', message: `doParse: visitor.${key} is not a valid key name`});
                }

            } else if (['Declaration', 'Rule', 'AtRule', 'KeyframesRule', 'KeyframesAtRule'].includes(key)) {

                if (typeof value == 'function') {

                    if (!visitorsHandlersMap.has(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')) {

                        visitorsHandlersMap.set(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule', []);
                    }

                    visitorsHandlersMap.get(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')!.push(value);

                } else if (typeof value == 'object') {

                    if ('type' in value && 'handler' in value && value.type in WalkerEvent) {

                        if (value.type == WalkerEvent.Enter) {

                            if (!preVisitorsHandlersMap.has(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')) {

                                preVisitorsHandlersMap.set(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule', []);
                            }

                            preVisitorsHandlersMap.get(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')!.push(value.handler);
                        } else if (value.type == WalkerEvent.Leave) {

                            if (!postVisitorsHandlersMap.has(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')) {

                                postVisitorsHandlersMap.set(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule', []);
                            }

                            postVisitorsHandlersMap.get(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')!.push(value.handler);
                        }
                    } else {

                        if (!visitorsHandlersMap.has(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')) {

                            visitorsHandlersMap.set(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule', []);
                        }

                        visitorsHandlersMap.get(key as 'Declaration' | 'Rule' | 'AtRule' | 'KeyframesRule' | 'KeyframesAtRule')!.push(value);
                    }
                } else {

                    errors.push({action: 'ignore', message: `doParse: visitor.${key} is not a valid key name`});
                }

            } else {

                errors.push({action: 'ignore', message: `doParse: visitor.${key} is not a valid key name`});
            }
        }
    }

    while (item = isAsync ? (await iter.next()).value as TokenizeResult : (iter as Iterator<TokenizeResult>).next().value as TokenizeResult) {

        stats.bytesIn = item.bytesIn;
        stats.tokensCount++;

        rawTokens.push(item);

        if (item.hint != null && BadTokensTypes.includes(item.hint)) {

            const node: Token = getTokenType(item.token, item.hint);

            errors.push({
                action: 'drop',
                message: 'Bad token',
                syntax: null,
                node,
                location: {
                    src,
                    sta: item.sta,
                    end: item.end
                }
            });
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

            node = parseNode(tokens, context, options as ParserOptions, errors, src, map, rawTokens, stats);
            rawTokens.length = 0;

            if (node != null) {

                if ('chi' in node) {

                    stack.push(<AstAtRule | AstRule | AstKeyFrameRule | AstInvalidRule>node);
                    context = node as AstRuleList;

                } else if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).nam == 'import') {

                    imports.push(node);
                }

            } else if (item.token == '{') {

                let inBlock: number = 1;
                tokens = [item];

                do {

                    item = isAsync ? (await iter.next()).value as TokenizeResult : (iter as Iterator<TokenizeResult>).next().value as TokenizeResult;

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
                        rawTokens: tokens.slice(),
                        location: {
                            src,
                            sta: tokens[0].sta,
                            end: tokens[tokens.length - 1].end
                        }
                    });
                }
            }

            tokens = [];
            map = new Map;
        } else if (item.token == '}') {

            parseNode(tokens, context, options as ParserOptions, errors, src, map, rawTokens, stats);
            rawTokens.length = 0;

            if (context.loc != null) {

                context.loc.end = item.end;
            }

            const previousNode = stack.pop() as AstRuleList;
            context = (stack[stack.length - 1] ?? ast) as AstRuleList;

            if (previousNode != null && previousNode.typ == EnumToken.InvalidRuleTokenType) {

                const index: number = context.chi!.findIndex(node => node == previousNode);

                if (index > -1) {

                    context.chi!.splice(index, 1);
                }
            }

            if (options.removeEmpty && previousNode != null && previousNode.chi!.length == 0 && context.chi![context.chi!.length - 1] == previousNode) {

                context.chi!.pop();
            }

            tokens = [];
            map = new Map;
        }
    }

    if (tokens.length > 0) {

        node = parseNode(tokens, context, options as ParserOptions, errors, src, map, rawTokens, stats);
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

            // @ts-ignore ignore error
            const index: number = context.chi.findIndex((node: AstNode): boolean => node === context);

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

                const result = options.load!(url, <string>options.src) as LoadResult;
                const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction' ? await result : result;
                const root: ParseResult = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
                    stream,
                    buffer: '',
                    position: {ind: 0, lin: 1, col: 1},
                    currentPosition: {ind: -1, lin: 1, col: 0}
                } as ParseInfo), Object.assign({}, options, {
                    minify: false,
                    setParent: false,
                    src: options.resolve!(url, options.src as string).absolute
                }) as ParserOptions);

                stats.importedBytesIn += root.stats.bytesIn;
                stats.imports.push(root.stats);
                node.parent!.chi.splice(node.parent!.chi.indexOf(node), 1, ...root.ast.chi);

                if (root.errors.length > 0) {

                    errors.push(...root.errors);
                }

            } catch (error) {

                // @ts-ignore ignore error
                errors.push({action: 'ignore', message: 'doParse: ' + error.message as string, error});
            }
        }));
    }

    while (stack.length > 0 && context != ast) {

        const previousNode: AstAtRule | AstRule = stack.pop() as AstAtRule | AstRule;
        context = (stack[stack.length - 1] ?? ast) as AstRuleList;

        // remove empty nodes
        if (options.removeEmpty && previousNode != null && previousNode.chi!.length == 0 && context.chi![context.chi!.length - 1] == previousNode) {

            context.chi!.pop();
            continue;
        }

        break;
    }

    const endParseTime: number = performance.now();

    if (options.expandNestingRules) {

        ast = <AstStyleSheet>expand(ast);
    }

    let replacement: GenericVisitorResult<T>;
    let callable: GenericVisitorHandler<T>;

    if (options.visitor != null) {

        for (const result of walk(ast)) {

            if (valuesHandlers!.size > 0 || preVisitorsHandlersMap!.size > 0 || visitorsHandlersMap!.size > 0 || postVisitorsHandlersMap!.size > 0) {

                if (
                    (result.node.typ == EnumToken.DeclarationNodeType &&
                        (preVisitorsHandlersMap!.has('Declaration') || visitorsHandlersMap!.has('Declaration') || postVisitorsHandlersMap!.has('Declaration'))) ||
                    (result.node.typ == EnumToken.AtRuleNodeType && (preVisitorsHandlersMap!.has('AtRule') || visitorsHandlersMap!.has('AtRule') || postVisitorsHandlersMap!.has('AtRule'))) ||
                    (result.node.typ == EnumToken.KeyframesAtRuleNodeType && (preVisitorsHandlersMap!.has('KeyframesAtRule') || visitorsHandlersMap!.has('KeyframesAtRule') || postVisitorsHandlersMap!.has('KeyframesAtRule')))) {

                    const handlers = [] as Array<GenericVisitorHandler<T> | Record<string, GenericVisitorHandler<T>>>;
                    const key = result.node.typ == EnumToken.DeclarationNodeType ? 'Declaration' : result.node.typ == EnumToken.AtRuleNodeType ? 'AtRule' : 'KeyframesAtRule';

                    if (preVisitorsHandlersMap!.has(key)) {

                        // @ts-ignore
                        handlers.push(...preVisitorsHandlersMap.get(key)! as GenericVisitorHandler<T> | Record<string, GenericVisitorHandler<T>>);
                    }

                    if (visitorsHandlersMap!.has(key)) {

                        // @ts-ignore
                        handlers.push(...visitorsHandlersMap.get(key)!);
                    }

                    if (postVisitorsHandlersMap!.has(key)) {

                        // @ts-ignore
                        handlers.push(...postVisitorsHandlersMap.get(key));
                    }

                    let node: AstDeclaration | AstAtRule | AstKeyframesAtRule = result.node as AstDeclaration | AstAtRule | AstKeyframesAtRule;

                    for (const handler of handlers) {

                        callable = typeof handler == 'function' ? handler : handler[normalizeVisitorKeyName(node.typ == EnumToken.DeclarationNodeType || node.typ == EnumToken.AtRuleNodeType ? node.nam : (node as AstKeyframesAtRule).val)] as GenericVisitorHandler<T>;

                        if (callable == null) {

                            continue;
                        }

                        replacement = callable(node, result.parent);

                        if (replacement == null) {

                            continue;
                        }

                        isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';

                        if (replacement) {

                            replacement = await replacement;
                        }

                        if (replacement == null || replacement == node) {

                            continue;
                        }

                        // @ts-ignore
                        node = replacement;

                        //
                        if (Array.isArray(node)) {

                            break;
                        }
                    }

                    if (node != result.node) {

                        // @ts-ignore
                        replaceToken(result.parent as AstRule | AstAtRule | AstKeyframesAtRule | AstKeyFrameRule | AstStyleSheet, result.node, node);
                    }

                } else if ((result.node.typ == EnumToken.RuleNodeType && (preVisitorsHandlersMap!.has('Rule') || visitorsHandlersMap!.has('Rule') || postVisitorsHandlersMap!.has('Rule'))) ||
                    (result.node.typ == EnumToken.KeyFramesRuleNodeType && (preVisitorsHandlersMap!.has('KeyframesRule') || visitorsHandlersMap!.has('KeyframesRule') || postVisitorsHandlersMap!.has('KeyframesRule')))) {

                    const handlers = [] as Array<GenericVisitorHandler<T> | {
                        type: WalkerEvent,
                        handler: GenericVisitorHandler<T>
                    }>;
                    const key = result.node.typ == EnumToken.RuleNodeType ? 'Rule' : 'KeyframesRule';

                    if (preVisitorsHandlersMap!.has(key)) {

                        handlers.push(...preVisitorsHandlersMap!.get(key)! as Array<GenericVisitorHandler<T>>);
                    }

                    if (visitorsHandlersMap!.has(key)) {

                        handlers.push(...visitorsHandlersMap!.get(key)! as Array<GenericVisitorHandler<T>>);
                    }

                    if (postVisitorsHandlersMap!.has(key)) {

                        handlers.push(...postVisitorsHandlersMap!.get(key)! as Array<GenericVisitorHandler<T>>);
                    }

                    let node = result.node;

                    for (const callable of handlers) {

                        replacement = (callable as GenericVisitorHandler<T>)(node as T, result.parent) as GenericVisitorResult<T>;

                        if (replacement == null) {

                            continue;
                        }

                        isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';

                        if (replacement) {

                            replacement = await replacement;
                        }

                        if (replacement == null || replacement == node) {

                            continue;
                        }

                        // @ts-ignore
                        node = replacement as AstNode;

                        //
                        if (Array.isArray(node)) {

                            break;
                        }
                    }

                    // @ts-ignore
                    if (node != result.node) {

                        // @ts-ignore
                        replaceToken(result.parent, result.node, node);
                    }
                } else if (valuesHandlers!.size > 0) {

                    let node: Token | AstNode | null = null;

                    node = result.node;

                    if (valuesHandlers!.has(node.typ)) {

                        for (const valueHandler of valuesHandlers!.get(node.typ)!) {

                            callable = valueHandler as GenericVisitorHandler<T>;
                            replacement = callable(node as T, result.parent);

                            if (replacement == null) {

                                continue;
                            }

                            isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';

                            if (isAsync) {

                                replacement = await replacement;
                            }

                            if (replacement != null && replacement != node) {

                                node = replacement as AstNode;
                            }
                        }
                    }

                    if (node != result.node) {

                        // @ts-ignore
                        replaceToken(result.parent, value, node);
                    }

                    const tokens: Token[] = 'tokens' in result.node ? result.node.tokens as Token[] : [];

                    if ('val' in result.node && Array.isArray(result.node.val)) {

                        tokens.push(...result.node.val as Token[]);
                    }

                    if (tokens.length == 0) {
                        continue;
                    }

                    for (const {value, parent, root} of walkValues(tokens, result.node)) {

                        node = value;

                        if (valuesHandlers!.has(node!.typ)) {

                            for (const valueHandler of valuesHandlers!.get(node!.typ)!) {

                                callable = valueHandler as GenericVisitorHandler<T>;
                                let result: GenericVisitorResult<T> = callable(node as T, parent, root);

                                if (result == null) {

                                    continue;
                                }

                                isAsync = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction';

                                if (isAsync) {

                                    result = await result;
                                }

                                if (result != null && result != node) {

                                    node = result as Token;
                                }

                                //
                                if (Array.isArray(node)) {

                                    break;
                                }
                            }
                        }

                        if (node != value) {

                            // @ts-ignore
                            replaceToken(parent, value, node);
                        }
                    }
                }
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

    stats.bytesIn += stats.importedBytesIn;

    let endTime: number = performance.now();
    const result = {
        ast,
        errors,
        stats: {
            ...stats,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    } as ParseResult;

    if (options.signal != null) {

        options.signal.removeEventListener('abort', reject);
    }

    if (options.module) {

        const parseModuleTime: number = performance.now();
        const mapping: Record<string, string> = {};
        const global = new Set<Token>;
        const processed = new Set<Token>;
        const pattern: string | null = typeof options.module == 'boolean' ? null : options.module.pattern as string;
        const revMapping = {} as Record<string, string>;
        let filePath: string = typeof options.module == 'boolean' ? options.src as string : (options.module.filePath ?? options.src) as string;

        if (filePath!.startsWith(options.cwd + '/')) {

            filePath = filePath!.slice(options!.cwd!.length + 1);
        }

        const moduleSettings = {
            hashLength: 5, filePath,
            scoped: true,
            pattern: pattern != null && pattern !== '' ? pattern : (filePath === '' ? `[hash]_[local]` : `[name]_[hash]_[local]`),
            generateScopedName,
            ...(typeof options.module == 'boolean' ? {} : options.module)
        };

        for (const {node} of walk(ast)) {

            if (node.typ == EnumToken.DeclarationNodeType) {

                if (node.nam.startsWith('--')) {

                    if (!(node.nam in mapping)) {

                        let result = moduleSettings.generateScopedName(node.nam, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                        mapping[node.nam] = '--' + (result instanceof Promise ? await result : result);
                        revMapping[mapping[node.nam]] = node.nam;
                    }

                    node.nam = mapping[node.nam];
                }

                if ('composes' == node.nam.toLowerCase()) {

                    const token = node.val.find(t => t.typ == EnumToken.ComposesSelectorNodeType) as ComposesSelectorToken;

                    if (token == null) {

                        continue;
                    }

                    // find parent rule
                    let parentRule = node.parent as AstRule;

                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {

                        parentRule = parentRule.parent as AstRule;
                    }

                    // composes: a b c;
                    if (token.r == null) {

                        for (const rule of token.l) {

                            if (rule.typ == EnumToken.WhitespaceTokenType || rule.typ == EnumToken.CommentTokenType) {

                                continue;
                            }

                            if (!((rule as IdentToken).val in mapping)) {

                                let result = moduleSettings.generateScopedName((rule as IdentToken).val, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                                mapping[(rule as DashedIdentToken).val] = (rule.typ == EnumToken.DashedIdenTokenType ? '--' : '') + (result instanceof Promise ? await result : result);
                                revMapping[mapping[(rule as DashedIdentToken).val]] = (rule as DashedIdentToken).val;
                            }

                            if (parentRule != null) {

                                for (const tk of (parentRule as AstRule).tokens!) {

                                    if (tk.typ == EnumToken.ClassSelectorTokenType) {

                                        const val: string = (tk as ClassSelectorToken).val.slice(1);

                                        if (val in revMapping) {

                                            const key = revMapping[val] as string;
                                            mapping[key] = [...new Set([...mapping[key].split(' '), mapping[(rule as IdentToken).val]])].join(' ');
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // composes: a b c from 'file.css';
                    else if (token.r.typ == EnumToken.String) {

                        const url: string = (token.r as StringToken).val.slice(1, -1);
                        const result = options.load!(url, <string>options.src) as LoadResult;
                        const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction' ? await result : result;
                        const root: ParseResult = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
                            stream,
                            buffer: '',
                            position: {ind: 0, lin: 1, col: 1},
                            currentPosition: {ind: -1, lin: 1, col: 0}
                        } as ParseInfo), Object.assign({}, options, {
                            minify: false,
                            setParent: false,
                            src: options.resolve!(url, options.src as string).absolute,
                            module: typeof options.module == 'boolean' ? options.module : {...options.module}
                        }) as ParserOptions);

                        if (parentRule != null) {

                            for (const tk of (parentRule as AstRule).tokens!) {

                                if (tk.typ == EnumToken.ClassSelectorTokenType) {

                                    const val: string = (tk as ClassSelectorToken).val.slice(1);

                                    if (val in revMapping) {

                                        const key = revMapping[val] as string;
                                        const values = [] as string[];

                                        for (const iden of token.l) {

                                            if (iden.typ != EnumToken.IdenTokenType && iden.typ != EnumToken.DashedIdenTokenType) {

                                                continue;
                                            }

                                            if (!((iden as IdentToken | DashedIdentToken).val in root.mapping!)) {

                                                const result = moduleSettings.generateScopedName((iden as IdentToken | DashedIdentToken).val, url as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                                                root.mapping![(iden as IdentToken | DashedIdentToken).val] = result instanceof Promise ? await result : result;
                                                root.revMapping![root.mapping![(iden as IdentToken | DashedIdentToken).val]] = (iden as IdentToken | DashedIdentToken).val;
                                            }

                                            values.push(root.mapping![(iden as IdentToken | DashedIdentToken).val]);
                                        }

                                        mapping[key] = [...new Set([...mapping[key].split(' '), ...values])].join(' ');
                                    }
                                }
                            }
                        }
                    }

                    // composes: a b c from global;
                    else if (token.r.typ == EnumToken.IdenTokenType) {

                        // global
                        if (parentRule != null) {

                            if ('global' == (token.r as IdentToken).val.toLowerCase()) {

                                for (const tk of (parentRule as AstRule).tokens!) {

                                    if (tk.typ == EnumToken.ClassSelectorTokenType) {

                                        const val: string = (tk as ClassSelectorToken).val.slice(1);

                                        if (val in revMapping) {

                                            const key = revMapping[val] as string;
                                            mapping[key] = [...new Set([...mapping[key].split(' '), ...((token as ComposesSelectorToken).l.reduce((acc, curr) => {

                                                if (curr.typ == EnumToken.IdenTokenType) {

                                                    acc.push((curr as IdentToken).val);
                                                }

                                                return acc;
                                            }, [] as string[]))])].join(' ');
                                        }
                                    }
                                }
                            } else {

                                errors.push({
                                    action: 'drop',
                                    message: `composes '${(token.r as IdentToken).val}' is not supported`,
                                    node
                                });
                            }
                        }
                    } else {

                        errors.push({
                            action: 'drop',
                            message: `composes '${EnumToken[(token.r as IdentToken).typ]}' is not supported`,
                            node
                        });
                    }

                    (parentRule as AstRule).chi.splice((parentRule as AstRule).chi.indexOf(node), 1);
                }

                if (node.nam == 'grid-template-areas') {

                    for (let i = 0; i < node.val.length; i++) {

                        if (node.val[i].typ == EnumToken.String) {

                            const tokens = parseString((node.val[i] as StringToken).val.slice(1, -1), {location: true});

                            for (const {value} of walkValues(tokens)) {

                                if (value.typ == EnumToken.IdenTokenType || value.typ == EnumToken.DashedIdenTokenType) {

                                    if ((value as IdentToken).val in mapping) {

                                        (value as IdentToken).val = mapping[(value as IdentToken).val];
                                    } else {

                                        let result = moduleSettings.generateScopedName((value as IdentToken).val, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);

                                        if (result instanceof Promise) {

                                            result = await result;
                                        }

                                        mapping[(value as IdentToken).val] = result;
                                        revMapping[result] = (value as IdentToken).val;
                                        (value as IdentToken).val = result;
                                    }
                                }
                            }

                            (node.val[i] as StringToken).val = (node.val[i] as StringToken).val.charAt(0) + tokens.reduce((acc, curr) => acc + renderToken(curr), '') + (node.val[i] as StringToken).val.charAt((node.val[i] as StringToken).val.length - 1);
                        }
                    }
                } else if (node.nam == 'animation' || node.nam == 'animation-name') {

                    for (const {value} of walkValues(node.val, node)) {

                        if (value.typ == EnumToken.IdenTokenType && ![
                            'none', 'infinite', 'normal', 'reverse', 'alternate',
                            'alternate-reverse', 'forwards', 'backwards', 'both',
                            'running', 'paused', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
                            'step-start', 'step-end', 'jump-start', 'jump-end',
                            'jump-none', 'jump-both', 'start', 'end',
                            'inherit', 'initial', 'unset'
                        ].includes((value as IdentToken).val)) {

                            if (!((value as IdentToken).val in mapping)) {

                                const result = moduleSettings.generateScopedName((value as IdentToken).val, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                                mapping[(value as IdentToken).val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[(value as IdentToken).val]] = (value as IdentToken).val;
                            }

                            (value as IdentToken).val = mapping[(value as IdentToken).val];
                        }
                    }
                }

                for (const {value} of walkValues(node.val, node)) {

                    if (value.typ == EnumToken.DashedIdenTokenType) {

                        if (!((value as DashedIdentToken).val in mapping)) {

                            const result = moduleSettings.generateScopedName((value as DashedIdentToken).val, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                            mapping[(value as DashedIdentToken).val] = '--' + (result instanceof Promise ? await result : result);
                            revMapping[mapping[(value as DashedIdentToken).val]] = (value as DashedIdentToken).val;
                        }

                        (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                    }
                }

            } else if (node.typ == EnumToken.RuleNodeType) {

                if (node.tokens == null) {

                    Object.defineProperty(node, 'tokens', {
                        ...definedPropertySettings,
                        value: parseSelector(parseString(node.sel))
                    });
                }

                for (const {value} of walkValues((node as AstRule).tokens as Token[], node,
                    // @ts-ignore
                    (value: Token, parent: AstRule) => {

                        if (value.typ == EnumToken.PseudoClassTokenType) {

                            const val: string = (value as PseudoClassToken).val.toLowerCase();
                            switch (val) {

                                case ':local':
                                case ':global':

                                {


                                    let index: number = (parent as AstRule).tokens!.indexOf(value);

                                    (parent as AstRule).tokens!.splice(index, 1);

                                    if ((parent as AstRule).tokens![index]?.typ == EnumToken.WhitespaceTokenType || (parent as AstRule).tokens![index]?.typ == EnumToken.DescendantCombinatorTokenType) {

                                        (parent as AstRule).tokens!.splice(index, 1);
                                    }

                                    if (val == ':global') {

                                        for (; index < (parent as AstRule).tokens!.length; index++) {

                                            if ((parent as AstRule).tokens![index].typ == EnumToken.CommaTokenType ||
                                                (
                                                    [EnumToken.PseudoClassFuncTokenType, EnumToken.PseudoClassTokenType].includes((parent as AstRule).tokens![index].typ) &&
                                                    [':global', ':local'].includes(((parent as AstRule).tokens![index] as PseudoClassToken).val.toLowerCase())
                                                )
                                            ) {

                                                break;
                                            }

                                            global.add((parent as AstRule).tokens![index]);
                                        }
                                    }
                                }

                                    break;
                            }

                        } else if (value.typ == EnumToken.PseudoClassFuncTokenType) {

                            switch ((value as FunctionToken).val.toLowerCase()) {

                                case ':global':

                                    for (const token of (value as FunctionToken).chi) {

                                        global.add(token);
                                    }

                                    (parent as AstRule).tokens!.splice((parent as AstRule).tokens!.indexOf(value), 1, ...(value as FunctionToken).chi);
                                    break;

                                case ':local':

                                    (parent as AstRule).tokens!.splice((parent as AstRule).tokens!.indexOf(value), 1, ...(value as FunctionToken).chi);
                                    break;
                            }
                        }

                    })) {

                    if (processed.has(value)) {

                        continue;
                    }

                    processed.add(value);

                    if (value.typ == EnumToken.PseudoClassTokenType) {

                    } else if (value.typ == EnumToken.PseudoClassFuncTokenType) {

                    } else {

                        if (global.has(value)) {

                            continue;
                        }

                        if (value.typ == EnumToken.ClassSelectorTokenType) {

                            const val: string = (value as ClassSelectorToken).val.slice(1);

                            if (!(val in mapping)) {

                                const result = moduleSettings.generateScopedName(val, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                                mapping[val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[val]] = val;
                            }

                            (value as ClassSelectorToken).val = '.' + mapping[val];
                        }
                    }
                }

                node.sel = '';

                for (const token of node.tokens! as Token[]) {

                    node.sel += renderToken(token);
                }
            } else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {

                const val: string = node.nam.toLowerCase();

                if (val == 'property' || val == 'keyframes') {

                    if (node.tokens == null) {

                        Object.defineProperty(node, 'tokens', {
                            ...definedPropertySettings,
                            // @ts-ignore
                            value: parseAtRulePrelude(parseString(node.val), node)
                        });
                    }

                    const prefix: string = val == 'property' ? '--' : '';

                    for (const value of node.tokens as Token[]) {

                        if ((prefix == '--' && value.typ == EnumToken.DashedIdenTokenType) || (prefix == '' && value.typ == EnumToken.IdenTokenType)) {

                            if (!((value as DashedIdentToken | IdentToken).val in mapping)) {

                                const result = moduleSettings.generateScopedName((value as DashedIdentToken).val, moduleSettings.filePath as string, moduleSettings.pattern as string, moduleSettings.hashLength);
                                mapping[(value as DashedIdentToken | IdentToken).val] = prefix + (result instanceof Promise ? await result : result);
                                revMapping[mapping[(value as DashedIdentToken).val]] = (value as DashedIdentToken).val;
                            }

                            (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                        }
                    }

                    (node as AstAtRule).val = node.tokens!.reduce((a, b) => a + renderToken(b), '');
                }
            }
        }

        result.mapping = mapping;
        result.revMapping = revMapping;
        endTime = performance.now();
        result.stats.module = `${(endTime - parseModuleTime).toFixed(2)}ms`;
        result.stats.total = `${(endTime - startTime).toFixed(2)}ms`;
    }

    return result;
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

function parseNode(results: TokenizeResult[], context: AstRuleList, options: ParserOptions, errors: ErrorDescription[], src: string, map: Map<Token, Location>, rawTokens: TokenizeResult[], stats: ParseResultStats): AstRule | AstAtRule | AstKeyFrameRule | AstKeyframesAtRule | AstInvalidRule | AstDeclaration | AstComment | null {

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
                    node: tokens[i],
                    location
                });
                continue;
            }

            loc = location;
            context.chi!.push(tokens[i] as AstNode);
            stats.nodesCount++;

            Object.defineProperty(tokens[i], 'loc', {
                ...definedPropertySettings,
                value: loc,
                enumerable: options.sourcemap !== false
            });

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

        const atRule: AtRuleToken = tokens.shift() as AtRuleToken;
        const location: Location = <Location>map.get(atRule);

        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
            tokens.shift();
        }

        rawTokens.shift();

        if (atRule.val == 'import') {

            // only @charset and @layer are accepted before @import
            if (context.chi!.length > 0) {

                let i: number = context.chi!.length;
                while (i--) {
                    // @ts-ignore
                    const type = context.chi[i].typ;
                    if (type == EnumToken.CommentNodeType) {
                        continue;
                    }
                    if (type != EnumToken.AtRuleNodeType) {

                        if (!(type == EnumToken.InvalidAtRuleTokenType &&

                            ['charset', 'layer', 'import'].includes((context.chi![i] as AstInvalidAtRule).nam as string))) {

                            errors.push({
                                action: 'drop',
                                message: 'invalid @import',
                                location,
                                // @ts-ignore
                                rawTokens: [atRule, ...tokens]
                            });
                            return null;
                        }
                    }

                    const name: string = (context.chi![i] as AstAtRule).nam;

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
                        location, rawTokens: [atRule, ...tokens]
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
        const raw: string[] = [];

        for (const curr of t) {

            raw.push(renderToken(curr, {removeComments: true, convertColor: false}));
        }

        const nam: string = renderToken(atRule, {removeComments: true});
        // @ts-ignore
        const node: AstAtRule | AstKeyframesAtRule = {
            typ: /^(-[a-z]+-)?keyframes$/.test(nam) ? EnumToken.KeyframesAtRuleNodeType : EnumToken.AtRuleNodeType,
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

        loc = map.get(atRule) as Location;

        Object.defineProperty(node, 'loc', {
            ...definedPropertySettings,
            value: loc,
            enumerable: options.sourcemap !== false
        })

        node.loc!.end = {...map.get(delim)!.end};

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
        const skipValidate: boolean = (options.validation & ValidationLevel.AtRule) == 0;
        const isAllowed: boolean = skipValidate || isNodeAllowedInContext(node, context as AstNode);
        // @ts-ignore
        const valid: ValidationResult = skipValidate ? {
            valid: SyntaxValidationResult.Valid,
            error: '',
            matches: [],
            node,
            syntax: '@' + node.nam
        } as ValidationResult : !isAllowed ? {
            valid: SyntaxValidationResult.Drop,
            node,
            matches: [] as Token[],
            syntax: '@' + node.nam,
            error: `${EnumToken[context.typ]}: child ${EnumToken[node.typ]} not allowed in context${context.typ == EnumToken.AtRuleNodeType ? ` '@${(context as AstAtRule).nam}'` : context.typ == EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`,
            tokens
        } as ValidationResult : isValid ? (node.typ == EnumToken.KeyframesAtRuleNodeType ? validateAtRuleKeyframes(<AstKeyframesAtRule>node, options, context as AstNode) : validateAtRule(node, options, context as AstNode)) : {
            valid: SyntaxValidationResult.Drop,
            node,
            matches: [] as Token[],
            syntax: '@' + node.nam,
            error: '@' + node.nam + ' not allowed here',
            tokens
        } as ValidationResult;

        if (valid.valid == SyntaxValidationResult.Drop) {

            let message: string = '';

            for (const token of tokens) {

                message += renderToken(token, {minify: false});
            }

            errors.push({
                action: 'drop',
                message: valid.error + ' - "' + message + '"',
                node,
                // @ts-ignore
                location: {src, ...(map.get(valid.node) ?? location)}
            });

            // @ts-ignore
            node.typ = EnumToken.InvalidAtRuleTokenType;
        } else {

            node.val = '';

            for (const token of node.tokens as Token[]) {

                node.val += renderToken(token, {
                    minify: false,
                    convertColor: false,
                    removeComments: true
                });
            }
        }

        context.chi!.push(node);
        stats.nodesCount++;

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

            const ruleType: EnumToken = context.typ == EnumToken.KeyframesAtRuleNodeType ? EnumToken.KeyFramesRuleNodeType : EnumToken.RuleNodeType;

            if (ruleType == EnumToken.RuleNodeType) {

                parseSelector(tokens);
            }

            const node: AstRule | AstKeyFrameRule = {
                typ: ruleType,
                sel: [...tokens.reduce((acc: string[][], curr: Token, index: number, array: Token[]) => {

                    if (curr.typ == EnumToken.CommentTokenType) {

                        return acc;
                    }

                    if (options.minify) {

                        if (curr.typ == EnumToken.PseudoClassFuncTokenType && (curr as PseudoClassFunctionToken).val == ':nth-child') {

                            let i: number = 0;

                            for (; i < (curr as PseudoClassFunctionToken).chi.length; i++) {

                                if ((curr as PseudoClassFunctionToken).chi[i].typ == EnumToken.IdenTokenType && ((curr as PseudoClassFunctionToken).chi[i] as IdentToken).val == 'even') {

                                    Object.assign((curr as PseudoClassFunctionToken).chi[i], {
                                        typ: EnumToken.Dimension,
                                        val: 2,
                                        unit: 'n'
                                    });
                                } else if (
                                    (curr as PseudoClassFunctionToken).chi[i].typ == EnumToken.Dimension &&
                                    ((curr as PseudoClassFunctionToken).chi[i] as DimensionToken).val == 2 &&
                                    ((curr as PseudoClassFunctionToken).chi[i] as DimensionToken).unit == 'n' &&
                                    (curr as PseudoClassFunctionToken).chi[i + 1]?.typ == EnumToken.WhitespaceTokenType &&
                                    (curr as PseudoClassFunctionToken).chi[i + 2]?.typ == EnumToken.LiteralTokenType &&
                                    ((curr as PseudoClassFunctionToken).chi[i + 2] as LiteralToken).val == '+' &&
                                    (curr as PseudoClassFunctionToken).chi[i + 3]?.typ == EnumToken.WhitespaceTokenType &&
                                    (curr as PseudoClassFunctionToken).chi[i + 4]?.typ == EnumToken.NumberTokenType &&
                                    ((curr as PseudoClassFunctionToken).chi[i + 4] as NumberToken).val == 1
                                ) {

                                    (curr as PseudoClassFunctionToken).chi.splice(i, 5, Object.assign((curr as PseudoClassFunctionToken).chi[i], {
                                        typ: EnumToken.IdenTokenType,
                                        val: 'odd'
                                    }))
                                }
                            }
                        }
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

                    if (ruleType == EnumToken.KeyFramesRuleNodeType && options.minify) {

                        if (curr.typ == EnumToken.IdenTokenType && (curr as IdentToken).val == 'from') {

                            Object.assign(curr, {typ: EnumToken.PercentageTokenType, val: '0'})
                        } else if (curr.typ == EnumToken.PercentageTokenType && (curr as PercentageToken).val == 100) {

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

            Object.defineProperty(node, 'loc', {
                ...definedPropertySettings,
                value: loc,
                enumerable: options.sourcemap !== false
            });

            context.chi!.push(node);
            Object.defineProperty(node, 'parent', {...definedPropertySettings, value: context});

            // @ts-ignore
            const skipValidate: boolean = (options.validation & ValidationLevel.Selector) == 0;
            const isAllowed: boolean = skipValidate || isNodeAllowedInContext(node, context as AstNode);
            // @ts-ignore
            const valid: ValidationResult = skipValidate ? {
                valid: SyntaxValidationResult.Valid,
                node,
                error: null
            } as ValidationSyntaxResult : !isAllowed ? {
                valid: SyntaxValidationResult.Drop,
                node,
                syntax: null,
                error: `${EnumToken[context.typ]}: child ${EnumToken[node.typ]} not allowed in context${context.typ == EnumToken.AtRuleNodeType ? ` '@${(context as AstAtRule).nam}'` : context.typ == EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`
            } : ruleType == EnumToken.KeyFramesRuleNodeType ? validateKeyframeSelector(tokens, options) : validateSelector(tokens, options, context as AstNode);

            if (valid.valid != SyntaxValidationResult.Valid) {

                // @ts-ignore
                node.typ = EnumToken.InvalidRuleTokenType;
                node.sel = tokens.reduce((acc: string, curr: Token) => acc + renderToken(curr, {minify: false}), '');

                errors.push({
                    action: 'drop',
                    message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, {minify: false}), '') + '"',
                    node,
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
                            val: +(tokens[i] as LiteralToken).val.slice(1)
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

                    Object.defineProperty(node, 'loc', {
                        ...definedPropertySettings,
                        value: location,
                        enumerable: options.sourcemap !== false
                    })

                    context.chi!.push(node);
                    stats.nodesCount++;
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

                                (parent as FunctionToken).chi.splice((parent as FunctionToken).chi.indexOf(node), 1, {typ: (node as LiteralToken).val[0] == '/' ? EnumToken.Div : EnumToken.Mul} as Token, ...parseString((node as LiteralToken).val.slice(1)));
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

            Object.defineProperty(node, 'loc', {
                ...definedPropertySettings,
                value: location,
                enumerable: options.sourcemap !== false
            });
            node.loc!.end = {...map.get(delim)!.end};

            // do not allow declarations in style sheets
            if (context.typ == EnumToken.StyleSheetNodeType && options.lenient) {

                Object.assign(node, {typ: EnumToken.InvalidDeclarationNodeType});
                context.chi!.push(node);
                stats.nodesCount++;
                return null;
            }
            const result: AstDeclaration | null = parseDeclarationNode(node, errors, location);
            Object.defineProperty(result, 'parent', {...definedPropertySettings, value: context});

            if (result != null) {

                if ((options.validation as ValidationLevel) & ValidationLevel.Declaration) {

                    const isAllowed: boolean = isNodeAllowedInContext(node, context as AstNode);
                    // @ts-ignore
                    const valid: ValidationSyntaxResult = !isAllowed ? {
                        valid: SyntaxValidationResult.Drop,
                        error: `${EnumToken[node.typ]} not allowed in context${context.typ == EnumToken.AtRuleNodeType ? ` '@${(context as AstAtRule).nam}'` : context.typ == EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`,
                        node,
                        syntax: null
                    } : evaluateSyntax(result, context, options);

                    Object.defineProperty(result, 'validSyntax', {
                        ...definedPropertySettings,
                        value: valid.valid == SyntaxValidationResult.Valid
                    });

                    if (valid.valid == SyntaxValidationResult.Drop) {

                        errors.push({
                            action: 'drop',
                            message: valid.error,
                            syntax: valid.syntax,
                            node: valid.node,
                            location: map.get(valid.node as Token) ?? valid.node?.loc ?? result.loc ?? location
                        } as ErrorDescription);

                        if (!options.lenient) {

                            return null;
                        }

                        Object.assign(node, {typ: EnumToken.InvalidDeclarationNodeType});
                    }
                }

                context.chi!.push(result);
                stats.nodesCount++;
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

    for (const {value, parent} of walkValues(tokens, null, null, true)) {

        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType
        ) {

            continue;
        }

        if (value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType) {

            if (parent?.typ == EnumToken.ParensTokenType) {

                const index: number = (parent as ParensToken).chi.indexOf(value);
                let i: number = index;

                while (i--) {

                    if ((parent as ParensToken).chi[i].typ == EnumToken.IdenTokenType || (parent as ParensToken).chi[i].typ == EnumToken.DashedIdenTokenType) {

                        break;
                    }
                }

                if (i >= 0) {

                    const token: Token = getTokenType(((parent as ParensToken).chi[index] as PseudoClassToken | PseudoClassFunctionToken).val.slice(1) + (funcLike.includes((parent as ParensToken).chi[index].typ) ? '(' : ''));

                    ((parent as ParensToken).chi[index] as PseudoClassToken | PseudoClassFunctionToken).val = (token as PseudoClassToken | PseudoClassFunctionToken).val;
                    ((parent as ParensToken).chi[index] as PseudoClassToken | PseudoClassFunctionToken).typ = (token as PseudoClassToken | PseudoClassFunctionToken).typ;

                    if ((parent as ParensToken).chi[index].typ == EnumToken.FunctionTokenType && isColor((parent as ParensToken).chi[index])) {

                        parseColor((parent as ParensToken).chi[index]);
                    }

                    (parent as ParensToken).chi.splice(i, index - i + 1, {
                        typ: EnumToken.MediaQueryConditionTokenType,
                        l: (parent as ParensToken).chi[i],
                        r: (parent as ParensToken).chi.slice(index),
                        op: {
                            typ: EnumToken.ColonTokenType
                        } as ColonToken
                    } as MediaQueryConditionToken)
                }
            }
        }

        if (atRule.val == 'page' && value.typ == EnumToken.PseudoClassTokenType) {

            if ([':left', ':right', ':first', ':blank'].includes((<PseudoClassToken>value).val)) {

                Object.assign(value, {typ: EnumToken.PseudoPageTokenType});
            }
        }

        if (atRule.val == 'layer') {

            if (parent == null && value.typ == EnumToken.LiteralTokenType) {

                if ((<LiteralToken>value).val.charAt(0) == '.') {

                    if (isIdent((<LiteralToken>value).val.slice(1))) {

                        Object.assign(value, {typ: EnumToken.ClassSelectorTokenType});
                    }
                }
            }
        }

        const val: string | null = value.typ == EnumToken.IdenTokenType ? (value as IdentToken).val.toLowerCase() : null;

        if (value.typ == EnumToken.IdenTokenType) {

            if (parent == null && mediaTypes.some((t: string) => {

                if (val === t) {

                    Object.assign(value, {typ: EnumToken.MediaFeatureTokenType});
                    return true;
                }

                return false;
            })) {

                continue;
            }

            if (value.typ == EnumToken.IdenTokenType && 'and' === val) {

                Object.assign(value, {typ: EnumToken.MediaFeatureAndTokenType});
                continue;
            }

            if (value.typ == EnumToken.IdenTokenType && 'or' === val) {

                Object.assign(value, {typ: EnumToken.MediaFeatureOrTokenType});
                continue;
            }

            if (value.typ == EnumToken.IdenTokenType &&
                ['not', 'only'].some((t: string): boolean => val === t)) {

                const array: Token[] = (parent as ParensToken)?.chi ?? tokens as Token[];
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

        if (value.typ == EnumToken.FunctionTokenType && (value as FunctionToken).val == 'selector') {

            parseSelector((value as FunctionToken).chi);
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

                if ((value as FunctionToken | ParensToken).chi[i].typ == EnumToken.LiteralTokenType && ((value as FunctionToken | ParensToken).chi[i] as LiteralToken).val.startsWith(':')) {

                    const dimension = parseDimension(((value as FunctionToken | ParensToken).chi[i] as LiteralToken).val.slice(1));
                    if (dimension != null) {
                        (value as ParensToken | FunctionToken).chi.splice(i, 1, {
                                typ: EnumToken.ColonTokenType,
                            },
                            Object.assign((value as FunctionToken | ParensToken).chi[i], dimension)
                        );

                        i--;
                        continue;
                    }
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
                    const node = (value as FunctionToken | ParensToken).chi.splice(nameIndex, 1)[0] as IdentToken | ColorToken;

                    // 'background'
                    if (node.typ == EnumToken.ColorTokenType && (node as ColorToken).kin == ColorType.DPSYS) {

                        Object.assign(node, {typ: EnumToken.IdenTokenType});
                        // @ts-ignore
                        delete node.kin;
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
 * parse a string as an array of declaration nodes
 * @param declaration
 *
 * Example:
 * ````ts
 *
 * const declarations = await parseDeclarations('color: red; background: blue');
 * console.log(declarations);
 * ```
 */
export async function parseDeclarations(declaration: string): Promise<Array<AstDeclaration | AstComment>> {

    return doParse(tokenize({
        stream: `.x{${declaration}}`,
        buffer: '',
        position: {ind: 0, lin: 1, col: 1},
        currentPosition: {ind: -1, lin: 1, col: 0}
    } as ParseInfo), {setParent: false, minify: false, validation: false}).then(result => {

        return (result.ast.chi[0] as AstRule).chi.filter(t => t.typ == EnumToken.DeclarationNodeType || t.typ == EnumToken.CommentNodeType) as Array<AstDeclaration | AstComment>
    });
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

                Object.assign(value, {typ: EnumToken.ChildCombinatorTokenType});

            } else if (value.typ == EnumToken.LiteralTokenType) {

                if ((<LiteralToken>value).val.charAt(0) == '&') {

                    Object.assign(value, {typ: EnumToken.NestingSelectorTokenType});

                    // @ts-ignore
                    delete value.val;
                } else if ((<LiteralToken>value).val.charAt(0) == '.') {

                    if (!isIdent((<LiteralToken>value).val.slice(1))) {

                        Object.assign(value, {typ: EnumToken.InvalidClassSelectorTokenType});
                    } else {

                        Object.assign(value, {typ: EnumToken.ClassSelectorTokenType});
                    }
                }

                if (['*', '>', '+', '~'].includes((<LiteralToken>value).val)) {

                    switch ((<LiteralToken>value).val) {

                        case '*':
                            Object.assign(value, {typ: EnumToken.UniversalSelectorTokenType});
                            break;
                        case '>':
                            Object.assign(value, {typ: EnumToken.ChildCombinatorTokenType});
                            break;
                        case '+':
                            Object.assign(value, {typ: EnumToken.NextSiblingCombinatorTokenType});
                            break;
                        case '~':
                            Object.assign(value, {typ: EnumToken.SubsequentSiblingCombinatorTokenType});
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

                        Object.assign(value, {typ: EnumToken.HashTokenType});
                    } else {

                        Object.assign(value, {typ: EnumToken.IdenTokenType});
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
 * parse css string and return an array of tokens
 * @param src
 * @param options
 *
 * @private
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(tokens);
 *
 *  tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
export function parseString(src: string, options: { location: boolean } = {location: false}): Token[] {

    const parseInfo: ParseInfo = {
        stream: src,
        buffer: '',
        position: {ind: 0, lin: 1, col: 1},
        currentPosition: {ind: -1, lin: 1, col: 0}
    }

    return parseTokens([...tokenize(parseInfo)].reduce((acc, t) => {

        if (t.hint == EnumToken.EOFTokenType) {

            return acc;
        }

        const token: Token = getTokenType(t.token, t.hint);

        Object.defineProperty(token, 'loc', {
            ...definedPropertySettings,
            value: {sta: t.sta},
            enumerable: options.location !== false
        });
        acc.push(token);

        return acc;
    }, [] as Token[]));
}

/**
 * get the token type from a string
 * @param val
 * @param hint
 */
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

    if (val.charAt(0) == ':' && isPseudo(val)) {

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

    if (val.charAt(0) == '@' && isAtKeyword(val)) {
        return <AtRuleToken>{
            typ: EnumToken.AtRuleTokenType,
            val: val.slice(1)
        };
    }

    if (val.endsWith('(') && isFunction(val)) {
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
            val: +val
        }
    }

    if (isPercentage(val)) {
        return <PercentageToken>{
            typ: EnumToken.PercentageTokenType,
            val: +val.slice(0, -1)
        }
    }

    const dimension = parseDimension(val);

    if (dimension != null) {
        return dimension;
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

    if (val.charAt(0) == '.' && isIdent(val.slice(1))) {

        return {
            typ: EnumToken.ClassSelectorTokenType,
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
 * parse function tokens in a token array
 * @param tokens
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString, parseTokens} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(parseTokens(tokens));
 *
 *  tokens = parseString('#c322c980');
 * console.log(parseTokens(tokens));
 * ```
 *
 * @private
 */
export function parseTokens(tokens: Token[], options: ParseTokenOptions = {}): Token[] {

    for (let i = 0; i < tokens.length; i++) {

        const t: Token = tokens[i];

        if (t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == 'from' && i > 0) {

            const left: Token[] = [];
            const right: Token[] = [];

            let foundLeft: number = 0;
            let foundRight: number = 0;
            let k: number = i;
            let l: number = i;

            while (k > 0) {

                if (tokens[k - 1].typ == EnumToken.CommentTokenType || tokens[k - 1].typ == EnumToken.WhitespaceTokenType) {

                    left.push(tokens[--k]);
                    continue;
                }

                if (tokens[k - 1].typ == EnumToken.IdenTokenType || tokens[k - 1].typ == EnumToken.DashedIdenTokenType) {

                    foundLeft++;
                    left.push(tokens[--k]);
                    continue;
                }

                break;
            }

            while (++l < tokens.length) {

                if (tokens[l].typ == EnumToken.CommentTokenType || tokens[l].typ == EnumToken.WhitespaceTokenType) {

                    right.push(tokens[l]);
                    continue;
                }

                if (tokens[l].typ == EnumToken.IdenTokenType || tokens[l].typ == EnumToken.StringTokenType) {

                    foundRight++;
                    right.push(tokens[l]);
                    continue;
                }

                break;
            }

            if (foundLeft > 0 && foundRight == 1) {

                while (left?.[0].typ == EnumToken.WhitespaceTokenType) {

                    left.shift();
                }

                while (left.at(-1)?.typ == EnumToken.WhitespaceTokenType) {

                    left.pop();
                }

                tokens.splice(k, l - k + 1, {

                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: right.reduce((a: Token | null, b: Token) => {

                        return a == null ? b : b.typ == EnumToken.IdenTokenType || b.typ == EnumToken.StringTokenType ? b : a;
                    }, null)
                });

                i = k;
                continue;
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

                (t as FunctionToken).chi = splitTokenList((t as FunctionToken).chi).reduce((acc: Token[], t: Token[]): Token[] => {

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