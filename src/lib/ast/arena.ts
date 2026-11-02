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
    ErrorDescription,
    OptimizedSelector,
    PlainAstNode,
    PlainToken,
    RawSelectorTokens,
    SourceLocation,
    WalkerFilter,
    WalkerOption,
    WalkerOptions,
    WalkerValueFilter,
} from "../../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "./types.ts";
import { WalkerEvent, WalkerOptionEnum } from "./walk.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";

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
 * little endian platform
 */
const littleEndian: boolean = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;

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
    strings: string[];
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
    raw?: Array<RawSelectorTokens | null | undefined>;
    /**
     * optimized selectors cache ({@link AstArena})
     */
    optimized?: Array<OptimizedSelector | null | undefined>;
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

/**
 * Arena memory manager
 */
export class Arena {
    /**
     * string interner identifiers
     */
    public stringIds: Map<string, number> = new Map();
    /**
     * string interner values
     */
    public strings: string[] = [];
    /**
     * root node
     */
    public readonly root: number = 1;
    /**
     * current free node id. This is used to allocate new nodes in the arena. It starts at 1 because 0 is reserved for the root node.
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
     * 32 bits view of the spans: the low word holds the end position and the 4 low bits of the start position,
     * the high word holds the 24 high bits of the start position and the source
     */
    protected spans32: Uint32Array;

    /**
     * error cache
     */
    public errors: Map<number, ErrorDescription[]> = new Map();

