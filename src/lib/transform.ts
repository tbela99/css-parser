import {ParseResult, RenderResult, TransformOptions, TransformResult} from "../@types";
import {parse} from "./parser";
import {render} from "./renderer";

export async function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    options = {minify: true, removeEmpty: true, ...options};

    const startTime: number = performance.now();
    const parseResult: ParseResult = <ParseResult>await parse(css, options);

    const renderTime: number = performance.now();
    const rendered: RenderResult = render(parseResult.ast, options);
    const endTime: number = performance.now();

    return {
        ...parseResult, ...rendered, stats: {
            bytesIn: parseResult.bytesIn,
            bytesOut: rendered.code.length,
            parse: `${(renderTime - startTime).toFixed(2)}ms`,
            render: `${(endTime - renderTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    }
}
