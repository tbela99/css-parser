import type {
    AstStyleSheet,
    ErrorDescription,
    ParseResult,
    RenderResultStats,
    TransformResultStats,
} from "../@types/index.d.ts";
import type { SourceMap } from "./sourcemap.ts";
import type { AstArena } from "../ast/arena.ts";
import type { AstArenaNode } from "../ast/arena-node.ts";

/**
 * shared decoder
 */
const decoder: TextDecoder = new TextDecoder();

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
export class RenderResult {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     *
     * @internal
     */
    static readonly shape: RenderResult = new RenderResult(new Uint8Array(0), [], { total: "0ms" });

    /**
     * Rendered CSS, encoded as UTF-8
     */
    write: Uint8Array;
    /**
     * Render errors
     */
    errors: ErrorDescription[];
    /**
     * Render stats
     */
    stats: RenderResultStats;
    /**
     * Source map
     */
    map?: SourceMap;

    /**
     * decoded css
     */
    #code: string | null = null;

    /**
     * length of the decoded css: `code.length`
     */
    readonly #codeLength: number;

    /**
     * @param write rendered css, encoded as UTF-8
     * @param errors
     * @param stats
     * @param map
     * @param codeLength length of the decoded css (`code.length`), computed when it is not provided
     */
    constructor(
        write: Uint8Array,
        errors: ErrorDescription[],
        stats: RenderResultStats,
        map?: SourceMap,
        codeLength: number = -1,
    ) {
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
    static codeLength(result: RenderResult): number {
        return result.#codeLength >= 0 ? result.#codeLength : result.code.length;
    }

    /**
     * Rendered CSS. The bytes of {@link RenderResult.write} are decoded the first time the property is read
     */
    get code(): string {
        if (this.#code === null) {
            this.#code = decoder.decode(this.write);
        }

        return this.#code;
    }

    /**
     * JSON representation: the css is serialized as a string, the bytes are not serialized
     */
    toJSON(): Record<string, any> {
        const { write, ...json } = this as Record<string, any>;

        json.code = this.code;
        return json;
    }
}

/**
 * Transform result: the parse result and the render result
 */
export class TransformResult extends RenderResult {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     *
     * @internal
     */
    static readonly shape: TransformResult = new TransformResult(
        { ast: 0 as AstStyleSheet, arena: null as unknown as AstArena, errors: [], stats: {} as any },
        RenderResult.shape,
        {} as TransformResultStats,
    );

    /**
     * Parsed ast tree: the id of the stylesheet node in {@link TransformResult.arena}
     */
    ast: AstStyleSheet;
    /**
     * arena the ast nodes are stored in
     */
    arena: AstArena;
    /**
     * Transform stats
     */
    declare stats: TransformResultStats;
    /**
     * CSS module mapping
     */
    declare mapping?: Record<string, string>;
    /**
     * CSS module variables
     * @private
     */
    declare cssModuleVariables?: Record<string, AstArenaNode>;
    /**
     * css module import mapping
     * @private
     */
    declare importMapping?: Record<string, Record<string, string>>;
    /**
     * CSS module reverse mapping
     * @private
     */
    declare revMapping?: Record<string, string>;

    /**
     * @param parseResult
     * @param renderResult
     * @param stats
     */
    constructor(parseResult: ParseResult, renderResult: RenderResult, stats: TransformResultStats) {
        super(
            renderResult.write,
            parseResult.errors.concat(renderResult.errors),
            stats,
            renderResult.map,
            RenderResult.codeLength(renderResult),
        );

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
