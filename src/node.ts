import type {
    AstNode,
    LoadResult,
    ParseInputFileOptions,
    ParseInputOptions,
    ParseInputStreamOptions,
    ParseResult,
    ParserOptions,
    ParserSyncOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult,
    TransformSyncOptions
} from "./@types/index.d.ts";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import { doParse, doParseSync } from "./lib/parser/parse.ts";
import { doRender } from "./lib/printer/render.ts";
import type { AstArena } from "./lib/ast/arena.ts";
import { ModuleScopeEnumOptions } from "./lib/ast/types.ts";
import { createParseInfo, Tokenizer } from "./lib/parser/tokenize.ts";
import { type CssInput, isCssInput } from "./lib/parser/input.ts";
import { dirname, matchUrl, resolve } from "./lib/fs/resolve.ts";
import { ResponseType } from "./types.ts";
import { resolve as resolvePath } from "node:path";
import { SourceFile } from "./lib/parser/source.ts";
import { cwd } from "node:process";
import { parseResult, validateSyncArguments } from "./utils/sync.ts";

export type * from "./@types/index.d.ts";
export type * from "./@types/ast.d.ts";
export type * from "./@types/token.d.ts";
export type * from "./@types/parse.d.ts";
export type * from "./@types/validation.d.ts";
export type * from "./@types/walker.d.ts";
export type {
    AstNode,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult,
} from "./@types/index.d.ts";

export { minify } from "./lib/ast/minify.ts";
export { parseString } from "./lib/parser/parse.ts";
export { renderValue } from "./lib/printer/render.ts";
export { convertColor } from "./lib/syntax/color/color.ts";
export { isOkLabClose, okLabDistance } from "./lib/syntax/color/utils/distance.ts";
export { parseDeclarations } from "./lib/parser/parse.ts";
export { Arena, AstArena, TokenField, arenaColumns } from "./lib/ast/arena.ts";
export type { ArenaProperties, ArenaTransferables } from "./lib/ast/arena.ts";
export { AstArenaNode, ARENAID, ARENA } from "./lib/ast/arena-node.ts";
export type { AstArenaNodeInput } from "./lib/ast/arena-node.ts";
export {
    EnumToken,
    ColorType,
    EnumAstNodeStatus,
    ModuleScopeEnumOptions,
    ModuleCaseTransformEnum,
    WalkerEvent,
    WalkerOptionEnum,
} from "./lib/ast/types.ts";
export { SourceMap } from "./lib/printer/sourcemap/sourcemap.ts";
export type { ValidationToken } from "./lib/validation/parser/types.d.ts";
export type { CssInput } from "./lib/parser/input.ts";

export { FeatureWalkMode } from "./lib/ast/features/type.ts";
export { dirname, resolve, ResponseType };
export { parseSyntax } from "./lib/validation/parser/parse.ts";

/**
 * Version number
 */
