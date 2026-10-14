class Arena {
    stringIds = new Map();
    strings = [];
    root = 1;
    current = 1;
    dataTypes;
    parents;
    nextSibling;
    previousSibling;
    firstToken;
    firstChild;
    lastChild;
    name;
    stringValue;
    numericValue;
    unit;
    flags;
    left;
    right;
    op;
    op2;
    constructor(size = 1024) {
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
    internString(str) {
        let id = this.stringIds.get(str);
        if (id != null) {
            return id;
        }
        this.stringIds.set(str, this.strings.length);
        this.strings.push(str);
        return this.strings.length - 1;
    }
    resolveString(id) {
        return this.strings[id];
    }
}

export { Arena };
