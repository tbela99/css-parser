import { deprecate } from 'node:util';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import { lstat, readFile } from 'node:fs/promises';
import { doParse, doParseSync } from './lib/parser/parse.js';
export { parseDeclarations, parseString } from './lib/parser/parse.js';
import { doRender } from './lib/renderer/render.js';
export { renderValue as renderToken } from './lib/renderer/render.js';
import { ModuleScopeEnumOptions } from './lib/ast/types.js';
export { ColorType, EnumAstNodeStatus, EnumToken, ModuleCaseTransformEnum, ValidationLevel } from './lib/ast/types.js';
import { tokenizeStream, tokenize } from './lib/parser/tokenize.js';
import { dirname, resolve, matchUrl } from './lib/fs/resolve.js';
import { ResponseType } from './types.js';
import { resolve as resolve$1 } from 'node:path';
import { SourceFile } from './lib/parser/source.js';
import { cwd } from 'node:process';
import { parseResult, validateSyncArguments } from './utils/sync.js';
export { minify } from './lib/ast/minify.js';
export { expand } from './lib/ast/expand.js';
export { WalkerEvent, WalkerOptionEnum, walk, walkValues } from './lib/ast/walk.js';
export { convertColor } from './lib/syntax/color/color.js';
export { isOkLabClose, okLabDistance } from './lib/syntax/color/utils/distance.js';
export { find, findAll, findByValue, findLast } from './lib/ast/find.js';
export { cloneNode } from './lib/ast/clone.js';
export { replaceNodeOrValue } from './lib/parser/utils/token.js';
export { SourceMap } from './lib/renderer/sourcemap/sourcemap.js';
export { FeatureWalkMode } from './lib/ast/features/type.js';
export { getNodeProperty, setNodeProperty } from './lib/ast/node.js';

/**
 * Load file or url
 * @param url
 * @param currentDirectory
 * @param responseType
 * @throws Error file not found
 *
 * ```ts
 * import {load, ResponseType} from '@tbela99/css-parser';
 * const result = await load(file, '.', ResponseType.ArrayBuffer) as ArrayBuffer;
 * ```
 */
