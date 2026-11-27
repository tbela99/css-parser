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
import type {
    AstAtRule,
    AstNode,
    AstNodeMatcher,
    AstRule,
    AstStyleSheet,
    AstValueMatcher,
    ErrorDescription,
    OptimizedSelector,
    PlainAstNode,
    PlainToken,
    RawSelectorTokens,
    SourceLocation,
    Token,
    WalkerFilter,
    WalkerOptions,
    WalkerValueFilter,
    WalkerValueOptions,
} from "../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "./types.ts";
import { NodeWalker, ValueWalker } from "./walk.ts";
import { ARENA, ARENAID, AstArenaNode, isNodeObjectType } from "./arena-node.ts";
import { splitRule } from "./minify.ts";
import { combinators } from "../syntax/constants.ts";
import { parseString } from "../parser/parse.ts";
import { renderValue } from "../printer/render.ts";
import type { CodeUnits } from "../parser/utils/codes.ts";
import {
    StringBuilder,
    type StringDerived,
    type StringFlag,
    StringTable,
    type StringTableData,
} from "./strings.ts";

/**
 * position of the structured token fields in the children list
 */
export enum TokenField {
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
    Val = 4,
}

/**
 * numeric token types: the value is stored in the `numericValue` column
 */
export const numericTokenTypes: Set<EnumToken> = new Set([
    EnumToken.NumberTokenType,
    EnumToken.DimensionTokenType,
    EnumToken.LengthTokenType,
    EnumToken.AngleTokenType,
    EnumToken.TimeTokenType,
    EnumToken.FrequencyTokenType,
    EnumToken.ResolutionTokenType,
    EnumToken.PercentageTokenType,
    EnumToken.FlexTokenType,
    EnumToken.UserDefinedDimensionTokenType,
]);

/**
 * token types whose fields are stored as list children (see {@link TokenField})
 */
export const structuredTokenTypes: Set<EnumToken> = new Set([
    EnumToken.BinaryExpressionTokenType,
    EnumToken.MatchExpressionTokenType,
    EnumToken.MediaQueryConditionTokenType,
    EnumToken.MediaQueryUnaryFeatureTokenType,
    EnumToken.SupportsQueryConditionTokenType,
    EnumToken.SupportsQueryUnaryConditionTokenType,
    EnumToken.WhenElseQueryConditionTokenType,
    EnumToken.WhenElseUnaryConditionTokenType,
    EnumToken.IfConditionTokenType,
    EnumToken.IfElseConditionTokenType,
    EnumToken.ContainerStyleRangeTokenType,
    EnumToken.MediaRangeQueryTokenType,
    EnumToken.ComposesSelectorNodeType,
    EnumToken.NameSpaceAttributeTokenType,
]);

/**
 * plain object key, field and single value flag of a structured token field. see {@link structuredFields}
 */
export declare type StructuredField = readonly [key: string, field: TokenField, single: boolean];

// structuredFields() results, by token type
const structuredFieldsCache: Array<ReadonlyArray<StructuredField> | undefined> = [];
const noFields: ReadonlyArray<StructuredField> = [];

/**
 * fields of a structured token type: the plain object key (`l`, `r`, `op`, `op1`, `op2`, `val`), the field index and
 * whether the field holds a single token. empty for the other token types
 * @param typ
 * @internal
 */
export function structuredFields(typ: EnumToken): ReadonlyArray<StructuredField> {
    let fields: ReadonlyArray<StructuredField> | undefined = structuredFieldsCache[typ];

    if (fields != null) {
        return fields;
    }

    if (!structuredTokenTypes.has(typ)) {
        fields = noFields;
    } else {
        const single: boolean =
            typ === EnumToken.BinaryExpressionTokenType ||
            typ === EnumToken.IfElseConditionTokenType ||
            typ === EnumToken.MatchExpressionTokenType ||
            typ === EnumToken.NameSpaceAttributeTokenType;
        const singleLeft: boolean =
            single ||
            typ === EnumToken.MediaQueryConditionTokenType ||
            typ === EnumToken.MediaQueryUnaryFeatureTokenType ||
            typ === EnumToken.SupportsQueryUnaryConditionTokenType ||
            typ === EnumToken.WhenElseUnaryConditionTokenType;
        const singleRight: boolean = single || typ === EnumToken.ComposesSelectorNodeType;

        fields = [
            ["l", TokenField.L, singleLeft],
            ["r", TokenField.R, singleRight],
            [
                typ === EnumToken.MediaRangeQueryTokenType ? "op1" : "op",
                TokenField.Op,
                typ !== EnumToken.ContainerStyleRangeTokenType,
            ],
            ["op2", TokenField.Op2, true],
            ["val", TokenField.Val, false],
        ];
    }

    structuredFieldsCache[typ] = fields;
    return fields;
}

/**
 * little endian platform
 */
const littleEndian: boolean = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

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
export const arenaColumns = [
    "dataTypes",
    "parents",
    "nextSibling",
    "previousSibling",
    "firstToken",
    "lastToken",
    "firstChild",
    "lastChild",
    "name",
    "stringValue",
    "numericValue",
    "unit",
    "flags",
    "colorType",
    "spans",
] as const;

/**
 * typed array constructor of each column
 */
const arenaColumnTypes = {
    dataTypes: Uint8Array,
    parents: Uint32Array,
    nextSibling: Uint32Array,
    previousSibling: Uint32Array,
    firstToken: Uint32Array,
    lastToken: Uint32Array,
    firstChild: Uint32Array,
    lastChild: Uint32Array,
    name: Uint32Array,
    stringValue: Uint32Array,
    numericValue: Float64Array,
    unit: Uint32Array,
    flags: Uint32Array,
    colorType: Uint8Array,
    spans: BigUint64Array,
} as const;

// the nesting rules of these nodes are not expanded
const skipStates: number =
    EnumAstNodeStatus.Invalid |
    EnumAstNodeStatus.Disallowed |
    EnumAstNodeStatus.Unknown |
    EnumAstNodeStatus.Unparsed |
    EnumAstNodeStatus.Malformed;

// stack of visitValues(), shared by the nested calls: each call uses the entries above its base. the entries are
// written by index and the array never shrinks
const visitStack: number[] = [];
let visitTop: number = 0;

/**
 * Arena memory manager.
 *
 * The node data is stored column-wise in typed arrays allocated for the capacity of the arena ({@link getCapacity},
 * 62 bytes per node). The arena grows by doubling its capacity and never frees memory by itself: detached nodes keep
 * their memory and their ids stay valid. {@link release}, {@link compact}, {@link trim} and {@link compactStrings}
 * reclaim the memory, `compact()` and `trim()` renumber the nodes. See the Arena Memory guide (files/arena.md).
 */
export class Arena {
    /**
     * interned strings: ranges of the sources, of the canonical text, of the pool, or strings. see {@link StringTable}
     */
    protected stringTable: StringTable = new StringTable();
    /**
     * root node
     */
    public readonly root: number = 1;
    /**
     * last allocated node id. the next node is allocated with the id current + 1 (unless a recycled id is available).
     * 0 is never allocated: it means "no node"
     */
    public current: number = 1;
    /**
     * node EnumToken type array
     */
    public dataTypes: Uint8Array;
    /**
     * parent node id array
     */
    public parents: Uint32Array;
    /**
     * next sibling node id array
     */
    public nextSibling: Uint32Array;
    /**
     * previous sibling node id array
     */
    public previousSibling: Uint32Array;
    /**
     * first token node id array
     */
    public firstToken: Uint32Array;
    /**
     * last token node id array
     */
    public lastToken: Uint32Array;
    /**
     * first child node id array
     */
    public firstChild: Uint32Array;
    /**
     * last child node id array
     */
    public lastChild: Uint32Array;
    /**
     * node name string interner id array. used to store (node as AstRule | AstDeclaration | AstKeyframesAtRule).nam and (node as AstRule | AstKeyframesRule).sel
     */
    public name: Uint32Array;
    /**
     * node string value index array.
     */
    public stringValue: Uint32Array;
    /**
     * node numeric value array. previously used as (node as NumberToken | DimensionToken).val
     */
    public numericValue: Float64Array;
    /**
     * node unit string interner id array. previously used as (node as DimensionToken).unit
     */
    public unit: Uint32Array;
    /**
     * node flags
     */
    public flags: Uint32Array;
    /**
     * color type. previously use as (node as ColorToken).kin
     */
    public colorType: Uint8Array;
    /**
     * token spans. 8 bits for source type. 28 bits for start position, 28 bits for end position. This allows us to store the start and end positions of tokens in a single 64-bit integer, which is more efficient than storing them separately.
     */
    public spans: BigUint64Array;
    /**
     * error cache
     */
    public errors: Map<number, ErrorDescription[]> = new Map();
    /**
     * head of the list of recycled node ids. the list is linked through the `nextSibling` column, see {@link recycle}
     */
    protected freeList: number = 0;
    /**
     * number of nodes the columns can hold: the length of the columns. the length of a typed array is a getter,
     * allocate() reads the capacity of the arena for each node
     */
    protected capacity: number = 0;
    /**
     * 32 bits view of the spans: the low word holds the end position and the 4 low bits of the start position,
     * the high word holds the 24 high bits of the start position and the source
     */
    protected spans32: Uint32Array;

    /**
     * create an empty arena
     * @param size initial number of nodes the columns can hold. the columns grow when they are full
     */
    constructor(size: number = 4096) {
        this.dataTypes = new Uint8Array(size);
        this.capacity = size;
        this.parents = new Uint32Array(size);
        this.nextSibling = new Uint32Array(size);
        this.previousSibling = new Uint32Array(size);
        this.lastToken = new Uint32Array(size);
        this.firstToken = new Uint32Array(size);
        this.firstChild = new Uint32Array(size);
        this.lastChild = new Uint32Array(size);
        this.name = new Uint32Array(size);
        this.stringValue = new Uint32Array(size);
        this.numericValue = new Float64Array(size);
        this.unit = new Uint32Array(size);
        this.flags = new Uint32Array(size);

        this.colorType = new Uint8Array(size);
        this.spans = new BigUint64Array(size);
        this.spans32 = new Uint32Array(this.spans.buffer);

        this.dataTypes[this.root] = EnumToken.StyleSheetNodeType;
    }

    /**
     * true when the column buffers have been transferred to another thread: the arena can no longer be used
     */
    get transferred(): boolean {
        return this.dataTypes.length === 0 && this.current > 0;
    }

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
    static toTransferableArenaObject(arena: Arena): [ArenaProperties, ArenaTransferables] {
        return [arena.exportProperties(), arena.exportTransferables()];
    }

    /**
     * Create an arena from the objects produced by {@link Arena.toTransferableArenaObject}. The column buffers are
     * used as is (zero copy): the typed arrays are views on the given buffers.
     *
     * @param properties arena properties
     * @param transferables column buffers
     * @returns an `Arena` or an `AstArena` depending on the class the method is called on
     */
    static fromTransferableArenaObjects<T extends Arena>(
        this: new (size?: number) => T,
        properties: ArenaProperties,
        transferables: ArenaTransferables,
    ): T {
        const arena: T = new this(0);

        arena.importProperties(properties, transferables);
        return arena;
    }

    /**
     * Allocate a node or a token: a released id is reused, the columns grow when the arena is full. Returns the new id
     */
    public allocate(): number {
        let id: number = this.freeList;

        if (id !== 0) {
            // reuse a recycled node: its record is already zeroed, except the free list link
            this.freeList = this.nextSibling[id];
            this.nextSibling[id] = 0;
            return id;
        }

        id = ++this.current;

        if (id >= this.capacity) {
            this.resize(this.capacity * 2);
        }

        return id;
    }

    /**
     * recycle a detached leaf node (no parent, no children, no tokens) that is no longer referenced:
     * its id is reused by the next allocation. the record is zeroed, so a stale reference reads an empty node
     * @param id
     */
    recycle(id: number): void {
        this.dataTypes[id] = 0;
        this.name[id] = 0;
        this.stringValue[id] = 0;
        this.numericValue[id] = 0;
        this.unit[id] = 0;
        this.flags[id] = 0;
        this.colorType[id] = 0;
        // the 32 bits view: no bigint
        this.spans32[id << 1] = 0;
        this.spans32[(id << 1) + 1] = 0;

        if (this.errors.size > 0) {
            this.errors.delete(id);
        }

        this.nextSibling[id] = this.freeList;
        this.freeList = id;
    }

    /**
     * Interns a string and returns its unique ID. If the string has already been interned, it returns the existing ID.
     * The strings are looked up by the hash of their code units, see {@link internRange}
     * @param str
     * @returns
     */
    public internString(str: string): number {
        return this.stringTable.intern(str);
    }

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
    public internRange(codes: CodeUnits, start: number, end: number, source: number): number {
        return this.stringTable.internRange(codes, start, end, source);
    }

    /**
     * set the text of a source: the strings interned from the source are ranges of the text, see {@link internRange}
     * @param source source index
     * @param text content of the source
     * @param codes code units of the text while the source is tokenized (faster comparisons)
     */
    public setSourceText(source: number, text: string, codes: CodeUnits | null = null): void {
        this.stringTable.setText(source, text, codes);
    }

    /**
     * code unit of the text of a source, NaN after its end. no string is created
     * @param source source index (see {@link getSourceId})
     * @param offset
     */
    public sourceCodeAt(source: number, offset: number): number {
        return this.stringTable.sourceCodeAt(source, offset);
    }

    /**
     * drop the code units of a source set by {@link setSourceText}: the source is no longer tokenized
     * @param source source index
     */
    public releaseSourceCodes(source: number): void {
        this.stringTable.releaseCodes(source);
    }

    /**
     * id of an interned string, -1 when the string is not interned
     * @param str
     */
    public stringId(str: string): number {
        return this.stringTable.lookup(str);
    }

    /**
     * length of an interned string. the string is not created
     * @param id
     */
    public stringLength(id: number): number {
        return this.stringTable.length(id);
    }

