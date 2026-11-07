import type { AstNode, AstRuleList } from "./ast.d.ts";
import type { Token } from "./token.d.ts";
import { WalkerEvent, WalkerOptionEnum } from "../lib/ast/walk.ts";
import type { AstArena } from "../lib/ast/arena.ts";

/**
 * node walker options
 */
export declare interface WalkerOptions {
    /**
     * walk in reverse
     */
    reverse?: boolean;

    /**
     * traverse node children
     */
    children?: boolean;

    /**
     * Traverse node value tokens. If false, only traverse node children
     */
    attributes?: boolean;
    /**
     * filter function to control the walk
     */
    filter?: WalkerFilter;
}

/**
 * node walker option
 */
export declare type WalkerOption = WalkerOptionEnum | AstNode | Token | null;
/**
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this node and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tree
 * - {@link WalkerOptionEnum.Children}: walk the children and ignore the current node
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the node and ignore children
 * - {@link AstNode}:
 * - {@link Token}:
 */
export declare type WalkerFilter = (node: AstNode | Token, arena?: AstArena) => WalkerOption;

/**
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this node and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tree
 * - {@link WalkerOptionEnum.Children}: walk the children and ignore the current node
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the node and ignore children
 * - {@link AstNode}:
 * - {@link Token}:
 */
export declare type WalkerValueFilter = (
    node: AstNode | Token,
    parent?: AstNode | Token | AstNode[] | Token[] | null,
    event?: WalkerEvent,
    parents?: Generator<Token>,
) => WalkerOption | AstNode | Token | AstNode[] | Token[] | null;

/**
 * walker result
 */
export declare interface WalkResult {
    /**
     * current node: a node id or a value token (when walking attributes)
     */
    node: AstNode | Token;
    /**
     * parent node id (0 for the root) or parent token
     */
    parent: AstRuleList | Token;
    /**
     * root node
     */
    root: AstNode | Token;
    /**
     * arena
     */
    arena: AstArena;
    /**
     * parent nodes generator
     */
    parents: () => Generator<AstNode | Token>;
}

/**
 * walker result
 */
export declare interface WalkAttributesResult {
    /**
     * current node
     */
    value: Token;
    /**
     * previous node
     */
    previousValue: Token | null;
    /**
     * next node
     */
    nextValue: Token | null;
    /**
     * root node
     */
    root?: AstNode | Token | null;
    /**
     * parent node
     */
    parent: AstNode | Token | null;
    /**
     * parent nodes
     */
    parents: Generator<Token>;
}
