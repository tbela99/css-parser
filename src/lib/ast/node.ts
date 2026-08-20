import type { AstNode, SourceLocation } from "../../@types/ast.d.ts";
import type { ErrorDescription, Token } from "../../@types/index.d.ts";
import { ERRORS, LOC, PARENT, STATE, TOKENS } from "../syntax/constants.ts";
import { AstNodePropertyType, EnumAstNodeStatus } from "./types.ts";

/**
 *
 * @param node
 * @param property
 * @param value
 */
export function setNodeProperty(node: AstNode, property: "location", value: SourceLocation): void;
/**
 *
 * @param node
 * @param property
 * @param value
 */
export function setNodeProperty(node: AstNode, property: "state", value: EnumAstNodeStatus): void;
/**
 *
 * @param node
 * @param property
 * @param value
 */
export function setNodeProperty(node: AstNode, property: "errors", value: ErrorDescription[]): void;
/**
 *
 * @param node
 * @param property
 * @param value
 */
export function setNodeProperty(node: AstNode, property: "tokens", value: Token[]): void;
/**
 *
 * @param node
 * @param property
 * @param value
 */
export function setNodeProperty(node: AstNode, property: "parent", value: AstNode | Token): void;

/**
 * set node property
 * @param node
 * @param property
 * @param value
 */
export function setNodeProperty(node: AstNode, property: AstNodePropertyType, value: any): void {
    switch (property) {
        case "location":
            node[LOC] = value;
            break;
        case "state":
            node[STATE] = value;
            break;
        case "errors":
            node[ERRORS] = value;
            break;
        case "tokens":
            node[TOKENS] = value;
            break;
        case "parent":
            node[PARENT] = value;
            break;
    }
}

/**
 *
 * @param node
 * @param property
 */
export function getNodeProperty(node: AstNode, property: "location"): SourceLocation | null;
/**
 *
 * @param node
 * @param property
 */
export function getNodeProperty(node: AstNode, property: "state"): EnumAstNodeStatus | null;
/**
 *
 * @param node
 * @param property
 */
export function getNodeProperty(node: AstNode, property: "errors"): ErrorDescription[] | null;
/**
 *
 * @param node
 * @param property
 */
export function getNodeProperty(node: AstNode, property: "tokens"): Token[] | null;
/**
 *
 * @param node
 * @param property
 */
export function getNodeProperty(node: AstNode, property: "parent"): AstNode | Token | null;

/**
 * get node property
 * @param node
 * @param property
 * @returns
 */
export function getNodeProperty(node: AstNode, property: AstNodePropertyType): any {
    switch (property) {
        case "location":
            return node[LOC];
        case "state":
            return node[STATE];
        case "errors":
            return node[ERRORS];
        case "tokens":
            return node[TOKENS];
        case "parent":
            return node[PARENT];
    }
}