    /**
     * code unit of an interned string. the string is not created
     * @param id
     * @param index
     */
    public stringCodeAt(id: number, index: number): number {
        return this.stringTable.codeAt(id, index);
    }

    /**
     * index of the first occurrence of a code unit in an interned string, -1 when it is not found. the string is not
     * created
     * @param id
     * @param code
     */
    public stringIndexOf(id: number, code: number): number {
        return this.stringTable.indexOfCode(id, code);
    }

    /**
     * true if an interned string equals a string. the interned string is not created
     * @param id
     * @param str
     */
    public stringEquals(id: number, str: string): boolean {
        return this.stringTable.equals(id, str);
    }

    /**
     * true if an interned string equals a string, ignoring the case of the ascii letters. the interned string is not
     * created
     * @param id
     * @param str
     */
    public stringEqualsIgnoreCase(id: number, str: string): boolean {
        return this.stringTable.equalsIgnoreCase(id, str);
    }

    /**
     * true if an interned string starts with a string. the interned string is not created
     * @param id
     * @param str
     */
    public stringStartsWith(id: number, str: string): boolean {
        return this.stringTable.startsWith(id, str);
    }

    /**
     * id of the lowercase version of an interned string (like `toLowerCase()`). no string is created when the string
     * is ascii. the result is cached
     * @param id
     */
    public lowerStringId(id: number): number {
        return this.stringTable.lower(id);
    }

    /**
     * copy an interned string to a byte buffer when it is ascii (UTF-8 encoding). the string is not created
     * @param id
     * @param target
     * @param offset offset in the target. the target has room for the string ({@link stringLength})
     * @returns the number of bytes, -1 when the string is not ascii
     */
    public copyStringAscii(id: number, target: Uint8Array, offset: number): number {
        return this.stringTable.copyAscii(id, target, offset);
    }

    /**
     * a boolean property of an interned string, computed once per string id: the string is read once
     * @param id
     * @param flag
     * @param compute computes the property from the string
     * @ignore
     */
    public stringFlag(id: number, flag: StringFlag, compute: (str: string) => boolean): boolean {
        return this.stringTable.flag(id, flag, compute);
    }

    /**
     * a boolean property of an interned string, computed once per string id from the id (see {@link stringCodeAt})
     * @param id
     * @param flag
     * @param compute computes the property from the string id
     * @ignore
     */
    public stringFlagId(id: number, flag: StringFlag, compute: (id: number) => boolean): boolean {
        return this.stringTable.flagId(id, flag, compute);
    }

    /**
     * a value derived from an interned string, computed once per string id
     * @param id
     * @param slot
     * @param compute computes the value from the string id
     * @ignore
     */
    public stringDerived<T>(id: number, slot: StringDerived, compute: (id: number) => T): T {
        return this.stringTable.derived(id, slot, compute);
    }

    /**
     * copy the code units of an interned string to a buffer. the string is not created
     * @param id
     * @param target the target has room for the string ({@link stringLength})
     * @param offset
     * @returns the number of code units
     */
    public copyString(id: number, target: Uint16Array, offset: number): number {
        return this.stringTable.copy(id, target, offset);
    }

    /**
     * append an interned string to a builder. the string is not created
     * @param builder
     * @param id
     */
    public appendString(builder: StringBuilder, id: number): StringBuilder {
        return builder.appendId(this.stringTable, id);
    }

    /**
     * intern the string built by a builder: no string is created
     * @param builder
     */
    public internBuilder(builder: StringBuilder): number {
        return builder.intern(this.stringTable);
    }

    /**
     * identity of the string ids: a new object when the strings are renumbered ({@link compact},
     * {@link compactStrings}). the caches keyed by string ids use it as a key
     */
    get stringEpoch(): object {
        return this.stringTable.epoch;
    }

    /**
     * Type of a node or a token, see {@link EnumToken}
     *
     * @param id
     */
    getType(id: number): EnumToken {
        return this.dataTypes[id];
    }

    /**
     * type of node or a token. null when the id is null
     * @param id
     */
    typeOf(id: number | null | undefined): EnumToken | null {
        return id == null ? null : this.dataTypes[id];
    }

    /**
     * Set the type of a node or a token, see {@link EnumToken}
     *
     * @param id
     * @param type
     */
    setType(id: number, type: EnumToken): void {
        this.dataTypes[id] = type;
    }

    /**
     * Set the name of a node or a token: `nameId` is a string table id, see {@link AstArena.internString}
     *
     * @param id
     * @param nameId
     */
    setName(id: number, nameId: number): void {
        this.name[id] = nameId;
    }

    /**
     * Name of a node or a token: the name of an at-rule, a declaration, a function, ...
     *
     * @param id
     */
    getName(id: number): string {
        return this.resolveString(this.name[id]) ?? null;
    }

    /**
     * Set the value of a node or a token: `valueId` is a string table id, see {@link AstArena.internString}
     *
     * @param id
     * @param valueId
     */
    setValue(id: number, valueId: number): void {
        this.stringValue[id] = valueId;
    }

    /**
     * Value of a node or a token: the value of an identifier, a string, a hash, ...
     *
     * @param id
     */
    getValue(id: number): string {
        return this.resolveString(this.stringValue[id]) ?? null;
    }

    /**
     * Set the numeric value of a token
     *
     * @param id
     * @param numericValue
     */
    setNumericValue(id: number, numericValue: number): void {
        this.numericValue[id] = numericValue;
    }

    /**
     * Set the unit of a dimension token: `unit` is a string table id
     *
     * @param id
     * @param unit
     */
    setUnit(id: number, unit: number): void {
        this.unit[id] = unit;
    }

    /**
     * Unit of a dimension token
     *
     * @param id
     */
    getUnit(id: number): string {
        return this.resolveString(this.unit[id]) ?? null;
    }

    /**
     * Numeric value of a token: number, dimension, percentage, ...
     *
     * @param id
     */
    getNumericValue(id: number): number {
        return this.numericValue[id];
    }

    /**
     * Set the parent id of a node. The node is not moved: use {@link AstArena.appendChild} or {@link
     * AstArena.insertBefore} to move it
     *
     * @param id
     * @param parentId
     */
    setParent(id: number, parentId: number): void {
        this.parents[id] = parentId;
    }

    /**
     * first child of a node. 0 when the node has no children
     * @param id
     */
    getFirstChild(id: number): number {
        return this.firstChild[id];
    }

    /**
     * next sibling of a node or of a token. 0 for the last node / token of the list
     * @param id
     */
    getNextSibling(id: number): number {
        return this.nextSibling[id];
    }

    /**
     * previous sibling of a node or of a token. 0 for the first node / token of the list
     * @param id
     */
    getPreviousSibling(id: number): number {
        return this.previousSibling[id];
    }

    /**
     * first token of the token list of a node or of a token (declaration value, selector / prelude tokens, function
     * arguments). 0 when the list is empty
     * @param id
     */
    getFirstToken(id: number): number {
        return this.firstToken[id];
    }

    /**
     * last token of the token list of a node or of a token. 0 when the list is empty
     * @param id
     */
    getLastToken(id: number): number {
        return this.lastToken[id];
    }

    /**
     * number of nodes the columns can hold before the arena grows. see {@link getLastId} for the last allocated id
     */
    getCapacity(): number {
        return this.dataTypes.length;
    }

    /**
     * last allocated node id. the ids of the arena are in the range 1 ... getLastId(), the detached nodes included
     */
    getLastId(): number {
        return this.current;
    }

    /**
     * number of interned strings
     */
    getStringCount(): number {
        return this.stringTable.count;
    }

    /**
     * replace the first child
     * @param id
     * @param firstChildId
     */
    setFirstChild(id: number, firstChildId: number): void {
        const firstChild = this.firstChild[id];

        if (firstChild === firstChildId) {
            return;
        }

        this.detach(firstChildId);

        if (firstChild !== 0) {
            this.#insertBefore(id, firstChild, firstChildId);
            this.detach(firstChild);
        } else {
            // inlined: this.appendChildren(id, firstChildId)
            this.appendChildList(id, [firstChildId]);
        }
    }

    /**
     * Last child of a node. 0 when the node has no children
     *
     * @param id
     */
    getLastChild(id: number): number {
        return this.lastChild[id];
    }

    /**
     * replace the last child
     * @param id
     * @param lastChildId
     */
    setLastChild(id: number, lastChildId: number): void {
        const lastChild = this.lastChild[id];

        if (lastChild === lastChildId) {
            return;
        }

        this.detach(lastChildId);

        if (lastChild !== 0) {
            this.detach(lastChild);
        }

        // inlined: this.appendChildren(id, lastChildId)
        this.appendChildList(id, [lastChildId]);
    }

    /**
     * insert a node after another one
     * @param id
     * @param nextSiblingId
     */
    setNextSibling(id: number, nextSiblingId: number): void {
        if (id === nextSiblingId) {
            return;
        }

        this.detach(nextSiblingId);

        const parent = this.parents[id];
        const next = this.nextSibling[id];

        this.nextSibling[nextSiblingId] = next;
        this.previousSibling[nextSiblingId] = id;
        this.nextSibling[id] = nextSiblingId;
        this.parents[nextSiblingId] = parent;

        if (next !== 0) {
            this.previousSibling[next] = nextSiblingId;
        } else if (this.lastChild[parent] === id) {
            this.lastChild[parent] = nextSiblingId;
        } else if (this.lastToken[parent] === id) {
            this.lastToken[parent] = nextSiblingId;
        }
    }

    /**
     * insert a node before another one
     * @param id
     * @param previousSiblingId
     */
    setPreviousSibling(id: number, previousSiblingId: number): void {
        if (id === previousSiblingId) {
            return;
        }

        this.detach(previousSiblingId);
        this.#insertBefore(this.parents[id], id, previousSiblingId);
    }

    /**
     * replace the first token
     * @param id
     * @param firstTokenId
     */
    setFirstToken(id: number, firstTokenId: number): void {
        const firstToken = this.firstToken[id];

        if (firstToken === firstTokenId) {
            return;
        }

        this.detach(firstTokenId);

        if (firstToken !== 0) {
            this.#insertBefore(id, firstToken, firstTokenId);
            this.detach(firstToken);
        } else {
            // inlined: this.appendTokens(id, firstTokenId)
            this.appendTokenList(id, [firstTokenId]);
        }
    }

    /**
     * Set the color type of a color token, see {@link ColorType}
     *
     * @param id
     * @param colorType
     */
    setColorType(id: number, colorType: number): void {
        this.colorType[id] = colorType;
    }

    /**
     * Color type of a color token, see {@link ColorType}
     *
     * @param id
     */
    getColorType(id: number): number {
        return this.colorType[id];
    }

    /**
     * Replace the flags of a node, see {@link EnumAstNodeStatus}
     *
     * @param id
     * @param flags
     */
    setFlags(id: number, flags: number): void {
        this.flags[id] = flags;
    }

    /**
     * Flags of a node, see {@link EnumAstNodeStatus}
     *
     * @param id
     */
    getFlags(id: number): number {
        return this.flags[id];
    }

    /**
     * `true` when a node has all the given flags, see {@link EnumAstNodeStatus}
     *
     * @param id
     * @param flag
     */
    hasFlags(id: number, flag: number): boolean {
        return (this.flags[id] & flag) === flag;
    }

    /**
     * The child of a node at a position (0 based). null when the position is out of range
     *
     * @param id
     * @param index
     */
    getChildAt(id: number, index: number): number | null {
        let child = this.firstChild[id];

        while (index > 0 && child !== 0) {
            child = this.nextSibling[child];
            index--;
        }

        return child === 0 ? null : child;
    }

    /**
     * token at the given position of the token list
     * @param id
     * @param index
     */
    getTokenAt(id: number, index: number): number | null {
        let token = this.firstToken[id];

        while (index > 0 && token !== 0) {
            token = this.nextSibling[token];
            index--;
        }

        return token === 0 ? null : token;
    }

    /**
     * replace the child at the given index. the node is appended when the index is out of range
     * @param id
     * @param index
     * @param child
     */
    setChildAt(id: number, index: number, child: number): void {
        const current = this.getChildAt(id, index);

        if (current === child) {
            return;
        }

        this.detach(child);

        if (current == null) {
            // inlined: this.appendChildren(id, child)
            this.appendChildList(id, [child]);
            return;
        }

        this.#insertBefore(id, current, child);
        this.detach(current);
    }

    /**
     * list node holding the tokens of a structured token field. created when missing
     * @param id
     * @param field
     */
    fieldList(id: number, field: TokenField): number {
        let child: number = this.firstChild[id];
        let index: number = 0;

        while (index < field) {
            if (child === 0) {
                break;
            }

            child = this.nextSibling[child];
            index++;
        }

        if (child !== 0) {
            return child;
        }

        // create the missing slots
        let count: number = this.childCount(id);

        while (count <= field) {
            child = this.allocate();
            this.dataTypes[child] = EnumToken.ListTokenType;
            // inlined: this.appendChildren(id, child)
            this.appendChildList(id, [child]);
            count++;
        }

        return child;
    }

    /**
     * true if the field exists and is not empty
     * @param id
     * @param field
     */
    hasField(id: number, field: TokenField): boolean {
        const list: number | null = this.getChildAt(id, field);

        return list != null && this.firstToken[list] !== 0;
    }

    /**
     * first token of a structured token field (single token fields: `l` and `r` of binary expressions, `op`, ...)
     * @param id
     * @param field
     */
    field(id: number, field: TokenField): number {
        const list: number | null = this.getChildAt(id, field);

        return list == null ? 0 : this.firstToken[list];
    }

    /**
     * tokens of a structured token field
     * @param id
     * @param field
     */
    fieldTokens(id: number, field: TokenField): number[] {
        const list: number | null = this.getChildAt(id, field);

        return list == null ? [] : this.tokens(list);
    }

