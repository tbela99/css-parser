import { ParseResult, ParserOptions, ParseTokenOptions, Token } from "../../@types";
export declare const urlTokenMatcher: RegExp;
export declare function doParse(iterator: string, options?: ParserOptions): Promise<ParseResult>;
export declare function parseString(src: string, options?: {
    location: boolean;
}): Token[];
export declare function parseTokens(tokens: Token[], options?: ParseTokenOptions): Token[];
