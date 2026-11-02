import type { AstNode, ErrorDescription, SourceLocation, Token } from "../../@types/index.d.ts";
import { AstNodePropertyType, EnumAstNodeStatus } from "./types.ts";
import type { AstArena } from "./arena.ts";

/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: "parent"): AstNode;
/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: "location"): SourceLocation | null;
/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: "state"): EnumAstNodeStatus;
/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: "errors"): ErrorDescription[] | null;
/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: "tokens"): Token[] | null;
/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: "selector"): string | null;

/**
 * Read a node property
 * @param arena
 * @param node
 * @param key
 * @returns
 */
export function getNodeProperty(arena: AstArena, node: AstNode, key: AstNodePropertyType): any {
    switch (key) {
        case "parent":
            return arena.parents[node];
        case "location":
            return arena.getLocation(node);
        case "state":
            return arena.flags[node] & EnumAstNodeStatus.StateMask;
        case "errors":
            return arena.errors.get(node) ?? null;
        case "tokens":
            return arena.firstToken[node] == 0 ? null : arena.tokens(node);
        case "selector":
            return arena.strings[arena.name[node]] ?? null;
    }

    return undefined;
}

/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: "parent", value: AstNode): void;
/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: "location", value: SourceLocation | null): void;
/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: "state", value: EnumAstNodeStatus | null): void;
/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: "errors", value: ErrorDescription[] | null): void;
/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: "tokens", value: Token[] | null): void;
/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: "selector", value: string): void;

/**
 * Set a node property
 * @param arena
 * @param node
 * @param key
 * @param value
 */
export function setNodeProperty(arena: AstArena, node: AstNode, key: AstNodePropertyType, value: any): void {
    switch (key) {
        case "parent":
            // move the node at the end of the parent children
            arena.appendChildren(value, node);
            break;
        case "location":
            arena.setLocation(node, value?.srcId, value?.sta, value?.end);
            break;
        case "state":
            arena.setState(node, value);
            break;
        case "errors":
            if (value == null) {
                arena.errors.delete(node);
            } else {
                arena.errors.set(node, value);
            }
            break;
        case "tokens":
            arena.setTokenList(node, (value ?? []) as Token[]);
            break;
        case "selector":
            arena.name[node] = arena.internString(value);
            break;
    }
}
