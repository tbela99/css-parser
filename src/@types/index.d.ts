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
    sourcemap?: boolean;
    compress?: boolean;
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
    errors: ErrorDescription[];
    bytesIn: number;
}

export interface RenderResult {
    code: string ;
}

export interface TransformResult extends ParseResult, RenderResult {

    stats: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        render: string;
        total: string;
    }
}

export interface ParseTokenOptions extends ParserOptions {
    parseColor?: boolean;
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
