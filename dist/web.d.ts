import type { AstNode, ParseResult, ParserOptions, RenderOptions, RenderResult, TransformOptions, TransformResult } from "./@types/index.d.ts";
import { dirname, resolve } from "./lib/fs/resolve.ts";
import { ResponseType } from "./types.ts";
export type * from "./@types/index.d.ts";
export type * from "./@types/ast.d.ts";
export type * from "./@types/token.d.ts";
export type * from "./@types/parse.d.ts";
export type * from "./@types/validation.d.ts";
export type * from "./@types/walker.d.ts";
export type { AstNode, ParseResult, ParserOptions, RenderOptions, RenderResult, TransformOptions, TransformResult, } from "./@types/index.d.ts";
export { minify } from "./lib/ast/minify.ts";
export { expand } from "./lib/ast/expand.ts";
export { walk, walkValues, WalkerEvent, WalkerOptionEnum } from "./lib/ast/walk.ts";
export { parseString } from "./lib/parser/parse.ts";
export { renderValue as renderToken } from "./lib/renderer/render.ts";
export { convertColor } from "./lib/syntax/color/color.ts";
export { isOkLabClose, okLabDistance } from "./lib/syntax/color/utils/distance.ts";
export { parseDeclarations } from "./lib/parser/parse.ts";
export { find, findLast, findByValue, findAll } from "./lib/ast/find.ts";
export { cloneNode } from "./lib/ast/clone.ts";
export { replaceNodeOrValue } from "./lib/parser/utils/token.ts";
export { EnumToken, ColorType, ValidationLevel, ModuleScopeEnumOptions, ModuleCaseTransformEnum, } from "./lib/ast/types.ts";
export { SourceMap } from "./lib/renderer/sourcemap/sourcemap.ts";
export type { ValidationToken } from "./lib/validation/parser/types.d.ts";
export { FeatureWalkMode } from "./lib/ast/features/type.ts";
export { dirname, resolve, ResponseType };
/**
 * Load file or url
 * @param url
 * @param currentDirectory
 * @param responseType
 * @throws Error file not found
 *
 * ```ts
 * import {load, ResponseType} from '@tbela99/css-parser';
 * const result = await load(file, '.', ResponseType.ArrayBuffer) as ArrayBuffer;
 * ```
 */
export declare function load(url: string, currentDirectory?: string, responseType?: boolean | ResponseType): Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;
/**
 * Render the ast tree
 * @param data
 * @param options
 * @param mapping
 *
 * Example:
 *
 * ```ts
 *
 *  import {render, ColorType} from '@tbela99/css-parser';
 *
 *  const css = 'body { color: color(from hsl(0 100% 50%) xyz x y z); }';
 *  const parseResult = await parse(css);
 *
 * let renderResult = render(parseResult.ast);
 * console.log(result.code);
 *
 * // body{color:red}
 *
 *
 * renderResult = render(parseResult.ast, {beautify: true, convertColor: ColorType.SRGB});
 * console.log(renderResult.code);
 *
 * // body {
 * //  color: color(srgb 1 0 0)
 * // }
 * ```
 */
export declare function render(data: AstNode, options?: RenderOptions, mapping?: {
    mapping: Record<string, string>;
    importMapping: Record<string, Record<string, string>> | null;
} | null): RenderResult;
/**
 * Parse css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @throws Error file not found
 *
 * Example:
 *
 * ```ts
 *
 *  import {parseFile} from '@tbela99/css-parser/web';
 *
 *  // remote file
 * let result = await parseFile('https://docs.deno.com/styles.css');
 * console.log(result.ast);
 *
 * // local file
 * result = await parseFile('./css/styles.css');
 * console.log(result.ast);
 * ```
 */
export declare function parseFile(file: string, options?: ParserOptions, asStream?: boolean): Promise<ParseResult>;
/**
 * Parse css
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser/web';
 *
 *  // css string
 *  const result = await parse(css);
 *  console.log(result.ast);
 * ```
 *
 * Example using fetch and readable stream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser/web';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  const result = await parse(response.body, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */
export declare function parse(stream: string | ReadableStream<Uint8Array>, options?: ParserOptions): Promise<ParseResult>;
/**
 * Transform css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * Example:
 *
 * ```ts
 *
 * import {transformFile} from '@tbela99/css-parser/web';
 *
 * // remote file
 * let result = await transformFile('https://docs.deno.com/styles.css');
 * console.log(result.code);
 *
 * // local file
 * result = await transformFile('./css/styles.css');
 * console.log(result.code);
 * ```
 */
export declare function transformFile(file: string, options?: TransformOptions, asStream?: boolean): Promise<TransformResult>;
/**
 * Transform css
 * @param css
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser/web';
 *
 *  // css string
 *  let result = await transform(css);
 *  console.log(result.code);
 *
 *  // using readable stream
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform(response.body, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 */
export declare function transform(css: string | ReadableStream<Uint8Array>, options?: TransformOptions): Promise<TransformResult>;
