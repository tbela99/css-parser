/**
 * Arena memory manager: ast nodes and value tokens are integer ids, their data is stored column-wise
 * in typed arrays (structure of arrays), lists are doubly linked lists stored in the `firstChild` /
 * `lastChild` / `firstToken` / `lastToken` / `nextSibling` / `previousSibling` columns and strings are interned.
 *
 * Every node owns two lists that share the sibling columns:
 *
 * - the children list (`firstChild` / `lastChild`): the child nodes of a stylesheet, a rule or an at-rule, or the
 *   structured fields of a token (see {@link TokenField}),
 * - the token list (`firstToken` / `lastToken`): the value tokens of a declaration, the prelude tokens of a rule / at-rule
 *   or the arguments of a function token (`chi`).
 *
 * Token columns:
 *
 * - `dataTypes`: token type ({@link EnumToken}),
 * - `stringValue`: interned string value (`val`) of identifiers, strings, literals, function names, colors, ...
 * - `numericValue`: numeric value (`val`) of numbers, dimensions and percentages. operator of binary expressions, sign of unary expressions,
 * - `unit`: interned unit of dimensions,
 * - `name`: interned name (`nam`) of at-rule / declaration tokens,
 * - `colorType`: color kind (`kin`) of color tokens,
 * - `spans`: packed source location.
 *
 * Structured tokens (binary expressions, media queries conditions, ...) store their fields (`l`, `r`, `op`, ...) as
 * {@link EnumToken.ListTokenType} children at fixed positions ({@link TokenField}). Fraction tokens store their
 * numerator and denominator as children, numeric tokens with a fraction value store the fraction token as their child.
 *
 * @module
 */
import type { AstAtRule, AstNode, AstNodeMatcher, AstRule, AstStyleSheet, AstValueMatcher, ErrorDescription, OptimizedSelector, PlainAstNode, PlainToken, RawSelectorTokens, SourceLocation, WalkerFilter, WalkerOptions, WalkerValueFilter, WalkerValueOptions } from "../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "./types.ts";
import { AstArenaNode } from "./arena-node.ts";
import type { CodeUnits } from "../parser/utils/codes.ts";
import { StringBuilder, type StringDerived, type StringFlag, StringTable, type StringTableData } from "./strings.ts";
/**
 * position of the structured token fields in the children list
 */
export declare enum TokenField {
    /**
     * left hand side (`l`)
     */
    L = 0,
    /**
     * right hand side (`r`)
     */
    R = 1,
    /**
     * operator (`op`, `op1`)
     */
    Op = 2,
    /**
     * second operator (`op2`)
     */
    Op2 = 3,
    /**
     * value (`val`)
     */
    Val = 4
}
/**
 * numeric token types: the value is stored in the `numericValue` column
 */
export declare const numericTokenTypes: Set<EnumToken>;
/**
 * token types whose fields are stored as list children (see {@link TokenField})
 */
export declare const structuredTokenTypes: Set<EnumToken>;
/**
 * plain object key, field and single value flag of a structured token field. see {@link structuredFields}
 */
export declare type StructuredField = readonly [key: string, field: TokenField, single: boolean];
/**
 * fields of a structured token type: the plain object key (`l`, `r`, `op`, `op1`, `op2`, `val`), the field index and
 * whether the field holds a single token. empty for the other token types
 * @param typ
 * @internal
 */
export declare function structuredFields(typ: EnumToken): ReadonlyArray<StructuredField>;
/**
 * Plain (structured-cloneable) properties of an arena. See {@link Arena.toTransferableArenaObject}
 */
export interface ArenaProperties {
    /**
     * arena class name: `Arena` or `AstArena`
     */
    kind: string;
    /**
     * last allocated id
     */
    current: number;
    /**
     * interned strings
     */
    strings: StringTableData;
    /**
     * validation errors by node id
     */
    errors: Array<[number, ErrorDescription[]]>;
    /**
     * source ids ({@link AstArena})
     */
    sources?: number[];
    /**
     * raw selectors cache ({@link AstArena})
     */
    raw?: Array<[number, RawSelectorTokens | null | undefined]>;
    /**
     * optimized selectors cache ({@link AstArena})
     */
    optimized?: Array<[number, OptimizedSelector | null | undefined]>;
    /**
     * input length of the parsed stylesheets ({@link AstArena})
     */
    inputLengths?: Array<number | undefined>;
}
/**
 * Column buffers of an arena, in the order of {@link arenaColumns}. See {@link Arena.toTransferableArenaObject}
 */
export type ArenaTransferables = ArrayBuffer[];
/**
 * arena columns stored as typed arrays, in the order of the transferable buffers
 */
export declare const arenaColumns: readonly ["dataTypes", "parents", "nextSibling", "previousSibling", "firstToken", "lastToken", "firstChild", "lastChild", "name", "stringValue", "numericValue", "unit", "flags", "colorType", "spans"];
/**
 * Arena memory manager.
 *
 * The node data is stored column-wise in typed arrays allocated for the capacity of the arena ({@link getCapacity},
 * 62 bytes per node). The arena grows by doubling its capacity and never frees memory by itself: detached nodes keep
 * their memory and their ids stay valid. {@link release}, {@link compact}, {@link trim} and {@link compactStrings}
 * reclaim the memory, `compact()` and `trim()` renumber the nodes. See the Arena Memory guide (files/arena.md).
 */
