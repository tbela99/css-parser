
export class IterableWeakSet<T> {
    #weakset: WeakSet<any> = new WeakSet;
    #set: Set<WeakRef<any>> = new Set;
    constructor(iterable?: Iterable<any>) {

        if (iterable) {

            for (const value of iterable) {

                const ref: WeakRef<any> = new WeakRef(value);

                this.#weakset.add(value);
                this.#set.add(ref);
            }
        }
    }

    has(value: any): boolean {

        return this.#weakset.has(value);
    }

    delete(value: any): boolean {

        if (this.#weakset.has(value)) {

            for (const ref of this.#set) {

                if (ref.deref() === value) {

                    this.#set.delete(ref);
                    break;
                }
            }

            return this.#weakset.delete(value);
        }

        return false;
    }

    add(value: any): this {

        if (!this.#weakset.has(value)) {

            this.#weakset.add(value);
            this.#set.add(new WeakRef(value));
        }

        return this;
    }

    * [Symbol.iterator](): IterableIterator<any> {

        for (const ref of new Set(this.#set)) {

            const  key = ref.deref();

            if (key != null) {

                yield key;
            }

            else {

                this.#set.delete(ref);
            }
        }
    }
}