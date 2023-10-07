import { encode } from './lib/encode.js';

class SourceMap {
    #version = 3;
    #sources = [];
    #map = new Map;
    #line = -1;
    lastLocation = null;
    add(source, original) {
        if (original.src !== '') {
            if (!this.#sources.includes(original.src)) {
                this.#sources.push(original.src);
            }
            const line = source.sta.lin - 1;
            let record;
            if (line > this.#line) {
                this.#line = line;
            }
            if (!this.#map.has(line)) {
                record = [Math.max(0, source.sta.col - 1), this.#sources.indexOf(original.src), original.sta.lin - 1, original.sta.col - 1];
                this.#map.set(line, [record]);
            }
            else {
                const arr = this.#map.get(line);
                record = [Math.max(0, source.sta.col - 1 - arr[0][0]), this.#sources.indexOf(original.src) - arr[0][1], original.sta.lin - 1, original.sta.col - 1];
                arr.push(record);
            }
            if (this.lastLocation != null) {
                record[2] -= this.lastLocation.sta.lin - 1;
                record[3] -= this.lastLocation.sta.col - 1;
            }
            this.lastLocation = original;
        }
    }
    toUrl() {
        // sourceMappingURL = ${url}
        return `data:application/json,${encodeURIComponent(JSON.stringify(this.toJSON()))}`;
    }
    toJSON() {
        const mappings = [];
        let i = 0;
        for (; i <= this.#line; i++) {
            if (!this.#map.has(i)) {
                mappings.push('');
            }
            else {
                mappings.push(this.#map.get(i).reduce((acc, curr) => acc + (acc === '' ? '' : ',') + encode(curr), ''));
            }
        }
        return {
            version: this.#version,
            sources: this.#sources.slice(),
            mappings: mappings.join(';')
        };
    }
}

export { SourceMap };
