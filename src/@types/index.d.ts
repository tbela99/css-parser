import {Token} from "./tokenize";

export * from './validation';
export * from './tokenize';
export * from './stringiterator';
export * from './shorthand';
export * from './config';

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
    sourcemap?: boolean;
    minify?: boolean;
    nestingRules?: boolean;
    removeEmpty?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => { absolute: string, relative: string };
    nodeEventFilter?: NodeType[]
}

export interface RenderOptions {

    minify?: boolean;
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
    errors: ErrorDescription[];
    stats: {
        bytesIn: number;
        parse: string;
        minify: string;
        total: string;
    }
}

export interface RenderResult {
    code: string ;
    stats: {
        total: string;
    }
}

export interface TransformResult extends ParseResult, RenderResult {

    stats: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        minify: string;
        render: string;
        total: string;
    }
}

export interface ParseTokenOptions extends ParserOptions {
    parseColor?: boolean;
}

export interface TokenizeResult {
    token: string;
    hint?: string;
    position: Position;
    bytesIn: number;
}

export interface MatchedSelector {
    match: string[][];
    selector1: string[][];
    selector2: string[][];
    eq: boolean
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

    typ: 'Rule';
    sel: string;
    chi: Array<AstDeclaration | AstComment | AstRuleList>;
    optimized?: OptimizedSelector;
    raw?: RawSelectorTokens;
}

export declare type RawSelectorTokens  = string[][];

export interface OptimizedSelector {
    match: boolean;
    optimized: string[];
    selector: string[][],
    reducible: boolean;
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

export interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstRuleList;
}