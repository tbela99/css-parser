import { isColor, isIdentColor, parseColor } from "../syntax/syntax.ts";
import { camelize, dasherize, equalsIgnoreCase } from "./utils/text.ts";
import { renderValue } from "../renderer/render.ts";
import { EnumAstNodeStatus, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../ast/types.ts";
import { minify } from "../ast/minify.ts";
import { expand } from "../ast/expand.ts";
import { walk, WalkerEvent, walkValues } from "../ast/walk.ts";
import { tokenize, tokenizeStream } from "./tokenize.ts";
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
    ComposesSelectorToken,
    CssVariableImportTokenType,
    CssVariableMapTokenType,
    CssVariableToken,
    DashedIdentToken,
    ErrorDescription,
    FunctionToken,
    GenericVisitorAstNodeHandlerMap,
    GenericVisitorAstNodeSyncHandlerMap,
    GenericVisitorHandler,
    GenericVisitorResult,
    IdentToken,
    LoadResult,
    ModuleSyncOptions,
    ParseInfo,
    ParseResult,
    ParseResultStats,
    ParserOptions,
    ParserSyncOptions,
    PseudoClassToken,
    ResolvedPath,
    SourceLocation,
    StringToken,
    Token,
    TokenizeResult,
    UrlToken,
    VisitorNodeMap,
    WhitespaceToken,
} from "../../@types/index.d.ts";
import { ERRORS, LOC, pageMarginBoxType, PARENT, ROOT, STATE, TOKENS, tokensfuncDefMap } from "../syntax/constants.ts";
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

function renderTokens(tokens: Token[] | null | undefined, options?: any): string {
    if (tokens == null || tokens.length === 0) return "";
    if (options != null) return tokens.map((t) => renderValue(t, options)).join("");
    return tokens.map((t) => renderValue(t)).join("");
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
) {
    const visitors = Object.entries(typeof visitorsDef === "function" ? [visitorsDef] : visitorsDef);
    let key: string;
    let value: any;
    let i: number;

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
                    visitors.push(...Object.entries(value));
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
                // visitors.push(...Object.entries(value));

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

    return {
        allHandlers,
        includeTokens: preValuesHandlers!.size > 0 || valuesHandlers!.size > 0 || postValuesHandlers!.size > 0,
    };
}

