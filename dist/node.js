import process from 'node:process';
import { ModuleScopeEnumOptions } from './lib/ast/types.js';
export { ColorType, EnumToken, ModuleCaseTransformEnum, ValidationLevel } from './lib/ast/types.js';
export { minify } from './lib/ast/minify.js';
export { WalkerEvent, WalkerOptionEnum, walk, walkValues } from './lib/ast/walk.js';
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
import './lib/validation/parser/parse.js';
import './lib/validation/syntaxes/complex-selector.js';
import './lib/validation/syntax.js';
import { resolve, matchUrl, dirname } from './lib/fs/resolve.js';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import { readFile, lstat } from 'node:fs/promises';
export { FeatureWalkMode } from './lib/ast/features/type.js';

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 * @param asStream
 * @throws Error file not found
 *
 * @private
 */
async function load(url, currentFile = '.', asStream = false) {
    const resolved = resolve(url, currentFile);
    if (matchUrl.test(resolved.absolute)) {
        return fetch(resolved.absolute).then(async (response) => {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText} ${response.url}`);
            }
            return asStream ? response.body : await response.text();
        });
    }
    try {
        if (!asStream) {
            return readFile(resolved.absolute, 'utf-8');
        }
        const stats = await lstat(resolved.absolute);
        if (stats.isFile()) {
            return Readable.toWeb(createReadStream(resolved.absolute, {
                encoding: 'utf-8',
                highWaterMark: 64 * 1024
            }));
        }
    }
    catch (error) {
        console.warn(error);
    }
    throw new Error(`File not found: '${resolved.absolute || url}'`);
}
/**
 * render the ast tree
 * @param data
 * @param options
 * @param mapping
 *
 * Example:
 *
 * ```ts
 *
 *  import {render, ColorType} from '@tbela99/css-parser';
 *
 *  const css = 'body { color: color(from hsl(0 100% 50%) xyz x y z); }';
 *  const parseResult = await parse(css);
 *
 * let renderResult = render(parseResult.ast);
 * console.log(result.code);
 *
 * // body{color:red}
 *
 *
 * renderResult = render(parseResult.ast, {beautify: true, convertColor: ColorType.SRGB});
 * console.log(renderResult.code);
 *
 * // body {
 * //  color: color(srgb 1 0 0)
 * // }
 * ```
 */
function render(data, options = {}, mapping) {
    return doRender(data, Object.assign(options, { resolve, dirname, cwd: options.cwd ?? process.cwd() }), mapping);
}
/**
 * parse css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @throws Error file not found
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
async function parseFile(file, options = {}, asStream = false) {
    return Promise.resolve((options.load ?? load)(file, '.', asStream)).then(stream => parse(stream, { src: file, ...options }));
}
/**
 * parse css
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = await parse(css);
 *  console.log(result.ast);
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
 *  let result = await parse(readableStream, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 *
 * Example using fetch and readable stream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser';
 *
 *  const response = await fetch('https://docs.deno.com/styles.css');
 *  const result = await parse(response.body, {beautify: true});
 *
 *  console.log(result.ast);
 * ```
 */
async function parse(stream, options = {}) {
    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
        stream,
        buffer: '',
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    }), Object.assign(options, { load, resolve, dirname, cwd: options.cwd ?? process.cwd() })).then(result => {
        const { revMapping, ...res } = result;
        return res;
    });
}
/**
 * transform css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @throws Error file not found
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
async function transformFile(file, options = {}, asStream = false) {
    return Promise.resolve((options.load ?? load)(file, '.', asStream)).then(stream => transform(stream, { src: file, ...options }));
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
 *  const result = await transform(css);
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
        let mapping = null;
        let importMapping = null;
        if (typeof options.module == 'number' && (options.module & ModuleScopeEnumOptions.ICSS)) {
            mapping = parseResult.mapping;
            importMapping = parseResult.importMapping;
        }
        else if (typeof options.module == 'object' && typeof options.module.scoped == 'number' && options.module.scoped & ModuleScopeEnumOptions.ICSS) {
            mapping = parseResult.mapping;
            importMapping = parseResult.importMapping;
        }
        // ast already expanded by parse
        const rendered = render(parseResult.ast, { ...options, expandNestingRules: false }, mapping != null ? { mapping, importMapping } : null);
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

export { ModuleScopeEnumOptions, dirname, load, parse, parseFile, render, resolve, transform, transformFile };
