import type { VisitorNodeMap } from "./visitor.d.ts";
import type { AstAtRule, AstDeclaration, AstNode, AstRule, AstStyleSheet, Location } from "./ast.d.ts";
import { SourceMap } from "../lib/renderer/sourcemap/sourcemap.ts";
import type { PropertyListOptions } from "./parse.d.ts";
import { EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, ValidationLevel } from "../lib/ast/types.ts";
import type { CssVariableToken, Token } from "./token.d.ts";
import { FeatureWalkMode } from "../lib/ast/features/type.ts";
import { mathFuncs } from "../lib/syntax/constants.ts";
import { ValidationToken } from "../lib/validation/parser/types";

export * from "./ast.d.ts";
export * from "./token.d.ts";
export * from "./shorthand.d.ts";
export * from "./config.d.ts";
export * from "./visitor.d.ts";
export * from "./walker.d.ts";
export * from "./parse.d.ts";

/**
 * Error description
 */
export declare interface ErrorDescription {
    /**
     *  Drop rule or declaration
     */

    action: "drop" | "ignore";
    /**
     * Error message
     */
    message: string;
    /**
     * Syntax error description
     */
    syntax?: string | ValidationToken | null;
    /**
     * Error node
     */
    node?: Token | AstNode | null;
    /**
     * Error location
     */
    location?: Location;
    /**
     * Error object
     */
    error?: Error;
    /**
     * Raw tokens
     */
    rawTokens?: TokenizeResult[];
}

/**
 * CSS validation options
 */
export interface ValidationOptions {
    /**
     * Nested rule context
     * @private
     */
    nestedRule?: boolean;

    /**
     * Enable CSS validation. Using ValidationLevel as value is deprecated and will be removed
     *
     * see {@link ValidationLevel}
     */
    validation?: boolean | ValidationLevel;

    /**
     * Lenient validation. retain nodes that failed validation
     */
    lenient?: boolean;

    /**
     * Visited tokens
     *
     * @private
     */
    visited?: Map<Token, Set<ValidationToken>>;

    /**
     * Is optional
     *
     * @private
     */
    isOptional?: boolean | null;

    /**
     * Is repeatable
     *
     * @private
     */
    isRepeatable?: boolean | null;

    /**
     * Is list
     *
     * @private
     */
    isList?: boolean | null;

    /**
     * Occurence
     *
     * @private
     */
    occurrence?: boolean | null;

    /**
     * At least once
     *
     * @private
     */
    atLeastOnce?: boolean | null;
}

/**
 * Minify options
 */
export interface MinifyOptions {
    /**
     * Enable minification
     */
    minify?: boolean;
    /**
     * Parse color tokens
     */
    parseColor?: boolean;
    /**
     * Generate nested rules
     */
    nestingRules?: boolean;
    /**
     * Remove duplicate declarations from the same rule. if passed as a string array, duplicated declarations are removed, except for those in the array
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
     * Compute shorthand properties
     */
    computeShorthand?: boolean;
    /**
     * Compute css transform functions
     */
    computeTransform?: boolean;
    /**
     * Compute css math functions
     */
    computeCalcExpression?: boolean;
    /**
     * Inline css variables
     */
    inlineCssVariables?: boolean;
    /**
     * Remove empty ast nodes
     */
    removeEmpty?: boolean;
    /**
     * Remove css prefix
     */
    removePrefix?: boolean;
    /**
     * Define minification passes.
     */
    pass?: number;
}

/**
 * Result of options.load() function call.
 */
export declare type LoadResult =
    | Promise<ReadableStream<Uint8Array>>
    | ReadableStream<Uint8Array>
    | string
    | Promise<string>;

/**
 * CSS module parser options
 */
export declare interface ModuleOptions {
    /**
     * Use local scope vs global scope
     */
    scoped?: boolean | ModuleScopeEnumOptions;

    /**
     * Module output file path. it is used to generate the scoped name. if not provided, [options.src](../docs/interfaces/node.ParserOptions.html#src) will be used
     */
    filePath?: string;

    /**
     * Generated scope hash length. the default is 5
     */
    hashLength?: number;

    /**
     * The pattern used to generate scoped names. the supported placeholders are:
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
    naming?: ModuleCaseTransformEnum;

    /**
     * Function to generate scoped name
     * @param localName
     * @param filePath
     * @param pattern see {@link ModuleOptions.pattern}
     * @param hashLength
     */
    generateScopedName?: (
        localName: string,
        filePath: string,
        pattern: string,
        hashLength?: number,
    ) => string | Promise<string>;
}

