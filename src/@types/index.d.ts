import exp from "constants";
import {Token} from "./tokenize";

export * from './validation';
export * from './tokenize';
export * from './stringiterator';

export declare type NodeTraverseCallback = (node: AstNode, parent: AstRuleList, root: AstRuleStyleSheet) => void;

export interface NodeTraverseEventsMap {

    enter?: NodeTraverseCallback[];
    exit?: NodeTraverseCallback[]
}
export interface ErrorDescription {

    // drop rule or declaration | fix rule or declaration
    action: 'drop';
    message: string;
    location: {
        src: string,
        lin: number,
        col: number;
    };
    error?: Error;
}

export interface ParserOptions {

    strict?: boolean;
    location?: boolean;
    processImport?: boolean;
    dedup?: boolean;
    removeEmpty?: boolean;
}

export interface RenderOptions {

    compress?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
}

export interface Position {

    ind: number;
    lin: number;
    col: number;
}

export interface Location {

    sta: Position;
    end: Position;
    src: string;
}

type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    typ: NodeType;
    loc?: Location;
}

export interface AstComment extends Node {

    typ: 'Comment',
    val: string;
}

export interface AstInvalidComment extends Node {

    typ: 'InvalidComment',
    val: string;
}

export interface AstDeclaration extends Node {

    nam: Token[],
    val: Token[];
    typ: 'Declaration'
}

export interface AstRule extends Node {

    typ: 'Rule',
    sel: string,
    chi: Array<AstDeclaration | AstComment | AstRuleList>
}

export interface AstAtRule extends Node {

    nam: string;
    val: Token[];
    chi?: Array<AstDeclaration | AstComment> | Array<AstRule | AstComment>
}

export interface AstRuleList extends Node {

    chi: Array<Node | AstComment>
}

export interface AstRuleStyleSheet extends AstRuleList {
    typ: 'StyleSheet',
    chi: Array<AstRuleList | AstComment>
}

export type AstNode =
    AstRuleStyleSheet
    | AstRuleList
    | AstComment
    | AstAtRule
    | AstRule
    | AstDeclaration;

export type AstTraverserHandler = (node: AstNode, direction: 'enter' | 'exit') => void;
