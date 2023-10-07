import {NodeType} from "../lib";
import {FunctionToken, Token} from "./tokenize";

export * from './tokenize';
export * from './shorthand';
export * from './config';

export interface ErrorDescription {

    // drop rule or declaration | fix rule or declaration
    action: 'drop' | 'ignore';
    message: string;
    location?: {
        src: string,
        lin: number,
        col: number;
    };
    error?: Error;
}

export interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
}

export interface MinifyFeature {

    run: (ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {[key: string]: any}) => void;
    cleanup?: (ast: AstRuleStyleSheet, options: ParserOptions = {}, context: {[key: string]: any}) => void;
}

export interface ParserOptions extends PropertyListOptions {

    minify?: boolean;
    src?: string;
    sourcemap?: boolean;
    nestingRules?: boolean;
    expandNestingRules?: boolean;
    removeCharset?: boolean;
    removeEmpty?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
    inlineCssVariables?: boolean;
    computeCalcExpression?: boolean;
    load?: (url: string, currentUrl: string) => Promise<string>;
    dirname?: (path: string) => string;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => { absolute: string, relative: string };
    nodeEventFilter?: NodeType[]
}

export interface MinifyOptions extends ParserOptions {

    features: MinifyFeature[];
}

export interface ResoledPath  {
    absolute: string;
    relative: string;
}

export interface RenderOptions {

    minify?: boolean;
    expandNestingRules?: boolean;
    preserveLicense?: boolean;
    sourcemap?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
    colorConvert?: boolean;
    output?: string;
    cwd?: string;
    load?: (url: string, currentUrl: string) => Promise<string>;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResoledPath;

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
    errors: ErrorDescription[];
    stats: {
        total: string;
    },
    map?: SourceMapObject
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
    hint?: EnumToken;
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

export declare type RawSelectorTokens  = string[][];

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

export interface WalkResult {
    node: AstNode;
    parent?: AstRuleList;
    root?: AstRuleList;
}

export interface WalkAttributesResult {
    value: Token;
    parent?: FunctionToken;
}

export interface VariableScopeInfo {
    globalScope: boolean;
    parent: Set<AstRule | AstAtRule>;
    declarationCount: number;
    replaceable: boolean;
    node: AstDeclaration;
}

export interface SourceMapObject {
    version : number;
    file?: string;
    sourceRoot?: string;
    sources?: string[];
    sourcesContent?: Array<string | null>;
    names?: string[];
    mappings: string;
}
