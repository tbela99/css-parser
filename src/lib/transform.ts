import {ParseResult, RenderResult, TransformOptions, TransformResult} from "../@types";
import {parse} from "./parser";
import {render} from "./renderer";

export async function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    options = {minify: true, removeEmpty: true, ...options};

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
