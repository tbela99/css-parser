import { parse } from './parser/parse.js';
import { render } from './renderer/render.js';
import './renderer/utils/color.js';

async function transform(css, options = {}) {
    options = { minify: true, removeEmpty: true, ...options };
    const startTime = performance.now();
    return parse(css, options).then((parseResult) => {
        const rendered = render(parseResult.ast, options);
        return {
            ...parseResult, ...rendered, stats: {
                bytesOut: rendered.code.length,
                ...parseResult.stats,
                render: rendered.stats.total,
                total: `${(performance.now() - startTime).toFixed(2)}ms`
            }
        };
    });
}

export { transform };
