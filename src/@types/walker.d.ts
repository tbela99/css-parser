import {AstNode, AstRuleList} from "./ast";
import {FunctionToken, ParensToken, Token} from "./token";

export declare type WalkerOption = 'ignore' | 'stop' | 'children' | 'ignore-children' | null;
/**
 * return value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

export declare interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstRuleList;
}

export declare interface WalkAttributesResult {
    value: Token;
    parent: FunctionToken | ParensToken | null;
}