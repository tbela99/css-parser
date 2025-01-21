import process from 'node:process';
export { EnumToken } from '../lib/ast/types.js';
export { minify } from '../lib/ast/minify.js';
export { walk, walkValues } from '../lib/ast/walk.js';
export { expand } from '../lib/ast/expand.js';
import { doRender } from '../lib/renderer/render.js';
export { renderToken } from '../lib/renderer/render.js';
import { doParse } from '../lib/parser/parse.js';
export { parseString, parseTokens } from '../lib/parser/parse.js';
import '../lib/renderer/color/utils/constants.js';
import '../lib/parser/utils/config.js';
import '../lib/validation/config.js';
import '../lib/validation/parser/types.js';
import '../lib/validation/parser/parse.js';
import '../lib/validation/syntaxes/complex-selector.js';
import { resolve, dirname } from '../lib/fs/resolve.js';
import { load } from './load.js';

/**
 * render ast node
 */
function render(data, options = {}) {
    return doRender(data, Object.assign(options, { load, resolve, dirname, cwd: options.cwd ?? process.cwd() }));
}
/**
 * parse css
 */
async function parse(iterator, opt = {}) {
    return doParse(iterator, Object.assign(opt, { load, resolve, dirname, cwd: opt.cwd ?? process.cwd() }));
}
/**
 * parse and render css
 */
async function transform(css, options = {}) {
    options = { minify: true, removeEmpty: true, removeCharset: true, ...options };
    const startTime = performance.now();
    return parse(css, options).then((parseResult) => {
        const rendered = render(parseResult.ast, options);
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
        };
    });
}

export { dirname, load, parse, render, resolve, transform };
