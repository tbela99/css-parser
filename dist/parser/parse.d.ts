import { EnumToken, ModuleCaseTransformEnum } from "../ast/types.ts";
import { Tokenizer } from "./tokenize.ts";
import { AstArena } from "../ast/arena.ts";
import type { AstComment, AstDeclaration, AstNode, ErrorDescription, ParseResult, ParserOptions, ParserSyncOptions, Token } from "../@types/index.d.ts";
import { SourceFile } from "./source.ts";
export declare const trimWhiteSpace: EnumToken[];
/**
 * Short-scoped name generator.
 *
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @returns string
 */
export declare const getShortNameGenerator: (...args: any[]) => any;
/**
 * Transform case of key name
 * @param key
 * @param how
 *
 * @throws Error
 * @private
 */
export declare const getKeyName: (key: string, how: ModuleCaseTransformEnum) => string;
/**
 * Generate scoped name
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @throws Error
 * @private
 */
export declare const generateScopedName: (localName: string, filePath: string, pattern: string, hashLength?: number) => Promise<string>;
export declare const generateSyncScopedName: (localName: string, filePath: string, pattern: string, hashLength?: number) => string;
/**
 * Parse css string
 * @param tokenizer
 * @param options
 *
 * @throws Error
 * @private
 */
export declare function doParseSync(tokenizer: Tokenizer, options?: ParserSyncOptions): ParseResult;
/**
 * Parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
export declare function doParse(iter: Tokenizer | Promise<Tokenizer>, options?: ParserOptions): Promise<ParseResult>;
/**
 * true if the node is an at-rule whose block is kept when it is empty: `@apply --mixin {}`, `@mixin --name {}`,
 * `@function --name() {}`
 * @param arena
 * @param node
 */
export declare function isDefinitionBlock(arena: AstArena, node: AstNode): boolean;
/**
 * @param arena
 * @param stream
 * @param context
 * @param options
 * @param errors
 * @param parseAsBlock
 */
export declare function parseAtRule(arena: AstArena, stream: Token[], context: AstNode, options: ParserOptions, errors: ErrorDescription[], parseAsBlock?: boolean | null): AstNode | null;
/**
 * Parse a string as an array of declaration nodes.
 * The nodes are allocated in the given arena, or in a new arena when none is provided
 * @param declaration
 * @param arena
 *
 * Example:
 * ````ts
 *
 * const {arena, nodes} = parseDeclarations('color: red; background: blue');
 * console.log(nodes.map((node) => arena.toObject(node)));
 * ```
 */
export declare function parseDeclarations(declaration: string, arena?: AstArena): {
    arena: AstArena;
    nodes: Array<AstDeclaration | AstComment>;
};
/**
 * Parse a string as the content of a style rule: declarations, nested rules and at-rules. the nested rules are
 * relative to the style rule (`&`). the nodes are allocated in the arena and detached, the comments are dropped
 * @param content
 * @param arena
 * @param options parser options: `parseColor`
 *
 * @internal
 */
export declare function parseRuleContent(content: string, arena: AstArena, options?: Pick<ParserOptions, "parseColor">): AstNode[];
/**
 * Parse css string and return an array of tokens
 * @param arena
 * @param src
 * @param options
 *    - parseColor: parse identifiers as colors
 *    - src: source url used for source map
 * @param errors capture parse errors in the provided array

 *
 * Example:
 *
 * ```ts
 *
 * import {parseString} from '@tbela99/css-parser';
 *
 * const arena = new AstArena();
 * let tokens = parseString(arena, 'body { color: red; }');
 * console.log(tokens.map((token) => arena.toObject(token)));
 *
 * tokens = parseString(arena, '#c322c980');
 * console.log(tokens.map((token) => arena.toObject(token)));
 * ```
 */
export declare function parseString(arena: AstArena, src: string, options?: {
    src?: string;
    parseColor?: boolean;
} | null, errors?: ErrorDescription[]): Token[];
/**
 * Parse function tokens in a token array
 * @param arena
 * @param tokens
 * @param options
 *    - parseColor: parse identifiers as colors
 * @param errors parse errors
 *
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString, parseTokens} from '@tbela99/css-parser';
 *
 * let tokens = parseString(arena, 'body { color: red; }');
 * console.log(parseTokens(arena, tokens));
 *
 *  tokens = parseString(arena, '#c322c980');
 * console.log(parseTokens(arena, tokens));
 * ```
 *
 * @private
 */
export declare function parseTokens(arena: AstArena, tokens: Token[], options?: {
    parseColor?: boolean;
    source?: SourceFile;
} | null, errors?: ErrorDescription[]): Token[];