export declare interface ParseInputFileOptions {
    file: string;
    asStream?: boolean;
}

export declare interface ParseInputStreamOptions {
    input: string | ReadableStream<Uint8Array>;
}

/**
 * Parser options
 */
export declare interface ParserOptions
    extends MinifyOptions, MinifyFeatureOptions, ValidationOptions, PropertyListOptions {
    /**
     * Source file to be used for sourcemap
     */
    src?: string;
    /**
     * Include sourcemap in the ast. Sourcemap info is always generated
     */
    sourcemap?: boolean | "inline";
    /**
     * Remove at-rule charset
     */
    removeCharset?: boolean;
    /**
     * Resolve import
     */
    resolveImport?: boolean;
    /**
     * Current working directory
     *
     * @internal
     */
    cwd?: string;
    /**
     * Expand nested rules
     */
    expandNestingRules?: boolean;

    /**
     * Experimental, convert css if() function into legacy syntax.
     */
    expandIfSyntax?: boolean;

    /**
     * Custom URL and file loader.
     * @param url
     * @param currentDirectory
     * @param responseType
     *
     */
    load?: (
        url: string | { absolute: string; relative: string },
        currentDirectory: string,
        responseType?: boolean | ResponseType,
    ) => Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;
    /**
     * Get directory name
     * @param path
     *
     * @private
     */
    dirname?: (path: string) => string;
    /**
     * Resolve urls
     */
    resolveUrls?: boolean;
    /**
     * Url and path resolver
     * @param url
     * @param currentUrl
     * @param currentWorkingDirectory
     *
     */
    resolve?: (
        url: string,
        currentUrl: string,
        currentWorkingDirectory?: string,
    ) => {
        absolute: string;
        relative: string;
    };

    /**
     * Node visitor
     * {@link VisitorNodeMap | VisitorNodeMap[]}
     */
    visitor?: VisitorNodeMap | VisitorNodeMap[];
    /**
     * Abort signal
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
     * Set parent node
     *
     * @private
     */
    setParent?: boolean;
    /**
     * Cache
     *
     * @private
     */
    cache?: WeakMap<AstNode, string>;

    /**
     * CSS modules options
     */
    module?: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions;

    /**
     * Tokenizing info
     * @private
     */
    parseInfo?: ParseInfo;
}

/**
 * Minify feature options
 *
 * @internal
 */
export declare interface MinifyFeatureOptions {
    /**
     * Minify features
     *
     * @private
     */
    features?: MinifyFeature[];
}

/**
 * Minify feature
 *
 * @internal
 */
export declare interface MinifyFeature {
    /**
     * Accepted tokens
     */
    accept?: Set<EnumToken>;

    /**
     * Ordering
     */
    ordering: number;
    /**
     * Process mode
     */
    processMode: FeatureWalkMode;
    /**
     * Register feature
     * @param options
     */
    register: (options: MinifyFeatureOptions | ParserOptions) => void;
    /**
     * Run feature
     * @param ast
     * @param options
     * @param parent
     * @param context
     * @param mode
     */
    run: (
        ast: AstRule | AstAtRule,
        options: ParserOptions,
        parent: AstRule | AstAtRule | AstStyleSheet,
        context: {
            [key: string]: any;
        },
        mode: FeatureWalkMode,
    ) => AstNode | null;
}

/**
 * Resolved path
 * @internal
 */
export declare interface ResolvedPath {
    /**
     * Absolute path
     */
    absolute: string;
    /**
     * Relative path
     */
    relative: string;
}

/**
 * Ast node render options
 */
export declare interface RenderOptions {
    /**
     * Minify css values.
     */
    minify?: boolean;
    /**
     * Pretty print css
     *
     * ```ts
     * const result = await transform(css, {beautify: true});
     * ```
     */
    beautify?: boolean;
    /**
     * Remove empty nodes. Empty nodes are removed by default
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
     * Expand nesting rules
     */
    expandNestingRules?: boolean;
    /**
     * Preserve license comments. License comments are comments that start with '/*!'
     */
    preserveLicense?: boolean;
    /**
     * Generate sourcemap object. 'inline' will embed it in the css
     */
    sourcemap?: boolean | "inline";
    /**
     * Indention string
     */
    indent?: string;
    /**
     * New line string
     */
    newLine?: string;
    /**
     * Remove comments
     */
    removeComments?: boolean;
    /**
     * Convert color to the specified color space. 'true' will convert to HEX
     */
    convertColor?: boolean | ColorType;
    /**
     * Render the node along with its parents
     */
    withParents?: boolean;
    /**
     * Output file. Used for url resolution
     * @internal
     */
    output?: string;
    /**
     * Current working directory
     * @internal
     */
    cwd?: string;
    /**
     * Resolve path
     * @internal
     */
    resolve?: (url: string, currentUrl: string, currentWorkingDirectory?: string) => ResolvedPath;
}

