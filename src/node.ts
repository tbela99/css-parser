import type {
    AstNode,
    LoadResult,
    ParseInfo,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "./@types/index.d.ts";
import process from 'node:process';
import {doParse, doRender, tokenize, tokenizeStream} from "./lib/index.ts";
import {dirname, matchUrl, resolve} from "./lib/fs/index.ts";
import {Readable} from "node:stream";
import {createReadStream} from "node:fs";
import {lstat, readFile} from "node:fs/promises";

export type * from "./@types/index.d.ts";
export type * from "./@types/ast.d.ts";
export type * from "./@types/token.d.ts";
export type * from "./@types/parse.d.ts";
export type * from "./@types/validation.d.ts";
export type * from "./@types/walker.d.ts";
export type{
    AstNode,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "./@types/index.d.ts";

export {
    minify,
    expand,
    parseString,
    parseTokens,
    renderToken,
    walk,
    walkValues,
    convertColor,
    isOkLabClose,
    okLabDistance,
    parseDeclarations,
    EnumToken,
    ValidationLevel,
    ColorType,
    SourceMap,
    WalkerEvent,
    WalkerOptionEnum
} from './lib/index.ts';
export {FeatureWalkMode} from './lib/ast/features/type.ts';
export {dirname, resolve};

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 * @param asStream
 * @throws Error file not found
 *
 * @private
 */
export async function load(url: string, currentFile: string = '.', asStream: boolean = false): Promise<string | ReadableStream<Uint8Array<ArrayBufferLike>>> {

    const resolved = resolve(url, currentFile);

    if (matchUrl.test(resolved.absolute)) {

        return fetch(resolved.absolute).then(async (response: Response): Promise<string | ReadableStream<Uint8Array<ArrayBufferLike>>> => {

            if (!response.ok) {

                throw new Error(`${response.status} ${response.statusText} ${response.url}`)
            }

            return asStream ? response.body as ReadableStream<Uint8Array<ArrayBuffer>> : await response.text();
        });
    }

    try {

        if (!asStream) {

            return readFile(resolved.absolute, 'utf-8');
        }

        const stats = await lstat(resolved.absolute);

        if (stats.isFile()) {

            return Readable.toWeb(createReadStream(resolved.absolute, {
                encoding: 'utf-8',
                highWaterMark: 64 * 1024
            })) as ReadableStream<Uint8Array>;
        }

    } catch (error) {

        console.warn(error);
    }

    throw new Error(`File not found: '${resolved.absolute || url}'`);
}

/**
 * render the ast tree
 * @param data
 * @param options
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
export function render(data: AstNode, options: RenderOptions = {}): RenderResult {

    return doRender(data, Object.assign(options, {resolve, dirname, cwd: options.cwd ?? process.cwd()}));
}

/**
 * parse css file
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
 *  import {parseFile} from '@tbela99/css-parser';
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
export async function parseFile(file: string, options: ParserOptions = {}, asStream: boolean = false): Promise<ParseResult> {

    return Promise.resolve(((options.load ?? load) as (file: string, currentFile: string, asStream: boolean) => LoadResult)(file, '.', asStream)).then(stream => parse(stream, {src: file, ...options}));
}

/**
 * parse css
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await parse(css);
 *  console.log(result.ast);
 * ```
 *
 * Example using stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  let result = await parse(readableStream, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Example using fetch and readable stream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  const result = await parse(response.body, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */

export async function parse(stream: string | ReadableStream<Uint8Array>, options: ParserOptions = {}): Promise<ParseResult> {

    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
        stream,
        buffer: '',
        position: {ind: 0, lin: 1, col: 1},
        currentPosition: {ind: -1, lin: 1, col: 0}
    } as ParseInfo), Object.assign(options, {load, resolve, dirname, cwd: options.cwd ?? process.cwd()})).then(result => {

        const {revMapping, ...res} = result;
        return res as ParseResult;
    });
}

/**
 * transform css file
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
 *  import {transformFile} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await transformFile('https://docs.deno.com/styles.css');
 * console.log(result.code);
 *
 * // local file
 * result = await transformFile('./css/styles.css');
 * console.log(result.code);
 * ```
 */
export async function transformFile(file: string, options: TransformOptions = {}, asStream: boolean = false): Promise<TransformResult> {

    return Promise.resolve(((options.load ?? load) as (file: string, currentFile: string, asStream: boolean) => LoadResult)(file, '.', asStream)).then(stream => transform(stream, {src: file, ...options}));
}

/**
 * transform css
 * @param css
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = await transform(css);
 *  console.log(result.code);
 * ```
 *
 * Example using stream
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await transform(readableStream, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 *
 * Example using fetch
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform(response.body, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 */
export async function transform(css: string | ReadableStream<Uint8Array>, options: TransformOptions = {}): Promise<TransformResult> {

    options = {minify: true, removeEmpty: true, removeCharset: true, ...options};

    const startTime: number = performance.now();
    return parse(css, options).then((parseResult: ParseResult) => {

        // ast already expanded by parse
        const rendered: RenderResult = render(parseResult.ast, {...options, expandNestingRules: false});

        return {
            ...parseResult,
            ...rendered,
            errors: parseResult.errors.concat(rendered.errors),
            stats: {
                bytesOut: rendered.code.length,
                ...parseResult.stats,
                render: rendered.stats.total,
                total: `${(performance.now() - startTime).toFixed(2)}ms`
            }
        } as TransformResult
    });
}
