import {ParseResult, RenderResult, TransformOptions, TransformResult} from "./@types";
import {parse} from "./parser";
import {render} from "./renderer";

export function transform(css: string, options: TransformOptions = {}): TransformResult {

    options = {compress: true, removeEmpty: true, ...options};

    const startTime: number = performance.now();
    const parseResult: ParseResult = parse(css, options);

    if (parseResult == null) {

        // @ts-ignore
        return null;
    }

    const renderTime: number = performance.now();
    const rendered: RenderResult = render(parseResult.ast, options);
    const endTime: number = performance.now();

    return {
        ...parseResult, ...rendered, performance: {
            bytesIn: css.length,
            bytesOut: rendered.code.length,
            parse: `${(renderTime - startTime).toFixed(2)}ms`,
            render: `${(endTime - renderTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
}
