import {AstNode, AstRuleList} from "./ast.d.ts";
import {BinaryExpressionToken, FunctionToken, ParensToken, Token} from "./token.d.ts";
import {WalkerValueEvent} from '../lib/ast/walk.ts';

export declare type WalkerOption = 'ignore' | 'stop' | 'children' | 'ignore-children' | Token | null;
/**
 * returned value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

/**
 * returned value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerValueFilter = (node: AstNode | Token, parent: FunctionToken | ParensToken | BinaryExpressionToken, event?: WalkerValueEvent) => WalkerOption | null;

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
    parent: FunctionToken | ParensToken | BinaryExpressionToken | null;
    list: Token[] | null;
}