import type {
    AstNode,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "../@types/index.d.ts";
import process from 'node:process';
import {doParse, doRender} from "../lib/index.ts";
import {dirname, resolve} from "../lib/fs/index.ts";
import {load} from "./load.ts";

export {
    minify, expand, parseString, parseTokens, renderToken, walk, walkValues, EnumToken, ValidationLevel, ColorType
} from '../lib/index.ts';
export {dirname, resolve, load};

/**
 * render ast node
 */
export function render(data: AstNode, options: RenderOptions = {}): RenderResult {

    return doRender(data, Object.assign(options, {load, resolve, dirname, cwd: options.cwd ?? process.cwd()}));
}

/**
 * parse css
 */
export async function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    return doParse(iterator, Object.assign(opt, {load, resolve, dirname, cwd: opt.cwd ?? process.cwd()}));
}

/**
 * parse and render css
 */
export async function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

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
        } as TransformResult
    });
}