export declare class Arena {
    #private;
    /**
     * interned strings: ranges of the sources, of the canonical text, of the pool, or strings. see {@link StringTable}
     */
    protected stringTable: StringTable;
    /**
     * root node
     */
    readonly root: number;
    /**
     * last allocated node id. the next node is allocated with the id current + 1 (unless a recycled id is available).
     * 0 is never allocated: it means "no node"
     */
    current: number;
    /**
     * node EnumToken type array
     */
    dataTypes: Uint8Array;
    /**
     * parent node id array
     */
    parents: Uint32Array;
    /**
     * next sibling node id array
     */
    nextSibling: Uint32Array;
    /**
     * previous sibling node id array
     */
    previousSibling: Uint32Array;
    /**
     * first token node id array
     */
    firstToken: Uint32Array;
    /**
     * last token node id array
     */
    lastToken: Uint32Array;
    /**
     * first child node id array
     */
    firstChild: Uint32Array;
    /**
     * last child node id array
     */
    lastChild: Uint32Array;
    /**
     * node name string interner id array. used to store (node as AstRule | AstDeclaration | AstKeyframesAtRule).nam and (node as AstRule | AstKeyframesRule).sel
     */
    name: Uint32Array;
    /**
     * node string value index array.
     */
    stringValue: Uint32Array;
    /**
     * node numeric value array. previously used as (node as NumberToken | DimensionToken).val
     */
    numericValue: Float64Array;
    /**
     * node unit string interner id array. previously used as (node as DimensionToken).unit
     */
    unit: Uint32Array;
    /**
     * node flags
     */
    flags: Uint32Array;
    /**
     * color type. previously use as (node as ColorToken).kin
     */
    colorType: Uint8Array;
    /**
     * token spans. 8 bits for source type. 28 bits for start position, 28 bits for end position. This allows us to store the start and end positions of tokens in a single 64-bit integer, which is more efficient than storing them separately.
     */
    spans: BigUint64Array;
    /**
     * error cache
     */
    errors: Map<number, ErrorDescription[]>;
    /**
     * head of the list of recycled node ids. the list is linked through the `nextSibling` column, see {@link recycle}
     */
    protected freeList: number;
    /**
     * number of nodes the columns can hold: the length of the columns. the length of a typed array is a getter,
     * allocate() reads the capacity of the arena for each node
     */
    protected capacity: number;
    /**
     * 32 bits view of the spans: the low word holds the end position and the 4 low bits of the start position,
     * the high word holds the 24 high bits of the start position and the source
     */
    protected spans32: Uint32Array;
    constructor(size?: number);
    /**
     * true when the column buffers have been transferred to another thread: the arena can no longer be used
     */
    get transferred(): boolean;
    /**
     * Export the arena as a structured-cloneable object and the list of its column buffers, to send an arena
     * to a worker (or back to the main thread) without copying the node data.
     *
     * The properties (strings, errors, ...) are cloned by `postMessage()`, the column buffers are moved when they are
     * passed as the transfer list: the source arena must not be used afterwards (its columns are detached).
     * The buffers are copied instead when the transfer list is omitted.
     *
     * ```ts
     * // main thread
     * const [properties, transferables] = AstArena.toTransferableArenaObject(result.arena);
     *
     * worker.postMessage({ ast: result.ast, properties, transferables }, transferables);
     *
     * // worker
     * const { ast, properties, transferables } = event.data;
     * const arena = AstArena.fromTransferableArenaObjects(properties, transferables);
     * ```
     *
     * @param arena
     * @returns the arena properties and the column buffers, see {@link ArenaProperties} and {@link ArenaTransferables}
     */
    static toTransferableArenaObject(arena: Arena): [ArenaProperties, ArenaTransferables];
    /**
     * Create an arena from the objects produced by {@link Arena.toTransferableArenaObject}. The column buffers are
     * used as is (zero copy): the typed arrays are views on the given buffers.
     *
     * @param properties arena properties
     * @param transferables column buffers
     * @returns an `Arena` or an `AstArena` depending on the class the method is called on
     */
    static fromTransferableArenaObjects<T extends Arena>(this: new (size?: number) => T, properties: ArenaProperties, transferables: ArenaTransferables): T;
    allocate(): number;
    /**
     * recycle a detached leaf node (no parent, no children, no tokens) that is no longer referenced:
     * its id is reused by the next allocation. the record is zeroed, so a stale reference reads an empty node
     * @param id
     */
    recycle(id: number): void;
    /**
     * Interns a string and returns its unique ID. If the string has already been interned, it returns the existing ID.
     * The strings are looked up by the hash of their code units, see {@link internRange}
     * @param str
     * @returns
     */
    internString(str: string): number;
    /**
     * Interns the string made of a range of code units and returns its unique ID. Same ID as {@link internString} for
     * the same content. The range is looked up by its hash and compared with the code units of the interned strings:
     * no string is created.
     *
     * - a range of a source (the code units read by the tokenizer): the source index and the offsets are stored, the
     *   text of the source is set with {@link setSourceText}
     * - `StringSource.Canonical`: a range of the canonical text (the spelling of the known units and function names)
     * - `StringSource.Pool`: the code units are copied (decoded escape sequences, ...)
     *
     * @param codes code units
     * @param start start offset of the range
     * @param end end offset of the range
     * @param source source index, `StringSource.Canonical` or `StringSource.Pool`
     */
    internRange(codes: CodeUnits, start: number, end: number, source: number): number;
    /**
     * set the text of a source: the strings interned from the source are ranges of the text, see {@link internRange}
     * @param source source index
     * @param text content of the source
     * @param codes code units of the text while the source is tokenized (faster comparisons)
     */
    setSourceText(source: number, text: string, codes?: CodeUnits | null): void;
    /**
     * drop the code units of a source set by {@link setSourceText}: the source is no longer tokenized
     * @param source source index
     */
    releaseSourceCodes(source: number): void;
    /**
     * id of an interned string, -1 when the string is not interned
     * @param str
     */
    stringId(str: string): number;
    /**
     * length of an interned string. the string is not created
     * @param id
     */
    stringLength(id: number): number;
    /**
     * code unit of an interned string. the string is not created
     * @param id
     * @param index
     */
    stringCodeAt(id: number, index: number): number;
    /**
     * index of the first occurrence of a code unit in an interned string, -1 when it is not found. the string is not
     * created
     * @param id
     * @param code
     */
    stringIndexOf(id: number, code: number): number;
    /**
     * true if an interned string equals a string. the interned string is not created
     * @param id
     * @param str
     */
    stringEquals(id: number, str: string): boolean;
    /**
     * true if an interned string equals a string, ignoring the case of the ascii letters. the interned string is not
     * created
     * @param id
     * @param str
     */
    stringEqualsIgnoreCase(id: number, str: string): boolean;
    /**
     * true if an interned string starts with a string. the interned string is not created
     * @param id
     * @param str
     */
    stringStartsWith(id: number, str: string): boolean;
    /**
     * id of the lowercase version of an interned string (like `toLowerCase()`). no string is created when the string
     * is ascii. the result is cached
     * @param id
     */
    lowerStringId(id: number): number;
    /**
     * copy an interned string to a byte buffer when it is ascii (UTF-8 encoding). the string is not created
     * @param id
     * @param target
     * @param offset offset in the target. the target has room for the string ({@link stringLength})
     * @returns the number of bytes, -1 when the string is not ascii
     */
    copyStringAscii(id: number, target: Uint8Array, offset: number): number;
    /**
     * a boolean property of an interned string, computed once per string id: the string is read once
     * @param id
     * @param flag
     * @param compute computes the property from the string
     */
    stringFlag(id: number, flag: StringFlag, compute: (str: string) => boolean): boolean;
    /**
     * a boolean property of an interned string, computed once per string id from the id (see {@link stringCodeAt})
     * @param id
     * @param flag
     * @param compute computes the property from the string id
     */
    stringFlagId(id: number, flag: StringFlag, compute: (id: number) => boolean): boolean;
    /**
     * a value derived from an interned string, computed once per string id
     * @param id
     * @param slot
     * @param compute computes the value from the string id
     */
    stringDerived<T>(id: number, slot: StringDerived, compute: (id: number) => T): T;
    /**
     * copy the code units of an interned string to a buffer. the string is not created
     * @param id
     * @param target the target has room for the string ({@link stringLength})
     * @param offset
     * @returns the number of code units
     */
    copyString(id: number, target: Uint16Array, offset: number): number;
    /**
     * append an interned string to a builder. the string is not created
     * @param builder
     * @param id
     */
    appendString(builder: StringBuilder, id: number): StringBuilder;
    /**
     * intern the string built by a builder: no string is created
     * @param builder
     */
    internBuilder(builder: StringBuilder): number;
    /**
     * identity of the string ids: a new object when the strings are renumbered ({@link compact},
     * {@link compactStrings}). the caches keyed by string ids use it as a key
     */
    get stringEpoch(): object;
    /**
     *
     * @param id
     */
    getType(id: number): EnumToken;
    /**
     * type of node or a token. null when the id is null
     * @param id
     */
    typeOf(id: number | null | undefined): EnumToken | null;
    /**
     *
     * @param id
     * @param type
     */
    setType(id: number, type: EnumToken): void;
    /**
     *
     * @param id
     * @param nameId
     */
    setName(id: number, nameId: number): void;
    /**
     *
     * @param id
     */
    getName(id: number): string;
    /**
     *
     * @param id
     * @param valueId
     */
    setValue(id: number, valueId: number): void;
    /**
     *
     * @param id
     */
    getValue(id: number): string;
    /**
     *
     * @param id
     * @param numericValue
     */
    setNumericValue(id: number, numericValue: number): void;
    /**
     *
     * @param id
     * @param unit
     */
    setUnit(id: number, unit: number): void;
    /**
     *
     * @param id
     */
    getUnit(id: number): string;
    /**
     *
     * @param id
     */
    getNumericValue(id: number): number;
    /**
     *
     * @param id
     * @param parentId
     */
    setParent(id: number, parentId: number): void;
    /**
     * first child of a node. 0 when the node has no children
     * @param id
     */
    getFirstChild(id: number): number;
    /**
     * next sibling of a node or of a token. 0 for the last node / token of the list
     * @param id
     */
    getNextSibling(id: number): number;
    /**
     * previous sibling of a node or of a token. 0 for the first node / token of the list
     * @param id
     */
    getPreviousSibling(id: number): number;
    /**
     * first token of the token list of a node or of a token (declaration value, selector / prelude tokens, function
     * arguments). 0 when the list is empty
     * @param id
     */
    getFirstToken(id: number): number;
    /**
     * last token of the token list of a node or of a token. 0 when the list is empty
     * @param id
     */
    getLastToken(id: number): number;
    /**
     * number of nodes the columns can hold before the arena grows. see {@link getLastId} for the last allocated id
     */
    getCapacity(): number;
    /**
     * last allocated node id. the ids of the arena are in the range 1 ... getLastId(), the detached nodes included
     */
    getLastId(): number;
    /**
     * number of interned strings
     */
    getStringCount(): number;
    /**
     * replace the first child
     * @param id
     * @param firstChildId
     */
    setFirstChild(id: number, firstChildId: number): void;
    /**
     *
     * @param id
     */
    getLastChild(id: number): number;
    /**
     * replace the last child
     * @param id
     * @param lastChildId
     */
    setLastChild(id: number, lastChildId: number): void;
    /**
     * insert a node after another one
     * @param id
     * @param nextSiblingId
     */
    setNextSibling(id: number, nextSiblingId: number): void;
    /**
     * insert a node before another one
     * @param id
     * @param previousSiblingId
     */
    setPreviousSibling(id: number, previousSiblingId: number): void;
    /**
     * replace the first token
     * @param id
     * @param firstTokenId
     */
    setFirstToken(id: number, firstTokenId: number): void;
    /**
     *
     * @param id
     * @param colorType
     */
    setColorType(id: number, colorType: number): void;
    /**
     *
     * @param id
     */
    getColorType(id: number): number;
    /**
     *
     * @param id
     * @param flags
     */
    setFlags(id: number, flags: number): void;
    /**
     *
     * @param id
     */
    getFlags(id: number): number;
    /**
     *
     * @param id
     * @param flag
     */
    hasFlags(id: number, flag: number): boolean;
    /**
     *
     * @param id
     * @param index
     */
    getChildAt(id: number, index: number): number | null;
    /**
     * token at the given position of the token list
     * @param id
     * @param index
     */
    getTokenAt(id: number, index: number): number | null;
    /**
     * replace the child at the given index. the node is appended when the index is out of range
     * @param id
     * @param index
     * @param child
     */
    setChildAt(id: number, index: number, child: number): void;
    /**
     * list node holding the tokens of a structured token field. created when missing
     * @param id
     * @param field
     */
    fieldList(id: number, field: TokenField): number;
    /**
     * true if the field exists and is not empty
     * @param id
     * @param field
     */
    hasField(id: number, field: TokenField): boolean;
    /**
     * first token of a structured token field (single token fields: `l` and `r` of binary expressions, `op`, ...)
     * @param id
     * @param field
     */
    field(id: number, field: TokenField): number;
    /**
     * tokens of a structured token field
     * @param id
     * @param field
     */
    fieldTokens(id: number, field: TokenField): number[];
    /**
     * set the tokens of a structured token field
     * @param id
     * @param field
     * @param tokens
     */
    setField(id: number, field: TokenField, ...tokens: number[]): void;
    /**
     * append tokens to a structured token field
     * @param id
     * @param field
     * @param tokens
     */
    appendField(id: number, field: TokenField, ...tokens: number[]): void;
    /**
     *
     * @param id
     * @param children
     */
    setLeft(id: number, ...children: number[]): void;
    /**
     *
     * @param id
     */
    getLeft(id: number): number[] | null;
    /**
     *
     * @param id
     * @param rightId
     */
    setRight(id: number, rightId: null): void;
    /**
     *
     * @param id
     * @param rightId
     */
    setRight(id: number, ...rightId: number[]): void;
    /**
     *
     * @param id
     */
    getRight(id: number): number[] | null;
    /**
     *
     * @param id
     * @param opId
     */
    setOp(id: number, opId: number): void;
    /**
     *
     * @param id
     */
    getOp(id: number): number;
    /**
     *
     * @param id
     * @param op2Id
     */
    setOp2(id: number, op2Id: number): void;
    /**
     *
     * @param id
     */
    getOp2(id: number): number;
    /**
     *
     * @param id
     * @param sourceId
     * @param start
     * @param end
     */
    setSpan(id: number, sourceId: number, start: number, end: number): void;
    /**
     * copy the packed location of a node
     * @param target
     * @param source
     */
    copySpan(target: number, source: number): void;
    /**
     *
     * @param id
     */
    getSourceId(id: number): number;
    /**
     *
     * @param id
     */
    getSpanStart(id: number): number;
    /**
     *
     * @param id
     * @param start
     */
    setSpandStart(id: number, start: number): void;
    /**
     *
     * @param id
     */
    getSpanEnd(id: number): number;
    /**
     *
     * @param id
     * @param end
     */
    setSpanEnd(id: number, end: number): void;
    /**
     *
     * @param id
     */
    getParent(id: number): number;
    /**
     *
     * @param id
     */
    resolveString(id: number): string;
    /**
     * detach a node from its parent
     * @param id
     */
    detach(id: number): void;
    /**
     * Walk the ast nodes: the node and its descendants, in document order. The iterator returns node ids (and value
     * tokens when `attributes` is set). The children of a node are read when the next node is requested: the current
     * node can be modified or detached by the caller.
     *
     * ```ts
     * import {EnumToken, transform, WalkerOptionEnum} from '@tbela99/css-parser';
     *
     * const result = await transform(css);
     * const arena = result.arena;
     *
     * for (const node of arena.walk(result.ast)) {
     *
     *     console.log(EnumToken[arena.getType(node)], arena.getParent(node));
     * }
     *
     * // the filter controls the walk, see WalkerOptionEnum
     * function filter(arena: AstArena, node: number) {
     *
     *     if (arena.getType(node) == EnumToken.RuleNodeType && arena.getSelector(node).includes('html')) {
     *
     *         // skip the children of the current node
     *         return WalkerOptionEnum.IgnoreChildren;
     *     }
     * }
     *
     * for (const node of arena.walk(result.ast, filter)) {
     *
     *     console.log(EnumToken[arena.getType(node)]);
     * }
     * ```
     *
     * @param node initial node id (or value token)
     * @param filter filter function or walker options
     * @param reverse walk in reverse order
     */
    walk(node: number, filter?: WalkerFilter | WalkerOptions | null, reverse?: boolean): IterableIterator<number>;
    /**
     * Walk value tokens and their descendants (function arguments, structured token fields, ...), in document
     * order. The iterator returns token ids. The children of a token are read when the next token is requested: the
     * current token can be modified or replaced by the caller.
     *
     * ```ts
     * import {EnumToken, transform} from '@tbela99/css-parser';
     *
     * const css = `
     * body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
     * `;
     *
     * const result = await transform(css);
     * const arena = result.arena;
     * const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));
     *
     * // walk the value tokens of the declaration in reverse order
     * for (const value of arena.walkValues(declaration, null, true)) {
     *
     *     console.error([EnumToken[arena.getType(value)], arena.getValue(value)]);
     * }
     * ```
     *
     * @param tokens token ids, or a node / token id: its value tokens are walked
     * @param filter filter function, called with the arena, the token id and the event, or filter options
     * @param reverse walk in reverse order
     */
    walkValues(tokens: number | number[], filter?: WalkerValueFilter | WalkerValueOptions | null, reverse?: boolean): IterableIterator<number>;
    /**
     * call the visitor for the tokens and their children, in the order of {@link walkValues} (the children of a
     * token are read after the visitor returns). no iterator or stack is created: use it when the visitor is not a
     * closure
     * @param tokens
     * @param visitor
     * @internal
     */
    visitValues(tokens: number[], visitor: (arena: this, token: number) => void): void;
    /**
     * parent of a value token: the node or the token that owns the token list, or the structured token that owns the
     * field (the field list token is skipped). 0 when the token is detached
     * @param id
     */
    getValueParent(id: number): number;
    /**
     * node that owns a value token: the declaration, the rule or the at-rule. 0 when the token is detached
     * @param id
     */
    getValueOwner(id: number): number;
    /**
     * Search the ast subtree and return the first match, in document order
     *
     * ```ts
     * // find the first declaration which name is 'aspect-ratio'
     * import { EnumToken, transform } from "@tbela99/css-parser";
     *
     * const result = await transform(css);
     * const arena = result.arena;
     *
     * const node = arena.find(result.ast, (arena, node) =>
     *     arena.getType(node) == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio');
     *
     * console.log(node == null ? null : arena.toObject(node));
     * ```
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     * @returns the node id or null
     */
    find(node: number, matcher: AstNodeMatcher): number | null;
    /**
     * Search the ast subtree and return all matches, in document order
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     */
    findAll(node: number, matcher: AstNodeMatcher): number[];
    /**
     * Search the ast subtree in reverse order and return the first match (the last node in document order)
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     */
    findLast(node: number, matcher: AstNodeMatcher): number | null;
    /**
     * Search the value tokens of the ast subtree and return the first match: the node that owns the token and the
     * token
     *
     * ```ts
     * // find the first node which contains the length token '30px'
     * import { EnumToken, transform } from "@tbela99/css-parser";
     *
     * const result = await transform(css);
     * const {node, value} = result.arena.findByValue(result.ast, (arena, value) =>
     *     arena.getType(value) == EnumToken.LengthTokenType && arena.getNumericValue(value) == 30 && arena.getUnit(value) == 'px') ?? {};
     * ```
     *
     * @param node node id
     * @param matcher called with the arena and the token id
     */
    findByValue(node: number, matcher: AstValueMatcher): {
        node: number;
        value: number;
    } | null;
    /**
     * Search a token and its descendants, or the value tokens of a node and their descendants, and return the first
     * match
     *
     * @param node node or token id
     * @param matcher called with the arena and the token id
     * @returns the token id or null
     */
    findValue(node: number, matcher: AstValueMatcher): number | null;
    /**
     * direct value tokens of a node or a token: the token list, then the tokens of the structured fields
     * and the child tokens (fractions, unary expressions)
     * @param id
     */
    subTokens(id: number): number[];
    /**
     *
     * @param id
     * @param predicate
     */
    findChild(id: number, predicate: (id: number) => boolean): number | null;
    /**
     * find a token in the token list
     * @param id
     * @param predicate called with the arena and the token id
     */
    findToken(id: number, predicate: (arena: this, id: number) => boolean): number | null;
    /**
     * the children of the parent of a node, the node included
     * @param id
     * @param filter called with the arena and the node id
     */
    siblings(id: number, filter?: (arena: this, id: number) => boolean): number[];
    /**
     * child node ids
     * @param id
     * @param filter called with the arena and the node id
     */
    children(id: number, filter?: (arena: this, id: number) => boolean): number[];
    /**
     * token ids of the token list: the declaration values, the selector / prelude tokens, the function arguments
     * @param id
     * @param filter called with the arena and the token id
     */
    tokens(id: number, filter?: (arena: this, id: number) => boolean): number[];
    /**
     * number of tokens in the token list
     * @param id
     */
    tokenCount(id: number): number;
    /**
     *
     * @param id
     * @param children
     */
    setChildren(id: number, ...children: number[]): void;
    /**
     * replace the children. same as {@link setChildren} with an array
     * @param id
     * @param children
     */
    setChildList(id: number, children: number[]): void;
    /**
     *
     * @param id
     * @param children
     */
    setTokens(id: number, ...children: number[]): void;
    /**
     * replace the token list. same as {@link setTokens} with an array
     * @param id
     * @param tokens
     */
    setTokenList(id: number, tokens: number[]): void;
    /**
     * move the children of a node into another node, in order
     * @param from
     * @param to
     * @param before the children are inserted before this child of `to`. they are appended when 0
     */
    moveChildren(from: number, to: number, before?: number): void;
    /**
     *
     * @param id
     * @param children
     */
    appendChildren(id: number, ...children: number[]): void;
    /**
     * append children. same as {@link appendChildren} with an array
     * @param id
     * @param children
     */
    appendChildList(id: number, children: number[]): void;
    /**
     *
     * @param id
     * @param children
     */
    appendTokens(id: number, ...children: number[]): void;
    /**
     * append tokens. same as {@link appendTokens} with an array
     * @param id
     * @param children
     */
    appendTokenList(id: number, children: number[]): void;
    /**
     * append a single child node. faster than appendChildren()
     * @param id
     * @param child
     */
    appendChild(id: number, child: number): void;
    /**
     * append a single token. faster than appendTokens()
     * @param id
     * @param token
     */
    appendToken(id: number, token: number): void;
    /**
     * prepend tokens to the token list
     * @param id
     * @param tokens
     */
    prependTokens(id: number, ...tokens: number[]): void;
    /**
     *
     * @param node
     * @param key
     * @param string
     */
    equalsIgnoreCase(node: number, key: "nam" | "val", string: string): boolean;
    /**
     *
     * @param node
     * @param key
     * @param string
     */
    startsWith(node: number, key: "nam" | "val", string: string): boolean;
    /**
     *
     * @param newSize
     */
    resize(newSize: number): void;
    /**
     * drop the interned strings that are no longer referenced by any node
     */
    compactStrings(): void;
    /**
     * drop the nodes that are not reachable from the root and renumber the remaining nodes in document order.
     * the node ids change: ids obtained before the call (from visitors for instance) are no longer valid.
     * the unused strings are dropped too
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array;
    /**
     * mark nodes to be released or trimmed later, see {@link release} and {@link trim}.
     * the library never releases nor trims the arena by itself
     * @param ids
     */
    mark(...ids: number[]): void;
    /**
     * true if the node is marked, see {@link mark}
     * @param id
     */
    isMarked(id: number): boolean;
    /**
     * release nodes: detach them and drop their data (interned strings, errors). node ids are never reused:
     * the memory is reclaimed by {@link trim}
     * @param id the node to release. every marked node (and its descendants) is released when omitted
     * @param deep release the children and the tokens too
     */
    release(id?: number, deep?: boolean): void;
    /**
     * reclaim the memory: release the marked nodes, then drop the nodes that are not reachable from the root and
     * renumber the remaining ones, see {@link compact}. the ids obtained before the call are no longer valid
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    trim(errors?: ErrorDescription[] | null): Uint32Array;
    /**
     *
     * @param id
     * @param errors
     */
    setErrors(id: number, errors: ErrorDescription[] | null): void;
    /**
     *
     * @param id
     */
    getErrors(id: number): ErrorDescription[] | null;
    /**
     * number of children
     * @param id
     */
    childCount(id: number): number;
    /**
     * structured-cloneable properties of the arena
     */
    protected exportProperties(): ArenaProperties;
    /**
     * column buffers, in the order of {@link arenaColumns}. the `spans` buffer is shared with the `spans32` view
     */
    protected exportTransferables(): ArenaTransferables;
    /**
     * initialize the arena from exported properties and column buffers
     * @param properties
     * @param transferables
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void;
}
/**
 * Css ast arena: ast nodes and value tokens.
 *
 * The node data is read and written with the methods of the arena ({@link getType}, {@link getName},
 * {@link getFirstChild}, {@link tokens}, ...). See {@link Arena} and the Arena Memory guide for the memory usage.
 */
export declare class AstArena extends Arena {
    /**
     * raw selector (minification cache), by rule id
     */
    raw: Map<number, RawSelectorTokens | null | undefined>;
    /**
     * optimized selector (minification cache), by rule id
     */
    optimized: Map<number, OptimizedSelector | null | undefined>;
    /**
     * source ids. `spans` store the index in this table (8 bits)
     */
    sources: number[];
    /**
     * length of the css parsed into a stylesheet, imported files included. sparse: only the stylesheets created by
     * the parser have an entry. the render buffer is allocated from this length
     */
    inputLengths: Array<number | undefined>;
    /**
     *
     * @param size
     */
    constructor(size?: number);
    /**
     * @inheritDoc
     */
    release(id?: number, deep?: boolean): void;
    /**
     * @inheritDoc
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array;
    /**
     * validation state bits
     * @param id
     */
    getState(id: number): EnumAstNodeStatus;
    /**
     * set the validation state bits
     * @param id
     * @param state
     */
    setState(id: number, state: EnumAstNodeStatus | null | undefined): void;
    /**
     * true if the node is invalid
     * @param id
     */
    isInvalid(id: number): boolean;
    /**
     * index of a source id in the sources table
     * @param srcId
     */
    sourceIndex(srcId: number): number;
    /**
     * set the source location
     * @param id
     * @param srcId source id
     * @param sta start offset
     * @param end end offset
     */
    setLocation(id: number, srcId: number | null | undefined, sta: number | null | undefined, end: number | null | undefined): void;
    /**
     * set the location of a token from the tokenizer values. the source index is the index of the source id in the sources table
     * @param id
     * @param sourceIndex
     * @param sta
     * @param end
     */
    setTokenLocation(id: number, sourceIndex: number, sta: number, end: number): void;
    /**
     * copy the source location of another node
     * @param id
     * @param source node id
     */
    copyLocation(id: number, source: number): void;
    /**
     * set the location from the start of a node to the end of another one
     * @param id
     * @param start
     * @param end
     */
    spanLocation(id: number, start: number, end: number): void;
    /**
     * true if the node has a source location
     * @param id
     */
    hasLocation(id: number): boolean;
    /**
     * source location
     * @param id
     */
    getLocation(id: number): SourceLocation | null;
    /**
     * source id of the node location
     * @param id
     */
    getSource(id: number): number;
    /**
     * allocate a stylesheet node
     */
    createStyleSheet(): number;
    /**
     * allocate a rule node
     * @param typ
     * @param sel
     * @param tokens prelude tokens
     * @param state
     * @param errors
     */
    createRule(typ: EnumToken, sel: string | number, tokens: number[] | null | undefined, state: EnumAstNodeStatus | null | undefined, errors: ErrorDescription[] | null | undefined): number;
    /**
     * allocate an at-rule node
     * @param typ
     * @param nam
     * @param val
     * @param block true if the at-rule has a block
     * @param tokens prelude tokens
     * @param state
     * @param errors
     */
    createAtRule(typ: EnumToken, nam: string | number, val: string | number, block: boolean, tokens: number[] | null | undefined, state: EnumAstNodeStatus | null | undefined, errors: ErrorDescription[] | null | undefined): number;
    /**
     * allocate a declaration node
     * @param typ
     * @param nam
     * @param val value tokens
     * @param state
     * @param errors
     */
    createDeclaration(typ: EnumToken, nam: string | number, val: number[] | null | undefined, state: EnumAstNodeStatus | null | undefined, errors: ErrorDescription[] | null | undefined): number;
    /**
     * allocate a comment node
     * @param typ
     * @param val
     */
    createComment(typ: EnumToken, val: string | number): number;
    /**
     * allocate a token. string values are interned, numeric values are stored in the `numericValue` column
     * @param typ
     * @param val
     * @param unit
     */
    createToken(typ: EnumToken, val?: string | number | null, unit?: string | null): number;
    /**
     * allocate a color token
     * @param val color name, hex value or color function name
     * @param kin
     * @param tokens color function arguments
     */
    createColor(val: string, kin: ColorType, tokens?: number[] | null): number;
    /**
     * allocate a function token
     * @param typ function token type
     * @param name function name
     * @param tokens arguments
     */
    createFunction(typ: EnumToken, name: string, tokens?: number[] | null): number;
    /**
     * allocate a list token (parens, attribute, wrapped values, ...)
     * @param typ
     * @param tokens
     */
    createList(typ: EnumToken, tokens?: number[] | null): number;
    /**
     * allocate a binary expression token. the operator is stored in the `numericValue` column
     * @param op
     * @param l
     * @param r
     */
    createBinaryExpression(op: EnumToken, l: number, r: number): number;
    /**
     * allocate a fraction token
     * @param l numerator
     * @param r denominator
     */
    createFraction(l: number, r: number): number;
    /**
     * true if the numeric token value is a fraction
     * @param id
     */
    hasFraction(id: number): boolean;
    /**
     * fraction token of a numeric token
     * @param id
     */
    getFraction(id: number): number;
    /**
     * set the fraction value of a numeric token. the numeric value is set to the fraction value
     * @param id
     * @param fraction fraction token id or null
     */
    setFraction(id: number, fraction: number | null): void;
    /**
     * numerator of a fraction token
     * @param id
     */
    numerator(id: number): number;
    /**
     * denominator of a fraction token
     * @param id
     */
    denominator(id: number): number;
    /**
     * string value of a token (`val`)
     * @param id
     */
    str(id: number): string;
    /**
     * set the string value of a token (`val`)
     * @param id
     * @param value
     */
    setStr(id: number, value: string): void;
    /**
     * set the unit of a token
     * @param id
     * @param unit
     */
    setUnitString(id: number, unit: string | null): void;
    /**
     * true if the token is a numeric token (number, dimension, percentage, ...)
     * @param id
     */
    isNumeric(id: number): boolean;
    /**
     * replace a token by other tokens in its parent token list
     * @param id
     * @param tokens
     */
    replaceToken(id: number, ...tokens: number[]): void;
    /**
     * get a token that can be attached to a new parent: the token itself when it is detached, a deep clone otherwise.
     * a token can only belong to one token list
     * @param token
     */
    take(token: number): number;
    /**
     * copy the data columns of a token (type, values, unit, color type, location)
     * @param target
     * @param source
     */
    copyToken(target: number, source: number): void;
    /**
     * reset a token to a new type. the values, the token list and the fields are dropped
     * @param id
     * @param typ
     * @param val
     * @param unit
     */
    resetToken(id: number, typ: EnumToken, val?: string | number | null, unit?: string | null): void;
    /**
     * Import an object: an {@link AstArenaNode} or a plain object ({@link PlainAstNode}, {@link PlainToken}).
     *
     * - importing a view of this arena is a noop: its node id is returned, the node is not copied,
     * - a view of another arena is copied with its descendants (see {@link import}),
     * - a plain object is allocated in the arena. `chi`, `val`, `l`, `r`, ... are created recursively, they can be
     *   node ids, views or plain objects.
     *
     * @param node
     * @returns the node id
     */
    fromObject(node: AstArenaNode | PlainAstNode | PlainToken): number;
    /**
     * Object view of a node or a token: an {@link AstArenaNode}. The view does not copy the node: its properties read
     * and write the arena. Importing the view in this arena ({@link fromObject}, visitor results, setters of the
     * views) is a noop
     *
     * ```ts
     * function visitor(arena: AstArena, id: number) {
     *
     *     const node = arena.toObject(id);
     *
     *     console.log(node.typ, node.nam, node.val);
     * }
     * ```
     *
     * @param id node or token id
     */
    toObject(id: number): AstArenaNode;
    /**
     * export a node or a token as a plain object (deep copy). `JSON.stringify()` of an {@link AstArenaNode} returns
     * the plain object
     * @param id
     */
    toPlainObject(id: number): PlainAstNode | PlainToken;
    /**
     * export a token as a plain object (deep copy)
     * @param id
     */
    tokenToObject(id: number): PlainToken;
    /**
     * copy the data of a node (type, strings, values, flags, location, errors): its tokens, its children and the
     * minifier caches (`raw`, `optimized`) are not copied
     * @param id
     */
    cloneNode(id: number): number;
    /**
     * copy a node or a token. the tokens of a node are copied, its children are copied with `deep`. the values of a
     * declaration are copied with `deep`
     * @param id
     * @param deep copy the children and the values of the declarations
     * @param cloneMap records the copies: id of the copy by original id
     */
    clone(id: number, deep?: boolean, cloneMap?: Map<number, number> | null): number;
    /**
     * copy a node or a token of another arena into this arena
     * @param source
     * @param id
     * @param deep copy the children. defaults to true
     */
    import(source: AstArena, id: number, deep?: boolean): number;
    /**
     * index of a child in its parent's children (or tokens) list
     * @param id
     */
    indexOf(id: number): number;
    /**
     * insert nodes before a child
     * @param reference
     * @param nodes
     */
    insertBefore(reference: number, ...nodes: number[]): void;
    /**
     * insert nodes after a child
     * @param reference
     * @param nodes
     */
    insertAfter(reference: number, ...nodes: number[]): void;
    /**
     * prepend children
     * @param id
     * @param nodes
     */
    prependChildren(id: number, ...nodes: number[]): void;
    /**
     * replace a child with other nodes. the node itself may be part of the replacement
     * @param id
     * @param nodes
     */
    replaceChild(id: number, ...nodes: number[]): void;
    /**
     * true if the node has a block (at-rules) or a children list
     * @param id
     */
    hasChildren(id: number): boolean;
    /**
     * rule selector
     * @param id
     */
    getSelector(id: number): string;
    /**
     * set the rule selector
     * @param id
     * @param sel
     */
    setSelector(id: number, sel: string): void;
    /**
     * set the at-rule / declaration name
     * @param id
     * @param nam
     */
    setNameString(id: number, nam: string): void;
    /**
     * set the at-rule prelude / comment string value
     * @param id
     * @param val
     */
    setValueString(id: number, val: string): void;
    /**
     * Expand the css nesting rules of a stylesheet, a rule or an at-rule. The tree is expanded in place: the nested rules
     * are moved into the parent of their rule and their selectors are resolved
     *
     * ```ts
     * const result = await parse(`.foo { color: red; .bar & { color: blue } }`);
     *
     * result.arena.expand(result.ast);
     * console.log(render(result.arena, result.ast).code);
     * ```
     *
     * @param ast node id
     * @returns the node id
     */
    expand(ast: AstStyleSheet | AstAtRule | AstRule): AstNode;
    /**
     * replace the nesting selector '&' of a selector
     * @internal
     * @param input
     * @param replace
     */
    replaceCompound(input: string, replace: string): string;
    /**
     * @inheritDoc
     */
    protected exportProperties(): ArenaProperties;
    /**
     * @inheritDoc
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void;
    /**
     * create an ast node from a plain object
     * @param node
     */
    protected nodeFromObject(node: PlainAstNode): number;
    /**
     * create a token from a plain object
     * @param token
     */
    protected tokenFromObject(token: PlainToken): number;
    /**
     * expand a rule: the nested rules and at-rules are moved out of the rule, into `parent` before `before`.
     * the rule is detached when it has no children left
     * @param node
     * @param parent
     * @param before the expanded nodes are inserted before this child of parent. they are appended when 0
     */
    protected expandRule(node: AstRule, parent: AstNode, before: AstNode): void;
    /**
     *
     * @param selector
     * @param replace
     * @protected
     */
    protected replaceCompoundLiteral(selector: string, replace: string): string;
}
