import type {VisitorNodeMap} from "./visitor.d.ts";
import type {AstAtRule, AstDeclaration, AstNode, AstRule, AstStyleSheet, Location, Position} from "./ast.d.ts";
import {SourceMap} from "../lib/renderer/sourcemap/index.ts";
import type {PropertyListOptions} from "./parse.d.ts";
import {ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, ValidationLevel} from "../lib/index.ts";
import type {CssVariableToken, Token} from "./token.d.ts";
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
    occurrence?: boolean | null;
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
     * remove duplicate declarations from the same rule. if passed as a string array, duplicated declarations are removed, except for those in the array
     *
     *
     * ```ts
     *
     * import {transform} from '@tbela99/css-parser';
     *
     * const css = `
     *
     * .table {
     *
     *     width: 100%;
     *     width: calc(100% + 40px);
     *     margin-left: 20px;
     *     margin-left: min(100% , 20px)
     * }
     *
     * `;
     * const result = await transform(css, {
     *
     *     beautify: true,
     *     validation: true,
     *     removeDuplicateDeclarations: ['width']
     * }
     * );
     *
     * console.log(result.code);
     *
     * ```
     */
    removeDuplicateDeclarations?: boolean | string | string[];
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
     * remove css prefix
     */
    removePrefix?: boolean;
    /**
     * define minification passes.
     */
    pass?: number;
}

export declare type LoadResult =
    Promise<ReadableStream<Uint8Array>>
    | ReadableStream<Uint8Array>
    | string
    | Promise<string>;

export declare interface ModuleOptions {

    /**
     * use local scope vs global scope
     */
    scoped?: boolean | ModuleScopeEnumOptions;

    /**
     * module output file path. it is used to generate the scoped name. if not provided, [options.src](../docs/interfaces/node.ParserOptions.html#src) will be used
     */
    filePath?: string;

    /**
     * generated scope hash length. the default is 5
     */
    hashLength?: number;

    /**
     * the pattern use to generate scoped names. the supported placeholders are:
     * - name: the file base name without the extension
     * - hash: the file path hash
     * - local: the local name
     * - path: the file path
     * - folder: the folder name
     * - ext: the file extension
     *
     * the pattern can optionally have a maximum number of characters:
     * ```
     * pattern: '[local:2]-[hash:5]'
     * ```
     * the hash pattern can take an algorithm, a maximum number of characters or both:
     * ```
     * pattern: '[local]-[hash:base64:5]'
     * ```
     * or
     * ```
     * pattern: '[local]-[hash:5]'
     * ```
     * or
     * ```
     * pattern: '[local]-[hash:sha1]'
     * ```
     *
     * supported hash algorithms are:
     * - base64
     * - hex
     * - base64url
     * - sha1
     * - sha256
     * - sha384
     * - sha512
     *
     * ```typescript
     *
     * import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
     * import type {TransformResult} from '@tbela99/css-parser';
     * css = `
     * :local(.className) {
     *   background: red;
     *   color: yellow;
     * }
     *
     * :local(.subClass) {
     *   composes: className;
     *   background: blue;
     * }
     * `;
     *
     * let result: TransformResult = await transform(css, {
     *
     *     beautify:true,
     *     module: {
     *         pattern: '[local]-[hash:sha256]'
     *     }
     *
     * });
     *
     * console.log(result.code);
     * ```
     * generated css
     *
     * ```css
     * .className-b629f {
     *  background: red;
     *  color: #ff0
     * }
     * .subClass-a0c35 {
     *  background: blue
     * }
     * ```
     */
    pattern?: string;

    /**
     * optional. function change the case of the scoped name and the class mapping
     *
     * - {@link ModuleCaseTransformEnum.IgnoreCase}: do not change case
     * - {@link ModuleCaseTransformEnum.CamelCase}: camelCase {@link ParseResult.mapping} key name
     * - {@link ModuleCaseTransformEnum.CamelCaseOnly}: camelCase {@link ParseResult.mapping} key name and the scoped class name
     * - {@link ModuleCaseTransformEnum.DashCase}: dashCase {@link ParseResult.mapping} key name
     * - {@link ModuleCaseTransformEnum.DashCaseOnly}: dashCase {@link ParseResult.mapping} key name and the scoped class name
     *
     */
    naming?: ModuleCaseTransformEnum,

    /**
     * optional function to generate scoped name
     * @param localName
     * @param filePath
     * @param hashLength
     * @param pattern see {@link ModuleOptions.pattern}
     */
    generateScopedName?: (
        localName: string,
        filePath: string,
        pattern: string,
        hashLength?: number
    ) => string | Promise<string>;
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
     * remove at-rule charset
     */
    removeCharset?: boolean;
    /**
     * resolve import
     */
    resolveImport?: boolean;
    /**
     * current working directory
     *
     * @internal
     */
    cwd?: string;
    /**
     * expand nested rules
     */
    expandNestingRules?: boolean;
    /**
     * url and file loader
     * @param url
     * @param currentUrl
     * @param asStream
     *
     */
    load?: (url: string, currentUrl?: string, asStream?: boolean) => LoadResult;
    /**
     * get directory name
     * @param path
     *
     * @private
     */
    dirname?: (path: string) => string;
    /**
     * resolve urls
     */
    resolveUrls?: boolean;
    /**
     * url and path resolver
     * @param url
     * @param currentUrl
     * @param currentWorkingDirectory
     *
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => {
        absolute: string;
        relative: string;
    };

    /**
     * node visitor
     * {@link VisitorNodeMap | VisitorNodeMap[]}
     */
    visitor?: VisitorNodeMap | VisitorNodeMap[];
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
     *
     * @private
     */
    setParent?: boolean;
    /**
     * cache
     *
     * @private
     */
    cache?: WeakMap<AstNode, string>;

    /**
     * css modules options
     */
    module?: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions
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
     * @private
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
     * accepted tokens
     */
    accept?: Set<EnumToken>;

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
    run: (ast: AstRule | AstAtRule, options: ParserOptions, parent: AstRule | AstAtRule | AstStyleSheet, context: {
        [key: string]: any
    }, mode: FeatureWalkMode) => AstNode | null;
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
     * minify css values.
     */
    minify?: boolean;
    /**
     * pretty print css
     *
     * ```ts
     * const result = await transform(css, {beautify: true});
     * ```
     */
    beautify?: boolean;
    /**
     * remove empty nodes. empty nodes are removed by default
     *
     * ```ts
     *
     * const css = `
     * @supports selector(:-ms-input-placeholder) {
     *
     * :-ms-input-placeholder {
     *
     * }
     * }`;
     * const result = await transform(css, {removeEmpty: false});
     * ```
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
     * render the node along with its parents
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
     * parse processing time
     */
    parse: string;
    /**
     * minify processing time
     */
    minify: string;
    /**
     * module processing time
     */
    module?: string;
    /**
     * total time
     */
    total: string;
    /**
     * imported files stats
     */
    imports: ParseResultStats[],

    /**
     * nodes count
     */
    nodesCount: number;

    /**
     * tokens count
     */
    tokensCount: number;
}

/**
 * parse result object
 */
export declare interface ParseResult {
    /**
     * parsed ast tree
     */
    ast: AstStyleSheet;
    /**
     * parse errors
     */
    errors: ErrorDescription[];
    /**
     * parse stats
     */
    stats: ParseResultStats;

    /**
     * css module mapping
     */
    mapping?: Record<string, string>;

    cssModuleVariables?: Record<string, CssVariableToken>;

    importMapping?: Record<string, Record<string, string>>;

    /**
     * css module reverse mapping
     * @private
     */
    revMapping?: Record<string, string>;
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
