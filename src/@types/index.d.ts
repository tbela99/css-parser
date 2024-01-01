import {NodeType} from "../lib";
import {FunctionToken, ParensToken, Token} from "./token";
import {VisitorNodeMap} from "./visitor";

export * from './ast';
export * from './token';
export * from './shorthand';
export * from './config';
export * from './visitor';
export * from './walker';
export * from './parse';

export declare interface ErrorDescription {

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

export declare interface MinifyFeature {

    ordering: number;

    register: (options: MinifyOptions | ParserOptions) => void;
    run: (ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }) => void;
    cleanup?: (ast: AstRuleStyleSheet, options: ParserOptions = {}, context: { [key: string]: any }) => void;
}

export declare interface ParserOptions extends PropertyListOptions {

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
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string;
        relative: string;
    };
    visitor?: VisitorNodeMap;
    signal?: AbortSignal;
}

export declare interface MinifyOptions extends ParserOptions {

    features: MinifyFeature[];
}

export declare interface ResolvedPath {
    absolute: string;
    relative: string;
}

export declare interface RenderOptions {

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
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResolvedPath;

}

export declare interface TransformOptions extends ParserOptions, RenderOptions {

}

export declare interface ParseResult {
    ast: AstRuleStyleSheet;
    errors: ErrorDescription[];
    stats: {
        bytesIn: number;
        parse: string;
        minify: string;
        total: string;
    }
}

export declare interface RenderResult {
    code: string;
    errors: ErrorDescription[];
    stats: {
        total: string;
    },
    map?: SourceMapObject
}

export declare interface TransformResult extends ParseResult, RenderResult {

    stats: {
        bytesIn: number;
        bytesOut: number;
        parse: string;
        minify: string;
        render: string;
        total: string;
    }
}

export declare interface ParseTokenOptions extends ParserOptions {
    parseColor?: boolean;
}

export declare interface TokenizeResult {
    token: string;
    hint?: EnumToken;
    position: Position;
    bytesIn: number;
}

export declare interface MatchedSelector {
    match: string[][];
    selector1: string[][];
    selector2: string[][];
    eq: boolean
}

export declare interface VariableScopeInfo {
    globalScope: boolean;
    parent: Set<AstRule | AstAtRule>;
    declarationCount: number;
    replaceable: boolean;
    node: AstDeclaration;
}

export declare interface SourceMapObject {
    version: number;
    file?: string;
    sourceRoot?: string;
    sources?: string[];
    sourcesContent?: Array<string | null>;
    names?: string[];
    mappings: string;
}
