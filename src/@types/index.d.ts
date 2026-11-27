import type {
    GenericVisitorAstNodeHandlerMap,
    GenericVisitorAstNodeSyncHandlerMap,
    VisitorNodeMap,
    VisitorSyncNodeMap,
} from "./visitor.d.ts";
import type { AstAtRule, AstDeclaration, AstNode, AstRule, AstStyleSheet } from "./ast.d.ts";
import { SourceMap } from "../printer/sourcemap.ts";
import type { ParseInfo, PropertyListOptions } from "./parse.d.ts";
import { ColorType, EnumToken, MergeRulesEnum, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from "../ast/types.ts";
import type { Token } from "./token.d.ts";
import type { AstArenaNode } from "../ast/arena-node.ts";
import { FeatureWalkMode } from "../ast/features/type.ts";
import type { ValidationToken } from "../validation/parser/types.d.ts";
import { SourceFile } from "../parser/source.ts";
import type { CssInput } from "../parser/input.ts";
import { ResponseType } from "../types.ts";
import type { AstArena } from "../ast/arena.ts";

export type * from "./ast.d.ts";
export type * from "./token.d.ts";
export type * from "./shorthand.d.ts";
export type * from "./visitor.d.ts";
export type * from "./walker.d.ts";
export type * from "./parse.d.ts";

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
    location?: [string | null, number, number];
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
     * Enable CSS validation
     */
    validation?: boolean;

    /**
     * Lenient validation. retain nodes that failed validation
     */
    lenient?: boolean;

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
     * enable ast minification
     */
    minifyAST?: boolean;
    
    /**
     * Parse color tokens
     */
    parseColor?: boolean;
    /**
     * Generate nested rules
     */
    nestingRules?: boolean;
    /**
     * Merge the adjacent rules ({@link MergeRulesEnum}, `true` is a shortcut for {@link MergeRulesEnum.All}, `false`
     * for {@link MergeRulesEnum.None}).
     *
     * - {@link MergeRulesEnum.All}: the rules that share declarations are merged when the output is smaller
     * - {@link MergeRulesEnum.Identical}: only the rules that have the same declarations are merged, the size of the
     *   output is not computed: `.a{color:red}.b{color:red}` is merged into `.a,.b{color:red}`
     * - {@link MergeRulesEnum.None}: the rules that have different selectors are not merged
     *
     * The default is {@link MergeRulesEnum.All} when the ast is minified, {@link MergeRulesEnum.None} otherwise. With
     * `minify: false`, {@link MergeRulesEnum.Identical} and {@link MergeRulesEnum.All} merge the rules without
     * minifying the ast: the adjacent rules and keyframes rules that have the same selector and the adjacent at-rules
     * that have the same prelude are merged (`@font-face` is not merged), the last `@keyframes` of a name is kept, the
     * rules that have different selectors are merged as above. The other minifications are not applied.
     *
     * ```ts
     * import {transformSync, MergeRulesEnum} from '@tbela99/css-parser';
     *
     * // the adjacent rules that have the same declarations are merged, the ast is not minified
     * const result = transformSync(css, {minify: false, mergeRules: MergeRulesEnum.Identical});
     * ```
     */
    mergeRules?: boolean | MergeRulesEnum;
    /**
     * Fast mode: the ast is not minified and the rules are not merged, the values are minified when they are
     * rendered. The output is larger and the minification is faster. It sets the default value of these options, an option given
     * explicitly takes precedence:
     *
     * ```ts
     * {
     *     minify: false,
     *     mergeRules: MergeRulesEnum.None,
     * }
     * ```
     *
     * ```ts
     * import {transformSync} from '@tbela99/css-parser';
     *
     * const result = transformSync(css, {fastMode: true});
     * ```
     */
    fastMode?: boolean;
    /**
     * Optimize the selectors (default `true`): remove the redundant selectors, factor the selectors with `:is()`.
     * `false` only applies when {@link nestingRules} is `false`: the nesting of the rules reads the optimized selectors.
     */
    optimizeSelectors?: boolean;
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
     * Evaluate css mixins and custom functions: the `@apply` rules are replaced by the body of the mixin they reference,
     * the private variables (`@private`, mixin arguments and the custom properties of the rule) are substituted.
     * the custom function calls (`--fn(1px)`) are replaced by the result of the function.
     * see https://drafts.csswg.org/css-mixins-1/
     *
     * ```ts
     *
     * import {transform} from '@tbela99/css-parser';
     *
     * const css = `
     * @mixin --only-descs(--arg) {
     *   color: var(--arg);
     *   & * { color: var(--arg, red); }
     * }
     * .foo {
     *   @apply --only-descs(green);
     * }
     * `;
     *
     * const result = await transform(css, {evaluateMixins: true, expandNestingRules: true});
     *
     * console.log(result.code);
     * // .foo,.foo *{color:green}
     * ```
     */
    evaluateMixins?: boolean;
    /**
     * Keep the mixins and the custom functions once they are evaluated, see {@link evaluateMixins}.
     * By default, the evaluated mixins and custom functions, and the mixins that are not referenced, are dropped and
     * replaced with a comment
     */
    keepMixins?: boolean;
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
    | CssInput
    | Promise<CssInput>
    | object;

/**
 * CSS module parser options
 */
export declare interface ModuleSyncOptions {
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
     * @param pattern see {@link ModuleSyncOptions.pattern}
     * @param hashLength
     */
    generateScopedName?: (localName: string, filePath: string, pattern: string, hashLength?: number) => string;
}

/**
 * CSS modules options of the asynchronous functions
 */
export declare interface ModuleAsyncOptions extends Omit<ModuleSyncOptions, "generateScopedName"> {
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
     * Function to generate scoped name
     * @param localName
     * @param filePath
     * @param pattern see {@link ModuleSyncOptions.pattern}
     * @param hashLength
     */
    generateScopedName?: (
        localName: string,
        filePath: string,
        pattern: string,
        hashLength?: number,
    ) => string | Promise<string>;
}

/**
 * Input file options
 */
export declare interface ParseInputFileOptions {
    /**
     * File path or url
     */
    file: string;
    /**
     * Load file as stream
     */

    asStream?: boolean;
}

/**
 * Input options for string or stream
 */
export declare interface ParseInputOptions {
    /**
     * Input css: an ArrayBuffer or a view of an ArrayBuffer (utf-8, the preferred input), or a string
     */
    input: CssInput;
}
/**
 * Input options for string or stream
 */
export declare interface ParseInputStreamOptions {
    /**
     * Input css: an ArrayBuffer or a view of an ArrayBuffer (utf-8, the preferred input), a string or a stream
     */
    input: CssInput | ReadableStream<Uint8Array>;
}

/**
 * Input options for string or stream
 * @internal
 */
export declare interface ParseSourceOptions {
    /**
     * Source file to be used for sourcemap
     * @internal
     */
    sourcesMap?: Map<number, SourceFile>;
    /**
     * Source file to be used for sourcemap
     * @internal
     */
    source?: SourceFile | null;
    /**
     * Arena the ast nodes are allocated in. Created by the parser when omitted.
     * Nested parses (`@import`) allocate their nodes in the parent arena.
     */
    arena?: AstArena;
}

/**
 * Parser sourcemap options
 */
export declare interface ParserSourceMapOptions {
    /**
     * Include sourcemap in the ast. Sourcemap info is always generated
     */
    sourcemap?: boolean | "inline";
    /**
     * Input source map
     */
    inputSourceMap?: SourceMapObject | string;
}

/**
 * Sync parseroptions
 */
export declare interface ParserSyncOptions
    extends
        MinifyOptions,
        ParserSourceMapOptions,
        MinifyFeatureOptions,
        ValidationOptions,
        PropertyListOptions,
        ParseSourceOptions {
    /**
     * Source file to be used for sourcemap
     */
    src?: string;
    /**
     * Remove at-rule charset
     */
    removeCharset?: boolean;
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
        /**
         * Absolute path
         */
        absolute: string;
        /**
         * Relative path
         */
        relative: string;
    };

    /**
     * Node visitor
     * {@link VisitorSyncNodeMap | VisitorSyncNodeMap[]}
     */
    visitor?: GenericVisitorAstNodeSyncHandlerMap<any> | VisitorSyncNodeMap | VisitorSyncNodeMap[];
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
     * Rendered size of the nodes, in bytes
     *
     * @private
     */
    cache?: Map<AstNode, number>;

    /**
     * CSS modules options
     */
    module?: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleSyncOptions;

    /**
     * Tokenizing info
     * @private
     */
    parseInfo?: ParseInfo;
}

