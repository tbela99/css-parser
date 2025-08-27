import {VisitorNodeMap} from "./visitor.d.ts";
import {AstAtRule, AstDeclaration, AstNode, AstRule, AstRuleStyleSheet, Location, Position} from "./ast.d.ts";
import {SourceMap} from "../lib/renderer/sourcemap/index.ts";
import {PropertyListOptions} from "./parse.d.ts";
import {ColorType, EnumToken, ValidationLevel, ValidationToken} from "../lib/index.ts";
import type {Token} from "./token.d.ts";
import {FeatureWalkMode} from "../lib/ast/features/type.ts";

import {mathFuncs, transformFunctions} from "../lib/syntax/syntax.ts";

export {mathFuncs, transformFunctions} from '../lib/syntax/syntax.ts';

export * from './ast.d.ts';
export * from './token.d.ts';
export * from './shorthand.d.ts';
export * from './config.d.ts';
export * from './visitor.d.ts';
export * from './walker.d.ts';
export * from './parse.d.ts';


/**
 * error description
 */
export declare interface ErrorDescription {

    /**
     *  drop rule or declaration
     */

    action: 'drop' | 'ignore';
    /**
     * error message
     */
    message: string;
    /**
     * syntax error description
     */
    syntax?: string | null;
    /**
     * error node
     */
    node?: Token | AstNode | null;
    /**
     * error location
     */
    location?: Location;
    /**
     * error object
     */
    error?: Error;
    /**
     * raw tokens
     */
    rawTokens?: TokenizeResult[];
}

/**
 * css validation options
 */
export interface ValidationOptions {

    /**
     * enable css validation
     *
     * see {@link ValidationLevel}
     */
    validation?: boolean | ValidationLevel;
    /**
     * lenient validation. retain nodes that failed validation
     */
    lenient?: boolean;
    /**
     * visited tokens
     *
     * @private
     */
    visited?: WeakMap<Token, Map<string, Set<ValidationToken>>>;
    /**
     * is optional
     *
     * @private
     */
    isOptional?: boolean | null;
    /**
     * is repeatable
     *
     * @private
     */
    isRepeatable?: boolean | null;
    /**
     * is list
     *
     * @private
     */
    isList?: boolean | null;
    /**
     * occurence
     *
     * @private
     */
    occurence?: boolean | null;
    /**
     * at least once
     *
     * @private
     */
    atLeastOnce?: boolean | null;
}

/**
 * minify options
 */
export interface MinifyOptions {

    /**
     * enable minification
     */
    minify?: boolean;
    /**
     * parse color tokens
     */
    parseColor?: boolean;
    /**
     * generate nested rules
     */
    nestingRules?: boolean;
    /**
     * expand nested rules
     */
    expandNestingRules?: boolean;
    /**
     * remove duplicate declarations from the same rule
     */
    removeDuplicateDeclarations?: boolean;
    /**
     * compute shorthand properties
     */
    computeShorthand?: boolean;
    /**
     * compute transform functions
     * see supported functions {@link transformFunctions}
     */
    computeTransform?: boolean;
    /**
     * compute math functions
     * see supported functions {@link mathFuncs}
     */
    computeCalcExpression?: boolean;
    /**
     * inline css variables
     */
    inlineCssVariables?: boolean;
    /**
     * remove empty ast nodes
     */
    removeEmpty?: boolean;
    /**
     * define minification passes.
     */
    pass?: number;
}

/**
 * parser options
 */
export declare interface ParserOptions extends MinifyOptions, MinifyFeatureOptions, ValidationOptions, PropertyListOptions {

    /**
     * source file to be used for sourcemap
     */
    src?: string;
    /**
     * include sourcemap in the ast. sourcemap info is always generated
     */
    sourcemap?: boolean | 'inline';
    /**
     * remove @charset at-rule
     */
    removeCharset?: boolean;
    /**
     * resolve urls
     */
    resolveUrls?: boolean;
    /**
     * resolve import
     */
    resolveImport?: boolean;
    /**
     * current working directory
     * @ignore
     */
    cwd?: string;
    /**
     * remove css prefix
     */
    removePrefix?: boolean;
    /**
     * get file or url as stream
     * @param url
     * @param currentUrl
     *
     * @private
     */
    getStream?: (url: string, currentUrl: string) => Promise<ReadableStream<string>>;
    /**
     * get directory name
     * @param path
     *
     * @private
     */
    dirname?: (path: string) => string;
    /**
     * resolve path
     * @param url
     * @param currentUrl
     * @param currentWorkingDirectory
     *
     * @private
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string;
        relative: string;
    };
    /**
     * node visitor
     * {@link VisitorNodeMap}
     */
    visitor?: VisitorNodeMap;
    /**
     * abort signal
     *
     * Example: abort after 10 seconds
     * ```ts
     *
     * const result = await parse(cssString, {
     *     signal: AbortSignal.timeout(10000)
     * });
     *
     * ```
     */
    signal?: AbortSignal;
    /**
     * set parent node
     */
    setParent?: boolean;
    /**
     * cache
     *
     * @private
     */
    cache?: WeakMap<AstNode, string>;
}

/**
 * minify feature options
 *
 * @internal
 */
export declare interface MinifyFeatureOptions {

    /**
     * minify features
     *
     * @internal
     */
    features?: MinifyFeature[];
}

/**
 * minify feature
 *
 * @internal
 */