    constructor(size: number = 4096) {
        this.dataTypes = new Uint8Array(size);
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
     * true when the column buffers have been transferred to another thread: the arena can no longer be used
     */
    get transferred(): boolean {
        return this.dataTypes.length == 0 && this.current > 0;
    }

    /**
     * structured-cloneable properties of the arena
     */
    protected exportProperties(): ArenaProperties {
        return {
            kind: "Arena",
            current: this.current,
            strings: this.strings,
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
        if (transferables.length != arenaColumns.length) {
            throw new TypeError(`expected ${arenaColumns.length} column buffers, got ${transferables.length}`);
        }

        for (let i = 0; i < arenaColumns.length; i++) {
            const column = arenaColumns[i];

            // @ts-ignore
            this[column] = new arenaColumnTypes[column](transferables[i]);
        }

        this.spans32 = new Uint32Array(this.spans.buffer);
        this.current = properties.current;
        this.strings = properties.strings.slice();
        this.stringIds = new Map(this.strings.map((str: string, index: number) => [str, index]));
        this.errors = new Map(properties.errors);
    }

    public allocate(): number {
        const id = ++this.current;
        if (this.current >= this.dataTypes.length) {
            this.resize(this.dataTypes.length * 2);
        }
        return id;
    }

    /**
     * Interns a string and returns its unique ID. If the string has already been interned, it returns the existing ID.
     * @param str
     * @returns
     */
    public internString(str: string): number {
        let id = this.stringIds.get(str) as number;
        if (id != null) {
            return id;
        }

        id = this.strings.length;
        this.stringIds.set(str, id);
        this.strings.push(str);
        return id;
    }

    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param type
     * @param stringValue
     */
    public set(id: number, type: EnumToken): void;

    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param type
     * @param stringValue
     */
    public set(id: number, type: EnumToken, stringValue: number): void;
    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, and the fourth is the numeric value.
     * @param id
     * @param type
     * @param stringValue
     * @param numericValue
     */
    public set(id: number, type: EnumToken, stringValue: number, numericValue: number): void;
    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param type
     * @param stringValue
     * @param numericValue
     * @param unit
     */
    public set(id: number, type: EnumToken, stringValue: number, numericValue: number, unit: number): void;

    /**
     * set node data for a given id. The first argument is the id, the second is the type, the third is the string value, the fourth is the numeric value, and the fifth is the unit.
     * @param id
     * @param args
     */
    public set(id: number, ...args: number[]): void {
        this.dataTypes[id] = args[0];

        if (args.length > 1) {
            // 0 is null string, so we can use it to indicate that there is no string value for this node.
            this.stringValue[id] = args[1];
        }

        if (args.length > 2) {
            this.numericValue[id] = args[2];
        }

        if (args.length > 3) {
            this.unit[id] = args[3];
        }
    }

    getType(id: number): EnumToken {
        return this.dataTypes[id];
    }

    /**
     * type of a node or a token. null when the id is null
     * @param id
     */
    typeOf(id: number | null | undefined): EnumToken | null {
        return id == null ? null : this.dataTypes[id];
    }

    setType(id: number, type: EnumToken): void {
        this.dataTypes[id] = type;
    }

    setName(id: number, nameId: number): void {
        this.name[id] = nameId;
    }

    getName(id: number): string {
        return this.strings[this.name[id]] ?? null;
    }

    setValue(id: number, valueId: number): void {
        this.stringValue[id] = valueId;
    }

    getValue(id: number): string {
        return this.strings[this.stringValue[id]] ?? null;
    }

    setNumericValue(id: number, numericValue: number): void {
        this.numericValue[id] = numericValue;
    }

    setUnit(id: number, unit: number): void {
        this.unit[id] = unit;
    }

    getUnit(id: number): string {
        return this.strings[this.unit[id]] ?? null;
    }

    getNumericValue(id: number): number {
        return this.numericValue[id];
    }

    setParent(id: number, parentId: number): void {
        this.parents[id] = parentId;
    }

    getFirstChild(id: number): number {
        return this.firstChild[id];
    }

    /**
     * replace the first child
     * @param id
     * @param firstChildId
     */
    setFirstChild(id: number, firstChildId: number): void {
        const firstChild = this.firstChild[id];

        if (firstChild == firstChildId) {
            return;
        }

        this.detach(firstChildId);

        if (firstChild != 0) {
            this.#insertBefore(id, firstChild, firstChildId);
            this.detach(firstChild);
        } else {
            this.appendChildren(id, firstChildId);
        }
    }

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

        if (lastChild == lastChildId) {
            return;
        }

        this.detach(lastChildId);

        if (lastChild != 0) {
            this.detach(lastChild);
        }

        this.appendChildren(id, lastChildId);
    }

    /**
     * insert a node after another one
     * @param id
     * @param nextSiblingId
     */
    setNextSibling(id: number, nextSiblingId: number): void {
        if (id == nextSiblingId) {
            return;
        }

        this.detach(nextSiblingId);

        const parent = this.parents[id];
        const next = this.nextSibling[id];

        this.nextSibling[nextSiblingId] = next;
        this.previousSibling[nextSiblingId] = id;
        this.nextSibling[id] = nextSiblingId;
        this.parents[nextSiblingId] = parent;

        if (next != 0) {
            this.previousSibling[next] = nextSiblingId;
        } else if (this.lastChild[parent] == id) {
            this.lastChild[parent] = nextSiblingId;
        } else if (this.lastToken[parent] == id) {
            this.lastToken[parent] = nextSiblingId;
        }
    }

    /**
     * insert a node before another one
     * @param id
     * @param previousSiblingId
     */
    setPreviousSibling(id: number, previousSiblingId: number): void {
        if (id == previousSiblingId) {
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

        if (firstToken == firstTokenId) {
            return;
        }

        this.detach(firstTokenId);

        if (firstToken != 0) {
            this.#insertBefore(id, firstToken, firstTokenId);
            this.detach(firstToken);
        } else {
            this.appendTokens(id, firstTokenId);
        }
    }

    setColorType(id: number, colorType: number): void {
        this.colorType[id] = colorType;
    }

    getColorType(id: number): number {
        return this.colorType[id];
    }

    setFlags(id: number, flags: number): void {
        this.flags[id] = flags;
    }

    getFlags(id: number): number {
        return this.flags[id];
    }

    hasFlags(id: number, flag: number): boolean {
        return (this.flags[id] & flag) == flag;
    }

    getChildAt(id: number, index: number): number | null {
        let child = this.firstChild[id];

        while (index > 0 && child != 0) {
            child = this.nextSibling[child];
            index--;
        }

        return child == 0 ? null : child;
    }

    /**
     * token at the given position of the token list
     * @param id
     * @param index
     */
    getTokenAt(id: number, index: number): number | null {
        let token = this.firstToken[id];

        while (index > 0 && token != 0) {
            token = this.nextSibling[token];
            index--;
        }

        return token == 0 ? null : token;
    }

    /**
     * replace the child at the given index. the node is appended when the index is out of range
     * @param id
     * @param index
     * @param child
     */
    setChildAt(id: number, index: number, child: number): void {
        const current = this.getChildAt(id, index);

        if (current == child) {
            return;
        }

        this.detach(child);

        if (current == null) {
            this.appendChildren(id, child);
            return;
        }

        this.#insertBefore(id, current, child);
        this.detach(current);
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

        if (previous != 0) {
            this.nextSibling[previous] = node;
        } else if (this.firstChild[parent] == reference) {
            this.firstChild[parent] = node;
        } else if (this.firstToken[parent] == reference) {
            this.firstToken[parent] = node;
        }
    }

    // ---- structured token fields ---------------------------------------------------------

    /**
     * list node holding the tokens of a structured token field. created when missing
     * @param id
     * @param field
     */
    fieldList(id: number, field: TokenField): number {
        let child: number = this.firstChild[id];
        let index: number = 0;

        while (index < field) {
            if (child == 0) {
                break;
            }

            child = this.nextSibling[child];
            index++;
        }

        if (child != 0) {
            return child;
        }

        // create the missing slots
        let count: number = this.childCount(id);

        while (count <= field) {
            child = this.allocate();
            this.dataTypes[child] = EnumToken.ListTokenType;
            this.appendChildren(id, child);
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

        return list != null && this.firstToken[list] != 0;
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

    setLeft(id: number, ...children: number[]): void {
        this.setField(id, TokenField.L, ...children);
    }

    getLeft(id: number): number[] | null {
        return this.getChildAt(id, TokenField.L) == null ? null : this.fieldTokens(id, TokenField.L);
    }

    setRight(id: number, rightId: null): void;

    setRight(id: number, ...rightId: number[]): void;

    setRight(id: number, ...rightId: number[] | [null]): void {
        this.setField(id, TokenField.R, ...(rightId == null || rightId[0] == null ? [] : (rightId as number[])));
    }

    getRight(id: number): number[] | null {
        return this.getChildAt(id, TokenField.R) == null ? null : this.fieldTokens(id, TokenField.R);
    }

    setOp(id: number, opId: number): void {
        this.setField(id, TokenField.Op, opId);
    }

    getOp(id: number): number {
        return this.field(id, TokenField.Op);
    }

    setOp2(id: number, op2Id: number): void {
        this.setField(id, TokenField.Op2, op2Id);
    }

    getOp2(id: number): number {
        return this.field(id, TokenField.Op2);
    }


    // ---- spans ---------------------------------------------------------------------

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

    public getSourceId(id: number): number {
        if (littleEndian) {
            return this.spans32[(id << 1) + 1] >>> 24;
        }

        return Number((this.spans[id] >> 56n) & 0xffn);
    }

    public getSpanStart(id: number): number {
        if (littleEndian) {
            const index: number = id << 1;

            return ((this.spans32[index + 1] & 0xffffff) << 4) | (this.spans32[index] >>> 28);
        }

        return Number((this.spans[id] >> 28n) & 0xfffffffn);
    }

    setSpandStart(id: number, start: number): void {
        this.setSpan(id, this.getSourceId(id), start, this.getSpanEnd(id));
    }

    public getSpanEnd(id: number): number {
        if (littleEndian) {
            return this.spans32[id << 1] & 0xfffffff;
        }

        return Number(this.spans[id] & 0xfffffffn);
    }

    public setSpanEnd(id: number, end: number): void {
        this.setSpan(id, this.getSourceId(id), this.getSpanStart(id), end);
    }

    getParent(id: number): number {
        return this.parents[id];
    }

    public resolveString(id: number): string {
        return this.strings[id];
    }

    /**
     * detach a node from its parent
     * @param id
     */
    detach(id: number): void {
        if (id == 0 || this.parents[id] == 0) {
            return;
        }

        const parent = this.parents[id];
        const next = this.nextSibling[id];
        const previous = this.previousSibling[id];

        if (previous != 0) {
            this.nextSibling[previous] = next;
        } else if (this.firstChild[parent] == id) {
            this.firstChild[parent] = next;
        } else if (this.firstToken[parent] == id) {
            this.firstToken[parent] = next;
        }

        if (next != 0) {
            this.previousSibling[next] = previous;
        } else if (this.lastChild[parent] == id) {
            this.lastChild[parent] = previous;
        } else if (this.lastToken[parent] == id) {
            this.lastToken[parent] = previous;
        }

        this.nextSibling[id] = 0;
        this.previousSibling[id] = 0;
        this.parents[id] = 0;
    }

    /**
     * node walker
     * @param node
     * @param filter
     * @param reverse
     */
    *walk(node: number, filter?: WalkerFilter | WalkerOptions | null, reverse?: boolean): Generator<number> {
        const parents: number[] = [node];

        let options: WalkerOptions | null = filter as WalkerOptions | null;
        let isNumeric: boolean = false;
        let children: boolean = true;
        let attributes: boolean = false;
        let child: number;
        let option: WalkerOption = null;

        if (options != null && typeof options == "object") {
            filter = options.filter as WalkerFilter;
            reverse = options.reverse;
            attributes = options.attributes as boolean;
            children = (options.children as boolean) ?? true;
        }

        while (parents.length > 0) {
            node = parents.pop() as number;
            option = null;
            isNumeric = false;

            if (filter != null) {
                // @ts-expect-error
                option = filter(node);
                isNumeric = typeof option == "number";

                if (isNumeric) {
                    if ((option as number) & WalkerOptionEnum.Ignore) {
                        continue;
                    }

                    if ((option as number) & WalkerOptionEnum.Stop) {
                        break;
                    }
                }
            }

            if (!isNumeric || ((option as number) & WalkerOptionEnum.Children) === 0) {
                yield node;
            }

            if (
                children &&
                this.flags[node] & EnumAstNodeStatus.HasChildren &&
                (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)
            ) {
                // children are pushed in reverse so that they are popped in document order
                if (reverse) {
                    child = this.firstChild[node];
                    while (child != 0) {
                        parents.push(child);
                        child = this.nextSibling[child];
                    }
                } else {
                    child = this.lastChild[node];
                    while (child != 0) {
                        parents.push(child);
                        child = this.previousSibling[child];
                    }
                }
            }

            if (attributes) {
                const values: number[] = this.subTokens(node);

                if (reverse) {
                    for (let i = 0; i < values.length; i++) {
                        parents.push(values[i]);
                    }
                } else {
                    for (let i = values.length - 1; i >= 0; i--) {
                        parents.push(values[i]);
                    }
                }
            }
        }
    }

    /**
     * node tokens walker
     * @param values
     * @param filter
     * @param reverse
     * @returns
     */
    *walkValues(
        values: number[],
        filter?:
            | WalkerValueFilter
            | null
            | {
                  event?: WalkerEvent;
                  fn?: WalkerValueFilter;
                  type?: EnumToken | EnumToken[] | ((token: number) => boolean);
              },
        reverse?: boolean,
    ): Generator<number> {
        // values are popped from the end of the stack
        const stack: number[] = reverse ? values.slice() : values.slice().reverse();

        if (filter != null && typeof filter == "function") {
            filter = {
                event: WalkerEvent.Enter,
                fn: filter,
            };
        } else if (filter == null) {
            filter = {
                event: WalkerEvent.Enter,
            };
        }

        let isNumeric: boolean = false;
        let value: number;
        let option: WalkerOption | number[];
        const eventType = filter.event ?? WalkerEvent.Enter;

        while (stack.length > 0) {
            value = stack.pop() as number;
            option = null;
            isNumeric = false;

            if (filter.fn != null && eventType & WalkerEvent.Enter) {
                const isValid: boolean =
                    filter.type == null ||
                    this.dataTypes[value] == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(this.dataTypes[value])) ||
                    (typeof filter.type == "function" && filter.type(value));

                if (isValid) {
                    // @ts-ignore
                    option = filter.fn(value, this.parents[value], WalkerEvent.Enter);

                    isNumeric = typeof option == "number";

                    if (isNumeric && (option as number) & WalkerOptionEnum.Stop) {
                        return;
                    }

                    if (isNumeric && (option as number) & WalkerOptionEnum.Ignore) {
                        continue;
                    }

                    if (option != null && Array.isArray(option)) {
                        for (
                            let i = reverse ? 0 : option.length - 1;
                            reverse ? i < option.length : i >= 0;
                            reverse ? i++ : i--
                        ) {
                            stack.push(option[i]);
                        }
                    }
                }
            }

            yield value;

            if (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0) {
                const children: number[] = this.subTokens(value);

                if (reverse) {
                    for (let i = 0; i < children.length; i++) {
                        stack.push(children[i]);
                    }
                } else {
                    for (let i = children.length - 1; i >= 0; i--) {
                        stack.push(children[i]);
                    }
                }
            }

            if (eventType & WalkerEvent.Leave && filter.fn != null) {
                const isValid: boolean =
                    filter.type == null ||
                    this.dataTypes[value] == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(this.dataTypes[value])) ||
                    (typeof filter.type == "function" && filter.type(value));

                if (isValid) {
                    // @ts-ignore
                    option = filter.fn(value, this.parents[value], WalkerEvent.Leave);

                    if (option != null && Array.isArray(option)) {
                        this.appendTokenList(value, option);

                        if (reverse) {
                            for (let i = 0; i < option.length; i++) {
                                stack.push(option[i]);
                            }
                        } else {
                            for (let i = option.length - 1; i >= 0; i--) {
                                stack.push(option[i]);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * direct value tokens of a node or a token: the token list, then the tokens of the structured fields
     * and the child tokens (fractions, unary expressions)
     * @param id
     */
    subTokens(id: number): number[] {
        const result: number[] = [];
        let token: number = this.firstToken[id];

        while (token != 0) {
            result.push(token);
            token = this.nextSibling[token];
        }

        if (this.flags[id] & EnumAstNodeStatus.HasChildren) {
            // ast node: the children are nodes
            return result;
        }

        let child: number = this.firstChild[id];

        while (child != 0) {
            if (this.dataTypes[child] == EnumToken.ListTokenType) {
                token = this.firstToken[child];

                while (token != 0) {
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

    findChild(id: number, predicate: (id: number) => boolean): number | null {
        let child = this.firstChild[id];
        while (child != 0) {
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
     * @param predicate
     */
    findToken(id: number, predicate: (id: number) => boolean): number | null {
        let token = this.firstToken[id];
        while (token != 0) {
            if (predicate(token)) {
                return token;
            }
            token = this.nextSibling[token];
        }

        return null;
    }

    siblings(id: number, filter?: (id: number) => boolean): number[] {
        let siblings: number[] = [];
        let child = this.firstChild[this.parents[id]];
        while (child != 0) {
            if (filter == null || filter(child)) {
                siblings.push(child);
            }
            child = this.nextSibling[child];
        }
        return siblings;
    }

    children(id: number, filter?: (id: number) => boolean): number[] {
        let children: number[] = [];
        let child = this.firstChild[id];
        while (child != 0) {
            if (filter != null && !filter(child)) {
                child = this.nextSibling[child];
                continue;
            }
            children.push(child);
            child = this.nextSibling[child];
        }
        return children;
    }

    tokens(id: number, filter?: (id: number) => boolean): number[] {
        let tokens: number[] = [];
        let token = this.firstToken[id];
        while (token != 0) {
            if (filter != null && !filter(token)) {
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

        while (token != 0) {
            count++;
            token = this.nextSibling[token];
        }

        return count;
    }

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

        while (child != 0) {
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

        while (token != 0) {
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

    appendChildren(id: number, ...children: number[]): void {
        this.appendChildList(id, children);
    }

    /**
     * append children. same as {@link appendChildren} with an array
     * @param id
     * @param children
     */
    appendChildList(id: number, children: number[]): void {
        if (children.length == 0) {
            return;
        }

        let lastChild: number;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            if (child == id || child == 0) {
                continue;
            }

            // the child may already be the last child: detach before reading the last child
            this.detach(child);
            lastChild = this.lastChild[id];

            if (lastChild == 0) {
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

    appendTokens(id: number, ...children: number[]): void {
        this.appendTokenList(id, children);
    }

    /**
     * append tokens. same as {@link appendTokens} with an array
     * @param id
     * @param children
     */
    appendTokenList(id: number, children: number[]): void {
        if (children.length == 0) {
            return;
        }

        let lastToken: number;

        for (let i = 0; i < children.length; i++) {
            const token = children[i];

            if (token == id || token == 0) {
                continue;
            }

            // the token may already be the last token: detach before reading the last token
            this.detach(token);
            lastToken = this.lastToken[id];

            if (lastToken == 0) {
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
        if (child == id || child == 0) {
            return;
        }

        if (this.parents[child] != 0) {
            this.detach(child);
        }

        const lastChild: number = this.lastChild[id];

        if (lastChild == 0) {
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
        if (token == id || token == 0) {
            return;
        }

        if (this.parents[token] != 0) {
            this.detach(token);
        }

        const lastToken: number = this.lastToken[id];

        if (lastToken == 0) {
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

        if (first == 0) {
            this.appendTokenList(id, tokens);
            return;
        }

        for (const token of tokens) {
            if (token == id || token == 0) {
                continue;
            }

            this.setPreviousSibling(first, token);
        }
    }

    public equalsIgnoreCase(node: number, key: "nam" | "val", string: string): boolean {
        const id = key == "nam" ? this.name[node] : this.stringValue[node];
        const stringId = this.stringIds.get(string);

        if (stringId != null && id == stringId) {
            return true;
        }

        const value: string | undefined = this.strings[id];

        if (value == null || string.length != value.length) {
            return false;
        }

        return equalsIgnoreCase(value, string);
    }

    public startsWith(node: number, key: "nam" | "val", string: string): boolean {
        const id = key == "nam" ? this.name[node] : this.stringValue[node];
        const stringId = this.stringIds.get(string);

        if (stringId != null && id == stringId) {
            return true;
        }

        const value: string | undefined = this.strings[id];

        if (value == null || string.length > value.length) {
            return false;
        }

        return value.startsWith(string);
    }

    public resize(newSize: number) {
        if (newSize <= this.dataTypes.length) {
            return;
        }

        const newDataTypes = new Uint8Array(newSize);
        newDataTypes.set(this.dataTypes);
        this.dataTypes = newDataTypes;

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
        const used: Uint8Array = new Uint8Array(this.strings.length);
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

        if (count == this.strings.length) {
            return;
        }

        // remap the string ids
        const mapping: Uint32Array = new Uint32Array(this.strings.length);
        const strings: string[] = new Array(count);
        const stringIds: Map<string, number> = new Map();
        let next: number = 0;

        for (let i = 0; i < used.length; i++) {
            if (used[i]) {
                mapping[i] = next;
                strings[next] = this.strings[i];
                stringIds.set(this.strings[i], next);
                next++;
            }
        }

        for (let id = 1; id < size; id++) {
            this.name[id] = mapping[this.name[id]];
            this.stringValue[id] = mapping[this.stringValue[id]];
            this.unit[id] = mapping[this.unit[id]];
        }

        this.strings = strings;
        this.stringIds = stringIds;
    }

    /**
     * current allocation position. the ids allocated after the mark can be released with {@link rewind}
     */
    mark(): number {
        return this.current;
    }

    /**
     * release the ids allocated after the mark. the released ids must not be referenced by the tree:
     * this is used to drop the temporary tokens created while rendering
     * @param mark
     */
    rewind(mark: number): void {
        if (mark >= this.current) {
            return;
        }

        const start: number = mark + 1;
        const end: number = this.current + 1;

        this.dataTypes.fill(0, start, end);
        this.parents.fill(0, start, end);
        this.nextSibling.fill(0, start, end);
        this.previousSibling.fill(0, start, end);
        this.firstToken.fill(0, start, end);
        this.lastToken.fill(0, start, end);
        this.firstChild.fill(0, start, end);
        this.lastChild.fill(0, start, end);
        this.name.fill(0, start, end);
        this.stringValue.fill(0, start, end);
        this.numericValue.fill(0, start, end);
        this.unit.fill(0, start, end);
        this.flags.fill(0, start, end);
        this.colorType.fill(0, start, end);
        this.spans.fill(0n, start, end);

        for (let id = start; id < end; id++) {
            this.errors.delete(id);
        }

        this.current = mark;
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

            for (let child = this.lastChild[id]; child != 0; child = this.previousSibling[child]) {
                stack.push(child);
            }

            for (let token = this.lastToken[id]; token != 0; token = this.previousSibling[token]) {
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
        const used: Uint8Array = new Uint8Array(this.strings.length);

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

        if (count < this.strings.length) {
            const stringMapping: Uint32Array = new Uint32Array(this.strings.length);
            const strings: string[] = new Array(count);
            const stringIds: Map<string, number> = new Map();
            let index: number = 0;

            for (let i = 0; i < used.length; i++) {
                if (used[i]) {
                    stringMapping[i] = index;
                    strings[index] = this.strings[i];
                    stringIds.set(this.strings[i], index);
                    index++;
                }
            }

            for (let id = 1; id < next; id++) {
                name[id] = stringMapping[name[id]];
                stringValue[id] = stringMapping[stringValue[id]];
                unit[id] = stringMapping[unit[id]];
            }

            this.strings = strings;
            this.stringIds = stringIds;
        }

        for (const [id, list] of this.errors) {
            if (mapping[id] != 0) {
                nodeErrors.set(mapping[id], list);
            }
        }

        if (errors != null) {
            for (const error of errors) {
                if (typeof error.node == "number") {
                    error.node = mapping[error.node] || null;
                }
            }
        }

        this.dataTypes = dataTypes;
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

        return mapping;
    }

    /**
     * shrink the columns to the allocated nodes. the arena grows again when new nodes are allocated.
     * see {@link compactStrings} to drop the unused strings
     */
    public trim(): void {
        // keep some room for the tokens allocated while rendering
        const size: number = this.current + 1 + Math.max(64, this.current >> 5);

        if (size >= this.dataTypes.length) {
            return;
        }

        this.dataTypes = this.dataTypes.slice(0, size);
        this.parents = this.parents.slice(0, size);
        this.nextSibling = this.nextSibling.slice(0, size);
        this.previousSibling = this.previousSibling.slice(0, size);
        this.firstToken = this.firstToken.slice(0, size);
        this.lastToken = this.lastToken.slice(0, size);
        this.firstChild = this.firstChild.slice(0, size);
        this.lastChild = this.lastChild.slice(0, size);
        this.name = this.name.slice(0, size);
        this.stringValue = this.stringValue.slice(0, size);
        this.numericValue = this.numericValue.slice(0, size);
        this.unit = this.unit.slice(0, size);
        this.flags = this.flags.slice(0, size);
        this.colorType = this.colorType.slice(0, size);
        this.spans = this.spans.slice(0, size);
        this.spans32 = new Uint32Array(this.spans.buffer);
    }

    setErrors(id: number, errors: ErrorDescription[] | null) {
        // empty error lists are not stored
        if (errors == null || errors.length == 0) {
            this.errors.delete(id);
        } else {
            this.errors.set(id, errors);
        }
    }

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

        while (child != 0) {
            count++;
            child = this.nextSibling[child];
        }

        return count;
    }
}

/**
 * Css ast arena: ast nodes and value tokens
 */
export class AstArena extends Arena {
    /**
     * raw selector (minification cache). sparse: only rules have an entry
     */
    public raw: Array<RawSelectorTokens | null | undefined> = [];
    /**
     * optimized selector (minification cache). sparse: only rules have an entry
     */
    public optimized: Array<OptimizedSelector | null | undefined> = [];
    /**
     * source ids. `spans` store the index in this table (8 bits)
     */
    public sources: number[] = [];

    constructor(size: number = 4096) {
        super(size);

        // string id 0 is the null / empty string
        this.internString("");

        this.flags[this.root] = EnumAstNodeStatus.HasChildren;
    }

    /**
     * @inheritDoc
     */
    protected exportProperties(): ArenaProperties {
        return {
            ...super.exportProperties(),
            kind: "AstArena",
            sources: this.sources,
            raw: this.raw,
            optimized: this.optimized,
        };
    }

    /**
     * @inheritDoc
     */
    protected importProperties(properties: ArenaProperties, transferables: ArenaTransferables): void {
        super.importProperties(properties, transferables);

        this.sources = properties.sources?.slice() ?? [];
        this.raw = properties.raw?.slice() ?? [];
        this.optimized = properties.optimized?.slice() ?? [];
    }

    /**
     * @inheritDoc
     */
    public trim(): void {
        super.trim();

        const size: number = this.dataTypes.length;

        if (this.raw.length > size) {
            this.raw.length = size;
        }

        if (this.optimized.length > size) {
            this.optimized.length = size;
        }
    }

    /**
     * @inheritDoc
     */
    rewind(mark: number): void {
        if (this.raw.length > mark + 1) {
            this.raw.length = mark + 1;
        }

        if (this.optimized.length > mark + 1) {
            this.optimized.length = mark + 1;
        }

        super.rewind(mark);
    }

    /**
     * @inheritDoc
     */
    compact(errors?: ErrorDescription[] | null): Uint32Array {
        const mapping: Uint32Array = super.compact(errors);

        // the minification caches are dropped
        this.raw = [];
        this.optimized = [];

        return mapping;
    }

    // ---- state ---------------------------------------------------------------------

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

    /**
     * true if the node is invalid
     * @param id
     */
    isInvalid(id: number): boolean {
        return (this.flags[id] & EnumAstNodeStatus.Invalid) != 0;
    }

    // ---- location ------------------------------------------------------------------

    /**
     * index of a source id in the sources table
     * @param srcId
     */
    sourceIndex(srcId: number): number {
        let index: number = this.sources.indexOf(srcId);

        if (index == -1) {
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
        if ((this.flags[start] & EnumAstNodeStatus.HasLocation) == 0) {
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
        return (this.flags[id] & EnumAstNodeStatus.HasLocation) != 0;
    }

    /**
     * source location
     * @param id
     */
    getLocation(id: number): SourceLocation | null {
        if ((this.flags[id] & EnumAstNodeStatus.HasLocation) == 0) {
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

    // ---- ast nodes -------------------------------------------------------------------

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
        sel: string,
        tokens: number[] | null | undefined,
        state: EnumAstNodeStatus | null | undefined,
        errors: ErrorDescription[] | null | undefined,
    ): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        this.name[id] = this.internString(sel);
        this.flags[id] = EnumAstNodeStatus.HasChildren | ((state ?? 0) & EnumAstNodeStatus.StateMask);

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        if (errors != null && errors.length > 0) {
            this.errors.set(id, errors);
        }

        return id;
    }

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
        nam: string,
        val: string,
        block: boolean,
        tokens: number[] | null | undefined,
        state: EnumAstNodeStatus | null | undefined,
        errors: ErrorDescription[] | null | undefined,
    ): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        this.name[id] = this.internString(nam);
        this.stringValue[id] = this.internString(val);
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
        nam: string,
        val: number[] | null | undefined,
        state: EnumAstNodeStatus | null | undefined,
        errors: ErrorDescription[] | null | undefined,
    ): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        this.name[id] = this.internString(nam);
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
    createComment(typ: EnumToken, val: string): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;
        this.stringValue[id] = this.internString(val);
        this.flags[id] = 0;

        return id;
    }

    // ---- tokens ----------------------------------------------------------------------

    /**
     * allocate a token. string values are interned, numeric values are stored in the `numericValue` column
     * @param typ
     * @param val
     * @param unit
     */
    createToken(typ: EnumToken, val?: string | number | null, unit?: string | null): number {
        const id: number = this.allocate();

        this.dataTypes[id] = typ;

        if (typeof val == "string") {
            this.stringValue[id] = this.internString(val);
        } else if (typeof val == "number") {
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
        this.setColorType(id, kin);

        if (tokens != null) {
            this.appendTokenList(id, tokens);
        }

        return id;
    }

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
        this.setField(id, TokenField.L, l);
        this.setField(id, TokenField.R, r);

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
        this.appendChildren(id, l, r);

        return id;
    }

    /**
     * true if the numeric token value is a fraction
     * @param id
     */
    hasFraction(id: number): boolean {
        const child: number = this.firstChild[id];

        return child != 0 && this.dataTypes[child] == EnumToken.FractionTokenType;
    }

    /**
     * fraction token of a numeric token
     * @param id
     */
    getFraction(id: number): number {
        const child: number = this.firstChild[id];

        return child != 0 && this.dataTypes[child] == EnumToken.FractionTokenType ? child : 0;
    }

    /**
     * set the fraction value of a numeric token. the numeric value is set to the fraction value
     * @param id
     * @param fraction fraction token id or null
     */
    setFraction(id: number, fraction: number | null): void {
        const child: number = this.getFraction(id);

        if (child != 0) {
            this.detach(child);
        }

        if (fraction != null && fraction != 0) {
            this.appendChildren(id, fraction);
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
        return this.strings[this.stringValue[id]];
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
        if (this.parents[id] == 0) {
            return;
        }

        const index: number = tokens.indexOf(id);

        if (index == -1) {
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
        return this.parents[token] == 0 ? token : this.clone(token, true);
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

        if (typeof val == "string") {
            this.stringValue[id] = this.internString(val);
        } else if (typeof val == "number") {
            this.numericValue[id] = val;
        }

        if (unit != null) {
            this.unit[id] = this.internString(unit);
        }

        this.setTokens(id);
        this.setChildren(id);
    }

    // ---- plain objects -----------------------------------------------------------------

    /**
     * create a node or a token from a plain object. `chi`, `val`, `l`, `r`, ... are created recursively.
     * Public helper: the library only deals with node ids internally
     * @param node
     */
    fromObject(node: PlainAstNode | PlainToken): number {
        const typ: EnumToken = node.typ;

        switch (typ) {
            case EnumToken.StyleSheetNodeType:
            case EnumToken.RuleNodeType:
            case EnumToken.KeyframesRuleNodeType:
            case EnumToken.InvalidRuleNodeType:
            case EnumToken.AtRuleNodeType:
            case EnumToken.KeyframesAtRuleNodeType:
            case EnumToken.InvalidAtRuleNodeType:
            case EnumToken.CommentNodeType:
            case EnumToken.CDOCOMMNodeType:
            case EnumToken.DeclarationNodeType:
            case EnumToken.InvalidDeclarationNodeType:
            case EnumToken.CssVariableTokenType:
            case EnumToken.CssVariableImportTokenType:
            case EnumToken.CssVariableDeclarationMapTokenType:
                return this.nodeFromObject(node as PlainAstNode);

            default:
                return this.tokenFromObject(node as PlainToken);
        }
    }

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
            case EnumToken.InvalidRuleNodeType:
                this.name[id] = this.internString((node.sel ?? node.nam ?? "") as string);
                this.flags[id] = EnumAstNodeStatus.HasChildren;
                if (node.raw != null) {
                    this.raw[id] = node.raw;
                }

                if (node.optimized != null) {
                    this.optimized[id] = node.optimized;
                }

                if (typeof node.val == "string") {
                    this.stringValue[id] = this.internString(node.val);
                }

                break;

            case EnumToken.AtRuleNodeType:
            case EnumToken.KeyframesAtRuleNodeType:
            case EnumToken.InvalidAtRuleNodeType:
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
                        this.appendToken(id, typeof token == "number" ? token : this.fromObject(token));
                    }
                }

                break;
        }

        if (Array.isArray(node.tokens)) {
            for (const token of node.tokens) {
                this.appendToken(id, typeof token == "number" ? token : this.fromObject(token));
            }
        }

        this.setState(id, node.state);

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
                this.appendChildren(id, typeof child == "number" ? child : this.fromObject(child));
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

        if (typeof plain.nam == "string") {
            this.name[id] = this.internString(plain.nam);
        }

        if (typeof plain.unit == "string") {
            this.unit[id] = this.internString(plain.unit);
        }

        if (typeof plain.kin == "number") {
            this.setColorType(id, plain.kin);
        }

        if (typeof plain.cal == "string") {
            this.unit[id] = this.internString(plain.cal);
        }

        if (typeof plain.attr == "string") {
            this.unit[id] = this.internString(plain.attr);
        }

        if (typ == EnumToken.BinaryExpressionTokenType) {
            this.numericValue[id] = plain.op;
        } else if (typ == EnumToken.UnaryExpressionTokenType) {
            this.numericValue[id] = plain.sign;
            this.appendChildren(id, typeof plain.val == "number" ? plain.val : this.fromObject(plain.val));
        } else if (typ == EnumToken.FractionTokenType) {
            this.appendChildren(
                id,
                typeof plain.l == "number" ? plain.l : this.fromObject(plain.l),
                typeof plain.r == "number" ? plain.r : this.fromObject(plain.r),
            );
        } else if (typeof plain.val == "string") {
            if (numericTokenTypes.has(typ)) {
                // numeric value as a string
                this.numericValue[id] = +plain.val;
            } else {
                this.stringValue[id] = this.internString(plain.val);
            }
        } else if (typeof plain.val == "number") {
            this.numericValue[id] = plain.val;
        } else if (plain.val != null && typeof plain.val == "object" && !Array.isArray(plain.val)) {
            // fraction value
            this.setFraction(id, this.fromObject(plain.val));
        } else if (Array.isArray(plain.val) && typ != EnumToken.MediaRangeQueryTokenType) {
            // declaration like tokens
            for (const child of plain.val) {
                this.appendToken(id, typeof child == "number" ? child : this.fromObject(child));
            }
        }

        if (Array.isArray(plain.chi)) {
            for (const child of plain.chi) {
                this.appendToken(id, typeof child == "number" ? child : this.fromObject(child));
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
                    fieldTokens.push(typeof value == "number" ? value : this.fromObject(value));
                }

                this.setField(id, field, ...fieldTokens);
            }
        }

        const loc: SourceLocation | null | undefined = plain.loc;

        if (loc != null) {
            this.setLocation(id, loc.srcId, loc.sta, loc.end);
        }

        return id;
    }

    /**
     * export a node or a token as a plain object (deep copy).
     * Public helper: the library only deals with node ids internally
     * @param id
     */
    toObject(id: number): PlainAstNode | PlainToken {
        const typ: EnumToken = this.dataTypes[id];
        const flags: number = this.flags[id];

        switch (typ) {
            case EnumToken.StyleSheetNodeType:
            case EnumToken.RuleNodeType:
            case EnumToken.KeyframesRuleNodeType:
            case EnumToken.InvalidRuleNodeType:
            case EnumToken.AtRuleNodeType:
            case EnumToken.KeyframesAtRuleNodeType:
            case EnumToken.InvalidAtRuleNodeType:
            case EnumToken.CommentNodeType:
            case EnumToken.CDOCOMMNodeType:
            case EnumToken.DeclarationNodeType:
            case EnumToken.InvalidDeclarationNodeType:
            case EnumToken.CssVariableTokenType:
            case EnumToken.CssVariableImportTokenType:
            case EnumToken.CssVariableDeclarationMapTokenType:
                break;

            default:
                return this.tokenToObject(id);
        }

        const node: PlainAstNode = { typ };

        switch (typ) {
            case EnumToken.StyleSheetNodeType:
                break;

            case EnumToken.RuleNodeType:
            case EnumToken.KeyframesRuleNodeType:
            case EnumToken.InvalidRuleNodeType:
                node.sel = this.strings[this.name[id]];
                break;

            case EnumToken.AtRuleNodeType:
            case EnumToken.KeyframesAtRuleNodeType:
            case EnumToken.InvalidAtRuleNodeType:
                node.nam = this.strings[this.name[id]];
                node.val = this.strings[this.stringValue[id]];
                break;

            case EnumToken.CommentNodeType:
            case EnumToken.CDOCOMMNodeType:
                node.val = this.strings[this.stringValue[id]];
                break;

            default:
                node.nam = this.strings[this.name[id]];
                node.val = [];

                for (const token of this.tokens(id)) {
                    node.val.push(this.tokenToObject(token));
                }
                break;
        }

        if (flags & EnumAstNodeStatus.HasChildren) {
            node.chi = [];

            for (const child of this.children(id)) {
                node.chi.push(this.toObject(child) as PlainAstNode);
            }
        }

        if (flags & EnumAstNodeStatus.HasLocation) {
            node.loc = this.getLocation(id);
        }

        if (flags & EnumAstNodeStatus.StateMask) {
            node.state = flags & EnumAstNodeStatus.StateMask;
        }

        if ((flags & EnumAstNodeStatus.HasValues) == 0 && this.firstToken[id] != 0) {
            node.tokens = [];

            for (const token of this.tokens(id)) {
                node.tokens.push(this.tokenToObject(token));
            }
        }

        if (this.errors.has(id)) {
            node.errors = this.errors.get(id);
        }

        if (this.raw[id] != null) {
            node.raw = this.raw[id];
        }

        if (this.optimized[id] != null) {
            node.optimized = this.optimized[id];
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

        if (this.name[id] != 0) {
            token.nam = this.strings[this.name[id]];
        }

        if (typ == EnumToken.BinaryExpressionTokenType) {
            token.op = this.numericValue[id];
        } else if (typ == EnumToken.UnaryExpressionTokenType) {
            token.sign = this.numericValue[id];
            token.val = this.firstChild[id] == 0 ? null : this.tokenToObject(this.firstChild[id]);
        } else if (typ == EnumToken.FractionTokenType) {
            token.l = this.tokenToObject(this.firstChild[id]);
            token.r = this.tokenToObject(this.lastChild[id]);
        } else if (numericTokenTypes.has(typ)) {
            const fraction: number = this.getFraction(id);

            token.val = fraction == 0 ? this.numericValue[id] : this.tokenToObject(fraction);
        } else if (this.stringValue[id] != 0 || typ == EnumToken.IdenTokenType || typ == EnumToken.StringTokenType) {
            token.val = this.strings[this.stringValue[id]];
        }

        if (this.unit[id] != 0) {
            if (typ == EnumToken.ColorTokenType) {
                token.cal = this.strings[this.unit[id]];
            } else if (typ == EnumToken.MatchExpressionTokenType) {
                token.attr = this.strings[this.unit[id]];
            } else {
                token.unit = this.strings[this.unit[id]];
            }
        }

        if (typ == EnumToken.ColorTokenType && this.colorType[id] != ColorType.NONE) {
            token.kin = this.colorType[id];
        }

        if (this.firstToken[id] != 0) {
            const tokens: PlainToken[] = [];

            for (const child of this.tokens(id)) {
                tokens.push(this.tokenToObject(child));
            }

            if (
                typ == EnumToken.DeclarationNodeType ||
                typ == EnumToken.CssVariableTokenType ||
                typ == EnumToken.CssVariableImportTokenType
            ) {
                token.val = tokens;
            } else {
                token.chi = tokens;
            }
        }

        if (structuredTokenTypes.has(typ)) {
            const single: boolean =
                typ == EnumToken.BinaryExpressionTokenType ||
                typ == EnumToken.IfElseConditionTokenType ||
                typ == EnumToken.MatchExpressionTokenType ||
                typ == EnumToken.NameSpaceAttributeTokenType;
            const singleLeft: boolean =
                single ||
                typ == EnumToken.MediaQueryConditionTokenType ||
                typ == EnumToken.MediaQueryUnaryFeatureTokenType ||
                typ == EnumToken.SupportsQueryUnaryConditionTokenType ||
                typ == EnumToken.WhenElseUnaryConditionTokenType;
            const singleRight: boolean = single || typ == EnumToken.ComposesSelectorNodeType;
            const fields: Array<[string, TokenField, boolean]> = [
                ["l", TokenField.L, singleLeft],
                ["r", TokenField.R, singleRight],
                [typ == EnumToken.MediaRangeQueryTokenType ? "op1" : "op", TokenField.Op, typ != EnumToken.ContainerStyleRangeTokenType],
                ["op2", TokenField.Op2, true],
                ["val", TokenField.Val, false],
            ];

            for (const [key, field, isSingle] of fields) {
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

    // ---- clone / import ----------------------------------------------------------------

    /**
     * clone a node or a token. tokens are always cloned deeply
     * @param id
     * @param deep also clone the children (rules) or the value tokens (declarations)
     * @param cloneMap map of the source ids to their clones
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

        if (this.raw[id] != null) {
            this.raw[target] = this.raw[id];
        }

        if (this.optimized[id] != null) {
            this.optimized[target] = this.optimized[id];
        }

        if (this.errors.size > 0 && this.errors.has(id)) {
            this.errors.set(target, this.errors.get(id)!);
        }

        const isNode: boolean = (flags & (EnumAstNodeStatus.HasChildren | EnumAstNodeStatus.HasValues)) != 0;

        // declaration values are cloned only when requested (legacy cloneNode() behavior)
        if (!isNode || deep || (flags & EnumAstNodeStatus.HasValues) == 0) {
            let token: number = this.firstToken[id];

            while (token != 0) {
                this.appendToken(target, this.clone(token, true, cloneMap));
                token = this.nextSibling[token];
            }
        }

        if (!isNode || deep) {
            let child: number = this.firstChild[id];

            while (child != 0) {
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
        this.name[target] = this.internString(source.strings[source.name[id]] ?? "");
        this.stringValue[target] = this.internString(source.strings[source.stringValue[id]] ?? "");
        this.numericValue[target] = source.numericValue[id];
        this.unit[target] = this.internString(source.strings[source.unit[id]] ?? "");
        this.colorType[target] = source.colorType[id];
        this.flags[target] = flags & ~EnumAstNodeStatus.HasLocation;

        if (source.raw[id] != null) {
            this.raw[target] = source.raw[id];
        }

        if (source.optimized[id] != null) {
            this.optimized[target] = source.optimized[id];
        }

        if (flags & EnumAstNodeStatus.HasLocation) {
            this.setLocation(target, source.getSource(id), source.getSpanStart(id), source.getSpanEnd(id));
        }

        if (source.errors.has(id)) {
            this.errors.set(target, source.errors.get(id)!);
        }

        let token: number = source.firstToken[id];

        while (token != 0) {
            this.appendToken(target, this.import(source, token));
            token = source.nextSibling[token];
        }

        if (deep || (flags & EnumAstNodeStatus.HasChildren) == 0) {
            let child: number = source.firstChild[id];

            while (child != 0) {
                this.appendChild(target, this.import(source, child));
                child = source.nextSibling[child];
            }
        }

        return target;
    }

    // ---- tree helpers --------------------------------------------------------------

    /**
     * detach a node and drop its tokens / cached data. node ids are never reused: this only releases
     * the memory held by the node columns
     * @param id
     * @param deep release the children and the tokens
     */
    release(id: number, deep: boolean = false): void {
        if (id == 0 || id == this.root) {
            return;
        }

        if (deep) {
            let child: number = this.firstChild[id];

            while (child != 0) {
                const next: number = this.nextSibling[child];

                this.release(child, true);
                child = next;
            }

            let token: number = this.firstToken[id];

            while (token != 0) {
                const next: number = this.nextSibling[token];

                this.release(token, true);
                token = next;
            }
        }

        this.detach(id);

        if (this.raw[id] != null) {
            this.raw[id] = undefined;
        }

        if (this.optimized[id] != null) {
            this.optimized[id] = undefined;
        }

        this.name[id] = 0;
        this.stringValue[id] = 0;
        this.unit[id] = 0;
        this.errors.delete(id);
    }

    /**
     * index of a child in its parent's children (or tokens) list
     * @param id
     */
    indexOf(id: number): number {
        let index: number = 0;
        let child: number = this.previousSibling[id];

        if (this.parents[id] == 0) {
            return -1;
        }

        while (child != 0) {
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
            if (node == reference || node == 0) {
                continue;
            }

            this.setPreviousSibling(reference, node);
        }
    }

    /**
     * insert nodes after a child
     * @param reference
     * @param nodes
     */
    insertAfter(reference: number, ...nodes: number[]): void {
        for (const node of nodes) {
            if (node == reference || node == 0) {
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

        if (first == 0) {
            this.appendChildList(id, nodes);
        } else {
            this.insertBefore(first, ...nodes);
        }
    }

    /**
     * replace a child with other nodes. the node itself may be part of the replacement
     * @param id
     * @param nodes
     */
    replaceChild(id: number, ...nodes: number[]): void {
        if (this.parents[id] == 0) {
            return;
        }

        const index: number = nodes.indexOf(id);

        if (index == -1) {
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
        return (this.flags[id] & EnumAstNodeStatus.HasChildren) != 0;
    }

    /**
     * rule selector
     * @param id
     */
    getSelector(id: number): string {
        return this.strings[this.name[id]];
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

}
