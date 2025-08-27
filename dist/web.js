export { ColorType, EnumToken, ValidationLevel } from './lib/ast/types.js';
export { minify } from './lib/ast/minify.js';
export { WalkerOptionEnum, WalkerValueEvent, walk, walkValues } from './lib/ast/walk.js';
export { expand } from './lib/ast/expand.js';
import { doRender } from './lib/renderer/render.js';
export { renderToken } from './lib/renderer/render.js';
export { SourceMap } from './lib/renderer/sourcemap/sourcemap.js';
import { doParse } from './lib/parser/parse.js';
export { parseDeclarations, parseString, parseTokens } from './lib/parser/parse.js';
import { tokenizeStream, tokenize } from './lib/parser/tokenize.js';
import './lib/parser/utils/config.js';
export { convertColor } from './lib/syntax/color/color.js';
import './lib/syntax/color/utils/constants.js';
export { isOkLabClose, okLabDistance } from './lib/syntax/color/utils/distance.js';
import './lib/validation/config.js';
import './lib/validation/parser/types.js';
import './lib/validation/parser/parse.js';
import './lib/validation/syntaxes/complex-selector.js';
import './lib/validation/syntax.js';
import { matchUrl, resolve, dirname } from './lib/fs/resolve.js';
export { FeatureWalkMode } from './lib/ast/features/type.js';

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 *
 * @private
 */
async function getStream(url, currentFile = '.') {
    let t;
    if (matchUrl.test(url)) {
        t = new URL(url);
    }
    else if (currentFile != null && matchUrl.test(currentFile)) {
        t = new URL(url, currentFile);
    }
    else {
        const path = resolve(url, currentFile).absolute;
        // @ts-ignore
        t = new URL(path, self.origin);
    }
    // @ts-ignore
    return fetch(t, t.origin != self.origin ? { mode: 'cors' } : {}).then((response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} ${response.url}`);
        }
        return response.body;
    });
}
/**
 * render ast node
 * @param data
 * @param options
 */
function render(data, options = {}) {
    return doRender(data, Object.assign(options, {
        getStream,
        resolve,
        dirname,
        cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}
/**
 * parse css file
 * @param file url or path
 * @param options
 */
async function parseFile(file, options = {}) {
    return getStream(file).then(stream => parse(stream, { src: file, ...options }));
}
/**
 * parse css
 * @param stream
 * @param opt
 */
async function parse(stream, opt = {}) {
    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
        stream,
        buffer: '',
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    }), Object.assign(opt, {
        getStream,
        resolve,
        dirname,
        cwd: opt.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}
/**
 * transform css file
 * @param file url or path
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {transformFile} from '@tbela99/css-parser/web';
 *
 * // remote file
 * let result = await transformFile('https://docs.deno.com/styles.css');
 * console.log(result.code);
 *
 * // local file
 * result = await transformFile('./css/styles.css');
 * console.log(result.code);
 * ```
 */
async function transformFile(file, options = {}) {
    return getStream(file).then(stream => transform(stream, { src: file, ...options }));
}
/**
 * transform css
 * @param css
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser/web';
 *
 *  // css string
 *  let result = await transform(css);
 *  console.log(result.code);
 *
 *  // using readable stream
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await transform(response.body, {beautify: true});
 *
 *  console.log(result.code);
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
