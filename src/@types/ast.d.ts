import {NodeType} from "../lib";
import {Token} from "./token";


export interface Position {

    ind: number;
    lin: number;
    col: number;
}

export interface Location {

    sta: Position;
    // end: Position;
    src: string;
}

interface Node {

    typ: NodeType;
    loc?: Location;
}

export interface AstComment extends Node {

    typ: NodeType.CommentNodeType | NodeType.CDOCOMMNodeType,
    val: string;
}

export interface AstDeclaration extends Node {

    nam: string,
    val: Token[];
    typ: NodeType.DeclarationNodeType
}

export interface AstRule extends Node {

    typ: NodeType.RuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

export declare type RawSelectorTokens = string[][];

export interface OptimizedSelector {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
}

export interface AstAtRule extends Node {

    typ: AtRuleNodeType,
    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export interface AstRuleList extends Node {

    typ: StyleSheetNodeType | RuleNodeType | AtRuleNodeType,
    chi: Array<Node | AstComment>
}

export interface AstRuleStyleSheet extends AstRuleList {
    typ: StyleSheetNodeType,
    chi: Array<AstRuleList | AstComment>
}

export type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration;