    // ---- structured token fields ---------------------------------------------------------

    /**
     * set the tokens of a structured token field
     * @param id
     * @param field
     * @param tokens
     */
    setField(id: number, field: TokenField, ...tokens: number[]): void {
        this.setTokenList(this.fieldList(id, field), tokens);
    }

    /**
     * append tokens to a structured token field
     * @param id
     * @param field
     * @param tokens
     */
    appendField(id: number, field: TokenField, ...tokens: number[]): void {
        this.appendTokenList(this.fieldList(id, field), tokens);
    }

    /**
     * Replace the tokens of the left hand side of a structured token
     *
     * @param id
     * @param children
     */
    setLeft(id: number, ...children: number[]): void {
        // inlined: this.setField(id, TokenField.L, ...children)
        this.setTokenList(this.fieldList(id, TokenField.L), children);
    }

    /**
     * Tokens of the left hand side of a structured token (numerator of a fraction, ...). null when it is not set
     *
     * @param id
     */
    getLeft(id: number): number[] | null {
        return this.getChildAt(id, TokenField.L) == null ? null : this.fieldTokens(id, TokenField.L);
    }

    /**
     * Remove the tokens of the right hand side of a structured token
     *
     * @param id the structured token
     * @param rightId null
     */
    setRight(id: number, rightId: null): void;

    /**
     * Replace the tokens of the right hand side of a structured token (denominator of a fraction, ...)
     *
     * @param id the structured token
     * @param rightId the tokens
     */
    setRight(id: number, ...rightId: number[]): void;

    /**
     * Replace the tokens of the right hand side of a structured token. null removes them
     *
     * @param id the structured token
     * @param rightId the tokens, or null
     */
    setRight(id: number, ...rightId: number[] | [null]): void {
        // inlined: this.setField(id, TokenField.R, ...(rightId == null || rightId[0] == null ? [] : (rightId as number[])))
        this.setTokenList(
            this.fieldList(id, TokenField.R),
            rightId == null || rightId[0] == null ? [] : (rightId as number[]),
        );
    }

    /**
     * Tokens of the right hand side of a structured token (denominator of a fraction, ...). null when it is not set
     *
     * @param id
     */
    getRight(id: number): number[] | null {
        return this.getChildAt(id, TokenField.R) == null ? null : this.fieldTokens(id, TokenField.R);
    }

    /**
     * Set the operator token of a structured token
     *
     * @param id
     * @param opId
     */
    setOp(id: number, opId: number): void {
        // inlined: this.setField(id, TokenField.Op, opId)
        this.setTokenList(this.fieldList(id, TokenField.Op), [opId]);
    }

    /**
     * Operator token of a structured token: the operator of a binary expression, ...
     *
     * @param id
     */
    getOp(id: number): number {
        return this.field(id, TokenField.Op);
    }

    /**
     * Set the second operator token of a structured token: the second operator of a media range query
     *
     * @param id
     * @param op2Id
     */
    setOp2(id: number, op2Id: number): void {
        // inlined: this.setField(id, TokenField.Op2, op2Id)
        this.setTokenList(this.fieldList(id, TokenField.Op2), [op2Id]);
    }

    /**
     * Second operator token of a structured token: the second operator of a media range query
     *
     * @param id
     */
    getOp2(id: number): number {
        return this.field(id, TokenField.Op2);
    }

    /**
     * Set the location of a node or a token: the id of its source file and its start and end offsets
     *
     * @param id
     * @param sourceId
     * @param start
     * @param end
     */
    public setSpan(id: number, sourceId: number, start: number, end: number): void {
        if (littleEndian) {
            const index: number = id << 1;

            this.spans32[index] = ((end & 0xfffffff) | ((start & 0xf) << 28)) >>> 0;
            this.spans32[index + 1] = (((start >>> 4) & 0xffffff) | ((sourceId & 0xff) << 24)) >>> 0;
            return;
        }

        this.spans[id] =
            (BigInt(sourceId & 0xff) << 56n) | (BigInt(start & 0xfffffff) << 28n) | BigInt(end & 0xfffffff);
    }

    /**
     * copy the packed location of a node
     * @param target
     * @param source
     */
    copySpan(target: number, source: number): void {
        const t: number = target << 1;
        const s: number = source << 1;

        this.spans32[t] = this.spans32[s];
        this.spans32[t + 1] = this.spans32[s + 1];
    }

    /**
     * Id of the source file of a node or a token, see {@link getSpanStart} and {@link getSpanEnd}
     *
     * @param id
     */
    public getSourceId(id: number): number {
        if (littleEndian) {
            return this.spans32[(id << 1) + 1] >>> 24;
        }

        return Number((this.spans[id] >> 56n) & 0xffn);
    }

    /**
     * Start offset of a node or a token in its source file
     *
     * @param id
     */
    public getSpanStart(id: number): number {
        if (littleEndian) {
            const index: number = id << 1;

            return ((this.spans32[index + 1] & 0xffffff) << 4) | (this.spans32[index] >>> 28);
        }

        return Number((this.spans[id] >> 28n) & 0xfffffffn);
    }

    // ---- spans ---------------------------------------------------------------------

    /**
     * Set the start offset of a node or a token in its source file
     *
     * @param id
     * @param start
     */
    setSpandStart(id: number, start: number): void {
        this.setSpan(id, this.getSourceId(id), start, this.getSpanEnd(id));
    }

    /**
     * End offset of a node or a token in its source file
     *
     * @param id
     */
    public getSpanEnd(id: number): number {
        if (littleEndian) {
            return this.spans32[id << 1] & 0xfffffff;
        }

        return Number(this.spans[id] & 0xfffffffn);
    }

    /**
     * Set the end offset of a node or a token in its source file
     *
     * @param id
     * @param end
     */
    public setSpanEnd(id: number, end: number): void {
        this.setSpan(id, this.getSourceId(id), this.getSpanStart(id), end);
    }

    /**
     * Parent of a node. 0 when the node has no parent
     *
     * @param id
     */
    getParent(id: number): number {
        return this.parents[id];
    }

    /**
     * The string of a string table id. The string is created the first time it is read
     *
     * @param id
     */
    public resolveString(id: number): string {
        const str: string | undefined = this.stringTable.cache[id];

        // the string is created the first time it is read
        return str !== undefined ? str : this.stringTable.get(id);
    }

    /**
     * detach a node from its parent
     * @param id
     */
    detach(id: number): void {
        if (id === 0 || this.parents[id] === 0) {
            return;
        }

        const parent = this.parents[id];
        const next = this.nextSibling[id];
        const previous = this.previousSibling[id];

        if (previous !== 0) {
            this.nextSibling[previous] = next;
        } else if (this.firstChild[parent] === id) {
            this.firstChild[parent] = next;
        } else if (this.firstToken[parent] === id) {
            this.firstToken[parent] = next;
        }

        if (next !== 0) {
            this.previousSibling[next] = previous;
        } else if (this.lastChild[parent] === id) {
            this.lastChild[parent] = previous;
        } else if (this.lastToken[parent] === id) {
            this.lastToken[parent] = previous;
        }

        this.nextSibling[id] = 0;
        this.previousSibling[id] = 0;
        this.parents[id] = 0;
    }

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
    walk(node: number, filter?: WalkerFilter | WalkerOptions | null, reverse?: boolean): IterableIterator<number> {
        return new NodeWalker(this as unknown as AstArena, node, filter, reverse);
    }

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
    walkValues(
        tokens: number | number[],
        filter?: WalkerValueFilter | WalkerValueOptions | null,
        reverse?: boolean,
    ): IterableIterator<number> {
        return new ValueWalker(this as unknown as AstArena, tokens, filter, reverse);
    }

    /**
     * call the visitor for the tokens and their children, in the order of {@link walkValues} (the children of a
     * token are read after the visitor returns). no iterator or stack is created: use it when the visitor is not a
     * closure
     * @param tokens
     * @param visitor
     * @internal
     */
    visitValues(tokens: number[], visitor: (arena: this, token: number) => void): void {
        const stack: number[] = visitStack;
        const base: number = visitTop;
        let top: number = base;

        for (let i = tokens.length - 1; i >= 0; i--) {
            stack[top++] = tokens[i];
        }

        try {
            while (top > base) {
                const value: number = stack[--top];

                // nested calls use the entries above top
                visitTop = top;
                visitor(this, value);

                // the children, in reverse order
                const first: number = top;
                let token: number = this.firstToken[value];

                while (token !== 0) {
                    stack[top++] = token;
                    token = this.nextSibling[token];
                }

                if ((this.flags[value] & EnumAstNodeStatus.HasChildren) === 0) {
                    let child: number = this.firstChild[value];

                    while (child !== 0) {
                        if (this.dataTypes[child] === EnumToken.ListTokenType) {
                            token = this.firstToken[child];

                            while (token !== 0) {
                                stack[top++] = token;
                                token = this.nextSibling[token];
                            }
                        } else {
                            stack[top++] = child;
                        }

                        child = this.nextSibling[child];
                    }
                }

                for (let i = first, j = top - 1; i < j; i++, j--) {
                    const swap: number = stack[i];

                    stack[i] = stack[j];
                    stack[j] = swap;
                }
            }
        } finally {
            visitTop = base;
        }
    }

    /**
     * parent of a value token: the node or the token that owns the token list, or the structured token that owns the
     * field (the field list token is skipped). 0 when the token is detached
     * @param id
     */
    getValueParent(id: number): number {
        const parent: number = this.parents[id];

        return parent !== 0 && this.dataTypes[parent] === EnumToken.ListTokenType ? this.parents[parent] : parent;
    }

    /**
     * node that owns a value token: the declaration, the rule or the at-rule. 0 when the token is detached
     * @param id
     */
    getValueOwner(id: number): number {
        let parent: number = this.parents[id];

        while (
            parent !== 0 &&
            (this.flags[parent] & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) === 0
        ) {
            parent = this.parents[parent];
        }

        return parent;
    }

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
    find(node: number, matcher: AstNodeMatcher): number | null {
        const walker: NodeWalker = new NodeWalker(this as unknown as AstArena, node);

        for (let r = walker.next(); !r.done; r = walker.next()) {
            if (matcher(this as unknown as AstArena, r.value)) {
                walker.return();
                return r.value;
            }
        }

        return null;
    }

    /**
     * Search the ast subtree and return all matches, in document order
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     */
    findAll(node: number, matcher: AstNodeMatcher): number[] {
        const result: number[] = [];
        const walker: NodeWalker = new NodeWalker(this as unknown as AstArena, node);

        for (let r = walker.next(); !r.done; r = walker.next()) {
            if (matcher(this as unknown as AstArena, r.value)) {
                result.push(r.value);
            }
        }

        return result;
    }

    /**
     * Search the ast subtree in reverse order and return the first match (the last node in document order)
     *
     * @param node node id
     * @param matcher called with the arena and the node id
     */
    findLast(node: number, matcher: AstNodeMatcher): number | null {
        const walker: NodeWalker = new NodeWalker(this as unknown as AstArena, node, null, true);

        for (let r = walker.next(); !r.done; r = walker.next()) {
            if (matcher(this as unknown as AstArena, r.value)) {
                walker.return();
                return r.value;
            }
        }

        return null;
    }

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
    findByValue(
        node: number,
        matcher: AstValueMatcher,
    ): {
        /**
         * the node that contains the matched token
         */
        node: number;
        /**
         * the matched token
         */
        value: number;
    } | null {
        const walker: NodeWalker = new NodeWalker(this as unknown as AstArena, node);

        for (let r = walker.next(); !r.done; r = walker.next()) {
            const current: number = r.value;

            if (this.firstToken[current] === 0) {
                continue;
            }

            const values: ValueWalker = new ValueWalker(this as unknown as AstArena, this.tokens(current));

            for (let v = values.next(); !v.done; v = values.next()) {
                if (matcher(this as unknown as AstArena, v.value)) {
                    walker.return();
                    return { node: current, value: v.value };
                }
            }
        }

        return null;
    }

    /**
     * Search a token and its descendants, or the value tokens of a node and their descendants, and return the first
     * match
     *
     * @param node node or token id
     * @param matcher called with the arena and the token id
     * @returns the token id or null
     */
    findValue(node: number, matcher: AstValueMatcher): number | null {
        if (node == null || node === 0) {
            return null;
        }

        if ((this.flags[node] & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) === 0) {
            // token: the token itself is tested first
            if (matcher(this as unknown as AstArena, node)) {
                return node;
            }
        }

        // prelude tokens, declaration values or token children
        const values: ValueWalker = new ValueWalker(this as unknown as AstArena, node);

        for (let v = values.next(); !v.done; v = values.next()) {
            if (matcher(this as unknown as AstArena, v.value)) {
                values.return();
                return v.value;
            }
        }

        return null;
    }

    /**
     * direct value tokens of a node or a token: the token list, then the tokens of the structured fields
     * and the child tokens (fractions, unary expressions)
     * @param id
     */
    subTokens(id: number): number[] {
        const result: number[] = [];
        let token: number = this.firstToken[id];

        while (token !== 0) {
            result.push(token);
            token = this.nextSibling[token];
        }

        if (this.flags[id] & EnumAstNodeStatus.HasChildren) {
            // ast node: the children are nodes
            return result;
        }

        let child: number = this.firstChild[id];

        while (child !== 0) {
            if (this.dataTypes[child] === EnumToken.ListTokenType) {
                token = this.firstToken[child];

                while (token !== 0) {
                    result.push(token);
                    token = this.nextSibling[token];
                }
            } else {
                result.push(child);
            }

            child = this.nextSibling[child];
        }

        return result;
    }

    /**
     * The first child of a node for which the predicate returns `true`. null when there is none
     *
     * @param id
     * @param predicate
     */
    findChild(id: number, predicate: (id: number) => boolean): number | null {
        let child = this.firstChild[id];
        while (child !== 0) {
            if (predicate(child)) {
                return child;
            }
            child = this.nextSibling[child];
        }

        return null;
    }