/**
 * Transform options
 */
export declare interface TransformOptions extends ParserOptions, RenderOptions {}

/**
 * Parse result stats object
 */
export declare interface ParseResultStats {
    /**
     * Source file
     */
    src: string;
    /**
     * Bytes read
     */
    bytesIn: number;
    /**
     * Bytes read from imported files
     */
    importedBytesIn: number;

    /**
     * Tokenizing processing time
     */

    tokenize: string;
    /**
     * Parsing processing time
     */
    parse: string;
    /**
     * Minification processing time
     */
    minify: string;
    /**
     * Module processing time
     */
    module?: string;
    /**
     * Total time
     */
    total: string;
    /**
     * Imported files stats
     */
    imports: ParseResultStats[];

    /**
     * Nodes count
     */
    nodesCount: number;

    /**
     * Tokens count
     */
    tokensCount: number;
}

/**
 * Parse result object
 */
export declare interface ParseResult {
    /**
     * Parsed ast tree
     */
    ast: AstStyleSheet;
    /**
     * Parse errors
     */
    errors: ErrorDescription[];
    /**
     * Parse stats
     */
    stats: ParseResultStats;

    /**
     * CSS module mapping
     */
    mapping?: Record<string, string>;

    /**
     * CSS module variables
     * @private
     */
    cssModuleVariables?: Record<string, CssVariableToken>;

    /**
     * css module import mapping
     * @private
     */
    importMapping?: Record<string, Record<string, string>>;

    /**
     * CSS module reverse mapping
     * @private
     */
    revMapping?: Record<string, string>;
}

/**
 * Render result object
 */
export declare interface RenderResult {
    /**
     * Rendered CSS
     */
    code: string;
    /**
     * Render errors
     */
    errors: ErrorDescription[];
    /**
     * Render stats
     */
    stats: {
        /**
         * Render time
         */
        total: string;
    };
    /**
     * Source map
     */
    map?: SourceMap;
}

/**
 * Transform result object
 */
export declare interface TransformResult extends ParseResult, RenderResult {
    /**
     * Transform stats
     */
    stats: {
        /**
         * Source file
         */
        src: string;
        /**
         * Bytes read
         */
        bytesIn: number;
        /**
         * Generated CSS size
         */
        bytesOut: number;
        /**
         * Bytes read from imported files
         */
        importedBytesIn: number;
        /**
         * Parse time
         */
        parse: string;
        /**
         * Minify time
         */
        minify: string;
        /**
         * Render time
         */
        render: string;
        /**
         * Total time
         */
        total: string;
        /**
         * Imported files stats
         */
        imports: ParseResultStats[];
    };
}

/**
 * Parse token options
 */
export declare interface ParseTokenOptions extends ParserOptions {}

/**
 * Tokenize result object
 * @internal
 */
export declare interface TokenizeResult {
    /**
     * Token
     */
    token: Token;
    /**
     * Bytes in
     */
    bytesIn: number;
}

/**
 * Matched selector object
 * @internal
 */
export declare interface MatchedSelector {
    /**
     * Matched selector
     */
    match: string[][];
    /**
     * Selector 1
     */
    selector1: string[][];
    /**
     * Selector 2
     */
    selector2: string[][];
    /**
     * Selectors partially match
     */
    eq: boolean;
}

/**
 * Variable scope info object
 * @internal
 */
export declare interface VariableScopeInfo {
    /**
     * Global scope
     */
    globalScope: boolean;
    /**
     * Parent nodes
     */
    parent: Set<AstRule | AstAtRule>;
    /**
     * Declaration count
     */
    declarationCount: number;
    /**
     * Replaceable
     */
    replaceable: boolean;
    /**
     * Declaration node
     */
    node: AstDeclaration;
    /**
     * Declaration values
     */
    values: Token[];
}

/**
 * Source map object
 * @internal
 */
export declare interface SourceMapObject {
    /**
     * Source map version
     */
    version: number;
    /**
     * Source file
     */
    file?: string;
    /**
     * Source root
     */
    sourceRoot?: string;
    /**
     * Source files
     */
    sources?: string[];
    /**
     * Source files content
     */
    sourcesContent?: Array<string | null>;
    /**
     * Variable names
     */
    names?: string[];
    /**
     * Mappings
     */
    mappings: string;
}
