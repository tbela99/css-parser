import { parse } from "./parser";
import { render } from "./renderer";
export async function transform(css, options = {}) {
    options = { compress: true, removeEmpty: true, ...options };
    const startTime = performance.now();
    const parseResult = await parse(css, options);
    const renderTime = performance.now();
    const rendered = render(parseResult.ast, options);
    const endTime = performance.now();
    return {
        ...parseResult, ...rendered, stats: {
            bytesIn: parseResult.bytesIn,
            bytesOut: rendered.code.length,
            parse: `${(renderTime - startTime).toFixed(2)}ms`,
            render: `${(endTime - renderTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
}