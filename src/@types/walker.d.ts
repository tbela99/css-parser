import type { AstNode } from "./ast.d.ts";
import type { Token } from "./token.d.ts";
import { EnumToken, WalkerEvent, WalkerOptionEnum } from "../lib/ast/types.ts";
import type { AstArena } from "../lib/ast/arena.ts";

/**
 * node walker options of {@link AstArena.walk}
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
    filter?: WalkerFilter | null;
}

/**
 * node walker option, see {@link WalkerOptionEnum}
 */
export declare type WalkerOption = WalkerOptionEnum | null | undefined | void;

/**
 * filter of {@link AstArena.walk}, called for every node. the parent of the node is `arena.getParent(node)`.
 *
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this node and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tree
 * - {@link WalkerOptionEnum.Children}: walk the children and ignore the current node
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the node and ignore children
 */
export declare type WalkerFilter = (arena: AstArena, node: AstNode | Token) => WalkerOption;

/**
 * filter of {@link AstArena.walkValues}, called for every token. the parent of the token is
 * `arena.getValueParent(token)`.
 *
 * returned value:
 * - {@link WalkerOptionEnum.Ignore}: ignore this token and its children
 * - {@link WalkerOptionEnum.Stop}: stop walking the tokens
 * - {@link WalkerOptionEnum.IgnoreChildren}: walk the token and ignore its children
 * - an array of token ids: the tokens are walked next
 */
export declare type WalkerValueFilter = (
    arena: AstArena,
    token: Token,
    event: WalkerEvent,
) => WalkerOption | Token[];

/**
 * options of {@link AstArena.walkValues}
 */
export declare interface WalkerValueOptions {
    /**
     * events the filter is called for. defaults to {@link WalkerEvent.Enter}
     */
    event?: WalkerEvent;
    /**
     * filter function
     */
    fn?: WalkerValueFilter | null;
    /**
     * the filter is only called for the tokens of this type, these types, or the tokens accepted by this function
     */
    type?: EnumToken | EnumToken[] | ((arena: AstArena, token: Token) => boolean) | null;
}
