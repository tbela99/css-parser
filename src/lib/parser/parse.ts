import { isColor, isIdent, isIdentColor, isIdentStart, parseColor } from "../syntax/syntax.ts";
import { camelize, dasherize, equalsIgnoreCase } from "./utils/text.ts";
import { renderToken } from "../renderer/render.ts";
import { EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, ValidationLevel } from "../ast/types.ts";
import { minify } from "../ast/minify.ts";
import { expand } from "../ast/expand.ts";
import { walk, WalkerEvent, walkValues } from "../ast/walk.ts";
import { tokenize, tokenizeStream } from "./tokenize.ts";
import type {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstInvalidAtRule,
    AstInvalidRule,
    AstKeyFrameRule,
    AstKeyframesAtRule,
    AstKeyframesRule,
    AstNode,
    AstRule,
    AstRuleList,
    AstStyleSheet,
    AtRuleToken,
    AttrStartToken,
    AttrToken,
    ClassSelectorToken,
    ComposesSelectorToken,
    ContainMatchToken,
    CssVariableImportTokenType,
    CssVariableMapTokenType,
    CssVariableToken,
    DashedIdentToken,
    DashMatchToken,
    EndMatchToken,
    EqualMatchToken,
    ErrorDescription,
    FunctionToken,
    FunctionURLToken,
    GenericVisitorAstNodeHandlerMap,
    GenericVisitorHandler,
    GenericVisitorResult,
    IdentToken,
    IncludeMatchToken,
    LiteralToken,
    LoadResult,
    Location,
    MatchExpressionToken,
    MediaQueryConditionToken,
    ModuleOptions,
    NameSpaceAttributeToken,
    ParensToken,
    ParseInfo,
    ParseResult,
    ParseResultStats,
    ParserOptions,
    ParseTokenOptions,
    PseudoClassFunctionToken,
    PseudoClassToken,
    StartMatchToken,
    StringToken,
    Token,
    TokenizeResult,
    UrlToken,
    WhitespaceToken,
} from "../../@types/index.d.ts";
import {
    definedPropertySettings,
    funcLike,
    mathFuncs,
    pageMarginBoxType,
    tokensfuncDefMap,
} from "../syntax/constants.ts";
import { splitTokenList } from "../validation/utils/list.ts";
import { buildExpression } from "../ast/math/expression.ts";
import { hash, hashAlgorithms } from "../parser/utils/hash.ts";
import { parseSelector } from "./utils/selector.ts";
import { parseDeclaration } from "./utils/declaration.ts";
import { getSyntaxRule } from "../validation/config.ts";
import { createValidationContext, matchAllSyntax, matchSelectorSyntax, trimArray } from "../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../validation/parser/typedef.ts";
import type { ValidationToken } from "../validation/parser/types.d.ts";
import { matchAtRuleImportSyntax } from "./utils/at-rule-import.ts";
import type { ValidationMatch } from "../validation/types.d.ts";
import { matchAtRuleWhenElseSyntax } from "./utils/at-rule-when-else.ts";
import { urlTokenMatcher } from "../syntax/constants.ts";
import { parseAtRuleSupportSyntax } from "./utils/at-rule-support.ts";
import { replaceToken, trimWhiteSpaceTokens } from "./utils/token.ts";
import { parseAtRuleContainerQueryList } from "./utils/at-rule-container.ts";
import { parseMediaqueryList } from "./utils/at-rule-media.ts";
import { matchAtRuleSyntax } from "./utils/at-rule.ts";
import { parseAtRulePage } from "./utils/at-rule-page.ts";
import { parseAtRuleFontFeatureValues } from "./utils/at-rule-font-feature-values.ts";
import { matchGenericSyntax } from "./utils/at-rule-generic.ts";
import { eqMatrix } from "../ast/transform/minify.ts";

declare type T = AstDeclaration | AstAtRule | AstRule | AstKeyframesRule | AstKeyframesAtRule;

export const trimWhiteSpace: EnumToken[] = [
    EnumToken.CommentTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ColumnCombinatorTokenType,
];
const BadTokensTypes: EnumToken[] = [
    EnumToken.BadCommentTokenType,
    EnumToken.BadCdoTokenType,
    EnumToken.BadUrlTokenType,
    EnumToken.BadStringTokenType,
];

export const atRulesMap: Map<string, EnumToken> = new Map([["keyframes", EnumToken.KeyframesAtRuleNodeType]]);

let keyNameCounter: number = 0;
let keyNameCache: Record<string, string> = {};

const forbiddenStartCharacters: number[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) =>
    c.charCodeAt(0),
);

/**
 * short-scoped name generator.
 *
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @returns string
 */
export function getShortNameGenerator(localName: string, filePath: string, pattern: string, hashLength = 5): string {
    const key = `${localName}_${filePath}_${pattern}_${hashLength}`;

    if (key in keyNameCache!) {
        return keyNameCache![key];
    }

    let value: string = keyNameCounter!.toString(36);
    keyNameCounter!++;

    while (forbiddenStartCharacters.includes(value.charCodeAt(0))) {
        value = keyNameCounter!.toString(36);
        keyNameCounter!++;
    }

    return (keyNameCache![key] = value);
}

function reject(reason?: any) {
    throw new Error(reason ?? "Parsing aborted");
}

/**
 * transform case of key name
 * @param key
 * @param how
 *
 * @throws Error
 * @private
 */
export function getKeyName(key: string, how: ModuleCaseTransformEnum) {
    switch (how) {
        case ModuleCaseTransformEnum.CamelCase:
        case ModuleCaseTransformEnum.CamelCaseOnly:
            return camelize(key);

        case ModuleCaseTransformEnum.DashCase:
        case ModuleCaseTransformEnum.DashCaseOnly:
            return dasherize(key);
    }

    return key;
}

/**
 * generate scoped name
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @throws Error
 * @private
 */
