class StringInterner {
    ids = new Map();
    strings = [""]; // 0 = invalid / empty
    /**
     * Returns the ID for the string, interning it if necessary.
     */
    intern(value) {
        const existing = this.ids.get(value);
        if (existing !== undefined) {
            return existing;
        }
        const id = this.strings.length;
        this.strings.push(value);
        this.ids.set(value, id);
        return id;
    }
    /**
     * Returns the original string.
     */
    resolve(id) {
        return this.strings[id];
    }
    /**
     * Returns true if the string has already been interned.
     */
    has(value) {
        return this.ids.has(value);
    }
    /**
     * Returns the ID without interning.
     */
    lookup(value) {
        return this.ids.get(value);
    }
    /**
     * Number of unique strings.
     */
    get size() {
        return this.strings.length - 1;
    }
    clear() {
        this.ids.clear();
        this.strings.length = 1;
    }
}

export { StringInterner };
