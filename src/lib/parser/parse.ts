import { isColor, isIdentColor, parseColor } from "../syntax/syntax.ts";
import { camelize, dasherize, equalsIgnoreCase } from "./utils/text.ts";
import { renderValue } from "../printer/render.ts";
import {
    EnumAstNodeStatus,
    EnumToken,
    ModuleCaseTransformEnum,
    ModuleScopeEnumOptions,
    WalkerEvent,
} from "../ast/types.ts";
import { minify } from "../ast/minify.ts";
import { Tokenizer } from "./tokenize.ts";
import { AstArena, TokenField } from "../ast/arena.ts";
import { ARENAID, AstArenaNode } from "../ast/arena-node.ts";
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
    BinaryExpressionToken,
    ClassSelectorToken,
    ColorToken,
    CommentToken,
    ComposesSelectorToken,
    ContainerStyleRangeToken,
    CssVariableImportTokenType,
    CssVariableMapTokenType,
    DashedIdentToken,
    DimensionToken,
    ErrorDescription,
    FunctionToken,
    GenericVisitorAstNodeHandlerMap,
    GenericVisitorAstNodeSyncHandlerMap,
    GenericVisitorHandler,
    GenericVisitorResult,
    IdentToken,
    IfConditionToken,
    IfElseConditionToken,
    LoadResult,
    MatchExpressionToken,
    MediaRangeQueryToken,
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
    SupportsQueryConditionToken,
    Token,
    UrlToken,
    VisitorNodeMap,
    WhenElseUnaryConditionToken,
    WhitespaceToken,
    PlainAstNode,
    PlainToken,
} from "../../@types/index.d.ts";
import { pageMarginBoxType, tokensfuncDefMap } from "../syntax/constants.ts";
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
import { trimWhiteSpaceTokens } from "./utils/token.ts";
import { parseAtRuleContainerQueryList } from "./utils/at-rule-container.ts";
import { parseMediaqueryList } from "./utils/at-rule-media.ts";
import { matchAtRuleSyntax } from "./utils/at-rule.ts";
import { parseAtRuleFontFeatureValues } from "./utils/at-rule-font-feature-values.ts";
import { matchGenericSyntax } from "./utils/at-rule-generic.ts";
import { memoize } from "./utils/cache.ts";
import { SourceFile } from "./source.ts";
import { dirname } from "../fs/resolve.ts";
import { NodeWalker, ValueWalker } from "../ast/walk.ts";

function renderTokens(arena: AstArena, tokens: Token[] | null | undefined, options?: any): string {
    if (tokens == null || tokens.length === 0) return "";
    if (options != null) return tokens.map((t) => renderValue(arena, t, options)).join("");
    return tokens.map((t) => renderValue(arena, t)).join("");
}

declare type T = AstDeclaration | AstAtRule | AstRule | AstKeyframesRule | AstKeyframesAtRule;

/**
 * allocate an at-rule node from an at-rule token
 * @param arena
 * @param atRule at-rule token: name and location
 * @param typ
 * @param tokens prelude tokens
 * @param state
 * @param errors
 * @param end last token of the at-rule
 * @param val
 * @param block
 */
function createAtRuleNode(
    arena: AstArena,
    atRule: Token,
    typ: EnumToken,
    tokens: Token[] | null,
    state: EnumAstNodeStatus,
    errors: ErrorDescription[] | null,
    end: Token,
    val: string,
    block: boolean,
): AstNode {
    const node: AstNode = arena.createAtRule(typ, arena.strings[arena.name[atRule]], val, block, tokens, state, errors);

    arena.spanLocation(node, atRule, end);
    return node;
}

/**
 * convert a visitor result to node ids. the object views of the arena ({@link AstArenaNode}) are not copied, the views
 * of another arena are imported, plain objects are allocated in the arena
 * @param arena
 * @param replacement
 */
function visitorResult(arena: AstArena, replacement: unknown): number | number[] | null {
    if (Array.isArray(replacement)) {
        const result: number[] = [];

        for (const item of replacement) {
            if (typeof item == "number") {
                result.push(item);
            } else if (item != null && typeof item == "object") {
                result.push(arena.fromObject(item as AstArenaNode | PlainAstNode | PlainToken));
            } else {
                return null;
            }
        }

        return result;
    }

    if (typeof replacement == "number") {
        return replacement;
    }

    if (replacement != null && typeof replacement == "object") {
        return arena.fromObject(replacement as AstArenaNode | PlainAstNode | PlainToken);
    }

    return null;
}

/**
 * allocate a comment node from a comment token
 * @param arena
 * @param token
 */
function createCommentNode(arena: AstArena, token: Token): AstNode {
    const node: AstNode = arena.createComment(arena.dataTypes[token], arena.strings[arena.stringValue[token]]);

    arena.copyLocation(node, token);
    return node;
}

/**
 * initial arena capacity: one node for every 4 bytes of css. the statement tokens that are not attached to the tree
 * are recycled, so a parse + minify allocates 0.07 to 0.22 node per byte (up to 0.5 for keyframes heavy stylesheets
 * or when nesting rules are expanded): the arena seldom grows. the length of a stream is unknown: 4096 nodes
 * @param tokenizer
 */
function arenaCapacity(tokenizer: Tokenizer): number {
    const length: number = tokenizer.streamLength;

    // small inputs (css modules, inline styles, ...) do not allocate a large arena, the arena grows when needed
    return length == 0 ? 4096 : Math.min(1 << 25, Math.ceil(length / 4) + 1024);
}

/**
 * allocate the current tokenizer token in the arena
 * @param arena
 * @param tokenizer
 * @param sourceIndex index of the source in the arena sources table. negative when the token has no location
 */
function allocateToken(arena: AstArena, tokenizer: Tokenizer, sourceIndex: number): Token {
    const item: Token = arena.allocate();
    const val: string | number | null = tokenizer.val;

    arena.dataTypes[item] = tokenizer.typ as EnumToken;

    if (tokenizer.unit != null) {
        arena.numericValue[item] = val as number;
        arena.unit[item] = arena.internString(tokenizer.unit);
    } else if (tokenizer.nam != null) {
        arena.name[item] = arena.internString(tokenizer.nam);
    } else if (val !== null) {
        if (typeof val == "number") {
            arena.numericValue[item] = val;
        } else if (tokenizer.typ != EnumToken.WhitespaceTokenType) {
            // whitespace is always rendered as a single space: the text is not kept
            arena.stringValue[item] = arena.internString(val);
        }

        if (tokenizer.kin != null) {
            // inlined: arena.setColorType(item, tokenizer.kin)
            arena.colorType[item] = tokenizer.kin;
        }
    }

    if (sourceIndex >= 0) {
        arena.setTokenLocation(item, sourceIndex, tokenizer.sta as number, tokenizer.end as number);
    }

    return item;
}

/**
 * recycle the tokens of a statement that were not attached to the tree: their ids are reused by the next allocations.
 * the tokens referenced by the errors or the invalid nodes of the statement are kept
 * @param arena
 * @param tokens statement tokens
 * @param errors
 * @param errorStart index of the first error of the statement
 * @param invalidNodes
 * @param invalidStart index of the first invalid node of the statement
 */
function recycleStatementTokens(
    arena: AstArena,
    tokens: Token[],
    errors: ErrorDescription[],
    errorStart: number,
    invalidNodes: AstNode[],
    invalidStart: number,
): void {
    for (let i = 0; i < tokens.length; i++) {
        const token: Token = tokens[i];

        // already recycled (a token can be recorded twice), attached or holding other tokens
        if (
            arena.dataTypes[token] == 0 ||
            arena.parents[token] != 0 ||
            arena.firstChild[token] != 0 ||
            arena.firstToken[token] != 0
        ) {
            continue;
        }

        let referenced: boolean = invalidNodes.indexOf(token, invalidStart) != -1;

        for (let j = errorStart; !referenced && j < errors.length; j++) {
            referenced = errors[j].node === token;
        }

        if (!referenced) {
            arena.recycle(token);
        }
    }
}

export const trimWhiteSpace: EnumToken[] = [
    EnumToken.CommentTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ColumnCombinatorTokenType,
];
/**
 * bad comment, cdo, url or string token
 * @param type
 */
