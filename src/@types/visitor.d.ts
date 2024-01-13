import {AstRule, AstDeclaration, AstAtRule} from "./ast";
import {Token} from "./token";
import {EnumToken} from "../lib";

/**
 * Declaration visitor handler
 */
export declare type DeclarationVisitorHandler = (node: AstDeclaration) => AstDeclaration | AstDeclaration[] | null;
/**
 * Rule visitor handler
 */
export declare type RuleVisitorHandler = (node: AstRule) => AstRule | AstRule[] | null;
;
/**
 * AtRule visitor handler
 */
export declare type AtRuleVisitorHandler = (node: AstAtRule) => AstAtRule | AstAtRule[] | null;
;
/**
 * Value visitor handler
 */
export declare type ValueVisitorHandler = (node: Token) => Token | Token[] | null;
;

export declare interface VisitorNodeMap {

    AtRule?: Record<string, AtRuleVisitorHandler> | AtRuleVisitorHandler;
    Declaration?: Record<string, DeclarationVisitorHandler> | DeclarationVisitorHandler;
    Rule?: RuleVisitorHandler;
    Value?: Record<EnumToken, ValueVisitorHandler> | ValueVisitorHandler;
}