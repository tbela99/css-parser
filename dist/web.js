import { doParse } from './lib/parser/parse.js';
export { parseDeclarations, parseString } from './lib/parser/parse.js';
import { doRender } from './lib/renderer/render.js';
export { renderValue as renderToken } from './lib/renderer/render.js';
import { ModuleScopeEnumOptions } from './lib/ast/types.js';
export { ColorType, EnumAstNodeStatus, EnumToken, ModuleCaseTransformEnum, ValidationLevel } from './lib/ast/types.js';
import { tokenizeStream, tokenize } from './lib/parser/tokenize.js';
import { matchUrl, resolve, dirname } from './lib/fs/resolve.js';
import { ResponseType } from './types.js';
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
    if (typeof responseType == "boolean") {
        responseType = responseType ? ResponseType.ReadableStream : ResponseType.Text;
    }
    let t;
    if (typeof url == "object") {
        t = new URL(url.absolute, self.origin);
    }
    else if (matchUrl.test(url)) {
        t = new URL(url);
    }
    else if (currentDirectory != null && matchUrl.test(currentDirectory)) {
        t = new URL(url, currentDirectory);
    }
    else {
        const path = resolve(url, currentDirectory).absolute;
        t = new URL(path, self.origin);
    }
    return fetch(t, t.origin != self.origin ? { mode: "cors" } : {}).then(async (response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} ${response.url}`);
        }
        if (responseType == ResponseType.ArrayBuffer) {
            return response.arrayBuffer();
        }
        return responseType == ResponseType.ReadableStream ? response.body : response.text();
    });
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
    return doRender(data, Object.assign(options, {
        resolve,
        dirname,
        cwd: (options.cwd ?? self.location.pathname.endsWith("/"))
            ? self.location.pathname
            : dirname(self.location.pathname),
    }), mapping);
}
/**
 * Parse css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated
 * @throws Error file not found
 *
 * Example:
 *
 * ```ts
 *
 *  import {parseFile} from '@tbela99/css-parser/web';
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
    console.error("DeprecationWarning: parseFile is deprecated, use parse instead as parse({file, asStream, ...options})");
    return parse({ file, asStream, ...options });
}
/**
 * Parse css
 * @param stream
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parse} from '@tbela99/css-parser/web';
 *
 *  // css string
 *  const result = await parse(css);
 *  console.log(result.ast);
 * ```
 *
 * Example using fetch and readable stream
 *
 * ```ts
 *
 *  import {parse} from '@tbela99/css-parser/web';
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
            return Promise.resolve((options.load ?? load)(file, ".", options.asStream ?? false)).then((stream) => parse(stream, { src: options.file, ...options }));
        }
        else {
            stream = input;
        }
    }
    options ??= {};
    options.parseInfo = {
        stream,
        buffer: "",
        offset: 0,
        time: 0,
        src: options.src ?? "",
        position: { ind: 0, lin: 1, col: 0 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    };
    return doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize(options.parseInfo), Object.assign(options, {
        load,
        resolve,
        dirname,
        cwd: (options.cwd ?? self.location.pathname.endsWith("/"))
            ? self.location.pathname
            : dirname(self.location.pathname),
    })).then((result) => {
        const { revMapping, ...res } = result;
        return res;
    });
}
/**
 * Transform css file
 * @param file url or path
 * @param options
 * @param asStream load file as stream
 *
 * @deprecated
 * Example:
 *
 * ```ts
 *
 * import {transform} from '@tbela99/css-parser/web';
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
async function transformFile(file, options = {}, asStream = false) {
    console.error("DeprecationWarning: transformFile is deprecated, use transform instead as transform({file, asStream, ...options})");
    return transform({
        file,
        asStream,
        ...options,
    });
}
/**
 * Transform css
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
            return Promise.resolve((options.load ?? load)(file, ".", options.asStream ?? false)).then((stream) => transform(stream, { src: options.file, ...options }));
        }
        else {
            stream = input;
        }
    }
    options = { minify: true, removeEmpty: true, removeCharset: true, ...options };
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

export { ModuleScopeEnumOptions, ResponseType, dirname, load, parse, parseFile, render, resolve, transform, transformFile };
