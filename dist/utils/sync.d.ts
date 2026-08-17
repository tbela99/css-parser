import type { ParseResult, ParserOptions, ParserSyncOptions } from "../@types/index.js";
/**
 * parse result. process input sourcemap
 * @param result
 * @param options
 * @returns
 * @private
 */
export declare function parseResult(result: ParseResult, options: ParserOptions): ParseResult;
export declare function validateSyncArguments(options: ParserSyncOptions, prefix?: string): void;
