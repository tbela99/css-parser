import {EnumToken} from "../lib/index.ts";
import type {Token} from "./token.d.ts";

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

export declare interface BaseToken {

    /**
     * token type
     */
    typ: EnumToken;
    /**
     * location info
     */
    loc?: Location;
    /**
     * prelude or selector tokens
     */
    tokens?: Token[] | null;
    /**
     * parent node
     */
    parent?: AstRuleList | null;
    /**
     * @private
     */
    validSyntax?: boolean;
}

/**
 * comment node
 */
export declare interface AstComment extends BaseToken {

    typ: EnumToken.CommentNodeType | EnumToken.CDOCOMMNodeType,
    val: string;
}

/**
 * declaration node
 */
export declare interface AstDeclaration extends BaseToken {

    nam: string,
    val: Token[];
    typ: EnumToken.DeclarationNodeType
}

/**
 * rule node
 */
export declare interface AstRule extends BaseToken {

    typ: EnumToken.RuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector | null;
    raw?: RawSelectorTokens | null;
}

/**
 * invalid rule node
 */
export declare interface AstInvalidRule extends BaseToken {

    typ: EnumToken.InvalidRuleTokenType;
    sel: string;
    chi: Array<AstNode>;
}

/**
 * invalid declaration node
 */
export declare interface AstInvalidDeclaration extends BaseToken {

    typ: EnumToken.InvalidDeclarationNodeType;
    val: Array<AstNode>;
}

/**
 * invalid at rule node
 */
export declare interface AstInvalidAtRule extends BaseToken {

    typ: EnumToken.InvalidAtRuleTokenType;
    nam: string;
    val: string;
    chi?: Array<AstNode>;
}

/**
 * keyframe rule node
 */
export declare interface AstKeyFrameRule extends BaseToken {

    typ: EnumToken.KeyFramesRuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
    tokens?: Token[]
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
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
}

/**
 * optimized selector token
 *
 * @private
 */
export declare interface OptimizedSelectorToken {
    match: boolean;
    optimized: Token[];
    selector: Token[][],
    reducible: boolean;
}

/**
 * at rule node
 */
export declare interface AstAtRule extends BaseToken {

    typ: EnumToken.AtRuleNodeType,
    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstInvalidDeclaration | AstComment> | Array<AstRule | AstComment>
}

/**
 * keyframe rule node
 */
export declare interface AstKeyframesRule extends BaseToken {

    typ: EnumToken.KeyFramesRuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstInvalidDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

/**
 * keyframe at rule node
 */
export declare interface AstKeyframesAtRule extends BaseToken {

    typ: EnumToken.KeyframesAtRuleNodeType,
    nam: string;
    val: string;
    chi: Array<AstKeyframesRule | AstComment>;
}

/**
 * rule list node
 */
export declare interface AstRuleList extends BaseToken {

    typ: EnumToken.StyleSheetNodeType | EnumToken.RuleNodeType | EnumToken.AtRuleNodeType | EnumToken.KeyframesAtRuleNodeType | EnumToken.KeyFramesRuleNodeType | EnumToken.InvalidRuleTokenType | EnumToken.InvalidAtRuleTokenType,
    chi: Array<BaseToken | AstComment>;
}

/**
 * rule list node
 */
export declare interface AstStyleSheet extends AstRuleList {
    typ: EnumToken.StyleSheetNodeType,
    chi: Array<AstRuleList | AstComment>;
    tokens?: null;
}

/**
 * ast node
 */
export declare type AstNode =
    AstStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration
    | AstKeyframesAtRule
    | AstKeyFrameRule
    | AstInvalidRule
    | AstInvalidDeclaration;
