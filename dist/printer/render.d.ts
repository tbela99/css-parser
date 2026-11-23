import type { AstNode, ErrorDescription, RenderOptions, SourceLocation, Token } from "../@types/index.d.ts";
import { LineMap as LinesMap } from "../parser/linesmap.ts";
import { AstArena } from "../ast/arena.ts";
import { StructuralMemo } from "../ast/cache.ts";
import { Writer } from "./writer.ts";
import { RenderResult } from "./result.ts";
/**
 * Rendered strings shared by the renderer.
 *
 * Identical declarations are very common (`display: block`, `color: #fff`, `width: 10px`, ...): a declaration that has
 * the same name and the same value tokens as a declaration that has already been rendered reuses the rendered string.
 * The same applies to the constructs of the values: colors, functions, parentheses, binary expressions, ... The
 * individual tokens (identifiers, numbers, dimensions, ...) are not memoized: they are rendered when the declaration
 * or the construct that contains them is rendered for the first time.
 *
 * Rendering only depends on the token structure and on the render options: a memo must only be shared by renders that
 * use the same options.
 *
 * The source map locations are not memoized: they are computed for every node from the rendered string and the location
 * of the node.
 *
 * @internal
 */
export declare class RenderMemo {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: RenderMemo;
    /**
     * cleared memos, reused by the next renders: their buffers are not allocated again. read by the library
     * (see {@link acquire})
     *
     * @internal
     */
    static readonly free: RenderMemo[];
    /**
     * rendered declarations (`name:value`), by name and value tokens
     */
    readonly declarations: StructuralMemo<string>;
    /**
     * rendered constructs: colors and tokens with sub tokens (functions, parentheses, binary expressions, ...)
     */
    readonly constructs: StructuralMemo<string>;
    /**
     * location of the declarations in the render buffer, by declaration slot: writer id, start offset, end offset and
     * number of bytes minus the number of UTF-16 code units (4 values per slot). an identical declaration written to the
     * same buffer is copied from there (see {@link Writer.copy})
     */
    locations: Int32Array;
    /**
     * rendered values of the declarations (without the name), by declaration slot: a declaration written to another
     * buffer is not rendered again
     */
    readonly values: Array<string | undefined>;
    /**
     * a cleared memo
     */
    static acquire(): RenderMemo;
    /**
     * clear a memo that is no longer used and keep it for the next renders. the large memos (more than 4 MB) are not
     * kept: they are reclaimed by the garbage collector
     * @param memo
     */
    static release(memo: RenderMemo): void;
    /**
     * record the location of a declaration in a render buffer
     * @param slot declaration slot
     * @param writer render buffer
     * @param start start offset
     * @param extra value of {@link Writer.extra} at the start offset
     */
    locate(slot: number, writer: Writer, start: number, extra: number): void;
}
export declare class NodeRenderer {
    /**
     * An instance is kept alive: the hidden class of the instances would otherwise be collected by a full garbage
     * collection when no instance is alive, and the optimized code that depends on it discarded (deoptimized)
     */
    static readonly shape: NodeRenderer;
    /**
     * options
     */
    private readonly options;
    /**
     * resolved options
     */
    private readonly resolved;
    /**
     * render state. the memo keys contain interned string ids: the memo is valid for one arena
     */
    private cache;
    /**
     * errors
     */
    private readonly errors;
    /**
     * token reducer, bound to an arena
     */
    private reducer;
    /**
     * arena of the reducer
     */
    private arena;
    /**
     * indentation by level
     */
    private readonly indents;
    /**
     * output location, not used: there is no source map
     */
    private readonly location;
    /**
     * the nodes are rendered without doRender(): no nesting expansion, no parents, no source map
     */
    private readonly direct;
    /**
     * output buffer, reused by the renders: only the size of the output is read
     */
    private readonly writer;
    /**
     * @param options render options
     */
    constructor(options: RenderOptions);
    /**
     * rendered size of a node: the length of the rendered css (UTF-16 code units)
     * @param arena
     * @param node
     */
    size(arena: AstArena, node: AstNode): number;
}
/**
 * capacity of the buffer a node is rendered to. the minified or beautified output is usually not larger than the
 * input: the length of the input the node was parsed from, padded
 * - stylesheet: the length of the css parsed into the stylesheet, imported files included
 * - other nodes: the length of their location in the source
 * @param arena
 * @param node
 *
 * @internal
 */
export declare function outputCapacity(arena: AstArena, node: AstNode): number;
/**
 * render ast
 * @param arena
 * @param data node id
 * @param options
 * @param mapping
 * @param memo rendered values shared with other renders that use the same options (see {@link NodeRenderer})
 * @private
 */
export declare function doRender(arena: AstArena, data: AstNode, options?: RenderOptions, mapping?: {
    mapping: Record<string, string>;
    importMapping: Record<string, Record<string, string>> | null;
} | null, memo?: RenderMemo | null): RenderResult;
/**
 * Update position
 * @param sourceLocation
 * @param linesMap
 * @param str
 * @param start
 * @param end
 */
export declare function move(sourceLocation: SourceLocation, linesMap: LinesMap, str: string, start?: number, end?: number): void;
/**
 * render ast token. identical constructs (colors and tokens with sub tokens: functions, parentheses, binary
 * expressions, ...) are rendered once per render, see {@link RenderMemo}
 * @param arena
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 * @private
 */
export declare function renderValue(arena: AstArena, token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: null | ((acc: string, curr: Token) => string), errors?: ErrorDescription[]): string;
/**
 * Remove whitespace tokens that are not needed
 * @param arena
 * @param values
 *
 * @internal
 */
export declare function filterValues(arena: AstArena, values: Token[]): Token[];
