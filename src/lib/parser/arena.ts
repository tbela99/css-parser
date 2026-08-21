import { StringInterner } from "./utils/intern.ts";

class ArenaData {
    private count: number = 0;
    private nodes: Uint32Array;
    /**
     * node token properties data: example
     *  - Color(kind[ColorType], cal: ["rel" | "mix" | "col"])
     *  - pointer to the first node token (parsed node selector, parsed prelude)
     * 
     */
    private data: Uint32Array;
    private source: Uint8Array;

    private strings: StringInterner = new StringInterner();

    constructor(size: number = 1024) {
        this.nodes = new Uint32Array(size);
        this.data = new Uint32Array(size);
        this.source = new Uint8Array(5);
        this.strings = new StringInterner();
    }

    allocate(kind: number, node: number, parent: number, data: number, source: number) {
        if (this.count === this.nodes.length) {
            this.grow();
        }
        this.nodes[this.count] = node;
        this.data[this.count] = data;
        this.source[this.count] = source;
        return this.count++;
    }

    private grow() {
        const nodes = new Uint32Array(this.nodes.length * 2);
        const data = new Uint32Array(this.data.length * 2);
        
        nodes.set(this.nodes);
        data.set(this.data);

        this.nodes = nodes;
        this.data = data;
    }
}