// @ts-ignore
export { version } from "../package.json" with { type: "json" };

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
export async function load(
    url: string | { absolute: string; relative: string },
    currentDirectory: string = ".",
    responseType: boolean | ResponseType = false,
): Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>> {
    const resolved = typeof url === "string" ? resolve(url, currentDirectory) : url;

    if (typeof responseType === "boolean") {
        responseType = responseType ? ResponseType.ReadableStream : ResponseType.Text;
    }

    if (matchUrl.test(resolved.absolute)) {
        return fetch(resolved.absolute).then(
            async (response: Response): Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>> => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText} ${response.url}`);
                }

                if (responseType === ResponseType.ArrayBuffer) {
                    return response.arrayBuffer();
                }

                if (responseType === ResponseType.JSON) {
                    return response.json();
                }

                return responseType === ResponseType.ReadableStream
                    ? (response.body as ReadableStream<Uint8Array<ArrayBuffer>>)
                    : response.text();
            },
        );
    }

    try {
        const stats = await lstat(resolved.absolute);

        if (stats.isFile()) {
            if (responseType === ResponseType.Text || responseType === ResponseType.JSON) {
                return readFile(resolved.absolute, "utf-8").then((buffer) =>
                    responseType === ResponseType.JSON ? JSON.parse(buffer) : buffer,
                );
            }

            if (responseType === ResponseType.ArrayBuffer) {
                // the buffer of the file, without copy. a buffer that is a part of a larger buffer is copied
                return readFile(resolved.absolute).then((buffer) =>
                    buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength
                        ? (buffer.buffer as ArrayBuffer)
                        : (buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer),
                );
            }

            return Readable.toWeb(
                createReadStream(resolved.absolute, {
                    encoding: "utf-8",
                    highWaterMark: 64 * 1024,
                }),
            ) as ReadableStream<Uint8Array>;
        }
    } catch (error) {}

    throw new Error(`File not found: '${resolved.absolute || url}'`);
}

/**
 * Render the ast tree
 * @param arena
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
 * let renderResult = render(parseResult.arena, parseResult.ast);
 * console.log(result.code);
 *
 * // body{color:red}
 *
 *
 * renderResult = render(parseResult.arena, parseResult.ast, {beautify: true, convertColor: ColorType.SRGB});
 * console.log(renderResult.code);
 *
 * // body {
 * //  color: color(srgb 1 0 0)
 * // }
 * ```
 */
export function render(
    arena: AstArena,
    data: AstNode,
    options: RenderOptions = {},
    mapping?: {
        mapping: Record<string, string>;
        importMapping: Record<string, Record<string, string>> | null;
    } | null,
): RenderResult {
    return doRender(
        arena,
        data,
        Object.assign(options, { resolve, dirname, cwd: options.cwd ?? resolvePath() }),
        mapping,
    );
}

/**
 * Parse CSS string
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parseSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = parseSync(css, {nestingRules: true});
 *  console.log(result.ast);
 * ```
 *
 */

export function parseSync(stream: CssInput, options?: ParserSyncOptions): ParseResult;

/**
 * Parse CSS string
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {parseSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = parseSync({input: css, nestingRules: true});
 *  console.log(result.ast);
 * ```
 *
 */

export function parseSync(options: ParseInputOptions & ParserSyncOptions): ParseResult;

/**
 * Parse CSS
 * @param args
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {parseSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = parseSync(css, {nestingRules: true});
 *  console.log(result.ast);
 * ```
 *
 */

export function parseSync(
    ...args: [CssInput, ParserSyncOptions?] | [options: ParseInputOptions & ParserSyncOptions]
): ParseResult {
    let options: (ParseInputOptions & ParserSyncOptions) | ParserSyncOptions;
    let stream: CssInput;

    if (isCssInput(args[0])) {
        stream = args[0];
        options = args[1] as ParserSyncOptions;
    } else {
        const { input, ...opt } = args[0] as ParseInputOptions & ParserSyncOptions;

        options = opt;
        stream = input;
    }

    if (options != null) {
        validateSyncArguments(options);
    }

    options ??= {};

    options.src ??= "";
    options.sourcesMap ??= new Map();

    Object.assign(options, {
        resolve,
        dirname,
        cwd: options.cwd ?? cwd(),
    });

    options.src = resolve(options.src!, options.cwd).relative;

    if (options.source == null) {
        const source = new SourceFile(typeof stream === "string" ? stream : "", [], options.src);
        options.sourcesMap.set(source.id, source);
        options.source = source;
    }

    options.parseInfo = createParseInfo(stream, options.source);

    const result = doParseSync(new Tokenizer(options.parseInfo), options) as ParseResult;
    return options.module == null && options.inputSourceMap == null && !options.sourcemap
        ? result
        : parseResult(result, options);
}

/**
 * Transform CSS
 * @param css
 * @param options
 *
 *
 * ```ts
 *
 * import {transformSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = transformSync(css, {beautify: true});
 *  console.log(result.code);
 * ```
 *
 */
export function transformSync(css: CssInput, options?: TransformSyncOptions): TransformResult;

/**
 * Transform CSS
 * @param options
 *
 * ```ts
 *
 * import {transformSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = transformSync({input: css, beautify: true});
 *  console.log(result.code);
 * ```
 *
 */
export function transformSync(options: ParseInputOptions & TransformSyncOptions): TransformResult;

/**
 * Transform CSS
 *
 * ```ts
 *
 * import {transformSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = transformSync(css);
 *  console.log(result.code);
 * ```
 *
 * @param args
 */
export function transformSync(
    ...args: [CssInput, TransformSyncOptions?] | [ParseInputOptions & TransformSyncOptions]
): TransformResult {
    let options: (ParseInputStreamOptions & TransformSyncOptions) | TransformSyncOptions;
    let stream: CssInput;

    if (isCssInput(args[0])) {
        stream = args[0];
        options = args[1] as ParserSyncOptions;
    } else {
        const { input, ...opt } = args[0] as ParseInputOptions & TransformOptions;

        // @ts-ignore
        options = opt;
        stream = input;
    }

    options ??= {};

    if (options.minify == null) {
        options.minify = true;
    }

    if (options.removeEmpty == null) {
        options.removeEmpty = true;
    }

    if (options.removeCharset == null) {
        options.removeCharset = true;
    }

    const startTime: number = performance.now();
    const parseResult: ParseResult = parseSync(stream, options);

    let mapping: Record<string, string> | null = null;
    let importMapping: Record<string, Record<string, string>> | null = null;

    if (
        (typeof options.module === "number" && options.module & ModuleScopeEnumOptions.ICSS) ||
        (typeof options.module === "object" &&
            typeof options.module.scoped === "number" &&
            options.module.scoped & ModuleScopeEnumOptions.ICSS)
    ) {
        mapping = parseResult.mapping as Record<string, string>;
        importMapping = parseResult.importMapping as Record<string, Record<string, string>>;
    }

    // ast already expanded by parse
    const rendered: RenderResult = render(
        parseResult.arena,
        parseResult.ast,
        {
            ...options,
            expandNestingRules: false,
        },
        mapping != null ? { mapping, importMapping } : null,
    );

    return {
        ...parseResult,
        ...rendered,
        errors: parseResult.errors.concat(rendered.errors),
        stats: {
            bytesOut: rendered.code.length,
            ...parseResult.stats,
            render: rendered.stats.total,
            total: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
    } as TransformResult;
}

/**
 * Parse CSS
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
 * parsing a ReadableStream
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
 * Parsing a file as a ReadableStream
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

export async function parse(stream: CssInput | ReadableStream<Uint8Array>, options?: ParserOptions): Promise<ParseResult>;

/**
 * Parse CSS
 * @param options
 *
 * @throws Error file not found
 *
 * Parsing a file
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 * const file = 'https://docs.deno.com/styles.css';
 *  // css file or url
 *  let result = await parse({file});
 *  console.log(result.ast);
 * ```
 *
 * Parsing a file as stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  const file = 'https://docs.deno.com/styles.css';
 *  let result = await parse({file, asStream: true, beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 */

export async function parse(options: ParseInputFileOptions & ParserOptions): Promise<ParseResult>;

/**
 * Parse CSS
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await parse({input:css});
 *  console.log(result.ast);
 * ```
 *
 * Parsing a Readable stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 * *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  let result = await parse({input: readableStream, beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Parsing a file as a ReadableStream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  const result = await parse({input: response.body, beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */

export async function parse(options: ParseInputStreamOptions & ParserOptions): Promise<ParseResult>;

/**
 * Parse CSS
 * @param args
 *
 * @throws Error file not found
 *
 * Parsing a string
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
 * Parsing a Readable stream
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
 * Parsing a file as a ReadableStream
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

export async function parse(
    ...args:
        | [stream: CssInput | ReadableStream<Uint8Array>, options?: ParserOptions]
        | [options: (ParseInputFileOptions | ParseInputStreamOptions) & ParserOptions]
): Promise<ParseResult> {
    let options: ((ParseInputFileOptions | ParseInputStreamOptions) & ParserOptions) | ParserOptions;
    let stream: CssInput | ReadableStream<Uint8Array>;

    if (isCssInput(args[0]) || args[0] instanceof ReadableStream) {
        stream = args[0];
        options = args[1] as ParserOptions;
    } else {
        // @ts-expect-error
        const { file, input, ...opt } = args[0] as (ParseInputFileOptions | ParseInputStreamOptions) & ParserOptions;

        options = opt;
        if (file != null) {
            return Promise.resolve(
                (options.load != null
                    ? (options.load as (file: string, currentFile: string, asStream: boolean) => LoadResult)(
                          file,
                          "",
                          (options as ParseInputFileOptions).asStream ?? false,
                      )
                    : // the default loader loads the file as an ArrayBuffer: the preferred input of the tokenizer
                      load(
                          file,
                          "",
                          (options as ParseInputFileOptions).asStream ? ResponseType.ReadableStream : ResponseType.ArrayBuffer,
                      )),
                // @ts-expect-error
            ).then((stream: CssInput | ReadableStream<Uint8Array>) => parse(stream, { src: file, ...options }));
        } else {
            stream = input;
        }
    }

    options ??= {};
    options.src ??= "";
    options.sourcesMap ??= new Map();

    Object.assign(options, {
        // a custom loader is used to load the imported files
        load: options.load ?? load,
        resolve,
        dirname,
        cwd: options.cwd ?? cwd(),
    });

    options.src = resolve(options.src!, options.cwd).relative;

    if (options.source == null) {
        const source = new SourceFile(typeof stream === "string" ? stream : "", [], options.src);
        options.sourcesMap.set(source.id, source);
        options.source = source;
    }

    options.parseInfo = createParseInfo(stream, options.source);

    return doParse(
        stream instanceof ReadableStream
            ? new Tokenizer(options.parseInfo, stream).tokenizeStream()
            : new Tokenizer(options.parseInfo),
        options,
    ).then((result) =>
        options.module == null && options.inputSourceMap == null && !options.sourcemap
            ? result
            : parseResult(result, options),
    );
}

/**
 * Transform CSS
 * @param css
 * @param options
 *
 * Parsing a string
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
 * Parsing a Readable stream
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
export async function transform(
    css: CssInput | ReadableStream<Uint8Array>,
    options?: TransformOptions,
): Promise<TransformResult>;

/**
 * Transform CSS
 * @param options
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = await transform({input: css});
 *  console.log(result.code);
 * ```
 *
 * Parsing a Readable stream
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await transform( {input: readableStream, beautify: true});
 *
 *  console.log(result.code);
 * ```
 *
 * Parse a file as a ReadableStream
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform({input: response.body, beautify: true});
 *
 *  console.log(result.code);
 * ```
 */

export async function transform(options: ParseInputStreamOptions & TransformOptions): Promise<TransformResult>;

/**
 * Transform CSS
 * @param options
 *
 * Parsing a file
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  const result = await transform( {file: 'https://docs.deno.com/styles.css', beautify: true});
 *  console.log(result.code);
 * ```
 */

export async function transform(options: ParseInputFileOptions & TransformOptions): Promise<TransformResult>;

/**
 * Transform CSS
 *
 * Parsing a string
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
 * Parsing a Readable stream
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
 * @param args
 */
export async function transform(
    ...args:
        | [CssInput | ReadableStream<Uint8Array>, TransformOptions?]
        | [(ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions]
): Promise<TransformResult> {
    let options: ((ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions) | TransformOptions;
    let stream: CssInput | ReadableStream<Uint8Array>;

    if (isCssInput(args[0]) || args[0] instanceof ReadableStream) {
        stream = args[0];
        options = args[1] as ParserOptions;
    } else {
        // @ts-expect-error
        const { file, input, ...opt } = args[0] as (ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions;

        options = opt;
        if (file != null) {
            return Promise.resolve(
                (options.load != null
                    ? (options.load as (file: string, currentFile: string, asStream: boolean) => LoadResult)(
                          file,
                          "",
                          (options as ParseInputFileOptions).asStream ?? false,
                      )
                    : // the default loader loads the file as an ArrayBuffer: the preferred input of the tokenizer
                      load(
                          file,
                          "",
                          (options as ParseInputFileOptions).asStream ? ResponseType.ReadableStream : ResponseType.ArrayBuffer,
                      )),
                // @ts-expect-error
            ).then((stream: CssInput | ReadableStream<Uint8Array>) => transform(stream, { src: file, ...options }));
        } else {
            stream = input;
        }
    }

    options ??= {};

    if (options.minify == null) {
        options.minify = true;
    }

    if (options.removeEmpty == null) {
        options.removeEmpty = true;
    }

    if (options.removeCharset == null) {
        options.removeCharset = true;
    }

    const startTime: number = performance.now();
    return parse(stream, options).then((parseResult: ParseResult) => {
        let mapping: Record<string, string> | null = null;
        let importMapping: Record<string, Record<string, string>> | null = null;

        if (
            (typeof options.module === "number" && options.module & ModuleScopeEnumOptions.ICSS) ||
            (typeof options.module === "object" &&
                typeof options.module.scoped === "number" &&
                options.module.scoped & ModuleScopeEnumOptions.ICSS)
        ) {
            mapping = parseResult.mapping as Record<string, string>;
            importMapping = parseResult.importMapping as Record<string, Record<string, string>>;
        }

        // ast already expanded by parse
        const rendered: RenderResult = render(
            parseResult.arena,
            parseResult.ast,
            {
                ...options,
                expandNestingRules: false,
            },
            mapping != null ? { mapping, importMapping } : null,
        );

        return {
            ...parseResult,
            ...rendered,
            errors: parseResult.errors.concat(rendered.errors),
            stats: {
                bytesOut: rendered.code.length,
                ...parseResult.stats,
                render: rendered.stats.total,
                total: `${(performance.now() - startTime).toFixed(2)}ms`,
            },
        } as TransformResult;
    });
}