function isBadToken(type: EnumToken): boolean {
    return (
        type == EnumToken.BadCommentTokenType ||
        type == EnumToken.BadCdoTokenType ||
        type == EnumToken.BadUrlTokenType ||
        type == EnumToken.BadStringTokenType
    );
}
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
            if (typeof value == "function") {
                key = value.name;
            } else if (value != null && typeof value == "object") {
                // array of visitor maps: flatten. this used to depend on the array index being an EnumToken value
                for (const val of Object.entries(value)) {
                    visitors.push(val);
                }

                continue;
            }
        }

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

    options.validation = !!options.validation;

    if (options.module) {
        options.expandNestingRules = true;
    }

    if (options.expandNestingRules) {
        options.nestingRules = false;
    }

    options.minifyAST ??= options.minify;

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
    // first error / invalid node of the current statement
    let errorStart: number = errors.length;
    let invalidStart: number = 0;
    // tokens allocated for the current statement (parseNode() may remove tokens from the statement array)
    const statement: Token[] = [];

    // nested parses share the arena of the parent
    const arena: AstArena = options.arena ?? (options.arena = new AstArena(arenaCapacity(tokenizer)));
    let ast: AstStyleSheet = arena.current == 1 ? arena.root : arena.createStyleSheet();

    let tokens: Token[] = [];
    let context: AstNode = ast;

    let item: Token;
    let node: AstNode | null;

    // @ts-ignore ignore error
    let parensMatch: number = 0;
    let curlyBracketMatch: number = 0;

    // tokens are located in the tokenizer source (the imported file when parsing an @import)
    arena.setLocation(ast, tokenizer.sourceId, 0, 0);

    const sourceIndex: number = arena.sourceIndex(tokenizer.sourceId);
    const dataTypes: Uint8Array = arena.dataTypes;
    let itemType: EnumToken;

    // inlined: tokenizer.done()
    while (!(tokenizer.typ === EnumToken.EOF)) {
        tokenizer.next();

        item = allocateToken(arena, tokenizer, sourceIndex);
        itemType = tokenizer.typ as EnumToken;

        stats.bytesIn = tokenizer.bytesIn as number;
        stats.tokensCount++;

        if (isBadToken(itemType)) {
            tokens.push(item);
            statement.push(item);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item,
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(item))
                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(item))],
            });

            // bad token
            continue;
        }

        if (itemType === EnumToken.StartParensTokenType || tokensfuncDefMap.has(itemType)) {
            parensMatch++;
        } else if (itemType === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }

        if (itemType === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        } else if (itemType === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }

        tokens.push(item);
        statement.push(item);

        if (
            parensMatch === 0 &&
            (itemType === EnumToken.SemiColonTokenType ||
                itemType === EnumToken.BlockStartTokenType ||
                itemType === EnumToken.EOFTokenType)
        ) {
            node = parseNode(arena, tokens, context, options as ParserOptions, errors, stats, invalidNodes, parensMatch);

            if (node != null) {
                if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                    stack.push(node);
                    context = node;
                }
            } else if (itemType == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;

                tokens.length = 0;
                tokens.push(item);

                do {
                    tokenizer.next();

                    item = allocateToken(arena, tokenizer, sourceIndex);
                    itemType = tokenizer.typ as EnumToken;

                    tokens.push(item);
                    statement.push(item);

                    if (itemType === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    } else if (itemType === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                // inlined: tokenizer.done()
                } while (inBlock != 0 && !((tokenizer.typ as EnumToken | null) === EnumToken.EOF));

                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[0]))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[0]))],
                    });
                }
            }

            recycleStatementTokens(arena, statement, errors, errorStart, invalidNodes, invalidStart);
            statement.length = 0;
            tokens.length = 0;
            errorStart = errors.length;
            invalidStart = invalidNodes.length;
        } else if ((parensMatch === 0 || curlyBracketMatch === 0) && itemType === EnumToken.BlockEndTokenType) {
            parseNode(arena, tokens, context, options as ParserOptions, errors, stats, invalidNodes, parensMatch);

            // inlined: arena.setSpanEnd(context, arena.getSpanEnd(item))
            arena.setSpan(context, arena.getSourceId(context), arena.getSpanStart(context), arena.getSpanEnd(item));

            const previousNode: AstNode | undefined = stack.pop();
            context = stack[stack.length - 1] ?? ast;

            if (
                options.removeEmpty &&
                previousNode != null &&
                arena.firstChild[previousNode] == 0 &&
                arena.lastChild[context] == previousNode
            ) {
                arena.detach(previousNode);
            }

            recycleStatementTokens(arena, statement, errors, errorStart, invalidNodes, invalidStart);
            statement.length = 0;
            tokens.length = 0;
            errorStart = errors.length;
            invalidStart = invalidNodes.length;
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
    }

    if (tokens.length > 0) {
        node = parseNode(arena, tokens, context, options as ParserOptions, errors, stats, invalidNodes, parensMatch);

        if (node != null) {
            if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                stack.push(node);
                context = node;
            }
        }
    }

    const endParseTime: number = performance.now();

    if (options.expandNestingRules) {
        ast = arena.expand(ast) as AstStyleSheet;
    }

    let replacement: GenericVisitorResult<T>;

    if (options.visitor != null) {
        const handlers = [] as Array<GenericVisitorHandler<T>>;
        const visitors = parseVisitors(options.visitor, errors);

        let genericKey: string | null;
        let nodes: AstNode[] | null = [ast];
        let node: AstNode;
        let nodeType: EnumToken;

        // push the children of a node or the sub tokens of a value token onto the stack
        const enqueue = (node: AstNode): void => {
            if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                for (let child = arena.lastChild[node]; child != 0; child = arena.previousSibling[child]) {
                    nodes!.push(child);
                }
            }

            if (
                visitors.includeTokens &&
                arena.dataTypes[node] != EnumToken.RuleNodeType &&
                arena.dataTypes[node] != EnumToken.KeyframesRuleNodeType
            ) {
                // at-rule prelude, declaration values or token children. selector tokens are not visited
                const values: Token[] = arena.subTokens(node);

                for (let i = values.length - 1; i >= 0; i--) {
                    nodes!.push(values[i]);
                }
            }
        };

        while (nodes.length > 0) {
            node = nodes.pop() as AstNode;
            nodeType = arena.dataTypes[node];
            replacement = null;
            handlers.length = 0;

            if (visitors.preAllVisitorsHandlers?.size! > 0) {
                handlers.push(...(visitors.preAllVisitorsHandlers! as Set<GenericVisitorHandler<T>>));
            }

            genericKey =
                nodeType == EnumToken.DeclarationNodeType
                    ? "Declaration"
                    : nodeType == EnumToken.AtRuleNodeType
                      ? "AtRule"
                      : nodeType == EnumToken.KeyframesAtRuleNodeType
                        ? "KeyframesAtRule"
                        : nodeType === EnumToken.KeyframesRuleNodeType
                          ? "KeyframesRule"
                          : nodeType == EnumToken.RuleNodeType
                            ? "Rule"
                            : null;
            let keyName: string | null =
                nodeType == EnumToken.DeclarationNodeType || nodeType == EnumToken.AtRuleNodeType
                    ? camelize(arena.strings[arena.name[node]])
                    : nodeType == EnumToken.KeyframesAtRuleNodeType
                      ? camelize(arena.strings[arena.stringValue[node]])
                      : null;

            if (visitors.allVisitorsHandlers?.size! > 0) {
                handlers.push(...(visitors.allVisitorsHandlers! as Set<GenericVisitorHandler<T>>));
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

                if (map!.has(nodeType)) {
                    // @ts-ignore
                    for (const handler of map!.get(nodeType)!) {
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
                handlers.push(...(visitors.postAllVisitorsHandlers! as Set<GenericVisitorHandler<T>>));
            }

            if (handlers.length > 0) {
                for (const callable of handlers) {
                    // the parent, the root, ... are read from the arena
                    replacement = (callable as GenericVisitorHandler<T>)(arena, node as T) as GenericVisitorResult<T>;

                    if (replacement == null) {
                        continue;
                    }
                    if (replacement == node) {
                        continue;
                    }

                    //
                    if (Array.isArray(replacement)) {
                        break;
                    }
                }

                // @ts-ignore
                if (replacement != null && node != replacement) {
                    // nodes and tokens are replaced by ids allocated in the arena. the object views of the arena are
                    // not copied, plain objects are imported
                    replacement = visitorResult(arena, replacement as GenericVisitorResult<T>) as GenericVisitorResult<T>;

                    if (replacement == node) {
                        // the object view of the node
                    } else if (replacement != null) {
                        if (arena.flags[node] & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) {
                            arena.replaceChild(node, ...(Array.isArray(replacement) ? replacement as AstNode[] : [replacement as AstNode]));
                        } else {
                            arena.replaceToken(node, ...(Array.isArray(replacement) ? replacement as Token[] : [replacement as Token]));
                        }
                    } else {
                        errors.push({
                            action: "ignore",
                            message: "doParse: visitor must return node ids, objects or arrays of node ids and objects",
                            node,
                        });
                    }
                }
            }

            // visit the children of the node or of its replacement
            if (replacement == null || replacement == node) {
                enqueue(node);
            } else if (Array.isArray(replacement)) {
                for (let i = replacement.length - 1; i >= 0; i--) {
                    enqueue(replacement[i] as AstNode);
                }
            } else {
                enqueue(replacement as AstNode);
            }
        }

        nodes = null;
    }

    if (invalidNodes.length > 0) {
        for (const node of invalidNodes) {
            if (options.lenient && arena.flags[node] & EnumAstNodeStatus.Unknown) {
                continue;
            }

            if (
                arena.flags[node] &
                (EnumAstNodeStatus.Invalid |
                    EnumAstNodeStatus.Unknown |
                    EnumAstNodeStatus.Unparsed |
                    EnumAstNodeStatus.Malformed |
                    EnumAstNodeStatus.Disallowed)
            ) {
                arena.detach(node);
            }
        }
    }

    if (options.minifyAST) {
        if (arena.firstChild[ast] != 0) {
            let passes: number = options.pass ?? (1 as number);

            while (passes--) {
                minify(arena, ast, options, true, errors, false);
            }
        }
    }

    stats.bytesIn += stats.importedBytesIn;

    let endTime: number = performance.now();
    const result = {
        ast,
        arena,
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
            generateScopedName: generateSyncScopedName,
            ...(typeof options.module != "object" ? {} : options.module),
        } as ModuleSyncOptions;

        const parseModuleTime: number = performance.now();
        const namesMapping: Record<string, string> = {};
        const global = new Set<Token>();
        const processed = new Set<Token>();
        const pattern: string | null = typeof options.module == "boolean" ? null : (moduleSettings.pattern as string);
        const importMapping: Record<string, Record<string, string>> = {} as Record<string, Record<string, string>>;
        const cssVariablesMap: Record<string, Record<string, AstArenaNode>> = {};
        const importedCssVariables: Record<string, AstArenaNode> = {};
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

        // inlined: arena.walk(ast)
        for (const node of new NodeWalker(arena, ast)) {
            const parent: AstNode = arena.parents[node];
            const nodeType: EnumToken = arena.dataTypes[node as AstNode];

            if (nodeType == EnumToken.CssVariableImportTokenType) {
                throw new Error(
                    "css variable import not supported by parseSync() or transformSync(). use parse() or transform() instead.\nat " +
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(node as AstNode))
                        [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(node as AstNode))].join(":"),
                );
            }

            // @ts-ignore
            if (nodeType == EnumToken.CssVariableDeclarationMapTokenType) {
                // @ts-ignore
                const fromToken: Token = arena
                    .fieldTokens(node as AstNode, TokenField.L)
                    .find((t) => arena.dataTypes[t] == EnumToken.IdenTokenType || isIdentColor(arena, t)) as Token;
                const from: { val: string } = { val: arena.strings[arena.stringValue[fromToken]] };

                if (!(from.val in cssVariablesMap)) {
                    errors.push({
                        node,
                        message: `could not resolve @value import from '${from.val}'`,
                        action: "drop",
                    });
                } else {
                    // @ts-ignore
                    for (const token of arena.tokens(node as AstNode)) {
                        if (arena.dataTypes[token] == EnumToken.IdenTokenType || isIdentColor(arena, token)) {
                            if (!(arena.strings[arena.stringValue[token]] in cssVariablesMap[from.val])) {
                                errors.push({
                                    node,
                                    message: `value '${arena.strings[arena.stringValue[token]]}' is not exported from '${from.val}'`,
                                    action: "drop",
                                });

                                continue;
                            }

                            result.cssModuleVariables ??= {};
                            result.cssModuleVariables[arena.strings[arena.stringValue[token]]] = importedCssVariables[
                                arena.strings[arena.stringValue[token]]
                            ] = cssVariablesMap[from.val][arena.strings[arena.stringValue[token]]];
                        }
                    }
                }

                arena.detach(node as AstNode);
                continue;
            }

            if (nodeType == EnumToken.CssVariableTokenType) {
                if (parent != null && arena.dataTypes[parent as AstNode] == EnumToken.StyleSheetNodeType) {
                    if (result.cssModuleVariables == null) {
                        result.cssModuleVariables = {} as Record<string, AstArenaNode>;
                    }

                    // inlined: cssVariableToken(arena, node as AstNode): the object view of the css variable node
                    // inlined: arena.toObject(node as AstNode)
                    result.cssModuleVariables[arena.strings[arena.name[node as AstNode]]] = new AstArenaNode(arena, node as AstNode);
                }
                arena.detach(node as AstNode);
                continue;
            }

            if (nodeType == EnumToken.DeclarationNodeType) {
                if (arena.strings[arena.name[node as AstNode]].startsWith("--")) {
                    if (!(arena.strings[arena.name[node as AstNode]] in namesMapping)) {
                        let value: string =
                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                ? arena.strings[arena.name[node as AstNode]]
                                : moduleSettings.generateScopedName!(
                                      arena.strings[arena.name[node as AstNode]],
                                      moduleSettings.filePath as string,
                                      moduleSettings.pattern as string,
                                      moduleSettings.hashLength,
                                  );

                        mapping[arena.strings[arena.name[node as AstNode]]] =
                            "--" +
                            (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                            moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                : value);
                        revMapping[arena.strings[arena.name[node as AstNode]]] =
                            arena.strings[arena.name[node as AstNode]];
                    }

                    // inlined: arena.setNameString(node as AstNode, mapping[arena.strings[arena.name[node as AstNode]]])
                    arena.name[(node as AstNode)] = arena.internString(mapping[arena.strings[arena.name[node as AstNode]]]);
                }

                if (equalsIgnoreCase("composes", arena.strings[arena.name[node as AstNode]])) {
                    const composeSelectors = [] as Token[];
                    // let isValid: boolean = true;

                    for (let token = arena.firstToken[node as AstNode]; token != 0; token = arena.nextSibling[token]) {
                        if (arena.dataTypes[token] == EnumToken.ComposesSelectorNodeType) {
                            composeSelectors.push(token);
                        }
                    }

                    // find parent rule
                    let parentRule: AstNode = (parent as AstNode) ?? 0;

                    while (parentRule != 0 && arena.dataTypes[parentRule] != EnumToken.RuleNodeType) {
                        parentRule = arena.parents[parentRule];
                    }

                    if (/* !isValid || */ composeSelectors.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });

                        arena.detach(node as AstNode);
                        continue;
                    }

                    for (const token of composeSelectors) {
                        // composes: a b c;
                        if (!arena.hasField(token, TokenField.R)) {
                            for (const rule of arena.fieldTokens(token, TokenField.L)) {
                                if (
                                    arena.dataTypes[rule] == EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[rule] == EnumToken.CommentTokenType
                                ) {
                                    continue;
                                }

                                if (!(arena.strings[arena.stringValue[rule]] in mapping)) {
                                    let value: string =
                                        moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                            ? arena.strings[arena.stringValue[rule]]
                                            : moduleSettings.generateScopedName!(
                                                  arena.strings[arena.stringValue[rule]],
                                                  moduleSettings.filePath as string,
                                                  moduleSettings.pattern as string,
                                                  moduleSettings.hashLength,
                                              );

                                    mapping[arena.strings[arena.stringValue[rule]]] =
                                        (arena.dataTypes[rule] == EnumToken.DashedIdenTokenType ? "--" : "") +
                                        (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                            ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                            : value);
                                    revMapping[mapping[arena.strings[arena.stringValue[rule]]]] =
                                        arena.strings[arena.stringValue[rule]];
                                }

                                if (parentRule != 0) {
                                    for (const tk of arena.tokens(parentRule)) {
                                        if (arena.dataTypes[tk] == EnumToken.ClassSelectorTokenType) {
                                            const val: string = arena.strings[arena.stringValue[tk]].slice(1);

                                            if (val in revMapping) {
                                                const key = revMapping[val] as string;
                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        mapping[arena.strings[arena.stringValue[rule]]],
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // composes: a b c from 'file.css';
                        else if (arena.dataTypes[arena.field(token, TokenField.R)] == EnumToken.StringTokenType) {
                            throw new Error(
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(node as AstNode))
                                `composes from file is not supported using parseSync() or transformSync(). Use parse() or transform() instead.\nat ${[options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(node as AstNode))].join(":")}`,
                            );
                        }

                        // composes: a b c from global;
                        else if (arena.dataTypes[arena.field(token, TokenField.R)] == EnumToken.IdenTokenType) {
                            // global
                            if (parentRule != 0) {
                                if (equalsIgnoreCase("global", arena.strings[arena.stringValue[arena.field(token, TokenField.R)]])) {
                                    for (const tk of arena.tokens(parentRule)) {
                                        if (arena.dataTypes[tk] == EnumToken.ClassSelectorTokenType) {
                                            const val: string = arena.strings[arena.stringValue[tk]].slice(1);

                                            if (val in revMapping) {
                                                const key = revMapping[val] as string;
                                                const composedNames: string[] = [];

                                                for (const curr of arena.fieldTokens(token, TokenField.L)) {
                                                    if (arena.dataTypes[curr] == EnumToken.IdenTokenType) {
                                                        composedNames.push(arena.strings[arena.stringValue[curr]]);
                                                    }
                                                }

                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        ...composedNames,
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                } else {
                                    errors.push({
                                        action: "drop",
                                        message: `composes '${arena.strings[arena.stringValue[arena.field(token, TokenField.R)]]}' is not supported`,
                                        node,
                                    });
                                }
                            }
                        }
                    }

                    arena.detach(node as AstNode);
                }

                if (
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
                    ].includes(arena.strings[arena.name[node as AstNode]])
                ) {
                    // inlined: arena.walkValues(node as AstNode)
                    for (const value of new ValueWalker(arena, node as AstNode)) {
                        if (arena.dataTypes[value] != EnumToken.IdenTokenType) {
                            continue;
                        }

                        let idenToken = arena.strings[arena.stringValue[value]];
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

                        // inlined: arena.setStr(value, mapping[idenToken])
                        arena.stringValue[value] = arena.internString(mapping[idenToken]);
                    }
                } else if (
                    arena.strings[arena.name[node as AstNode]] == "grid-template-areas" ||
                    arena.strings[arena.name[node as AstNode]] == "grid-template"
                ) {
                    for (let token = arena.firstToken[node as AstNode]; token != 0; token = arena.nextSibling[token]) {
                        if (arena.dataTypes[token] == EnumToken.StringTokenType) {
                            const str: string = arena.strings[arena.stringValue[token]];
                            const tokens = parseString(arena, str.slice(1, -1));

                            // inlined: arena.walkValues(tokens)
                            for (const value of new ValueWalker(arena, tokens)) {
                                if (
                                    arena.dataTypes[value] == EnumToken.IdenTokenType ||
                                    arena.dataTypes[value] == EnumToken.DashedIdenTokenType
                                ) {
                                    if (arena.strings[arena.stringValue[value]] in mapping) {
                                        // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                                        arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                                    } else {
                                        let result =
                                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                                ? arena.strings[arena.stringValue[value]]
                                                : moduleSettings.generateScopedName!(
                                                      arena.strings[arena.stringValue[value]],
                                                      moduleSettings.filePath as string,
                                                      moduleSettings.pattern as string,
                                                      moduleSettings.hashLength,
                                                  );

                                        mapping[arena.strings[arena.stringValue[value]]] = result;
                                        revMapping[result] = arena.strings[arena.stringValue[value]];
                                        // inlined: arena.setStr(value, result)
                                        arena.stringValue[value] = arena.internString(result);
                                    }
                                }
                            }

                            // inlined: arena.setStr(token, str.charAt(0) + renderTokens(arena, tokens) + str.charAt(str.length - 1))
                            arena.stringValue[token] = arena.internString((str.charAt(0) + renderTokens(arena, tokens) + str.charAt(str.length - 1)));
                        }
                    }
                } else if (
                    arena.strings[arena.name[node as AstNode]] == "animation" ||
                    arena.strings[arena.name[node as AstNode]] == "animation-name"
                ) {
                    // inlined: arena.walkValues(node as AstNode)
                    for (const value of new ValueWalker(arena, node as AstNode)) {
                        if (
                            arena.dataTypes[value] == EnumToken.IdenTokenType &&
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
                            ].includes(arena.strings[arena.stringValue[value]])
                        ) {
                            if (!(arena.strings[arena.stringValue[value]] in mapping)) {
                                mapping[arena.strings[arena.stringValue[value]]] =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? arena.strings[arena.stringValue[value]]
                                        : moduleSettings.generateScopedName!(
                                              arena.strings[arena.stringValue[value]],
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                revMapping[mapping[arena.strings[arena.stringValue[value]]]] = arena.strings[arena.stringValue[value]];
                            }

                            // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                            arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                        }
                    }
                }

                // inlined: arena.walkValues(node as AstNode)
                for (const value of new ValueWalker(arena, node as AstNode)) {
                    if (arena.dataTypes[value] == EnumToken.DashedIdenTokenType) {
                        // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                        arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                    } else if (
                        (arena.dataTypes[value] == EnumToken.IdenTokenType || isIdentColor(arena, value)) &&
                        arena.strings[arena.stringValue[value]] in importedCssVariables
                    ) {
                        arena.replaceToken(
                            value,
                            ...arena.tokens(importedCssVariables[arena.strings[arena.stringValue[value]]][ARENAID]).map(
                                (token: Token) => arena.clone(token, true),
                            ),
                        );
                    }
                }
            } else if (nodeType == EnumToken.RuleNodeType) {
                // if (node[TOKENS] == null) {
                const tokens = parseString(arena, arena.strings[arena.name[node as AstNode]]);
                matchSelectorSyntax(arena, tokens, [] as ErrorDescription[], options);

                arena.setTokenList(node as AstNode, trimArray(arena, tokens));

                let hasIdOrClass: boolean = false;

                // inlined: arena.walkValues(node as AstNode, filter)
                for (const value of new ValueWalker(arena, node as AstNode,
                    (arena: AstArena, value: Token): Token[] | null => {
                        if (
                            arena.dataTypes[value] == EnumToken.PseudoClassTokenType ||
                            arena.dataTypes[value] == EnumToken.PseudoElementTokenType
                        ) {
                            const val: string = arena.strings[arena.stringValue[value]].toLowerCase();
                            switch (val) {
                                case ":local":
                                case ":global":
                                    {
                                        // remove the pseudo class and the following whitespace
                                        const next: Token = arena.nextSibling[value];

                                        arena.detach(value);

                                        if (
                                            next != 0 &&
                                            (arena.dataTypes[next] == EnumToken.WhitespaceTokenType ||
                                                arena.dataTypes[next] == EnumToken.DescendantCombinatorTokenType)
                                        ) {
                                            arena.detach(next);
                                        }
                                    }

                                    break;
                            }
                        } else if (arena.dataTypes[value] == EnumToken.PseudoClassFuncTokenType) {
                            switch (arena.strings[arena.stringValue[value]].toLowerCase()) {
                                case ":global":
                                    for (const token of arena.tokens(value)) {
                                        global.add(token);
                                    }

                                case ":local": {
                                    // replace the function by its arguments. the arguments are visited
                                    const children: Token[] = arena.tokens(value);

                                    arena.replaceToken(value, ...children);
                                    return children;
                                }
                            }
                        }

                        return null;
                    },
                )) {
                    if (arena.dataTypes[value] == EnumToken.HashTokenType || arena.dataTypes[value] == EnumToken.ClassSelectorTokenType) {
                        hasIdOrClass = true;
                    }

                    if (processed.has(value)) {
                        continue;
                    }

                    processed.add(value);

                    if (arena.dataTypes[value] == EnumToken.PseudoClassTokenType || arena.dataTypes[value] == EnumToken.PseudoElementTokenType) {
                    } else if (arena.dataTypes[value] == EnumToken.PseudoClassFuncTokenType) {
                    } else {
                        if (global.has(value)) {
                            continue;
                        }

                        if (arena.dataTypes[value] == EnumToken.ClassSelectorTokenType) {
                            const val: string = arena.strings[arena.stringValue[value]].slice(1);

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

                            // inlined: arena.setStr(value, "." + mapping[val])
                            arena.stringValue[value] = arena.internString(("." + mapping[val]));
                        }
                    }
                }

                if (moduleSettings.scoped! & ModuleScopeEnumOptions.Pure) {
                    if (!hasIdOrClass) {
                        throw new Error(
                            // inlined: options.source!.getOffsets(arena.getSpanStart(node as AstNode))
                            `pure module: No id or class found in selector '${arena.strings[arena.name[node as AstNode]]}' at '${options.source!.lineStarts.getOffsets(arena.getSpanStart(node as AstNode)).join(":")}'`,
                        );
                    }
                }

                // inlined: arena.setSelector(node as AstNode, arena.tokens(node as AstNode).reduce((acc: string, token: Token) => acc + renderValue(arena, token), ""))
                arena.name[(node as AstNode)] = arena.internString(arena.tokens(node as AstNode).reduce((acc: string, token: Token) => acc + renderValue(arena, token), ""));
            } else if (nodeType == EnumToken.AtRuleNodeType || nodeType == EnumToken.KeyframesAtRuleNodeType) {
                const val: string = arena.strings[arena.name[node as AstNode]].toLowerCase();

                if (arena.firstToken[node as AstNode] == 0) {
                    // inlined: arena.setTokens(node as AstNode, ...parseString(arena, arena.strings[arena.stringValue[node as AstNode]]))
                    arena.setTokenList((node as AstNode), parseString(arena, arena.strings[arena.stringValue[node as AstNode]]));
                }

                if (val == "property" || val == "keyframes") {
                    const prefix: string = val == "property" ? "--" : "";

                    for (const value of arena.tokens(node as AstNode)) {
                        if (
                            (prefix == "--" && arena.dataTypes[value] == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && arena.dataTypes[value] == EnumToken.IdenTokenType)
                        ) {
                            if (!(arena.strings[arena.stringValue[value]] in mapping)) {
                                let val: string =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? arena.strings[arena.stringValue[value]]
                                        : moduleSettings.generateScopedName!(
                                              arena.strings[arena.stringValue[value]],
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );

                                mapping[arena.strings[arena.stringValue[value]]] =
                                    prefix +
                                    (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                    moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                        ? getKeyName(val, moduleSettings.naming as ModuleCaseTransformEnum)
                                        : val);
                                revMapping[mapping[arena.strings[arena.stringValue[value]]]] = arena.strings[arena.stringValue[value]];
                            }

                            // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                            arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                        }
                    }

                    // inlined: arena.setValueString(node as AstNode, renderTokens(arena, arena.tokens(node as AstNode)))
                    arena.stringValue[(node as AstNode)] = arena.internString(renderTokens(arena, arena.tokens(node as AstNode)));
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

    options.validation = !!options.validation;

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
    // first error / invalid node of the current statement
    let errorStart: number = errors.length;
    let invalidStart: number = 0;
    // tokens allocated for the current statement (parseNode() may remove tokens from the statement array)
    const statement: Token[] = [];

    let tokenizer: Tokenizer = iter instanceof Promise ? await iter : iter;

    // nested parses share the arena of the parent
    const arena: AstArena = options.arena ?? (options.arena = new AstArena(arenaCapacity(tokenizer)));
    let ast: AstStyleSheet = arena.current == 1 ? arena.root : arena.createStyleSheet();

    let tokens: Token[] = [];
    let context: AstNode = ast;

    const imports: AstAtRule[] = [];

    let item: Token;
    let node: AstNode | null;

    // @ts-ignore ignore error
    let parensMatch: number = 0;
    let curlyBracketMatch: number = 0;

    // tokens are located in the tokenizer source (the imported file when parsing an @import)
    arena.setLocation(ast, tokenizer.sourceId, 0, 0);

    const sourceIndex: number = arena.sourceIndex(tokenizer.sourceId);
    const dataTypes: Uint8Array = arena.dataTypes;
    let itemType: EnumToken;

    // inlined: tokenizer.done()
    while (!(tokenizer.typ === EnumToken.EOF)) {
        tokenizer.next();

        item = allocateToken(arena, tokenizer, sourceIndex);
        itemType = tokenizer.typ as EnumToken;

        stats.bytesIn = tokenizer.bytesIn as number;
        stats.tokensCount++;

        if (isBadToken(itemType)) {
            tokens.push(item);
            statement.push(item);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item,
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(item))
                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(item))],
            });

            // bad token
            continue;
        }

        if (itemType === EnumToken.StartParensTokenType || tokensfuncDefMap.has(itemType)) {
            parensMatch++;
        } else if (itemType === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }

        if (itemType === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        } else if (itemType === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }

        tokens.push(item);
        statement.push(item);

        if (
            parensMatch === 0 &&
            (itemType === EnumToken.SemiColonTokenType ||
                itemType === EnumToken.BlockStartTokenType ||
                itemType === EnumToken.EOFTokenType)
        ) {
            node = parseNode(arena, tokens, context, options as ParserOptions, errors, stats, invalidNodes, parensMatch);

            if (node != null) {
                if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                    stack.push(node);
                    context = node;
                } else if (
                    arena.dataTypes[node] == EnumToken.AtRuleNodeType &&
                    arena.strings[arena.name[node]] === "import"
                ) {
                    imports.push(node);
                }
            } else if (itemType == EnumToken.BlockStartTokenType) {
                let inBlock: number = 1;
                tokens.length = 0;
                tokens.push(item);

                do {
                    tokenizer.next();

                    item = allocateToken(arena, tokenizer, sourceIndex);
                    itemType = tokenizer.typ as EnumToken;

                    tokens.push(item);
                    statement.push(item);

                    if (itemType === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    } else if (itemType === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                // inlined: tokenizer.done()
                } while (inBlock != 0 && !((tokenizer.typ as EnumToken | null) === EnumToken.EOF));

                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[0]))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[0]))],
                    });
                }
            }

            recycleStatementTokens(arena, statement, errors, errorStart, invalidNodes, invalidStart);
            statement.length = 0;
            tokens.length = 0;
            errorStart = errors.length;
            invalidStart = invalidNodes.length;
        } else if ((parensMatch === 0 || curlyBracketMatch === 0) && itemType === EnumToken.BlockEndTokenType) {
            parseNode(arena, tokens, context, options as ParserOptions, errors, stats, invalidNodes, parensMatch);

            // inlined: arena.setSpanEnd(context, arena.getSpanEnd(item))
            arena.setSpan(context, arena.getSourceId(context), arena.getSpanStart(context), arena.getSpanEnd(item));

            const previousNode: AstNode | undefined = stack.pop();
            context = stack[stack.length - 1] ?? ast;

            if (
                options.removeEmpty &&
                previousNode != null &&
                arena.firstChild[previousNode] == 0 &&
                arena.lastChild[context] == previousNode
            ) {
                arena.detach(previousNode);
            }

            recycleStatementTokens(arena, statement, errors, errorStart, invalidNodes, invalidStart);
            statement.length = 0;
            tokens.length = 0;
            errorStart = errors.length;
            invalidStart = invalidNodes.length;
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
        // }
    }

    if (tokens.length > 0) {
        node = parseNode(arena, tokens, context, options as ParserOptions, errors, stats, invalidNodes, parensMatch);

        if (node != null) {
            if (
                arena.dataTypes[node] == EnumToken.AtRuleNodeType &&
                "import" === arena.strings[arena.stringValue[node]]
            ) {
                imports.push(node);
            }

            if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                stack.push(node);
                context = node;
            }
        }
    }

    if (imports.length > 0 && options.resolveImport) {
        await Promise.all(
            imports.map(async (node: AstAtRule) => {
                if ((arena.flags[node] & EnumAstNodeStatus.StateMask) !== EnumAstNodeStatus.Validated) {
                    return;
                }

                const token: Token = arena.firstToken[node];
                const url: string =
                    arena.dataTypes[token] == EnumToken.StringTokenType
                        ? arena.strings[arena.stringValue[token]].slice(1, -1)
                        : arena.strings[arena.stringValue[token]];

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
                    // the imported stylesheet is allocated in the same arena: its children replace the @import rule
                    if (arena.parents[node] != 0) {
                        arena.moveChildren(root.ast, arena.parents[node], node);
                        arena.detach(node);
                    }

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
        ast = arena.expand(ast) as AstStyleSheet;
    }

    let replacement: GenericVisitorResult<T>;

    if (options.visitor != null) {
        const handlers = [] as Array<GenericVisitorHandler<T>>;
        const visitors = parseVisitors(options.visitor, errors);

        let genericKey: string | null;
        let nodes: AstNode[] | null = [ast];
        let node: AstNode;
        let nodeType: EnumToken;

        // push the children of a node or the sub tokens of a value token onto the stack
        const enqueue = (node: AstNode): void => {
            if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                for (let child = arena.lastChild[node]; child != 0; child = arena.previousSibling[child]) {
                    nodes!.push(child);
                }
            }

            if (
                visitors.includeTokens &&
                arena.dataTypes[node] != EnumToken.RuleNodeType &&
                arena.dataTypes[node] != EnumToken.KeyframesRuleNodeType
            ) {
                // at-rule prelude, declaration values or token children. selector tokens are not visited
                const values: Token[] = arena.subTokens(node);

                for (let i = values.length - 1; i >= 0; i--) {
                    nodes!.push(values[i]);
                }
            }
        };

        while (nodes.length > 0) {
            node = nodes.pop() as AstNode;
            nodeType = arena.dataTypes[node];
            replacement = null;
            handlers.length = 0;

            if (visitors.preAllVisitorsHandlers?.size! > 0) {
                handlers.push(...(visitors.preAllVisitorsHandlers! as Set<GenericVisitorHandler<T>>));
            }

            genericKey =
                nodeType == EnumToken.DeclarationNodeType
                    ? "Declaration"
                    : nodeType == EnumToken.AtRuleNodeType
                      ? "AtRule"
                      : nodeType == EnumToken.KeyframesAtRuleNodeType
                        ? "KeyframesAtRule"
                        : nodeType === EnumToken.KeyframesRuleNodeType
                          ? "KeyframesRule"
                          : nodeType == EnumToken.RuleNodeType
                            ? "Rule"
                            : null;
            let keyName: string | null =
                nodeType == EnumToken.DeclarationNodeType || nodeType == EnumToken.AtRuleNodeType
                    ? camelize(arena.strings[arena.name[node]])
                    : nodeType == EnumToken.KeyframesAtRuleNodeType
                      ? camelize(arena.strings[arena.stringValue[node]])
                      : null;

            if (visitors.allVisitorsHandlers?.size! > 0) {
                handlers.push(...(visitors.allVisitorsHandlers! as Set<GenericVisitorHandler<T>>));
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

                if (map!.has(nodeType)) {
                    // @ts-ignore
                    for (const handler of map!.get(nodeType)!) {
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
                handlers.push(...(visitors.postAllVisitorsHandlers! as Set<GenericVisitorHandler<T>>));
            }

            if (handlers.length > 0) {
                for (const callable of handlers) {
                    // the parent, the root, ... are read from the arena
                    replacement = (callable as GenericVisitorHandler<T>)(arena, node as T) as GenericVisitorResult<T>;

                    if (replacement == null) {
                        continue;
                    }

                    if (replacement instanceof Promise) {
                        replacement = await replacement;
                    }

                    if (replacement == node) {
                        continue;
                    }

                    //
                    if (Array.isArray(replacement)) {
                        break;
                    }
                }

                // @ts-ignore
                if (replacement != null && node != replacement) {
                    // nodes and tokens are replaced by ids allocated in the arena. the object views of the arena are
                    // not copied, plain objects are imported
                    replacement = visitorResult(arena, replacement as GenericVisitorResult<T>) as GenericVisitorResult<T>;

                    if (replacement == node) {
                        // the object view of the node
                    } else if (replacement != null) {
                        if (arena.flags[node] & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) {
                            arena.replaceChild(node, ...(Array.isArray(replacement) ? replacement as AstNode[] : [replacement as AstNode]));
                        } else {
                            arena.replaceToken(node, ...(Array.isArray(replacement) ? replacement as Token[] : [replacement as Token]));
                        }
                    } else {
                        errors.push({
                            action: "ignore",
                            message: "doParse: visitor must return node ids, objects or arrays of node ids and objects",
                            node,
                        });
                    }
                }
            }

            // visit the children of the node or of its replacement
            if (replacement == null || replacement == node) {
                enqueue(node);
            } else if (Array.isArray(replacement)) {
                for (let i = replacement.length - 1; i >= 0; i--) {
                    enqueue(replacement[i] as AstNode);
                }
            } else {
                enqueue(replacement as AstNode);
            }
        }

        nodes = null;
    }

    if (invalidNodes.length > 0) {
        for (const node of invalidNodes) {
            if (options.lenient && arena.flags[node] & EnumAstNodeStatus.Unknown) {
                continue;
            }

            if (
                arena.flags[node] &
                (EnumAstNodeStatus.Invalid |
                    EnumAstNodeStatus.Unknown |
                    EnumAstNodeStatus.Unparsed |
                    EnumAstNodeStatus.Malformed |
                    EnumAstNodeStatus.Disallowed)
            ) {
                arena.detach(node);
            }
        }
    }

    if (options.minifyAST) {
        if (arena.firstChild[ast] != 0) {
            let passes: number = options.pass ?? (1 as number);

            while (passes--) {
                minify(arena, ast, options, true, errors, false);
            }
        }
    }

    stats.bytesIn += stats.importedBytesIn;

    let endTime: number = performance.now();
    const result = {
        ast,
        arena,
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
        const cssVariablesMap: Record<string, Record<string, AstArenaNode>> = {};
        const importedCssVariables: Record<string, AstArenaNode> = {};
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

        // inlined: arena.walk(ast)
        for (const node of new NodeWalker(arena, ast)) {
            const parent: AstNode = arena.parents[node];
            const nodeType: EnumToken = arena.dataTypes[node as AstNode];

            if (nodeType == EnumToken.CssVariableImportTokenType) {
                const url: string = arena.strings[
                    arena.stringValue[
                        arena.findToken(node as AstNode, (arena: AstArena, t: Token) => arena.dataTypes[t] == EnumToken.StringTokenType) as Token
                    ]
                ].slice(1, -1);
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

                cssVariablesMap[arena.strings[arena.name[node as AstNode]]] = root.cssModuleVariables!;
                arena.detach(node as AstNode);
                continue;
            }

            // @ts-ignore
            if (nodeType == EnumToken.CssVariableDeclarationMapTokenType) {
                // @ts-ignore
                const fromToken: Token = arena
                    .fieldTokens(node as AstNode, TokenField.L)
                    .find((t) => arena.dataTypes[t] == EnumToken.IdenTokenType || isIdentColor(arena, t)) as Token;
                const from: { val: string } = { val: arena.strings[arena.stringValue[fromToken]] };

                if (!(from.val in cssVariablesMap)) {
                    errors.push({
                        node,
                        message: `could not resolve @value import from '${from.val}'`,
                        action: "drop",
                    });
                } else {
                    // @ts-ignore
                    for (const token of arena.tokens(node as AstNode)) {
                        if (arena.dataTypes[token] == EnumToken.IdenTokenType || isIdentColor(arena, token)) {
                            if (!(arena.strings[arena.stringValue[token]] in cssVariablesMap[from.val])) {
                                errors.push({
                                    node,
                                    message: `value '${arena.strings[arena.stringValue[token]]}' is not exported from '${from.val}'`,
                                    action: "drop",
                                });

                                continue;
                            }

                            result.cssModuleVariables ??= {};
                            result.cssModuleVariables[arena.strings[arena.stringValue[token]]] = importedCssVariables[
                                arena.strings[arena.stringValue[token]]
                            ] = cssVariablesMap[from.val][arena.strings[arena.stringValue[token]]];
                        }
                    }
                }

                arena.detach(node as AstNode);
                continue;
            }

            if (nodeType == EnumToken.CssVariableTokenType) {
                if (parent != null && arena.dataTypes[parent as AstNode] == EnumToken.StyleSheetNodeType) {
                    if (result.cssModuleVariables == null) {
                        result.cssModuleVariables = {} as Record<string, AstArenaNode>;
                    }

                    // inlined: cssVariableToken(arena, node as AstNode): the object view of the css variable node
                    // inlined: arena.toObject(node as AstNode)
                    result.cssModuleVariables[arena.strings[arena.name[node as AstNode]]] = new AstArenaNode(arena, node as AstNode);
                }
                arena.detach(node as AstNode);
                continue;
            }

            if (nodeType == EnumToken.DeclarationNodeType) {
                if (arena.strings[arena.name[node as AstNode]].startsWith("--")) {
                    if (!(arena.strings[arena.name[node as AstNode]] in namesMapping)) {
                        let result =
                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                ? arena.strings[arena.name[node as AstNode]]
                                : moduleSettings.generateScopedName!(
                                      arena.strings[arena.name[node as AstNode]],
                                      moduleSettings.filePath as string,
                                      moduleSettings.pattern as string,
                                      moduleSettings.hashLength,
                                  );
                        // @ts-ignore
                        let value: string = result instanceof Promise ? await result : result;

                        mapping[arena.strings[arena.name[node as AstNode]]] =
                            "--" +
                            (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                            moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                : value);
                        revMapping[arena.strings[arena.name[node as AstNode]]] =
                            arena.strings[arena.name[node as AstNode]];
                    }

                    // inlined: arena.setNameString(node as AstNode, mapping[arena.strings[arena.name[node as AstNode]]])
                    arena.name[(node as AstNode)] = arena.internString(mapping[arena.strings[arena.name[node as AstNode]]]);
                }

                if (equalsIgnoreCase("composes", arena.strings[arena.name[node as AstNode]])) {
                    const composeSelectors = [] as Token[];
                    // let isValid: boolean = true;

                    for (let token = arena.firstToken[node as AstNode]; token != 0; token = arena.nextSibling[token]) {
                        if (arena.dataTypes[token] == EnumToken.ComposesSelectorNodeType) {
                            composeSelectors.push(token);
                        }
                    }

                    // find parent rule
                    let parentRule: AstNode = (parent as AstNode) ?? 0;

                    while (parentRule != 0 && arena.dataTypes[parentRule] != EnumToken.RuleNodeType) {
                        parentRule = arena.parents[parentRule];
                    }

                    if (/* !isValid || */ composeSelectors.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });

                        arena.detach(node as AstNode);
                        continue;
                    }

                    const resolvedSrc = options.resolve!(options.src as string, options.cwd as string);

                    for (const token of composeSelectors) {
                        // composes: a b c;
                        if (!arena.hasField(token, TokenField.R)) {
                            for (const rule of arena.fieldTokens(token, TokenField.L)) {
                                if (
                                    arena.dataTypes[rule] == EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[rule] == EnumToken.CommentTokenType
                                ) {
                                    continue;
                                }

                                if (!(arena.strings[arena.stringValue[rule]] in mapping)) {
                                    let result =
                                        moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                            ? arena.strings[arena.stringValue[rule]]
                                            : moduleSettings.generateScopedName!(
                                                  arena.strings[arena.stringValue[rule]],
                                                  moduleSettings.filePath as string,
                                                  moduleSettings.pattern as string,
                                                  moduleSettings.hashLength,
                                              );
                                    // @ts-expect-error
                                    let value: string = result instanceof Promise ? await result : result;

                                    mapping[arena.strings[arena.stringValue[rule]]] =
                                        (arena.dataTypes[rule] == EnumToken.DashedIdenTokenType ? "--" : "") +
                                        (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                            ? getKeyName(value, moduleSettings.naming as ModuleCaseTransformEnum)
                                            : value);
                                    revMapping[mapping[arena.strings[arena.stringValue[rule]]]] =
                                        arena.strings[arena.stringValue[rule]];
                                }

                                if (parentRule != 0) {
                                    for (const tk of arena.tokens(parentRule)) {
                                        if (arena.dataTypes[tk] == EnumToken.ClassSelectorTokenType) {
                                            const val: string = arena.strings[arena.stringValue[tk]].slice(1);

                                            if (val in revMapping) {
                                                const key = revMapping[val] as string;
                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        mapping[arena.strings[arena.stringValue[rule]]],
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // composes: a b c from 'file.css';
                        else if (arena.dataTypes[arena.field(token, TokenField.R)] == EnumToken.StringTokenType) {
                            const url: string = arena.strings[arena.stringValue[arena.field(token, TokenField.R)]].slice(1, -1);
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

                            if (parentRule != 0) {
                                for (const tk of arena.tokens(parentRule)) {
                                    if (arena.dataTypes[tk] == EnumToken.ClassSelectorTokenType) {
                                        const val: string = arena.strings[arena.stringValue[tk]].slice(1);

                                        if (val in revMapping) {
                                            const key = revMapping[val] as string;
                                            const values = [] as string[];

                                            for (const iden of arena.fieldTokens(token, TokenField.L)) {
                                                if (
                                                    arena.dataTypes[iden] != EnumToken.IdenTokenType &&
                                                    arena.dataTypes[iden] != EnumToken.DashedIdenTokenType
                                                ) {
                                                    continue;
                                                }

                                                if (!(arena.strings[arena.stringValue[iden]] in root.mapping!)) {
                                                    const result =
                                                        moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                                            ? arena.strings[arena.stringValue[iden]]
                                                            : moduleSettings.generateScopedName!(
                                                                  arena.strings[arena.stringValue[iden]],
                                                                  srcIndex,
                                                                  moduleSettings.pattern as string,
                                                                  moduleSettings.hashLength,
                                                              );

                                                    let value: string =
                                                        // @ts-expect-error
                                                        result instanceof Promise ? await result : result;

                                                    root.mapping![arena.strings[arena.stringValue[iden]]] =
                                                        moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                                        moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                                            ? getKeyName(
                                                                  value,
                                                                  moduleSettings.naming as ModuleCaseTransformEnum,
                                                              )
                                                            : value;
                                                    root.revMapping![
                                                        root.mapping![arena.strings[arena.stringValue[iden]]]
                                                    ] = arena.strings[arena.stringValue[iden]];
                                                }

                                                importMapping[srcIndex][arena.strings[arena.stringValue[iden]]] =
                                                    root.mapping![arena.strings[arena.stringValue[iden]]];
                                                values.push(root.mapping![arena.strings[arena.stringValue[iden]]]);
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
                        else if (arena.dataTypes[arena.field(token, TokenField.R)] == EnumToken.IdenTokenType) {
                            // global
                            if (parentRule != 0) {
                                if (equalsIgnoreCase("global", arena.strings[arena.stringValue[arena.field(token, TokenField.R)]])) {
                                    for (const tk of arena.tokens(parentRule)) {
                                        if (arena.dataTypes[tk] == EnumToken.ClassSelectorTokenType) {
                                            const val: string = arena.strings[arena.stringValue[tk]].slice(1);

                                            if (val in revMapping) {
                                                const key = revMapping[val] as string;
                                                const composedNames: string[] = [];

                                                for (const curr of arena.fieldTokens(token, TokenField.L)) {
                                                    if (arena.dataTypes[curr] == EnumToken.IdenTokenType) {
                                                        composedNames.push(arena.strings[arena.stringValue[curr]]);
                                                    }
                                                }

                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        ...composedNames,
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                } else {
                                    errors.push({
                                        action: "drop",
                                        message: `composes '${arena.strings[arena.stringValue[arena.field(token, TokenField.R)]]}' is not supported`,
                                        node,
                                    });
                                }
                            }
                        }
                    }

                    arena.detach(node as AstNode);
                }

                if (
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
                    ].includes(arena.strings[arena.name[node as AstNode]])
                ) {
                    // inlined: arena.walkValues(node as AstNode)
                    for (const value of new ValueWalker(arena, node as AstNode)) {
                        if (arena.dataTypes[value] != EnumToken.IdenTokenType) {
                            continue;
                        }

                        let idenToken = arena.strings[arena.stringValue[value]];
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

                        // inlined: arena.setStr(value, mapping[idenToken])
                        arena.stringValue[value] = arena.internString(mapping[idenToken]);
                    }
                } else if (
                    arena.strings[arena.name[node as AstNode]] == "grid-template-areas" ||
                    arena.strings[arena.name[node as AstNode]] == "grid-template"
                ) {
                    for (let token = arena.firstToken[node as AstNode]; token != 0; token = arena.nextSibling[token]) {
                        if (arena.dataTypes[token] == EnumToken.StringTokenType) {
                            const str: string = arena.strings[arena.stringValue[token]];
                            const tokens = parseString(arena, str.slice(1, -1));

                            // inlined: arena.walkValues(tokens)
                            for (const value of new ValueWalker(arena, tokens)) {
                                if (
                                    arena.dataTypes[value] == EnumToken.IdenTokenType ||
                                    arena.dataTypes[value] == EnumToken.DashedIdenTokenType
                                ) {
                                    if (arena.strings[arena.stringValue[value]] in mapping) {
                                        // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                                        arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                                    } else {
                                        let result =
                                            moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                                ? arena.strings[arena.stringValue[value]]
                                                : moduleSettings.generateScopedName!(
                                                      arena.strings[arena.stringValue[value]],
                                                      moduleSettings.filePath as string,
                                                      moduleSettings.pattern as string,
                                                      moduleSettings.hashLength,
                                                  );

                                        // @ts-expect-error
                                        if (result instanceof Promise) {
                                            result = await result;
                                        }

                                        mapping[arena.strings[arena.stringValue[value]]] = result;
                                        revMapping[result] = arena.strings[arena.stringValue[value]];
                                        // inlined: arena.setStr(value, result)
                                        arena.stringValue[value] = arena.internString(result);
                                    }
                                }
                            }

                            // inlined: arena.setStr(token, str.charAt(0) + renderTokens(arena, tokens) + str.charAt(str.length - 1))
                            arena.stringValue[token] = arena.internString((str.charAt(0) + renderTokens(arena, tokens) + str.charAt(str.length - 1)));
                        }
                    }
                } else if (
                    arena.strings[arena.name[node as AstNode]] == "animation" ||
                    arena.strings[arena.name[node as AstNode]] == "animation-name"
                ) {
                    // inlined: arena.walkValues(node as AstNode)
                    for (const value of new ValueWalker(arena, node as AstNode)) {
                        if (
                            arena.dataTypes[value] == EnumToken.IdenTokenType &&
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
                            ].includes(arena.strings[arena.stringValue[value]])
                        ) {
                            if (!(arena.strings[arena.stringValue[value]] in mapping)) {
                                const result =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? arena.strings[arena.stringValue[value]]
                                        : moduleSettings.generateScopedName!(
                                              arena.strings[arena.stringValue[value]],
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                // @ts-expect-error
                                mapping[arena.strings[arena.stringValue[value]]] = result instanceof Promise ? await result : result;
                                revMapping[mapping[arena.strings[arena.stringValue[value]]]] = arena.strings[arena.stringValue[value]];
                            }

                            // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                            arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                        }
                    }
                }

                // inlined: arena.walkValues(node as AstNode)
                for (const value of new ValueWalker(arena, node as AstNode)) {
                    if (arena.dataTypes[value] == EnumToken.DashedIdenTokenType) {
                        // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                        arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                    } else if (
                        (arena.dataTypes[value] == EnumToken.IdenTokenType || isIdentColor(arena, value)) &&
                        arena.strings[arena.stringValue[value]] in importedCssVariables
                    ) {
                        arena.replaceToken(
                            value,
                            ...arena.tokens(importedCssVariables[arena.strings[arena.stringValue[value]]][ARENAID]).map(
                                (token: Token) => arena.clone(token, true),
                            ),
                        );
                    }
                }
            } else if (nodeType == EnumToken.RuleNodeType) {
                // if (node[TOKENS] == null) {
                const tokens = parseString(arena, arena.strings[arena.name[node as AstNode]]);
                matchSelectorSyntax(arena, tokens, [] as ErrorDescription[], options);

                arena.setTokenList(node as AstNode, trimArray(arena, tokens));

                let hasIdOrClass: boolean = false;

                // inlined: arena.walkValues(node as AstNode, filter)
                for (const value of new ValueWalker(arena, node as AstNode,
                    (arena: AstArena, value: Token): Token[] | null => {
                        if (
                            arena.dataTypes[value] == EnumToken.PseudoClassTokenType ||
                            arena.dataTypes[value] == EnumToken.PseudoElementTokenType
                        ) {
                            const val: string = arena.strings[arena.stringValue[value]].toLowerCase();
                            switch (val) {
                                case ":local":
                                case ":global":
                                    {
                                        // remove the pseudo class and the following whitespace
                                        const next: Token = arena.nextSibling[value];

                                        arena.detach(value);

                                        if (
                                            next != 0 &&
                                            (arena.dataTypes[next] == EnumToken.WhitespaceTokenType ||
                                                arena.dataTypes[next] == EnumToken.DescendantCombinatorTokenType)
                                        ) {
                                            arena.detach(next);
                                        }
                                    }

                                    break;
                            }
                        } else if (arena.dataTypes[value] == EnumToken.PseudoClassFuncTokenType) {
                            switch (arena.strings[arena.stringValue[value]].toLowerCase()) {
                                case ":global":
                                    for (const token of arena.tokens(value)) {
                                        global.add(token);
                                    }

                                case ":local": {
                                    // replace the function by its arguments. the arguments are visited
                                    const children: Token[] = arena.tokens(value);

                                    arena.replaceToken(value, ...children);
                                    return children;
                                }
                            }
                        }

                        return null;
                    },
                )) {
                    if (arena.dataTypes[value] == EnumToken.HashTokenType || arena.dataTypes[value] == EnumToken.ClassSelectorTokenType) {
                        hasIdOrClass = true;
                    }

                    if (processed.has(value)) {
                        continue;
                    }

                    processed.add(value);

                    if (arena.dataTypes[value] == EnumToken.PseudoClassTokenType || arena.dataTypes[value] == EnumToken.PseudoElementTokenType) {
                    } else if (arena.dataTypes[value] == EnumToken.PseudoClassFuncTokenType) {
                    } else {
                        if (global.has(value)) {
                            continue;
                        }

                        if (arena.dataTypes[value] == EnumToken.ClassSelectorTokenType) {
                            const val: string = arena.strings[arena.stringValue[value]].slice(1);

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

                            // inlined: arena.setStr(value, "." + mapping[val])
                            arena.stringValue[value] = arena.internString(("." + mapping[val]));
                        }
                    }
                }

                if (moduleSettings.scoped! & ModuleScopeEnumOptions.Pure) {
                    if (!hasIdOrClass) {
                        throw new Error(
                            // inlined: options.source?.getOffsets?.(arena.getSpanStart(node as AstNode))
                            `pure module: No id or class found in selector '${arena.strings[arena.name[node as AstNode]]}' at '${(options.source?.lineStarts.getOffsets(arena.getSpanStart(node as AstNode)) ?? []).join(":")}'`,
                        );
                    }
                }

                // inlined: arena.setSelector(node as AstNode, arena.tokens(node as AstNode).reduce((acc: string, token: Token) => acc + renderValue(arena, token), ""))
                arena.name[(node as AstNode)] = arena.internString(arena.tokens(node as AstNode).reduce((acc: string, token: Token) => acc + renderValue(arena, token), ""));
            } else if (nodeType == EnumToken.AtRuleNodeType || nodeType == EnumToken.KeyframesAtRuleNodeType) {
                const val: string = arena.strings[arena.name[node as AstNode]].toLowerCase();

                if (arena.firstToken[node as AstNode] == 0) {
                    // inlined: arena.setTokens(node as AstNode, ...parseString(arena, arena.strings[arena.stringValue[node as AstNode]]))
                    arena.setTokenList((node as AstNode), parseString(arena, arena.strings[arena.stringValue[node as AstNode]]));
                }

                if (val == "property" || val == "keyframes") {
                    const prefix: string = val == "property" ? "--" : "";

                    for (const value of arena.tokens(node as AstNode)) {
                        if (
                            (prefix == "--" && arena.dataTypes[value] == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && arena.dataTypes[value] == EnumToken.IdenTokenType)
                        ) {
                            if (!(arena.strings[arena.stringValue[value]] in mapping)) {
                                const result =
                                    moduleSettings.scoped! & ModuleScopeEnumOptions.Global
                                        ? arena.strings[arena.stringValue[value]]
                                        : moduleSettings.generateScopedName!(
                                              arena.strings[arena.stringValue[value]],
                                              moduleSettings.filePath as string,
                                              moduleSettings.pattern as string,
                                              moduleSettings.hashLength,
                                          );
                                // @ts-expect-error
                                let val: string = result instanceof Promise ? await result : result;

                                mapping[arena.strings[arena.stringValue[value]]] =
                                    prefix +
                                    (moduleSettings.naming! & ModuleCaseTransformEnum.DashCaseOnly ||
                                    moduleSettings.naming! & ModuleCaseTransformEnum.CamelCaseOnly
                                        ? getKeyName(val, moduleSettings.naming as ModuleCaseTransformEnum)
                                        : val);
                                revMapping[mapping[arena.strings[arena.stringValue[value]]]] = arena.strings[arena.stringValue[value]];
                            }

                            // inlined: arena.setStr(value, mapping[arena.strings[arena.stringValue[value]]])
                            arena.stringValue[value] = arena.internString(mapping[arena.strings[arena.stringValue[value]]]);
                        }
                    }

                    // inlined: arena.setValueString(node as AstNode, renderTokens(arena, arena.tokens(node as AstNode)))
                    arena.stringValue[(node as AstNode)] = arena.internString(renderTokens(arena, arena.tokens(node as AstNode)));
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
    arena: AstArena,
    tokens: Token[],
    context: AstNode,
    options: ParserOptions,
    errors: ErrorDescription[],
    stats: ParseResultStats,
    invalidNodes: AstNode[],
    parensMatch: number,
): AstNode | null {
    let i: number = 0;
    const contextType: EnumToken = arena.dataTypes[context];
    const dataTypes: Uint8Array = arena.dataTypes;

    const lastToken: Token | undefined = tokens[tokens.length - 1];

    if (lastToken != null && dataTypes[lastToken] === EnumToken.EOFTokenType) {
        tokens.pop();

        // check parenthesis are balanced
        let matchCount: number = parensMatch;

        if (matchCount > 0) {
            let k: number = tokens.length;

            while (
                k-- > 0 &&
                (dataTypes[tokens[k]] === EnumToken.WhitespaceTokenType || dataTypes[tokens[k]] === EnumToken.CommentTokenType)
            );

                if (dataTypes[tokens[k]] == EnumToken.SemiColonTokenType) {
                matchCount = 0;
            }

            while (matchCount > 0) {
                const closing: Token = arena.createToken(EnumToken.EndParensTokenType);

                if (k >= 0) {
                    arena.copyLocation(closing, tokens[k]);
                }

                tokens.push(closing);
                matchCount--;
            }
        }
    }

    for (; i < tokens.length; i++) {
        if (arena.dataTypes[tokens[i]] === EnumToken.CDOCOMMTokenType && contextType !== EnumToken.StyleSheetNodeType) {
            errors.push({
                action: "drop",
                message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                node: tokens[i],
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[i]))
                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[i]))],
            });

            // the misplaced CDO / CDC comment is rendered as an empty string
            arena.dataTypes[tokens[i]] = EnumToken.BadCdoTokenType;
            continue;
        }

        if (
            arena.dataTypes[tokens[i]] === EnumToken.CommentTokenType ||
            arena.dataTypes[tokens[i]] === EnumToken.CDOCOMMTokenType ||
            arena.dataTypes[tokens[i]] === EnumToken.WhitespaceTokenType
        ) {
            continue;
        }

        break;
    }

    if (i > 0) {
        // the leading comments are appended to the context, then removed with the whitespace (no array is created)
        for (let k = 0; k < i; k++) {
            if (arena.dataTypes[tokens[k]] !== EnumToken.WhitespaceTokenType) {
                // inlined: arena.appendChildren(context, createCommentNode(arena, tokens[k]))
                arena.appendChildList(context, [createCommentNode(arena, tokens[k])]);
            }
        }

        tokens.copyWithin(0, i);
        tokens.length -= i;
        i = 0;
    }

    for (; i < tokens.length; i++) {
        if (arena.dataTypes[tokens[i]] == EnumToken.CommentTokenType || arena.dataTypes[tokens[i]] == EnumToken.CDOCOMMTokenType) {
            if (arena.dataTypes[tokens[i]] == EnumToken.CDOCOMMTokenType && contextType != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: "drop",
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[i]))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(tokens[i]))],
                });

                // the misplaced CDO / CDC comment is rendered as an empty string
                arena.dataTypes[tokens[i]] = EnumToken.BadCdoTokenType;
                continue;
            }

            // inlined: arena.appendChildren(context, createCommentNode(arena, tokens[i]))
            arena.appendChildList(context, [createCommentNode(arena, tokens[i])]);
            stats.nodesCount++;
        } else if (arena.dataTypes[tokens[i]] != EnumToken.WhitespaceTokenType) {
            break;
        }
    }

    if (tokens.length == 0) {
        return null;
    }

    let delim: Token = tokens[tokens.length - 1] as Token;

    if (
        arena.dataTypes[delim] == EnumToken.SemiColonTokenType ||
        arena.dataTypes[delim] == EnumToken.BlockStartTokenType ||
        arena.dataTypes[delim] == EnumToken.BlockEndTokenType
    ) {
        tokens.pop();
    }

    if (tokens.length == 0) {
        return null;
    }

    if (arena.dataTypes[tokens[0]] == EnumToken.AtRuleTokenType) {
        let nestedRule: boolean = false;

        let parent: AstNode = context;
        let node: AstNode | null;

        while (parent != 0) {
            if (arena.dataTypes[parent] == EnumToken.RuleNodeType) {
                nestedRule = true;
                break;
            }

            parent = arena.parents[parent];
        }

        node = parseAtRule(
            arena,
            tokens,
            context,
            { ...options, nestedRule },
            errors,
            arena.dataTypes[delim] == EnumToken.BlockStartTokenType,
        );

        if (node == null) {
            return null;
        }

        if (
            arena.flags[node] &
            (EnumAstNodeStatus.Invalid |
                EnumAstNodeStatus.Disallowed |
                EnumAstNodeStatus.Unknown |
                EnumAstNodeStatus.Unparsed |
                EnumAstNodeStatus.Malformed)
        ) {
            invalidNodes.push(node);
        }

        stats.nodesCount++;
        // inlined: arena.appendChildren(context, node)
        arena.appendChildList(context, [node]);

        return node;
    } else {
        stats.nodesCount++;

        // rule
        if (arena.dataTypes[delim] == EnumToken.BlockStartTokenType) {
            const node: AstNode = parseSelector(arena, tokens, context, options, errors);

            // inlined: arena.appendChildren(context, node)
            arena.appendChildList(context, [node]);

            if (
                arena.flags[node] &
                (EnumAstNodeStatus.Invalid |
                    EnumAstNodeStatus.Disallowed |
                    EnumAstNodeStatus.Unknown |
                    EnumAstNodeStatus.Unparsed |
                    EnumAstNodeStatus.Malformed)
            ) {
                invalidNodes.push(node);
            }

            return node;
        } else {
            const node: AstNode = parseDeclaration(arena, tokens, context, options, errors) as AstNode;

            if (
                contextType === EnumToken.StyleSheetNodeType &&
                arena.dataTypes[node] === EnumToken.DeclarationNodeType
            ) {
                arena.flags[node] |=
                    EnumAstNodeStatus.Invalid &
                    ~(EnumAstNodeStatus.Validated | EnumAstNodeStatus.Unvalidated | EnumAstNodeStatus.Unparsed);

                errors.push({
                    message: "<declaration> not allowed in <stylesheet>",
                    action: "drop",
                    node,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(node))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(node))],
                });
            } else if (options.lenient || arena.dataTypes[node] === EnumToken.DeclarationNodeType) {
                // inlined: arena.appendChildren(context, node)
                arena.appendChildList(context, [node]);
            }

            if (
                arena.flags[node] &
                (EnumAstNodeStatus.Invalid |
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
    arena: AstArena,
    stream: Token[],
    context: AstNode,
    options: ParserOptions,
    errors: ErrorDescription[],
    parseAsBlock: boolean | null = null,
): AstNode | null {
    let success: boolean = true;
    const contextType: EnumToken = arena.dataTypes[context];
    const contextName: string | null =
        contextType === EnumToken.AtRuleNodeType ? arena.strings[arena.name[context]] : null;
    const atRule: Token = stream.shift() as Token;
    // at-rule name
    const nam: string = arena.strings[arena.name[atRule]];
    let atRuleName: string = nam;

    // prelude tokens, state, errors and last token of the at-rule node
    let atRuleTokens: Token[] | null = null;
    let atRuleState: EnumAstNodeStatus = 0 as EnumAstNodeStatus;
    let atRuleErrors: ErrorDescription[] = [];
    let atRuleEnd: Token = atRule;

    if (atRuleName.startsWith("-")) {
        atRuleName = atRuleName.replace(/^-[a-z]+-/, "").toLowerCase();
    }

    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + nam);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];
    const blockAllowed: boolean = syntaxRules?.getBlockRules() != null;

    if (syntaxRules == null) {
        errors.push({
            action: "drop",
            node: atRule,
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
            message: "unknown at-rule",
        });

        const result = matchGenericSyntax(arena, stream, options);

        atRuleTokens = parseTokens(arena, stream);
        atRuleState = result.success ? EnumAstNodeStatus.Unknown : EnumAstNodeStatus.Invalid;
        atRuleErrors = result.success ? [errors[errors.length - 1]] : [errors[errors.length - 1], ...result.errors];

        return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimArray(arena, stream), options),
            !!parseAsBlock,
        );
    } else if (contextName === "page" && pageMarginBoxType.has(atRuleName.toLowerCase())) {
        if (parseAsBlock === false && syntaxRules.optionalBody === false) {
            errors.push({
                action: "drop",
                node: atRule,
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
            });

            atRuleTokens = parseTokens(arena, stream);
            atRuleState = EnumAstNodeStatus.Invalid;
            atRuleErrors = [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimArray(arena, stream), options),
                !!parseAsBlock,
            );
        }

        const token =
            stream.find((t) => arena.dataTypes[t] != EnumToken.WhitespaceTokenType && arena.dataTypes[t] === EnumToken.CommentTokenType) ?? null;
        if (token != null) {
            errors.push({
                action: "drop",
                node: token,
                // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
                message: `unexpected token`,
            });

            atRuleTokens = parseTokens(arena, stream);
            atRuleState = EnumAstNodeStatus.Invalid;
            atRuleErrors = [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimArray(arena, stream), options),
                !!parseAsBlock,
            );
        }
    }

    if (parseAsBlock === null) {
        parseAsBlock = blockAllowed;
    }

    if (syntax != null && nam !== "layer" && parseAsBlock !== blockAllowed && !syntaxRules.optionalBody) {
        errors.push({
            action: "drop",
            node: atRule,
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
            message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
        });

        atRuleTokens = parseTokens(arena, stream);
        atRuleState = EnumAstNodeStatus.Invalid;
        atRuleErrors = [errors[errors.length - 1]];

        return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimArray(arena, stream), options),
            !!parseAsBlock,
        );
    }

    switch (atRuleName) {
        case "charset": {
            let success: boolean = true;

            // exactly one space is expected. the whitespace text is not stored: check the source
            if (
                stream.length === 0 ||
                arena.dataTypes[stream[0]] !== EnumToken.WhitespaceTokenType ||
                arena.getSpanEnd(stream[0]) - arena.getSpanStart(stream[0]) !== 1 ||
                // inlined: arena.getSource(stream[0]), options.sourcesMap?.get(...)?.getContent()
                options.sourcesMap?.get(arena.sources[arena.getSourceId(stream[0])] ?? 0)?.content.charCodeAt(arena.getSpanStart(stream[0])) !==
                    0x20
            ) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[0] ?? atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[0] ?? atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[0] ?? atRule))],
                    message: "expecting <space>",
                });
            } else if (arena.dataTypes[stream[1]] !== EnumToken.StringTokenType) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[1] ?? atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[1] ?? atRule))],
                    message: "expecting <string>",
                });
            }

            if (success && arena.strings[arena.stringValue[stream[1]]].charCodeAt(0) !== 0x22) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[1] ?? atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[1] ?? atRule))],
                    message: "expecting double-quoted string",
                });
            }

            if (!success) {
                atRuleTokens = stream;
                atRuleState = EnumAstNodeStatus.Invalid;
                atRuleErrors = [errors[errors.length - 1]];
                atRuleEnd = stream.at(-1) ?? atRule;

                return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimArray(arena, stream), options),
                    false,
                );
            }

            if (options.removeCharset) {
                return null;
            }

            atRuleTokens = stream;
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = [];
            atRuleEnd = stream.at(-1) ?? atRule;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimArray(arena, stream), options),
                false,
            );
        }

        case "font-feature-values": {
            const result = parseAtRuleFontFeatureValues(arena, stream, atRule, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            atRuleTokens = stream;
            atRuleState = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = result.success ? [] : result.errors;
            atRuleEnd = stream.at(-1) ?? atRule;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimWhiteSpaceTokens(arena, stream), options),
                true,
            );
        }

        case "stylistic":
        case "historical-forms":
        case "character-variant":
        case "swash":
        case "ornaments":
        case "annotation": {
            let success: boolean = contextName === "font-feature-values";

            if (!success) {
                errors.push({
                    action: "drop",
                    node: atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                    message: `unexpected at-rule ${nam}`,
                });
            }

            if (success) {
                for (const token of stream) {
                    if (arena.dataTypes[token] !== EnumToken.CommentTokenType && arena.dataTypes[token] !== EnumToken.WhitespaceTokenType) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: token,
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(token))
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(token))],
                            message: `unexpected token`,
                        });
                    }
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream;
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimWhiteSpaceTokens(arena, stream), options),
                true,
            );
        }

        case "container": {
            const result = parseAtRuleContainerQueryList(arena, stream, atRule, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream;
            atRuleState = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = result.success ? [] : result.errors;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimWhiteSpaceTokens(arena, stream), options),
                true,
            );
        }
        case "custom-media": {
            const tokens = trimArray(arena, stream.slice(1));
            const result = matchAllSyntaxes(arena, syntax, createValidationContext(arena, tokens), options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            atRuleEnd = tokens.at(-1) ?? atRule;
            atRuleTokens = tokens;
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.ValidationFailed;
            atRuleErrors = result.success ? [] : result.errors;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimWhiteSpaceTokens(arena, tokens), options),
                false,
            );
        }
        case "keyframes": {
            const tokens = trimArray(arena, stream.slice(1));
            const filtered: Token[] = stream.filter(
                (t) => arena.dataTypes[t] !== EnumToken.WhitespaceTokenType && arena.dataTypes[t] !== EnumToken.CommentTokenType,
            );

            if (
                filtered.length != 1 ||
                (arena.dataTypes[filtered[0]] !== EnumToken.IdenTokenType &&
                    arena.dataTypes[filtered[0]] !== EnumToken.StringTokenType &&
                    arena.dataTypes[filtered[0]] !== EnumToken.DashedIdenTokenType)
            ) {
                errors.push({
                    action: "drop",
                    node: atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                    message: `expected <keyframe-name>`,
                });
                success = false;
            }

            // @ts-expect-error
            options = { ...options, convertColor: false };

            atRuleEnd = tokens.at(-1) ?? atRule;
            atRuleTokens = tokens;
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = success ? [] : [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.KeyframesAtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, tokens, options),
                true,
            );
        }

        case "namespace": {
            const result: ValidationMatch = matchAllSyntaxes(
                arena,
                syntax as ValidationToken[],
                createValidationContext(arena, stream),
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
                    if (arena.dataTypes[stream[start]] == EnumToken.UrlFunctionTokenDefType) {
                        start++;
                        for (end = start; end < stream.length; end++) {
                            if (arena.dataTypes[stream[end]] == EnumToken.EndParensTokenType) {
                                break;
                            }

                            if (arena.dataTypes[stream[end]] === EnumToken.StringTokenType) {
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

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = valid ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = valid ? [] : result.errors;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, trimArray(arena, stream).reduce(
                    (acc, t, index) =>
                        acc +
                        (arena.dataTypes[t] === EnumToken.CommentTokenType ||
                        (arena.dataTypes[t] === EnumToken.WhitespaceTokenType &&
                            arena.dataTypes[stream[index + 1]] === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || arena.dataTypes[stream[index + 2]] === EnumToken.WhitespaceTokenType))
                            ? ""
                            : renderValue(arena, t, options)),
                    "",
                ),
                !!parseAsBlock,
            );
        }

        case "import": {
            const result = matchAtRuleImportSyntax(arena, atRule, stream, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            } else {
                if (
                    arena.dataTypes[stream[0]] == EnumToken.UrlFunctionTokenType &&
                    arena.tokens(stream[0]).some(
                        (t) => arena.dataTypes[t] == EnumToken.StringTokenType || arena.dataTypes[t] == EnumToken.UrlTokenTokenType,
                    )
                ) {
                    stream.splice(0, 1, ...arena.tokens(stream[0]));
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = result.success ? [] : result.errors;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, stream.reduce(
                    (acc, t, index) =>
                        acc +
                        (arena.dataTypes[t] === EnumToken.CommentTokenType ||
                        (arena.dataTypes[t] === EnumToken.WhitespaceTokenType &&
                            arena.dataTypes[stream[index + 1]] === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || arena.dataTypes[stream[index + 2]] === EnumToken.WhitespaceTokenType))
                            ? ""
                            : renderValue(arena, t, options)),
                    "",
                ),
                false,
            );
        }

        case "supports":
        case "when":
        case "else": {
            trimWhiteSpaceTokens(arena, stream);

            const result =
                atRuleName === "supports"
                    ? parseAtRuleSupportSyntax(arena, stream, atRule, options)
                    : matchAtRuleWhenElseSyntax(arena, stream, atRule, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            let success: boolean = result.success;

            if (nam === "else") {
                let sibling: AstNode = arena.lastChild[context];

                while (sibling != 0) {
                    if (
                        arena.dataTypes[sibling] === EnumToken.WhitespaceTokenType ||
                        arena.dataTypes[sibling] === EnumToken.CommentTokenType ||
                        arena.dataTypes[sibling] === EnumToken.CDOCOMMTokenType
                    ) {
                        sibling = arena.previousSibling[sibling];
                        continue;
                    }

                    break;
                }

                let missingWhen: boolean = false;
                let definedAfterLastElse: boolean = false;

                if (sibling == 0 || arena.dataTypes[sibling] !== EnumToken.AtRuleNodeType) {
                    missingWhen = true;
                } else if (arena.strings[arena.name[sibling]] !== "when") {
                    if (arena.strings[arena.name[sibling]] !== "else") {
                        missingWhen = true;
                    } else if (arena.stringValue[sibling] === 0) {
                        definedAfterLastElse = true;
                    }
                }

                if (missingWhen) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                        message: "at-rule @when is required before @else block",
                    });
                } else if (definedAfterLastElse) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                        message: "at-rule @else block is defined after last @else block",
                    });
                }
            }

            // @ts-expect-error
            options = { ...options, minify: false, convertColor: false };

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = result.success ? [] : [errors[errors.length - 1]].concat(result.errors);

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, stream, options), true);
        }
        case "media": {
            options = { ...options, parseColor: false };

            const result = parseMediaqueryList(arena, stream, options);

            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = result.success ? [] : result.errors;

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, stream, options), true);
        }
        case "scope": {
            let context = createValidationContext(arena, trimArray(arena, stream));

            let success: boolean = true;
            // @ts-ignore
            let range: Token[] = context.peekRange((t) => arena.dataTypes[t] === EnumToken.EndParensTokenType);

            if (arena.dataTypes[range[0]] !== EnumToken.StartParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range[0] ?? atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(range[0] ?? atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(range[0] ?? atRule))],
                    message: "expected '(' at start of @scope block",
                });
                success = false;
            // inlined: arena.typeOf(range.at(-1))
            } else if (arena.dataTypes[range.at(-1) as number] !== EnumToken.EndParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range.at(-1) ?? atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(range.at(-1) ?? atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(range.at(-1) ?? atRule))],
                    message: "expected ')' at end of @scope block",
                });
                success = false;
            } else {
                const srange = range.slice(1, -1);
                const result = matchSelectorSyntax(arena, srange, errors, options, true);

                if (!result.success) {
                    success = false;
                } else {
                    stream.splice(stream.indexOf(range[0]) + 1, range.length - 2, ...trimWhiteSpaceTokens(arena, srange));
                }
            }

            let index: number = stream.indexOf(range.at(-1)!);

            if (stream.length > index + 1) {
                while (
                    arena.dataTypes[stream[++index]] === EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[stream[index]] === EnumToken.CommentTokenType
                );

                if (index < stream.length) {
                    if (
                        arena.dataTypes[stream[index]] !== EnumToken.IdenTokenType ||
                        "to" !== arena.strings[arena.stringValue[stream[index]]].toLowerCase()
                    ) {
                        errors.push({
                            action: "drop",
                            node: stream[index],
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[index]))
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[index]))],
                            message: "expected 'to' at end of @scope block",
                        });
                        success = false;
                    } else {
                        while (
                            arena.dataTypes[stream[++index]] === EnumToken.WhitespaceTokenType ||
                            arena.dataTypes[stream[index]] === EnumToken.CommentTokenType
                        );

                        if (arena.dataTypes[stream[index]] !== EnumToken.StartParensTokenType) {
                            errors.push({
                                action: "drop",
                                node: stream[index],
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[index]))
                                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[index]))],
                                message: "expected 'to' at end of @scope block",
                            });
                            success = false;
                        } else {
                            context = createValidationContext(arena, stream.slice(index));
                            // @ts-ignore
                            range = context.peekRange((t: Token) => arena.dataTypes[t] === EnumToken.EndParensTokenType);
                            // inlined: arena.typeOf(range.at(-1))
                            if (arena.dataTypes[range.at(-1) as number] !== EnumToken.EndParensTokenType) {
                                errors.push({
                                    action: "drop",
                                    node: range.at(-1) ?? atRule,
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(range.at(-1) ?? atRule))
                                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(range.at(-1) ?? atRule))],
                                    message: "expected ')' at end of @scope block",
                                });
                                success = false;
                            } else {
                                const srange = range.slice(1, -1);
                                const result = matchSelectorSyntax(arena, srange, errors, options, true);

                                if (!result.success) {
                                    success = false;
                                } else {
                                    stream.splice(
                                        stream.indexOf(range[0]) + 1,
                                        range.length - 2,
                                        ...trimWhiteSpaceTokens(arena, srange),
                                    );
                                }
                            }
                        }
                    }
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = success ? [] : [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, stream, options), true);
        }
        case "page": {
            trimArray(arena, stream);

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = success ? [] : [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, stream, options), true);
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
            if (contextName !== "page") {
                success = false;
                errors.push({
                    action: "drop",
                    node: atRule,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                    message: "node is allowed only in @page rule",
                });
            } else {
                trimArray(arena, stream);

                for (let i = 0; i < stream.length; i++) {
                    if (
                        arena.dataTypes[stream[i]] !== EnumToken.WhitespaceTokenType &&
                        arena.dataTypes[stream[i]] !== EnumToken.CommentTokenType
                    ) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: stream[i],
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                            message: "expected whitespace or comment",
                        });
                        break;
                    }
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = success ? [] : [errors[errors.length - 1]];

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, stream, options), true);
        }

        case "value": {
            let index: number = 0;
            let isVarDeclaration: boolean = false;

            for (; index < stream.length; index++) {
                if (arena.dataTypes[stream[index]] == EnumToken.PseudoClassTokenType) {
                    const colon: Token = arena.createToken(EnumToken.ColonTokenType);

                    arena.copyLocation(colon, stream[index]);
                    // inlined: arena.setStr(stream[index], arena.strings[arena.stringValue[stream[index]]].slice(1))
                    arena.stringValue[stream[index]] = arena.internString(arena.strings[arena.stringValue[stream[index]]].slice(1));
                    arena.dataTypes[stream[index]] = EnumToken.IdenTokenType;

                    stream.splice(index, 0, colon);

                    isVarDeclaration = true;
                    break;
                } else if (arena.dataTypes[stream[index]] == EnumToken.ColonTokenType) {
                    isVarDeclaration = true;
                    break;
                } else if (
                    arena.dataTypes[stream[index]] == EnumToken.IdenTokenType &&
                    equalsIgnoreCase("from", arena.strings[arena.stringValue[stream[index]]])
                ) {
                    break;
                }
            }

            // supported syntaxes:
            // @value <ident>: <string>; // import from file as alias
            // @value id : <declaration-value>; // variable declaration
            // @value <ident># from <ident>; // import variables from alias
            let result = matchAllSyntaxes(
                arena,
                syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[],
                createValidationContext(arena, stream),
                options,
            );
            atRuleState = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = success ? [] : [errors[errors.length - 1]];

            atRuleEnd = stream.at(-1) ?? atRule;

            if (!result.success) {
                for (const error of result.errors) {
                    errors.push(error);
                }

                atRuleTokens = stream;
                atRuleState = EnumAstNodeStatus.Invalid;
                atRuleErrors = result.errors;

                return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, stream, options), false);
            }

            if (isVarDeclaration) {
                const nam: Token = stream.find((t) => arena.dataTypes[t] == EnumToken.IdenTokenType) as Token;
                const value: Token[] = trimArray(
                    arena,
                    stream.slice(index + 1).filter((t) => arena.dataTypes[t] != EnumToken.CommentTokenType),
                );

                // import from file as alias: @value <ident>: <string>;
                // variable declaration: @value <ident>: <declaration-value>;
                // the variable value is stored as the node values
                const node: AstNode = arena.createDeclaration(
                    value.length == 1 && arena.dataTypes[value[0]] == EnumToken.StringTokenType
                        ? EnumToken.CssVariableImportTokenType
                        : EnumToken.CssVariableTokenType,
                    arena.strings[arena.stringValue[nam]],
                    value,
                    EnumAstNodeStatus.Validated,
                    [],
                );

                arena.spanLocation(node, atRule, atRuleEnd);
                return node;
            }

            atRuleState = EnumAstNodeStatus.Validated;
            atRuleErrors = [];

            // import variables from alias: @value <ident># from <ident>;
            // the imported variable names are stored as the node values, the alias tokens as the `l` field
            const node: AstNode = arena.createDeclaration(
                EnumToken.CssVariableDeclarationMapTokenType,
                nam,
                trimArray(arena, stream.slice(0, index)),
                EnumAstNodeStatus.Validated,
                [],
            );

            // inlined: arena.setField(node, TokenField.L, ...stream.slice(index + 1))
            arena.setTokenList(arena.fieldList(node, TokenField.L), stream.slice(index + 1));
            arena.spanLocation(node, atRule, atRuleEnd);
            return node;
        }

        default: {
            options = { ...options, parseColor: false };

            let result = null;

            if (syntax == null) {
                // check matching '(' and ')'
                // check commas ',' or ',,'
                // check colon ':'
                // check 'or' and 'and'
                result = matchGenericSyntax(arena, stream, options);

                if (result.errors.length > 0) {
                    for (const error of result.errors) {
                        errors.push(error);
                    }
                }
            } else {
                result = matchAtRuleSyntax(arena, atRule, stream, options);

                if (result.errors.length > 0) {
                    for (const error of result.errors) {
                        errors.push(error);
                    }
                }

                if (result.success) {
                    let i: number = 0;
                    const stack: Token[] = [];

                    for (; i < stream.length; i++) {
                        if (arena.dataTypes[stream[i]] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[stream[i]])) {
                            stack.push(stream[i]);
                            continue;
                        }

                        if (arena.dataTypes[stream[i]] === EnumToken.EndParensTokenType && stack.length > 0) {
                            const index = stream.indexOf(stack[stack.length - 1]);

                            // inlined: arena.setSpanEnd(stream[index], arena.getSpanEnd(stream[i]))
                            arena.setSpan(stream[index], arena.getSourceId(stream[index]), arena.getSpanStart(stream[index]), arena.getSpanEnd(stream[i]));
                            arena.dataTypes[stream[index]] = tokensfuncDefMap.get(arena.dataTypes[stream[index]])!;
                            // inlined: arena.setTokens(stream[index], ...trimWhiteSpaceTokens(arena, stream.splice(index + 1, i - index - 1)))
                            arena.setTokenList(stream[index], trimWhiteSpaceTokens(arena, stream.splice(index + 1, i - index - 1)));
                            i = index;
                            stream.splice(index + 1, 1);
                            stack.pop();
                        }
                    }
                }
            }

            atRuleEnd = stream.at(-1) ?? atRule;
            atRuleTokens = stream.slice();
            atRuleState = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRuleErrors = result.errors;

            switch (nam) {
                case "mixin":
                    if (contextType != EnumToken.StyleSheetNodeType) {
                        atRuleState |= EnumAstNodeStatus.Disallowed;
                        atRuleErrors.push({
                            action: "drop",
                            message: "mixin rule cannot be a nested group rule or rule style body",
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                        });
                    }
                    break;

                case "contents":
                    let parent: AstNode = context;
                    let valid = false;
                    while (parent != 0) {
                        if (
                            arena.dataTypes[parent] == EnumToken.AtRuleNodeType &&
                            "mixin" == arena.strings[arena.name[parent]]
                        ) {
                            valid = true;
                            break;
                        }

                        parent = arena.parents[parent];
                    }

                    if (!valid) {
                        atRuleState |= EnumAstNodeStatus.Disallowed;
                        atRuleErrors.push({
                            action: "drop",
                            message: "contents rule cannot be used outside mixin rule",
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                        });
                    }
                    break;

                case "layer":
                    if (contextType != EnumToken.StyleSheetNodeType) {
                        let parent: AstNode = context;

                        while (parent != 0) {
                            if (
                                arena.dataTypes[parent] == EnumToken.AtRuleNodeType &&
                                arena.strings[arena.name[parent]] == "mixin"
                            ) {
                                atRuleState |= EnumAstNodeStatus.Disallowed;
                                atRuleErrors.push({
                                    action: "drop",
                                    message: "at-rule layeris not allowed inside mixin rule",
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(atRule))
                                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(atRule))],
                                });
                                break;
                            }

                            parent = arena.parents[parent];
                        }
                    }
            }

            return createAtRuleNode(arena, atRule, EnumToken.AtRuleNodeType, atRuleTokens, atRuleState, atRuleErrors, atRuleEnd, renderTokens(arena, trimWhiteSpaceTokens(arena, stream), options),
                !!parseAsBlock,
            );
        }
    }
}

