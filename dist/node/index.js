import process from 'node:process';
export { ColorType, EnumToken, ValidationLevel } from '../lib/ast/types.js';
export { minify } from '../lib/ast/minify.js';
export { walk, walkValues } from '../lib/ast/walk.js';
export { expand } from '../lib/ast/expand.js';
import { doRender } from '../lib/renderer/render.js';
export { renderToken } from '../lib/renderer/render.js';
import '../lib/syntax/color/utils/constants.js';
export { convertColor } from '../lib/syntax/color/color.js';
export { isOkLabClose, okLabDistance } from '../lib/syntax/color/utils/distance.js';
import { doParse } from '../lib/parser/parse.js';
export { parseString, parseTokens } from '../lib/parser/parse.js';
import { tokenizeStream, tokenize } from '../lib/parser/tokenize.js';
import '../lib/parser/utils/config.js';
import '../lib/validation/config.js';
import '../lib/validation/parser/types.js';
import '../lib/validation/parser/parse.js';
import '../lib/validation/syntaxes/complex-selector.js';
import '../lib/validation/syntax.js';
import { dirname, resolve } from '../lib/fs/resolve.js';
import { getStream } from './load.js';

// /**
//  * node module entry point
//  * @module web
//  */
/**
 * render ast tree
 * @param data
 * @param options
 */
function render(data, options = {}) {
    return doRender(data, Object.assign(options, { getStream, resolve, dirname, cwd: options.cwd ?? process.cwd() }));
}
/**
 * parse css file
 * @param file url or path
 * @param options
 */
async function parseFile(file, options = {}) {
    return getStream(file).then(css => parse(css, options));
}
/**
 * parse css
 * @param iterator
 * @param opt
 */
async function parse(iterator, opt = {}) {
    return doParse(iterator instanceof ReadableStream ? tokenizeStream(iterator) : tokenize({
        stream: iterator,
        buffer: '',
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    }), Object.assign(opt, { getStream, resolve, dirname, cwd: opt.cwd ?? process.cwd() }));
}
/**
 * transform css file
 * @param file url or path
 * @param options
 */
async function transformFile(file, options = {}) {
    return getStream(file).then(css => transform(css, options));
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

export { dirname, getStream, parse, parseFile, render, resolve, transform, transformFile };