    /**
     * find a token in the token list
     * @param id
     * @param predicate called with the arena and the token id
     */
    findToken(id: number, predicate: (arena: this, id: number) => boolean): number | null {
        let token = this.firstToken[id];
        while (token !== 0) {
            if (predicate(this, token)) {
                return token;
            }
            token = this.nextSibling[token];
        }

        return null;
    }

    /**
     * the children of the parent of a node, the node included
     * @param id
     * @param filter called with the arena and the node id
     */
    siblings(id: number, filter?: (arena: this, id: number) => boolean): number[] {
        let siblings: number[] = [];
        let child = this.firstChild[this.parents[id]];
        while (child !== 0) {
            if (filter == null || filter(this, child)) {
                siblings.push(child);
            }
            child = this.nextSibling[child];
        }
        return siblings;
    }

    /**
     * child node ids
     * @param id
     * @param filter called with the arena and the node id
     */
    children(id: number, filter?: (arena: this, id: number) => boolean): number[] {
        let children: number[] = [];
        let child = this.firstChild[id];
        while (child !== 0) {
            if (filter != null && !filter(this, child)) {
                child = this.nextSibling[child];
                continue;
            }
            children.push(child);
            child = this.nextSibling[child];
        }
        return children;
    }

    /**
     * token ids of the token list: the declaration values, the selector / prelude tokens, the function arguments
     * @param id
     * @param filter called with the arena and the token id
     */
    tokens(id: number, filter?: (arena: this, id: number) => boolean): number[] {
        let tokens: number[] = [];
        let token = this.firstToken[id];
        while (token !== 0) {
            if (filter != null && !filter(this, token)) {
                token = this.nextSibling[token];
                continue;
            }
            tokens.push(token);
            token = this.nextSibling[token];
        }
        return tokens;
    }

    /**
     * number of tokens in the token list
     * @param id
     */
    tokenCount(id: number): number {
        let count: number = 0;
        let token: number = this.firstToken[id];

        while (token !== 0) {
            count++;
            token = this.nextSibling[token];
        }

        return count;
    }

    /**
     * Replace the children of a node
     *
     * @param id
     * @param children
     */
    setChildren(id: number, ...children: number[]): void {
        this.setChildList(id, children);
    }

    /**
     * replace the children. same as {@link setChildren} with an array
     * @param id
     * @param children
     */
    setChildList(id: number, children: number[]): void {
        let child = this.firstChild[id];

        while (child !== 0) {
            const next = this.nextSibling[child];

            this.nextSibling[child] = 0;
            this.previousSibling[child] = 0;
            this.parents[child] = 0;
            child = next;
        }

        this.firstChild[id] = 0;
        this.lastChild[id] = 0;

        this.appendChildList(id, children);
    }

    /**
     * Replace the tokens of a node or a token
     *
     * @param id
     * @param children
     */
    setTokens(id: number, ...children: number[]): void {
        this.setTokenList(id, children);
    }

    /**
     * replace the token list. same as {@link setTokens} with an array
     * @param id
     * @param tokens
     */
    setTokenList(id: number, tokens: number[]): void {
        let token = this.firstToken[id];

        while (token !== 0) {
            const next = this.nextSibling[token];

            this.nextSibling[token] = 0;
            this.previousSibling[token] = 0;
            this.parents[token] = 0;
            token = next;
        }

        this.firstToken[id] = 0;
        this.lastToken[id] = 0;

        this.appendTokenList(id, tokens);
    }

    /**
     * move the children of a node into another node, in order
     * @param from
     * @param to
     * @param before the children are inserted before this child of `to`. they are appended when 0
     */
    moveChildren(from: number, to: number, before: number = 0): void {
        if (from === to) {
            return;
        }

        let child: number = this.firstChild[from];

        while (child !== 0) {
            const next: number = this.nextSibling[child];

            this.detach(child);

            if (before === 0) {
                this.appendChild(to, child);
            } else {
                this.#insertBefore(to, before, child);
            }

            child = next;
        }
    }

    /**
     * Append children to a node
     *
     * @param id
     * @param children
     */
    appendChildren(id: number, ...children: number[]): void {
        this.appendChildList(id, children);
    }

    /**
     * append children. same as {@link appendChildren} with an array
     * @param id
     * @param children
     */
    appendChildList(id: number, children: number[]): void {
        if (children.length === 0) {
            return;
        }

        let lastChild: number;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            if (child === id || child === 0) {
                continue;
            }

            // the child may already be the last child: detach before reading the last child
            this.detach(child);
            lastChild = this.lastChild[id];

            if (lastChild === 0) {
                this.firstChild[id] = child;
            } else {
                this.nextSibling[lastChild] = child;
            }

            this.previousSibling[child] = lastChild;
            this.nextSibling[child] = 0;
            this.parents[child] = id;
            this.lastChild[id] = child;
        }
    }

    /**
     * Append tokens to a node or a token
     *
     * @param id
     * @param children
     */
    appendTokens(id: number, ...children: number[]): void {
        this.appendTokenList(id, children);
    }

    /**
     * append tokens. same as {@link appendTokens} with an array
     * @param id
     * @param children
     */
    appendTokenList(id: number, children: number[]): void {
        if (children.length === 0) {
            return;
        }

        let lastToken: number;

        for (let i = 0; i < children.length; i++) {
            const token = children[i];

            if (token === id || token === 0) {
                continue;
            }

            // the token may already be the last token: detach before reading the last token
            this.detach(token);
            lastToken = this.lastToken[id];

            if (lastToken === 0) {
                this.firstToken[id] = token;
            } else {
                this.nextSibling[lastToken] = token;
            }

            this.previousSibling[token] = lastToken;
            this.nextSibling[token] = 0;
            this.parents[token] = id;
            this.lastToken[id] = token;
        }
    }

    /**
     * append a single child node. faster than appendChildren()
     * @param id
     * @param child
     */
    appendChild(id: number, child: number): void {
        if (child === id || child === 0) {
            return;
        }

        if (this.parents[child] !== 0) {
            this.detach(child);
        }

        const lastChild: number = this.lastChild[id];

        if (lastChild === 0) {
            this.firstChild[id] = child;
        } else {
            this.nextSibling[lastChild] = child;
        }

        this.previousSibling[child] = lastChild;
        this.nextSibling[child] = 0;
        this.parents[child] = id;
        this.lastChild[id] = child;
    }

    /**
     * append a single token. faster than appendTokens()
     * @param id
     * @param token
     */
    appendToken(id: number, token: number): void {
        if (token === id || token === 0) {
            return;
        }

        if (this.parents[token] !== 0) {
            this.detach(token);
        }

        const lastToken: number = this.lastToken[id];

        if (lastToken === 0) {
            this.firstToken[id] = token;
        } else {
            this.nextSibling[lastToken] = token;
        }

        this.previousSibling[token] = lastToken;
        this.nextSibling[token] = 0;
        this.parents[token] = id;
        this.lastToken[id] = token;
    }

    /**
     * prepend tokens to the token list
     * @param id
     * @param tokens
     */
    prependTokens(id: number, ...tokens: number[]): void {
        const first: number = this.firstToken[id];

        if (first === 0) {
            this.appendTokenList(id, tokens);
            return;
        }

        for (const token of tokens) {
            if (token === id || token === 0) {
                continue;
            }

            this.setPreviousSibling(first, token);
        }
    }

    /**
     * Compare the name (`"nam"`) or the value (`"val"`) of a node with a string, ignoring the case. The string of the
     * node is not created
     *
     * @param node
     * @param key
     * @param string
     */
    public equalsIgnoreCase(node: number, key: "nam" | "val", string: string): boolean {
        // the string of the node is not created
        return this.stringTable.equalsIgnoreCase(key === "nam" ? this.name[node] : this.stringValue[node], string);
    }

    /**
     * `true` when the name (`"nam"`) or the value (`"val"`) of a node starts with a string. The string of the node is
     * not created
     *
     * @param node
     * @param key
     * @param string
     */
    public startsWith(node: number, key: "nam" | "val", string: string): boolean {
        // the string of the node is not created
        return this.stringTable.startsWith(key === "nam" ? this.name[node] : this.stringValue[node], string);
    }

    /**
     * Grow the columns of the arena so they hold `newSize` ids. The columns are never shrunk
     *
     * @param newSize
     */
    public resize(newSize: number) {
        if (newSize <= this.dataTypes.length) {
            return;
        }

        const newDataTypes = new Uint8Array(newSize);
        newDataTypes.set(this.dataTypes);
        this.dataTypes = newDataTypes;
        this.capacity = newSize;

        const newParents = new Uint32Array(newSize);
        newParents.set(this.parents);
        this.parents = newParents;

        const newNextSibling = new Uint32Array(newSize);
        newNextSibling.set(this.nextSibling);
        this.nextSibling = newNextSibling;

        const newPreviousSibling = new Uint32Array(newSize);
        newPreviousSibling.set(this.previousSibling);
        this.previousSibling = newPreviousSibling;

        const newFirstToken = new Uint32Array(newSize);
        newFirstToken.set(this.firstToken);
        this.firstToken = newFirstToken;

        const newLastToken = new Uint32Array(newSize);
        newLastToken.set(this.lastToken);
        this.lastToken = newLastToken;

        const newFirstChild = new Uint32Array(newSize);
        newFirstChild.set(this.firstChild);
        this.firstChild = newFirstChild;

        const newLastChild = new Uint32Array(newSize);
        newLastChild.set(this.lastChild);
        this.lastChild = newLastChild;

        const newName = new Uint32Array(newSize);
        newName.set(this.name);
        this.name = newName;

        const newStringValue = new Uint32Array(newSize);
        newStringValue.set(this.stringValue);
        this.stringValue = newStringValue;

        const newNumericValue = new Float64Array(newSize);
        newNumericValue.set(this.numericValue);
        this.numericValue = newNumericValue;

        const newUnit = new Uint32Array(newSize);
        newUnit.set(this.unit);
        this.unit = newUnit;

        const newFlags = new Uint32Array(newSize);
        newFlags.set(this.flags);
        this.flags = newFlags;

        const newColorType = new Uint8Array(newSize);
        newColorType.set(this.colorType);
        this.colorType = newColorType;

        const newSpans = new BigUint64Array(newSize);
        newSpans.set(this.spans);
        this.spans = newSpans;
        this.spans32 = new Uint32Array(this.spans.buffer);
    }

    /**
     * drop the interned strings that are no longer referenced by any node
     */
    public compactStrings(): void {
        const used: Uint8Array = new Uint8Array(this.stringTable.count);
        const size: number = this.current + 1;
        let count: number = 0;

        // the empty string is always kept
        used[0] = 1;

        for (let id = 1; id < size; id++) {
            used[this.name[id]] = 1;
            used[this.stringValue[id]] = 1;
            used[this.unit[id]] = 1;
        }

        for (let i = 0; i < used.length; i++) {
            count += used[i];
        }

        if (count === this.stringTable.count) {
            return;
        }

        // remap the string ids
        const mapping: Uint32Array = this.stringTable.compact(used);

        for (let id = 1; id < size; id++) {
            this.name[id] = mapping[this.name[id]];
            this.stringValue[id] = mapping[this.stringValue[id]];
            this.unit[id] = mapping[this.unit[id]];
        }
    }

    /**
     * drop the nodes that are not reachable from the root and renumber the remaining nodes in document order.
     * the node ids change: ids obtained before the call (from visitors for instance) are no longer valid.
     * the unused strings are dropped too
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array {
        const size: number = this.current + 1;
        const mapping: Uint32Array = new Uint32Array(size);
        const order: Uint32Array = new Uint32Array(size);
        const stack: number[] = [this.root];
        let next: number = 1;

        // document order: a node, its tokens then its children
        while (stack.length > 0) {
            const id: number = stack.pop() as number;

            order[next] = id;
            mapping[id] = next++;

            for (let child = this.lastChild[id]; child !== 0; child = this.previousSibling[child]) {
                stack.push(child);
            }

            for (let token = this.lastToken[id]; token !== 0; token = this.previousSibling[token]) {
                stack.push(token);
            }
        }

        const capacity: number = next + Math.max(64, next >> 5);
        const dataTypes: Uint8Array = new Uint8Array(capacity);
        const parents: Uint32Array = new Uint32Array(capacity);
        const nextSibling: Uint32Array = new Uint32Array(capacity);
        const previousSibling: Uint32Array = new Uint32Array(capacity);
        const firstToken: Uint32Array = new Uint32Array(capacity);
        const lastToken: Uint32Array = new Uint32Array(capacity);
        const firstChild: Uint32Array = new Uint32Array(capacity);
        const lastChild: Uint32Array = new Uint32Array(capacity);
        const name: Uint32Array = new Uint32Array(capacity);
        const stringValue: Uint32Array = new Uint32Array(capacity);
        const numericValue: Float64Array = new Float64Array(capacity);
        const unit: Uint32Array = new Uint32Array(capacity);
        const flags: Uint32Array = new Uint32Array(capacity);
        const colorType: Uint8Array = new Uint8Array(capacity);
        const spans: BigUint64Array = new BigUint64Array(capacity);
        const spans32: Uint32Array = new Uint32Array(spans.buffer);
        const nodeErrors: Map<number, ErrorDescription[]> = new Map();
        const used: Uint8Array = new Uint8Array(this.stringTable.count);

        // the empty string is always kept
        used[0] = 1;

        for (let target = 1; target < next; target++) {
            const id: number = order[target];

            dataTypes[target] = this.dataTypes[id];
            parents[target] = mapping[this.parents[id]];
            nextSibling[target] = mapping[this.nextSibling[id]];
            previousSibling[target] = mapping[this.previousSibling[id]];
            firstToken[target] = mapping[this.firstToken[id]];
            lastToken[target] = mapping[this.lastToken[id]];
            firstChild[target] = mapping[this.firstChild[id]];
            lastChild[target] = mapping[this.lastChild[id]];
            name[target] = this.name[id];
            stringValue[target] = this.stringValue[id];
            numericValue[target] = this.numericValue[id];
            unit[target] = this.unit[id];
            flags[target] = this.flags[id];
            colorType[target] = this.colorType[id];
            spans32[target << 1] = this.spans32[id << 1];
            spans32[(target << 1) + 1] = this.spans32[(id << 1) + 1];

            used[name[target]] = 1;
            used[stringValue[target]] = 1;
            used[unit[target]] = 1;
        }

        // drop the unused strings
        let count: number = 0;

        for (let i = 0; i < used.length; i++) {
            count += used[i];
        }

        if (count < this.stringTable.count) {
            const stringMapping: Uint32Array = this.stringTable.compact(used);

            for (let id = 1; id < next; id++) {
                name[id] = stringMapping[name[id]];
                stringValue[id] = stringMapping[stringValue[id]];
                unit[id] = stringMapping[unit[id]];
            }
        }

        for (const [id, list] of this.errors) {
            if (mapping[id] !== 0) {
                nodeErrors.set(mapping[id], list);
            }
        }

        if (errors != null) {
            for (const error of errors) {
                if (typeof error.node === "number") {
                    error.node = mapping[error.node] || null;
                }
            }
        }

        this.dataTypes = dataTypes;
        this.capacity = dataTypes.length;
        this.parents = parents;
        this.nextSibling = nextSibling;
        this.previousSibling = previousSibling;
        this.firstToken = firstToken;
        this.lastToken = lastToken;
        this.firstChild = firstChild;
        this.lastChild = lastChild;
        this.name = name;
        this.stringValue = stringValue;
        this.numericValue = numericValue;
        this.unit = unit;
        this.flags = flags;
        this.colorType = colorType;
        this.spans = spans;
        this.spans32 = new Uint32Array(spans.buffer);
        this.errors = nodeErrors;
        this.current = next - 1;
        this.freeList = 0;

        return mapping;
    }

    /**
     * mark nodes to be released or trimmed later, see {@link release} and {@link trim}.
     * the library never releases nor trims the arena by itself
     * @param ids
     */
    mark(...ids: number[]): void {
        for (const id of ids) {
            if (id !== 0 && id !== this.root) {
                this.flags[id] |= EnumAstNodeStatus.Marked;
            }
        }
    }

    /**
     * true if the node is marked, see {@link mark}
     * @param id
     */
    isMarked(id: number): boolean {
        return (this.flags[id] & EnumAstNodeStatus.Marked) !== 0;
    }

    /**
     * release nodes: detach them and drop their data (interned strings, errors). node ids are never reused:
     * the memory is reclaimed by {@link trim}
     * @param id the node to release. every marked node (and its descendants) is released when omitted
     * @param deep release the children and the tokens too
     */
    release(id?: number, deep: boolean = false): void {
        if (id == null) {
            for (let node: number = 1; node <= this.current; node++) {
                if (this.flags[node] & EnumAstNodeStatus.Marked) {
                    this.flags[node] &= ~EnumAstNodeStatus.Marked;
                    this.release(node, true);
                }
            }

            return;
        }

        if (id === 0 || id === this.root) {
            return;
        }

        if (deep) {
            let child: number = this.firstChild[id];

            while (child !== 0) {
                const next: number = this.nextSibling[child];

                this.release(child, true);
                child = next;
            }

            let token: number = this.firstToken[id];

            while (token !== 0) {
                const next: number = this.nextSibling[token];

                this.release(token, true);
                token = next;
            }
        }

        this.detach(id);
        this.name[id] = 0;
        this.stringValue[id] = 0;
        this.unit[id] = 0;
        this.errors.delete(id);
    }

    /**
     * reclaim the memory: release the marked nodes, then drop the nodes that are not reachable from the root and
     * renumber the remaining ones, see {@link compact}. the ids obtained before the call are no longer valid
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    trim(errors?: ErrorDescription[] | null): Uint32Array {
        this.release();
        return this.compact(errors);
    }

    /**
     * Set the validation errors of a node. null or an empty list removes them
     *
     * @param id
     * @param errors
     */
    setErrors(id: number, errors: ErrorDescription[] | null) {
        // empty error lists are not stored
        if (errors == null || errors.length === 0) {
            this.errors.delete(id);
        } else {
            this.errors.set(id, errors);
        }
    }

    /**
     * Validation errors of a node. null when the node has no errors
     *
     * @param id
     */
    getErrors(id: number): ErrorDescription[] | null {
        return this.errors.get(id) ?? null;
    }

    /**
     * number of children
     * @param id
     */
    childCount(id: number): number {
        let count: number = 0;
        let child: number = this.firstChild[id];

        while (child !== 0) {
            count++;
            child = this.nextSibling[child];
        }

        return count;
    }

    /**
     * structured-cloneable properties of the arena
     */
    protected exportProperties(): ArenaProperties {
        return {
            kind: "Arena",
            current: this.current,
            strings: this.stringTable.export(),
            errors: [...this.errors.entries()],
        };
    }

    /**
     * column buffers, in the order of {@link arenaColumns}. the `spans` buffer is shared with the `spans32` view
     */
    protected exportTransferables(): ArenaTransferables {
        const buffers: ArrayBuffer[] = [];

        for (const column of arenaColumns) {
            const array: ArrayBufferView = this[column];

            // the columns always own their buffer: no offset or partial view
            buffers.push(array.buffer as ArrayBuffer);
        }

        return buffers;
    }

    /**
     * initialize the arena from exported properties and column buffers
     * @param properties
     * @param transferables
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void {
        if (transferables.length !== arenaColumns.length) {
            throw new TypeError(`expected ${arenaColumns.length} column buffers, got ${transferables.length}`);
        }

        for (let i = 0; i < arenaColumns.length; i++) {
            const column = arenaColumns[i];

            // @ts-ignore
            this[column] = new arenaColumnTypes[column](transferables[i]);
        }

        this.spans32 = new Uint32Array(this.spans.buffer);
        this.capacity = this.dataTypes.length;
        this.current = properties.current;
        this.stringTable.import(properties.strings);
        this.errors = new Map(properties.errors);
    }

    /**
     * link a node before a reference node of the given parent
     * @param parent
     * @param reference
     * @param node
     */
    #insertBefore(parent: number, reference: number, node: number): void {
        const previous = this.previousSibling[reference];

        this.previousSibling[node] = previous;
        this.nextSibling[node] = reference;
        this.previousSibling[reference] = node;
        this.parents[node] = parent;

        if (previous !== 0) {
            this.nextSibling[previous] = node;
        } else if (this.firstChild[parent] === reference) {
            this.firstChild[parent] = node;
        } else if (this.firstToken[parent] === reference) {
            this.firstToken[parent] = node;
        }
    }
}