/**
 * Parse a string as an array of declaration nodes.
 * The nodes are allocated in the given arena, or in a new arena when none is provided
 * @param declaration
 * @param arena
 *
 * Example:
 * ````ts
 *
 * const {arena, nodes} = parseDeclarations('color: red; background: blue');
 * console.log(nodes.map((node) => arena.toObject(node)));
 * ```
 */
export function parseDeclarations(
    declaration: string,
    arena?: AstArena,
): { arena: AstArena; nodes: Array<AstDeclaration | AstComment> } {
    const stream: string = `.x{${declaration}}`;
    const source: SourceFile = new SourceFile(stream, [], "");
    const result = doParseSync(
        new Tokenizer({
            stream,
            offset: 0,
            position: 0,
            source,
            currentPosition: 0,
        } as ParseInfo),
        {
            setParent: false,
            minify: false,
            validation: false,
            arena,
            source,
            sourcesMap: new Map([[source.id, source]]),
        },
    );

    const rule: AstNode = result.arena.firstChild[result.ast];
    const nodes: Array<AstDeclaration | AstComment> = [];

    for (let node: AstNode = rule == 0 ? 0 : result.arena.firstChild[rule]; node != 0; ) {
        const next: AstNode = result.arena.nextSibling[node];

        if (
            result.arena.dataTypes[node] == EnumToken.DeclarationNodeType ||
            result.arena.dataTypes[node] == EnumToken.CommentNodeType
        ) {
            result.arena.detach(node);
            nodes.push(node);
        }

        node = next;
    }

    return { arena: result.arena, nodes };
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
 * const arena = new AstArena();
 * let tokens = parseString(arena, 'body { color: red; }');
 * console.log(tokens.map((token) => arena.toObject(token)));
 *
 * tokens = parseString(arena, '#c322c980');
 * console.log(tokens.map((token) => arena.toObject(token)));
 * ```
 */
export function parseString(
    arena: AstArena,
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

    // inlined: tokenizer.done()
    while (!(tokenizer.typ === EnumToken.EOF)) {
        tokenizer.next();

        // tokens parsed from a string have no location
        mapped.push(allocateToken(arena, tokenizer, -1));
    }

    const result: Token[] = parseTokens(arena, mapped, options, errors);

    // remove the EOF token and the whitespace before it: their ids are recycled
    const removed: Token[] = result.splice(
        result.length - (arena.dataTypes[result[result.length - 2]] === EnumToken.WhitespaceTokenType ? 2 : 1),
        2,
    );

    for (let i = 0; i < removed.length; i++) {
        if (arena.parents[removed[i]] == 0 && arena.firstToken[removed[i]] == 0 && arena.firstChild[removed[i]] == 0) {
            arena.recycle(removed[i]);
        }
    }

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
 * let tokens = parseString(arena, 'body { color: red; }');
 * console.log(parseTokens(arena, tokens));
 *
 *  tokens = parseString(arena, '#c322c980');
 * console.log(parseTokens(arena, tokens));
 * ```
 *
 * @private
 */
export function parseTokens(
    arena: AstArena,
    tokens: Token[],
    options?: { parseColor?: boolean; source?: SourceFile } | null,
    errors?: ErrorDescription[],
): Token[] {
    const stack: Token[] = [];

    let i: number = 0;
    let index: number;
    let t: Token;
    let typ: EnumToken;

    options ??= { parseColor: true };

    for (; i < tokens.length; i++) {
        t = tokens[i];
        typ = arena.dataTypes[t];

        if (typ === EnumToken.FunctionTokenDefType) {
            if (
                i > 0 &&
                (arena.dataTypes[tokens[i - 1]] === EnumToken.ColonTokenType ||
                    arena.dataTypes[tokens[i - 1]] === EnumToken.DoubleColonTokenType)
            ) {
                // merge the colon and the function name into a pseudo class function
                const previous: Token = tokens[i - 1];

                // inlined: arena.setStr(previous, (arena.dataTypes[previous] === EnumToken.ColonTokenType ? ":" : "::") + arena.strings[arena.stringValue[t]])
                arena.stringValue[previous] = arena.internString(((arena.dataTypes[previous] === EnumToken.ColonTokenType ? ":" : "::") +
                        arena.strings[arena.stringValue[t]]));
                arena.dataTypes[previous] = EnumToken.PseudoClassFunctionTokenDefType;
                // inlined: arena.setSpanEnd(previous, arena.getSpanEnd(t))
                arena.setSpan(previous, arena.getSourceId(previous), arena.getSpanStart(previous), arena.getSpanEnd(t));
                tokens.splice(i--, 1);
                t = previous;
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
            if (
                stack.length === 0 ||
                (arena.dataTypes[stack[stack.length - 1]] !== EnumToken.StartParensTokenType &&
                    !tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]]))
            ) {
                // unbalanced parens
                const node: Token = stack[stack.length - 1];
                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ')'`,
                    node,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(node))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(node))],
                });

                // return [];
                continue;
            }

            tokens.splice(i, 1);
            index = tokens.indexOf(stack[stack.length - 1]);

            const func: Token = tokens[index];

            arena.dataTypes[func] =
                arena.dataTypes[func] === EnumToken.StartParensTokenType
                    ? EnumToken.ParensTokenType
                    : (tokensfuncDefMap.get(arena.dataTypes[func]) as EnumToken);
            arena.setTokenList(func, trimArray(arena, tokens.splice(index + 1, i - index - 1)));
            // inlined: arena.setSpanEnd(func, arena.getSpanEnd(t))
            arena.setSpan(func, arena.getSourceId(func), arena.getSpanStart(func), arena.getSpanEnd(t));
            i = index;

            if (arena.dataTypes[func] === EnumToken.ColorTokenType && options?.parseColor) {
                parseColor(arena, func);
            }

            stack.pop();
            continue;
        }

        if (typ === EnumToken.AttrEndTokenType) {
            if (stack.length === 0 || arena.dataTypes[stack[stack.length - 1]] !== EnumToken.AttrStartTokenType) {
                // unbalanced
                const node: Token = stack[stack.length - 1];

                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ']'`,
                    node,
                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(node))
                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(node))],
                });
                continue;
            }

            const attr: Token = stack[stack.length - 1];

            index = tokens.indexOf(attr);
            // inlined: arena.setSpanEnd(attr, arena.getSpanEnd(t))
            arena.setSpan(attr, arena.getSourceId(attr), arena.getSpanStart(attr), arena.getSpanEnd(t));

            tokens.splice(i, 1);
            arena.dataTypes[attr] = EnumToken.AttrTokenType;
            arena.setTokenList(attr, tokens.splice(index + 1, i - index - 1));

            i = index;
            stack.pop();
            continue;
        }

        if (typ == EnumToken.IdenTokenType) {
            if (arena.strings[arena.stringValue[t]] == "from" && i > 0) {
                const left: Token[] = [];
                const right: Token[] = [];

                let foundLeft: number = 0;
                let foundRight: number = 0;
                let k: number = i;
                let l: number = i;

                while (k > 0) {
                    if (
                        arena.dataTypes[tokens[k - 1]] == EnumToken.CommentTokenType ||
                        arena.dataTypes[tokens[k - 1]] == EnumToken.WhitespaceTokenType
                    ) {
                        left.push(tokens[--k]);
                        continue;
                    }

                    if (
                        arena.dataTypes[tokens[k - 1]] == EnumToken.IdenTokenType ||
                        arena.dataTypes[tokens[k - 1]] == EnumToken.DashedIdenTokenType
                    ) {
                        foundLeft++;
                        left.push(tokens[--k]);
                        continue;
                    }

                    break;
                }

                while (++l < tokens.length) {
                    if (
                        arena.dataTypes[tokens[l]] == EnumToken.CommentTokenType ||
                        arena.dataTypes[tokens[l]] == EnumToken.WhitespaceTokenType
                    ) {
                        right.push(tokens[l]);
                        continue;
                    }

                    if (
                        arena.dataTypes[tokens[l]] == EnumToken.IdenTokenType ||
                        arena.dataTypes[tokens[l]] == EnumToken.StringTokenType
                    ) {
                        foundRight++;
                        right.push(tokens[l]);
                        continue;
                    }

                    break;
                }

                if (foundLeft > 0 && foundRight == 1) {
                    while (left.length > 0 && arena.dataTypes[left[0]] == EnumToken.WhitespaceTokenType) {
                        left.shift();
                    }

                    while (left.length > 0 && arena.dataTypes[left[left.length - 1]] == EnumToken.WhitespaceTokenType) {
                        left.pop();
                    }

                    // composes selector: l = <ident>+, r = <ident> | <string> | null
                    const composes: Token = arena.createToken(EnumToken.ComposesSelectorNodeType);
                    let from: Token = 0;

                    for (const b of right) {
                        if (
                            from == 0 ||
                            arena.dataTypes[b] == EnumToken.IdenTokenType ||
                            arena.dataTypes[b] == EnumToken.StringTokenType
                        ) {
                            from = b;
                        }
                    }

                    // inlined: arena.setField(composes, TokenField.L, ...left)
                    arena.setTokenList(arena.fieldList(composes, TokenField.L), left);

                    if (from != 0) {
                        // inlined: arena.setField(composes, TokenField.R, from)
                        arena.setTokenList(arena.fieldList(composes, TokenField.R), [from]);
                    }

                    tokens.splice(k, l - k + 1, composes);

                    i = k;
                    continue;
                }
            } else if (options?.parseColor && isColor(arena, t)) {
                parseColor(arena, t);
            }
        }

        if (
            typ == EnumToken.WhitespaceTokenType &&
            (i == 0 ||
                i + 1 == tokens.length ||
                [
                    EnumToken.CommaTokenType,
                    EnumToken.GteTokenType,
                    EnumToken.LteTokenType,
                    EnumToken.ColumnCombinatorTokenType,
                ].includes(arena.dataTypes[tokens[i + 1]]) ||
                (i > 0 && trimWhiteSpace.includes(arena.dataTypes[tokens[i - 1]])))
        ) {
            tokens.splice(i--, 1);
            continue;
        }

        if (typ == EnumToken.ColonTokenType) {
            const next: EnumToken | undefined = i + 1 < tokens.length ? arena.dataTypes[tokens[i + 1]] : undefined;

            if (next != null) {
                if (next == EnumToken.FunctionTokenType) {
                    arena.dataTypes[tokens[i + 1]] = EnumToken.PseudoClassFuncTokenType;
                } else if (next == EnumToken.IdenTokenType) {
                    // inlined: arena.setStr(tokens[i + 1], ":" + arena.strings[arena.stringValue[tokens[i + 1]]])
                    arena.stringValue[tokens[i + 1]] = arena.internString((":" + arena.strings[arena.stringValue[tokens[i + 1]]]));
                    arena.dataTypes[tokens[i + 1]] = EnumToken.PseudoClassTokenType;
                }

                if (next == EnumToken.FunctionTokenType || next == EnumToken.IdenTokenType) {
                    tokens.splice(i, 1);
                    i--;
                }
            }
        }

        if (typ === EnumToken.CommaTokenType) {
            if (i + 1 < tokens.length && arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }

            if (i > 0 && arena.dataTypes[tokens[i - 1]] === EnumToken.WhitespaceTokenType) {
                tokens.splice(i - 1, 1);
                i--;
            }
        }
    }

    if (stack.length > 0) {
        const node: Token = stack[stack.length - 1];

        errors?.push?.({
            action: "drop",
            message: `Unbalanced token. Expecting ${arena.dataTypes[node] === EnumToken.AttrStartTokenType ? "']'" : ")"}'`,
            node,
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(node))
            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(node))],
        });
    }

    return tokens;
}