/**
 * Parser options
 */
export declare interface ParserOptions extends Omit<ParserSyncOptions, "visitor">, ModuleAsyncOptions {
    /**
     * Resolve import
     */
    resolveImport?: boolean;

    /**
     * Custom URL and file loader.
     * @param url
     * @param currentDirectory
     * @param responseType
     *
     */
    load?: (
        url: string | { absolute: string; relative: string },
        currentDirectory?: string,
        responseType?: boolean | ResponseType,
    ) => Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;

    /**
     * Node visitor
     * {@link VisitorNodeMap | VisitorNodeMap[]}
     */
    visitor?:
        | GenericVisitorAstNodeSyncHandlerMap<any>
        | GenericVisitorAstNodeHandlerMap<any>
        | VisitorNodeMap
        | VisitorNodeMap[];
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
        arena: AstArena,
        ast: AstRule | AstAtRule,
        options: ParserOptions,
        parent: AstRule | AstAtRule | AstStyleSheet,
        context: {
            [key: string]: any;
        },
        mode: FeatureWalkMode,
    ) => AstNode | AstNode[] | null;
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
     * Source file to be used as CSS input file for sourcemap resolution
     */
    src?: string;

    /**
     * strip comments and whitespace.
     */
    minify?: boolean;

    /**
     * Minify values
     */
    minifyValues?: boolean;

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

    /**
     * Source map
     * @internal
     */
    sourcesMap?: Map<number, SourceFile>;
}

/**
 * Transform options
 */
export declare interface TransformSyncOptions extends ParserSyncOptions, RenderOptions {}

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
     * Parsed ast tree: the id of the stylesheet node in {@link ParseResult.arena}
     */
    ast: AstStyleSheet;
    /**
     * arena the ast nodes are stored in
     */
    arena: AstArena;
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
    cssModuleVariables?: Record<string, AstArenaNode>;

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
 * Render stats
 */
export declare interface RenderResultStats {
    /**
     * Render time
     */
    total: string;
}

/**
 * Transform stats
 */
export declare interface TransformResultStats extends ParseResultStats {
    /**
     * Generated CSS size: the length of {@link TransformResult.code}
     */
    bytesOut: number;
    /**
     * Render time
     */
    render: string;
}

export { RenderResult, TransformResult } from "../printer/result.ts";

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
    sources?: Array<string | null>;
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