/**
 * Css ast arena: ast nodes and value tokens.
 *
 * The node data is read and written with the methods of the arena ({@link getType}, {@link getName},
 * {@link getFirstChild}, {@link tokens}, ...). See {@link Arena} and the Arena Memory guide for the memory usage.
 */
export class AstArena extends Arena {
    /**
     * raw selector (minification cache), by rule id
     */
    public raw: Map<number, RawSelectorTokens | null | undefined> = new Map();
    /**
     * optimized selector (minification cache), by rule id
     */
    public optimized: Map<number, OptimizedSelector | null | undefined> = new Map();
    /**
     * source ids. `spans` store the index in this table (8 bits)
     */
    public sources: number[] = [];
    /**
     * length of the css parsed into a stylesheet, imported files included. sparse: only the stylesheets created by
     * the parser have an entry. the render buffer is allocated from this length
     */
    public inputLengths: Array<number | undefined> = [];

    /**
     * create an arena that holds an empty stylesheet
     * @param size initial number of nodes the columns can hold. the columns grow when they are full
     */
    constructor(size: number = 4096) {
        super(size);

        // string id 0 is the null / empty string
        this.internString("");

        this.flags[this.root] = EnumAstNodeStatus.HasChildren;
    }

    /**
     * release nodes: detach them and drop their data (interned strings, errors) and their minification caches. node
     * ids are never reused: the memory is reclaimed by {@link trim}
     * @param id the node to release. every marked node (and its descendants) is released when omitted
     * @param deep release the children and the tokens too
     */
    release(id?: number, deep: boolean = false): void {
        super.release(id, deep);

        if (id != null) {
            // drop the minification caches
            if (this.raw.get(id) != null) {
                this.raw.delete(id);
            }

            if (this.optimized.get(id) != null) {
                this.optimized.delete(id);
            }

            if (this.inputLengths[id] != null) {
                this.inputLengths[id] = undefined;
            }
        }
    }

    /**
     * drop the nodes that are not reachable from the root and renumber the remaining nodes in document order.
     * the node ids change: ids obtained before the call (from visitors for instance) are no longer valid.
     * the unused strings and the minification caches are dropped too
     * @param errors error descriptions whose `node` is remapped
     * @returns mapping of the old ids to the new ids (0 when the node was dropped)
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array {
        const mapping: Uint32Array = super.compact(errors);

        // the minification caches are dropped
        this.raw = new Map();
        this.optimized = new Map();

        // the input lengths of the stylesheets that are kept
        const inputLengths: Array<number | undefined> = [];

        for (let id = 0; id < this.inputLengths.length; id++) {
            if (this.inputLengths[id] != null && id < mapping.length && mapping[id] !== 0) {
                inputLengths[mapping[id]] = this.inputLengths[id];
            }
        }

        this.inputLengths = inputLengths;

        return mapping;
    }

    /**
     * validation state bits
     * @param id
     */
    getState(id: number): EnumAstNodeStatus {
        return this.flags[id] & EnumAstNodeStatus.StateMask;
    }

    /**
     * set the validation state bits
     * @param id
     * @param state
     */
    setState(id: number, state: EnumAstNodeStatus | null | undefined): void {
        this.flags[id] = (this.flags[id] & ~EnumAstNodeStatus.StateMask) | ((state ?? 0) & EnumAstNodeStatus.StateMask);
    }

    // ---- state ---------------------------------------------------------------------

    /**
     * true if the node is invalid
     * @param id
     */
    isInvalid(id: number): boolean {
        return (this.flags[id] & EnumAstNodeStatus.Invalid) !== 0;
    }

    /**
     * index of a source id in the sources table
     * @param srcId
     */
    sourceIndex(srcId: number): number {
        let index: number = this.sources.indexOf(srcId);

        if (index === -1) {
            index = this.sources.length;
            this.sources.push(srcId);
        }

        return index;
    }

    /**
     * set the source location
     * @param id
     * @param srcId source id
     * @param sta start offset
     * @param end end offset
     */
    setLocation(
        id: number,
        srcId: number | null | undefined,
        sta: number | null | undefined,
        end: number | null | undefined,
    ): void {
        if (srcId == null && sta == null) {
            this.flags[id] &= ~EnumAstNodeStatus.HasLocation;
            this.spans32[id << 1] = 0;
            this.spans32[(id << 1) + 1] = 0;
            return;
        }

        this.flags[id] |= EnumAstNodeStatus.HasLocation;
        this.setSpan(id, this.sourceIndex(srcId ?? 0), sta ?? 0, end ?? 0);
    }

    // ---- location ------------------------------------------------------------------

    /**
     * set the location of a token from the tokenizer values. the source index is the index of the source id in the sources table
     * @param id
     * @param sourceIndex
     * @param sta
     * @param end
     */
    setTokenLocation(id: number, sourceIndex: number, sta: number, end: number): void {
        this.flags[id] |= EnumAstNodeStatus.HasLocation;
        this.setSpan(id, sourceIndex, sta, end);
    }

    /**
     * copy the source location of another node
     * @param id
     * @param source node id
     */
    copyLocation(id: number, source: number): void {
        this.copySpan(id, source);
        this.flags[id] =
            (this.flags[id] & ~EnumAstNodeStatus.HasLocation) | (this.flags[source] & EnumAstNodeStatus.HasLocation);
    }

    /**
     * set the location from the start of a node to the end of another one
     * @param id
     * @param start
     * @param end
     */
    spanLocation(id: number, start: number, end: number): void {
        if ((this.flags[start] & EnumAstNodeStatus.HasLocation) === 0) {
            this.copyLocation(id, end);
            return;
        }

        this.flags[id] |= EnumAstNodeStatus.HasLocation;
        this.setSpan(
            id,
            this.getSourceId(start),
            this.getSpanStart(start),
            this.flags[end] & EnumAstNodeStatus.HasLocation ? this.getSpanEnd(end) : this.getSpanEnd(start),
        );
    }

    /**
     * true if the node has a source location
     * @param id
     */
    hasLocation(id: number): boolean {
        return (this.flags[id] & EnumAstNodeStatus.HasLocation) !== 0;
    }

    /**
     * source location
     * @param id
     */
    getLocation(id: number): SourceLocation | null {
        if ((this.flags[id] & EnumAstNodeStatus.HasLocation) === 0) {
            return null;
        }

        return {
            sta: this.getSpanStart(id),
            end: this.getSpanEnd(id),
            srcId: this.sources[this.getSourceId(id)] ?? 0,
        };
    }

    /**
     * source id of the node location
     * @param id
     */
    getSource(id: number): number {
        return this.sources[this.getSourceId(id)] ?? 0;
    }

    /**
     * allocate a stylesheet node
     */
    createStyleSheet(): number {
        const id: number = this.allocate();

        this.dataTypes[id] = EnumToken.StyleSheetNodeType;
        this.flags[id] = EnumAstNodeStatus.HasChildren;

        return id;
    }

