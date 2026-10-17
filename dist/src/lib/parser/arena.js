/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../ast/types.js';
import { PARENT } from '../syntax/constants.js';
import { equalsIgnoreCase } from './utils/text.js';
import { WalkerOptionEnum, WalkerEvent } from '../ast/walk.js';

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
    lastToken;
    firstChild;
    lastChild;
    name;
    stringValue;
    numericValue;
    unit;
    flags;
    colorType;
    /**
     * token spans. 8 bits for source type. 28 bits for start position, 28 bits for end position. This allows us to store the start and end positions of tokens in a single 64-bit integer, which is more efficient than storing them separately.
     */
    spans;
    /**
     * error cache
     */
    errors = new Map();
    /**
     * rendered tokens cache
     */
    renderedTokens;
    constructor(size = 4096) {
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
        // this.left = new Uint32Array(size);
        // this.right = new Uint32Array(size);
        // this.op = new Uint32Array(size);
        // this.op2 = new Uint32Array(size);
        this.renderedTokens = new Uint32Array(size);
        this.colorType = new Uint8Array(size);
        this.spans = new BigUint64Array(size);
        this.dataTypes[this.root] = EnumToken.StyleSheetNodeType;
    }
    allocate() {
        const id = ++this.current;
        if (this.current >= this.dataTypes.length) {
            this.resize(this.dataTypes.length * 2);
        }
        return id;
    }
    // Interns a string and returns its unique ID. If the string has already been interned, it returns the existing ID.
    internString(str) {
        let id = this.stringIds.get(str);
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
     * @param args
     */
    set(id, ...args) {
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
    getType(id) {
        return this.dataTypes[id];
    }
    setType(id, type) {
        this.dataTypes[id] = type;
    }
    setName(id, nameId) {
        this.name[id] = nameId;
    }
    getName(id) {
        return this.strings[this.name[id]] ?? null;
    }
    setValue(id, valueId) {
        this.stringValue[id] = valueId;
    }
    getValue(id) {
        return this.strings[this.stringValue[id]] ?? null;
    }
    setNumericValue(id, numericValue) {
        this.numericValue[id] = numericValue;
    }
    setUnit(id, unit) {
        this.unit[id] = unit;
    }
    getUnit(id) {
        return this.strings[this.unit[id]] ?? null;
    }
    getNumericValue(id) {
        return this.numericValue[id];
    }
    setParent(id, parentId) {
        this.parents[id] = parentId;
    }
    getFirstChild(id) {
        return this.firstChild[id];
    }
    setFirstChild(id, firstChildId) {
        this.detach(firstChildId);
        const firstChild = this.firstChild[id];
        if (this.firstChild[id] != 0) {
            const nextSibling = this.nextSibling[firstChild];
            if (nextSibling != 0) {
                this.nextSibling[firstChildId] = nextSibling;
                this.previousSibling[nextSibling] = firstChildId;
            }
            this.detach(firstChild);
        }
        this.firstChild[id] = firstChildId;
        this.parents[firstChild] = id;
    }
    getLastChild(id) {
        return this.lastChild[id];
    }
    setLastChild(id, lastChildId) {
        this.detach(lastChildId);
        const lastChild = this.lastChild[id];
        if (lastChild != 0) {
            const previousSibling = this.previousSibling[lastChild];
            if (previousSibling != 0) {
                this.previousSibling[lastChildId] = previousSibling;
                this.nextSibling[previousSibling] = lastChildId;
            }
            this.detach(lastChild);
        }
        this.lastChild[id] = lastChildId;
        this.nextSibling[lastChildId] = 0;
        this.parents[lastChildId] = id;
    }
    setNextSibling(id, nextSiblingId) {
        this.detach(nextSiblingId);
        this.nextSibling[nextSiblingId] = this.nextSibling[id];
        this.nextSibling[id] = nextSiblingId;
        this.previousSibling[nextSiblingId] = id;
        this.parents[nextSiblingId] = this.parents[id];
    }
    setPreviousSibling(id, previousSiblingId) {
        this.detach(previousSiblingId);
        if (this.previousSibling[id] != 0) {
            const previousSibling = this.previousSibling[id];
            if (previousSibling != 0) {
                this.nextSibling[previousSibling] = previousSiblingId;
                this.previousSibling[previousSiblingId] = previousSibling;
            }
            this.nextSibling[previousSiblingId] = this.nextSibling[id];
        }
        this.previousSibling[id] = previousSiblingId;
        this.parents[previousSiblingId] = this.parents[id];
    }
    setFirstToken(id, firstTokenId) {
        this.detach(firstTokenId);
        const firstToken = this.firstToken[id];
        this.previousSibling[firstTokenId] = 0;
        this.nextSibling[firstTokenId] = this.nextSibling[firstTokenId];
        this.parents[firstTokenId] = id;
        this.firstToken[id] = firstTokenId;
        this.detach(firstToken);
    }
    setColorType(id, colorType) {
        this.colorType[id] = colorType;
    }
    setFlags(id, flags) {
        this.flags[id] = flags;
    }
    getFlags(id) {
        return this.flags[id];
    }
    hasFlags(id, flag) {
        return (this.flags[id] & flag) != 0;
    }
    getChildAt(id, index) {
        let child = this.firstChild[id];
        while (index > 0 && child != 0) {
            child = this.nextSibling[child];
            index--;
        }
        return child == 0 ? null : child;
    }
    setChildAt(id, index, child) {
        if (index == 0) {
            if (child != this.firstChild[id]) {
                this.detach(child);
                if (this.firstChild[id] != 0) {
                    this.nextSibling[child] = this.nextSibling[this.firstChild[id]];
                    this.previousSibling[this.nextSibling[this.firstChild[id]]] = child;
                }
                this.firstChild[id] = child;
                this.parents[child] = id;
            }
            return;
        }
        index--;
        let currentChild = this.firstChild[id];
        while (index > 0 && this.nextSibling[currentChild] != 0) {
            currentChild = this.nextSibling[currentChild];
            index--;
        }
        this.detach(child);
        if (index > 0) {
            // append
            this.nextSibling[currentChild] = child;
            this.previousSibling[child] = currentChild;
            this.nextSibling[child] = 0;
        }
        else {
            // prepend
            this.previousSibling[child] = this.previousSibling[currentChild];
            this.nextSibling[child] = this.nextSibling[currentChild];
            this.nextSibling[this.previousSibling[currentChild]] = child;
            this.previousSibling[currentChild] = child;
            this.previousSibling[currentChild] = 0;
            this.nextSibling[currentChild] = 0;
            this.parents[currentChild] = 0;
        }
        this.parents[child] = id;
    }
    /**
     * let child should be of type EnumToken.ListToken or EnumToken.ParensToken
     * @param id
     * @param child
     */
    setLeft(id, child) {
        this.setChildAt(id, 0, child);
    }
    getLeft(id) {
        return this.getChildAt(id, 0);
    }
    setRight(id, rightId) {
        this.setChildAt(id, 1, rightId);
    }
    getRight(id) {
        return this.getChildAt(id, 1);
    }
    setOp(id, opId) {
        this.setChildAt(id, 2, opId);
    }
    getOp(id) {
        return this.getChildAt(id, 2);
    }
    setOp2(id, op2Id) {
        this.setChildAt(id, 3, op2Id);
    }
    getOp2(id) {
        return this.getChildAt(id, 3);
    }
    setRenderedTokens(id, renderedTokensId) {
        this.renderedTokens[id] = renderedTokensId;
    }
    setSpan(id, sourceId, start, end) {
        this.spans[id] = BigInt(((sourceId & 0xff) << 56) | ((start & 0xfffffff) << 28) | (end & 0xfffffff));
    }
    getSourceId(id) {
        return Number((this.spans[id] >> 56n) & 0xffn);
    }
    getSpanStart(id) {
        return Number((this.spans[id] >> 28n) & 0xfffffffn);
    }
    setSpandStart(id, start) {
        this.spans[id] =
            BigInt((this.getSourceId(id) & 0xff) << 56) |
                BigInt((start & 0xfffffff) << 28) |
                BigInt(this.getSpanEnd(id) & 0xfffffff);
    }
    getSpanEnd(id) {
        return Number(this.spans[id] & 0xfffffffn);
    }
    setSpanEnd(id, end) {
        this.spans[id] =
            BigInt((this.getSourceId(id) & 0xff) << 56) |
                BigInt((this.getSpanStart(id) & 0xfffffff) << 28) |
                BigInt(end & 0xfffffff);
    }
    getParent(id) {
        return this.parents[id];
    }
    resolveString(id) {
        return this.strings[id];
    }
    detach(id) {
        let parent = this.parents[id];
        if (this.lastChild[parent] == id) {
            this.lastChild[parent] = this.previousSibling[id];
        }
        if (this.nextSibling[id] != 0) {
            // first child
            if (this.previousSibling[id] == 0) {
                this.firstChild[parent] = this.nextSibling[id];
            }
            else {
                // not first child
                this.nextSibling[this.previousSibling[id]] = this.nextSibling[id];
            }
        }
        this.nextSibling[id] = 0;
        this.previousSibling[id] = 0;
        this.parents[id] = 0;
    }
    *walk(node, filter, reverse) {
        const parents = [node];
        let options = filter;
        let isNumeric = false;
        let children = true;
        let attributes = false;
        let i = 0;
        let firstChild;
        if (options != null && typeof options == "object") {
            filter = options.filter;
            reverse = options.reverse;
            attributes = options.attributes;
            children = options.children ?? true;
        }
        while ((node = parents[i++])) {
            let option = null;
            if (filter != null) {
                // @ts-expect-error
                option = filter(node);
                isNumeric = typeof option == "number";
                if (isNumeric) {
                    if (option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                    if (option & WalkerOptionEnum.Stop) {
                        break;
                    }
                }
            }
            if (!isNumeric || (option & WalkerOptionEnum.Children) === 0) {
                yield node;
            }
            if (attributes) {
                firstChild =
                    this.flags[node] & EnumAstNodeStatus.HasValues ? this.firstChild[node] : this.firstToken[node];
                if (firstChild != 0) {
                    const siblings = this.siblings(firstChild);
                    parents.splice(i, 0, ...(reverse ? siblings.toReversed() : siblings));
                }
                // else if (this.flags[node] & EnumAstNodeStatus.HasValues) {
                // // @ts-expect-error
                // for (const val of node.val) {
                //     if (val[PARENT] != node) {
                //         val[PARENT] = node;
                //     }
                // }
                //     // @ts-expect-error
                //     parents.splice(i, 0, ...(reverse ? node.val.toReversed() : node.val));
                // }
            }
            if (children &&
                this.flags[node] & EnumAstNodeStatus.HasChildren &&
                (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0)) {
                firstChild = this.firstChild[node];
                if (firstChild != 0) {
                    const siblings = this.siblings(firstChild);
                    parents.splice(i, 0, ...(reverse ? siblings.toReversed() : siblings));
                }
                //  // @ts-expect-error
                // parents.splice(i, 0, ...(reverse ? node.chi!.toReversed() : node.chi));
                // for (const child of <AstNode[]>(<AstRuleList>node).chi) {
                //     if (child[PARENT] != node) {
                //         child[PARENT] = node;
                //     }
                // }
            }
        }
    }
    *walkValues(values, filter, reverse) {
        const stack = values.slice();
        if (filter != null && typeof filter == "function") {
            filter = {
                event: WalkerEvent.Enter,
                fn: filter,
            };
        }
        else if (filter == null) {
            filter = {
                event: WalkerEvent.Enter,
            };
        }
        let isNumeric = false;
        let value;
        let option;
        let i = -1;
        const eventType = filter.event ?? WalkerEvent.Enter;
        // @ts-ignore
        // const result = {
        //     value: null,
        //     parent: null,
        //     previousValue: null,
        //     nextValue: null,
        //     //
        //     root: root ?? null,
        //     parents: function* () {
        //         // @ts-ignore
        //         let result = node?.[PARENT] ?? root;
        //         while (result != null) {
        //             yield result;
        //             result = result[PARENT] ?? null;
        //         }
        //     },
        // } as WalkAttributesResult;
        while (++i < stack.length) {
            value = stack[i];
            option = null;
            if (filter.fn != null && eventType & WalkerEvent.Enter) {
                const isValid = filter.type == null ||
                    this.dataTypes[value] == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(this.dataTypes[value])) ||
                    (typeof filter.type == "function" && filter.type(value));
                if (isValid) {
                    option = filter.fn(value, WalkerEvent.Enter);
                    isNumeric = typeof option == "number";
                    if (isNumeric && option & WalkerOptionEnum.Stop) {
                        return;
                    }
                    if (isNumeric && option & WalkerOptionEnum.Ignore) {
                        continue;
                    }
                    //
                    if (option != null && Array.isArray(option)) {
                        // const op = Array.isArray(option) ? option : [option];
                        stack.splice(i, 0, ...(reverse ? option.toReversed() : option));
                    }
                }
            }
            yield value;
            if (!isNumeric || (option & WalkerOptionEnum.IgnoreChildren) === 0) {
                if (this.flags[value] & EnumAstNodeStatus.HasChildren) {
                    for (const child of this.children(value)) {
                        if (reverse) {
                            stack.unshift(child);
                        }
                        else {
                            stack.push(child);
                        }
                    }
                }
                // else {
                //     const values: Token[] = [];
                //     if ("l" in value && value.l != null) {
                //         // @ts-expect-error
                //         values.push(value.l);
                //         // @ts-expect-error
                //         if (value.l[PARENT] != value) {
                //             // @ts-expect-error
                //             value.l[PARENT] = value;
                //         }
                //     }
                //     if ("op" in value && typeof value.op == "object") {
                //         // @ts-expect-error
                //         values.push(value.op);
                //         // @ts-expect-error
                //         if (value.op[PARENT] != value) {
                //             // @ts-expect-error
                //             value.op[PARENT] = value;
                //         }
                //     }
                //     if ("r" in value && value.r != null) {
                //         if (Array.isArray(value.r)) {
                //             for (const r of value.r) {
                //                 //
                //                 values.push(r);
                //                 if (r[PARENT] != value) {
                //                     //
                //                     r[PARENT] = value;
                //                 }
                //             }
                //         } else {
                //             //
                //             values.push(value.r);
                //             if (value.r[PARENT] != value) {
                //                 //
                //                 value.r[PARENT] = value;
                //             }
                //         }
                //     }
                //     if (values.length > 0) {
                //         for (const v of values) {
                //             if (reverse) {
                //                 stack.unshift(v);
                //             } else {
                //                 stack.push(v);
                //             }
                //         }
                //     }
                // }
            }
            if (eventType & WalkerEvent.Leave && filter.fn != null) {
                const isValid = filter.type == null ||
                    this.dataTypes[value] == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(this.dataTypes[value])) ||
                    (typeof filter.type == "function" && filter.type(value));
                if (isValid) {
                    // @ts-ignore
                    option = filter.fn(value, value[PARENT], WalkerEvent.Leave);
                    // @ts-ignore
                    if (option != null && Array.isArray(option)) {
                        // const op = Array.isArray(option) ? option : [option];
                        stack.splice(i, 0, ...(reverse ? option.toReversed() : option));
                        // for (const o of op) {
                        //     if (o[PARENT] != value) {
                        //         o[PARENT] = value;
                        //     }
                        // }
                    }
                }
            }
        }
    }
    findChild(id, predicate) {
        let child = this.firstChild[id];
        while (child != 0) {
            if (predicate(child)) {
                return child;
            }
            child = this.nextSibling[child];
        }
        return null;
    }
    siblings(id) {
        let siblings = [];
        let child = this.firstChild[this.parents[id]];
        while (child != 0) {
            siblings.push(child);
            child = this.nextSibling[child];
        }
        return siblings;
    }
    children(id) {
        let children = [];
        let child = this.firstChild[id];
        while (child != 0) {
            children.push(child);
            child = this.nextSibling[child];
        }
        return children;
    }
    setChildren(id, ...children) {
        if (this.lastChild[id] != 0) {
            this.lastChild[id] = 0;
        }
        if (this.firstChild[id] != 0) {
            this.detach(this.firstChild[id]);
        }
        this.appendChildren(id, ...children);
    }
    setTokens(id, ...children) {
        if (this.lastToken[id] != 0) {
            this.lastToken[id] = 0;
        }
        if (this.firstToken[id] != 0) {
            this.detach(this.firstToken[id]);
        }
        this.appendTokens(id, ...children);
    }
    appendChildren(id, ...children) {
        if (children.length == 0) {
            return;
        }
        this.detach(children[0]);
        let lastChild = this.lastChild[id];
        if (lastChild == 0) {
            this.firstChild[id] = children[0];
        }
        else {
            this.nextSibling[lastChild] = children[0];
        }
        this.parents[children[0]] = id;
        for (let i = 1; i < children.length - 1; i++) {
            this.detach(children[i]);
            this.previousSibling[children[i]] = children[i - 1];
            this.nextSibling[children[i - 1]] = children[i];
            this.parents[children[i]] = id;
        }
        this.lastChild[id] = children[children.length - 1];
    }
    appendTokens(id, ...children) {
        if (children.length == 0) {
            return;
        }
        this.detach(children[0]);
        let lastChild = this.lastToken[id];
        if (lastChild == 0) {
            this.firstToken[id] = children[0];
        }
        else {
            this.nextSibling[lastChild] = children[0];
        }
        this.parents[children[0]] = id;
        for (let i = 1; i < children.length - 1; i++) {
            this.detach(children[i]);
            this.previousSibling[children[i]] = children[i - 1];
            this.nextSibling[children[i - 1]] = children[i];
            this.parents[children[i]] = id;
        }
        this.lastToken[id] = children[children.length - 1];
    }
    equalsIgnoreCase(node, key, string) {
        const stringId = this.stringIds.get(string);
        if (stringId == null) {
            return false;
        }
        const id = key == "nam" ? this.name[node] : this.stringValue[node];
        if (id == stringId) {
            return true;
        }
        if (string.length != this.strings[id].length) {
            return false;
        }
        return equalsIgnoreCase(this.strings[id], string);
    }
    startsWith(node, key, string) {
        const stringId = this.stringIds.get(string);
        if (stringId == null) {
            return false;
        }
        const id = key == "nam" ? this.name[node] : this.stringValue[node];
        if (id == stringId) {
            return true;
        }
        if (string.length != this.strings[id].length) {
            return false;
        }
        return this.strings[id].startsWith(string);
    }
    resize(newSize) {
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
        const newRenderedTokens = new Uint32Array(newSize);
        newRenderedTokens.set(this.renderedTokens);
        this.renderedTokens = newRenderedTokens;
        const newColorType = new Uint8Array(newSize);
        newColorType.set(this.colorType);
        this.colorType = newColorType;
        const newSpans = new BigUint64Array(newSize);
        newSpans.set(this.spans);
        this.spans = newSpans;
    }
    setErrors(id, errors) {
        this.errors.set(id, errors);
    }
    getErrors(id) {
        return this.errors.get(id) ?? null;
    }
}

export { Arena };
