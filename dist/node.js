import process from 'node:process';
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
import { resolve, matchUrl, dirname } from './lib/fs/resolve.js';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
export { FeatureWalkMode } from './lib/ast/features/type.js';

/**
 * node module entry point
 * @module node
 */
/**
 * load file or url as stream
 * @param url
 * @param currentFile
 *
 * @private
 */
async function getStream(url, currentFile = '.') {
    const resolved = resolve(url, currentFile);
    // @ts-ignore
    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then((response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} ${response.url}`);
        }
        return response.body;
    }) : Readable.toWeb(createReadStream(resolved.absolute));
}
/**
 * render ast tree
 * @param data
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {render, ColorType} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = render(ast);
 * console.log(result.code);
 *
 * // local file
 * result = await parseFile(ast, {beatify: true, convertColor: ColorType.SRGB});
 * console.log(result.code);
 * ```
 */
function render(data, options = {}) {
    return doRender(data, Object.assign(options, { getStream, resolve, dirname, cwd: options.cwd ?? process.cwd() }));
}
/**
 * parse css file
 * @param file url or path
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 *  import {parseFile} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await parseFile('https://docs.deno.com/styles.css');
 * console.log(result.ast);
 *
 * // local file
 * result = await parseFile('./css/styles.css');
 * console.log(result.ast);
 * ```
 */
async function parseFile(file, options = {}) {
    return getStream(file).then(stream => parse(stream, { src: file, ...options }));
}
/**
 * parse css
 * @param stream
 * @param opt
 *
 * Example:
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await transform(css);
 *  console.log(result.code);
 * ```
 *
 * Example using stream
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await parse(readableStream, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Example using fetch
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  result = await parse(response.body, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */
async function parse(stream, opt = {}) {
    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
        stream,
        buffer: '',
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    }), Object.assign(opt, { getStream, resolve, dirname, cwd: opt.cwd ?? process.cwd() }));
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
 *  import {transformFile} from '@tbela99/css-parser';
 *
 *  // remote file
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
 * import {transform} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await transform(css);
 *  console.log(result.code);
 * ```
 *
 * Example using stream
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser';
 * import {Readable} from "node:stream";
 *
 * // usage: node index.ts < styles.css or cat styles.css | node index.ts
 *
 *  const readableStream = Readable.toWeb(process.stdin);
 *  const result = await transform(readableStream, {beautify: true});
 *
 *  console.log(result.code);
 * ```
 *
 * Example using fetch
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
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