export declare interface MinifyFeature {

    /**
     * ordering
     */
    ordering: number;
    /**
     * process mode
     */
    processMode: FeatureWalkMode;
    /**
     * register feature
     * @param options
     */
    register: (options: MinifyFeatureOptions | ParserOptions) => void;
    /**
     * run feature
     * @param ast
     * @param options
     * @param parent
     * @param context
     * @param mode
     */
    run: (ast: AstRule | AstAtRule, options: ParserOptions, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }, mode: FeatureWalkMode) => void;
}

/**
 * resolved path
 * @internal
 */
export declare interface ResolvedPath {
    /**
     * absolute path
     */
    absolute: string;
    /**
     * relative path
     */
    relative: string;
}

/**
 * ast node render options
 */
export declare interface RenderOptions {

    /**
     * minify ast node.
     */
    minify?: boolean;
    /**
     * pretty print css
     */
    beautify?: boolean;
    /**
     * remove empty rule lists from the ast
     */
    removeEmpty?: boolean;
    /**
     * expand nesting rules
     */
    expandNestingRules?: boolean;
    /**
     * preserve license comments. license comments are comments that start with /*!
     */
    preserveLicense?: boolean;
    /**
     * generate sourcemap object. 'inline' will embed it in the css
     */
    sourcemap?: boolean | 'inline';
    /**
     * indent string
     */
    indent?: string;
    /**
     * new line string
     */
    newLine?: string;
    /**
     * remove comments
     */
    removeComments?: boolean;
    /**
     * convert color to the specified color space. 'true' will convert to HEX
     */
    convertColor?: boolean | ColorType;
    /**
     * ernder the node along with its parents
     */
    withParents?: boolean;
    /**
     * output file. used for url resolution
     * @internal
     */
    output?: string;
    /**
     * current working directory
     * @internal
     */
    cwd?: string;
    /**
     * resolve path
     * @internal
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResolvedPath;
}

/**
 * transform options
 */
export declare interface TransformOptions extends ParserOptions, RenderOptions {

}

/**
 * parse result stats object
 */
export declare interface ParseResultStats {
    /**
     * source file
     */
    src: string;
    /**
     * bytes read
     */
    bytesIn: number;
    /**
     * bytes read from imported files
     */
    importedBytesIn: number;
    /**
     * parse time
     */
    parse: string;
    /**
     * minify time
     */
    minify: string;
    /**
     * total time
     */
    total: string;
    /**
     * imported files stats
     */
    imports: ParseResultStats[]
}

/**
 * parse result object
 */
export declare interface ParseResult {
    /**
     * parsed ast tree
     */
    ast: AstRuleStyleSheet;
    /**
     * parse errors
     */
    errors: ErrorDescription[];
    /**
     * parse stats
     */
    stats: ParseResultStats
}

/**
 * render result object
 */
export declare interface RenderResult {
    /**
     * rendered css
     */
    code: string;
    /**
     * render errors
     */
    errors: ErrorDescription[];
    /**
     * render stats
     */
    stats: {
        /**
         * render time
         */
        total: string;
    },
    /**
     * source map
     */
    map?: SourceMap
}

/**
 * transform result object
 */
export declare interface TransformResult extends ParseResult, RenderResult {

    /**
     * transform stats
     */
    stats: {
        /**
         * source file
         */
        src: string;
        /**
         * bytes read
         */
        bytesIn: number;
        /**
         * generated css size
         */
        bytesOut: number;
        /**
         * bytes read from imported files
         */
        importedBytesIn: number;
        /**
         * parse time
         */
        parse: string;
        /**
         * minify time
         */
        minify: string;
        /**
         * render time
         */
        render: string;
        /**
         * total time
         */
        total: string;
        /**
         * imported files stats
         */
        imports: ParseResultStats[];
    }
}

/**
 * parse token options
 */
export declare interface ParseTokenOptions extends ParserOptions {
}

/**
 * tokenize result object
 * @internal
 */
export declare interface TokenizeResult {
    /**
     * token
     */
    token: string;
    /**
     * token length
     */
    len: number;
    /**
     * token type hint
     */
    hint?: EnumToken;
    /**
     * token start position
     */
    sta: Position;
    /**
     * token end position
     */
    end: Position;
    /**
     * bytes in
     */
    bytesIn: number;
}

/**
 * matched selector object
 * @internal
 */
export declare interface MatchedSelector {
    /**
     * matched selector
     */
    match: string[][];
    /**
     * selector 1
     */
    selector1: string[][];
    /**
     * selector 2
     */
    selector2: string[][];
    /**
     * selectors partially match
     */
    eq: boolean
}

/**
 * variable scope info object
 * @internal
 */
export declare interface VariableScopeInfo {
    /**
     * global scope
     */
    globalScope: boolean;
    /**
     * parent nodes
     */
    parent: Set<AstRule | AstAtRule>;
    /**
     * declaration count
     */
    declarationCount: number;
    /**
     * replaceable
     */
    replaceable: boolean;
    /**
     * declaration node
     */
    node: AstDeclaration;
    /**
     * declaration values
     */
    values: Token[];
}

/**
 * source map object
 * @internal
 */
export declare interface SourceMapObject {
    version: number;
    file?: string;
    sourceRoot?: string;
    sources?: string[];
    sourcesContent?: Array<string | null>;
    names?: string[];
    mappings: string;
}
