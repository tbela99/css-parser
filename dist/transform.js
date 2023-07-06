import { parse } from './parser/parse.js';
import { render } from './renderer/renderer.js';

function transform(css, options = {}) {
    options = { compress: true, removeEmpty: true, ...options };
    const startTime = performance.now();
    const parseResult = parse(css, options);
    if (parseResult == null) {
        // @ts-ignore
        return null;
    }
    const renderTime = performance.now();
    const rendered = render(parseResult.ast, options);
    const endTime = performance.now();
    return {
        ...parseResult, ...rendered, stats: {
            bytesIn: css.length,
            bytesOut: rendered.code.length,
            parse: `${(renderTime - startTime).toFixed(2)}ms`,
            render: `${(endTime - renderTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
}

export { transform };
