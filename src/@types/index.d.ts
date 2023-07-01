import {Token} from "./tokenize";

export * from './validation';
export * from './tokenize';
export * from './stringiterator';
export * from './shorthand';

export declare type NodeTraverseCallback = (node: AstNode, location: Location, parent: AstRuleList, root: AstRuleStyleSheet) => void;

export interface NodeParseEventsMap {

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

    src?: string;
    location?: boolean;
    compress?: boolean;
    processImport?: boolean;
    removeEmpty?: boolean;
    nodeEventFilter?: NodeType[]
}

export interface RenderOptions {

    compress?: boolean;
    preserveLicense?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
    colorConvert?: boolean;
}

export interface TransformOptions extends ParserOptions, RenderOptions {

}

export interface ParseResult {
    ast: AstRuleStyleSheet;
    errors: ErrorDescription[]
}

export interface RenderResult {
    code: string ;
}

export interface TransformResult extends ParseResult, RenderResult {

    performance: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        // deduplicate: string;
        render: string;
        total: string;
    }
}
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

export declare type NodeType = 'StyleSheet' | 'InvalidComment' | 'Comment' | 'Declaration' | 'InvalidAtRule' | 'AtRule' | 'Rule';

interface Node {

    typ: NodeType;
    loc?: Location;
}

export interface AstComment extends Node {

    typ: 'Comment',
    val: string;
}
export interface AstDeclaration extends Node {

    nam: string,
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
    val: string;
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
