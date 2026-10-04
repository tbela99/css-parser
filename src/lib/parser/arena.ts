export class Arena {
    public stringIds: Map<string, number> = new Map();
    public strings: string[] = [];
    public root: number = 1;
    public current: number = 1;

    public dataTypes: Uint8Array;
    public parents: Uint32Array;
    public nextSibling: Uint32Array;
    public previousSibling: Uint32Array;
    public firstToken: Uint32Array;
    public firstChild: Uint32Array;
    public lastChild: Uint32Array;
    public name: Uint32Array;
    public stringValue: Uint32Array;
    public numericValue: Float64Array;
    public unit: Uint32Array;
    public flags: Uint32Array;
    public left: Uint32Array;
    public right: Uint32Array;
    public op: Uint32Array;
    public op2: Uint32Array;

    constructor(size: number = 1024) {
        this.dataTypes = new Uint8Array(size);
        this.parents = new Uint32Array(size);
        this.nextSibling = new Uint32Array(size);
        this.previousSibling = new Uint32Array(size);
        this.firstToken = new Uint32Array(size);
        this.firstChild = new Uint32Array(size);
        this.lastChild = new Uint32Array(size);
        this.name = new Uint32Array(size);
        this.stringValue = new Uint32Array(size);
        this.numericValue = new Float64Array(size);
        this.unit = new Uint32Array(size);
        this.flags = new Uint32Array(size);
        this.left = new Uint32Array(size);
        this.right = new Uint32Array(size);
        this.op = new Uint32Array(size);
        this.op2 = new Uint32Array(size);
    }

    public internString(str: string): number {
        let id = this.stringIds.get(str) as number;
        if (id != null) {
            return id;
        }

        this.stringIds.set(str, this.strings.length);
        this.strings.push(str);
        return this.strings.length - 1;
    }

    resolveString(id: number): string {
        return this.strings[id];
    }
}
