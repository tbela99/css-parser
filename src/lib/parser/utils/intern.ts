
export class StringInterner {
    private readonly ids = new Map<string, number>();
    private readonly strings: string[] = [""]; // 0 = invalid / empty

    /**
     * Returns the ID for the string, interning it if necessary.
     */
    intern(value: string): number {
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
    resolve(id: number): string {
        return this.strings[id];
    }

    /**
     * Returns true if the string has already been interned.
     */
    has(value: string): boolean {
        return this.ids.has(value);
    }

    /**
     * Returns the ID without interning.
     */
    lookup(value: string): number | undefined {
        return this.ids.get(value);
    }

    /**
     * Number of unique strings.
     */
    get size(): number {
        return this.strings.length - 1;
    }

    clear(): void {
        this.ids.clear();
        this.strings.length = 1;
    }
}