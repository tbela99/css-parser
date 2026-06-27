import { EnumToken } from "../ast/types.ts";
import type { AstAtRule, AstComment, AstDeclaration, AstInvalidAtRule, AstRule, AstStyleSheet, CssVariableImportTokenType, CssVariableToken, ErrorDescription, ParseResult, ParserOptions, ParseTokenOptions, Token, TokenizeResult } from "../../@types/index.d.ts";
export declare const trimWhiteSpace: EnumToken[];
export declare const atRulesMap: Map<string, EnumToken>;
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
export declare const getKeyName: (...args: any[]) => any;
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
export declare const generateScopedName: (...args: any[]) => any;
/**
 * Parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
export declare function doParse(iter: Array<TokenizeResult> | Iterable<TokenizeResult> | AsyncGenerator<TokenizeResult>, options?: ParserOptions): Promise<ParseResult>;
/**
 * @param options
 * @param errors
 * @param parseAsBlock
 */
export declare function parseAtRule(stream: Token[], context: AstRule | AstAtRule | AstStyleSheet, options: ParserOptions, errors: ErrorDescription[], parseAsBlock?: boolean | null): AstAtRule | AstInvalidAtRule | CssVariableImportTokenType | CssVariableToken | null;
/**
 * Parse a string as an array of declaration nodes
 * @param declaration
 *
 * Example:
 * ````ts
 *
 * const declarations = await parseDeclarations('color: red; background: blue');
 * console.log(declarations);
 * ```
 */
export declare function parseDeclarations(declaration: string): Promise<Array<AstDeclaration | AstComment>>;
/**
 * Parse css string and return an array of tokens
 * @param src
 * @param options
 *
 * @private
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(tokens);
 *
 *  tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
export declare function parseString(src: string, options?: {
    location: boolean;
    src?: string;
}): Token[];
/**
 * Parse function tokens in a token array
 * @param tokens
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString, parseTokens} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(parseTokens(tokens));
 *
 *  tokens = parseString('#c322c980');
 * console.log(parseTokens(tokens));
 * ```
 *
 * @private
 */
export declare function parseTokens(tokens: Token[], options?: ParseTokenOptions): Token[];
