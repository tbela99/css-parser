import type { AstNode, ErrorDescription, SourceLocation, Token } from "../../@types/index.d.ts";
import { ERRORS, LOCEND, LOCSRCID, LOCSTA, PARENT, STATE, TOKENS } from "../syntax/constants.ts";
import { AstNodePropertyType, EnumAstNodeStatus } from "./types.ts";

/**
 * 
 * @param node 
 * @param key 
 */
export function getNodeProperty(node: AstNode, key: 'parent'): AstNode | Token | null;
/**
 * 
 * @param node 
 * @param key 
 */
export function getNodeProperty(node: AstNode, key: 'location'): SourceLocation | null;
/**
 * 
 * @param node 
 * @param key 
 */
export function getNodeProperty(node: AstNode, key: 'state'): EnumAstNodeStatus | null;
/**
 * 
 * @param node 
 * @param key 
 */
export function getNodeProperty(node: AstNode, key: 'errors'): ErrorDescription[] | null;
/**
 * 
 * @param node 
 * @param key 
 */
export function getNodeProperty(node: AstNode, key: 'tokens'): Token[] | null;

/**
 * 
 * @param node 
 * @param key 
 * @returns 
 */
export function getNodeProperty(node: AstNode, key: AstNodePropertyType): any {
    
    switch (key) {
        
        case "parent":
            return node[PARENT];
        case "location":
            return node[LOCSRCID] == null && node[LOCSTA] == null && node[LOCEND] == null ? null : {srcId: node[LOCSRCID], sta: node[LOCSTA], end: node[LOCEND]} as SourceLocation;
        case "state":
            return node[STATE];
        case "errors":
            return node[ERRORS];
        case "tokens":
            return node[TOKENS];
    }
    return undefined;
}

/**
 * 
 * @param node 
 * @param key 
 * @param value 
 */
export function setNodeProperty(node: AstNode, key: 'parent', value: AstNode | Token | null): void;
/**
 * 
 * @param node 
 * @param key 
 * @param value 
 */
export function setNodeProperty(node: AstNode, key: 'location', value: SourceLocation | null): void;
/**
 * 
 * @param node 
 * @param key 
 * @param value 
 */
export function setNodeProperty(node: AstNode, key: 'state', value: EnumAstNodeStatus | null): void;
/**
 * 
 * @param node 
 * @param key 
 * @param value 
 */
export function setNodeProperty(node: AstNode, key: 'errors', value: ErrorDescription[] | null): void;
/**
 * 
 * @param node 
 * @param key 
 * @param value 
 */
export function setNodeProperty(node: AstNode, key: 'tokens', value: Token[] | null): void;

/**
 * 
 * @param node 
 * @param key 
 * @param value 
 */
export function setNodeProperty(node: AstNode, key: AstNodePropertyType, value: any): void {
    switch (key) {
        case "parent":
            node[PARENT] = value;
            break;
        case "location":
            node[LOCSRCID] = (value as SourceLocation).srcId;
            node[LOCSTA] = (value as SourceLocation).sta;
            node[LOCEND] = (value as SourceLocation).end;
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
    }
}