/**
 * Parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
export function doParseSync(
    iter: Array<TokenizeResult> | Iterable<TokenizeResult>,
    options: ParserSyncOptions = {},
): ParseResult {
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

    let item: TokenizeResult;
    let node: AstAtRule | AstRule | AstKeyframesRule | AstKeyframesAtRule | AstDeclaration | AstComment | null;

    // @ts-ignore ignore error
    let parensMatch: number = 0;
    let curlyBracketMatch: number = 0;
    let currentItemIndex: number;

    // ast[ROOT] = ast;
    ast[LOC] = {
        sta: 0,
        end: 0,
        srcId: options.source!.id,
    };

    for (currentItemIndex = 0; currentItemIndex < (iter as Array<TokenizeResult>).length; currentItemIndex++) {
        item = (iter as Array<TokenizeResult>)[currentItemIndex];
        stats.bytesIn = item.bytesIn;
        stats.tokensCount++;

        if (BadTokensTypes.includes(item.token.typ)) {
            tokens.push(item.token);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item.token,
                location: options.source!.getSourceLocation(item.token[LOC]!.sta),
            });

            // bad token
            continue;
        }

        if (item.token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(item.token.typ)) {
            parensMatch++;
        } else if (item.token.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }

        if (item.token.typ === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        } else if (item.token.typ === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }

        tokens.push(item.token);

        if (
            parensMatch === 0 &&
            (item.token.typ === EnumToken.SemiColonTokenType ||
                item.token.typ === EnumToken.BlockStartTokenType ||
                item.token.typ === EnumToken.EOFTokenType)
        ) {
            node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            if (node != null) {
                if ("chi" in node) {
                    stack.push(node as AstAtRule | AstRule | AstKeyframesRule);
                    context = node as AstRuleList;
                }
            } else if (item.token.typ == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;
                tokens = [item.token];

                do {
                    item = (iter as Array<TokenizeResult>)[++currentItemIndex];

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
                        location: options.source!.getSourceLocation(tokens[0][LOC]!.sta),
                    });
                }
            }

            tokens = [];
        } else if ((parensMatch === 0 || curlyBracketMatch === 0) && item.token.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            if (context[LOC] != null) {
                context[LOC].end = item.token[LOC]!.end;
            }

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

            tokens = [];
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
        // }
    }

    if (tokens.length > 0) {
        node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

        if (node != null) {
            if ("chi" in node /* && node.typ != EnumToken.InvalidRuleNodeType */) {
                stack.push(node);
                context = node as AstRuleList;
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
                        subNodes.push(
                            ...(nodes[i] as AstRule | AstAtRule | AstKeyframesRule | AstKeyframesAtRule)[TOKENS]!,
                        );
                        break;
                    case EnumToken.DeclarationNodeType:
                        subNodes.push(...(nodes[i] as AstDeclaration).val);
                        break;
                }
            }

            if (nodes[i].chi != null) {
                subNodes.push(...nodes[i].chi);
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
                replaceNodeOrValue(nodes[i][PARENT], nodes[i], node);
            }
        }

        nodes = null;
    }

    if (invalidNodes.length > 0) {
        let count: number = invalidNodes.length;

        for (const { node, parent } of walk(ast)) {
            if (options.lenient && node[STATE] == EnumAstNodeStatus.Unknown) {
                continue;
            }

            if (
                node[STATE] === EnumAstNodeStatus.Invalid ||
                node[STATE] === EnumAstNodeStatus.Unknown ||
                node[STATE] === EnumAstNodeStatus.Unparsed ||
                node[STATE] === EnumAstNodeStatus.Malformed ||
                node[STATE] === EnumAstNodeStatus.Disallowed
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
            tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
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
            moduleSettings.generateScopedName = generateSyncScopedName;
        }

        moduleSettings.filePath = filePath;
        moduleSettings.pattern =
            pattern != null && pattern !== "" ? pattern : filePath === "" ? `[local]_[hash]` : `[local]_[hash]_[name]`;

        for (const { node, parent } of walk(ast)) {
            if (node.typ == EnumToken.CssVariableImportTokenType) {
                throw new Error(
                    "css variable import not supported by parseSync() or transformSync(). use parse() or transform() instead.\nat " +
                        options.source!.getSourceLocation(node[LOC]!.sta).join(":"),
                );
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
                                `composes from file is not supported using parseSync() or transformSync(). Use parse() or transform() instead.\nat ${options.source!.getSourceLocation(node[LOC]!.sta).join(":")}`,
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
                            `pure module: No id or class found in selector '${node.sel}' at '${node[LOC]?.src ?? ""}':${node[LOC]?.sta?.lin ?? ""}:${node[LOC]?.sta?.col ?? ""}`,
                        );
                    }
                }

                node.sel = "";

                for (const token of node[TOKENS]! as Token[]) {
                    node.sel += renderValue(token);
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
export async function doParse(
    iter: Array<TokenizeResult> | Iterable<TokenizeResult> | AsyncGenerator<TokenizeResult>,
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

    let item: TokenizeResult;
    let node: AstAtRule | AstRule | AstKeyframesRule | AstKeyframesAtRule | AstDeclaration | AstComment | null;

    // @ts-ignore ignore error
    let isAsync: boolean = typeof iter[Symbol.asyncIterator] === "function";
    let parensMatch: number = 0;
    let curlyBracketMatch: number = 0;

    // ast[ROOT] = ast;

    ast[LOC] = {
        sta: 0,
        end: 0,
        srcId: options.source!.id,
    };

    if (Array.isArray(iter)) {
        // @ts-expect-error
        iter = iter[Symbol.iterator]() as Iterator<TokenizeResult>;
    }

    while (
        (item = isAsync
            ? // @ts-expect-error
              ((await iter.next()).value as TokenizeResult)
            : // @ts-expect-error
              ((iter as Iterator<TokenizeResult>).next().value as TokenizeResult))
    ) {
        stats.bytesIn = item.bytesIn;
        stats.tokensCount++;

        if (BadTokensTypes.includes(item.token.typ)) {
            tokens.push(item.token);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item.token,
                location: options.source!.getSourceLocation(item.token[LOC]!.sta),
            });

            // bad token
            continue;
        }

        if (item.token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(item.token.typ)) {
            parensMatch++;
        } else if (item.token.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }

        if (item.token.typ === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        } else if (item.token.typ === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }

        tokens.push(item.token);

        if (
            parensMatch === 0 &&
            (item.token.typ === EnumToken.SemiColonTokenType ||
                item.token.typ === EnumToken.BlockStartTokenType ||
                item.token.typ === EnumToken.EOFTokenType)
        ) {
            node = parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            if (node != null) {
                if ("chi" in node) {
                    stack.push(node as AstAtRule | AstRule | AstKeyframesRule);
                    context = node as AstRuleList;
                } else if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).nam === "import") {
                    imports.push(node);
                }
            } else if (item.token.typ == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;
                tokens = [item.token];

                do {
                    item = isAsync
                        ? // @ts-expect-error
                          ((await iter.next()).value as TokenizeResult)
                        : // @ts-expect-error
                          ((iter as Iterator<TokenizeResult>).next().value as TokenizeResult);

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
                        location: options.source!.getSourceLocation(tokens[0][LOC]!.sta),
                    });
                }
            }

            tokens = [];
        } else if ((parensMatch === 0 || curlyBracketMatch === 0) && item.token.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options as ParserOptions, errors, stats, invalidNodes);

            if (context[LOC] != null) {
                context[LOC].end = item.token[LOC]!.end;
            }

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

            tokens = [];
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
                        buffer: "",
                        offset: 0,
                        source,
                        position: 0,
                        currentPosition: -1,
                    } as ParseInfo;
                    const root: ParseResult = await doParse(
                        stream instanceof ReadableStream ? tokenizeStream(stream, parseInfo) : tokenize(parseInfo),
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
                    node[PARENT]!.chi.splice(node[PARENT]!.chi.indexOf(node), 1, ...root.ast.chi);

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
                        subNodes.push(
                            ...(nodes[i] as AstRule | AstAtRule | AstKeyframesRule | AstKeyframesAtRule)[TOKENS]!,
                        );
                        break;
                    case EnumToken.DeclarationNodeType:
                        subNodes.push(...(nodes[i] as AstDeclaration).val);
                        break;
                }
            }

            if (nodes[i].chi != null) {
                subNodes.push(...nodes[i].chi);
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
                replaceNodeOrValue(nodes[i][PARENT], nodes[i], node);
            }
        }

        nodes = null;
    }

    if (invalidNodes.length > 0) {
        let count: number = invalidNodes.length;

        for (const { node, parent } of walk(ast)) {
            if (options.lenient && node[STATE] == EnumAstNodeStatus.Unknown) {
                continue;
            }

            if (
                node[STATE] === EnumAstNodeStatus.Invalid ||
                node[STATE] === EnumAstNodeStatus.Unknown ||
                node[STATE] === EnumAstNodeStatus.Unparsed ||
                node[STATE] === EnumAstNodeStatus.Malformed ||
                node[STATE] === EnumAstNodeStatus.Disallowed
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
            tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
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
                    currentPosition: -1,
                } as ParseInfo;

                const root: ParseResult = await doParse(
                    stream instanceof ReadableStream ? tokenizeStream(stream, parseInfo) : tokenize(parseInfo),
                    Object.assign({}, options, {
                        source,
                        minify: false,
                        setParent: false,
                        src: src.relative,
                    }) as ParserOptions,
                );

                options.parseInfo!.time += parseInfo.time;

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
                                    ? tokenizeStream(stream, {
                                          buffer: "",
                                          offset: 0,
                                          source: new SourceFile("", [], src.relative),
                                          position: 0,
                                          currentPosition: -1,
                                      } as ParseInfo)
                                    : tokenize({
                                          stream,
                                          buffer: "",
                                          offset: 0,
                                          position: 0,
                                          source: new SourceFile(stream, [], src.relative),
                                          currentPosition: -1,
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
                        // if (!((value as DashedIdentToken).val in mapping)) {
                        //     const result =
                        //         moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                        //             ? (value as DashedIdentToken).val
                        //             : moduleSettings.generateScopedName!(
                        //                   (value as DashedIdentToken).val,
                        //                   moduleSettings.filePath as string,
                        //                   moduleSettings.pattern as string,
                        //                   moduleSettings.hashLength,
                        //               );
                        //     let val: string = result instanceof Promise ? await result : result;

                        //     mapping[(value as DashedIdentToken).val] =
                        //         "--" +
                        //         (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                        //         moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                        //             ? getKeyName(val, moduleSettings.naming as ModuleCaseTransformEnum)
                        //             : val);
                        //     revMapping[mapping[(value as DashedIdentToken).val]] = (value as DashedIdentToken).val;
                        // }

                        (value as DashedIdentToken).val = mapping[(value as DashedIdentToken).val];
                    } else if (
                        (value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        (value as IdentToken).val in importedCssVariables
                    ) {
                        replaceNodeOrValue(parent, value, importedCssVariables[(value as IdentToken).val].val);
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
                            `pure module: No id or class found in selector '${node.sel}' at '${node[LOC]?.src ?? ""}':${node[LOC]?.sta?.lin ?? ""}:${node[LOC]?.sta?.col ?? ""}`,
                        );
                    }
                }

                node.sel = "";

                for (const token of node[TOKENS]! as Token[]) {
                    node.sel += renderValue(token);
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
                // else {
                //     let isReplaced: boolean = false;

                //     for (const { value, parent } of walkValues(node[TOKENS], node)) {
                //         if (
                //             EnumToken.MediaQueryConditionTokenType == parent.typ &&
                //             // @ts-expect-error
                //             value != (parent as MediaQueryConditionToken).l
                //         ) {
                //             if (
                //                 (value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                //                 (value as IdentToken).val in importedCssVariables
                //             ) {
                //                 isReplaced = true;
                //                 (parent as MediaQueryConditionToken).r.splice(
                //                     (parent as MediaQueryConditionToken).r.indexOf(value),
                //                     1,
                //                     ...importedCssVariables[(value as IdentToken).val].val,
                //                 );
                //             }
                //         }
                //     }

                //     if (isReplaced) {
                //         node.val = renderTokens(node[TOKENS]!);
                //     }
                // }
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
    invalidNodes: AstNode[],
): AstRule | AstAtRule | AstKeyframesRule | AstKeyframesAtRule | AstDeclaration | AstComment | null {
    let i: number = 0;

    if (tokens.at(-1)?.typ === EnumToken.EOFTokenType) {
        tokens.pop();

        // check parenthesis are balanced
        let matchCount: number = 0;
        let position: SourceLocation = tokens.at(-1)?.[LOC] as SourceLocation;

        for (let i = 0; i < tokens.length; i++) {
            const token: Token = tokens[i];

            if (token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token.typ)) {
                matchCount++;
            } else if (token.typ === EnumToken.EndParensTokenType) {
                matchCount--;
            }
        }

        if (matchCount > 0) {
            let k: number = tokens.length;

            while (
                k-- > 0 &&
                (tokens[k].typ === EnumToken.WhitespaceTokenType || tokens[k].typ === EnumToken.CommentTokenType)
            );

            if (tokens[k]?.typ == EnumToken.SemiColonTokenType) {
                matchCount = 0;
            }

            while (matchCount > 0) {
                tokens.push({
                    typ: EnumToken.EndParensTokenType,
                    [LOC]: { ...position },
                });
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
                location: options.source!.getSourceLocation(tokens[i][LOC]!.sta),
            });

            tokens[i].typ = EnumToken.InvalidCommentTokenType;
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
        i = 0;
    }

    for (; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {
            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: "drop",
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    location: options.source!.getSourceLocation(tokens[i][LOC]!.sta),
                });

                tokens[i].typ = EnumToken.InvalidCommentTokenType;
                continue;
            }

            tokens[i][ROOT] = context[ROOT];
            context.chi!.push(tokens[i] as AstNode);
            stats.nodesCount++;
        } else if (tokens[i].typ != EnumToken.WhitespaceTokenType) {
            break;
        }
    }

    if (tokens.length == 0) {
        return null;
    }

    let delim: Token = tokens.at(-1) as Token;

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

            parent = parent[PARENT];
        }

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

        if (
            (node as AstNode)[STATE] == EnumAstNodeStatus.Invalid ||
            (node as AstNode)[STATE] == EnumAstNodeStatus.Disallowed ||
            (node as AstNode)[STATE] == EnumAstNodeStatus.Unknown ||
            (node as AstNode)[STATE] == EnumAstNodeStatus.Unparsed ||
            (node as AstNode)[STATE] == EnumAstNodeStatus.Malformed
        ) {
            invalidNodes.push(node);
        }

        stats.nodesCount++;
        context.chi!.push(node);

        node[ROOT] = context[ROOT];
        node[PARENT] = context;
        // @ts-ignore
        return node;
    } else {
        stats.nodesCount++;

        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const node = parseSelector(tokens, context as AstRule | AstAtRule, options, errors);

            context.chi!.push(node);
            node[PARENT] = context;
            node[ROOT] = context[ROOT];

            if (
                (node as AstNode)[STATE] == EnumAstNodeStatus.Invalid ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Disallowed ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Unknown ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Unparsed ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Malformed
            ) {
                invalidNodes.push(node);
            }

            return node;
        } else {
            const node = parseDeclaration(tokens, context as AstRule | AstAtRule, options, errors);
            node[PARENT] = context;
            node[ROOT] = context[ROOT];

            if (context.typ === EnumToken.StyleSheetNodeType && node.typ === EnumToken.DeclarationNodeType) {
                node[STATE] = EnumAstNodeStatus.Invalid;

                errors.push({
                    message: "<declaration> not allowed in <stylesheet>",
                    action: "drop",
                    node,
                    location: options.source!.getSourceLocation(node[LOC]!.sta),
                });
            } else if (options.lenient || node.typ === EnumToken.DeclarationNodeType) {
                context.chi!.push(node);
            }

            if (
                (node as AstNode)[STATE] == EnumAstNodeStatus.Invalid ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Disallowed ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Unknown ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Unparsed ||
                (node as AstNode)[STATE] == EnumAstNodeStatus.Malformed
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
    stream: Token[],
    context: AstRule | AstAtRule | AstStyleSheet,
    options: ParserOptions,
    errors: ErrorDescription[],
    parseAsBlock: boolean | null = null,
): AstAtRule | CssVariableImportTokenType | CssVariableToken | null {
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
        // if (!options.lenient) {
        errors.push({
            action: "drop",
            node: atRule,
            location: options.source!.getSourceLocation(atRule[LOC]!.sta),
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
                location: options.source!.getSourceLocation(atRule[LOC]!.sta),
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
                location: options.source!.getSourceLocation(token[LOC]!.sta),
                message: `unexpected token ${EnumToken[token.typ]} at ${token[LOC]!.srcId}:${token[LOC]!.sta}:${token[LOC]!.sta}`,
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
            location: options.source!.getSourceLocation(atRule[LOC]!.sta),
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
                    location: options.source!.getSourceLocation((stream[0] ?? atRule)[LOC]!.sta),
                    message: "expecting <space>",
                });
            } else if (stream[1].typ !== EnumToken.StringTokenType) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: options.source!.getSourceLocation((stream[1] ?? atRule)[LOC]!.sta),
                    message: "expecting <string>",
                });
            }

            if (success && (stream[1] as StringToken).val.charCodeAt(0) !== 0x22) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: options.source!.getSourceLocation((stream[1] ?? atRule)[LOC]!.sta),
                    message: "expecting double-quoted string",
                });
            }

            if (!success) {
                atRule[TOKENS] = stream;
                atRule[STATE] = EnumAstNodeStatus.Invalid;
                atRule[ERRORS] = [errors[errors.length - 1]];
                atRule[LOC] = { ...atRule[LOC], end: (stream.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;

                // @ts-expect-error
                return Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: renderTokens(trimArray(stream), options),
                }) as AstAtRule;
            }

            if (options.removeCharset) {
                return null;
            }

            atRule[TOKENS] = stream;
            atRule[STATE] = EnumAstNodeStatus.Validated;
            atRule[ERRORS] = [];
            atRule[LOC] = { ...atRule[LOC], end: (stream.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;

            // @ts-expect-error
            return Object.assign(atRule, {
                typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                val: renderTokens(trimArray(stream), options),
            }) as AstAtRule;
        }

        case "font-feature-values": {
            const result = parseAtRuleFontFeatureValues(stream, atRule, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }

            atRule[TOKENS] = stream;
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;
            atRule[LOC] = { ...atRule[LOC], end: (stream.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;

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
                    location: options.source!.getSourceLocation(atRule[LOC]!.sta),
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
                            location: options.source!.getSourceLocation(token[LOC]!.sta),
                            message: `unexpected token ${EnumToken[token.typ]} at ${token[LOC]!.srcId}:${token[LOC]!.sta}:${token[LOC]!.sta}`,
                        });
                    }
                }
            }

            atRule[LOC] = { ...atRule[LOC], end: (stream.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;
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
                errors.push(...result.errors);
            }

            atRule[LOC] = { ...atRule[LOC], end: (stream.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;
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
                errors.push(...result.errors);
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            atRule[LOC] = { ...atRule[LOC], end: (tokens.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;
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
                    location: options.source!.getSourceLocation(atRule[LOC]!.sta),
                    message: `expected <keyframe-name> at ${atRule[LOC]!.srcId}:${atRule[LOC]!.sta!}:${atRule[LOC]!.sta!}`,
                });
                success = false;
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            atRule[LOC] = { ...atRule[LOC], end: (tokens.at(-1)! ?? atRule)[LOC]!.end } as SourceLocation;
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
                errors.push(...result.errors);
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

            atRule[LOC]!.end = stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end;
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
                            : renderValue(t, options)),
                    "",
                ),
                ...(parseAsBlock ? { chi: [] } : {}),
            }) as AstAtRule;
        }

        case "import": {
            const result = matchAtRuleImportSyntax(atRule, stream, context, options);

            if (result.errors.length > 0) {
                errors.push(...result.errors);
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

            // @ts-expect-error
            atRule[LOC].end = stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end;
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
                            : renderValue(t, options)),
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
                errors.push(...result.errors);
            }

            let success: boolean = result.success;

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
                        location: options.source!.getSourceLocation(atRule[LOC]!.sta),
                        message: "at-rule @when is required before @else block",
                    });
                } else if (definedAfterLastElse) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: options.source!.getSourceLocation(atRule[LOC]!.sta),
                        message: "at-rule @else block is defined after last @else block",
                    });
                }
            }

            // @ts-expect-error
            options = { ...options, minify: false, convertColor: false };

            atRule[LOC] = { ...atRule[LOC], end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end } as SourceLocation;
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
                errors.push(...result.errors);
            }

            atRule[LOC]!.end = stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end;
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
                    location: options.source!.getSourceLocation((range[0] ?? atRule)[LOC]!.sta),
                    message: "expected '(' at start of @scope block",
                });
                success = false;
            } else if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range.at(-1) ?? atRule,
                    location: options.source!.getSourceLocation((range.at(-1) ?? atRule)[LOC]!.sta),
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
                            location: options.source!.getSourceLocation(stream[index]?.[LOC]!.sta),
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
                                location: options.source!.getSourceLocation(stream[index]?.[LOC]!.sta),
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
                                    location: options.source!.getSourceLocation((range.at(-1) ?? atRule)[LOC]!.sta),
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
            atRule[LOC].end = stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end;
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

            atRule[LOC]!.end = stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end;
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
                    location: options.source!.getSourceLocation(atRule[LOC]!.sta),
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
                            location: options.source!.getSourceLocation(stream[i][LOC]!.sta),
                            message: "expected whitespace or comment",
                        });
                        break;
                    }
                }
            }

            atRule[LOC] = { ...atRule[LOC], end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end } as SourceLocation;
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
                        [LOC]: { ...stream[index][LOC], end: stream[index]?.[LOC]?.end } as SourceLocation,
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
                errors.push(...result.errors);

                return {
                    typ: EnumToken.AtRuleNodeType,
                    val: renderTokens(stream, options),
                    [LOC]: {
                        ...atRule[LOC],
                        end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end,
                    } as SourceLocation,
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
                        [LOC]: {
                            ...atRule[LOC],
                            end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end,
                        } as SourceLocation,
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
                    [LOC]: {
                        ...atRule[LOC],
                        end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end,
                    } as SourceLocation,
                    [TOKENS]: stream,
                    [STATE]: EnumAstNodeStatus.Validated,
                    [ERRORS]: [],
                } as CssVariableToken;
            }

            atRule[LOC] = {
                ...atRule[LOC],
                end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end,
            } as SourceLocation;
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
                // check commas , or ,,
                // check colon :
                // check or and and
                result = matchGenericSyntax(stream, options);

                if (result.errors.length > 0) {
                    errors.push(...result.errors);
                }
            } else {
                result = matchAtRuleSyntax(atRule, stream, options);

                if (result.errors.length > 0) {
                    errors.push(...result.errors);
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

                            stream[index][LOC]!.end = stream[i][LOC]!.end;
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

            atRule[LOC] = {
                ...atRule[LOC],
                end: stream.at(-1)?.[LOC]?.end ?? atRule[LOC]!.end,
            } as SourceLocation;
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
export async function parseDeclarations(declaration: string): Promise<Array<AstDeclaration | AstComment>> {
    const stream: string = `.x{${declaration}}`;
    return doParse(
        tokenize({
            stream,
            buffer: "",
            offset: 0,
            position: 0,
            source: new SourceFile(stream, [], ""),
            currentPosition: -1,
        } as ParseInfo),
        { setParent: false, minify: false, validation: false },
    ).then((result) => {
        return (result.ast.chi[0] as AstRule).chi.filter(
            (t) => t.typ == EnumToken.DeclarationNodeType || t.typ == EnumToken.CommentNodeType,
        ) as Array<AstDeclaration | AstComment>;
    });
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
    const parseInfo: ParseInfo = {
        stream: src,
        buffer: "",
        offset: 0,
        time: 0,
        source: new SourceFile(src, [], ""),
        position: 0,
        currentPosition: -1,
    };

    const tokenResults: TokenizeResult[] = tokenize(parseInfo);
    const mapped: Token[] = [];

    for (const token of tokenResults) {
        mapped.push(token.token);
    }

    const result: Token[] = parseTokens(mapped, options, errors);

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
    tokens: Token[],
    options?: { parseColor?: boolean; source?: SourceFile } | null,
    errors?: ErrorDescription[],
): Token[] {
    const stack: Token[] = [];

    let i: number = 0;
    let index: number;
    let t: Token;

    options ??= { parseColor: true };

    for (; i < tokens.length; i++) {
        t = tokens[i];

        if (t.typ === EnumToken.FunctionTokenDefType) {
            if (
                tokens[i - 1]?.typ === EnumToken.ColonTokenType ||
                tokens[i - 1]?.typ === EnumToken.DoubleColonTokenType
            ) {
                t = Object.assign(tokens[i - 1], {
                    typ: EnumToken.PseudoClassFunctionTokenDefType,
                    val:
                        (tokens[i - 1].typ === EnumToken.ColonTokenType ? ":" : "::") +
                        (tokens[i] as FunctionToken).val,
                });
                t[LOC]!.end = tokens[i][LOC]!.end;
                tokens.splice(i--, 1);
            }
        }

        if (
            t.typ === EnumToken.AttrStartTokenType ||
            t.typ === EnumToken.StartParensTokenType ||
            tokensfuncDefMap.has(t.typ)
        ) {
            stack.push(t);
            continue;
        }

        if (t.typ === EnumToken.EndParensTokenType) {
            if (
                stack.length === 0 ||
                (stack.at(-1)?.typ !== EnumToken.StartParensTokenType && !tokensfuncDefMap.has(stack.at(-1)?.typ))
            ) {
                // unbalanced parens
                const node: Token = stack.at(-1) as Token;
                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ')'`,
                    node,
                    location: options.source!.getSourceLocation(node[LOC]!.sta),
                });

                // return [];
                continue;
            }

            tokens.splice(i, 1);
            index = tokens.indexOf(stack.at(-1)!);

            Object.assign(tokens[index], {
                typ:
                    tokens[index].typ === EnumToken.StartParensTokenType
                        ? EnumToken.ParensTokenType
                        : (tokensfuncDefMap.get(tokens[index].typ) as EnumToken),
                chi: trimArray(tokens.splice(index + 1, i - index - 1)),
            });
            i = index;

            if (tokens[index].typ === EnumToken.ColorTokenType && options?.parseColor) {
                parseColor(tokens[index]);
            }

            stack.pop();
            continue;
        }

        if (t.typ === EnumToken.AttrEndTokenType) {
            if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType) {
                // unbalanced
                const node: Token = stack.at(-1) as Token;

                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ']'`,
                    node,
                    location: options.source!.getSourceLocation(node[LOC]!.sta),
                });
                continue;
            }

            index = tokens.indexOf(stack.at(-1)!);
            const attr = stack.at(-1) as AttrStartToken;

            attr[LOC]!.end = t[LOC]!.end;

            tokens.splice(i, 1);
            Object.assign(attr, {
                typ: EnumToken.AttrTokenType,
                chi: tokens.splice(index + 1, i - index - 1),
            });

            tokens[index] = attr;
            i = index;
            stack.pop();
            continue;
        }

        if (t.typ == EnumToken.IdenTokenType) {
            if ((t as IdentToken).val == "from" && i > 0) {
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
            } else if (options?.parseColor && isColor(t)) {
                parseColor(t);
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
                    (tokens[i + 1] as PseudoClassToken).val = ":" + (tokens[i + 1] as PseudoClassToken).val;
                    tokens[i + 1].typ = EnumToken.PseudoClassTokenType;
                }

                if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {
                    tokens.splice(i, 1);
                    i--;
                }
            }
        }

        if (t.typ === EnumToken.CommaTokenType) {
            if (tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }

            if (tokens[i - 1]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(i - 1, 1);
                i--;
            }
        }
    }

    if (stack.length > 0) {
        const node: Token = stack.at(-1) as Token;

        errors?.push?.({
            action: "drop",
            message: `Unbalanced token. Expecting ${node.typ === EnumToken.AttrStartTokenType ? "']'" : ")"}'`,
            node,
            location: options.source!.getSourceLocation(node[LOC]!.sta),
        });

        // return [];
    }

    return tokens;
}
