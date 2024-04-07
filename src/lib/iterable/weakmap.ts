export class IterableWeakMap<K, V> {

    #map: WeakMap<any, V>;
    #set: Set<WeakRef<any>>;

    constructor(iterable?: Iterable<[any, V]>) {

        this.#map = new WeakMap;
        this.#set = new Set;

        if (iterable) {
            for (const [key, value] of iterable) {

                const ref: WeakRef<any> = new WeakRef(key);
                this.#set.add(ref);
                this.#map.set(key, value);
            }
        }
    }

    has(key: any): boolean {

        return this.#map.has(key);
    }

    set(key: any, value: V): this {

        if (!this.#map.has(key)) {

            this.#set.add(new WeakRef(key));
        }

        this.#map.set(key, value);
        return this;
    }

    get(key: any): V | undefined {

        return this.#map.get(key);
    }

    delete(key: any): boolean {

        if (this.#map.has(key)) {

            for (const ref of this.#set) {

                if (ref.deref() === key) {

                    this.#set.delete(ref);
                    break;
                }
            }

            return this.#map.delete(key);
        }

        return false;
    }

    * keys(): IterableIterator<V> {

        for (const ref of new Set(this.#set)) {

            const key = ref.deref();

            if (key == null) {

                this.#set.delete(ref);
                continue;
            }

            // @ts-ignore
            yield key;
        }
    }

    * values(): IterableIterator<V> {

        for (const ref of new Set(this.#set)) {

            const key = ref.deref();

            if (key == null) {

                this.#set.delete(ref);
                continue;
            }

            // @ts-ignore
            yield this.#map.get(key);
        }
    }

    * [Symbol.iterator](): IterableIterator<[K, V]> {

        for (const ref of new Set(this.#set)) {

            const key = ref.deref();

            if (key == null) {

                this.#set.delete(ref);
                continue;
            }

            // @ts-ignore
            yield [key, this.#map.get(key)];
        }
    }
}