export async function generateScopedName(
    localName: string,
    filePath: string,
    pattern: string,
    hashLength = 5,
): Promise<string> {
    if (localName.startsWith("--")) {
        localName = localName.slice(2);
    }

    const matches = /.*?(([^/]+)\/)?([^/\\]*?)(\.([^?/]+))?([?].*)?$/.exec(filePath);
    const folder = matches?.[2]?.replace?.(/[^A-Za-z0-9_-]/g, "_") ?? "";
    const fileBase = matches?.[3] ?? "";
    const ext = matches?.[5] ?? "";
    const path = filePath.replace(/[^A-Za-z0-9_-]/g, "_");
    // sanitize localName for safe char set (replace spaces/illegal chars)
    const safeLocal: string = localName.replace(/[^A-Za-z0-9_-]/g, "_");
    const hashString: string = `${localName}::${filePath}`;

    let result: string = "";
    let inParens: number = 0;
    let key: string = "";
    let position: number = 0;

    // Compose final scoped name. Ensure the entire class doesn't start with a digit:
    for (const char of pattern) {
        position += char.length;

        if (char == "[") {
            inParens++;

            if (inParens != 1) {
                throw new Error(`Unexpected character: '${char} at position ${position - 1}' in pattern '${pattern}'`);
            }

            continue;
        }

        if (char == "]") {
            inParens--;

            if (inParens != 0) {
                throw new Error(`Unexpected character: '${char}:${position - 1}'`);
            }

            let hashAlgo: string | null = null;
            let length: number | null = null;

            if (key.includes(":")) {
                const parts: string[] = key.split(":");

                if (parts.length == 2) {
                    // @ts-ignore
                    [key, length] = parts;

                    // @ts-ignore
                    if (key == "hash" && hashAlgorithms.includes(length as string)) {
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
                    throw new Error(
                        `Unsupported hash length: '${length}'. expecting format [hash:length] or [hash:hash-algo:length]`,
                    );
                }
            }

            switch (key) {
                case "hash":
                    result += await hash(hashString, length ?? hashLength, hashAlgo as string);
                    break;

                case "name":
                    result += length != null ? fileBase.slice(0, +length) : fileBase;
                    break;

                case "local":
                    result += length != null ? safeLocal.slice(0, +length) : localName;
                    break;

                case "ext":
                    result += length != null ? ext.slice(0, +length) : ext;
                    break;

                case "path":
                    result += length != null ? path.slice(0, +length) : path;
                    break;

                case "folder":
                    result += length != null ? folder.slice(0, +length) : folder;
                    break;

                default:
                    throw new Error(`Unsupported key: '${key}'`);
            }

            key = "";
            continue;
        }

        if (inParens > 0) {
            key += char;
        } else {
            result += char;
        }
    }

    // if leading char is digit, prefix underscore (very rare)
    return (/^[0-9]/.test(result) ? "_" : "") + result;
}

/**
 * parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
export async function doParse(
    iter: Generator<TokenizeResult> | AsyncGenerator<TokenizeResult>,
    options: ParserOptions = {},
): Promise<ParseResult> {
    if (options.signal != null) {
        options.signal.addEventListener("abort", reject);
    }

    options = {
        src: "",
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
        ...options,
    };

    if (typeof options.validation == "boolean") {
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
    const src: string = options.src as string;
    const stack: Array<AstNode | AstComment> = [];
    const stats: ParseResultStats = {
        src: options.src ?? "",
        bytesIn: 0,
        nodesCount: 0,
        tokensCount: 0,
        importedBytesIn: 0,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: [],
    };

    let ast: AstStyleSheet = {
        typ: EnumToken.StyleSheetNodeType,
        chi: [],
    };

    let tokens: Token[] = [];
    let context: AstRuleList | AstInvalidAtRule | AstInvalidRule = ast;

    if (options.sourcemap) {
        ast.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1,
            },
            end: {
                ind: 0,
                lin: 1,
                col: 1,
            },
            src: "",
        };
    }

    let valuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
    let preValuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
    let postValuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
    let preVisitorsHandlersMap: Map<
        "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
        Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
    >;
    let visitorsHandlersMap: Map<
        "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
        Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, GenericVisitorAstNodeHandlerMap<T>>>
    >;
    let postVisitorsHandlersMap: Map<
        "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
        Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
    >;

    const imports: AstAtRule[] = [];

    let item: TokenizeResult;
    let node:
        | AstAtRule
        | AstRule
        | AstKeyFrameRule
        | AstKeyframesAtRule
        | AstInvalidRule
        | AstDeclaration
        | AstComment
        | null;
    // @ts-ignore ignore error
    let isAsync: boolean = typeof iter[Symbol.asyncIterator] === "function";

    if (options.visitor != null) {
        valuesHandlers = new Map() as Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
        preValuesHandlers = new Map() as Map<EnumToken, Array<GenericVisitorHandler<Token>>>;
        postValuesHandlers = new Map() as Map<EnumToken, Array<GenericVisitorHandler<Token>>>;

        preVisitorsHandlersMap = new Map();
        visitorsHandlersMap = new Map();
        postVisitorsHandlersMap = new Map();

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
                if (typeof value == "function") {
                    if (!valuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {
                        valuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                    }

                    valuesHandlers.get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!.push(value);
                } else if (
                    typeof value == "object" &&
                    "type" in value &&
                    "handler" in value &&
                    value.type in WalkerEvent
                ) {
                    if (value.type == WalkerEvent.Enter) {
                        if (!preValuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {
                            preValuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                        }

                        preValuesHandlers
                            .get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!
                            .push(value.handler);
                    } else if (value.type == WalkerEvent.Leave) {
                        if (!postValuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {
                            postValuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                        }

                        postValuesHandlers
                            .get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!
                            .push(value.handler);
                    }
                } else {
                    errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
                }
            } else if (["Declaration", "Rule", "AtRule", "KeyframesRule", "KeyframesAtRule"].includes(key)) {
                if (typeof value == "function") {
                    if (
                        !visitorsHandlersMap.has(
                            key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                        )
                    ) {
                        visitorsHandlersMap.set(
                            key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                            [],
                        );
                    }

                    visitorsHandlersMap
                        .get(key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule")!
                        .push(value);
                } else if (typeof value == "object") {
                    if ("type" in value && "handler" in value && value.type in WalkerEvent) {
                        if (value.type == WalkerEvent.Enter) {
                            if (
                                !preVisitorsHandlersMap.has(
                                    key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                                )
                            ) {
                                preVisitorsHandlersMap.set(
                                    key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                                    [],
                                );
                            }

                            preVisitorsHandlersMap
                                .get(key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule")!
                                .push(value.handler);
                        } else if (value.type == WalkerEvent.Leave) {
                            if (
                                !postVisitorsHandlersMap.has(
                                    key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                                )
                            ) {
                                postVisitorsHandlersMap.set(
                                    key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                                    [],
                                );
                            }

                            postVisitorsHandlersMap
                                .get(key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule")!
                                .push(value.handler);
                        }
                    } else {
                        if (
                            !visitorsHandlersMap.has(
                                key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                            )
                        ) {
                            visitorsHandlersMap.set(
                                key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
                                [],
                            );
                        }

                        visitorsHandlersMap
                            .get(key as "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule")!
                            .push(value);
                    }
                } else {
                    errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
                }
            } else {
                errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
            }
        }
    }

    while (
        (item = isAsync
            ? ((await iter.next()).value as TokenizeResult)
            : ((iter as Iterator<TokenizeResult>).next().value as TokenizeResult))
    ) {
        stats.bytesIn = item.bytesIn;
        stats.tokensCount++;

        if (options.sourcemap !== false) {
            Object.defineProperty(item.token, "loc", {
                ...definedPropertySettings,
                value: item.token.loc,
                enumerable: true,
            });
        }

        if (BadTokensTypes.includes(item.token.typ)) {
            tokens.push(item.token);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item.token,
                location: item.token.loc,
            });

            // bad token
            continue;
        }

        // if (item.token.typ != EnumToken.EOFTokenType) {
        tokens.push(item.token);
        // }

        if (
            item.token.typ === EnumToken.SemiColonTokenType ||
            item.token.typ === EnumToken.BlockStartTokenType ||
            item.token.typ === EnumToken.EOFTokenType
        ) {
            node = parseNode(tokens, context, options as ParserOptions, errors, stats);

            if (node != null) {
                if ("chi" in node) {
                    stack.push(node as AstAtRule | AstRule | AstKeyFrameRule | AstInvalidRule);
                    context = node as AstRuleList;
                } else if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).nam === "import") {
                    imports.push(node);
                }
            } else if (item.token.typ == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;
                tokens = [item.token];

                do {
                    item = isAsync
                        ? ((await iter.next()).value as TokenizeResult)
                        : ((iter as Iterator<TokenizeResult>).next().value as TokenizeResult);

                    if (item == null) {
                        break;
                    }

                    tokens.push(item.token);

                    if (item.token.typ === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    } else if (item.token.typ === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                } while (inBlock != 0);

                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        location: {
                            src,
                            sta: tokens[0].loc!.sta,
                            end: tokens[tokens.length - 1].loc!.end,
                        },
                    });
                }
            }

            tokens = [];
        } else if (item.token.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options as ParserOptions, errors, stats);

            if (context.loc != null) {
                context.loc.end = item.token.loc!.end;
            }

            const previousNode = stack.pop() as AstRuleList;
            context = (stack[stack.length - 1] ?? ast) as AstRuleList;

            // if (previousNode != null && previousNode.typ == EnumToken.InvalidRuleNodeType) {

            //     const index: number = context.chi!.findIndex(node => node == previousNode);

            //     if (index > -1) {

            //         context.chi!.splice(index, 1);
            //     }
            // }

            if (
                options.removeEmpty &&
                previousNode != null &&
                previousNode.chi!.length == 0 &&
                context.chi![context.chi!.length - 1] == previousNode
            ) {
                context.chi!.pop();
            }

            tokens = [];
        }
    }

    if (tokens.length > 0) {
        node = parseNode(tokens, context, options as ParserOptions, errors, stats);

        if (node != null) {
            if (node.typ == EnumToken.AtRuleNodeType && "import" === (node as AstAtRule).val) {
                imports.push(node);
            }

            if ("chi" in node /* && node.typ != EnumToken.InvalidRuleNodeType */) {
                stack.push(node);
                context = node as AstRuleList;
            }
        }

        // if (context != null && context.typ == EnumToken.InvalidRuleNodeType) {

        //     // @ts-ignore ignore error
        //     const index: number = context.chi.findIndex((node: AstNode): boolean => node === context);

        //     if (index > -1) {

        //         (context as AstInvalidRule).chi.splice(index, 1);
        //     }
        // }
    }

    if (imports.length > 0 && options.resolveImport) {
        await Promise.all(
            imports.map(async (node: AstAtRule) => {
                const token = (node.tokens as Token[])[0] as UrlToken | StringToken;
                const url: string = token.typ == EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;

                try {
                    const result = options.load!(url, <string>options.src) as LoadResult;
                    const stream =
                        result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                            ? await result
                            : result;
                    const root: ParseResult = await doParse(
                        stream instanceof ReadableStream
                            ? tokenizeStream(stream)
                            : tokenize({
                                  stream,
                                  buffer: "",
                                  offset: 0,
                                  position: { ind: 0, lin: 1, col: 1 },
                                  currentPosition: { ind: -1, lin: 1, col: 0 },
                              } as ParseInfo),
                        Object.assign({}, options, {
                            minify: false,
                            setParent: false,
                            src: options.resolve!(url, options.src as string).absolute,
                        }) as ParserOptions,
                    );

                    stats.importedBytesIn += root.stats.bytesIn;
                    stats.imports.push(root.stats);
                    node.parent!.chi.splice(node.parent!.chi.indexOf(node), 1, ...root.ast.chi);

                    if (root.errors.length > 0) {
                        errors.push(...root.errors);
                    }
                } catch (error) {
                    // @ts-ignore ignore error
                    errors.push({ action: "ignore", message: ("doParse: " + error.message) as string, error });
                }
            }),
        );
    }

    while (stack.length > 0 && context != ast) {
        const previousNode: AstAtRule | AstRule = stack.pop() as AstAtRule | AstRule;
        context = (stack[stack.length - 1] ?? ast) as AstRuleList;

        // remove empty nodes
        if (
            options.removeEmpty &&
            previousNode != null &&
            previousNode.chi!.length == 0 &&
            context.chi![context.chi!.length - 1] == previousNode
        ) {
            context.chi!.pop();
            continue;
        }

        // remove invalid nodes
        if (
            !options.lenient &&
            previousNode?.parent != null &&
            // @ts-expect-error
            (previousNode!.typ == EnumToken.InvalidRuleNodeType || previousNode!.typ == EnumToken.InvalidAtRuleNodeType)
        ) {
            for (let i = context.chi!.length - 1; i >= 0; i--) {
                if (context.chi![i] == previousNode) {
                    context.chi!.splice(i, 1);
                    break;
                }
            }
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
            if (
                valuesHandlers!.size > 0 ||
                preVisitorsHandlersMap!.size > 0 ||
                visitorsHandlersMap!.size > 0 ||
                postVisitorsHandlersMap!.size > 0
            ) {
                if (
                    (result.node.typ == EnumToken.DeclarationNodeType &&
                        (preVisitorsHandlersMap!.has("Declaration") ||
                            visitorsHandlersMap!.has("Declaration") ||
                            postVisitorsHandlersMap!.has("Declaration"))) ||
                    (result.node.typ == EnumToken.AtRuleNodeType &&
                        (preVisitorsHandlersMap!.has("AtRule") ||
                            visitorsHandlersMap!.has("AtRule") ||
                            postVisitorsHandlersMap!.has("AtRule"))) ||
                    (result.node.typ == EnumToken.KeyframesAtRuleNodeType &&
                        (preVisitorsHandlersMap!.has("KeyframesAtRule") ||
                            visitorsHandlersMap!.has("KeyframesAtRule") ||
                            postVisitorsHandlersMap!.has("KeyframesAtRule")))
                ) {
                    const handlers = [] as Array<GenericVisitorHandler<T> | Record<string, GenericVisitorHandler<T>>>;
                    const key =
                        result.node.typ == EnumToken.DeclarationNodeType
                            ? "Declaration"
                            : result.node.typ == EnumToken.AtRuleNodeType
                              ? "AtRule"
                              : "KeyframesAtRule";

                    if (preVisitorsHandlersMap!.has(key)) {
                        handlers.push(
                            // @ts-expect-error
                            ...(preVisitorsHandlersMap!.get(key)! as
                                | GenericVisitorHandler<T>
                                | Record<string, GenericVisitorHandler<T>>),
                        );
                    }

                    if (visitorsHandlersMap!.has(key)) {
                        // @ts-ignore
                        handlers.push(...visitorsHandlersMap.get(key)!);
                    }

                    if (postVisitorsHandlersMap!.has(key)) {
                        // @ts-ignore
                        handlers.push(...postVisitorsHandlersMap.get(key));
                    }

                    let node: AstDeclaration | AstAtRule | AstKeyframesAtRule = result.node as
                        | AstDeclaration
                        | AstAtRule
                        | AstKeyframesAtRule;

                    for (const handler of handlers) {
                        callable =
                            typeof handler == "function"
                                ? handler
                                : (handler[
                                      camelize(
                                          node.typ === EnumToken.DeclarationNodeType ||
                                              node.typ === EnumToken.AtRuleNodeType
                                              ? (node as AstDeclaration | AstAtRule).nam
                                              : (node as AstKeyframesAtRule).val,
                                      )
                                  ] as GenericVisitorHandler<T>);

                        if (callable == null) {
                            continue;
                        }

                        replacement = callable(node, result.parent);

                        if (replacement == null) {
                            continue;
                        }

                        isAsync =
                            replacement instanceof Promise ||
                            Object.getPrototypeOf(replacement).constructor.name == "AsyncFunction";

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
                        replaceToken(
                            result.parent as AstRule | AstAtRule | AstKeyframesAtRule | AstKeyFrameRule | AstStyleSheet,
                            result.node,
                            node,
                        );
                    }
                } else if (
                    (result.node.typ == EnumToken.RuleNodeType &&
                        (preVisitorsHandlersMap!.has("Rule") ||
                            visitorsHandlersMap!.has("Rule") ||
                            postVisitorsHandlersMap!.has("Rule"))) ||
                    (result.node.typ == EnumToken.KeyFramesRuleNodeType &&
                        (preVisitorsHandlersMap!.has("KeyframesRule") ||
                            visitorsHandlersMap!.has("KeyframesRule") ||
                            postVisitorsHandlersMap!.has("KeyframesRule")))
                ) {
                    const handlers = [] as Array<
                        | GenericVisitorHandler<T>
                        | {
                              type: WalkerEvent;
                              handler: GenericVisitorHandler<T>;
                          }
                    >;
                    const key = result.node.typ == EnumToken.RuleNodeType ? "Rule" : "KeyframesRule";

                    if (preVisitorsHandlersMap!.has(key)) {
                        handlers.push(...(preVisitorsHandlersMap!.get(key)! as Array<GenericVisitorHandler<T>>));
                    }

                    if (visitorsHandlersMap!.has(key)) {
                        handlers.push(...(visitorsHandlersMap!.get(key)! as Array<GenericVisitorHandler<T>>));
                    }

                    if (postVisitorsHandlersMap!.has(key)) {
                        handlers.push(...(postVisitorsHandlersMap!.get(key)! as Array<GenericVisitorHandler<T>>));
                    }

                    let node = result.node;

                    for (const callable of handlers) {
                        replacement = (callable as GenericVisitorHandler<T>)(
                            node as T,
                            result.parent,
                        ) as GenericVisitorResult<T>;

                        if (replacement == null) {
                            continue;
                        }

                        isAsync =
                            replacement instanceof Promise ||
                            Object.getPrototypeOf(replacement).constructor.name == "AsyncFunction";

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

                            isAsync =
                                replacement instanceof Promise ||
                                Object.getPrototypeOf(replacement).constructor.name == "AsyncFunction";

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

                    const tokens: Token[] = "tokens" in result.node ? (result.node.tokens as Token[]) : [];

                    if ("val" in result.node && Array.isArray(result.node.val)) {
                        tokens.push(...(result.node.val as Token[]));
                    }

                    if (tokens.length == 0) {
                        continue;
                    }

                    for (const { value, parent, root } of walkValues(tokens, result.node)) {
                        node = value;

                        if (valuesHandlers!.has(node!.typ)) {
                            for (const valueHandler of valuesHandlers!.get(node!.typ)!) {
                                callable = valueHandler as GenericVisitorHandler<T>;
                                let result: GenericVisitorResult<T> = callable(node as T, parent, root);

                                if (result == null) {
                                    continue;
                                }

                                isAsync =
                                    result instanceof Promise ||
                                    Object.getPrototypeOf(result).constructor.name == "AsyncFunction";

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
            let passes: number = options.pass ?? (1 as number);

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
            total: `${(endTime - startTime).toFixed(2)}ms`,
        },
    } as ParseResult;

    if (options.module) {
        const moduleSettings = {
            hashLength: 5,
            filePath: "",
            scoped: ModuleScopeEnumOptions.Local,
            naming: ModuleCaseTransformEnum.IgnoreCase,
            pattern: "",
            generateScopedName,
            ...(typeof options.module != "object" ? {} : options.module),
        } as ModuleOptions;

        const parseModuleTime: number = performance.now();
        const namesMapping: Record<string, string> = {};
        const global = new Set<Token>();
        const processed = new Set<Token>();
        const pattern: string | null = typeof options.module == "boolean" ? null : (moduleSettings.pattern as string);
        const importMapping: Record<string, Record<string, string>> = {} as Record<string, Record<string, string>>;
        const cssVariablesMap: Record<string, Record<string, CssVariableToken>> = {};
        const importedCssVariables: Record<string, CssVariableToken> = {};
        let mapping: Record<string, string> = {};
        let revMapping = {} as Record<string, string>;
        let filePath: string =
            typeof options.module == "boolean"
                ? (options.src as string)
                : ((moduleSettings.filePath ?? options.src) as string);

        filePath =
            filePath === ""
                ? (options.src as string)
                : options.resolve!(filePath, options.dirname!(options.src as string), options.cwd).relative;

        if (typeof options.module == "number") {
            if (options.module & ModuleCaseTransformEnum.CamelCase) {
                moduleSettings.naming = ModuleCaseTransformEnum.CamelCase;
            } else if (options.module & ModuleCaseTransformEnum.CamelCaseOnly) {
                moduleSettings.naming = ModuleCaseTransformEnum.CamelCaseOnly;
            } else if (options.module & ModuleCaseTransformEnum.DashCase) {
                moduleSettings.naming = ModuleCaseTransformEnum.DashCase;
            } else if (options.module & ModuleCaseTransformEnum.DashCaseOnly) {
                moduleSettings.naming = ModuleCaseTransformEnum.DashCaseOnly;
            }

            if (options.module & ModuleScopeEnumOptions.Global) {
                moduleSettings.scoped = ModuleScopeEnumOptions.Global;
            }

            if (options.module & ModuleScopeEnumOptions.Pure) {
                // @ts-ignore
                moduleSettings.scoped |= ModuleScopeEnumOptions.Pure;
            }

            if (options.module & ModuleScopeEnumOptions.Shortest) {
                // @ts-ignore
                moduleSettings.scoped |= ModuleScopeEnumOptions.Shortest;
            }

            if (options.module & ModuleScopeEnumOptions.ICSS) {
                // @ts-ignore
                moduleSettings.scoped |= ModuleScopeEnumOptions.ICSS;
            }
        }

        if (typeof moduleSettings.scoped == "boolean") {
            moduleSettings.scoped = moduleSettings.scoped
                ? ModuleScopeEnumOptions.Local
                : ModuleScopeEnumOptions.Global;
        }

        if (moduleSettings.scoped! & ModuleScopeEnumOptions.Shortest) {
            moduleSettings.generateScopedName = getShortNameGenerator;
        }

        moduleSettings.filePath = filePath;
        moduleSettings.pattern =
            pattern != null && pattern !== "" ? pattern : filePath === "" ? `[local]_[hash]` : `[local]_[hash]_[name]`;

        for (const { node, parent } of walk(ast)) {
            if (node.typ == EnumToken.CssVariableImportTokenType) {
                const url: string = (
                    (node as CssVariableImportTokenType).val.find(
                        (t) => t.typ == EnumToken.StringTokenType,
                    ) as StringToken
                ).val.slice(1, -1);
                const src = options.resolve!(url, options.dirname!(options.src as string), options.cwd);
                const result = options.load!(url, <string>options.src) as LoadResult;
                const stream =
                    result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                        ? await result
                        : result;
                const root: ParseResult = await doParse(
                    stream instanceof ReadableStream
                        ? tokenizeStream(stream)
                        : tokenize({
                              stream,
                              buffer: "",
                              offset: 0,
                              position: { ind: 0, lin: 1, col: 1 },
                              currentPosition: { ind: -1, lin: 1, col: 0 },
                          } as ParseInfo),
                    Object.assign({}, options, {
                        minify: false,
                        setParent: false,
                        src: src.relative,
                    }) as ParserOptions,
                );

                cssVariablesMap[(node as CssVariableImportTokenType).nam] = root.cssModuleVariables!;
                parent!.chi!.splice(parent!.chi!.indexOf(node), 1);
                continue;
            }

            if (node.typ == EnumToken.CssVariableDeclarationMapTokenType) {
                const from = (node as CssVariableMapTokenType).from.find(
                    (t) => t.typ == EnumToken.IdenTokenType || isIdentColor(t),
                ) as IdentToken;

                if (!(from.val in cssVariablesMap)) {
                    errors.push({
                        node,
                        message: `could not resolve @value import from '${from.val}'`,
                        action: "drop",
                    });
                } else {
                    for (const token of (node as CssVariableMapTokenType).vars) {
                        if (token.typ == EnumToken.IdenTokenType || isIdentColor(token)) {
                            if (!((token as IdentToken).val in cssVariablesMap[from.val])) {
                                errors.push({
                                    node,
                                    message: `value '${(token as IdentToken).val}' is not exported from '${from.val}'`,
                                    action: "drop",
                                });

                                continue;
                            }

                            result.cssModuleVariables ??= {};
                            result.cssModuleVariables[(token as IdentToken).val] = importedCssVariables[
                                (token as IdentToken).val
                            ] = cssVariablesMap[from.val][(token as IdentToken).val];
                        }
                    }
                }

                parent!.chi!.splice(parent!.chi!.indexOf(node), 1);
                continue;
            }

            if (node.typ == EnumToken.CssVariableTokenType) {
                if (parent?.typ == EnumToken.StyleSheetNodeType) {
                    if (result.cssModuleVariables == null) {
                        result.cssModuleVariables = {} as Record<string, CssVariableToken>;
                    }

                    result.cssModuleVariables[node.nam] = node;
                }
                parent!.chi!.splice(parent!.chi!.indexOf(node), 1);
                continue;
            }

            if (node.typ == EnumToken.DeclarationNodeType) {
                if (node.nam.startsWith("--")) {
                    if (!(node.nam in namesMapping)) {
                        let result =
                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                ? node.nam
                                : moduleSettings.generateScopedName!(
                                      node.nam,
                                      moduleSettings.filePath as string,
                                      moduleSettings.pattern as string,
                                      moduleSettings.hashLength,
                                  );
                        let value: string = result instanceof Promise ? await result : result;

                        mapping[node.nam] =
                            "--" +
                            (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                            moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                : value);
                        revMapping[node.nam] = node.nam;
                    }

                    node.nam = mapping[node.nam];
                }

                if (equalsIgnoreCase("composes", node.nam)) {
                    const tokens = [] as ComposesSelectorToken[];
                    // let isValid: boolean = true;

                    for (const token of node.val) {
                        if (token.typ == EnumToken.ComposesSelectorNodeType) {
                            // if (!((token as ComposesSelectorToken).r == null || (token as ComposesSelectorToken).r!.typ == EnumToken.StringTokenType || (token as ComposesSelectorToken).r!.typ == EnumToken.IdenTokenType)) {

                            //     errors.push({
                            //         action: 'drop',
                            //         message: `composes '${EnumToken[(token.r! as IdentToken).typ]}' is not supported`,
                            //         node
                            //     });

                            //     isValid = false;
                            //     break;
                            // }
                            tokens.push(token as ComposesSelectorToken);
                        }
                    }

                    // find parent rule
                    let parentRule = node.parent as AstRule;

                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        console.debug("parent rule", parentRule);
                        parentRule = parentRule.parent as AstRule;
                    }

                    if (/* !isValid || */ tokens.length == 0) {
                        // if (tokens.length == 0) {

                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });
                        // }

                        (parentRule as AstRule).chi.splice((parentRule as AstRule).chi.indexOf(node), 1);
                        continue;
                    }

                    for (const token of tokens) {
                        // composes: a b c;
                        if (token.r == null) {
                            for (const rule of token.l) {
                                if (
                                    rule.typ == EnumToken.WhitespaceTokenType ||
                                    rule.typ == EnumToken.CommentTokenType
                                ) {
                                    continue;
                                }

                                if (!((rule as IdentToken).val in mapping)) {
                                    let result =
                                        moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                            ? (rule as IdentToken).val
                                            : moduleSettings.generateScopedName!(
                                                  (rule as IdentToken).val,
                                                  moduleSettings.filePath as string,
                                                  moduleSettings.pattern as string,
                                                  moduleSettings.hashLength,
                                              );
                                    let value: string = result instanceof Promise ? await result : result;

                                    mapping[(rule as DashedIdentToken).val] =
                                        (rule.typ == EnumToken.DashedIdenTokenType ? "--" : "") +
                                        (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                            ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                            : value);
                                    revMapping[mapping[(rule as DashedIdentToken).val]] = (
                                        rule as DashedIdentToken
                                    ).val;
                                }

                                if (parentRule != null) {
                                    for (const tk of (parentRule as AstRule).tokens!) {
                                        if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                            const val: string = (tk as ClassSelectorToken).val.slice(1);

                                            if (val in revMapping) {
                                                const key = revMapping[val] as string;
                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        mapping[(rule as IdentToken).val],
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // composes: a b c from 'file.css';
                        else if (token.r.typ == EnumToken.String) {
                            const url: string = (token.r as StringToken).val.slice(1, -1);
                            const src = options.resolve!(url, options.dirname!(options.src as string), options.cwd);
                            const result = options.load!(url, <string>options.src) as LoadResult;
                            const stream =
                                result instanceof Promise ||
                                Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                                    ? await result
                                    : result;
                            const root: ParseResult = await doParse(
                                stream instanceof ReadableStream
                                    ? tokenizeStream(stream)
                                    : tokenize({
                                          stream,
                                          buffer: "",
                                          offset: 0,
                                          position: { ind: 0, lin: 1, col: 1 },
                                          currentPosition: { ind: -1, lin: 1, col: 0 },
                                      } as ParseInfo),
                                Object.assign({}, options, {
                                    minify: false,
                                    setParent: false,
                                    src: src.relative,
                                }) as ParserOptions,
                            );

                            const srcIndex: string =
                                (src.relative.startsWith("/") || src.relative.startsWith("../") ? "" : "./") +
                                src.relative;

                            if (Object.keys(root.mapping as Record<string, string>).length > 0) {
                                importMapping[srcIndex] = {} as Record<string, string>;
                            }

                            if (parentRule != null) {
                                for (const tk of (parentRule as AstRule).tokens!) {
                                    if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                        const val: string = (tk as ClassSelectorToken).val.slice(1);

                                        if (val in revMapping) {
                                            const key = revMapping[val] as string;
                                            const values = [] as string[];

                                            for (const iden of token.l) {
                                                if (
                                                    iden.typ != EnumToken.IdenTokenType &&
                                                    iden.typ != EnumToken.DashedIdenTokenType
                                                ) {
                                                    continue;
                                                }

                                                if (!((iden as IdentToken | DashedIdentToken).val in root.mapping!)) {
                                                    const result =
                                                        moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                                            ? (iden as IdentToken | DashedIdentToken).val
                                                            : moduleSettings.generateScopedName!(
                                                                  (iden as IdentToken | DashedIdentToken).val,
                                                                  srcIndex,
                                                                  moduleSettings.pattern as string,
                                                                  moduleSettings.hashLength,
                                                              );

                                                    let value: string =
                                                        result instanceof Promise ? await result : result;

                                                    root.mapping![(iden as IdentToken | DashedIdentToken).val] =
                                                        moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                                            ? getKeyName(
                                                                  value,
                                                                  moduleSettings.naming as ModuleCaseTransformEnum,
                                                              )
                                                            : value;
                                                    root.revMapping![
                                                        root.mapping![(iden as IdentToken | DashedIdentToken).val]
                                                    ] = (iden as IdentToken | DashedIdentToken).val;
                                                }

                                                importMapping[srcIndex][(iden as IdentToken | DashedIdentToken).val] =
                                                    root.mapping![(iden as IdentToken | DashedIdentToken).val];
                                                values.push(root.mapping![(iden as IdentToken | DashedIdentToken).val]);
                                            }

                                            mapping[key] = [...new Set([...mapping[key].split(" "), ...values])].join(
                                                " ",
                                            );
                                        }
                                    }
                                }
                            }
                        }

                        // composes: a b c from global;
                        else if (token.r.typ == EnumToken.IdenTokenType) {
                            // global
                            if (parentRule != null) {
                                if (equalsIgnoreCase("global", (token.r as IdentToken).val)) {
                                    for (const tk of (parentRule as AstRule).tokens!) {
                                        if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                            const val: string = (tk as ClassSelectorToken).val.slice(1);

                                            if (val in revMapping) {
                                                const key = revMapping[val] as string;
                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        ...(token as ComposesSelectorToken).l.reduce((acc, curr) => {
                                                            if (curr.typ == EnumToken.IdenTokenType) {
                                                                acc.push((curr as IdentToken).val);
                                                            }

                                                            return acc;
                                                        }, [] as string[]),
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                } else {
                                    errors.push({
                                        action: "drop",
                                        message: `composes '${(token.r as IdentToken).val}' is not supported`,
                                        node,
                                    });
                                }
                            }
                        }
                    }

                    (parentRule as AstRule).chi.splice((parentRule as AstRule).chi.indexOf(node), 1);
                }

                if (
                    node.typ == EnumToken.DeclarationNodeType &&
                    [
                        "grid-column",
                        "grid-column-start",
                        "grid-column-end",
                        "grid-row",
                        "grid-row-start",
                        "grid-row-end",
                        "grid-template",
                        "grid-template-columns",
                        "grid-template-rows",
                    ].includes(node.nam)
                ) {
                    for (const { value } of walkValues(node.val, node)) {
                        if (value.typ != EnumToken.IdenTokenType) {
                            continue;
                        }

                        let idenToken = (value as IdentToken).val;
                        let suffix: string = "";

                        if (idenToken.endsWith("-start")) {
                            suffix = "-start";
                            idenToken = idenToken.slice(0, -6);
                        } else if (idenToken.endsWith("-end")) {
                            suffix = "-end";
                            idenToken = idenToken.slice(0, -4);
                        }

                        if (!(idenToken in mapping)) {
                            let result =
                                moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                    ? idenToken
                                    : moduleSettings.generateScopedName!(
                                          idenToken,
                                          moduleSettings.filePath as string,
                                          moduleSettings.pattern as string,
                                          moduleSettings.hashLength,
                                      );

                            if (result instanceof Promise) {
                                result = await result;
                            }

                            mapping[idenToken] = result;
                            revMapping[result] = idenToken;

                            if (suffix !== "") {
                                idenToken += suffix;

                                if (!(idenToken in mapping)) {
                                    mapping[idenToken] = result + suffix;
                                    revMapping[result + suffix] = idenToken;
                                }
                            }
                        }

                        (value as IdentToken).val = mapping[idenToken];
                    }
                } else if (node.nam == "grid-template-areas" || node.nam == "grid-template") {
                    for (let i = 0; i < node.val.length; i++) {
                        if (node.val[i].typ == EnumToken.String) {
                            const tokens = parseString((node.val[i] as StringToken).val.slice(1, -1), {
                                location: true,
                            });

                            for (const { value } of walkValues(tokens)) {
                                if (
                                    value.typ == EnumToken.IdenTokenType ||
                                    value.typ == EnumToken.DashedIdenTokenType
                                ) {
                                    if ((value as IdentToken).val in mapping) {
                                        (value as IdentToken).val = mapping[(value as IdentToken).val];
                                    } else {
                                        let result =
                                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                                ? (value as IdentToken).val
                                                : moduleSettings.generateScopedName!(
                                                      (value as IdentToken).val,
                                                      moduleSettings.filePath as string,
                                                      moduleSettings.pattern as string,
                                                      moduleSettings.hashLength,
                                                  );

                                        if (result instanceof Promise) {
                                            result = await result;
                                        }

                                        mapping[(value as IdentToken).val] = result;
                                        revMapping[result] = (value as IdentToken).val;
                                        (value as IdentToken).val = result;
                                    }
                                }
                            }

                            (node.val[i] as StringToken).val =
                                (node.val[i] as StringToken).val.charAt(0) +
                                tokens.reduce((acc, curr) => acc + renderToken(curr), "") +
                                (node.val[i] as StringToken).val.charAt((node.val[i] as StringToken).val.length - 1);
                        }
                    }
                } else if (node.nam == "animation" || node.nam == "animation-name") {
                    for (const { value } of walkValues(node.val, node)) {
                        if (
                            value.typ == EnumToken.IdenTokenType &&
                            ![
                                "none",
                                "infinite",
                                "normal",
                                "reverse",
                                "alternate",
                                "alternate-reverse",
                                "forwards",
                                "backwards",
                                "both",
                                "running",
                                "paused",
                                "linear",
                                "ease",
                                "ease-in",
                                "ease-out",
                                "ease-in-out",
                                "step-start",
                                "step-end",
                                "jump-start",
                                "jump-end",
                                "jump-none",
                                "jump-both",
                                "start",
                                "end",
                                "inherit",
                                "initial",
                                "unset",
                            ].includes((value as IdentToken).val)
                        ) {
                            if (!((value as IdentToken).val in mapping)) {
                                const result =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? (value as IdentToken).val
                                        : moduleSettings.generateScopedName!(
                                              (value as IdentToken).val,
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                mapping[(value as IdentToken).val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[(value as IdentToken).val]] = (value as IdentToken).val;
                            }

                            (value as IdentToken).val = mapping[(value as IdentToken).val];
                        }
                    }
                }

                for (const { value, parent } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        if (!((value as DashedIdentToken).val in mapping)) {
                            const result =
                                moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                    ? (value as DashedIdentToken).val
                                    : moduleSettings.generateScopedName!(
                                          (value as DashedIdentToken).val,
                                          moduleSettings.filePath as string,
                                          moduleSettings.pattern as string,
                                          moduleSettings.hashLength,
                                      );
                            let val: string = result instanceof Promise ? await result : result;

                            mapping[(value as DashedIdentToken).val] =
                                "--" +
                                (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                    ? getKeyName(val, moduleSettings.naming as ModuleCaseTransformEnum)
                                    : val);
                            revMapping[mapping[(value as DashedIdentToken).val]] = (value as DashedIdentToken).val;
                        }

                        (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                    } else if (
                        (value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        (value as IdentToken).val in importedCssVariables
                    ) {
                        replaceToken(parent, value, importedCssVariables[(value as IdentToken).val].val);
                    }
                }
            } else if (node.typ == EnumToken.RuleNodeType) {
                if (node.tokens == null) {
                    const tokens = parseString(node.sel, { location: true });
                    matchSelectorSyntax(tokens, [] as ErrorDescription[], options);

                    Object.defineProperty(node, "tokens", {
                        ...definedPropertySettings,
                        value: trimArray(tokens),
                    });

                    let i: number;
                    const stack: Token[] = [];

                    for (i = 0; i < tokens.length; i++) {
                        if (tokensfuncDefMap.has(tokens[i].typ)) {
                            stack.push(tokens[i]);
                            continue;
                        } else if (tokens[i].typ == EnumToken.EndParensTokenType) {
                            const func = stack.at(-1) as PseudoClassFunctionToken;

                            tokens.splice(i, 1);

                            // @ts-expect-error
                            func.typ = tokensfuncDefMap.get(func.typ)!;
                            func.chi = tokens.splice(tokens.indexOf(func) + 1, i - 1);
                            stack.pop();
                        }
                    }

                    // console.debug({tokens});
                }

                let hasIdOrClass: boolean = false;

                for (const { value } of walkValues(
                    (node as AstRule).tokens as Token[],
                    node,
                    // @ts-ignore
                    (value: Token, parent: AstRule) => {
                        if (value.typ == EnumToken.PseudoClassTokenType) {
                            const val: string = (value as PseudoClassToken).val.toLowerCase();
                            switch (val) {
                                case ":local":
                                case ":global":
                                    {
                                        let index: number = (parent as AstRule).tokens!.indexOf(value);

                                        (parent as AstRule).tokens!.splice(index, 1);

                                        if (
                                            (parent as AstRule).tokens![index]?.typ == EnumToken.WhitespaceTokenType ||
                                            (parent as AstRule).tokens![index]?.typ ==
                                                EnumToken.DescendantCombinatorTokenType
                                        ) {
                                            (parent as AstRule).tokens!.splice(index, 1);
                                        }

                                        if (val == ":global") {
                                            for (; index < (parent as AstRule).tokens!.length; index++) {
                                                if (
                                                    (parent as AstRule).tokens![index].typ ==
                                                        EnumToken.CommaTokenType ||
                                                    ([
                                                        EnumToken.PseudoClassFuncTokenType,
                                                        EnumToken.PseudoClassTokenType,
                                                    ].includes((parent as AstRule).tokens![index].typ) &&
                                                        [":global", ":local"].includes(
                                                            (
                                                                (parent as AstRule).tokens![index] as PseudoClassToken
                                                            ).val.toLowerCase(),
                                                        ))
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
                                case ":global":
                                    for (const token of (value as FunctionToken).chi) {
                                        global.add(token);
                                    }

                                    (parent as AstRule).tokens!.splice(
                                        (parent as AstRule).tokens!.indexOf(value),
                                        1,
                                        ...(value as FunctionToken).chi,
                                    );
                                    break;

                                case ":local":
                                    (parent as AstRule).tokens!.splice(
                                        (parent as AstRule).tokens!.indexOf(value),
                                        1,
                                        ...(value as FunctionToken).chi,
                                    );
                                    break;
                            }
                        }
                    },
                )) {
                    if (value.typ == EnumToken.HashTokenType || value.typ == EnumToken.ClassSelectorTokenType) {
                        hasIdOrClass = true;
                    }

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
                                const result =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? val
                                        : moduleSettings.generateScopedName!(
                                              val,
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                let value: string = result instanceof Promise ? await result : result;

                                mapping[val] =
                                    moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                    moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                        ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                        : value;
                                revMapping[mapping[val]] = val;
                            }

                            (value as ClassSelectorToken).val = "." + mapping[val];
                        }
                    }
                }

                if (moduleSettings.scoped! & ModuleScopeEnumOptions.Pure) {
                    if (!hasIdOrClass) {
                        throw new Error(
                            `pure module: No id or class found in selector '${node.sel}' at '${node.loc?.src ?? ""}':${node.loc?.sta?.lin ?? ""}:${node.loc?.sta?.col ?? ""}`,
                        );
                    }
                }

                node.sel = "";

                for (const token of node.tokens! as Token[]) {
                    node.sel += renderToken(token);
                }
            } else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val: string = node.nam.toLowerCase();

                if (node.tokens == null) {
                    Object.defineProperty(node, "tokens", {
                        ...definedPropertySettings,
                        // @ts-ignore
                        value: parseString(node.val),
                    });
                }

                if (val == "property" || val == "keyframes") {
                    const prefix: string = val == "property" ? "--" : "";

                    for (const value of node.tokens as Token[]) {
                        if (
                            (prefix == "--" && value.typ == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && value.typ == EnumToken.IdenTokenType)
                        ) {
                            if (!((value as DashedIdentToken | IdentToken).val in mapping)) {
                                const result =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? (value as DashedIdentToken | IdentToken).val
                                        : moduleSettings.generateScopedName!(
                                              (value as DashedIdentToken).val,
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                let val: string = result instanceof Promise ? await result : result;

                                mapping[(value as DashedIdentToken | IdentToken).val] =
                                    prefix +
                                    (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                    moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                        ? getKeyName(val, moduleSettings.naming as ModuleCaseTransformEnum)
                                        : val);
                                revMapping[mapping[(value as DashedIdentToken).val]] = (value as DashedIdentToken).val;
                            }

                            (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                        }
                    }

                    (node as AstAtRule).val = node.tokens!.reduce((a: string, b: Token) => a + renderToken(b), "");
                } else {
                    let isReplaced: boolean = false;

                    for (const { value, parent } of walkValues(node.tokens, node)) {
                        if (
                            EnumToken.MediaQueryConditionTokenType == parent.typ &&
                            value != (parent as MediaQueryConditionToken).l
                        ) {
                            if (
                                (value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                                (value as IdentToken).val in importedCssVariables
                            ) {
                                isReplaced = true;
                                (parent as MediaQueryConditionToken).r.splice(
                                    (parent as MediaQueryConditionToken).r.indexOf(value),
                                    1,
                                    ...importedCssVariables[(value as IdentToken).val].val,
                                );
                            }
                        }
                    }

                    if (isReplaced) {
                        node.val = node.tokens!.reduce((a: string, b: Token) => a + renderToken(b), "");
                    }
                }
            }
        }

        if (moduleSettings.naming != ModuleCaseTransformEnum.IgnoreCase) {
            revMapping = {};
            mapping = Object.entries(mapping).reduce(
                (acc: Record<string, string>, [key, value]: [string, string]) => {
                    const keyName = getKeyName(key, moduleSettings.naming!);

                    acc[keyName] = value;
                    revMapping[value] = keyName;

                    return acc;
                },
                {} as Record<string, string>,
            );
        }

        result.mapping = mapping;
        result.revMapping = revMapping;

        if (moduleSettings.scoped! & ModuleScopeEnumOptions.ICSS && Object.keys(importMapping).length > 0) {
            result.importMapping = importMapping;
        }

        endTime = performance.now();
        result.stats.module = `${(endTime - parseModuleTime).toFixed(2)}ms`;
        result.stats.total = `${(endTime - startTime).toFixed(2)}ms`;
    }

    if (options.signal != null) {
        options.signal.removeEventListener("abort", reject);
    }

    return result;
}

function parseNode(
    tokens: Token[],
    context: AstRuleList,
    options: ParserOptions,
    errors: ErrorDescription[],
    stats: ParseResultStats,
): AstRule | AstAtRule | AstKeyFrameRule | AstKeyframesAtRule | AstInvalidRule | AstDeclaration | AstComment | null {
    let i: number = 0;

    if (tokens.at(-1)?.typ === EnumToken.EOFTokenType) {
        tokens.pop();

        // check parenthesis are balanced
        let matchCount: number = 0;
        let position: Location = tokens.at(-1)?.loc as Location;

        for (let i = 0; i < tokens.length; i++) {
            const token: Token = tokens[i];

            if (token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token.typ)) {
                matchCount++;
            } else if (token.typ === EnumToken.EndParensTokenType) {
                matchCount--;
            }
        }

        if (matchCount > 0) {
            while (matchCount > 0) {
                position = {
                    ...position,
                    sta: { ...position.sta, ind: position.sta.ind + 1, col: position.sta.col + 1 },
                    end: { ...position.end, ind: position.end.ind + 1, col: position.end.col + 1 },
                };
                tokens.push(
                    Object.defineProperty(
                        {
                            typ: EnumToken.EndParensTokenType,
                            loc: tokens.at(-1)?.loc,
                        },
                        "loc",
                        {
                            ...definedPropertySettings,
                            value: { ...position },
                        },
                    ),
                );
                matchCount--;
            }
        }
    }

    for (; i < tokens.length; i++) {
        if (tokens[i].typ === EnumToken.CDOCOMMTokenType && context.typ !== EnumToken.StyleSheetNodeType) {
            errors.push({
                action: "drop",
                message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                node: tokens[i],
                location: tokens[i].loc,
            });

            Object.assign(tokens[i], { typ: EnumToken.InvalidCommentTokenType });
            continue;
        }

        if (
            tokens[i].typ === EnumToken.CommentTokenType ||
            tokens[i].typ === EnumToken.CDOCOMMTokenType ||
            tokens[i].typ === EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        break;
    }

    if (i > 0) {
        context.chi!.push(...(tokens.splice(0, i) as AstNode[]).filter((n) => n.typ !== EnumToken.WhitespaceTokenType));
    }

    for (; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {
            const location: Location = tokens[i]?.loc as Location;

            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: "drop",
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    location,
                });

                Object.assign(tokens[i], { typ: EnumToken.InvalidCommentTokenType });
                continue;
            }

            context.chi!.push(tokens[i] as AstNode);
            stats.nodesCount++;
        } else if (tokens[i].typ != EnumToken.WhitespaceTokenType) {
            break;
        }
    }

    if (tokens.length == 0) {
        return null;
    }

    let delim: Token = <Token>tokens.at(-1);

    if (
        delim.typ == EnumToken.SemiColonTokenType ||
        delim.typ == EnumToken.BlockStartTokenType ||
        delim.typ == EnumToken.BlockEndTokenType
    ) {
        tokens.pop();
    }

    if (tokens.length == 0) {
        return null;
    }

    if (tokens[0]?.typ == EnumToken.AtRuleTokenType) {
        let nestedRule: boolean = false;

        let parent: AstNode = context;
        let node;

        while (parent != null) {
            if (parent.typ == EnumToken.RuleNodeType) {
                nestedRule = true;
                break;
            }

            parent = parent.parent;
        }

        // console.debug({tokens, context})

        node = parseAtRule(
            tokens,
            context as AstStyleSheet | AstAtRule | AstRule,
            { ...options, nestedRule },
            errors,
            delim.typ == EnumToken.BlockStartTokenType,
        );

        if (node == null) {
            return null;
        }

        context.chi!.push(node);
        // @ts-expect-error
        return Object.defineProperty(node, "parent", { ...definedPropertySettings, value: context });

        // return "chi" in node ? node : null;
        // return node;
    } else {
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const node = parseSelector(tokens, context as AstRule | AstAtRule, options, errors);

            context.chi!.push(node);
            Object.defineProperty(node, "parent", { ...definedPropertySettings, value: context });

            return node;
        } else {
            const node = parseDeclaration(tokens, context as AstRule | AstAtRule, options, errors);
            Object.defineProperty(node, "parent", { ...definedPropertySettings, value: context });

            if (context.typ === EnumToken.StyleSheetNodeType && node.typ === EnumToken.DeclarationNodeType) {
                Object.assign(node, { typ: EnumToken.InvalidDeclarationNodeType });

                errors.push({
                    message: "<declaration> not allowed in <stylesheet>",
                    action: "drop",
                    node,
                    location: node.loc,
                });
            } else if (options.lenient || node.typ === EnumToken.DeclarationNodeType) {
                context.chi!.push(node);
            }
        }
    }

    return null;
}

/**mjgvgyikjkml,kmbm b8790u89y70
vbbnkit;;;jmjhyg77 * @param options
 * @param errors
 * @param parseAsBlock
 */

export function parseAtRule(
    stream: Token[],
    context: AstRule | AstAtRule | AstStyleSheet,
    options: ParserOptions,
    errors: ErrorDescription[],
    parseAsBlock: boolean | null = null,
): AstAtRule | AstInvalidAtRule | CssVariableImportTokenType | CssVariableToken | null {
    const rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + (stream[0] as AtRuleToken).nam);

    let success: boolean = true;
    let atRuleName = (stream[0] as AtRuleToken).nam;

    if (atRuleName.startsWith("-")) {
        atRuleName = atRuleName.replace(/^-[a-z]+-/, "").toLowerCase();
    }

    const atRule = stream.shift() as AtRuleToken;
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRule.nam);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];
    const blockAllowed: boolean = syntaxRules?.getBlockRules() != null;

    if (syntaxRules == null) {
        if (!options.lenient) {
            errors.push({
                action: "drop",
                node: atRule,
                location: atRule.loc,
                message: "unknown at-rule",
            });

            // @ts-expect-error
            return {
                ...atRule,
                typ: EnumToken.InvalidRuleNodeType,
                val: trimArray(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                ...(parseAsBlock ? { chi: [] } : {}),
            } as AstInvalidAtRule;
        }
    } else if (
        context.typ === EnumToken.AtRuleNodeType &&
        "page" === (context as AstAtRule).nam &&
        pageMarginBoxType.has(atRuleName.toLowerCase())
    ) {
        if (parseAsBlock === false) {
            errors.push({
                action: "drop",
                node: atRule,
                location: atRule.loc,
                message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
            });

            // @ts-expect-error
            return {
                ...atRule,
                typ: EnumToken.InvalidRuleNodeType,
                val: trimArray(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                ...(parseAsBlock ? { chi: [] } : {}),
            } as AstInvalidAtRule;
        }
        const token =
            stream.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ === EnumToken.CommentTokenType) ?? null;
        if (token != null) {
            errors.push({
                action: "drop",
                node: token,
                location: token.loc,
                message: `unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
            });

            // @ts-expect-error
            return {
                ...atRule,
                typ: EnumToken.InvalidRuleNodeType,
                val: trimArray(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                ...(parseAsBlock ? { chi: [] } : {}),
            } as AstInvalidAtRule;
        }
    }

    if (parseAsBlock === null) {
        parseAsBlock = blockAllowed;
    }

    if (syntax != null && atRule.nam !== "layer" && parseAsBlock !== blockAllowed) {
        success = false;
        errors.push({
            action: "drop",
            node: atRule,
            location: atRule.loc,
            message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
        });

        // @ts-expect-error
        return {
            ...atRule,
            typ: EnumToken.InvalidRuleNodeType,
            val: trimArray(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
            ...(parseAsBlock ? { chi: [] } : {}),
        } as AstInvalidAtRule;
    }

    switch (atRuleName) {
        case "charset": {
            let success: boolean = true;

            if (
                stream.length === 0 ||
                stream[0].typ !== EnumToken.WhitespaceTokenType ||
                (stream[0] as WhitespaceToken).val !== " "
            ) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[0] ?? atRule,
                    location: (stream[0] ?? atRule).loc,
                    message: "expecting <space>",
                });
            } else if (stream[1].typ !== EnumToken.StringTokenType) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: (stream[1] ?? atRule).loc,
                    message: "expecting <string>",
                });
            }

            if (success && (stream[1] as StringToken).val.charCodeAt(0) !== 0x22) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: (stream[1] ?? atRule).loc,
                    message: "expecting double-quoted string",
                });
            }

            if (success && options.removeCharset) {
                return null;
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: trimArray(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                }),
                {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (stream.at(-1)! ?? atRule).loc!.end },
                    },
                    tokens: { ...definedPropertySettings, value: stream },
                },
            ) as AstAtRule | AstInvalidAtRule;
        }

        case "font-feature-values": {
            const result = parseAtRuleFontFeatureValues(stream, atRule, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: trimWhiteSpaceTokens(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                    chi: [] as Token[],
                }),
                {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (stream.at(-1)! ?? atRule).loc!.end },
                    },
                    tokens: { ...definedPropertySettings, value: stream },
                },
            ) as AstAtRule;
        }

        case "stylistic":
        case "historical-forms":
        case "character-variant":
        case "swash":
        case "ornaments":
        case "annotation": {
            let success: boolean =
                context.typ === EnumToken.AtRuleNodeType && "font-feature-values" === (context as AstAtRule).nam;

            if (!success) {
                errors.push({
                    action: "drop",
                    node: atRule,
                    location: atRule.loc,
                    message: `unexpected at-rule ${atRule.nam}`,
                });
            }

            if (success) {
                for (const token of stream) {
                    if (token.typ !== EnumToken.CommentTokenType && token.typ !== EnumToken.WhitespaceTokenType) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: token,
                            location: token.loc,
                            message: `unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
                        });
                    }
                }
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: trimWhiteSpaceTokens(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                    chi: [] as Token[],
                }),
                {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (stream.at(-1)! ?? atRule).loc!.end },
                    },
                    tokens: { ...definedPropertySettings, value: stream },
                },
            ) as AstAtRule;
        }

        case "container": {
            const result = parseAtRuleContainerQueryList(stream, atRule, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: trimWhiteSpaceTokens(stream).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                    chi: [] as Token[],
                }),
                {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (stream.at(-1)! ?? atRule).loc!.end },
                    },
                    tokens: { ...definedPropertySettings, value: stream },
                },
            ) as AstAtRule;
        }
        case "custom-media": {
            const tokens = trimArray(stream.slice(1));
            const result = matchAllSyntax(syntax, createValidationContext(tokens), options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: trimWhiteSpaceTokens(tokens).reduce((acc, curr) => acc + renderToken(curr, options), ""),
                }),
                {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (tokens.at(-1)! ?? atRule).loc!.end },
                    },
                    tokens: { ...definedPropertySettings, value: tokens },
                },
            ) as AstKeyframesAtRule;
        }
        case "keyframes": {
            // const result = matchAtRuleKeyframesSyntax(stream, context, options);

            const tokens = trimArray(stream.slice(1));
            const filtered: Token[] = stream.filter(
                (t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType,
            );

            if (
                filtered.length != 1 ||
                (filtered[0].typ !== EnumToken.IdenTokenType &&
                    filtered[0].typ !== EnumToken.StringTokenType &&
                    filtered[0].typ !== EnumToken.DashedIdenTokenType)
            ) {
                errors.push({
                    action: "drop",
                    node: atRule,
                    location: atRule.loc,
                    message: `expected <keyframe-name> at ${atRule.loc!.src}:${atRule.loc!.sta!.lin!}:${atRule.loc!.sta!.col!}`,
                });
                success = false;
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success ? EnumToken.KeyframesAtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: tokens.reduce((acc, curr) => acc + renderToken(curr, options), ""),
                    chi: [] as Array<AstKeyframesRule | AstComment>,
                }),
                {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (tokens.at(-1)! ?? atRule).loc!.end },
                    },
                    tokens: { ...definedPropertySettings, value: tokens },
                },
            ) as AstKeyframesAtRule;
        }

        case "namespace": {
            const result: ValidationMatch = matchAllSyntax(
                syntax as ValidationToken[],
                createValidationContext(stream),
                options,
            );

            if (!result.success) {
                errors.push(...result.errors);
            }

            const valid: boolean = blockAllowed === parseAsBlock && result.success;

            if (valid) {
                let start: number = 0;
                let end: number = -1;
                let hasString: boolean = false;

                for (start = 0; start < stream.length; start++) {
                    if (stream[start].typ == EnumToken.UrlFunctionTokenDefType) {
                        start++;
                        for (end = start; end < stream.length; end++) {
                            if (stream[end].typ == EnumToken.EndParensTokenType) {
                                break;
                            }

                            if (stream[end].typ === EnumToken.StringTokenType) {
                                hasString = true;
                            }
                        }
                        break;
                    }
                }

                // replace url(string) -> string
                if (hasString) {
                    stream.splice(start - 1, end - start + 2, ...stream.slice(start, end));
                }
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: valid ? EnumToken.AtRuleNodeType : EnumToken.InvalidAtRuleNodeType,
                    val: trimArray(stream).reduce(
                        (acc, t, index) =>
                            acc +
                            (t.typ === EnumToken.CommentTokenType ||
                            (t.typ === EnumToken.WhitespaceTokenType &&
                                stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                                (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                                ? ""
                                : renderToken(t, options)),
                        "",
                    ),
                    ...(parseAsBlock ? { chi: [] } : {}),
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstInvalidAtRule | AstAtRule;
        }

        case "import": {
            const result = matchAtRuleImportSyntax(atRule, stream, context, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            } else {
                if (
                    stream[0]?.typ == EnumToken.UrlFunctionTokenType &&
                    (stream[0] as FunctionToken).chi.some((t) => t.typ == EnumToken.StringTokenType)
                ) {
                    stream.splice(0, 1, ...(stream[0] as FunctionToken).chi);
                }
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: stream.reduce(
                        (acc, t, index) =>
                            acc +
                            (t.typ === EnumToken.CommentTokenType ||
                            (t.typ === EnumToken.WhitespaceTokenType &&
                                stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                                (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                                ? ""
                                : renderToken(t, options)),
                        "",
                    ),
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstAtRule;
        }

        case "supports":
        case "when":
        case "else": {
            trimWhiteSpaceTokens(stream);

            const result =
                atRuleName === "supports"
                    ? parseAtRuleSupportSyntax(stream, atRule, options)
                    : matchAtRuleWhenElseSyntax(stream, atRule, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            let success: boolean = true;

            if (atRule.nam === "else") {
                const siblings = (context as AstAtRule | AstStyleSheet).chi as AstNode[];
                let sibling: AstNode | null = null;
                let l: number = siblings.length;

                while (l--) {
                    if (
                        siblings[l].typ === EnumToken.WhitespaceTokenType ||
                        siblings[l].typ === EnumToken.CommentTokenType ||
                        siblings[l].typ === EnumToken.CDOCOMMTokenType
                    ) {
                        continue;
                    }

                    sibling = siblings[l];
                    break;
                }

                let missingWhen: boolean = false;
                let definedAfterLastElse: boolean = false;

                if (sibling == null || sibling.typ !== EnumToken.AtRuleNodeType) {
                    missingWhen = true;
                } else if (sibling.nam !== "when") {
                    if (sibling.nam !== "else") {
                        missingWhen = true;
                    } else if (sibling.val === "") {
                        definedAfterLastElse = true;
                    }
                }

                if (missingWhen) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: atRule.loc,
                        message: "at-rule @when is required before @else block",
                    });
                } else if (definedAfterLastElse) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: atRule.loc,
                        message: "at-rule @else block is defined after last @else block",
                    });
                }
            }

            // @ts-expect-error
            options = { ...options, minify: false, convertColor: false };

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success && result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: stream.reduce((acc, t) => acc + renderToken(t, options), ""),
                    chi: [],
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstAtRule;
        }
        case "media": {
            options = { ...options, parseColor: false };

            const result = parseMediaqueryList(stream, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: stream.reduce((acc, t) => acc + renderToken(t, options), ""),
                    chi: [],
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstAtRule | AstInvalidAtRule;
        }
        case "scope": {
            // options = { ...options, parseColor: false };

            // const result = parseMediaqueryList(stream, options);

            // if (result.errors.length > 0) {
            //     errors.push(...result.errors);
            // }

            let context = createValidationContext(trimArray(stream));

            let success: boolean = true;
            let range: Token[] = context.peekRange((t) => t.typ === EnumToken.EndParensTokenType);

            if (range[0]?.typ !== EnumToken.StartParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range[0] ?? atRule,
                    location: (range[0] ?? atRule).loc,
                    message: "expected '(' at start of @scope block",
                });
                success = false;
            } else if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range.at(-1) ?? atRule,
                    location: (range.at(-1) ?? atRule).loc,
                    message: "expected ')' at end of @scope block",
                });
                success = false;
            } else {
                const srange = range.slice(1, -1);
                const result = matchSelectorSyntax(srange, errors, options, true);

                if (!result.success) {
                    success = false;
                } else {
                    stream.splice(stream.indexOf(range[0]) + 1, range.length - 2, ...trimWhiteSpaceTokens(srange));
                }
            }

            let index: number = stream.indexOf(range.at(-1)!);

            if (stream.length > index + 1) {
                while (
                    stream[++index]?.typ === EnumToken.WhitespaceTokenType ||
                    stream[index]?.typ === EnumToken.CommentTokenType
                );

                if (index < stream.length) {
                    if (
                        stream[index].typ !== EnumToken.IdenTokenType ||
                        "to" !== (stream[index] as IdentToken).val.toLowerCase()
                    ) {
                        errors.push({
                            action: "drop",
                            node: stream[index],
                            location: stream[index]?.loc,
                            message: "expected 'to' at end of @scope block",
                        });
                        success = false;
                    } else {
                        while (
                            stream[++index]?.typ === EnumToken.WhitespaceTokenType ||
                            stream[index]?.typ === EnumToken.CommentTokenType
                        );

                        if (stream[index].typ !== EnumToken.StartParensTokenType) {
                            errors.push({
                                action: "drop",
                                node: stream[index],
                                location: stream[index]?.loc,
                                message: "expected 'to' at end of @scope block",
                            });
                            success = false;
                        } else {
                            context = createValidationContext(stream.slice(index));
                            range = context.peekRange((t) => t.typ === EnumToken.EndParensTokenType);
                            if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                                errors.push({
                                    action: "drop",
                                    node: range.at(-1) ?? atRule,
                                    location: (range.at(-1) ?? atRule).loc,
                                    message: "expected ')' at end of @scope block",
                                });
                                success = false;
                            } else {
                                const srange = range.slice(1, -1);
                                const result = matchSelectorSyntax(srange, errors, options, true);

                                if (!result.success) {
                                    success = false;
                                } else {
                                    stream.splice(
                                        stream.indexOf(range[0]) + 1,
                                        range.length - 2,
                                        ...trimWhiteSpaceTokens(srange),
                                    );
                                }
                            }
                        }
                    }
                }
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: stream.reduce((acc, t) => acc + renderToken(t, options), ""),
                    chi: [],
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstAtRule | AstInvalidAtRule;
        }
        case "page": {
            trimArray(stream);

            const result = parseAtRulePage(atRule, stream, options, errors);

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: stream.reduce((acc, t) => acc + renderToken(t, options), ""),
                    chi: [],
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstAtRule | AstInvalidAtRule;
        }
        case "top-left-corner":
        case "top-left":
        case "top-center":
        case "top-right":
        case "top-right-corner":
        case "bottom-left-corner":
        case "bottom-left":
        case "bottom-right":
        case "bottom-right-corner":
        case "left-top":
        case "left-middle":
        case "left-bottom":
        case "right-top":
        case "right-middle":
        case "right-bottom": {
            if (context.typ !== EnumToken.AtRuleNodeType || (context as AstAtRule).nam !== "page") {
                success = false;
                errors.push({
                    action: "drop",
                    node: atRule,
                    location: atRule.loc,
                    message: "node is allowd only in @page rule",
                });
            } else {
                trimArray(stream);

                for (let i = 0; i < stream.length; i++) {
                    if (
                        stream[i].typ !== EnumToken.WhitespaceTokenType &&
                        stream[i].typ !== EnumToken.CommentTokenType
                    ) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: stream[i],
                            location: stream[i].loc,
                            message: "expected whitespace or comment",
                        });
                        break;
                    }
                }
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: stream.reduce((acc, t) => acc + renderToken(t, options), ""),
                    chi: [],
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstAtRule | AstInvalidAtRule;
        }

        case "value": {
            let index: number = 0;
            let isVarDeclaration: boolean = false;

            for (; index < stream.length; index++) {
                // tokens[k].typ == EnumToken.PseudoClassTokenType
                if (stream[index].typ == EnumToken.PseudoClassTokenType) {
                    Object.assign(stream[index], {
                        typ: EnumToken.IdenTokenType,
                        val: (stream[index] as IdentToken).val.slice(1),
                    });

                    stream.splice(
                        index,
                        0,
                        Object.defineProperty(
                            {
                                typ: EnumToken.ColonTokenType,
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stream[index].loc, end: { ...stream[index]?.loc?.sta } },
                            },
                        ),
                    );

                    isVarDeclaration = true;
                    break;
                } else if (stream[index].typ == EnumToken.ColonTokenType) {
                    isVarDeclaration = true;
                    break;
                } else if (
                    stream[index].typ == EnumToken.IdenTokenType &&
                    equalsIgnoreCase("from", (stream[index] as IdentToken).val)
                ) {
                    break;
                }
            }

            // supported syntaxes:
            // @value <ident>: <string>; // import from file as alias
            // @value id : <declaration-value>; // variable declaration
            // @value <ident># from <ident>; // import variables from alias
            let result = matchAllSyntax(
                syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[],
                createValidationContext(stream),
                options,
            );

            if (!result.success) {
                errors.push(...result.errors);

                return Object.defineProperty(
                    {
                        typ: EnumToken.InvalidAtRuleNodeType,
                        val: stream.reduce((acc, t) => acc + renderToken(t, options), ""),
                    },
                    "loc",
                    {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                ) as AstInvalidAtRule;
            }

            if (isVarDeclaration) {
                const nam: Token = stream.find((t) => t.typ == EnumToken.IdenTokenType) as Token;
                const value: Token[] = trimArray(
                    stream.slice(index + 1).filter((t) => t.typ != EnumToken.CommentTokenType),
                );

                if (value.length == 1 && value[0].typ == EnumToken.StringTokenType) {
                    // import from file as alias
                    return {
                        typ: EnumToken.CssVariableImportTokenType,
                        nam: (nam as IdentToken).val,
                        val: value,
                    } as CssVariableImportTokenType;
                }

                // import variables from alias
                return {
                    typ: EnumToken.CssVariableTokenType,
                    nam: (nam as IdentToken).val,
                    val: value,
                } as CssVariableToken;
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: EnumToken.CssVariableDeclarationMapTokenType,
                    vars: trimArray(stream.slice(0, index)),
                    from: stream.slice(index + 1),
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as CssVariableMapTokenType;
        }

        default: {
            options = { ...options, parseColor: false };

            let result = null;

            if (syntax == null) {
                // check matching '(' and ')'
                // check commas , or ,,
                // check colon :
                // check or and and
                result = matchGenericSyntax(atRule, stream, options);

                if (result.errors.length > 0) {
                    errors.push(...result.errors);
                }
            } else {
                result = matchAtRuleSyntax(atRule, stream, options);

                if (result.success) {
                    let i: number = 0;
                    const stack: Token[] = [];

                    for (; i < stream.length; i++) {
                        if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
                            stack.push(stream[i]);
                            continue;
                        }

                        if (stream[i].typ === EnumToken.EndParensTokenType && stack.length > 0) {
                            const index = stream.indexOf(stack[stack.length - 1]);

                            stream[index].loc!.end = stream[i].loc!.end;
                            Object.assign(stream[index], {
                                typ: tokensfuncDefMap.get(stream[index].typ)!,
                                chi: stream.splice(index + 1, i - index - 1),
                            });
                            i = index;
                            stream.splice(index + 1, 1);
                            stack.pop();
                            // continue;
                        }
                    }
                }
            }

            // @ts-expect-error
            return Object.defineProperties(
                Object.assign(atRule, {
                    typ: result.success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: trimWhiteSpaceTokens(stream).reduce((acc, t) => acc + renderToken(t, options), ""),
                    ...(parseAsBlock ? { chi: [] } : {}),
                }),
                {
                    tokens: { ...definedPropertySettings, value: stream.slice() },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc!.end) } },
                    },
                },
            ) as AstInvalidAtRule;
        }
    }
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
    return doParse(
        tokenize({
            stream: `.x{${declaration}}`,
            buffer: "",
            offset: 0,
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 },
        } as ParseInfo),
        { setParent: false, minify: false, validation: false },
    ).then((result) => {
        return (result.ast.chi[0] as AstRule).chi.filter(
            (t) =>
                t.typ == EnumToken.DeclarationNodeType ||
                t.typ == EnumToken.CommentNodeType ||
                t.typ == EnumToken.InvalidDeclarationNodeType,
        ) as Array<AstDeclaration | AstComment>;
    });
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
export function parseString(src: string, options: { location: boolean; src?: string } = { location: false }): Token[] {
    const parseInfo: ParseInfo = {
        stream: src,
        src: options.src ?? "",
        buffer: "",
        acc: "",
        offset: 0,
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    };

    return parseTokens(
        [...tokenize(parseInfo)].map((t) => t.token),
        { sourcemap: options.location },
    ).slice(0, -1);
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

        if (t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == "from" && i > 0) {
            const left: Token[] = [];
            const right: Token[] = [];

            let foundLeft: number = 0;
            let foundRight: number = 0;
            let k: number = i;
            let l: number = i;

            while (k > 0) {
                if (
                    tokens[k - 1].typ == EnumToken.CommentTokenType ||
                    tokens[k - 1].typ == EnumToken.WhitespaceTokenType
                ) {
                    left.push(tokens[--k]);
                    continue;
                }

                if (
                    tokens[k - 1].typ == EnumToken.IdenTokenType ||
                    tokens[k - 1].typ == EnumToken.DashedIdenTokenType
                ) {
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
                        return a == null
                            ? b
                            : b.typ == EnumToken.IdenTokenType || b.typ == EnumToken.StringTokenType
                              ? b
                              : a;
                    }, null),
                });

                i = k;
                continue;
            }
        }

        if (
            t.typ == EnumToken.WhitespaceTokenType &&
            (i == 0 ||
                i + 1 == tokens.length ||
                [
                    EnumToken.CommaTokenType,
                    EnumToken.GteTokenType,
                    EnumToken.LteTokenType,
                    EnumToken.ColumnCombinatorTokenType,
                ].includes(tokens[i + 1].typ) ||
                (i > 0 && trimWhiteSpace.includes(tokens[i - 1].typ)))
        ) {
            tokens.splice(i--, 1);
            continue;
        }

        if (t.typ == EnumToken.ColonTokenType) {
            const typ: EnumToken = tokens[i + 1]?.typ;

            if (typ != null) {
                if (typ == EnumToken.FunctionTokenType) {
                    tokens[i + 1].typ = EnumToken.PseudoClassFuncTokenType;
                } else if (typ == EnumToken.IdenTokenType) {
                    (<PseudoClassToken>tokens[i + 1]).val = ":" + (<PseudoClassToken>tokens[i + 1]).val;
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
                chi: tokens.splice(i + 1, k - i),
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
                    if (
                        (slice.charAt(0) != "-" || (slice.charAt(0) == "-" && isIdentStart(slice.charCodeAt(1)))) &&
                        isIdent(slice)
                    ) {
                        Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                    }
                } else if (val.typ == EnumToken.LiteralTokenType && (val as LiteralToken).val == "|") {
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
                        r: (<Token[]>attr.chi)[upper],
                    };

                    (<Token[]>attr.chi).splice(upper, 1);

                    if (lower >= 0) {
                        (<Token[]>attr.chi).splice(lower, 1);
                        m--;
                    }
                } else if (
                    [
                        EnumToken.DashMatchTokenType,
                        EnumToken.StartMatchTokenType,
                        EnumToken.ContainMatchTokenType,
                        EnumToken.EndMatchTokenType,
                        EnumToken.IncludeMatchTokenType,
                        EnumToken.DelimTokenType,
                    ].includes((<Token[]>attr.chi)[m].typ)
                ) {
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
                        if (
                            (slice.charAt(0) != "-" || (slice.charAt(0) == "-" && isIdentStart(slice.charCodeAt(1)))) &&
                            isIdent(slice)
                        ) {
                            Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                        }
                    }

                    val = (<Token[]>attr.chi)[upper];

                    if (val.typ == EnumToken.StringTokenType) {
                        const slice: string = (val as StringToken).val.slice(1, -1);
                        if (
                            (slice.charAt(0) != "-" || (slice.charAt(0) == "-" && isIdentStart(slice.charCodeAt(1)))) &&
                            isIdent(slice)
                        ) {
                            Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                        }
                    }

                    // @ts-ignore
                    const typ = <
                        | EnumToken.DashMatchTokenType
                        | EnumToken.StartMatchTokenType
                        | EnumToken.ContainMatchTokenType
                        | EnumToken.EndMatchTokenType
                        | EnumToken.IncludeMatchTokenType
                    >(<
                        | DashMatchToken
                        | StartMatchToken
                        | ContainMatchToken
                        | EndMatchToken
                        | IncludeMatchToken
                        | EqualMatchToken
                    >(<Token[]>(t as AttrStartToken).chi)[m]).typ;

                    // @ts-ignore
                    (<Token[]>(t as AttrStartToken).chi)[m] = <MatchExpressionToken>{
                        typ: EnumToken.MatchExpressionTokenType,
                        op: {
                            // @ts-ignore
                            typ: typ == EnumToken.DelimTokenType ? EnumToken.EqualMatchTokenType : typ,
                        },
                        l: (<Token[]>(t as AttrStartToken).chi)[lower],
                        r: (<Token[]>(t as AttrStartToken).chi)[upper],
                    };

                    if (isIdentColor(((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).l)) {
                        ((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).l.typ =
                            EnumToken.IdenTokenType;
                    }

                    if (isIdentColor(((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).r)) {
                        ((<Token[]>(t as AttrStartToken).chi)[m] as MatchExpressionToken).r.typ =
                            EnumToken.IdenTokenType;
                    }

                    (<Token[]>(t as AttrStartToken).chi).splice(upper, 1);
                    (<Token[]>(t as AttrStartToken).chi).splice(lower, 1);

                    upper = m;
                    m--;

                    while (
                        upper < ((t as AttrStartToken).chi as Token[]).length &&
                        (<Token[]>(t as AttrStartToken).chi)[upper].typ == EnumToken.WhitespaceTokenType
                    ) {
                        upper++;
                    }

                    if (
                        upper < ((t as AttrStartToken).chi as Token[]).length &&
                        (<Token[]>(t as AttrStartToken).chi)[upper].typ == EnumToken.IdenTokenType &&
                        ["i", "s"].includes((<IdentToken>(<Token[]>(t as AttrStartToken).chi)[upper]).val.toLowerCase())
                    ) {
                        (<MatchExpressionToken>(<Token[]>(t as AttrStartToken).chi)[m]).attr = <"i" | "s">(
                            (<IdentToken>(<Token[]>(t as AttrStartToken).chi)[upper]).val
                        );
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
                            (<PseudoClassToken>tokens[k + 1]).val = ":" + (<PseudoClassToken>tokens[k + 1]).val;
                        } else if (typ == EnumToken.FunctionTokenType) {
                            (<PseudoClassFunctionToken>tokens[k + 1]).typ = EnumToken.PseudoClassFuncTokenType;
                            (<PseudoClassFunctionToken>tokens[k + 1]).val =
                                ":" + (<PseudoClassFunctionToken>tokens[k + 1]).val;
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
                for (const { value, parent } of walkValues((<FunctionToken>t).chi)) {
                    if (value.typ == EnumToken.WhitespaceTokenType) {
                        const p = <FunctionToken | ParensToken>(parent ?? t);

                        for (let i = 0; i < p.chi.length; i++) {
                            // @ts-ignore
                            if ((<FunctionToken | ParensToken>p).chi[i] == value) {
                                // @ts-ignore
                                p.chi.splice(i, 1);
                                i--;
                                break;
                            }
                        }
                    } else if (
                        value.typ == EnumToken.LiteralTokenType &&
                        ["+", "-", "/", "*"].includes((<LiteralToken>value).val)
                    ) {
                        // @ts-ignore
                        value.typ =
                            (<LiteralToken>value).val === "+"
                                ? EnumToken.Add
                                : (<LiteralToken>value).val === "-"
                                  ? EnumToken.Sub
                                  : (<LiteralToken>value).val === "*"
                                    ? EnumToken.Mul
                                    : EnumToken.Div;

                        // @ts-ignore
                        delete value.val;
                    }
                }

                (t as FunctionToken).chi = splitTokenList((t as FunctionToken).chi).reduce(
                    (acc: Token[], t: Token[]): Token[] => {
                        if (acc.length > 0) {
                            acc.push({ typ: EnumToken.CommaTokenType });
                        }

                        acc.push(buildExpression(t));
                        return acc;
                    },
                    [],
                );
            } else if (
                t.typ == EnumToken.FunctionTokenType &&
                ["minmax", "fit-content", "repeat"].includes((<FunctionToken>t).val)
            ) {
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
                    if ((t as FunctionURLToken).chi[0].val.slice(1, 5) != "data:" && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        (t as FunctionURLToken).chi[0].typ = EnumToken.UrlTokenTokenType;

                        // @ts-ignore
                        (t as FunctionURLToken).chi[0].val =
                            options.src !== "" && options.resolveUrls
                                ? options.resolve!(value, options.src as string)?.absolute
                                : value;
                    }
                }

                if ((t as FunctionURLToken).chi[0]?.typ == EnumToken.UrlTokenTokenType) {
                    if (options.src !== "" && options.resolveUrls) {
                        // @ts-ignore
                        (t as FunctionURLToken).chi[0].val = options.resolve(
                            (t as FunctionURLToken).chi[0].val,
                            options.src as string,
                            options.cwd,
                        ).relative;
                    }
                }
            }

            // @ts-ignore
            if (t.chi.length > 0) {
                if (
                    t.typ == EnumToken.PseudoClassFuncTokenType &&
                    (t as PseudoClassFunctionToken).val === ":is" &&
                    options.minify
                ) {
                    const count: number = (t as PseudoClassFunctionToken).chi.filter(
                        (t: Token): boolean => t.typ != EnumToken.CommentTokenType,
                    ).length;
                    if (
                        count == 1 ||
                        (i == 0 && (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == EnumToken.CommaTokenType &&
                            (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1))
                    ) {
                        tokens.splice(i, 1, ...(t as PseudoClassFunctionToken).chi);
                        i = Math.max(0, i - (t as PseudoClassFunctionToken).chi.length);
                    }
                }
            }
        }
    }

    return tokens;
}
