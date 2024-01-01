import {EnumToken} from "../lib";
import {Token} from "./token";


export declare interface Position {

    ind: number;
    lin: number;
    col: number;
}

export declare interface Location {

    sta: Position;
    // end: Position;
    src: string;
}

export declare interface Node {

    typ: EnumToken;
    loc?: Location;
}

export declare interface AstComment extends Node {

    typ: EnumToken.CommentNodeType | EnumToken.CDOCOMMNodeType,
    val: string;
}

export declare interface AstDeclaration extends Node {

    nam: string,
    val: Token[];
    typ: EnumToken.DeclarationNodeType
}

export declare interface AstRule extends Node {

    typ: EnumToken.RuleNodeType;
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

export declare type RawSelectorTokens = string[][];

export declare interface OptimizedSelector {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
}

export declare interface AstAtRule extends Node {

    typ: AtRuleNodeType,
    nam: string;
    val: string;
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export declare interface AstRuleList extends Node {

    typ: StyleSheetNodeType | RuleNodeType | AtRuleNodeType,
    chi: Array<Node | AstComment>
}

export declare interface AstRuleStyleSheet extends AstRuleList {
    typ: StyleSheetNodeType,
    chi: Array<AstRuleList | AstComment>
}

export declare type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration;