async function load(url, currentDirectory = ".", responseType = false) {
    const resolved = typeof url == "string" ? resolve(url, currentDirectory) : url;
    if (typeof responseType == "boolean") {
        responseType = responseType ? ResponseType.ReadableStream : ResponseType.Text;
    }
    if (matchUrl.test(resolved.absolute)) {
        return fetch(resolved.absolute).then(async (response) => {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText} ${response.url}`);
            }
            if (responseType == ResponseType.ArrayBuffer) {
                return response.arrayBuffer();
            }
            if (responseType == ResponseType.JSON) {
                return response.json();
            }
            return responseType == ResponseType.ReadableStream
                ? response.body
                : response.text();
        });
    }
    try {
        const stats = await lstat(resolved.absolute);
        if (stats.isFile()) {
            if (responseType == ResponseType.Text || responseType == ResponseType.JSON) {
                return readFile(resolved.absolute, "utf-8").then((buffer) => responseType == ResponseType.JSON ? JSON.parse(buffer) : buffer);
            }
            if (responseType == ResponseType.ArrayBuffer) {
                return readFile(resolved.absolute).then((buffer) => buffer.buffer);
            }
            return Readable.toWeb(createReadStream(resolved.absolute, {
                encoding: "utf-8",
                highWaterMark: 64 * 1024,
            }));
        }
    }
    catch (error) { }
    throw new Error(`File not found: '${resolved.absolute || url}'`);
}
/**
 * Render the ast tree
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
    return doRender(data, Object.assign(options, { resolve, dirname, cwd: options.cwd ?? resolve$1() }), mapping);
}
/**
 * Parse CSS file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated
 * @see {@link parse}
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
const parseFile = deprecate(async (file, options = {}, asStream = false) => parse({ file, asStream, ...options }), "parseFile is deprecated, use parse instead as parse({file, asStream, ...options})");
/**
 * Parse CSS
 * @param args
 *
 * Parsing a string
 *
 * ```ts
 *
 * import {parseSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  let result = parseSync(css, {nestingRules: true});
 *  console.log(result.ast);
 * ```
 *
 */
function parseSync(...args) {
    let options;
    let stream;
    if (typeof args[0] === "string") {
        stream = args[0];
        options = args[1];
    }
    else {
        const { input, ...opt } = args[0];
        options = opt;
        stream = input;
    }
    if (options != null) {
        validateSyncArguments(options);
    }
    options ??= {};
    options.src ??= "";
    options.sourcesMap ??= new Map();
    Object.assign(options, {
        resolve,
        dirname,
        cwd: options.cwd ?? cwd(),
    });
    options.src = resolve(options.src, options.cwd).relative;
    if (options.source == null) {
        const source = new SourceFile(typeof stream == "string" ? stream : "", [], options.src);
        options.sourcesMap.set(source.id, source);
        options.source = source;
    }
    options.parseInfo = {
        stream,
        buffer: "",
        src: options.src ?? "",
        offset: 0,
        time: 0,
        source: options.source,
        position: 0,
        currentPosition: 0,
    };
    const result = doParseSync(tokenize(options.parseInfo), options);
    return options.module == null && options.inputSourceMap == null && !options.sourcemap
        ? result
        : parseResult(result, options);
}
/**
 * Transform CSS
 *
 * ```ts
 *
 * import {transformSync} from '@tbela99/css-parser';
 *
 *  // css string
 *  const result = transformSync(css);
 *  console.log(result.code);
 * ```
 *
 * @param args
 */
function transformSync(...args) {
    let options;
    let stream;
    if (typeof args[0] === "string") {
        stream = args[0];
        options = args[1];
    }
    else {
        const { input, ...opt } = args[0];
        // @ts-ignore
        options = opt;
        stream = input;
    }
    options ??= {};
    if (options.minify == null) {
        options.minify = true;
    }
    if (options.removeEmpty == null) {
        options.removeEmpty = true;
    }
    if (options.removeCharset == null) {
        options.removeCharset = true;
    }
    const startTime = performance.now();
    const parseResult = parseSync(stream, options);
    let mapping = null;
    let importMapping = null;
    if (typeof options.module == "number" && options.module & ModuleScopeEnumOptions.ICSS) {
        mapping = parseResult.mapping;
        importMapping = parseResult.importMapping;
    }
    else if (typeof options.module == "object" &&
        typeof options.module.scoped == "number" &&
        options.module.scoped & ModuleScopeEnumOptions.ICSS) {
        mapping = parseResult.mapping;
        importMapping = parseResult.importMapping;
    }
    // ast already expanded by parse
    const rendered = render(parseResult.ast, {
        ...options,
        expandNestingRules: false,
    }, mapping != null ? { mapping, importMapping } : null);
    return {
        ...parseResult,
        ...rendered,
        errors: parseResult.errors.concat(rendered.errors),
        stats: {
            bytesOut: rendered.code.length,
            ...parseResult.stats,
            render: rendered.stats.total,
            total: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
    };
}
/**
 * Parse CSS
 * @param args
 *
 * @throws Error file not found
 *
 * Parsing a string
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
 * Parsing a Readable stream
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
 * Parsing a file as a ReadableStream
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
async function parse(...args) {
    let options;
    let stream;
    if (typeof args[0] === "string" || args[0] instanceof ReadableStream) {
        stream = args[0];
        options = args[1];
    }
    else {
        // @ts-expect-error
        const { file, input, ...opt } = args[0];
        options = opt;
        if (file != null) {
            return Promise.resolve((options.load ?? load)(file, "", options.asStream ?? false)).then((stream) => parse(stream, { src: file, ...options }));
        }
        else {
            stream = input;
        }
    }
    options ??= {};
    options.src ??= "";
    options.sourcesMap ??= new Map();
    Object.assign(options, {
        load,
        resolve,
        dirname,
        cwd: options.cwd ?? cwd(),
    });
    options.src = resolve(options.src, options.cwd).relative;
    if (options.source == null) {
        const source = new SourceFile(typeof stream == "string" ? stream : "", [], options.src);
        options.sourcesMap.set(source.id, source);
        options.source = source;
    }
    options.parseInfo = {
        stream,
        buffer: "",
        src: options.src ?? "",
        offset: 0,
        time: 0,
        source: options.source,
        position: 0,
        currentPosition: 0,
    };
    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream, options.parseInfo) : tokenize(options.parseInfo), options).then((result) => options.module == null && options.inputSourceMap == null && !options.sourcemap
        ? result
        : parseResult(result, options));
}
/**
 * Transform CSS file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated Use transform() instead.
 * @throws Error file not found
 *
 * Example:
 *
 * ```ts
 *
 *  import {transform} from '@tbela99/css-parser';
 *
 *  // remote file
 * let result = await transform({file: 'https://docs.deno.com/styles.css'});
 * console.log(result.code);
 *
 * // local file
 * result = await transform({file: './css/styles.css'});
 * console.log(result.code);
 * ```
 */
const transformFile = deprecate(async (file, options = {}, asStream = false) => transform({
    file,
    asStream,
    ...options,
}), "transformFile is deprecated, use transform instead as transform({file, asStream, ...options})");
/**
 * Transform CSS
 *
 * Parsing a string
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
 * Parsing a Readable stream
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
 * @param args
 */
async function transform(...args) {
    let options;
    let stream;
    if (typeof args[0] === "string" || args[0] instanceof ReadableStream) {
        stream = args[0];
        options = args[1];
    }
    else {
        // @ts-expect-error
        const { file, input, ...opt } = args[0];
        options = opt;
        if (file != null) {
            return Promise.resolve((options.load ?? load)(file, "", options.asStream ?? false)).then((stream) => transform(stream, { src: file, ...options }));
        }
        else {
            stream = input;
        }
    }
    options ??= {};
    if (options.minify == null) {
        options.minify = true;
    }
    if (options.removeEmpty == null) {
        options.removeEmpty = true;
    }
    if (options.removeCharset == null) {
        options.removeCharset = true;
    }
    const startTime = performance.now();
    return parse(stream, options).then((parseResult) => {
        let mapping = null;
        let importMapping = null;
        if (typeof options.module == "number" && options.module & ModuleScopeEnumOptions.ICSS) {
            mapping = parseResult.mapping;
            importMapping = parseResult.importMapping;
        }
        else if (typeof options.module == "object" &&
            typeof options.module.scoped == "number" &&
            options.module.scoped & ModuleScopeEnumOptions.ICSS) {
            mapping = parseResult.mapping;
            importMapping = parseResult.importMapping;
        }
        // ast already expanded by parse
        const rendered = render(parseResult.ast, {
            ...options,
            expandNestingRules: false,
        }, mapping != null ? { mapping, importMapping } : null);
        return {
            ...parseResult,
            ...rendered,
            errors: parseResult.errors.concat(rendered.errors),
            stats: {
                bytesOut: rendered.code.length,
                ...parseResult.stats,
                render: rendered.stats.total,
                total: `${(performance.now() - startTime).toFixed(2)}ms`,
            },
        };
    });
}

export { ModuleScopeEnumOptions, ResponseType, dirname, load, parse, parseFile, parseSync, render, resolve, transform, transformFile, transformSync };
