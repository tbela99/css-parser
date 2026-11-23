import type { AstStyleSheet, ErrorDescription, ParseResult, RenderResultStats, TransformResultStats } from "../@types/index.d.ts";
import type { SourceMap } from "./sourcemap.ts";
import type { AstArena } from "../ast/arena.ts";
import type { AstArenaNode } from "../ast/arena-node.ts";
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
export declare class RenderResult {
    #private;
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     *
     * @internal
     */
    static readonly shape: RenderResult;
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
     * @param write rendered css, encoded as UTF-8
     * @param errors
     * @param stats
     * @param map
     * @param codeLength length of the decoded css (`code.length`), computed when it is not provided
     */
    constructor(write: Uint8Array, errors: ErrorDescription[], stats: RenderResultStats, map?: SourceMap, codeLength?: number);
    /**
     * length of the rendered css once decoded (`result.code.length`), without decoding it
     * @param result
     *
     * @internal
     */
    static codeLength(result: RenderResult): number;
    /**
     * Rendered CSS. The bytes of {@link RenderResult.write} are decoded the first time the property is read
     */
    get code(): string;
    /**
     * JSON representation: the css is serialized as a string, the bytes are not serialized
     */
    toJSON(): Record<string, any>;
}
/**
 * Transform result: the parse result and the render result
 */
export declare class TransformResult extends RenderResult {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     *
     * @internal
     */
    static readonly shape: TransformResult;
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
    stats: TransformResultStats;
    /**
     * CSS module mapping
     */
    mapping?: Record<string, string>;
    /**
     * CSS module variables
     * @private
     */
    cssModuleVariables?: Record<string, AstArenaNode>;
    /**
     * css module import mapping
     * @private
     */
    importMapping?: Record<string, Record<string, string>>;
    /**
     * CSS module reverse mapping
     * @private
     */
    revMapping?: Record<string, string>;
    /**
     * @param parseResult
     * @param renderResult
     * @param stats
     */
    constructor(parseResult: ParseResult, renderResult: RenderResult, stats: TransformResultStats);
}
