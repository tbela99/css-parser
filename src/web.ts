import type {
    AstNode,
    LoadResult,
    ParseInfo,
    ParseInputFileOptions,
    ParseInputStreamOptions,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult,
} from "./@types/index.d.ts";

import { doParse } from "./lib/parser/parse.ts";
import { doRender } from "./lib/renderer/render.ts";
import { ModuleScopeEnumOptions } from "./lib/ast/types.ts";
import { tokenize, tokenizeStream } from "./lib/parser/tokenize.ts";
import { dirname, matchUrl, resolve } from "./lib/fs/resolve.ts";
import { ResponseType } from "./types.ts";

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
export {
    EnumToken,
    ColorType,
    ValidationLevel,
    EnumAstNodeStatus,
    ModuleScopeEnumOptions,
    ModuleCaseTransformEnum,
} from "./lib/ast/types.ts";
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

export async function load(
    url: string | { absolute: string; relative: string },
    currentDirectory: string = ".",
    responseType: boolean | ResponseType = false,
): Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>> {
    if (typeof responseType == "boolean") {
        responseType = responseType ? ResponseType.ReadableStream : ResponseType.Text;
    }

    let t: URL;

    if (typeof url == "object") {
        t = new URL(url.absolute, self.origin);
    } else if (matchUrl.test(url)) {
        t = new URL(url);
    } else if (currentDirectory != null && matchUrl.test(currentDirectory)) {
        t = new URL(url, currentDirectory);
    } else {
        const path: string = resolve(url, currentDirectory).absolute;
        t = new URL(path, self.origin);
    }

    return fetch(t, t.origin != self.origin ? { mode: "cors" } : {}).then(async (response: Response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} ${response.url}`);
        }

        if (responseType == ResponseType.ArrayBuffer) {
            return response.arrayBuffer();
        }

        return responseType == ResponseType.ReadableStream ? response.body : response.text();
    }) as Promise<string | ArrayBuffer | ReadableStream<Uint8Array<ArrayBufferLike>>>;
}

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
export function render(
    data: AstNode,
    options: RenderOptions = {},
    mapping?: {
        mapping: Record<string, string>;
        importMapping: Record<string, Record<string, string>> | null;
    } | null,
): RenderResult {
    return doRender(
        data,
        Object.assign(options, {
            resolve,
            dirname,
            cwd:
                (options.cwd ?? self.location.pathname.endsWith("/"))
                    ? self.location.pathname
                    : dirname(self.location.pathname),
        }),
        mapping,
    );
}

/**
 * Parse css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated
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
export async function parseFile(
    file: string,
    options: ParserOptions = {},
    asStream: boolean = false,
): Promise<ParseResult> {
    console.error(
        "DeprecationWarning: parseFile is deprecated, use parse instead as parse({file, asStream, ...options})",
    );
    return parse({ file, asStream, ...options });
}

export async function parse(stream: string | ReadableStream<Uint8Array>, options?: ParserOptions): Promise<ParseResult>;
export async function parse(options: ParseInputFileOptions & ParserOptions): Promise<ParseResult>;
export async function parse(options: ParseInputStreamOptions & ParserOptions): Promise<ParseResult>;

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
export async function parse(
    ...args:
        | [stream: string | ReadableStream<Uint8Array>, options?: ParserOptions]
        | [options: (ParseInputFileOptions | ParseInputStreamOptions) & ParserOptions]
): Promise<ParseResult> {
    let options: ((ParseInputFileOptions | ParseInputStreamOptions) & ParserOptions) | ParserOptions;
    let stream: string | ReadableStream<Uint8Array>;

    if (typeof args[0] === "string" || args[0] instanceof ReadableStream) {
        stream = args[0];
        options = args[1] as ParserOptions;
    } else {
        // @ts-expect-error
        const { file, input, ...opt } = args[0] as (ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions;

        options = opt;
        if (file != null) {
            return Promise.resolve(
                ((options.load ?? load) as (file: string, currentFile: string, asStream: boolean) => LoadResult)(
                    file,
                    ".",
                    (options as ParseInputFileOptions).asStream ?? false,
                ),
            ).then((stream: string | ReadableStream<Uint8Array>) =>
                parse(stream, { src: (options as ParseInputFileOptions).file, ...options }),
            );
        } else {
            stream = input;
        }
    }

    options ??= {};
    options.parseInfo = {
        stream,
        buffer: "",
        offset: 0,
        time: 0,
        src: options.src ?? "",
        position: { ind: 0, lin: 1, col: 0 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    } as ParseInfo;

    return doParse(
        stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize(options.parseInfo),
        Object.assign(options, {
            load,
            resolve,
            dirname,
            cwd:
                (options.cwd ?? self.location.pathname.endsWith("/"))
                    ? self.location.pathname
                    : dirname(self.location.pathname),
        }),
    ).then((result) => {
        const { revMapping, ...res } = result;
        return res as ParseResult;
    });
}

/**
 * Transform css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated
 * Example:
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser/web';
 *
 *  // remote file
 * let result = await transform({file: 'https://docs.deno.com/styles.css'});
 * console.log(result.code);
 *
 * // local file
 * result = await transform({file: './css/styles.css'});
 * console.log(result.code);
 * ```
 */
export async function transformFile(
    file: string,
    options: TransformOptions = {},
    asStream: boolean = false,
): Promise<TransformResult> {
    console.error(
        "DeprecationWarning: transformFile is deprecated, use transform instead as transform({file, asStream, ...options})",
    );

    return transform({
        file,
        asStream,
        ...options,
    });
}

export async function transform(
    css: string | ReadableStream<Uint8Array>,
    options: TransformOptions,
): Promise<TransformResult>;

export async function transform(options: ParseInputFileOptions & TransformOptions): Promise<TransformResult>;
export async function transform(options: ParseInputStreamOptions & TransformOptions): Promise<TransformResult>;

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
export async function transform(
    ...args:
        | [string | ReadableStream<Uint8Array>, TransformOptions]
        | [(ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions]
): Promise<TransformResult> {
    let options: ((ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions) | TransformOptions;
    let stream: string | ReadableStream<Uint8Array>;

    if (typeof args[0] === "string" || args[0] instanceof ReadableStream) {
        stream = args[0];
        options = args[1] as ParserOptions;
    } else {
        // @ts-expect-error
        const { file, input, ...opt } = args[0] as (ParseInputFileOptions | ParseInputStreamOptions) & TransformOptions;

        options = opt;
        if (file != null) {
            return Promise.resolve(
                ((options.load ?? load) as (file: string, currentFile: string, asStream: boolean) => LoadResult)(
                    file,
                    ".",
                    (options as ParseInputFileOptions).asStream ?? false,
                ),
            ).then((stream: string | ReadableStream<Uint8Array>) =>
                transform(stream, { src: (options as ParseInputFileOptions).file, ...options }),
            );
        } else {
            stream = input;
        }
    }

    options = { minify: true, removeEmpty: true, removeCharset: true, ...options };
    const startTime: number = performance.now();

    return parse(stream, options).then((parseResult: ParseResult) => {
        let mapping: Record<string, string> | null = null;
        let importMapping: Record<string, Record<string, string>> | null = null;

        if (typeof options.module == "number" && options.module & ModuleScopeEnumOptions.ICSS) {
            mapping = parseResult.mapping as Record<string, string>;
            importMapping = parseResult.importMapping as Record<string, Record<string, string>>;
        } else if (
            typeof options.module == "object" &&
            typeof options.module.scoped == "number" &&
            options.module.scoped & ModuleScopeEnumOptions.ICSS
        ) {
            mapping = parseResult.mapping as Record<string, string>;
            importMapping = parseResult.importMapping as Record<string, Record<string, string>>;
        }

        // ast already expanded by parse
        const rendered: RenderResult = render(
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
        };
    });
}
