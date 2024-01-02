class IterableWeakMap {
    #map;
    #set;
    constructor(iterable) {
        this.#map = new WeakMap;
        this.#set = new Set;
        if (iterable) {
            for (const [key, value] of iterable) {
                const ref = new WeakRef(key);
                this.#set.add(ref);
                this.#map.set(key, value);
            }
        }
    }
    has(key) {
        return this.#map.has(key);
    }
    set(key, value) {
        if (!this.#map.has(key)) {
            this.#set.add(new WeakRef(key));
        }
        this.#map.set(key, value);
        return this;
    }
    get(key) {
        return this.#map.get(key);
    }
    delete(key) {
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
    *[Symbol.iterator]() {
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

export { IterableWeakMap };
