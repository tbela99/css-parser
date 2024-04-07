import {
    AstNode,
    ParseResult,
    ParserOptions,
    RenderOptions,
    RenderResult,
    TransformOptions,
    TransformResult
} from "../@types";

import {doParse, doRender, getDefaultParseOptions, getDefaultRenderOptions} from "../lib";
import {resolve, dirname} from "../lib/fs";
import {load} from "./load";

export {minify, expand, parseString, parseTokens, renderToken, walk, walkValues, EnumToken} from '../lib';
export {dirname, resolve, load};

export function render(data: AstNode, options: RenderOptions = {}): RenderResult {

    return doRender(data, Object.assign(options, {load, resolve, dirname, cwd: options.cwd ?? process.cwd()}));
}

export async function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    return doParse(iterator, Object.assign(opt, {load, resolve, dirname, cwd: opt.cwd ?? process.cwd()}));
}

export async function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    options = getDefaultParseOptions(getDefaultRenderOptions(options));

    const startTime: number = performance.now();

    return parse(css, options).then((parseResult: ParseResult) => {

        const rendered: RenderResult = render(parseResult.ast, options);

        return <TransformResult> {
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