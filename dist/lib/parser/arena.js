import { EnumToken } from '../ast/types.js';
import { SourceFile } from './source.js';

// Node Data layout
// (node area)
// node type -> 1 byte
// parent -> 4 bytes
// firstChild -> 4 bytes
// nextSibling -> 4 bytes
// firstToken -> 4 bytes // parsed selector or at-rule prelude
// nextToken -> 4 bytes
// resolvedTokens -> 4 bytes // selector or at-rule prelude as string
// flags -> 1 byte (validation state, resolved state, resolved prelude state, decoded string state)
// SpanArena: (start offset 26)
//  sourceId -> 2 bytes
//  sourceSpanStart -> 4 byte
//  sourceSpanLength -> 4 bytes
// payloadOffset -> 4 bytes
// payloadType -> 1 byte
// (data area)
// data ->  (start offset 41): union of ColorArena (ColorKind, r, g, b, a) | string intern id | number | DimensionArena
//  ColorArena (11 bytes):
//    ColorType -> 1 byte
//    resolved -> 4 bytes
//    componentsCount -> 1 byte
//    components -> 3 to 5 bytes (r,g,b / l, c, h / h , w, b / x, y, z / h, s, l), alpha or (c, m, y, k, alpha)
//  DimensionArena (8 bytes):
//    value -> 4 bytes
//    unit -> 4 bytes
//  String (4 bytes):
//    string id -> 4 bytes
//  Number (4 bytes):
//    number -> 4 bytes
//  Percentage (4 bytes):
//    number -> 4 bytes
// absolute sizes
const NODE_AREA_SIZE = 41;
const COLOR_AREA_SIZE = 11;
const DIMENSION_AREA_SIZE = 8;
const STRING_AREA_SIZE = 4;
const NUMBER_AREA_SIZE = 4;
const PERCENTAGE_AREA_SIZE = 4;
const NODE_SPAN_OFFSET = 26;
const NODE_PAYLOAD_OFFSET = 36;
const NODE_PAYLOAD_TYPE_OFFSET = 40;
// relative offsets
const COLOR_TYPE_OFFSET = 0;
const COLOR_RESOLVED_OFFSET = 1;
const COLOR_COMPONENTS_COUNT_OFFSET = 5;
const COLOR_COMPONENTS_OFFSET = 6;
var PayloadType;
(function (PayloadType) {
    PayloadType[PayloadType["Unset"] = 0] = "Unset";
    PayloadType[PayloadType["Color"] = 1] = "Color";
    PayloadType[PayloadType["Dimension"] = 2] = "Dimension";
    PayloadType[PayloadType["String"] = 3] = "String";
    PayloadType[PayloadType["Number"] = 4] = "Number";
    PayloadType[PayloadType["Percentage"] = 5] = "Percentage";
})(PayloadType || (PayloadType = {}));
class Arena {
    capacity;
    buffer;
    view;
    count = NODE_AREA_SIZE; // node 0 = null
    // root ast node
    sources = [];
    strings;
    constructor(strings, size = 1024) {
        // Heuristic: one node per source character.
        this.capacity = Math.max(1024, size >>> 0);
        this.buffer = new ArrayBuffer(this.capacity * NODE_AREA_SIZE);
        this.view = new DataView(this.buffer);
        this.strings = strings;
    }
    get root() {
        return this.view.getInt32(NODE_AREA_SIZE);
    }
    allocateRoot() {
        if (this.root !== 0) {
            throw new Error("Root node already allocated");
        }
        return this.allocate(EnumToken.StyleSheetNodeType);
    }
    // =====================================================================
    // === API ===
    // ====================================================================
    getFile(id) {
        return this.sources[id].getFile();
    }
    getPosition(id) {
        return this.sources[this.view.getInt16(id + NODE_SPAN_OFFSET)].position(this.view.getInt16(id + NODE_SPAN_OFFSET + 2));
    }
    addSource(content, lines, file = null) {
        this.sources.push(new SourceFile(this.sources.length, content, lines, file));
        return this.sources[this.sources.length - 1];
    }
    allocate(type) {
        if (this.count + NODE_AREA_SIZE >= this.capacity) {
            this.grow();
        }
        const node = this.count;
        this.count += NODE_AREA_SIZE;
        this.view.setUint8(node, type);
        // Other arrays are already zero-initialized.
        // if (typeof data === "string") {
        //     this.data[node] = this.allocate(EnumToken.ValueTokenType, this.strings.intern(data));
        // } else if (typeof data === "number") {
        //     this.data[node] = this.allocate(EnumToken.ValueTokenType, data);
        // }
        return node;
    }
    allocateNumber(id, data) {
        if (this.view.getUint8(id + NODE_PAYLOAD_TYPE_OFFSET) === PayloadType.Number) {
            this.view.setFloat32(this.view.getInt32(id + NODE_PAYLOAD_OFFSET), data);
            return;
        }
        if (this.count + NUMBER_AREA_SIZE >= this.capacity) {
            this.grow();
        }
        this.view.setUint8(id + NODE_PAYLOAD_TYPE_OFFSET, PayloadType.Number);
        this.view.setInt32(id + NODE_PAYLOAD_OFFSET, this.count);
        this.view.setFloat32(this.count, data);
        this.count += NUMBER_AREA_SIZE;
    }
    allocatePercentage(id, data) {
        if (this.view.getUint8(id + NODE_PAYLOAD_TYPE_OFFSET) === PayloadType.Percentage) {
            this.view.setFloat32(this.view.getInt32(id + NODE_PAYLOAD_OFFSET), data);
            return;
        }
        if (this.count + PERCENTAGE_AREA_SIZE >= this.capacity) {
            this.grow();
        }
        this.view.setUint8(id + NODE_PAYLOAD_TYPE_OFFSET, PayloadType.Percentage);
        this.view.setInt32(id + NODE_PAYLOAD_OFFSET, this.count);
        this.view.setFloat32(this.count, data);
        this.count += PERCENTAGE_AREA_SIZE;
    }
    allocateString(id, data) {
        if (this.view.getUint8(id + NODE_PAYLOAD_TYPE_OFFSET) === PayloadType.String) {
            this.view.setInt32(this.view.getInt32(id + NODE_PAYLOAD_OFFSET), this.strings.intern(data));
            return;
        }
        if (this.count + STRING_AREA_SIZE >= this.capacity) {
            this.grow();
        }
        this.view.setUint8(id + NODE_PAYLOAD_TYPE_OFFSET, PayloadType.String);
        this.view.setInt32(id + NODE_PAYLOAD_OFFSET, this.count);
        this.view.setInt32(this.count, this.strings.intern(data));
        this.count += STRING_AREA_SIZE;
    }
    allocateDimension(id, value, dimension) {
        if (this.view.getUint8(id + NODE_PAYLOAD_TYPE_OFFSET) === PayloadType.Dimension) {
            const offset = this.view.getInt32(id + NODE_PAYLOAD_OFFSET);
            this.view.setFloat32(offset, value);
            this.view.setInt32(offset + 4, this.strings.intern(dimension));
            return;
        }
        if (this.count + DIMENSION_AREA_SIZE >= this.capacity) {
            this.grow();
        }
        this.view.setUint8(id + NODE_PAYLOAD_TYPE_OFFSET, PayloadType.Dimension);
        this.view.setInt32(id + NODE_PAYLOAD_OFFSET, this.count);
        this.view.setFloat32(this.count, value);
        this.view.setFloat32(this.count + 4, this.strings.intern(dimension));
        this.count += DIMENSION_AREA_SIZE;
    }
    allocateColor(id, type) {
        if (this.view.getUint8(id + NODE_PAYLOAD_TYPE_OFFSET) === PayloadType.Color) {
            this.view.setUint8(this.view.getInt32(id + NODE_PAYLOAD_OFFSET) + COLOR_TYPE_OFFSET, type);
            return;
        }
        if (this.count + COLOR_AREA_SIZE >= this.capacity) {
            this.grow();
        }
        this.view.setUint8(id + NODE_PAYLOAD_TYPE_OFFSET, PayloadType.Color);
        this.view.setInt32(id + NODE_PAYLOAD_OFFSET, this.count);
        this.view.setUint8(this.view.getInt32(id + NODE_PAYLOAD_OFFSET) + COLOR_TYPE_OFFSET, type);
        this.count += COLOR_AREA_SIZE;
    }
    resolveColor(id, resolved) {
        this.view.setInt32(this.view.getInt32(id + NODE_PAYLOAD_OFFSET) + COLOR_RESOLVED_OFFSET, this.strings.intern(resolved));
    }
    setColorComponents(id, data) {
        const offset = this.view.getInt32(id + NODE_PAYLOAD_OFFSET);
        this.view.setUint8(offset + COLOR_COMPONENTS_COUNT_OFFSET, data.length);
        for (let i = 0; i < data.length; i++) {
            this.view.setUint8(offset + COLOR_COMPONENTS_OFFSET + i, data[i]);
        }
    }
    setSpans(id, sourceId, start, end) {
        const offset = id + NODE_SPAN_OFFSET;
        this.view.setInt16(offset, sourceId);
        this.view.setInt32(offset + 2, start);
        this.view.setInt32(offset + 6, end);
    }
    grow() {
        const newCapacity = this.capacity * 2;
        const buffer = new ArrayBuffer(newCapacity);
        this.view = new DataView(buffer);
        new Uint8Array(buffer).set(new Uint8Array(this.buffer));
        this.buffer = buffer;
        this.capacity = newCapacity;
    }
}

export { Arena };
