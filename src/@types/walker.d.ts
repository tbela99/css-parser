import type {AstNode, AstRuleList} from "./ast.d.ts";
import type {Token} from "./token.d.ts";
import {WalkerEvent, WalkerOptionEnum} from '../lib/ast/walk.ts';

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
 * filter nodes
 */
export declare type WalkerValueFilter = (node: AstNode | Token, parent?: AstNode | Token | AstNode[] | Token[] | null, event?: WalkerEvent) => WalkerOption | null;

export declare interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstNode;
}

export declare interface WalkAttributesResult {
    value: Token;
    previousValue: Token | null;
    nextValue: Token | null;
    root?: AstNode | Token | null;
    parent: AstNode | Token | null;
}