import type {
    AstNode,
    ParseInfo,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "./@types/index.d.ts";

import {doParse, doRender, tokenize, tokenizeStream} from "./lib/index.ts";
import {dirname, matchUrl, resolve} from "./lib/fs/index.ts";

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
    WalkerValueEvent,
    WalkerOptionEnum,
} from './lib/index.ts';
export {FeatureWalkMode} from './lib/ast/features/type.ts';
export {dirname, resolve};


/**
 * load file or url as stream
 * @param url
 * @param currentFile
 *
 * @private
 */
export async function getStream(url: string, currentFile: string = '.'): Promise<ReadableStream<Uint8Array>> {

    let t: URL;

    if (matchUrl.test(url)) {

        t = new URL(url);
    } else if (currentFile != null && matchUrl.test(currentFile)) {

        t = new URL(url, currentFile);
    } else {

        const path: string = resolve(url, currentFile).absolute;
        // @ts-ignore
        t = new URL(path, self.origin);
    }

    // @ts-ignore
    return fetch(t, t.origin != self.origin ? {mode: 'cors'} : {}).then((response: Response) => {

        if (!response.ok) {

            throw new Error(`${response.status} ${response.statusText} ${response.url}`)
        }

        return response.body;
    });
}

/**
 * render ast tree
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

    return doRender(data, Object.assign(options, {
        getStream,
        resolve,
        dirname,
        cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}


/**
 * parse css file
 * @param file url or path
 * @param options
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
export async function parseFile(file: string, options: ParserOptions = {}): Promise<ParseResult> {

    return getStream(file).then(stream => parse(stream, {src: file, ...options}));
}

/**
 * parse css
 * @param stream
 * @param opt
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
export async function parse(stream: string | ReadableStream<Uint8Array>, opt: ParserOptions = {}): Promise<ParseResult> {

    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
        stream,
        buffer: '',
        position: {ind: 0, lin: 1, col: 1},
        currentPosition: {ind: -1, lin: 1, col: 0}
    } as ParseInfo), Object.assign(opt, {
        getStream,
        resolve,
        dirname,
        cwd: opt.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}

/**
 * transform css file
 * @param file url or path
 * @param options
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
export async function transformFile(file: string, options: TransformOptions = {}): Promise<TransformResult> {

    return getStream(file).then(stream => transform(stream, {src: file, ...options}));
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
export async function transform(css: string | ReadableStream<Uint8Array>, options: TransformOptions = {}): Promise<TransformResult> {

    options = {minify: true, removeEmpty: true, removeCharset: true, ...options};

    const startTime: number = performance.now();

    return parse(css, options).then((parseResult: ParseResult) => {

        const rendered: RenderResult = render(parseResult.ast, options);

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
        }
    });
}