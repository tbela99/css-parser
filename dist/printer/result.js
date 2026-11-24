/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.2
	License: MIT
 */
/**
 * shared decoder
 */
const decoder = new TextDecoder();
/**
 * Render result.
 *
 * The generated css is stored as UTF-8 bytes in {@link RenderResult.write}: it can be written to a file or sent over
 * the network as is. {@link RenderResult.code} decodes the bytes the first time it is read, the string is kept.
 *
 * ```ts
 * import {render} from '@tbela99/css-parser';
 * import {writeFile} from 'node:fs/promises';
 *
 * const result = render(parseResult.arena, parseResult.ast);
 *
 * // bytes, no string conversion
 * await writeFile('out.css', result.write);
 *
 * // string, decoded once
 * console.log(result.code);
 * ```
 */
class RenderResult {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     *
     * @internal
     */
    static shape = new RenderResult(new Uint8Array(0), [], { total: "0ms" });
    /**
     * Rendered CSS, encoded as UTF-8: the output of the render, no conversion. Use it to write the css to a file or to
     * the network, or to send it to another thread without a copy:
     *
     * ```ts
     * self.postMessage(result.write, [result.write.buffer]);
     * ```
     *
     * It is a view of the first bytes of a larger buffer (`write.buffer`): without a transfer, `postMessage()` copies
     * the whole buffer, send `write.slice()` to copy only the css. See
     * [Zero copy between threads](../../files/usage.md#zero-copy-between-threads).
     */
    write;
    /**
     * Render errors
     */
    errors;
    /**
     * Render stats
     */
    stats;
    /**
     * Source map
     */
    map;
    /**
     * decoded css
     */
    #code = null;
    /**
     * length of the decoded css: `code.length`
     */
    #codeLength;
    /**
     * @param write rendered css, encoded as UTF-8
     * @param errors
     * @param stats
     * @param map
     * @param codeLength length of the decoded css (`code.length`), computed when it is not provided
     */
    constructor(write, errors, stats, map, codeLength = -1) {
        this.write = write;
        this.errors = errors;
        this.stats = stats;
        this.map = map;
        this.#codeLength = codeLength;
    }
    /**
     * length of the rendered css once decoded (`result.code.length`), without decoding it
     * @param result
     *
     * @internal
     */
    static codeLength(result) {
        return result.#codeLength >= 0 ? result.#codeLength : result.code.length;
    }
    /**
     * Rendered CSS. The bytes of {@link RenderResult.write} are decoded the first time the property is read, the
     * string is kept for the next reads: no string is created when it is not read.
     *
     * It is a getter, not a property of the object: `postMessage()` and `structuredClone()` do not send it, and it is
     * an empty string when it is read for the first time after {@link RenderResult.write} was transferred.
     */
    get code() {
        if (this.#code === null) {
            this.#code = decoder.decode(this.write);
        }
        return this.#code;
    }
    /**
     * JSON representation: the css is serialized as a string, the bytes are not serialized
     */
    toJSON() {
        const { write, ...json } = this;
        json.code = this.code;
        return json;
    }
}
/**
 * Transform result: the parse result and the render result
 */
class TransformResult extends RenderResult {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     *
     * @internal
     */
    static shape = new TransformResult({ ast: 0, arena: null, errors: [], stats: {} }, RenderResult.shape, {});
    /**
     * Parsed ast tree: the id of the stylesheet node in {@link TransformResult.arena}
     */
    ast;
    /**
     * arena the ast nodes are stored in
     */
    arena;
    /**
     * @param parseResult
     * @param renderResult
     * @param stats
     */
    constructor(parseResult, renderResult, stats) {
        super(renderResult.write, parseResult.errors.concat(renderResult.errors), stats, renderResult.map, RenderResult.codeLength(renderResult));
        this.ast = parseResult.ast;
        this.arena = parseResult.arena;
        // css module properties are only defined when they are set
        if (parseResult.mapping !== undefined) {
            this.mapping = parseResult.mapping;
        }
        if (parseResult.cssModuleVariables !== undefined) {
            this.cssModuleVariables = parseResult.cssModuleVariables;
        }
        if (parseResult.importMapping !== undefined) {
            this.importMapping = parseResult.importMapping;
        }
        if (parseResult.revMapping !== undefined) {
            this.revMapping = parseResult.revMapping;
        }
    }
}

export { RenderResult, TransformResult };
