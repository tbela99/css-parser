import type { AstNode, AstRuleList } from "./ast.d.ts";
import type { Token } from "./token.d.ts";
import { WalkerEvent, WalkerOptionEnum } from "../lib/ast/walk.ts";

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
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

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
) => WalkerOption | null;

/**
 * walker result
 */
export declare interface WalkResult {
    /**
     * current node
     */
    node: AstNode;
    /**
     * parent node
     */
    parent?: AstRuleList;
    /**
     * root node
     */
    root?: AstNode;
    /**
     * parent nodes
     */
    parents: Generator<AstNode>;
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
