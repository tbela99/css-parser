import {VisitorNodeMap} from "./visitor.d.ts";
import {AstAtRule, AstDeclaration, AstRule, AstRuleStyleSheet, Position} from "./ast.d.ts";
import {SourceMap} from "../lib/renderer/sourcemap/index.ts";
import {PropertyListOptions} from "./parse.d.ts";
import {EnumToken} from "../lib/index.ts";

export * from './ast.d.ts';
export * from './token.d.ts';
export * from './shorthand.d.ts';
export * from './config.d.ts';
export * from './visitor.d.ts';
export * from './walker.d.ts';
export * from './parse.d.ts';

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
    rawTokens?: TokenizeResult[];
}

export declare interface MinifyFeature {

    ordering: number;

    register(options: MinifyFeatureOptions | ParserOptions): void;

    // run(ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: { [key: string]: any }): void;

    // cleanup?(ast: AstRuleStyleSheet, options: ParserOptions = {}, context: { [key: string]: any }): void;
}

export interface ValidationOptions {

    validation?: boolean;
    lenient?: boolean;
}

export interface MinifyOptions {

    minify?: boolean;
    nestingRules?: boolean;
    expandNestingRules?: boolean;
    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
    computeTransform?: boolean;
    computeCalcExpression?: boolean;
    inlineCssVariables?: boolean;
    removeEmpty?: boolean;
    pass?: number;
}

export declare interface ParserOptions extends MinifyOptions, ValidationOptions, PropertyListOptions {

    src?: string;
    sourcemap?: boolean;
    removeCharset?: boolean;
    resolveUrls?: boolean;
    resolveImport?: boolean;
    cwd?: string;
    parseColor?: boolean;
    removePrefix?: boolean;
    load?: (url: string, currentUrl: string) => Promise<string>;
    dirname?: (path: string) => string;
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string;
        relative: string;
    };
    visitor?: VisitorNodeMap;
    signal?: AbortSignal;
    setParent?: boolean;
}

export declare interface MinifyFeatureOptions extends ParserOptions {

    features: MinifyFeature[];
}

export declare interface MinifyFeature {

    ordering: number;
    register: (options: MinifyFeatureOptions | ParserOptions) => void;
    run: (ast: AstRule | AstAtRule, options: ParserOptions, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }) => void;
}

export declare interface ResolvedPath {
    absolute: string;
    relative: string;
}

export declare interface RenderOptions {

    minify?: boolean;
    beautify?: boolean;
    removeEmpty?: boolean;
    expandNestingRules?: boolean;
    preserveLicense?: boolean;
    sourcemap?: boolean;
    indent?: string;
    newLine?: string;
    removeComments?: boolean;
    convertColor?: boolean;
    withParents?: boolean;
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
    map?: SourceMap
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
}

export declare interface TokenizeResult {
    token: string;
    len: number;
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
