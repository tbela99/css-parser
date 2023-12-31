import {AstNode, AstRuleList} from "./ast";

export declare type WalkerOption = 'ignore' | 'stop' | 'children' | 'ignore-children' | null;
/**
 * return value:
 * - 'ignore': ignore this node and its children
 * - 'stop': stop walking the tree
 * - 'children': walk the children and ignore the node itself
 * - 'ignore-children': walk the node and ignore children
 */
export declare type WalkerFilter = (node: AstNode) => WalkerOption;

export interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstRuleList;
}
