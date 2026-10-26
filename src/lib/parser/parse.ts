import { isColor, isIdentColor, parseColor } from "../syntax/syntax.ts";
import { camelize, dasherize, equalsIgnoreCase } from "./utils/text.ts";
import { EnumAstNodeStatus, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../ast/types.ts";
import { minify } from "../ast/minify.ts";
import { expand } from "../ast/expand.ts";
import { walk, WalkerEvent, walkValues } from "../ast/walk.ts";
import { Tokenizer } from "./tokenize.ts";
import type {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstKeyframesAtRule,
    AstKeyframesRule,
    AstNode,
    AstRule,
    AstRuleList,
    AstStyleSheet,
    AtRuleToken,
    AttrStartToken,
    ClassSelectorToken,
    ColorToken,
    ComposesSelectorToken,
    CssVariableImportTokenType,
    CssVariableMapTokenType,
    CssVariableToken,
    DashedIdentToken,
    DimensionToken,
    ErrorDescription,
    FunctionToken,
    GenericVisitorAstNodeHandlerMap,
    GenericVisitorAstNodeSyncHandlerMap,
    GenericVisitorHandler,
    GenericVisitorResult,
    IdentToken,
    LoadResult,
    ModuleSyncOptions,
    ParsedVisitorHandlers,
    ParseInfo,
    ParseResult,
    ParseResultStats,
    ParserOptions,
    ParserSyncOptions,
    PseudoClassToken,
    ResolvedPath,
    StringToken,
    Token,
    UrlToken,
    VisitorNodeMap,
    WhitespaceToken,
} from "../../@types/index.d.ts";
import {
    ERRORS,
    LOCEND,
    LOCSRCID,
    LOCSTA,
    pageMarginBoxType,
    PARENT,
    ROOT,
    STATE,
    TOKENS,
    tokensfuncDefMap,
} from "../syntax/constants.ts";
import { hash, hashAlgorithms, syncHash } from "../parser/utils/hash.ts";
import { parseSelector } from "./utils/selector.ts";
import { parseDeclaration } from "./utils/declaration.ts";
import { getSyntaxRule } from "../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, matchSelectorSyntax, trimArray } from "../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../validation/parser/typedef.ts";
import type { ValidationToken } from "../validation/parser/types.d.ts";
import { matchAtRuleImportSyntax } from "./utils/at-rule-import.ts";
import type { ValidationMatch } from "../validation/types.d.ts";
import { matchAtRuleWhenElseSyntax } from "./utils/at-rule-when-else.ts";
import { parseAtRuleSupportSyntax } from "./utils/at-rule-support.ts";
import { replaceNodeOrValue, trimWhiteSpaceTokens } from "./utils/token.ts";
import { parseAtRuleContainerQueryList } from "./utils/at-rule-container.ts";
import { parseMediaqueryList } from "./utils/at-rule-media.ts";
import { matchAtRuleSyntax } from "./utils/at-rule.ts";
import { parseAtRuleFontFeatureValues } from "./utils/at-rule-font-feature-values.ts";
import { matchGenericSyntax } from "./utils/at-rule-generic.ts";
import { memoize } from "./utils/cache.ts";
import { SourceFile } from "./source.ts";
import { dirname } from "../fs/resolve.ts";
import { Arena } from "./arena.ts";

function renderTokens(tokens: Token[] | null | undefined, options?: any): string {
    if (tokens == null || tokens.length === 0) return "";
    if (options != null) return tokens.map((t) => printValue(t, options)).join("");
    return tokens.map((t) => printValue(t)).join("");
}

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
new Map([["keyframes", EnumToken.KeyframesAtRuleNodeType]]);
let keyNameCounter: number = 0;

/**
 * Short-scoped name generator.
 *
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @returns string
 */
export const getShortNameGenerator = memoize((): string => {
    let value: string = keyNameCounter!.toString(36);
    let val: number = value.charAt(0).charCodeAt(0);
    keyNameCounter!++;

    // starts with'0' - '9'
    while (48 <= val && val <= 57) {
        value = keyNameCounter!.toString(36);
        keyNameCounter!++;
        val = value.charAt(0).charCodeAt(0);
    }

    return value;
});

function reject(reason?: any) {
    throw new Error(reason ?? "Parsing aborted");
}

/**
 * Transform case of key name
 * @param key
 * @param how
 *
 * @throws Error
 * @private
 */
export const getKeyName = memoize((key: string, how: ModuleCaseTransformEnum): string => {
    switch (how) {
        case ModuleCaseTransformEnum.CamelCase:
        case ModuleCaseTransformEnum.CamelCaseOnly:
            return camelize(key);

        case ModuleCaseTransformEnum.DashCase:
        case ModuleCaseTransformEnum.DashCaseOnly:
            return dasherize(key);
    }

    return key;
}) as (key: string, how: ModuleCaseTransformEnum) => string;

/**
 * Generate scoped name
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @throws Error
 * @private
 */
export const generateScopedName = memoize(
    async (localName: string, filePath: string, pattern: string, hashLength = 5): Promise<string> => {
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
                    throw new Error(
                        `Unexpected character: '${char} at position ${position - 1}' in pattern '${pattern}'`,
                    );
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

                const slice = length != null && length != fileBase.length;

                switch (key) {
                    case "hash":
                        result += await hash(hashString, length ?? hashLength, hashAlgo as string);
                        break;

                    case "name":
                        // @ts-expect-error
                        result += slice ? fileBase.slice(0, +length) : fileBase;
                        break;

                    case "local":
                        // @ts-expect-error
                        result += slice ? safeLocal.slice(0, +length) : localName;
                        break;

                    case "ext":
                        // @ts-expect-error
                        result += slice ? ext.slice(0, +length) : ext;
                        break;

                    case "path":
                        // @ts-expect-error
                        result += slice ? path.slice(0, +length) : path;
                        break;

                    case "folder":
                        // @ts-expect-error
                        result += slice ? folder.slice(0, +length) : folder;
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
    },
) as (localName: string, filePath: string, pattern: string, hashLength?: number) => Promise<string>;

export const generateSyncScopedName = memoize(
    (localName: string, filePath: string, pattern: string, hashLength = 5): string => {
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
                    throw new Error(
                        `Unexpected character: '${char} at position ${position - 1}' in pattern '${pattern}'`,
                    );
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

                            if ((hashAlgo as string).startsWith("sha")) {
                                throw new Error(
                                    `Unsupported hash algorithm: '${hashAlgo}'. Not supported by parseSync() or transformSync(). Use parse() or transform().`,
                                );
                            }
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

                const slice = length != null && length != fileBase.length;

                switch (key) {
                    case "hash":
                        result += syncHash(hashString, length ?? hashLength, hashAlgo as string);
                        break;

                    case "name":
                        // @ts-expect-error
                        result += slice ? fileBase.slice(0, +length) : fileBase;
                        break;

                    case "local":
                        // @ts-expect-error
                        result += slice ? safeLocal.slice(0, +length) : localName;
                        break;

                    case "ext":
                        // @ts-expect-error
                        result += slice ? ext.slice(0, +length) : ext;
                        break;

                    case "path":
                        // @ts-expect-error
                        result += slice ? path.slice(0, +length) : path;
                        break;

                    case "folder":
                        // @ts-expect-error
                        result += slice ? folder.slice(0, +length) : folder;
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
    },
) as (localName: string, filePath: string, pattern: string, hashLength?: number) => string;

/**
 *
 * @param visitorsDef
 * @param errors
 * @private
 */
function parseVisitors(
    visitorsDef: GenericVisitorHandler<T> | GenericVisitorAstNodeSyncHandlerMap<T> | VisitorNodeMap | VisitorNodeMap[],
    errors: ErrorDescription[],
): ParsedVisitorHandlers {
    const visitors = Object.entries(typeof visitorsDef === "function" ? [visitorsDef] : visitorsDef);
    let key: string;
    let value: any;
    let i: number;

    const allVisitorsHandlers: Set<GenericVisitorHandler<Token>> = new Set();
    const preAllVisitorsHandlers: Set<GenericVisitorHandler<Token>> = new Set();
    const postAllVisitorsHandlers: Set<GenericVisitorHandler<Token>> = new Set();
    const valuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>> = new Map();
    const preValuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>> = new Map();
    const postValuesHandlers: Map<EnumToken, Array<GenericVisitorHandler<Token>>> = new Map();
    const visitorsHandlersMap: Map<
        "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
        Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, GenericVisitorAstNodeHandlerMap<T>>>
    > = new Map();
    const preVisitorsHandlersMap: Map<
        "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
        Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
    > = new Map();
    const postVisitorsHandlersMap: Map<
        "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
        Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
    > = new Map();

    for (i = 0; i < visitors.length; i++) {
        key = visitors[i][0];
        value = visitors[i][1];

        if (Number.isInteger(+key)) {
            // if (Array.isArray(value)) {
            //     visitors.splice(i + 1, 0, ...Object.entries(value));
            //     continue;
            // }

            if (typeof value == "function") {
                key = value.name;
            }
        }

        // if (Array.isArray(value)) {
        //     // @ts-ignore
        //     visitors.splice(i + 1, 0, ...value.map((item) => [key, item]));
        //     continue;
        // }

        if (key in EnumToken) {
            if (typeof value == "function") {
                if (!valuesHandlers.has(EnumToken[key as keyof typeof EnumToken] as EnumToken)) {
                    valuesHandlers.set(EnumToken[key as keyof typeof EnumToken] as EnumToken, []);
                }

                valuesHandlers.get(EnumToken[key as keyof typeof EnumToken] as EnumToken)!.push(value);
            } else if (typeof value == "object") {
                if ("type" in value && "handler" in value && value.type in WalkerEvent) {
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
                    for (const val of Object.entries(value)) {
                        visitors.push(val);
                    }
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
        } else if (key == "All" || key == "visitor") {
            if (typeof value == "function") {
                allVisitorsHandlers.add(value);
            } else if (typeof value == "object") {
                if ("type" in value && "handler" in value && value.type in WalkerEvent) {
                    if (value.type == WalkerEvent.Enter) {
                        preAllVisitorsHandlers.add(value.handler);
                    } else if (value.type == WalkerEvent.Leave) {
                        postAllVisitorsHandlers.add(value.handler);
                    }
                }
            }
        } else {
            errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
        }
    }

    const allHandlers = [] as Array<
        | Map<
              "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
              Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
          >
        | Map<
              "Declaration" | "Rule" | "AtRule" | "KeyframesRule" | "KeyframesAtRule",
              Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, GenericVisitorAstNodeHandlerMap<T>>>
          >
        | Map<EnumToken, Array<GenericVisitorHandler<Token>>>
        | Map<
              EnumToken,
              Array<GenericVisitorAstNodeHandlerMap<T> | Record<string, Array<GenericVisitorAstNodeHandlerMap<T>>>>
          >
    >;

    if (preVisitorsHandlersMap!.size > 0) {
        allHandlers.push(preVisitorsHandlersMap!);
    }

    if (preValuesHandlers!.size > 0) {
        allHandlers.push(preValuesHandlers!);
    }

    if (visitorsHandlersMap!.size > 0) {
        allHandlers.push(visitorsHandlersMap!);
    }

    if (valuesHandlers!.size > 0) {
        allHandlers.push(valuesHandlers!);
    }

    if (postVisitorsHandlersMap!.size > 0) {
        allHandlers.push(postVisitorsHandlersMap!);
    }

    if (postValuesHandlers!.size > 0) {
        allHandlers.push(postValuesHandlers!);
    }

    const result = {
        allHandlers,
        includeTokens:
            preValuesHandlers!.size > 0 ||
            valuesHandlers!.size > 0 ||
            postValuesHandlers!.size > 0 ||
            allVisitorsHandlers.size > 0 ||
            preAllVisitorsHandlers.size > 0 ||
            postAllVisitorsHandlers.size > 0,
    } as ParsedVisitorHandlers;

    if (allVisitorsHandlers.size > 0) {
        result.allVisitorsHandlers = allVisitorsHandlers;
    }

    if (preAllVisitorsHandlers.size > 0) {
        result.preAllVisitorsHandlers = preAllVisitorsHandlers;
    }

    if (postAllVisitorsHandlers.size > 0) {
        result.postAllVisitorsHandlers = postAllVisitorsHandlers;
    }

    return result as ParsedVisitorHandlers;
}

/**
 * Parse css string
 * @param tokenizer
 * @param options
 *
 * @throws Error
 * @private
 */
export function doParseSync(tokenizer: Tokenizer, options: ParserSyncOptions = {}): ParseResult {
    if (options.signal != null) {
        options.signal.addEventListener("abort", reject);
    }

    options = {
        src: "",
        sourcemap: false,
        minify: true,
        pass: 1,
        expandIfSyntax: false,
        parseColor: true,
        nestingRules: true,
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
        validation: false,
        lenient: true,
        ...options,
    };

    if (typeof options.validation !== "boolean") {
        options.validation = !!options.validation;
    }

    if (options.module) {
        options.expandNestingRules = true;
    }

    if (options.expandNestingRules) {
        options.nestingRules = false;
    }

    options.minifyAST ??= options.minify;

    const startTime: number = performance.now();
    const errors: ErrorDescription[] = [];
    const stack: Array<number> = [];
    const stats: ParseResultStats = {
        src: options.src ?? "",
        bytesIn: 0,
        nodesCount: 0,
        tokensCount: 0,
        importedBytesIn: 0,
        tokenize: `0ms`,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: [],
    };

    const invalidNodes: Array<number> = [];
    const arena = options.arena!;

    let ast: AstStyleSheet = {
        typ: EnumToken.StyleSheetNodeType,
        chi: [],
    };

    let tokens: number[] = [];
    let context: number = arena.root;

    let item: Token;
    let node: number | null;

    // @ts-ignore ignore error
    let parensMatch: number = 0;
    let curlyBracketMatch: number = 0;
    let tokenId: number;
    // let currentItemIndex: number;

    ast[LOCSRCID] = options.source!.id;
    ast[LOCSTA] = 0;

    while (!tokenizer.done()) {
        tokenizer.next();

        tokenId = arena.allocate();

        if (tokenizer.unit != null) {
            arena.set(
                tokenId,
                tokenizer.typ as EnumToken,
                0,
                tokenizer.val as number,
                arena.internString(tokenizer.unit),
            );

            // item = {
            //     typ: tokenizer.typ as EnumToken,
            //     val: tokenizer.val,
            //     unit: tokenizer.unit,
            // } as DimensionToken;
        } else if (tokenizer.nam != null) {
            arena.set(tokenId, tokenizer.typ as EnumToken);
            arena.setName(tokenId, arena.internString(tokenizer.nam as string));
            // item = {
            //     typ: tokenizer.typ as EnumToken,
            //     nam: tokenizer.nam,
            // } as Token;
        } else if (tokenizer.val === null) {
            arena.set(tokenId, tokenizer.typ as EnumToken);
            // item = {
            //     typ: tokenizer.typ as EnumToken,
            // } as Token;
        } else if (tokenizer.kin != null) {
            arena.set(tokenId, tokenizer.typ as EnumToken, arena.internString(tokenizer.val as string));
            arena.setColorType(tokenId, tokenizer.kin);

            // item = {
            //     typ: tokenizer.typ as EnumToken,
            //     val: tokenizer.val,
            //     kin: tokenizer.kin,
            // } as ColorToken;
        } else {
            arena.set(
                tokenId,
                tokenizer.typ as EnumToken,
                typeof tokenizer.val === "string" ? arena.internString(tokenizer.val as string) : 0,
                typeof tokenizer.val === "number" ? tokenizer.val : 0,
            );
            // item = {
            //     typ: tokenizer.typ as EnumToken,
            //     val: tokenizer.val,
            // } as Token;
        }

        arena.setSpan(tokenId, tokenizer.srcId as number, tokenizer.sta as number, tokenizer.end as number);

        // item[LOCSRCID] = tokenizer.srcId as number;
        // item[LOCSTA] = tokenizer.sta as number;
        // item[LOCEND] = tokenizer.end as number;

        stats.bytesIn = tokenizer.bytesIn as number;
        stats.tokensCount++;

        if (BadTokensTypes.includes(tokenizer.typ as EnumToken)) {
            tokens.push(tokenId);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: tokenId,
                location: options.source!.getSourceLocation(tokenizer.sta as number),
            });

            // bad token
            continue;
        }

        if (tokenizer.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(tokenizer.typ as EnumToken)) {
            parensMatch++;
        } else if (tokenizer.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }

        if (tokenizer.typ === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        } else if (tokenizer.typ === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }

        tokens.push(tokenId);

        if (
            parensMatch === 0 &&
            (tokenizer.typ === EnumToken.SemiColonTokenType ||
                tokenizer.typ === EnumToken.BlockStartTokenType ||
                tokenizer.typ === EnumToken.EOFTokenType)
        ) {
            node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            if (node != null) {
                if (arena.hasFlags(node, EnumAstNodeStatus.HasChildren)) {
                    stack.push(node);
                    context = node;
                }
            } else if (tokenizer.typ == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;

                tokens.length = 0;
                tokens.push(tokenId);

                do {
                    tokenizer.next();

                    tokenId = arena.allocate();

                    if (tokenizer.unit != null) {
                        arena.set(
                            tokenId,
                            tokenizer.typ,
                            0,
                            tokenizer.val as number,
                            arena.internString(tokenizer.unit),
                        );
                        // item = {
                        //     typ: tokenizer.typ as EnumToken,
                        //     val: tokenizer.val,
                        //     unit: tokenizer.unit,
                        // } as DimensionToken;
                    } else if (tokenizer.nam != null) {
                        arena.set(tokenId, tokenizer.typ);
                        arena.setName(tokenId, arena.internString(tokenizer.nam as string));
                        // item = {
                        //     typ: tokenizer.typ as EnumToken,
                        //     nam: tokenizer.nam,
                        // } as Token;
                    } else if (tokenizer.val === null) {
                        arena.set(tokenId, tokenizer.typ);
                        // item = {
                        //     typ: tokenizer.typ as EnumToken,
                        // } as Token;
                    } else if (tokenizer.kin != null) {
                        arena.set(tokenId, tokenizer.typ, arena.internString(tokenizer.val as string));
                        arena.setColorType(tokenId, tokenizer.kin);
                        // item = {
                        //     typ: tokenizer.typ as EnumToken,
                        //     val: tokenizer.val,
                        //     kin: tokenizer.kin,
                        // } as ColorToken;
                    } else {
                        arena.set(tokenId, tokenizer.typ, arena.internString(tokenizer.val as string));
                        // item = {
                        //     typ: tokenizer.typ as EnumToken,
                        //     val: tokenizer.val,
                        // } as Token;
                    }

                    arena.setSpan(tokenId, tokenizer.srcId as number, tokenizer.sta as number, tokenizer.end as number);

                    // item[LOCSRCID] = tokenizer.srcId as number;
                    // item[LOCSTA] = tokenizer.sta as number;
                    // item[LOCEND] = tokenizer.end as number;

                    tokens.push(tokenId);

                    if (tokenizer.typ === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    } else if (tokenizer.typ === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                } while (inBlock != 0 && !tokenizer.done());

                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        location: options.source!.getSourceLocation(tokenizer.sta!),
                    });
                }
            }

            tokens.length = 0;
        } else if ((parensMatch === 0 || curlyBracketMatch === 0) && tokenizer.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            // context[LOCEND] = tokenizer.end as number;

            const previousNode = stack.pop() as number;
            context = stack[stack.length - 1] ?? arena.root;

            if (
                options.removeEmpty &&
                previousNode != null &&
                arena.getFirstChild(previousNode) == 0 &&
                arena.getLastChild(context) == previousNode
            ) {
                arena.detach(previousNode);
            }

            tokens.length = 0;
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
    }

    if (tokens.length > 0) {
        node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

        if (node != null) {
            if (arena.hasFlags(node, EnumAstNodeStatus.HasChildren)) {
                stack.push(node);
                context = node;
            }
        }
    }

    const endParseTime: number = performance.now();

    if (options.expandNestingRules) {
        ast = expand(ast) as AstStyleSheet;
    }

    let replacement: GenericVisitorResult<T>;

    if (options.visitor != null) {
        const handlers = [] as Array<GenericVisitorHandler<T>>;
        const visitors = parseVisitors(options.visitor, errors);

        const subNodes: Array<AstNode | Token> = [];
        let parens: Token[] | null;

        let genericKey: string | null;
        let nodes: AstNode[] | null = new Array(stats.tokensCount);
        let i: number;
        let k: number;
        let j: number;
        let freeBlock: number = 1;
        nodes[0] = ast;

        for (i = 0; i < nodes.length; i++) {
            if (nodes[i] == null) {
                break;
            }

            subNodes.length = 0;
            if (visitors.includeTokens) {
                switch (nodes[i].typ) {
                    case EnumToken.RuleNodeType:
                    case EnumToken.AtRuleNodeType:
                    case EnumToken.KeyframesRuleNodeType:
                    case EnumToken.KeyframesAtRuleNodeType:
                        for (const token of (nodes[i] as AstRule | AstAtRule | AstKeyframesRule | AstKeyframesAtRule)[
                            TOKENS
                        ]!) {
                            subNodes.push(token);
                        }

                        break;
                    case EnumToken.DeclarationNodeType:
                        for (const token of (nodes[i] as AstDeclaration).val) {
                            subNodes.push(token);
                        }

                        break;
                }
            }

            // @ts-ignore
            if (nodes[i].chi != null) {
                // @ts-ignore
                for (const child of nodes[i].chi) {
                    subNodes.push(child);
                }
            }

            if (subNodes.length > 0) {
                if (freeBlock <= i) {
                    freeBlock = i + 1;
                }

                for (k = 0; k < subNodes.length; k++) {
                    j = k + freeBlock;
                    nodes[j] = subNodes[k] as AstNode;
                    nodes[j][PARENT] = nodes[i];
                }

                freeBlock += subNodes.length;
            }

            parens = null;
            handlers.length = 0;

            if (visitors.preAllVisitorsHandlers?.size! > 0) {
                handlers.push(...visitors.preAllVisitorsHandlers!);
            }

            genericKey =
                nodes[i].typ == EnumToken.DeclarationNodeType
                    ? "Declaration"
                    : nodes[i].typ == EnumToken.AtRuleNodeType
                      ? "AtRule"
                      : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                        ? "KeyframesAtRule"
                        : nodes[i].typ === EnumToken.KeyframesRuleNodeType
                          ? "KeyframesRule"
                          : nodes[i].typ == EnumToken.RuleNodeType
                            ? "Rule"
                            : nodes[i].typ == EnumToken.KeyframesRuleNodeType
                              ? "KeyframesRule"
                              : null;
            let keyName: string | null =
                nodes[i].typ == EnumToken.DeclarationNodeType || nodes[i].typ == EnumToken.AtRuleNodeType
                    ? camelize((nodes[i] as AstDeclaration | AstAtRule).nam)
                    : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                      ? camelize((nodes[i] as AstKeyframesAtRule).val)
                      : null;

            if (visitors.allVisitorsHandlers?.size! > 0) {
                handlers.push(...visitors.allVisitorsHandlers!);
            }

            for (const map of visitors.allHandlers) {
                // @ts-ignore
                if (genericKey != null && map!.has(genericKey)) {
                    // @ts-ignore
                    for (const handler of map!.get(genericKey)!) {
                        if (typeof handler == "function") {
                            handlers.push(handler as GenericVisitorHandler<T>);
                        }

                        // @ts-ignore
                        else if (typeof handler[keyName]! == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }

                // @ts-ignore
                if (map!.has(nodes[i].typ)) {
                    // @ts-ignore
                    for (const handler of map!.get(nodes[i].typ)!) {
                        if (typeof handler == "function") {
                            handlers.push(handler as GenericVisitorHandler<T>);
                        } else if (Array.isArray(handler)) {
                            for (const h of handler) {
                                if (typeof h == "function") {
                                    handlers.push(h);
                                }
                            }
                        } else if (typeof handler.handler! == "function") {
                            handlers.push(handler.handler);
                        }

                        // @ts-ignore
                        else if (typeof handler[keyName]! == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }
            }

            if (visitors.postAllVisitorsHandlers?.size! > 0) {
                handlers.push(...visitors.postAllVisitorsHandlers!);
            }

            if (handlers.length == 0) {
                continue;
            }

            let node = nodes[i];

            for (const callable of handlers) {
                replacement = (callable as GenericVisitorHandler<T>)(
                    node as T,
                    nodes[i][PARENT] as AstNode,
                    ast as AstStyleSheet,
                    // @ts-expect-error
                    function* () {
                        if (parens == null) {
                            let node = nodes![i][PARENT] as AstNode;

                            while (node != null) {
                                yield node;
                                node = node[PARENT] as AstNode;
                            }
                        }
                    },
                ) as GenericVisitorResult<T>;

                if (replacement == null) {
                    continue;
                }

                if (replacement == node) {
                    continue;
                }

                // @ts-ignore
                node = replacement as AstNode;

                //
                if (Array.isArray(node)) {
                    break;
                }
            }

            if (node != nodes[i]) {
                // @ts-ignore
                replaceNodeOrValue(nodes[i][PARENT], nodes[i], node);
            }
        }

        nodes = null;
    }

    if (invalidNodes.length > 0) {
        let count: number = invalidNodes.length;

        for (const { node, parent } of walk(ast)) {
            if (options.lenient && node[STATE] & EnumAstNodeStatus.Unknown) {
                continue;
            }

            if (
                node[STATE] & EnumAstNodeStatus.Invalid ||
                node[STATE] & EnumAstNodeStatus.Unknown ||
                node[STATE] & EnumAstNodeStatus.Unparsed ||
                node[STATE] & EnumAstNodeStatus.Malformed ||
                node[STATE] & EnumAstNodeStatus.Disallowed
            ) {
                // @ts-ignore
                parent!.chi.splice(parent!.chi.indexOf(node), 1);
                node[PARENT] = null;
                count--;

                if (count == 0) {
                    break;
                }
            }
        }
    }

    if (options.minifyAST) {
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
        arena,
        ast,
        errors,
        stats: {
            ...stats,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            // tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
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
            generateScopedName: generateSyncScopedName,
            ...(typeof options.module != "object" ? {} : options.module),
        } as ModuleSyncOptions;

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
                ? options.resolve!(options.src as string, options.cwd as string).relative
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
            moduleSettings.generateScopedName = generateSyncScopedName;
        }

        moduleSettings.filePath = filePath;
        moduleSettings.pattern =
            pattern != null && pattern !== "" ? pattern : filePath === "" ? `[local]_[hash]` : `[local]_[hash]_[name]`;

        for (const { node, parent } of walk(ast)) {
            if (node.typ == EnumToken.CssVariableImportTokenType) {
                throw new Error(
                    "css variable import not supported by parseSync() or transformSync(). use parse() or transform() instead.\nat " +
                        options.source!.getSourceLocation(node[LOCSTA]!).join(":"),
                );
            }

            // @ts-ignore
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
                        let value: string =
                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                ? node.nam
                                : moduleSettings.generateScopedName!(
                                      node.nam,
                                      moduleSettings.filePath as string,
                                      moduleSettings.pattern as string,
                                      moduleSettings.hashLength,
                                  );

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
                    const composeSelectors = [] as ComposesSelectorToken[];
                    // let isValid: boolean = true;

                    for (const token of node.val) {
                        if (token.typ == EnumToken.ComposesSelectorNodeType) {
                            composeSelectors.push(token as ComposesSelectorToken);
                        }
                    }

                    // find parent rule
                    let parentRule = parent as AstRule;

                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        parentRule = parentRule[PARENT] as AstRule;
                    }

                    if (/* !isValid || */ composeSelectors.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });

                        (parentRule as AstRule).chi.splice((parentRule as AstRule).chi.indexOf(node), 1);
                        continue;
                    }

                    for (const token of composeSelectors) {
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
                                    let value: string =
                                        moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                            ? (rule as IdentToken).val
                                            : moduleSettings.generateScopedName!(
                                                  (rule as IdentToken).val,
                                                  moduleSettings.filePath as string,
                                                  moduleSettings.pattern as string,
                                                  moduleSettings.hashLength,
                                              );

                                    mapping[(rule as DashedIdentToken | IdentToken).val] =
                                        (rule.typ == EnumToken.DashedIdenTokenType ? "--" : "") +
                                        (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                            ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                            : value);
                                    revMapping[mapping[(rule as DashedIdentToken).val]] = (
                                        rule as DashedIdentToken | IdentToken
                                    ).val;
                                }

                                if (parentRule != null) {
                                    for (const tk of (parentRule as AstRule)[TOKENS]!) {
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
                            throw new Error(
                                `composes from file is not supported using parseSync() or transformSync(). Use parse() or transform() instead.\nat ${options.source!.getSourceLocation(node[LOCSTA]!).join(":")}`,
                            );
                        }

                        // composes: a b c from global;
                        else if (token.r.typ == EnumToken.IdenTokenType) {
                            // global
                            if (parentRule != null) {
                                if (equalsIgnoreCase("global", (token.r as IdentToken).val)) {
                                    for (const tk of (parentRule as AstRule)[TOKENS]!) {
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

                    (parent as AstRule).chi.splice((parent as AstRule).chi.indexOf(node), 1);
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

                            mapping[idenToken] = result as string;
                            revMapping[result as string] = idenToken as string;

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
                            const tokens = parseString((node.val[i] as StringToken).val.slice(1, -1));

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

                                        mapping[(value as IdentToken).val] = result;
                                        revMapping[result] = (value as IdentToken).val;
                                        (value as IdentToken).val = result;
                                    }
                                }
                            }

                            (node.val[i] as StringToken).val =
                                (node.val[i] as StringToken).val.charAt(0) +
                                renderTokens(tokens) +
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
                                mapping[(value as IdentToken).val] =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? (value as IdentToken).val
                                        : moduleSettings.generateScopedName!(
                                              (value as IdentToken).val,
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                revMapping[mapping[(value as IdentToken).val]] = (value as IdentToken).val;
                            }

                            (value as IdentToken).val = mapping[(value as IdentToken).val];
                        }
                    }
                }

                for (const { value, parent } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                    } else if (
                        (value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        (value as IdentToken).val in importedCssVariables
                    ) {
                        // @ts-ignore
                        replaceNodeOrValue(parent, value, importedCssVariables[(value as IdentToken).val].val);
                    }
                }
            } else if (node.typ == EnumToken.RuleNodeType) {
                // if (node[TOKENS] == null) {
                const tokens = parseString(node.sel);
                matchSelectorSyntax(tokens, [] as ErrorDescription[], options);

                node[TOKENS] = trimArray(tokens);

                let hasIdOrClass: boolean = false;

                for (const { value } of walkValues(
                    (node as AstRule)[TOKENS] as Token[],
                    node,
                    // @ts-ignore
                    (value: Token, parent: AstRule) => {
                        if (
                            value.typ == EnumToken.PseudoClassTokenType ||
                            value.typ == EnumToken.PseudoElementTokenType
                        ) {
                            const val: string = (value as PseudoClassToken).val.toLowerCase();
                            switch (val) {
                                case ":local":
                                case ":global":
                                    {
                                        let index: number = (parent as AstRule)[TOKENS]!.indexOf(value);

                                        (parent as AstRule)[TOKENS]!.splice(index, 1);

                                        if (
                                            (parent as AstRule)[TOKENS]![index]?.typ == EnumToken.WhitespaceTokenType ||
                                            (parent as AstRule)[TOKENS]![index]?.typ ==
                                                EnumToken.DescendantCombinatorTokenType
                                        ) {
                                            (parent as AstRule)[TOKENS]!.splice(index, 1);
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

                                case ":local":
                                    (parent as AstRule)[TOKENS]!.splice(
                                        (parent as AstRule)[TOKENS]!.indexOf(value),
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

                    if (value.typ == EnumToken.PseudoClassTokenType || value.typ == EnumToken.PseudoElementTokenType) {
                    } else if (value.typ == EnumToken.PseudoClassFuncTokenType) {
                    } else {
                        if (global.has(value)) {
                            continue;
                        }

                        if (value.typ == EnumToken.ClassSelectorTokenType) {
                            const val: string = (value as ClassSelectorToken).val.slice(1);

                            if (!(val in mapping)) {
                                let value: string =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? val
                                        : moduleSettings.generateScopedName!(
                                              val,
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );

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
                            `pure module: No id or class found in selector '${node.sel}' at '${options.source!.getOffsets(node[LOCSTA] as number).join(":")}'`,
                        );
                    }
                }

                node.sel = "";

                for (const token of node[TOKENS]! as Token[]) {
                    node.sel += printValue(token);
                }
            } else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val: string = node.nam.toLowerCase();

                if (node[TOKENS] == null) {
                    node[TOKENS] = parseString(node.val);
                }

                if (val == "property" || val == "keyframes") {
                    const prefix: string = val == "property" ? "--" : "";

                    for (const value of node[TOKENS] as Token[]) {
                        if (
                            (prefix == "--" && value.typ == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && value.typ == EnumToken.IdenTokenType)
                        ) {
                            if (!((value as DashedIdentToken | IdentToken).val in mapping)) {
                                let val: string =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? (value as DashedIdentToken | IdentToken).val
                                        : moduleSettings.generateScopedName!(
                                              (value as DashedIdentToken).val,
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );

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

                    (node as AstAtRule).val = renderTokens(node[TOKENS]!);
                }
            }
        }

        if (moduleSettings.naming != ModuleCaseTransformEnum.IgnoreCase) {
            revMapping = {};
            mapping = {} as Record<string, string>;
            let keyName: string;

            for (const [key, value] of Object.entries(mapping)) {
                keyName = getKeyName(key, moduleSettings.naming!);

                mapping[keyName] = value;
                revMapping[value] = keyName;
            }
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

/**
 * Parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
export async function doParse(iter: Tokenizer | Promise<Tokenizer>, options: ParserOptions = {}): Promise<ParseResult> {
    if (options.signal != null) {
        options.signal.addEventListener("abort", reject);
    }

    options = {
        src: "",
        sourcemap: false,
        minify: true,
        pass: 1,
        expandIfSyntax: false,
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
        validation: false,
        lenient: true,
        ...options,
    };

    options.minifyAST ??= options.minify;

    if (typeof options.validation !== "boolean") {
        options.validation = !!options.validation;
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
    const stack: Array<AstNode | AstComment> = [];
    const stats: ParseResultStats = {
        src: options.src ?? "",
        bytesIn: 0,
        nodesCount: 0,
        tokensCount: 0,
        importedBytesIn: 0,
        tokenize: `0ms`,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: [],
    };

    const invalidNodes: Array<AstNode> = [];

    let ast: AstStyleSheet = {
        typ: EnumToken.StyleSheetNodeType,
        chi: [],
    };

    let tokens: Token[] = [];
    let context: AstRuleList = ast;

    const imports: AstAtRule[] = [];

    let item: Token;
    let node: AstAtRule | AstRule | AstKeyframesRule | AstKeyframesAtRule | AstDeclaration | AstComment | null;

    // @ts-ignore ignore error
    let parensMatch: number = 0;
    let curlyBracketMatch: number = 0;
    let tokenizer: Tokenizer = iter instanceof Promise ? await iter : iter;

    // ast[ROOT] = ast;

    ast[LOCSRCID] = options.source!.id;
    ast[LOCSTA] = 0;
    ast[LOCEND] = 0;

    // if (Array.isArray(iter)) {
    //     // @ts-expect-error
    //     iter = iter[Symbol.iterator]() as Iterator<TokenizeResult>;
    // }

    while (!tokenizer.done()) {
        tokenizer.next();

        if (tokenizer.unit != null) {
            item = {
                typ: tokenizer.typ as EnumToken,
                val: tokenizer.val,
                unit: tokenizer.unit,
            } as DimensionToken;
        } else if (tokenizer.nam != null) {
            item = {
                typ: tokenizer.typ as EnumToken,
                nam: tokenizer.nam,
            } as Token;
        } else if (tokenizer.val === null) {
            item = {
                typ: tokenizer.typ as EnumToken,
            } as Token;
        } else if (tokenizer.kin != null) {
            item = {
                typ: tokenizer.typ as EnumToken,
                val: tokenizer.val,
                kin: tokenizer.kin,
            } as ColorToken;
        } else {
            item = {
                typ: tokenizer.typ as EnumToken,
                val: tokenizer.val,
            } as Token;
        }

        item[LOCSRCID] = tokenizer.srcId as number;
        item[LOCSTA] = tokenizer.sta as number;
        item[LOCEND] = tokenizer.end as number;

        stats.bytesIn = tokenizer.bytesIn as number;
        stats.tokensCount++;

        if (BadTokensTypes.includes(item.typ)) {
            tokens.push(item);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item,
                location: options.source!.getSourceLocation(item[LOCSTA]),
            });

            // bad token
            continue;
        }

        if (item.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(item.typ)) {
            parensMatch++;
        } else if (item.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }

        if (item.typ === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        } else if (item.typ === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }

        tokens.push(item);

        if (
            parensMatch === 0 &&
            (item.typ === EnumToken.SemiColonTokenType ||
                item.typ === EnumToken.BlockStartTokenType ||
                item.typ === EnumToken.EOFTokenType)
        ) {
            node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            if (node != null) {
                if ("chi" in node) {
                    stack.push(node as AstAtRule | AstRule | AstKeyframesRule);
                    context = node as AstRuleList;
                } else if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).nam === "import") {
                    imports.push(node);
                }
            } else if (item.typ == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;
                tokens.length = 0;
                tokens.push(item);

                do {
                    tokenizer.next();

                    if (tokenizer.unit != null) {
                        item = {
                            typ: tokenizer.typ as EnumToken,
                            val: tokenizer.val,
                            unit: tokenizer.unit,
                        } as DimensionToken;
                    } else if (tokenizer.nam != null) {
                        item = {
                            typ: tokenizer.typ as EnumToken,
                            nam: tokenizer.nam,
                        } as Token;
                    } else if (tokenizer.val === null) {
                        item = {
                            typ: tokenizer.typ as EnumToken,
                        } as Token;
                    } else if (tokenizer.kin != null) {
                        item = {
                            typ: tokenizer.typ as EnumToken,
                            val: tokenizer.val,
                            kin: tokenizer.kin,
                        } as ColorToken;
                    } else {
                        item = {
                            typ: tokenizer.typ as EnumToken,
                            val: tokenizer.val,
                        } as Token;
                    }

                    item[LOCSRCID] = tokenizer.srcId as number;
                    item[LOCSTA] = tokenizer.sta as number;
                    item[LOCEND] = tokenizer.end as number;

                    tokens.push(item);

                    if (item.typ === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    } else if (item.typ === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                } while (inBlock != 0 && !tokenizer.done());

                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        location: options.source!.getSourceLocation(tokens[0][LOCSTA]!),
                    });
                }
            }

            tokens.length = 0;
        } else if ((parensMatch === 0 || curlyBracketMatch === 0) && item.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            context[LOCEND] = item[LOCEND];

            const previousNode = stack.pop() as AstRuleList;
            context = (stack[stack.length - 1] ?? ast) as AstRuleList;

            if (
                options.removeEmpty &&
                previousNode != null &&
                previousNode.chi!.length == 0 &&
                context.chi![context.chi!.length - 1] == previousNode
            ) {
                context.chi!.pop();
            }

            tokens.length = 0;
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
        // }
    }

    if (tokens.length > 0) {
        node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

        if (node != null) {
            if (node.typ == EnumToken.AtRuleNodeType && "import" === (node as AstAtRule).val) {
                imports.push(node);
            }

            if ("chi" in node /* && node.typ != EnumToken.InvalidRuleNodeType */) {
                stack.push(node);
                context = node as AstRuleList;
            }
        }
    }

    if (imports.length > 0 && options.resolveImport) {
        await Promise.all(
            imports.map(async (node: AstAtRule) => {
                if (node[STATE] !== EnumAstNodeStatus.Validated) {
                    return;
                }

                const token = (node[TOKENS] as Token[])[0] as UrlToken | StringToken;
                const url: string = token.typ == EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;

                try {
                    const src = options.resolve!(
                        url,
                        options.src ? dirname(options.src as string) : (options.cwd as string),
                    ) as ResolvedPath;
                    const result = options.load!(src) as LoadResult;
                    const stream =
                        result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                            ? await result
                            : result;

                    const source = new SourceFile(typeof stream === "string" ? stream : "", [], src.relative);
                    options.sourcesMap!.set(source.id, source);
                    const parseInfo = {
                        stream,
                        offset: 0,
                        source,
                        position: 0,
                        currentPosition: 0,
                        time: 0,
                    } as ParseInfo;
                    const root: ParseResult = await doParse(
                        stream instanceof ReadableStream
                            ? new Tokenizer(parseInfo, stream).tokenizeStream()
                            : new Tokenizer(parseInfo),
                        Object.assign({}, options, {
                            minify: false,
                            setParent: false,
                            src: options.resolve!(url, options.src || (options.cwd as string)).relative,
                        }) as ParserOptions,
                    );

                    stats.importedBytesIn += root.stats.bytesIn;
                    stats.nodesCount += root.stats.nodesCount;
                    stats.tokensCount += root.stats.tokensCount;
                    stats.imports.push(root.stats);
                    // @ts-ignore
                    node[PARENT]!.chi!.splice(node[PARENT]!.chi!.indexOf(node), 1, ...root.ast.chi);

                    if (root.errors.length > 0) {
                        for (const error of root.errors) {
                            errors.push(error);
                        }
                    }
                } catch (error) {
                    // @ts-ignore ignore error
                    errors.push({ action: "ignore", message: ("doParse: " + error.message) as string, error });
                }
            }),
        );
    }

    const endParseTime: number = performance.now();

    if (options.expandNestingRules) {
        ast = expand(ast) as AstStyleSheet;
    }

    let replacement: GenericVisitorResult<T>;

    if (options.visitor != null) {
        let parens: Token[] | null;

        let genericKey: string | null;
        const handlers = [] as Array<GenericVisitorHandler<T>>;
        const visitors = parseVisitors(options.visitor, errors);

        let nodes: AstNode[] | null = new Array(stats.tokensCount);
        const subNodes: Array<AstNode | Token> = [];
        let i: number;
        let k: number;
        let j: number;
        let freeblock: number = 1;
        nodes[0] = ast;

        for (i = 0; i < nodes.length; i++) {
            if (nodes[i] == null) {
                break;
            }

            subNodes.length = 0;
            if (visitors.includeTokens) {
                switch (nodes[i].typ) {
                    case EnumToken.RuleNodeType:
                    case EnumToken.AtRuleNodeType:
                    case EnumToken.KeyframesRuleNodeType:
                    case EnumToken.KeyframesAtRuleNodeType:
                        for (const token of (nodes[i] as AstRule | AstAtRule | AstKeyframesRule | AstKeyframesAtRule)[
                            TOKENS
                        ]!) {
                            subNodes.push(token);
                        }

                        break;
                    case EnumToken.DeclarationNodeType:
                        for (const token of (nodes[i] as AstDeclaration).val) {
                            subNodes.push(token);
                        }
                        break;
                }
            }

            // @ts-ignore
            if (nodes[i].chi != null) {
                // @ts-ignore
                for (k = 0; k < nodes[i].chi.length; k++) {
                    // @ts-ignore
                    subNodes.push(nodes[i].chi[k]);
                }
            }

            if (subNodes.length > 0) {
                if (freeblock <= i) {
                    freeblock = i + 1;
                }

                for (k = 0; k < subNodes.length; k++) {
                    j = k + freeblock;
                    nodes[j] = subNodes[k] as AstNode;
                    nodes[j][PARENT] = nodes[i];
                }

                freeblock += subNodes.length;
            }

            parens = null;
            handlers.length = 0;

            if (visitors.preAllVisitorsHandlers?.size! > 0) {
                handlers.push(...visitors.preAllVisitorsHandlers!);
            }

            genericKey =
                nodes[i].typ == EnumToken.DeclarationNodeType
                    ? "Declaration"
                    : nodes[i].typ == EnumToken.AtRuleNodeType
                      ? "AtRule"
                      : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                        ? "KeyframesAtRule"
                        : nodes[i].typ === EnumToken.KeyframesRuleNodeType
                          ? "KeyframesRule"
                          : nodes[i].typ == EnumToken.RuleNodeType
                            ? "Rule"
                            : nodes[i].typ == EnumToken.KeyframesRuleNodeType
                              ? "KeyframesRule"
                              : null;
            let keyName: string | null =
                nodes[i].typ == EnumToken.DeclarationNodeType || nodes[i].typ == EnumToken.AtRuleNodeType
                    ? camelize((nodes[i] as AstDeclaration | AstAtRule).nam)
                    : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                      ? camelize((nodes[i] as AstKeyframesAtRule).val)
                      : null;

            if (visitors.allVisitorsHandlers?.size! > 0) {
                handlers.push(...visitors.allVisitorsHandlers!);
            }

            for (const map of visitors.allHandlers) {
                // @ts-ignore
                if (genericKey != null && map!.has(genericKey)) {
                    // @ts-ignore
                    for (const handler of map!.get(genericKey)!) {
                        if (typeof handler == "function") {
                            handlers.push(handler as GenericVisitorHandler<T>);
                        }

                        // else if (Array.isArray(handler)) {
                        //     for (const h of handler) {
                        //         if (typeof h == "function") {
                        //             handlers.push(h);
                        //         }

                        //         // @ts-ignore
                        //         else if (h[keyName] != null) {
                        //             // @ts-ignore
                        //             handlers.push(h[keyName]);
                        //         }
                        //     }
                        // } else if (typeof handler.handler! == "function") {
                        //     handlers.push(handler.handler);
                        // }

                        // @ts-ignore
                        else if (typeof handler[keyName]! == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }

                // @ts-ignore
                if (map!.has(nodes[i].typ)) {
                    // @ts-ignore
                    for (const handler of map!.get(nodes[i].typ)!) {
                        if (typeof handler == "function") {
                            handlers.push(handler as GenericVisitorHandler<T>);
                        } else if (Array.isArray(handler)) {
                            for (const h of handler) {
                                if (typeof h == "function") {
                                    handlers.push(h);
                                }
                            }
                        } else if (typeof handler.handler! == "function") {
                            handlers.push(handler.handler);
                        }

                        // @ts-ignore
                        else if (typeof handler[keyName]! == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }
            }

            if (visitors.postAllVisitorsHandlers?.size! > 0) {
                handlers.push(...visitors.postAllVisitorsHandlers!);
            }

            if (handlers.length == 0) {
                continue;
            }

            let node = nodes[i] as AstNode;

            for (const callable of handlers) {
                replacement = (callable as GenericVisitorHandler<T>)(
                    node as T,
                    nodes[i][PARENT] as AstNode,
                    ast as AstStyleSheet,
                    // @ts-expect-error
                    function* () {
                        if (parens == null) {
                            let node = nodes![i][PARENT] as AstNode;

                            while (node != null) {
                                yield node;
                                node = node[PARENT] as AstNode;
                            }
                        }
                    },
                ) as GenericVisitorResult<T>;

                if (replacement == null) {
                    continue;
                }

                if (replacement instanceof Promise) {
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

            if (node != nodes[i]) {
                // @ts-ignore
                replaceNodeOrValue(nodes[i]![PARENT] as AstNode, nodes[i], node);
            }
        }

        nodes = null;
    }

    if (invalidNodes.length > 0) {
        let count: number = invalidNodes.length;

        for (const { node, parent } of walk(ast)) {
            if (options.lenient && node[STATE] & EnumAstNodeStatus.Unknown) {
                continue;
            }

            if (
                node[STATE] & EnumAstNodeStatus.Invalid ||
                node[STATE] & EnumAstNodeStatus.Unknown ||
                node[STATE] & EnumAstNodeStatus.Unparsed ||
                node[STATE] & EnumAstNodeStatus.Malformed ||
                node[STATE] & EnumAstNodeStatus.Disallowed
            ) {
                // @ts-ignore
                parent!.chi.splice(parent!.chi.indexOf(node), 1);
                node[PARENT] = null;
                count--;

                if (count == 0) {
                    break;
                }
            }
        }
    }

    if (options.minifyAST) {
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
            // tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
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
        } as ModuleSyncOptions;

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
                ? options.resolve!(options.src as string, options.cwd as string).relative
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
                const result = options.load!(src, "") as LoadResult;
                const stream =
                    result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                        ? await result
                        : result;

                const source = new SourceFile(typeof stream === "string" ? stream : "", [], src.relative);
                options.sourcesMap!.set(source.id, source);

                const parseInfo: ParseInfo = {
                    stream,
                    buffer: "",
                    offset: 0,
                    time: 0,
                    source,
                    position: 0,
                    currentPosition: 0,
                } as ParseInfo;

                const root: ParseResult = await doParse(
                    stream instanceof ReadableStream
                        ? new Tokenizer(parseInfo, stream).tokenizeStream()
                        : new Tokenizer(parseInfo),
                    Object.assign({}, options, {
                        source,
                        minify: false,
                        setParent: false,
                        src: src.relative,
                    }) as ParserOptions,
                );

                // options.parseInfo!.time += parseInfo.time;

                cssVariablesMap[(node as CssVariableImportTokenType).nam] = root.cssModuleVariables!;
                parent!.chi!.splice(parent!.chi!.indexOf(node), 1);
                continue;
            }

            // @ts-ignore
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
                        // @ts-ignore
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
                    const composeSelectors = [] as ComposesSelectorToken[];
                    // let isValid: boolean = true;

                    for (const token of node.val) {
                        if (token.typ == EnumToken.ComposesSelectorNodeType) {
                            composeSelectors.push(token as ComposesSelectorToken);
                        }
                    }

                    // find parent rule
                    let parentRule = parent as AstRule;

                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        parentRule = parentRule[PARENT] as AstRule;
                    }

                    if (/* !isValid || */ composeSelectors.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });

                        (parentRule as AstRule).chi.splice((parentRule as AstRule).chi.indexOf(node), 1);
                        continue;
                    }

                    const resolvedSrc = options.resolve!(options.src as string, options.cwd as string);

                    for (const token of composeSelectors) {
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
                                    // @ts-expect-error
                                    let value: string = result instanceof Promise ? await result : result;

                                    mapping[(rule as DashedIdentToken | IdentToken).val] =
                                        (rule.typ == EnumToken.DashedIdenTokenType ? "--" : "") +
                                        (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                            ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                            : value);
                                    revMapping[mapping[(rule as DashedIdentToken).val]] = (
                                        rule as DashedIdentToken | IdentToken
                                    ).val;
                                }

                                if (parentRule != null) {
                                    for (const tk of (parentRule as AstRule)[TOKENS]!) {
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
                            const result = options.load!(src, "") as LoadResult;
                            const stream =
                                result instanceof Promise ||
                                Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                                    ? await result
                                    : result;
                            const root: ParseResult = await doParse(
                                stream instanceof ReadableStream
                                    ? new Tokenizer(
                                          {
                                              offset: 0,
                                              source: new SourceFile("", [], src.relative),
                                              position: 0,
                                              currentPosition: 0,
                                          } as ParseInfo,
                                          stream,
                                      ).tokenizeStream()
                                    : new Tokenizer({
                                          stream,
                                          offset: 0,
                                          position: 0,
                                          source: new SourceFile(stream as string, [], src.relative),
                                          currentPosition: 0,
                                      } as ParseInfo),

                                Object.assign({}, options, {
                                    minify: false,
                                    setParent: false,
                                    src: src.relative,
                                }) as ParserOptions,
                            );

                            let srcIndex: string = options.resolve!(src.absolute, resolvedSrc.absolute).relative;

                            if (!srcIndex.startsWith("/") && !srcIndex.startsWith("../")) {
                                srcIndex = `./${srcIndex}`;
                            }

                            if (Object.keys(root.mapping as Record<string, string>).length > 0) {
                                importMapping[srcIndex] = {} as Record<string, string>;
                            }

                            if (parentRule != null) {
                                for (const tk of (parentRule as AstRule)[TOKENS]!) {
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
                                                        // @ts-expect-error
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
                                    for (const tk of (parentRule as AstRule)[TOKENS]!) {
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

                    (parent as AstRule).chi.splice((parent as AstRule).chi.indexOf(node), 1);
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

                            // @ts-expect-error
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
                            const tokens = parseString((node.val[i] as StringToken).val.slice(1, -1));

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

                                        // @ts-expect-error
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
                                renderTokens(tokens) +
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
                                // @ts-expect-error
                                mapping[(value as IdentToken).val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[(value as IdentToken).val]] = (value as IdentToken).val;
                            }

                            (value as IdentToken).val = mapping[(value as IdentToken).val];
                        }
                    }
                }

                for (const { value, parent } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                    } else if (
                        (value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        (value as IdentToken).val in importedCssVariables
                    ) {
                        replaceNodeOrValue(
                            // @ts-ignore
                            parent as AstRule,
                            value,
                            importedCssVariables[(value as IdentToken).val].val,
                        );
                    }
                }
            } else if (node.typ == EnumToken.RuleNodeType) {
                // if (node[TOKENS] == null) {
                const tokens = parseString(node.sel);
                matchSelectorSyntax(tokens, [] as ErrorDescription[], options);

                node[TOKENS] = trimArray(tokens);
                // }

                let hasIdOrClass: boolean = false;

                for (const { value } of walkValues(
                    (node as AstRule)[TOKENS] as Token[],
                    node,
                    // @ts-ignore
                    (value: Token, parent: AstRule) => {
                        if (
                            value.typ == EnumToken.PseudoClassTokenType ||
                            value.typ == EnumToken.PseudoElementTokenType
                        ) {
                            const val: string = (value as PseudoClassToken).val.toLowerCase();
                            switch (val) {
                                case ":local":
                                case ":global":
                                    {
                                        let index: number = (parent as AstRule)[TOKENS]!.indexOf(value);

                                        (parent as AstRule)[TOKENS]!.splice(index, 1);

                                        if (
                                            (parent as AstRule)[TOKENS]![index]?.typ == EnumToken.WhitespaceTokenType ||
                                            (parent as AstRule)[TOKENS]![index]?.typ ==
                                                EnumToken.DescendantCombinatorTokenType
                                        ) {
                                            (parent as AstRule)[TOKENS]!.splice(index, 1);
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

                                case ":local":
                                    (parent as AstRule)[TOKENS]!.splice(
                                        (parent as AstRule)[TOKENS]!.indexOf(value),
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

                    if (value.typ == EnumToken.PseudoClassTokenType || value.typ == EnumToken.PseudoElementTokenType) {
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
                                // @ts-expect-error
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
                            `pure module: No id or class found in selector '${node.sel}' at '${(options.source?.getOffsets?.(node[LOCSTA] as number) ?? []).join(":")}'`,
                        );
                    }
                }

                node.sel = "";

                for (const token of node[TOKENS]! as Token[]) {
                    node.sel += printValue(token);
                }
            } else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val: string = node.nam.toLowerCase();

                if (node[TOKENS] == null) {
                    node[TOKENS] = parseString(node.val);
                }

                if (val == "property" || val == "keyframes") {
                    const prefix: string = val == "property" ? "--" : "";

                    for (const value of node[TOKENS] as Token[]) {
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
                                // @ts-expect-error
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

                    (node as AstAtRule).val = renderTokens(node[TOKENS]!);
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
    tokens: number[],
    context: number,
    options: ParserOptions,
    errors: ErrorDescription[],
    stats: ParseResultStats,
    invalidNodes: number[],
): number | null {
    let i: number = 0;

    const arena: Arena = options.arena!;
    const contextType: number = arena.getType(context);
    let token: number;
    let typ: EnumToken;

    if (arena.getType(tokens.at(-1)!) === EnumToken.EOFTokenType) {
        tokens.pop();

        // check parenthesis are balanced
        let matchCount: number = 0;

        for (let i = 0; i < tokens.length; i++) {
            token = tokens[i];
            typ = arena.getType(token);

            if (typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(typ)) {
                matchCount++;
            } else if (typ === EnumToken.EndParensTokenType) {
                matchCount--;
            }
        }

        if (matchCount > 0) {
            let k: number = tokens.length;

            if (k > 0) {
                typ = arena.getType(tokens[k - 1]);

                while ((k-- > 0 && typ === EnumToken.WhitespaceTokenType) || typ === EnumToken.CommentTokenType) {
                    typ = arena.getType(tokens[k - 1]);
                }

                if (typ == EnumToken.SemiColonTokenType) {
                    matchCount = 0;
                }

                let tokenId: number;
                let sourceId: number = arena.getSourceId(tokens[k]);
                let spanStart: number = arena.getSpanStart(tokens[k]);
                let spanEnd: number = arena.getSpanEnd(tokens[k]);

                while (matchCount > 0) {
                    tokenId = arena.allocate();

                    arena.set(tokenId, EnumToken.EndParensTokenType);
                    arena.setSpan(tokenId, sourceId, spanStart, spanEnd);
                    // tokens.push({
                    //     typ: EnumToken.EndParensTokenType,
                    //     [LOCSRCID]: tokens[k]?.[LOCSRCID],
                    //     [LOCSTA]: tokens[k]?.[LOCSTA],
                    //     [LOCEND]: tokens[k]?.[LOCEND],
                    // });
                    matchCount--;
                }
            }
        }
    }

    for (; i < tokens.length; i++) {
        if (arena.getType(tokens[i]) === EnumToken.CDOCOMMTokenType && contextType !== EnumToken.StyleSheetNodeType) {
            errors.push({
                action: "drop",
                message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                node: tokens[i],
                location: options.source!.getSourceLocation(arena.getSpanStart(tokens[i])),
            });

            arena.set(tokens[i], EnumToken.InvalidCommentTokenType);
            continue;
        }

        typ = arena.getType(tokens[i]);

        if (
            typ === EnumToken.CommentTokenType ||
            typ === EnumToken.CDOCOMMTokenType ||
            typ === EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        break;
    }

    if (i > 0) {
        arena.appendChildren(
            context,
            ...tokens.splice(0, i).filter((n: number) => arena.getType(n) !== EnumToken.WhitespaceTokenType),
        );
        i = 0;
    }

    for (; i < tokens.length; i++) {
        typ = arena.getType(tokens[i]);
        if (typ == EnumToken.CommentTokenType || typ == EnumToken.CDOCOMMTokenType) {
            if (typ == EnumToken.CDOCOMMTokenType && contextType != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: "drop",
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    location: options.source!.getSourceLocation(arena.getSpanStart(tokens[i])),
                });

                arena.setType(tokens[i], EnumToken.InvalidCommentTokenType);
                continue;
            }

            // tokens[i][ROOT] = context[ROOT];
            arena.appendChildren(context, tokens[i]);
            // context.chi!.push(tokens[i] as AstNode);
            stats.nodesCount++;
        } else if (typ != EnumToken.WhitespaceTokenType) {
            break;
        }
    }

    if (tokens.length == 0) {
        return null;
    }

    // for (const token of tokens.slice(1)) {

    //     console.error(EnumToken[arena.getType(token)]);
    // }

    let delim: number = tokens.at(-1) as number;
    typ = arena.getType(delim);

    if (
        typ == EnumToken.SemiColonTokenType ||
        typ == EnumToken.BlockStartTokenType ||
        typ == EnumToken.BlockEndTokenType
    ) {
        tokens.pop();
    }

    if (tokens.length == 0) {
        return null;
    }

    typ = arena.getType(tokens[0]);

    if (typ == EnumToken.AtRuleTokenType) {
        let nestedRule: boolean = false;

        let parent: number = context;
        let node;

        while (parent != 0) {
            typ = arena.getType(parent);
            if (typ == EnumToken.RuleNodeType) {
                nestedRule = true;
                break;
            }

            parent = arena.getParent(parent);
        }

        node = parseAtRule(
            tokens,
            context,
            { ...options, nestedRule },
            errors,
            arena.getType(delim) == EnumToken.BlockStartTokenType,
        );

        if (node == null) {
            return null;
        }

        if (
            arena.hasFlags(node, 
            EnumAstNodeStatus.Invalid |
                EnumAstNodeStatus.Disallowed |
                EnumAstNodeStatus.Unknown |
                EnumAstNodeStatus.Unparsed |
                EnumAstNodeStatus.Malformed)
        ) {
            invalidNodes.push(node);
        }

        stats.nodesCount++;
        arena.appendChildren(context, node);
        // context.chi!.push(node);

        // arena.setParent(node, context);

        // node[ROOT] = context[ROOT];
        // node[PARENT] = context;
        // @ts-ignore
        return node;
    } else {
        stats.nodesCount++;

        // rule
        if (arena.getType(delim) == EnumToken.BlockStartTokenType) {
            const node = parseSelector(tokens, context, options, errors);

            arena.appendChildren(context, node);
            // context.chi!.push(node);
            // node[PARENT] = context;
            // node[ROOT] = context[ROOT];

            if (
                arena.hasFlags(
                    node,
                    EnumAstNodeStatus.Invalid |
                        EnumAstNodeStatus.Disallowed |
                        EnumAstNodeStatus.Unknown |
                        EnumAstNodeStatus.Unparsed |
                        EnumAstNodeStatus.Malformed,
                )
            ) {
                invalidNodes.push(node);
            }

            return node;
        } else {
            const node = parseDeclaration(tokens, context, options, errors);
            // node[PARENT] = context;
            // node[ROOT] = context[ROOT];

            if (contextType === EnumToken.StyleSheetNodeType && arena.getType(node) === EnumToken.DeclarationNodeType) {
                arena.setFlags(node, EnumAstNodeStatus.Invalid) ;

                errors.push({
                    message: "<declaration> not allowed in <stylesheet>",
                    action: "drop",
                    node,
                    location: options.source!.getSourceLocation(arena.getSpanStart(node)),
                });
            } else if (options.lenient || arena.getType(node) === EnumToken.DeclarationNodeType) {
                // context.chi!.push(node);
                arena.appendChildren(context, node);
            }

            if (
                arena.hasFlags(node, EnumAstNodeStatus.Invalid |
                    EnumAstNodeStatus.Disallowed |
                    EnumAstNodeStatus.Unknown |
                    EnumAstNodeStatus.Unparsed |
                    EnumAstNodeStatus.Malformed)
            ) {
                invalidNodes.push(node);
            }
        }
    }

    return null;
}

/**
 * @param stream
 * @param context
 * @param options
 * @param errors
 * @param parseAsBlock
 */

export function parseAtRule(
    stream: number[],
    context: number,
    options: ParserOptions,
    errors: ErrorDescription[],
    parseAsBlock: boolean | null = null,
): number| null {

    const arena = options.arena as Arena;
    let success: boolean = true;
    let atRuleName = arena.getName(stream[0]);

    if (atRuleName.startsWith("-")) {
        atRuleName = atRuleName.replace(/^-[a-z]+-/, "").toLowerCase();
    }

    const atRule = stream.shift() as number;
    const name = arena.getName(atRule);
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + name);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];
    const blockAllowed: boolean = syntaxRules?.getBlockRules() != null;

    if (syntaxRules == null) {
        errors.push({
            action: "drop",
            node: atRule,
            location: options.source!.getSourceLocation(atRule),
            message: "unknown at-rule",
        });

        const result = matchGenericSyntax(stream, options);

        atRule[TOKENS] = parseTokens(stream);
        atRule[STATE] = result.success ? EnumAstNodeStatus.Unknown : EnumAstNodeStatus.Invalid;
        atRule[ERRORS] = result.success ? [errors[errors.length - 1]] : [errors[errors.length - 1], ...result.errors];

        // @ts-expect-error
        return Object.assign(atRule, {
            typ: EnumToken.AtRuleNodeType,
            val: renderTokens(trimArray(stream), options),
            ...(parseAsBlock ? { chi: [] } : {}),
        }) as AstAtRule;
    } else if (
        context.typ === EnumToken.AtRuleNodeType &&
        "page" === (context as AstAtRule).nam &&
        pageMarginBoxType.has(atRuleName.toLowerCase())
    ) {
        if (parseAsBlock === false) {
            errors.push({
                action: "drop",
                node: atRule,
                location: options.source!.getSourceLocation(atRule[LOCSTA]!),
                message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
            });

            atRule[TOKENS] = parseTokens(stream);
            atRule[STATE] = EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            }) as AstAtRule;
        }

        const token =
            stream.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ === EnumToken.CommentTokenType) ?? null;
        if (token != null) {
            errors.push({
                action: "drop",
                node: token,
                location: options.source!.getSourceLocation(token[LOCSTA]!),
                message: `unexpected token`,
            });

            atRule[TOKENS] = parseTokens(stream);
            atRule[STATE] = EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            }) as AstAtRule;
        }
    }

    if (parseAsBlock === null) {
        parseAsBlock = blockAllowed;
    }

    if (syntax != null && atRule.nam !== "layer" && parseAsBlock !== blockAllowed) {
        errors.push({
            action: "drop",
            node: atRule,
            location: options.source!.getSourceLocation(atRule[LOCSTA]!),
            message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
        });

        atRule[TOKENS] = parseTokens(stream);
        atRule[STATE] = EnumAstNodeStatus.Invalid;
        atRule[ERRORS] = [errors[errors.length - 1]];

        // @ts-expect-error
        return Object.assign(atRule, {
            typ: EnumToken.AtRuleNodeType,
            val: renderTokens(trimArray(stream), options),
            ...(parseAsBlock ? { chi: [] } : {}),
        }) as AstAtRule;
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
                    location: options.source!.getSourceLocation((stream[0] ?? atRule)[LOCSTA]!),
                    message: "expecting <space>",
                });
            } else if (stream[1].typ !== EnumToken.StringTokenType) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: options.source!.getSourceLocation((stream[1] ?? atRule)[LOCSTA]!),
                    message: "expecting <string>",
                });
            }

            if (success && (stream[1] as StringToken).val.charCodeAt(0) !== 0x22) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: options.source!.getSourceLocation((stream[1] ?? atRule)[LOCSTA]!),
                    message: "expecting double-quoted string",
                });
            }

            if (!success) {
                atRule[TOKENS] = stream;
                atRule[STATE] = EnumAstNodeStatus.Invalid;
                atRule[ERRORS] = [errors[errors.length - 1]];
                atRule[LOCEND] = (stream.at(-1)! ?? atRule)[LOCEND];

                // @ts-expect-error
                return Object.assign(atRule, {
                    typ: EnumToken.AtRuleNodeType,
                    val: renderTokens(trimArray(stream), options),
                }) as AstAtRule;
            }

            if (options.removeCharset) {
                return null;
            }

            atRule[TOKENS] = stream;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [];
            atRule[LOCEND] = (stream.at(-1)! ?? atRule)[LOCEND];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
            }) as AstAtRule;
        }

        case "font-feature-values": {
            const result = parseAtRuleFontFeatureValues(stream, atRule, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            atRule[TOKENS] = stream;
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;
            atRule[LOCEND] = (stream.at(-1)! ?? atRule)[LOCEND];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [] as Token[],
            }) as AstAtRule;
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
                    location: options.source!.getSourceLocation(atRule[LOCSTA]!),
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
                            location: options.source!.getSourceLocation(token[LOCSTA]!),
                            message: `unexpected token`,
                        });
                    }
                }
            }

            atRule[LOCEND] = (stream.at(-1)! ?? atRule)[LOCEND];
            atRule[TOKENS] = stream;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [] as Token[],
            }) as AstAtRule;
        }

        case "container": {
            const result = parseAtRuleContainerQueryList(stream, atRule, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            atRule[LOCEND] = (stream.at(-1)! ?? atRule)[LOCEND];
            atRule[TOKENS] = stream;
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [] as Token[],
            }) as AstAtRule;
        }
        case "custom-media": {
            const tokens = trimArray(stream.slice(1));
            const result = matchAllSyntaxes(syntax, createValidationContext(tokens), options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            atRule[LOCEND] = (tokens.at(-1)! ?? atRule)[LOCEND];
            atRule[TOKENS] = tokens;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.ValidationFailed;
            atRule[ERRORS] = result.success ? [] : result.errors;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(tokens), options),
            }) as AstKeyframesAtRule;
        }
        case "keyframes": {
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
                    location: options.source!.getSourceLocation(atRule[LOCSTA]!),
                    message: `expected <keyframe-name>`,
                });
                success = false;
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            atRule[LOCEND] = (tokens.at(-1)! ?? atRule)[LOCEND];
            atRule[TOKENS] = tokens;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.KeyframesAtRuleNodeType,
                val: renderTokens(tokens, options),
                chi: [] as Array<AstKeyframesRule | AstComment>,
            }) as AstKeyframesAtRule;
        }

        case "namespace": {
            const result: ValidationMatch = matchAllSyntaxes(
                syntax as ValidationToken[],
                createValidationContext(stream),
                options,
            );

            if (!result.success) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            // else {
            //     parseUrlToken(stream);
            // }

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

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = valid ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = valid ? [] : result.errors;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: trimArray(stream).reduce(
                    (acc, t, index) =>
                        acc +
                        (t.typ === EnumToken.CommentTokenType ||
                        (t.typ === EnumToken.WhitespaceTokenType &&
                            stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                            ? ""
                            : printValue(t, options)),
                    "",
                ),
                ...(parseAsBlock ? { chi: [] } : {}),
            }) as AstAtRule;
        }

        case "import": {
            const result = matchAtRuleImportSyntax(atRule, stream, context, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            } else {
                if (
                    stream[0]?.typ == EnumToken.UrlFunctionTokenType &&
                    (stream[0] as FunctionToken).chi.some(
                        (t) => t.typ == EnumToken.StringTokenType || t.typ == EnumToken.UrlTokenTokenType,
                    )
                ) {
                    stream.splice(0, 1, ...(stream[0] as FunctionToken).chi);
                }
            }

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: stream.reduce(
                    (acc, t, index) =>
                        acc +
                        (t.typ === EnumToken.CommentTokenType ||
                        (t.typ === EnumToken.WhitespaceTokenType &&
                            stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                            ? ""
                            : printValue(t, options)),
                    "",
                ),
            }) as AstAtRule;
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
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            let success: boolean = result.success;

            if (atRule.nam === "else") {
                const siblings = (context as AstAtRule | AstStyleSheet).chi as AstNode[] | Token[];
                let sibling: AstNode | Token | null = null;
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
                    // @ts-expect-error
                } else if (sibling.nam !== "when") {
                    // @ts-expect-error
                    if (sibling.nam !== "else") {
                        missingWhen = true;
                        // @ts-expect-error
                    } else if (sibling.val === "") {
                        definedAfterLastElse = true;
                    }
                }

                if (missingWhen) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: options.source!.getSourceLocation(atRule[LOCSTA]!),
                        message: "at-rule @when is required before @else block",
                    });
                } else if (definedAfterLastElse) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: options.source!.getSourceLocation(atRule[LOCSTA]!),
                        message: "at-rule @else block is defined after last @else block",
                    });
                }
            }

            // @ts-expect-error
            options = { ...options, minify: false, convertColor: false };

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : [errors[errors.length - 1]].concat(result.errors);

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }) as AstAtRule;
        }
        case "media": {
            options = { ...options, parseColor: false };

            const result = parseMediaqueryList(stream, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [] as AstNode[],
            }) as AstAtRule;
        }
        case "scope": {
            let context = createValidationContext(trimArray(stream));

            let success: boolean = true;
            // @ts-ignore
            let range: Token[] = context.peekRange((t) => t.typ === EnumToken.EndParensTokenType);

            if (range[0]?.typ !== EnumToken.StartParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range[0] ?? atRule,
                    location: options.source!.getSourceLocation((range[0] ?? atRule)[LOCSTA]!),
                    message: "expected '(' at start of @scope block",
                });
                success = false;
            } else if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range.at(-1) ?? atRule,
                    location: options.source!.getSourceLocation((range.at(-1) ?? atRule)[LOCSTA]!),
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
                            location: options.source!.getSourceLocation(stream[index]?.[LOCSTA]!),
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
                                location: options.source!.getSourceLocation(stream[index]?.[LOCSTA]!),
                                message: "expected 'to' at end of @scope block",
                            });
                            success = false;
                        } else {
                            context = createValidationContext(stream.slice(index));
                            // @ts-ignore
                            range = context.peekRange((t: Token) => t.typ === EnumToken.EndParensTokenType);
                            if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                                errors.push({
                                    action: "drop",
                                    node: range.at(-1) ?? atRule,
                                    location: options.source!.getSourceLocation((range.at(-1) ?? atRule)[LOCSTA]!),
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

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }) as AstAtRule;
        }
        case "page": {
            trimArray(stream);

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [] as AstNode[],
            }) as AstAtRule;
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
                    location: options.source!.getSourceLocation(atRule[LOCSTA]!),
                    message: "node is allowed only in @page rule",
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
                            location: options.source!.getSourceLocation(stream[i][LOCSTA]!),
                            message: "expected whitespace or comment",
                        });
                        break;
                    }
                }
            }

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [] as AstNode[],
            }) as AstAtRule;
        }

        case "value": {
            let index: number = 0;
            let isVarDeclaration: boolean = false;

            for (; index < stream.length; index++) {
                if (stream[index].typ == EnumToken.PseudoClassTokenType) {
                    Object.assign(stream[index], {
                        typ: EnumToken.IdenTokenType,
                        val: (stream[index] as IdentToken).val.slice(1),
                    });

                    stream.splice(index, 0, {
                        typ: EnumToken.ColonTokenType,
                        [LOCSRCID]: stream[index][LOCSRCID],
                        [LOCSTA]: stream[index][LOCSTA],
                        [LOCEND]: stream[index][LOCEND],
                    });

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
            let result = matchAllSyntaxes(
                syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[],
                createValidationContext(stream),
                options,
            );
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];

            if (!result.success) {
                for (const error of result.errors) {
                    errors.push(error);
                }

                return {
                    typ: EnumToken.AtRuleNodeType,
                    val: renderTokens(stream, options),
                    [LOCSRCID]: atRule[LOCSRCID],
                    [LOCSTA]: atRule[LOCSTA],
                    [LOCEND]: stream.at(-1)?.[LOCEND] ?? atRule[LOCEND],
                    [TOKENS]: stream,
                    [STATE]: EnumAstNodeStatus.Invalid,
                    [ERRORS]: result.errors,
                } as AstAtRule;
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
                        [LOCSRCID]: atRule[LOCSRCID],
                        [LOCSTA]: atRule[LOCSTA],
                        [LOCEND]: stream.at(-1)?.[LOCEND] ?? atRule[LOCEND],
                        [TOKENS]: stream,
                        [STATE]: EnumAstNodeStatus.Validated,
                        [ERRORS]: [],
                    } as CssVariableImportTokenType;
                }

                // import variables from alias
                return {
                    typ: EnumToken.CssVariableTokenType,
                    nam: (nam as IdentToken).val,
                    val: value,
                    [LOCSRCID]: atRule[LOCSRCID],
                    [LOCSTA]: atRule[LOCSTA],
                    [LOCEND]: stream.at(-1)?.[LOCEND] ?? atRule[LOCEND],
                    [TOKENS]: stream,
                    [STATE]: EnumAstNodeStatus.Validated,
                    [ERRORS]: [],
                } as CssVariableToken;
            }

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];

            atRule[STATE] = EnumAstNodeStatus.Validated;
            atRule[ERRORS] = [];

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.CssVariableDeclarationMapTokenType,
                vars: trimArray(stream.slice(0, index)),
                from: stream.slice(index + 1),
            }) as CssVariableMapTokenType;
        }

        default: {
            options = { ...options, parseColor: false };

            let result = null;

            if (syntax == null) {
                // check matching '(' and ')'
                // check commas ',' or ',,'
                // check colon ':'
                // check 'or' and 'and'
                result = matchGenericSyntax(stream, options);

                if (result.errors.length > 0) {
                    for (const error of result.errors) {
                        errors.push(error);
                    }
                }
            } else {
                result = matchAtRuleSyntax(atRule, stream, options);

                if (result.errors.length > 0) {
                    for (const error of result.errors) {
                        errors.push(error);
                    }
                }

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

                            stream[index][LOCEND] = stream[i][LOCEND];
                            Object.assign(stream[index], {
                                typ: tokensfuncDefMap.get(stream[index].typ)!,
                                chi: trimWhiteSpaceTokens(stream.splice(index + 1, i - index - 1)),
                            });
                            i = index;
                            stream.splice(index + 1, 1);
                            stack.pop();
                        }
                    }
                }
            }

            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];

            atRule[TOKENS] = stream.slice();
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.errors;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            }) as AstAtRule;
        }
    }
}

