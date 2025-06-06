import type {Location, SourceMapObject} from "../../../@types/index.d.ts";
import {encode} from "./lib/index.ts";

export class SourceMap {

    lastLocation: Location | null = null;
    #version: number = 3;
    #sources: string[] = [];
    #map: Map<number, number[][]> = new Map;
    #line: number = -1;

    add(source: Location, original: Location) {

        if (original.src !== '') {

            if (!this.#sources.includes(original.src)) {

                this.#sources.push(original.src);
            }

            const line = source.sta.lin - 1;
            let record: number[];

            if (line > this.#line) {

                this.#line = line;
            }

            if (!this.#map.has(line)) {

                 record = [Math.max(0, source.sta.col - 1), this.#sources.indexOf(original.src), original.sta.lin - 1, original.sta.col - 1];

                this.#map.set(line, [record]);
            }
            else {

                const arr: number[][] = <number[][]> this.#map.get(line);

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

    toUrl(): string {

        // /*# sourceMappingURL = ${url} */
        return `data:application/json,${encodeURIComponent(JSON.stringify(this.toJSON()))}`;
    }

    toJSON(): SourceMapObject
    {

        const mappings: string[] = [];

        let i: number = 0;

        for (; i <= this.#line; i++) {

            if (!this.#map.has(i)) {

                mappings.push('');
            }

            else {

                mappings.push((<number[][]>this.#map.get(i)).reduce((acc, curr) => acc + (acc === '' ? '' : ',') + encode(curr), ''))
            }
        }

        return {

            version: this.#version,
            sources: this.#sources.slice(),
            mappings: mappings.join(';')
        }
    }
}