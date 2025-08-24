import type {
    AstNode,
    ParseInfo,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "../@types/index.d.ts";

import {doParse, doRender, tokenize, tokenizeStream} from "../lib/index.ts";
import {dirname, resolve} from "../lib/fs/index.ts";
import {getStream} from "./load.ts";

export type * from "../@types/ast.d.ts";
export type * from "../@types/token.d.ts";
export type * from "../@types/parse.d.ts";
export type {
    AstNode,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "../@types/index.d.ts";

export {
    minify,
    expand,
    parseString,
    parseTokens, renderToken, walk, walkValues, convertColor, isOkLabClose, okLabDistance, EnumToken, ValidationLevel, ColorType,
    SourceMap
} from '../lib/index.ts';
export {dirname, resolve, getStream};

// /**
//  * web module entry point
//  * @module node
//  */


/**
 * render ast node
 * @param data
 * @param options
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
 * parse css
 * @param iterator
 * @param opt
 */
export async function parse(iterator: string | ReadableStream<string>, opt: ParserOptions = {}): Promise<ParseResult> {

    return doParse(iterator instanceof ReadableStream ? tokenizeStream(iterator) : tokenize({
        stream: iterator,
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
 * transform css
 * @param css
 * @param options
 *
 * ```ts
 *     // remote file
 *     let result = await transform('https://docs.deno.com/styles.css');
 *     console.log(result.code);
 *
 *     // local file
 *      result = await transform('./css/styles.css');
 *     console.log(result.code);
 * ```
 */
export async function transform(css: string | ReadableStream<string>, options: TransformOptions = {}): Promise<TransformResult> {

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