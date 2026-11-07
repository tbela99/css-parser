import { EnumAstNodeStatus, EnumToken } from "../lib/ast/types.ts";
import type { PlainToken, Token } from "./token.d.ts";
import type { ErrorDescription } from "./index.d.ts";
import type { AstArena } from "../lib/ast/arena.ts";

/**
 * token or node location
 */
export declare interface SourceLocation {
    /**
     * start position
     */
    sta: number;
    /**
     * end position
     */
    end: number;
    /**
     * source file
     */
    srcId: number;
}

/**
 * Common plain token interface. Plain tokens are the object representation of the arena tokens
 * returned by `arena.toPlainObject()`. `arena.toObject()` returns an {@link AstArenaNode} view with the same properties
 */
export declare interface BaseToken {
    /**
     * token type
     */
    typ: EnumToken;
    /**
     * source location
     */
    loc?: SourceLocation | null;
}

/**
 * plain object representation of an ast node (`arena.toPlainObject()` / `arena.fromObject()`). `arena.toObject()`
 * returns an {@link AstArenaNode} view with the same properties. The library only deals with node ids internally
 */
export declare interface PlainAstNode {
    /**
     * node type
     */
    typ: EnumToken;
    /**
     * rule selector
     */
    sel?: string;
    /**
     * at-rule / declaration name
     */
    nam?: string;
    /**
     * at-rule prelude, comment or declaration value tokens
     */
    val?: string | Array<PlainToken | Token>;
    /**
     * children
     */
    chi?: Array<PlainAstNode | AstNode>;
    /**
     * prelude / selector tokens
     */
    tokens?: Array<PlainToken | Token> | null;
    /**
     * source location
     */
    loc?: SourceLocation | null;
    /**
     * validation state
     */
    state?: EnumAstNodeStatus | null;
    /**
     * validation errors
     */
    errors?: ErrorDescription[] | null;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens | null;
    /**
     * optimized selector
     */
    optimized?: OptimizedSelector | null;
}

/**
 * Ast nodes are integer ids of records stored in an {@link AstArena}.
 *
 * - `arena.getType(node)` is the node type ({@link EnumToken}),
 * - `arena.getName(node)` is the name of declarations / at-rules and the selector of rules,
 * - `arena.getValue(node)` is the string value of at-rules and comments,
 * - `arena.tokens(node)` (`arena.getFirstToken(node)` ... `arena.getLastToken(node)`) are the declaration value tokens
 *   or the rule selector / at-rule prelude tokens,
 * - `arena.getFlags(node)` holds the validation state ({@link EnumAstNodeStatus}) and the node flags,
 * - `arena.getFirstChild(node)`, `arena.getLastChild(node)`, `arena.getNextSibling(node)`,
 *   `arena.getPreviousSibling(node)` and `arena.getParent(node)` link the tree.
 */
export declare type AstNode = number;

/**
 * comment node id
 */
export declare type AstComment = number;
/**
 * declaration node id
 */
export declare type AstDeclaration = number;
/**
 * rule node id
 */
export declare type AstRule = number;
/**
 * keyframes rule node id
 */
export declare type AstKeyframesRule = number;
/**
 * at rule node id
 */
export declare type AstAtRule = number;
/**
 * keyframes at rule node id
 */
export declare type AstKeyframesAtRule = number;
/**
 * rule list node id
 */
export declare type AstRuleList = number;
/**
 * stylesheet node id
 */
export declare type AstStyleSheet = number;

/**
 * raw selector tokens
 */
export declare type RawSelectorTokens = string[][];

/**
 * optimized selector
 *
 * @private
 */
export declare interface OptimizedSelector {
    /**
     * matched selector
     */
    match: boolean;
    /**
     * optimized selector
     */
    optimized: string[];
    /**
     * selector tokens as string
     */
    selector: string[][];
    /**
     * reducible selector
     */
    reducible: boolean;
}

/**
 * optimized selector token
 *
 * @private
 */
export declare interface OptimizedSelectorToken {
    /**
     * match
     */
    match: boolean;
    /**
     * optimized
     */
    optimized: Token[];
    /**
     * selector
     */
    selector: Token[][];
    /**
     * reducible
     */
    reducible: boolean;
}

/**
 * value token matcher of {@link AstArena.findByValue} and {@link AstArena.findValue}. the node that owns the token is
 * `arena.getValueOwner(token)`
 */
export type AstValueMatcher = (arena: AstArena, token: Token) => boolean;

/**
 * node matcher of {@link AstArena.find}, {@link AstArena.findAll} and {@link AstArena.findLast}. the parent of the node
 * is `arena.getParent(node)`
 */
export type AstNodeMatcher = (arena: AstArena, node: AstNode) => boolean;