/**
 * Parse a string as an array of declaration nodes
 * @param declaration
 *
 * Example:
 * ````ts
 *
 * const declarations = await parseDeclarations('color: red; background: blue');
 * console.log(declarations);
 * ```
 */
export function parseDeclarations(declaration: string): Array<AstDeclaration | AstComment> {
    const stream: string = `.x{${declaration}}`;
    const result = doParseSync(
        new Tokenizer({
            stream,
            offset: 0,
            position: 0,
            source: new SourceFile(stream, [], ""),
            currentPosition: 0,
        } as ParseInfo),
        { setParent: false, minify: false, validation: false },
    );
    // .then((result) => {
    return (result.ast.chi[0] as AstRule).chi.filter(
        (t) => t.typ == EnumToken.DeclarationNodeType || t.typ == EnumToken.CommentNodeType,
    ) as Array<AstDeclaration | AstComment>;
    // });
}

/**
 * Parse css string and return an array of tokens
 * @param src
 * @param options
 *    - parseColor: parse identifiers as colors
 *    - src: source url used for source map
 * @param errors capture parse errors in the provided array

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
 * tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
export function parseString(
    src: string,
    options: { src?: string; parseColor?: boolean } | null = { parseColor: true },
    errors?: ErrorDescription[],
): Token[] {
    const tokenizer: Tokenizer = new Tokenizer({
        stream: src,
        buffer: "",
        src: options?.src ?? "",
        offset: 0,
        time: 0,
        source: new SourceFile(src, [], options?.src ?? ""),
        position: 0,
        currentPosition: 0,
    } as ParseInfo);
    const mapped: Token[] = [];
    let token: Token;

    while (!tokenizer.done()) {
        tokenizer.next();

        if (tokenizer.unit != null) {
            token = {
                typ: tokenizer.typ as EnumToken,
                val: tokenizer.val,
                unit: tokenizer.unit,
            } as DimensionToken;
        } else if (tokenizer.val === null) {
            token = {
                typ: tokenizer.typ as EnumToken,
            } as Token;
        } else if (tokenizer.kin != null) {
            token = {
                typ: tokenizer.typ as EnumToken,
                val: tokenizer.val,
                kin: tokenizer.kin,
            } as ColorToken;
        } else {
            token = {
                typ: tokenizer.typ as EnumToken,
                val: tokenizer.val,
            } as Token;
        }

        token[LOCSRCID] = tokenizer!.source!.id;
        token[LOCEND] = tokenizer.end as number;
        token[LOCSTA] = tokenizer.sta as number;

        mapped.push(token);
    }

    const result: number[] = parseTokens(mapped, options, errors);

    // remove EOF token
    result.splice(result.length - (result[result.length - 2]?.typ === EnumToken.WhitespaceTokenType ? 2 : 1), 2);
    return result;
}

/**
 * Parse function tokens in a token array
 * @param tokens
 * @param options
 *    - parseColor: parse identifiers as colors
 * @param errors parse errors
 *
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
export function parseTokens(
    tokens: number[],
    options?: { parseColor?: boolean; source?: SourceFile, arena?: Arena } | null,
    errors?: ErrorDescription[],
): number[] {
    const stack: number[] = [];
    const arena = options?.arena as Arena;

    let i: number = 0;
    let index: number;
    let t: number;
    let typ: EnumToken;
    let typ2: EnumToken;

    options ??= { parseColor: true };

    for (; i < tokens.length; i++) {
        t = tokens[i];
        typ = arena.getType(t);

        if (typ === EnumToken.FunctionTokenDefType) {

            typ2 = arena.getType(tokens[i - 1] as number);
            if (
               typ2 === EnumToken.ColonTokenType ||
                typ2 === EnumToken.DoubleColonTokenType
            ) {

                arena.set(tokens[i - 1], EnumToken.PseudoClassFunctionTokenDefType, arena.internString((typ2 === EnumToken.ColonTokenType ? ":" : "::") +
                        arena.getValue(tokens[i])),
                );

                // t = Object.assign(tokens[i - 1], {
                //     typ: EnumToken.PseudoClassFunctionTokenDefType,
                //     val:
                //         (tokens[i - 1].typ === EnumToken.ColonTokenType ? ":" : "::") +
                //         (tokens[i] as FunctionToken).val,
                // });

                arena.setSpanEnd(tokens[i - 1], arena.getSpanEnd(tokens[i]));
                // t[LOCEND] = tokens[i][LOCEND];
                t = tokens[i - 1];
                tokens.splice(i--, 1);
                typ = EnumToken.PseudoClassFunctionTokenDefType;
            }
        }

        if (
            typ === EnumToken.AttrStartTokenType ||
            typ === EnumToken.StartParensTokenType ||
            tokensfuncDefMap.has(typ)
        ) {
            stack.push(t);
            continue;
        }

        if (typ === EnumToken.EndParensTokenType) {

            typ2 = arena.getType(stack.at(-1) as number);
            if (
                stack.length === 0 ||
                (typ2 !== EnumToken.StartParensTokenType && !tokensfuncDefMap.has(typ2))
            ) {
                // unbalanced parens
                const node: number = stack.at(-1) as number;
                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ')'`,
                    node,
                    location: options.source!.getSourceLocation(arena.getSpanStart(node)),
                });

                // return [];
                continue;
            }

            tokens.splice(i, 1);
            index = tokens.indexOf(stack.at(-1)!);

            typ2 = arena.getType(tokens[index]);
            typ2 = typ2 === EnumToken.StartParensTokenType
                        ? EnumToken.ParensTokenType
                        : tokensfuncDefMap.get(typ2) as EnumToken;

            arena.setType(tokens[index], typ2);

            arena.setChildren(tokens[index], ...trimArray(tokens.splice(index + 1, i - index - 1), options));

            // Object.assign(tokens[index], {
            //     typ:
            //         tokens[index].typ === EnumToken.StartParensTokenType
            //             ? EnumToken.ParensTokenType
            //             : (tokensfuncDefMap.get(tokens[index].typ) as EnumToken),
            //     chi: trimArray(tokens.splice(index + 1, i - index - 1)),
            // });

            i = index;

            if (typ2 === EnumToken.ColorTokenType && options?.parseColor) {
                parseColor(tokens[index], arena);
            }

            stack.pop();
            continue;
        }

        if (typ === EnumToken.AttrEndTokenType) {
            if (arena.getType(stack.at(-1)!) !== EnumToken.AttrStartTokenType) {
                // unbalanced
                const node: number = stack.at(-1) as number;

                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ']'`,
                    node,
                    location: options.source!.getSourceLocation(arena.getSpanStart(node)),
                });
                continue;
            }

            index = tokens.indexOf(stack.at(-1)!);
            const attr = stack.at(-1) as number;

            arena.setSpanEnd(attr, arena.getSpanEnd(t));

            // attr[LOCEND] = t[LOCEND];

            tokens.splice(i, 1);
            arena.setType(attr, EnumToken.AttrTokenType);
            arena.setChildren(attr, ...trimArray(tokens.splice(index + 1, i - index - 1), options));


            // Object.assign(attr, {
            //     typ: EnumToken.AttrTokenType,
            //     chi: tokens.splice(index + 1, i - index - 1),
            // });

            tokens[index] = attr;
            i = index;
            stack.pop();
            continue;
        }

        if (typ == EnumToken.IdenTokenType) {
            if (arena.equalsIgnoreCase(t, 'val', "from") && i > 0) {
                const left: number[] = [];
                const right: number[] = [];

                let foundLeft: number = 0;
                let foundRight: number = 0;
                let k: number = i;
                let l: number = i;

                typ2 = arena.getType(tokens[k - 1]);

                while (k > 0) {
                    if (
                        typ2 == EnumToken.CommentTokenType ||
                        typ2 == EnumToken.WhitespaceTokenType
                    ) {
                        left.push(tokens[--k]);
                        continue;
                    }

                    if (
                        typ2 == EnumToken.IdenTokenType ||
                        typ2 == EnumToken.DashedIdenTokenType
                    ) {
                        foundLeft++;
                        left.push(tokens[--k]);
                        continue;
                    }

                    break;
                }

                while (++l < tokens.length) {

                    typ2 = arena.getType(tokens[l]);
                    if (typ2 == EnumToken.CommentTokenType || typ2 == EnumToken.WhitespaceTokenType) {
                        right.push(tokens[l]);
                        continue;
                    }

                    if (typ2 == EnumToken.IdenTokenType || typ2 == EnumToken.StringTokenType) {
                        foundRight++;
                        right.push(tokens[l]);
                        continue;
                    }

                    break;
                }

                if (foundLeft > 0 && foundRight == 1) {

                    trimArray(left, options);
                    // while (left?.[0].typ == EnumToken.WhitespaceTokenType) {
                    //     left.shift();
                    // }

                    // while (left.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                    //     left.pop();
                    // }

                    arena.setLeft(t, ...left);
                    // @ts-ignore
                    arena.setRight(t, right.reduce((a: number | null, b: number) => {

                        typ = arena.getType(b);
                            return a == null
                                ? b
                                : typ == EnumToken.IdenTokenType || typ == EnumToken.StringTokenType
                                  ? b
                                  : a;
                        }, null));

                        const composeSelector = arena.allocate();
                        arena.setType(composeSelector, EnumToken.ComposesSelectorNodeType);
                        // arena.setChildren(composeSelector, t, ...right);
                        arena.setLeft(t, ...left);
                        // @ts-ignore
                        arena.setRight(composeSelector, right.reduce((a: number | null, b: number) => {

                            typ = arena.getType(b);
                            return a == null
                                ? b
                                : typ == EnumToken.IdenTokenType || typ == EnumToken.StringTokenType
                                  ? b
                                  : a;
                        }, null));

                    tokens.splice(k, l - k + 1, composeSelector);

                    // tokens.splice(k, l - k + 1, {
                    //     typ: EnumToken.ComposesSelectorNodeType,
                    //     l: left,
                    //     r: right.reduce((a: Token | null, b: Token) => {
                    //         return a == null
                    //             ? b
                    //             : b.typ == EnumToken.IdenTokenType || b.typ == EnumToken.StringTokenType
                    //               ? b
                    //               : a;
                    //     }, null),
                    // });

                    i = k;
                    continue;
                }
            } else if (options?.parseColor && isColor(t, arena)) {
                parseColor(t, arena);
            }
        }

        typ = arena.getType(t);
        typ2 = arena.getType(tokens[i + 1]);

        if (
            typ == EnumToken.WhitespaceTokenType &&
            (i == 0 ||
                i + 1 == tokens.length ||
                (
                    EnumToken.CommaTokenType == typ2 ||
                    EnumToken.GteTokenType == typ2 ||
                    EnumToken.LteTokenType == typ2 ||
                    EnumToken.ColumnCombinatorTokenType == typ2)
                ) ||
                (i > 0 && trimWhiteSpace.includes(arena.getType(tokens[i - 1])))
        ) {
            tokens.splice(i--, 1);
            continue;
        }

        if (typ == EnumToken.ColonTokenType) {
            // const typ2: EnumToken = tokens[i + 1]?.typ;

            if (typ2 != null) {
                if (typ2 == EnumToken.FunctionTokenType) {
                    typ2 = EnumToken.PseudoClassFuncTokenType;
                } else if (typ2 == EnumToken.IdenTokenType) {

                    arena.set(tokens[i + 1], EnumToken.PseudoClassTokenType, arena.internString( ":" + arena.getValue(tokens[i + 1])));
                    // (tokens[i + 1] as PseudoClassToken).val = ":" + (tokens[i + 1] as PseudoClassToken).val;
                    // tokens[i + 1].typ = EnumToken.PseudoClassTokenType;
                    typ2 = EnumToken.FunctionTokenType;
                }

                if (typ2 == EnumToken.FunctionTokenType || typ2 == EnumToken.IdenTokenType) {
                    tokens.splice(i, 1);
                    i--;
                }
            }
        }

        if (typ === EnumToken.CommaTokenType) {
            if (typ2 === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }

            if (arena.getType(tokens[i - 1]) === EnumToken.WhitespaceTokenType) {
                tokens.splice(i - 1, 1);
                i--;
            }
        }
    }

    if (stack.length > 0) {
        const node: number = stack.at(-1) as number;

        errors?.push?.({
            action: "drop",
            message: `Unbalanced token. Expecting ${typ! === EnumToken.AttrStartTokenType ? "']'" : ")"}'`,
            node,
            location: options.source!.getSourceLocation(arena.getSpanStart(node)),
        });
    }

    return tokens;
}
