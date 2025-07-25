import {AstNode, AstRuleList} from "./ast.d.ts";
import {BinaryExpressionToken, FunctionToken, ParensToken, Token} from "./token.d.ts";
import {WalkerOptionEnum, WalkerValueEvent} from '../lib/ast/walk.ts';

export declare type WalkerOption = WalkerOptionEnum | Token | null;
/**
 * returned value:
 * - WalkerOptionEnum.Ignore: ignore this node and its children
 * - WalkerOptionEnum.Stop: stop walking the tree
 * - WalkerOptionEnum.Children: walk the children and ignore the node itself
 * - WalkerOptionEnum.IgnoreChildren: walk the node and ignore children
 */
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

/**
 * returned value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerValueFilter = (node: AstNode | Token, parent?: FunctionToken | ParensToken | BinaryExpressionToken, event?: WalkerValueEvent) => WalkerOption | null;

export declare interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstNode;
}

export declare interface WalkAttributesResult {
    value: Token;
    previousValue: Token | null;
    nextValue: Token | null;
    root?: AstNode;
    parent: AstNode | Token | null;
    list: Token[] | null;
}