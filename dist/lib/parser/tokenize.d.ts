import type { ParseInfo, Position, Token, TokenizeResult } from "../../@types/index.d.ts";
import { EnumToken } from "../ast/types.ts";
export declare const SymbolsMapTokens: Record<string, EnumToken>;
export declare const hintsEnum: Set<EnumToken>;
export declare const enum TokenMap {
    EXCLAMATION = 33,// '!', EXCLAMATION
    SLASH = 47,// '/'
    LOWERTHAN = 60,// '<', LESS THAN
    HASH = 35,// '#', HASH
    REVERSE_SOLIDUS = 92,// '\', REVERSE SOLIDUS
    DOUBLE_QUOTE = 34,// '"', DOUBLEQ
    SINGLE_QUOTE = 39,// "'", SINGLEQ
    DOT = 46,// '.', DOT
    AT = 64
}
export declare function consumeString(quoteStr: '"' | "'", buffer: string, parseInfo: ParseInfo): Array<TokenizeResult>;
export declare function getTokenType(val: string, hint?: EnumToken): Token;
export declare function yieldResult(val: string, parseInfo: ParseInfo, hint?: EnumToken): TokenizeResult;
export declare function match(parseInfo: ParseInfo, input: string): boolean;
export declare function peek(parseInfo: ParseInfo, count?: number): string;
export declare function prev(parseInfo: ParseInfo): string;
export declare function next(parseInfo: ParseInfo, count?: number): string;
/**
 * tokenize css string
 * @param parseInfo
 * @param yieldEOFToken
 */
export declare function tokenize(parseInfo: ParseInfo | string, yieldEOFToken?: boolean): Array<TokenizeResult>;
/**
 * tokenize readable stream
 * @param input
 */
export declare function tokenizeStream(input: ReadableStream<Uint8Array>, parseInfo?: ParseInfo): AsyncGenerator<TokenizeResult>;
/**
 * Update position
 * @param position
 * @param str
 */
export declare function move(position: Position, str: string): void;
