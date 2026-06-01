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
    AT = 64,// '@', AT
    PIPE = 124,// '|', PIPE
    EQUALS = 61,// '=', EQUALS
    AMPERSAND = 38,// '&', AMPERSAND
    STAR = 42,// '*', STAR
    TILDA = 126,// '~', TILDA
    CARET = 94,// '^', CARET
    DOLLAR = 36,// '$', DOLLAR
    COMMA = 44,// ',', COMMA
    COLON = 58,// ':', COLON
    SEMICOLON = 59,// ';', SEMICOLON
    LEFT_PARENTHESIS = 40,// '(', LEFT PARENTHESIS
    RIGHT_PARENTHESIS = 41,
    LEFT_BRACKETS = 91,// '[', LEFT_BRACKETS
    RIGHT_BRACKETS = 93,// ']', RIGHT_BRACKETS
    LEFT_BRACE = 123,// '{', LEFT_BRACE
    RIGHT_BRACE = 125,
    PLUS = 43,// '+', PLUS
    MINUS = 45,
    GREATERTHAN = 62
}
export declare function consumeString(quoteStr: '"' | "'", buffer: string, parseInfo: ParseInfo): Array<TokenizeResult>;
export declare function getTokenType(val: string, hint?: EnumToken): Token;
export declare function yieldResult(val: string, parseInfo: ParseInfo, hint?: EnumToken): TokenizeResult;
export declare function match(parseInfo: ParseInfo, input: string): boolean;
export declare function peek(parseInfo: ParseInfo, count?: number): string;
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
