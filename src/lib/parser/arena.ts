import { StringInterner } from "./utils/intern.ts";

class ArenaData {
    private count: number = 0;
    private kind: Uint8Array;
    private nodes: Uint32Array;
    /**
     * node token data
     */
    private data: Uint32Array;
    private args: Uint32Array;
    private argsLen: Uint8Array;
    private spans: Uint32Array;
    private source: Uint8Array;

    private strings: StringInterner = new StringInterner();

    constructor(size: number = 1024) {
        this.kind = new Uint8Array(size);
        this.nodes = new Uint32Array(size);
        this.parents = new Uint32Array(size);
        this.data = new Uint32Array(size);
        this.source = new Uint8Array(size);
        this.children = new Uint32Array(size);
        this.childrenLen = new Uint32Array(size);
        this.args = new Uint32Array(size);
        this.argsLen = new Uint8Array(size);
        this.spans = new Uint32Array(size);
    }

    allocate(kind: number, node: number, parent: number, data: number, source: number, children: number, childrenLen: number, args: number, argsLen: number, spans: number) {
        if (this.count === this.kind.length) {
            this.grow();
        }
        this.kind[this.count] = kind;
        this.nodes[this.count] = node;
        this.parents[this.count] = parent;
        this.data[this.count] = data;
        this.source[this.count] = source;
        this.children[this.count] = children;
        this.childrenLen[this.count] = childrenLen;
        this.args[this.count] = args;
        this.argsLen[this.count] = argsLen;
        this.spans[this.count] = spans;
        return this.count++;
    }

    private grow() {
        const kind = new Uint8Array(this.kind.length * 2);
        kind.set(this.kind);
        const nodes = new Uint32Array(this.nodes.length * 2);
        nodes.set(this.nodes);
        const parents = new Uint32Array(this.parents.length * 2);
        parents.set(this.parents);
        const data = new Uint32Array(this.data.length * 2);
        data.set(this.data);
        const source = new Uint8Array(this.source.length * 2);
        source.set(this.source);
        const children = new Uint32Array(this.children.length * 2);
        children.set(this.children);
        const childrenLen = new Uint32Array(this.childrenLen.length * 2);
        childrenLen.set(this.childrenLen);
        const args = new Uint32Array(this.args.length * 2);
        args.set(this.args);
        const argsLen = new Uint8Array(this.argsLen.length * 2);
        argsLen.set(this.argsLen);
        const spans = new Uint32Array(this.spans.length * 2);
        spans.set(this.spans);

        this.kind = kind;
        this.nodes = nodes;
        this.parents = parents;
        this.data = data;
        this.source = source;
        this.children = children;
        this.childrenLen = childrenLen;
        this.args = args;
        this.argsLen = argsLen;
        this.spans = spans;
    }
}
