import { AstNode, ParseResult, ParserOptions, RenderOptions, RenderResult, TransformOptions, TransformResult } from "../@types";
import { resolve, dirname } from "../lib/fs";
import { load } from "./load";
export { minify, expand, parseString, parseTokens, renderToken, walk, walkValues, EnumToken } from '../lib';
export { dirname, resolve, load };
export declare function render(data: AstNode, options?: RenderOptions): RenderResult;
export declare function parse(iterator: string, opt?: ParserOptions): Promise<ParseResult>;
export declare function transform(css: string, options?: TransformOptions): Promise<TransformResult>;
