import type { ParseResult, ParserOptions, ParserSyncOptions } from "../@types/index.d.ts";
/**
 * parse result. process input sourcemap
 * @param result
 * @param options
 * @returns
 * @private
 */
export declare function parseResult(result: ParseResult, options: ParserOptions): ParseResult;
/**
 *
 * @param options
 * @param prefix
 * @private
 */
export declare function validateSyncArguments(options: ParserSyncOptions, prefix?: string): void;