    /**
     * allocate a rule node
     * @param typ
     * @param sel
     * @param tokens prelude tokens
     * @param state
     * @param errors
     */
    createRule(
        typ: EnumToken,
        sel: string | number,
        tokens: number[] | null | undefined,
        state: EnumAstNodeStatus | null | undefined,
        errors: ErrorDescription[] | null | undefined,
    ): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        // a string or an interned string id
        this.name[id] = typeof sel === "number" ? sel : this.internString(sel);
        this.flags[id] = EnumAstNodeStatus.HasChildren | ((state ?? 0) & EnumAstNodeStatus.StateMask);

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        if (errors != null && errors.length > 0) {
            this.errors.set(id, errors);
        }

        return id;
    }

    // ---- ast nodes -------------------------------------------------------------------

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
    createAtRule(
        typ: EnumToken,
        nam: string | number,
        val: string | number,
        block: boolean,
        tokens: number[] | null | undefined,
        state: EnumAstNodeStatus | null | undefined,
        errors: ErrorDescription[] | null | undefined,
    ): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        // strings or interned string ids
        this.name[id] = typeof nam === "number" ? nam : this.internString(nam);
        this.stringValue[id] = typeof val === "number" ? val : this.internString(val);
        this.flags[id] = (block ? EnumAstNodeStatus.HasChildren : 0) | ((state ?? 0) & EnumAstNodeStatus.StateMask);

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        if (errors != null && errors.length > 0) {
            this.errors.set(id, errors);
        }

        return id;
    }

    /**
     * allocate a declaration node
     * @param typ
     * @param nam
     * @param val value tokens
     * @param state
     * @param errors
     */
    createDeclaration(
        typ: EnumToken,
        nam: string | number,
        val: number[] | null | undefined,
        state: EnumAstNodeStatus | null | undefined,
        errors: ErrorDescription[] | null | undefined,
    ): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        // a string or an interned string id
        this.name[id] = typeof nam === "number" ? nam : this.internString(nam);
        this.flags[id] = EnumAstNodeStatus.HasValues | ((state ?? 0) & EnumAstNodeStatus.StateMask);

        if (val != null) {
            this.appendTokenList(id, val);
        }

        if (errors != null && errors.length > 0) {
            this.errors.set(id, errors);
        }

        return id;
    }

    /**
     * allocate a comment node
     * @param typ
     * @param val
     */
    createComment(typ: EnumToken, val: string | number): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        // a string or an interned string id
        this.stringValue[id] = typeof val === "number" ? val : this.internString(val);
        this.flags[id] = 0;

        return id;
    }

    /**
     * allocate a token. string values are interned, numeric values are stored in the `numericValue` column
     * @param typ
     * @param val
     * @param unit
     */
    createToken(typ: EnumToken, val?: string | number | null, unit?: string | null): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;

        if (typeof val === "string") {
            this.stringValue[id] = this.internString(val);
        } else if (typeof val === "number") {
            this.numericValue[id] = val;
        }

        if (unit != null) {
            this.unit[id] = this.internString(unit);
        }

        return id;
    }

    /**
     * allocate a color token
     * @param val color name, hex value or color function name
     * @param kin
     * @param tokens color function arguments
     */
    createColor(val: string, kin: ColorType, tokens?: number[] | null): number {
        const id: number = this.allocate();

        this.dataTypes[id] = EnumToken.ColorTokenType;
        this.stringValue[id] = this.internString(val);
        // inlined: this.setColorType(id, kin)
        this.colorType[id] = kin;

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        return id;
    }

    // ---- tokens ----------------------------------------------------------------------

    /**
     * allocate a function token
     * @param typ function token type
     * @param name function name
     * @param tokens arguments
     */
    createFunction(typ: EnumToken, name: string, tokens?: number[] | null): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        this.stringValue[id] = this.internString(name);

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        return id;
    }

    /**
     * allocate a list token (parens, attribute, wrapped values, ...)
     * @param typ
     * @param tokens
     */
    createList(typ: EnumToken, tokens?: number[] | null): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        return id;
    }

    /**
     * allocate a binary expression token. the operator is stored in the `numericValue` column
     * @param op
     * @param l
     * @param r
     */
    createBinaryExpression(op: EnumToken, l: number, r: number): number {
        const id: number = this.allocate();

        this.dataTypes[id] = EnumToken.BinaryExpressionTokenType;
        this.numericValue[id] = op;
        // inlined: this.setField(id, TokenField.L, l)
        this.setTokenList(this.fieldList(id, TokenField.L), [l]);
        // inlined: this.setField(id, TokenField.R, r)
        this.setTokenList(this.fieldList(id, TokenField.R), [r]);

        return id;
    }

    /**
     * allocate a fraction token
     * @param l numerator
     * @param r denominator
     */
    createFraction(l: number, r: number): number {
        const id: number = this.allocate();

        this.dataTypes[id] = EnumToken.FractionTokenType;
        // inlined: this.appendChildren(id, l, r)
        this.appendChildList(id, [l, r]);

        return id;
    }

    /**
     * true if the numeric token value is a fraction
     * @param id
     */
    hasFraction(id: number): boolean {
        const child: number = this.firstChild[id];

        return child !== 0 && this.dataTypes[child] === EnumToken.FractionTokenType;
    }

    /**
     * fraction token of a numeric token
     * @param id
     */
    getFraction(id: number): number {
        const child: number = this.firstChild[id];

        return child !== 0 && this.dataTypes[child] === EnumToken.FractionTokenType ? child : 0;
    }

    /**
     * set the fraction value of a numeric token. the numeric value is set to the fraction value
     * @param id
     * @param fraction fraction token id or null
     */
    setFraction(id: number, fraction: number | null): void {
        const child: number = this.getFraction(id);

        if (child !== 0) {
            this.detach(child);
        }

        if (fraction != null && fraction !== 0) {
            // inlined: this.appendChildren(id, fraction)
            this.appendChildList(id, [fraction]);
            this.numericValue[id] =
                this.numericValue[this.firstChild[fraction]] / this.numericValue[this.lastChild[fraction]];
        }
    }

    /**
     * numerator of a fraction token
     * @param id
     */
    numerator(id: number): number {
        return this.firstChild[id];
    }

    /**
     * denominator of a fraction token
     * @param id
     */
    denominator(id: number): number {
        return this.lastChild[id];
    }

    /**
     * string value of a token (`val`)
     * @param id
     */
    str(id: number): string {
        return this.resolveString(this.stringValue[id]);
    }

    /**
     * set the string value of a token (`val`)
     * @param id
     * @param value
     */
    setStr(id: number, value: string): void {
        this.stringValue[id] = this.internString(value);
    }

    /**
     * set the unit of a token
     * @param id
     * @param unit
     */
    setUnitString(id: number, unit: string | null): void {
        this.unit[id] = unit == null ? 0 : this.internString(unit);
    }

    /**
     * true if the token is a numeric token (number, dimension, percentage, ...)
     * @param id
     */
    isNumeric(id: number): boolean {
        return numericTokenTypes.has(this.dataTypes[id]);
    }

    /**
     * replace a token by other tokens in its parent token list
     * @param id
     * @param tokens
     */
    replaceToken(id: number, ...tokens: number[]): void {
        if (this.parents[id] === 0) {
            return;
        }

        const index: number = tokens.indexOf(id);

        if (index === -1) {
            this.insertBefore(id, ...tokens);
            this.detach(id);
            return;
        }

        this.insertBefore(id, ...tokens.slice(0, index));
        this.insertAfter(id, ...tokens.slice(index + 1));
    }

    /**
     * get a token that can be attached to a new parent: the token itself when it is detached, a deep clone otherwise.
     * a token can only belong to one token list
     * @param token
     */
    take(token: number): number {
        return this.parents[token] === 0 ? token : this.clone(token, true);
    }

    /**
     * copy the data columns of a token (type, values, unit, color type, location)
     * @param target
     * @param source
     */
    copyToken(target: number, source: number): void {
        this.dataTypes[target] = this.dataTypes[source];
        this.name[target] = this.name[source];
        this.stringValue[target] = this.stringValue[source];
        this.numericValue[target] = this.numericValue[source];
        this.unit[target] = this.unit[source];
        this.colorType[target] = this.colorType[source];
        this.copySpan(target, source);
        this.flags[target] = this.flags[source] & ~(EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues);
    }

    /**
     * reset a token to a new type. the values, the token list and the fields are dropped
     * @param id
     * @param typ
     * @param val
     * @param unit
     */
    resetToken(id: number, typ: EnumToken, val?: string | number | null, unit?: string | null): void {
        this.dataTypes[id] = typ;
        this.stringValue[id] = 0;
        this.numericValue[id] = 0;
        this.unit[id] = 0;
        this.colorType[id] = 0;
        this.name[id] = 0;

        if (typeof val === "string") {
            this.stringValue[id] = this.internString(val);
        } else if (typeof val === "number") {
            this.numericValue[id] = val;
        }

        if (unit != null) {
            this.unit[id] = this.internString(unit);
        }

        // inlined: this.setTokens(id)
        this.setTokenList(id, []);
        // inlined: this.setChildren(id)
        this.setChildList(id, []);
    }

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
    fromObject(node: AstArenaNode | PlainAstNode | PlainToken): number {
        const id: number | undefined = (node as AstArenaNode)[ARENAID];

        if (id !== undefined) {
            // no copy for the nodes of this arena
            return this.import((node as AstArenaNode)[ARENA], id);
        }

        return isNodeObjectType(node.typ)
            ? this.nodeFromObject(node as PlainAstNode)
            : this.tokenFromObject(node as PlainToken);
    }

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
    toObject(id: number): AstArenaNode {
        return new AstArenaNode(this, id);
    }

    // ---- plain objects -----------------------------------------------------------------

    /**
     * export a node or a token as a plain object (deep copy). `JSON.stringify()` of an {@link AstArenaNode} returns
     * the plain object
     * @param id
     */
    toPlainObject(id: number): PlainAstNode | PlainToken {
        const typ: EnumToken = this.dataTypes[id];
        const flags: number = this.flags[id];

        if (!isNodeObjectType(typ)) {
            return this.tokenToObject(id);
        }

        const node: PlainAstNode = { typ };

        switch (typ) {
            case EnumToken.StyleSheetNodeType:
                break;

            case EnumToken.RuleNodeType:
            case EnumToken.KeyframesRuleNodeType:
                node.sel = this.resolveString(this.name[id]);
                break;

            case EnumToken.AtRuleNodeType:
            case EnumToken.KeyframesAtRuleNodeType:
                node.nam = this.resolveString(this.name[id]);
                node.val = this.resolveString(this.stringValue[id]);
                break;

            case EnumToken.CommentNodeType:
            case EnumToken.CDOCOMMNodeType:
                node.val = this.resolveString(this.stringValue[id]);
                break;

            default:
                node.nam = this.resolveString(this.name[id]);
                node.val = [];

                for (const token of this.tokens(id)) {
                    node.val.push(this.tokenToObject(token));
                }
                break;
        }

        if (flags & EnumAstNodeStatus.HasChildren) {
            node.chi = [];

            for (const child of this.children(id)) {
                node.chi.push(this.toPlainObject(child) as PlainAstNode);
            }
        }

        if (flags & EnumAstNodeStatus.HasLocation) {
            node.loc = this.getLocation(id);
        }

        if (flags & EnumAstNodeStatus.StateMask) {
            node.state = flags & EnumAstNodeStatus.StateMask;
        }

        if ((flags & EnumAstNodeStatus.HasValues) === 0 && this.firstToken[id] !== 0) {
            node.tokens = [];

            for (const token of this.tokens(id)) {
                node.tokens.push(this.tokenToObject(token));
            }
        }

        if (this.errors.has(id)) {
            node.errors = this.errors.get(id);
        }

        if (this.raw.get(id) != null) {
            node.raw = this.raw.get(id);
        }

        if (this.optimized.get(id) != null) {
            node.optimized = this.optimized.get(id);
        }

        return node;
    }

    /**
     * export a token as a plain object (deep copy)
     * @param id
     */
    tokenToObject(id: number): PlainToken {
        const typ: EnumToken = this.dataTypes[id];
        const token: Record<string, any> = { typ };

        if (this.name[id] !== 0) {
            token.nam = this.resolveString(this.name[id]);
        }

        if (typ === EnumToken.BinaryExpressionTokenType) {
            token.op = this.numericValue[id];
        } else if (typ === EnumToken.UnaryExpressionTokenType) {
            token.sign = this.numericValue[id];
            token.val = this.firstChild[id] === 0 ? null : this.tokenToObject(this.firstChild[id]);
        } else if (typ === EnumToken.FractionTokenType) {
            token.l = this.tokenToObject(this.firstChild[id]);
            token.r = this.tokenToObject(this.lastChild[id]);
        } else if (numericTokenTypes.has(typ)) {
            const fraction: number = this.getFraction(id);

            token.val = fraction === 0 ? this.numericValue[id] : this.tokenToObject(fraction);
        } else if (this.stringValue[id] !== 0 || typ === EnumToken.IdenTokenType || typ === EnumToken.StringTokenType) {
            token.val = this.resolveString(this.stringValue[id]);
        }

        if (this.unit[id] !== 0) {
            if (typ === EnumToken.ColorTokenType) {
                token.cal = this.resolveString(this.unit[id]);
            } else if (typ === EnumToken.MatchExpressionTokenType) {
                token.attr = this.resolveString(this.unit[id]);
            } else {
                token.unit = this.resolveString(this.unit[id]);
            }
        }

        if (typ === EnumToken.ColorTokenType && this.colorType[id] !== ColorType.NONE) {
            token.kin = this.colorType[id];
        }

        if (this.firstToken[id] !== 0) {
            const tokens: PlainToken[] = [];

            for (const child of this.tokens(id)) {
                tokens.push(this.tokenToObject(child));
            }

            if (
                typ === EnumToken.DeclarationNodeType ||
                typ === EnumToken.CssVariableTokenType ||
                typ === EnumToken.CssVariableImportTokenType
            ) {
                token.val = tokens;
            } else {
                token.chi = tokens;
            }
        }

        if (structuredTokenTypes.has(typ)) {
            for (const [key, field, isSingle] of structuredFields(typ)) {
                const list: number | null = this.getChildAt(id, field);

                if (list == null) {
                    continue;
                }

                const values: PlainToken[] = [];

                for (const child of this.tokens(list)) {
                    values.push(this.tokenToObject(child));
                }

                token[key] = isSingle ? (values[0] ?? null) : values;
            }
        }

        if (this.flags[id] & EnumAstNodeStatus.HasLocation) {
            token.loc = this.getLocation(id);
        }

        return token as PlainToken;
    }

    /**
     * copy the data of a node (type, strings, values, flags, location, errors): its tokens, its children and the
     * minifier caches (`raw`, `optimized`) are not copied
     * @param id
     */
    cloneNode(id: number): number {
        const target: number = this.allocate();

        this.dataTypes[target] = this.dataTypes[id];
        this.name[target] = this.name[id];
        this.stringValue[target] = this.stringValue[id];
        this.numericValue[target] = this.numericValue[id];
        this.unit[target] = this.unit[id];
        this.colorType[target] = this.colorType[id];
        this.flags[target] = this.flags[id];
        this.copySpan(target, id);

        if (this.errors.size > 0 && this.errors.has(id)) {
            this.errors.set(target, this.errors.get(id)!);
        }

        return target;
    }

    /**
     * copy a node or a token. the tokens of a node are copied, its children are copied with `deep`. the values of a
     * declaration are copied with `deep`
     * @param id
     * @param deep copy the children and the values of the declarations
     * @param cloneMap records the copies: id of the copy by original id
     */
    clone(id: number, deep: boolean = false, cloneMap: Map<number, number> | null = null): number {
        const target: number = this.allocate();
        const flags: number = this.flags[id];

        cloneMap?.set(id, target);

        this.dataTypes[target] = this.dataTypes[id];
        this.name[target] = this.name[id];
        this.stringValue[target] = this.stringValue[id];
        this.numericValue[target] = this.numericValue[id];
        this.unit[target] = this.unit[id];
        this.colorType[target] = this.colorType[id];
        this.flags[target] = flags;
        this.copySpan(target, id);

        if (this.raw.get(id) != null) {
            this.raw.set(target, this.raw.get(id));
        }

        if (this.optimized.get(id) != null) {
            this.optimized.set(target, this.optimized.get(id));
        }

        if (this.errors.size > 0 && this.errors.has(id)) {
            this.errors.set(target, this.errors.get(id)!);
        }

        const isNode: boolean = (flags & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) !== 0;

        // declaration values are cloned only when requested
        if (!isNode || deep || (flags & EnumAstNodeStatus.HasValues) === 0) {
            let token: number = this.firstToken[id];

            while (token !== 0) {
                this.appendToken(target, this.clone(token, true, cloneMap));
                token = this.nextSibling[token];
            }
        }

        if (!isNode || deep) {
            let child: number = this.firstChild[id];

            while (child !== 0) {
                this.appendChild(target, this.clone(child, true, cloneMap));
                child = this.nextSibling[child];
            }
        }

        return target;
    }

    /**
     * copy a node or a token of another arena into this arena
     * @param source
     * @param id
     * @param deep copy the children. defaults to true
     */
    import(source: AstArena, id: number, deep: boolean = true): number {
        if (source === this) {
            return id;
        }

        const target: number = this.allocate();
        const flags: number = source.flags[id];

        this.dataTypes[target] = source.dataTypes[id];
        this.name[target] = this.internString(source.resolveString(source.name[id]) ?? "");
        this.stringValue[target] = this.internString(source.resolveString(source.stringValue[id]) ?? "");
        this.numericValue[target] = source.numericValue[id];
        this.unit[target] = this.internString(source.resolveString(source.unit[id]) ?? "");
        this.colorType[target] = source.colorType[id];
        this.flags[target] = flags & ~EnumAstNodeStatus.HasLocation;

        if (source.raw.get(id) != null) {
            this.raw.set(target, source.raw.get(id));
        }

        if (source.optimized.get(id) != null) {
            this.optimized.set(target, source.optimized.get(id));
        }

        if (flags & EnumAstNodeStatus.HasLocation) {
            // inlined: source.getSource(id)
            this.setLocation(
                target,
                source.sources[source.getSourceId(id)] ?? 0,
                source.getSpanStart(id),
                source.getSpanEnd(id),
            );
        }

        if (source.errors.has(id)) {
            this.errors.set(target, source.errors.get(id)!);
        }

        let token: number = source.firstToken[id];

        while (token !== 0) {
            this.appendToken(target, this.import(source, token));
            token = source.nextSibling[token];
        }

        if (deep || (flags & EnumAstNodeStatus.HasChildren) === 0) {
            let child: number = source.firstChild[id];

            while (child !== 0) {
                this.appendChild(target, this.import(source, child));
                child = source.nextSibling[child];
            }
        }

        return target;
    }

    /**
     * index of a child in its parent's children (or tokens) list
     * @param id
     */
    indexOf(id: number): number {
        let index: number = 0;
        let child: number = this.previousSibling[id];

        if (this.parents[id] === 0) {
            return -1;
        }

        while (child !== 0) {
            index++;
            child = this.previousSibling[child];
        }

        return index;
    }

    /**
     * insert nodes before a child
     * @param reference
     * @param nodes
     */
    insertBefore(reference: number, ...nodes: number[]): void {
        for (const node of nodes) {
            if (node === reference || node === 0) {
                continue;
            }

            this.setPreviousSibling(reference, node);
        }
    }

    // ---- clone / import ----------------------------------------------------------------

    /**
     * insert nodes after a child
     * @param reference
     * @param nodes
     */
    insertAfter(reference: number, ...nodes: number[]): void {
        for (const node of nodes) {
            if (node === reference || node === 0) {
                continue;
            }

            this.setNextSibling(reference, node);
            reference = node;
        }
    }

    /**
     * prepend children
     * @param id
     * @param nodes
     */
    prependChildren(id: number, ...nodes: number[]): void {
        const first: number = this.firstChild[id];

        if (first === 0) {
            this.appendChildList(id, nodes);
        } else {
            this.insertBefore(first, ...nodes);
        }
    }

    // ---- tree helpers --------------------------------------------------------------

    /**
     * replace a child with other nodes. the node itself may be part of the replacement
     * @param id
     * @param nodes
     */
    replaceChild(id: number, ...nodes: number[]): void {
        if (this.parents[id] === 0) {
            return;
        }

        const index: number = nodes.indexOf(id);

        if (index === -1) {
            this.insertBefore(id, ...nodes);
            this.detach(id);
            return;
        }

        this.insertBefore(id, ...nodes.slice(0, index));
        this.insertAfter(id, ...nodes.slice(index + 1));
    }

    /**
     * true if the node has a block (at-rules) or a children list
     * @param id
     */
    hasChildren(id: number): boolean {
        return (this.flags[id] & EnumAstNodeStatus.HasChildren) !== 0;
    }

    /**
     * rule selector
     * @param id
     */
    getSelector(id: number): string {
        return this.resolveString(this.name[id]);
    }

    /**
     * set the rule selector
     * @param id
     * @param sel
     */
    setSelector(id: number, sel: string): void {
        this.name[id] = this.internString(sel);
    }

    /**
     * set the at-rule / declaration name
     * @param id
     * @param nam
     */
    setNameString(id: number, nam: string): void {
        this.name[id] = this.internString(nam);
    }

    /**
     * set the at-rule prelude / comment string value
     * @param id
     * @param val
     */
    setValueString(id: number, val: string): void {
        this.stringValue[id] = this.internString(val);
    }

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
    expand(ast: AstStyleSheet | AstAtRule | AstRule): AstNode {
        if (this.flags[ast] & skipStates) {
            return ast;
        }

        let node: AstNode = this.firstChild[ast];

        while (node !== 0) {
            const next: AstNode = this.nextSibling[node];
            const typ: EnumToken = this.dataTypes[node];

            if (typ === EnumToken.RuleNodeType) {
                // the expanded rules are inserted after the rule
                this.expandRule(node, ast, next);
            } else if (
                typ === EnumToken.AtRuleNodeType &&
                this.flags[node] & EnumAstNodeStatus.HasChildren &&
                // the mixin body is nested in the rule the mixin is applied to
                !this.stringEquals(this.name[node], "mixin")
            ) {
                let j: AstNode = this.lastChild[node];

                while (j !== 0) {
                    if (
                        this.dataTypes[j] === EnumToken.RuleNodeType ||
                        this.dataTypes[j] === EnumToken.AtRuleNodeType
                    ) {
                        this.expand(node);
                        break;
                    }

                    j = this.previousSibling[j];
                }
            }

            node = next;
        }

        return ast;
    }

    /**
     * replace the nesting selector '&' of a selector
     * @internal
     * @param input
     * @param replace
     */
    replaceCompound(input: string, replace: string): string {
        const tokens: Token[] = parseString(this, input);

        // inlined: this.walkValues(tokens)
        for (const t of new ValueWalker(this, tokens)) {
            if (this.dataTypes[t] === EnumToken.NestingSelectorTokenType) {
                if (tokens.length === 2) {
                    this.resetToken(
                        t,
                        EnumToken.LiteralTokenType,
                        this.replaceCompoundLiteral(this.resolveString(this.stringValue[t]), replace),
                    );

                    continue;
                }

                const rule: string[][] = splitRule(replace);

                this.resetToken(t, EnumToken.LiteralTokenType, rule.length > 1 ? ":is(" + replace + ")" : replace);
            }
        }

        return tokens.reduce((acc: string, curr: Token) => acc + renderValue(this, curr), "");
    }

    /**
     * structured-cloneable properties of the arena, the sources and the minification caches included
     */
    protected exportProperties(): ArenaProperties {
        return {
            ...super.exportProperties(),
            kind: "AstArena",
            sources: this.sources,
            raw: [...this.raw],
            optimized: [...this.optimized],
            inputLengths: this.inputLengths,
        };
    }

    /**
     * initialize the arena from exported properties and column buffers, the sources and the minification caches
     * included
     * @param properties
     * @param transferables
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void {
        super.importProperties(properties, transferables);

        this.sources = properties.sources?.slice() ?? [];
        this.raw = new Map(properties.raw ?? []);
        this.optimized = new Map(properties.optimized ?? []);
        this.inputLengths = properties.inputLengths?.slice() ?? [];
    }

    // ---- nesting rules expansion ---------------------------------------------------------------

    /**
     * create an ast node from a plain object
     * @param node
     */
    protected nodeFromObject(node: PlainAstNode): number {
        const id: number = this.allocate();
        const typ: EnumToken = node.typ;

        this.dataTypes[id] = typ;

        switch (typ) {
            case EnumToken.StyleSheetNodeType:
                this.flags[id] = EnumAstNodeStatus.HasChildren;
                break;

            case EnumToken.RuleNodeType:
            case EnumToken.KeyframesRuleNodeType:
                this.name[id] = this.internString((node.sel ?? node.nam ?? "") as string);
                this.flags[id] = EnumAstNodeStatus.HasChildren;
                if (node.raw != null) {
                    this.raw.set(id, node.raw);
                }

                if (node.optimized != null) {
                    this.optimized.set(id, node.optimized);
                }

                if (typeof node.val === "string") {
                    this.stringValue[id] = this.internString(node.val);
                }

                break;

            case EnumToken.AtRuleNodeType:
            case EnumToken.KeyframesAtRuleNodeType:
                this.name[id] = this.internString(node.nam ?? "");
                this.stringValue[id] = this.internString((node.val as string) ?? "");
                this.flags[id] = node.chi != null ? EnumAstNodeStatus.HasChildren : 0;
                break;

            case EnumToken.CommentNodeType:
            case EnumToken.CDOCOMMNodeType:
                this.stringValue[id] = this.internString((node.val as string) ?? "");
                this.flags[id] = 0;
                break;

            default:
                // declaration like nodes
                this.name[id] = this.internString(node.nam ?? "");
                this.flags[id] = EnumAstNodeStatus.HasValues;

                if (Array.isArray(node.val)) {
                    for (const token of node.val) {
                        this.appendToken(id, typeof token === "number" ? token : this.fromObject(token));
                    }
                }

                break;
        }

        if (Array.isArray(node.tokens)) {
            for (const token of node.tokens) {
                this.appendToken(id, typeof token === "number" ? token : this.fromObject(token));
            }
        }

        // inlined: this.setState(id, node.state)
        this.flags[id] =
            (this.flags[id] & ~EnumAstNodeStatus.StateMask) | ((node.state ?? 0) & EnumAstNodeStatus.StateMask);

        const loc: SourceLocation | null | undefined = node.loc;

        if (loc != null) {
            this.setLocation(id, loc.srcId, loc.sta, loc.end);
        }

        const errors: ErrorDescription[] | null | undefined = node.errors;

        if (errors != null && errors.length > 0) {
            this.errors.set(id, errors);
        }

        if (Array.isArray(node.chi) && this.flags[id] & EnumAstNodeStatus.HasChildren) {
            for (const child of node.chi) {
                // inlined: this.appendChildren(id, typeof child == "number" ? child : this.fromObject(child))
                this.appendChildList(id, [typeof child === "number" ? child : this.fromObject(child)]);
            }
        }

        return id;
    }

    /**
     * create a token from a plain object
     * @param token
     */
    protected tokenFromObject(token: PlainToken): number {
        const id: number = this.allocate();
        const typ: EnumToken = token.typ;
        const plain: Record<string, any> = token as Record<string, any>;

        this.dataTypes[id] = typ;

        if (typeof plain.nam === "string") {
            this.name[id] = this.internString(plain.nam);
        }

        if (typeof plain.unit === "string") {
            this.unit[id] = this.internString(plain.unit);
        }

        if (typeof plain.kin === "number") {
            // inlined: this.setColorType(id, plain.kin)
            this.colorType[id] = plain.kin;
        }

        if (typeof plain.cal === "string") {
            this.unit[id] = this.internString(plain.cal);
        }

        if (typeof plain.attr === "string") {
            this.unit[id] = this.internString(plain.attr);
        }

        if (typ === EnumToken.BinaryExpressionTokenType) {
            this.numericValue[id] = plain.op;
        } else if (typ === EnumToken.UnaryExpressionTokenType) {
            this.numericValue[id] = plain.sign;
            // inlined: this.appendChildren(id, typeof plain.val == "number" ? plain.val : this.fromObject(plain.val))
            this.appendChildList(id, [typeof plain.val === "number" ? plain.val : this.fromObject(plain.val)]);
        } else if (typ === EnumToken.FractionTokenType) {
            // inlined: this.appendChildren(id, typeof plain.l == "number" ? plain.l : this.fromObject(plain.l), typeof plain.r == "number" ? plain.r : this.fromObject(plain.r))
            this.appendChildList(id, [
                typeof plain.l === "number" ? plain.l : this.fromObject(plain.l),
                typeof plain.r === "number" ? plain.r : this.fromObject(plain.r),
            ]);
        } else if (typeof plain.val === "string") {
            if (numericTokenTypes.has(typ)) {
                // numeric value as a string
                this.numericValue[id] = +plain.val;
            } else {
                this.stringValue[id] = this.internString(plain.val);
            }
        } else if (typeof plain.val === "number") {
            this.numericValue[id] = plain.val;
        } else if (plain.val != null && typeof plain.val === "object" && !Array.isArray(plain.val)) {
            // fraction value
            this.setFraction(id, this.fromObject(plain.val));
        } else if (Array.isArray(plain.val) && typ !== EnumToken.MediaRangeQueryTokenType) {
            // declaration like tokens
            for (const child of plain.val) {
                this.appendToken(id, typeof child === "number" ? child : this.fromObject(child));
            }
        }

        if (Array.isArray(plain.chi)) {
            for (const child of plain.chi) {
                this.appendToken(id, typeof child === "number" ? child : this.fromObject(child));
            }
        }

        if (structuredTokenTypes.has(typ)) {
            const fields: Array<[string, TokenField]> = [
                ["l", TokenField.L],
                ["r", TokenField.R],
                ["op", TokenField.Op],
                ["op1", TokenField.Op],
                ["op2", TokenField.Op2],
                ["val", TokenField.Val],
            ];

            for (const [key, field] of fields) {
                if (plain[key] == null) {
                    continue;
                }

                const values: any[] = Array.isArray(plain[key]) ? plain[key] : [plain[key]];

                const fieldTokens: number[] = [];

                for (const value of values) {
                    fieldTokens.push(typeof value === "number" ? value : this.fromObject(value));
                }

                // inlined: this.setField(id, field, ...fieldTokens)
                this.setTokenList(this.fieldList(id, field), fieldTokens);
            }
        }

        const loc: SourceLocation | null | undefined = plain.loc;

        if (loc != null) {
            this.setLocation(id, loc.srcId, loc.sta, loc.end);
        }

        return id;
    }

    /**
     * expand a rule: the nested rules and at-rules are moved out of the rule, into `parent` before `before`.
     * the rule is detached when it has no children left
     * @param node
     * @param parent
     * @param before the expanded nodes are inserted before this child of parent. they are appended when 0
     */
    protected expandRule(node: AstRule, parent: AstNode, before: AstNode): void {
        if (this.flags[node] & skipStates) {
            return;
        }

        const ast: AstRule = node;
        const sel: string = this.resolveString(this.name[ast]);
        const place = (child: AstNode): void => {
            if (before === 0) {
                this.appendChild(parent, child);
            } else {
                this.insertBefore(before, child);
            }
        };

        if (this.dataTypes[ast] === EnumToken.RuleNodeType) {
            let child: AstNode = this.firstChild[ast];

            while (child !== 0) {
                const next: AstNode = this.nextSibling[child];
                const typ: EnumToken = this.dataTypes[child];

                if (typ === EnumToken.RuleNodeType) {
                    const rule: AstRule = child;
                    const ruleSel: string = this.resolveString(this.name[rule]);

                    if (!ruleSel.includes("&")) {
                        const selRule: string[][] = splitRule(ruleSel);

                        const arSelf: string = splitRule(sel)
                            .filter((r: string[]): boolean =>
                                r.every(
                                    (t: string): boolean => t !== ":before" && t !== ":after" && !t.startsWith("::"),
                                ),
                            )
                            .reduce(
                                (acc: string[], curr: string[]): string[] => acc.concat([curr.join("")]),
                                <string[]>[],
                            )
                            .join(",");

                        if (arSelf.length === 0) {
                            this.detach(rule);
                            child = next;
                            continue;
                        }

                        for (let i1 = 0; i1 < selRule.length; i1++) {
                            const arr = selRule[i1];
                            combinators.includes(arr[0].charAt(0)) ? arr.unshift(arSelf) : arr.unshift(arSelf, " ");
                        }

                        // inlined: this.setSelector(rule, selRule .reduce((acc: string[], curr: string[]) => { acc.push(curr.join("")); return acc; }, <string[]>[]) .join(","))
                        this.name[rule] = this.internString(
                            selRule
                                .reduce(
                                    (acc: string[], curr: string[]) => {
                                        acc.push(curr.join(""));

                                        return acc;
                                    },
                                    <string[]>[],
                                )
                                .join(","),
                        );
                    } else {
                        let childSelectorCompound: string[] = [];
                        let withCompound: string[] = [];
                        let withoutCompound: string[] = [];

                        // pseudo elements cannot be used with '&'
                        // https://www.w3.org/TR/css-nesting-1/#example-7145ff1e
                        const rules: string[][] = splitRule(sel).filter((r: string[]): boolean =>
                            r.every((t: string): boolean => t !== ":before" && t !== ":after" && !t.startsWith("::")),
                        );
                        const parentSelector: boolean = !sel.includes("&");

                        if (rules.length === 0) {
                            this.detach(rule);
                            child = next;
                            continue;
                        }

                        for (const sel of this.raw.get(rule) ?? splitRule(ruleSel)) {
                            const s: string = sel.join("");

                            if (s.includes("&") || parentSelector) {
                                if (s.indexOf("&", 1) === -1) {
                                    if (s.at(0) === "&") {
                                        if (s.at(1) === " ") {
                                            childSelectorCompound.push(s.slice(2));
                                        } else {
                                            if (s === "&" || parentSelector) {
                                                withCompound.push(s);
                                            }
                                        }
                                    } else {
                                        withoutCompound.push(s);
                                    }
                                } else {
                                    withCompound.push(s);
                                }
                            }
                        }

                        const selectors: string[] = [];
                        const selector: string =
                            rules.length > 1
                                ? ":is(" + rules.map((a) => a.join("")).join(",") + ")"
                                : rules[0].join("");

                        if (childSelectorCompound.length > 0) {
                            if (childSelectorCompound.length === 1) {
                                selectors.push(this.replaceCompound("& " + childSelectorCompound[0].trim(), selector));
                            } else {
                                selectors.push(
                                    this.replaceCompound(
                                        "& :is(" +
                                            childSelectorCompound.reduce(
                                                (acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(),
                                                "",
                                            ) +
                                            ")",
                                        selector,
                                    ),
                                );
                            }
                        }

                        if (withCompound.length > 0) {
                            if (withCompound.every((t) => t[0] === "&" && t.indexOf("&", 1) === -1)) {
                                withoutCompound.push(...withCompound.map((t) => t.slice(1)));
                                withCompound.length = 0;
                            }
                        }

                        if (withoutCompound.length > 0) {
                            if (withoutCompound.length === 1) {
                                const useIs: boolean =
                                    rules.length === 1 &&
                                    selector.match(/^[a-zA-Z.:]/) != null &&
                                    selector.includes(" ") &&
                                    withoutCompound.length === 1 &&
                                    withoutCompound[0].match(/^[a-zA-Z]+$/) != null;
                                const compound = useIs ? ":is(&)" : "&";

                                selectors.push(
                                    this.replaceCompound(
                                        rules.length === 1
                                            ? useIs
                                                ? withoutCompound[0] + ":is(&)"
                                                : selector.match(/^[.:]/) && withoutCompound[0].match(/^[a-zA-Z]+$/)
                                                  ? withoutCompound[0] + compound
                                                  : compound + withoutCompound[0]
                                            : withoutCompound[0].match(/^[a-zA-Z:]+$/)
                                              ? withoutCompound[0].trim() + compound
                                              : "&" +
                                                (withoutCompound[0].match(/^\S+$/)
                                                    ? withoutCompound[0].trim()
                                                    : ":is(" + withoutCompound[0].trim() + ")"),
                                        selector,
                                    ),
                                );
                            } else {
                                selectors.push(
                                    this.replaceCompound(
                                        "&:is(" +
                                            withoutCompound.reduce(
                                                (acc, curr) => acc + (acc.length > 0 ? "," : "") + curr.trim(),
                                                "",
                                            ) +
                                            ")",
                                        selector,
                                    ),
                                );
                            }
                        }

                        if (withCompound.length > 0) {
                            if (withCompound.length === 1) {
                                selectors.push(this.replaceCompound(withCompound[0], selector));
                            }
                        }

                        // inlined: this.setSelector(rule, selectors.reduce((acc, curr) => (curr.length == 0 ? acc : acc + (acc.length > 0 ? "," : "") + curr), ""))
                        this.name[rule] = this.internString(
                            selectors.reduce(
                                (acc, curr) => (curr.length === 0 ? acc : acc + (acc.length > 0 ? "," : "") + curr),
                                "",
                            ),
                        );
                    }

                    place(rule);
                    this.expandRule(rule, parent, before);
                } else if (
                    typ === EnumToken.AtRuleNodeType &&
                    (!(this.flags[child] & EnumAstNodeStatus.HasChildren) ||
                        this.stringEquals(this.name[child], "apply"))
                ) {
                    // an at-rule without a block or an `@apply` rule stays in the rule: `@apply --mixin;`
                } else if (typ === EnumToken.AtRuleNodeType) {
                    const astAtRule: AstAtRule = child;
                    const atRuleName: string = this.resolveString(this.name[astAtRule]);

                    if (atRuleName === "scope") {
                        const atRuleValue: string = this.resolveString(this.stringValue[astAtRule]);

                        if (atRuleValue.includes("&")) {
                            // inlined: this.setValueString(astAtRule, this.replaceCompound(atRuleValue, sel))
                            this.stringValue[astAtRule] = this.internString(this.replaceCompound(atRuleValue, sel));
                        }

                        let hasNesting: boolean = false;

                        for (let t = this.firstChild[astAtRule]; t !== 0; t = this.nextSibling[t]) {
                            if (
                                this.dataTypes[t] === EnumToken.RuleNodeType &&
                                this.resolveString(this.name[t]).includes("&")
                            ) {
                                hasNesting = true;
                                break;
                            }
                        }

                        if (hasNesting) {
                            // expand the nested rules against the parent selector
                            const clone: AstRule = this.clone(node);

                            this.moveChildren(astAtRule, clone);
                            this.expandRule(clone, astAtRule, 0);

                            // declarations stay in the at-rule, before the expanded rules
                            this.moveChildren(clone, astAtRule, this.firstChild[astAtRule]);
                        }

                        place(astAtRule);
                    } else {
                        const clone: AstRule = this.clone(ast);

                        // the rules are expanded inside the at-rule: [clone, ...expanded nodes]
                        this.moveChildren(astAtRule, clone);
                        this.expandRule(clone, astAtRule, 0);

                        if (this.firstChild[clone] !== 0) {
                            // the rule declarations are wrapped in the clone, before the expanded nodes
                            if (this.firstChild[astAtRule] === 0) {
                                this.appendChild(astAtRule, clone);
                            } else {
                                this.insertBefore(this.firstChild[astAtRule], clone);
                            }
                        }

                        place(astAtRule);

                        // the expanded at-rules are moved after the at-rule
                        let r: AstNode = this.firstChild[astAtRule];

                        while (r !== 0) {
                            const nextRule: AstNode = this.nextSibling[r];

                            if (this.dataTypes[r] === EnumToken.AtRuleNodeType) {
                                if (this.flags[r] & EnumAstNodeStatus.HasChildren) {
                                    const val: string = this.resolveString(this.stringValue[astAtRule]);
                                    const rVal: string = this.resolveString(this.stringValue[r]);

                                    if (val !== "" && rVal !== "") {
                                        const rName: string = this.resolveString(this.name[r]);

                                        if (atRuleName === "media" && rName === "media") {
                                            // inlined: this.setValueString(r, val + " and " + rVal)
                                            this.stringValue[r] = this.internString(val + " and " + rVal);
                                        } else if (atRuleName === "layer" && rName === "layer") {
                                            // inlined: this.setValueString(r, val + "." + rVal)
                                            this.stringValue[r] = this.internString(val + "." + rVal);
                                        }
                                    }

                                    place(r);
                                } else {
                                    this.detach(r);
                                }
                            }

                            r = nextRule;
                        }
                    }

                    if (this.firstChild[astAtRule] === 0) {
                        this.detach(astAtRule);
                    }
                }

                child = next;
            }
        }

        if (this.firstChild[ast] === 0) {
            this.detach(ast);
        }
    }

    /**
     * Replace the nesting selectors (`&`) of a compound selector with a selector
     *
     * @param selector
     * @param replace
     * @protected
     */
    protected replaceCompoundLiteral(selector: string, replace: string): string {
        const tokens: string[] = [""];

        let i: number = 0;

        for (; i < selector.length; i++) {
            if (selector.charAt(i) === "&") {
                tokens.push("&", "");
            }
        }

        return tokens
            .sort((a, b) => {
                if (a === "&") {
                    return 1;
                }

                return b === "&" ? -1 : 0;
            })
            .reduce((acc: string, curr: string): string => acc + (curr === "&" ? replace : curr), "");
    }
}
