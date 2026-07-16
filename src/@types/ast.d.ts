import { EnumToken } from "../lib/ast/types.ts";
import { LOC, PARENT, TOKENS, STATE, ERRORS, RAW, ROOT, OPTIMIZED } from "../lib/syntax/constants.ts";
import type { Token } from "./token.d.ts";

/**
 * Position
 */
export declare interface Position {
    /**
     * index in the source
     */
    ind: number;
    /**
     * line number
     */
    lin: number;
    /**
     * column number
     */
    col: number;
}

/**
 * token or node location
 */
export declare interface Location {
    /**
     * start position
     */
    sta: Position;
    /**
     * end position
     */
    end: Position;
    /**
     * source file
     */
    src: string;
}

/**
 * Common token interface
 */
export declare interface BaseToken {
    /**
     * token type
     */
    typ: EnumToken;
    /**
     * location info
     * @private
     */
    [LOC]?: Location;
    /**
     * parent node
     * @private
     */
    [PARENT]?: AstNode;
    /**
     * root node
     */
    [ROOT]?: AstStyleSheet;
    /**
     * prelude or selector tokens
     * @private
     */
    [TOKENS]?: Token[] | null;
    /**
     * node state
     * @private
     */
    [STATE]?: EnumAstNodeStatus;
    /**
     * node syntax errors
     * @private
     */
    [ERRORS]?: ErrorDescription[];
    /**
     * property name
     * @private
     */
    [PROPERTYNAME]?: string;
    /**
     * raw selector
     * @private
     */
    [RAW]?: string[][] | null;
    /**
     * optimized selector
     * @private
     */
    [OPTIMIZED]?: OptimizedSelector | null;
    /**
     * parent node
     */
    parent?: AstAtRule | astRule | AstKeyframesAtRule | AstKeyFrameRule | AstInvalidRule | AstInvalidAtRule | null;
    /**
     * @private
     */
    validSyntax?: boolean;
}

/**
 * Ast node state
 */
export declare interface AstNodeStatus {
    /**
     * Node state
     */
    state?: EnumAstNodeStatus;
    /**
     * Syntax errors
     */
    errors?: ErrorDescription[];
}

/**
 * comment node
 */
export declare interface AstComment extends BaseToken {
    /**
     * token type
     */
    typ: EnumToken.CommentNodeType | EnumToken.CDOCOMMNodeType;
    /**
     * comment as string
     */
    val: string;
}

/**
 * declaration node
 */
export declare interface AstDeclaration extends BaseToken, AstNodeStatus {
    /**
     * token name
     */
    nam: string;
    /**
     * token value
     */
    val: Token[];
    /**
     * token type
     */
    typ: EnumToken.DeclarationNodeType;
}

/**
 * rule node
 */
export declare interface AstRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.RuleNodeType;
    /**
     * selector as string
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<
        AstDeclaration | AstComment | AstRule | AstAtRule | AstInvalidRule | AstInvalidDeclaration | AstInvalidAtRule
    >;
    /**
     * optimized` selector
     */
    optimized?: OptimizedSelector | null;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens | null;
}

/**
 * Invalid rule node
 * @deprecated
 */
export declare interface AstInvalidRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.InvalidRuleNodeType;
    /**
     * selector
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<AstNode>;
}

/**
 * invalid declaration node
 * @deprecated
 */
export declare interface AstInvalidDeclaration extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.InvalidDeclarationNodeType;
    /**
     * tokens
     */
    tokens?: null;
    /**
     * tokens
     */
    val: Array<Token>;
}

/**
 * invalid at rule node
 * @deprecated
 */
export declare interface AstInvalidAtRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.InvalidAtRuleNodeType;
    /**
     * name
     */
    nam: string;
    /**
     * value
     */
    val: string;
    /**
     * child nodes
     */
    chi?: Array<AstNode>;
}

/**
 * keyframe rule node
 */
export declare interface AstKeyFrameRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.KeyFramesRuleNodeType;
    /**
     * selector
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<AstDeclaration | AstComment | AstInvalidDeclaration>;
    /**
     * optimized selector
     */
    optimized?: OptimizedSelector;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens;
    /**
     * tokens
     */
    tokens?: Token[];
}

/**
 * raw selector tokens
 */
export declare type RawSelectorTokens = string[][];

/**
 * optimized selector
 *
 * @private
 */
export declare interface OptimizedSelector {
    /**
     * matched selector
     */
    match: boolean;
    /**
     * optimized selector
     */
    optimized: string[];
    /**
     * selector tokens as string
     */
    selector: string[][];
    /**
     * reducible selector
     */
    reducible: boolean;
}

/**
 * optimized selector token
 *
 * @private
 */
export declare interface OptimizedSelectorToken {
    /**
     * match
     */
    match: boolean;
    /**
     * optimized
     */
    optimized: Token[];
    /**
     * selector
     */
    selector: Token[][];
    /**
     * reducible
     */
    reducible: boolean;
}

/**
 * at rule node
 */
export declare interface AstAtRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.AtRuleNodeType;
    /**
     * name
     */
    nam: string;
    /**
     * value
     */
    val: string;
    /**
     * child nodes
     */
    chi?: Array<AstNode>;
}

/**
 * keyframe rule node
 */
export declare interface AstKeyframesRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.KeyFramesRuleNodeType;
    /**
     * selector
     */
    sel: string;
    /**
     * child nodes
     */
    chi: Array<AstDeclaration | AstInvalidDeclaration | AstComment | AstRuleList>;
    /**
     * optimized selector
     */
    optimized?: OptimizedSelector;
    /**
     * raw selector
     */
    raw?: RawSelectorTokens;
}

/**
 * keyframe at rule node
 */
export declare interface AstKeyframesAtRule extends BaseToken, AstNodeStatus {
    /**
     * token type
     */
    typ: EnumToken.KeyframesAtRuleNodeType;
    /**
     * name
     */
    nam: string;
    /**
     * value
     */
    val: string;
    /**
     * child nodes
     */
    chi: Array<AstKeyframesRule | AstComment>;
}

/**
 * rule list node
 */
export declare type AstRuleList =
    | AstStyleSheet
    | AstAtRule
    | AstRule
    | AstKeyframesAtRule
    | AstKeyFrameRule
    | AstInvalidRule;

/**
 * stylesheet node
 */
export declare interface AstStyleSheet extends BaseToken {
    /**
     * token type
     */
    typ: EnumToken.StyleSheetNodeType;
    /**
     * child nodes
     */
    chi: Array<AstRule | AstAtRule | astKeyframesAtRule | AstComment | AstInvalidAtRule | AstInvalidRule>;
}

/**
 * ast node
 */
export declare type AstNode =
    | AstStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration
    | AstKeyframesAtRule
    | AstKeyFrameRule
    | AstInvalidRule
    | AstInvalidAtRule
    | AstInvalidDeclaration
    | CssVariableToken
    | CssVariableImportTokenType;

/**
 * token search result
 */
export interface TokenSearchResult {
    /**
     * node
     */
    node: Token | null;
    /**
     * parent node
     */
    parent: AstNode | Token | null;
    /**
     * root node
     */
    root: AstNode | Token | null;
    /**
     * parent tokens
     */
    parents: Generator<Token> | null;
}

/**
 * Ast value matcher
 */
export type AstValueMatcher = ((value: Token) => boolean) | ((token: Token, node: AstNode) => boolean);
