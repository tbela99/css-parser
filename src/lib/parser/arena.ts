import {
    ErrorDescription,
    WalkerEvent,
    WalkerFilter,
    WalkerOption,
    WalkerOptionEnum,
    WalkerOptions,
    WalkerValueFilter,
} from "../../node.ts";
import { EnumAstNodeStatus, EnumToken } from "../ast/types.ts";
import { PARENT } from "../syntax/constants.ts";
import { equalsIgnoreCase } from "./utils/text.ts";

export class Arena {
    public stringIds: Map<string, number> = new Map();
    public strings: string[] = [];
    public readonly root: number = 1;
    public current: number = 1;

    public dataTypes: Uint8Array;
    public parents: Uint32Array;
    public nextSibling: Uint32Array;
    public previousSibling: Uint32Array;
    public firstToken: Uint32Array;
    public lastToken: Uint32Array;
    public firstChild: Uint32Array;
    public lastChild: Uint32Array;
    public name: Uint32Array;
    public stringValue: Uint32Array;
    public numericValue: Float64Array;
    public unit: Uint32Array;
    public flags: Uint32Array;
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
     * rendered tokens cache
     */
    public renderedTokens: Uint32Array;

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
        // this.left = new Uint32Array(size);
        // this.right = new Uint32Array(size);
        // this.op = new Uint32Array(size);
        // this.op2 = new Uint32Array(size);
        this.renderedTokens = new Uint32Array(size);
        this.colorType = new Uint8Array(size);
        this.spans = new BigUint64Array(size);

        this.dataTypes[this.root] = EnumToken.StyleSheetNodeType;
    }

    public allocate(): number {
        const id = ++this.current;
        if (this.current >= this.dataTypes.length) {
            this.resize(this.dataTypes.length * 2);
        }
        return id;
    }

    // Interns a string and returns its unique ID. If the string has already been interned, it returns the existing ID.
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

    setFirstChild(id: number, firstChildId: number): void {
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

    getLastChild(id: number): number {
        return this.lastChild[id];
    }

    setLastChild(id: number, lastChildId: number): void {
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

    setNextSibling(id: number, nextSiblingId: number): void {
        this.detach(nextSiblingId);

        this.nextSibling[nextSiblingId] = this.nextSibling[id];
        this.nextSibling[id] = nextSiblingId;
        this.previousSibling[nextSiblingId] = id;
        this.parents[nextSiblingId] = this.parents[id];
    }

    setPreviousSibling(id: number, previousSiblingId: number): void {
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

    setFirstToken(id: number, firstTokenId: number): void {
        this.detach(firstTokenId);

        const firstToken = this.firstToken[id];

        this.previousSibling[firstTokenId] = 0;
        this.nextSibling[firstTokenId] = this.nextSibling[firstTokenId];
        this.parents[firstTokenId] = id;

        this.firstToken[id] = firstTokenId;

        this.detach(firstToken);
    }

    setColorType(id: number, colorType: number): void {
        this.colorType[id] = colorType;
    }

    setFlags(id: number, flags: number): void {
        this.flags[id] = flags;
    }

    getFlags(id: number): number {
        return this.flags[id];
    }

    // addFlags(id: number, flags: number): void {
    //     this.flags[id] |= flags;
    // }

    hasFlags(id: number, flag: number): boolean {
        return (this.flags[id] & flag) != 0;
    }

    getChildAt(id: number, index: number): number | null {
        let child = this.firstChild[id];

        while (index > 0 && child != 0) {
            child = this.nextSibling[child];
            index--;
        }

        return child == 0 ? null : child;
    }

    setChildAt(id: number, index: number, child: number): void {
        if (index == 0) {
            if (child != this.firstChild[id]) {
                this.detach(child);

                if (this.firstChild[id] != 0) {
                    this.nextSibling[child] = this.nextSibling[this.firstChild[id]];
                    this.previousSibling[this.nextSibling[this.firstChild[id]]] = child;
                }

                if (this.lastChild[id] == this.firstChild[id]) {
                    this.lastChild[id] = child;
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
        } else {
            // prepend
            this.previousSibling[child] = this.previousSibling[currentChild];
            this.nextSibling[child] = this.nextSibling[currentChild];

            this.nextSibling[this.previousSibling[currentChild]] = child;
            this.previousSibling[currentChild] = child;

            this.previousSibling[currentChild] = 0;
            this.nextSibling[currentChild] = 0;
            this.parents[currentChild] = 0;
        }

        if(currentChild == this.lastChild[id]){
            this.lastChild[id] = child;
        }

        this.parents[child] = id;
    }

    /**
     * let child should be of type EnumToken.ListToken or EnumToken.ParensToken
     * @param id
     * @param child
     */
    setLeft(id: number, ...children: number[]): void {

        let child = this.firstChild[id];

        if(child !=0 &&this.dataTypes[child]!= EnumToken.ListTokenType){ 
            
            this.detach(child);
            child = this.allocate();
            this.dataTypes[child] = EnumToken.ListTokenType;
        }

        this.setChildren(child, ...children);
        this.setChildAt(id, 0, child);
    }


    getLeft(id: number): number[] | null {

        const child = this.getChildAt(id, 0);

        if(child == null){
            return null;
        }

        return this.children(child);
    }

    setRight(id: number, rightId: null): void;

    setRight(id: number, ...rightId: number[] ): void;

    setRight(id: number, ...rightId: number[] | [null]): void {

        let child = this.getChildAt(id, 1);

        if (child == null || this.dataTypes[child] != EnumToken.ListTokenType) {

            if (child != null) {
                this.detach(child);
            }

            child = this.allocate();
            this.dataTypes[child] = EnumToken.ListTokenType;
            this.setChildAt(id, 1, child);
        }

        this.setChildren(child, ...(rightId == null || rightId[0] == null ? [] : rightId as number[]));
        this.setChildAt(id, 1, child);
    }

    getRight(id: number): number[] | null {

        const child = this.getChildAt(id, 1);

        if(child == null){
            return null;
        }

        return this.children(child);
    }

    setOp(id: number, opId: number): void {
        this.setChildAt(id, 2, opId);
    }

    getOp(id: number): number {
        return this.getChildAt(id, 2) as number;
    }

    setOp2(id: number, op2Id: number): void {
        this.setChildAt(id, 3, op2Id);
    }

    getOp2(id: number): number {
        return this.getChildAt(id, 3) as number;
    }

    setRenderedTokens(id: number, renderedTokensId: number): void {
        this.renderedTokens[id] = renderedTokensId;
    }

    public setSpan(id: number, sourceId: number, start: number, end: number): void {
        this.spans[id] = BigInt(((sourceId & 0xff) << 56) | ((start & 0xfffffff) << 28) | (end & 0xfffffff));
    }

    public getSourceId(id: number): number {
        return Number((this.spans[id] >> 56n) & 0xffn);
    }

    public getSpanStart(id: number): number {
        return Number((this.spans[id] >> 28n) & 0xfffffffn);
    }

    setSpandStart(id: number, start: number): void {
        this.spans[id] =
            BigInt((this.getSourceId(id) & 0xff) << 56) |
            BigInt((start & 0xfffffff) << 28) |
            BigInt(this.getSpanEnd(id) & 0xfffffff);
    }

    public getSpanEnd(id: number): number {
        return Number(this.spans[id] & 0xfffffffn);
    }

    public setSpanEnd(id: number, end: number): void {
        this.spans[id] =
            BigInt((this.getSourceId(id) & 0xff) << 56) |
            BigInt((this.getSpanStart(id) & 0xfffffff) << 28) |
            BigInt(end & 0xfffffff);
    }

    getParent(id: number): number {
        return this.parents[id];
    }

    public resolveString(id: number): string {
        return this.strings[id];
    }

    detach(id: number): void {
        let parent = this.parents[id];

        if (this.lastChild[parent] == id) {
            this.lastChild[parent] = this.previousSibling[id];
        }

        if (this.nextSibling[id] != 0) {
            // first child
            if (this.previousSibling[id] == 0) {
                this.firstChild[parent] = this.nextSibling[id];
            } else {
                // not first child
                this.nextSibling[this.previousSibling[id]] = this.nextSibling[id];
            }
        }

        this.nextSibling[id] = 0;
        this.previousSibling[id] = 0;
        this.parents[id] = 0;
    }

    *walk(node: number, filter?: WalkerFilter | WalkerOptions | null, reverse?: boolean): Generator<number> {
        const parents: number[] = [node];

        let options: WalkerOptions | null = filter as WalkerOptions | null;
        let isNumeric: boolean = false;
        let children: boolean = true;
        let attributes: boolean = false;
        let i: number = 0;
        let firstChild: number;

        if (options != null && typeof options == "object") {
            filter = options.filter as WalkerFilter;
            reverse = options.reverse;
            attributes = options.attributes as boolean;
            children = (options.children as boolean) ?? true;
        }

        while ((node = parents[i++])) {
            let option: WalkerOption = null;

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

            if (
                children &&
                this.flags[node] & EnumAstNodeStatus.HasChildren &&
                (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0)
            ) {
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
        const stack: number[] = values.slice();

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
        let i: number = -1;
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
                const isValid: boolean =
                    filter.type == null ||
                    this.dataTypes[value] == filter.type ||
                    (Array.isArray(filter.type) && filter.type.includes(this.dataTypes[value])) ||
                    (typeof filter.type == "function" && filter.type(value));

                if (isValid) {
                    option = filter.fn(value, WalkerEvent.Enter);

                    isNumeric = typeof option == "number";

                    if (isNumeric && (option as number) & WalkerOptionEnum.Stop) {
                        return;
                    }

                    if (isNumeric && (option as number) & WalkerOptionEnum.Ignore) {
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

            if (!isNumeric || ((option as number) & WalkerOptionEnum.IgnoreChildren) === 0) {
                if (this.flags[value] & EnumAstNodeStatus.HasChildren) {
                    for (const child of this.children(value)) {
                        if (reverse) {
                            stack.unshift(child);
                        } else {
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
                const isValid: boolean =
                    filter.type == null ||
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

    siblings(id: number): number[] {
        let siblings: number[] = [];
        let child = this.firstChild[this.parents[id]];
        while (child != 0) {
            siblings.push(child);
            child = this.nextSibling[child];
        }
        return siblings;
    }

    children(id: number): number[] {
        let children: number[] = [];
        let child = this.firstChild[id];
        while (child != 0) {
            children.push(child);
            child = this.nextSibling[child];
        }
        return children;
    }

    setChildren(id: number, ...children: number[]): void {
        if (this.lastChild[id] != 0) {
            this.lastChild[id] = 0;
        }

        if (this.firstChild[id] != 0) {
            this.detach(this.firstChild[id]);
        }

        this.appendChildren(id, ...children);
    }

    setTokens(id: number, ...children: number[]): void {
        if (this.lastToken[id] != 0) {
            this.lastToken[id] = 0;
        }

        if (this.firstToken[id] != 0) {
            this.detach(this.firstToken[id]);
        }

        this.appendTokens(id, ...children);
    }

    appendChildren(id: number, ...children: number[]): void {
        if (children.length == 0) {
            return;
        }

        this.detach(children[0]);

        let lastChild: number = this.lastChild[id];

        if (lastChild == 0) {
            this.firstChild[id] = children[0];
        } else {
            this.nextSibling[lastChild] = children[0];
        }

        this.parents[children[0]] = id;

        for (let i = 1; i < children.length; i++) {
            this.detach(children[i]);
            this.previousSibling[children[i]] = children[i - 1];
            this.nextSibling[children[i - 1]] = children[i];
            this.parents[children[i]] = id;
        }

        this.lastChild[id] = children[children.length - 1];
    }

    appendTokens(id: number, ...children: number[]): void {
        if (children.length == 0) {
            return;
        }

        this.detach(children[0]);

        let lastChild: number = this.lastToken[id];

        if (lastChild == 0) {
            this.firstToken[id] = children[0];
        } else {
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

    public equalsIgnoreCase(node: number, key: "nam" | "val", string: string): boolean {
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

    public startsWith(node: number, key: "nam" | "val", string: string): boolean {
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

    setErrors(id: number, errors: ErrorDescription[]) {
        this.errors.set(id, errors);
    }

    getErrors(id: number): ErrorDescription[] | null {
        return this.errors.get(id) ?? null;
    }
}
