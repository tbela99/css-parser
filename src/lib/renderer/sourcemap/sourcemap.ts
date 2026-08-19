import type { SourceMapObject } from "../../../@types/index.d.ts";
import { decode, encode } from "./lib/codec.ts";

/**
 * Generate and parse source map
 */
export class SourceMap {
    /**
     *
     * @private
     */
    private keys: Set<string> = new Set();

    /**
     * Last location
     */
    private lastLocation: { ln: number; col: number } | null = null;
    /**
     * Version
     * @private
     */
    private version: number = 3;

    /**
     * Sources map
     * @private
     */
    private sourcesMap: number[] = [];

    /**
     * Sources content
     * @private
     */
    private readonly sourcesContent: Array<string | null> = [];

    /**
     * Sources
     * @private
     */
    private readonly sources: Array<string | null> = [];

    /**
     * Map
     * @private
     *
     */
    private map: Map<number, number[][]> = new Map();

    /**
     * Map
     * @private
     *
     */
    private reverseMap: Map<number, number[][]> = new Map();

    /**
     * Line
     * @private
     */
    private line: number = -1;

    /**
     *
     */
    constructor();
    /**
     *
     * @param sourcemaps
     */
    constructor(sourcemaps: string | SourceMapObject);
    /**
     *
     * @param sourcemaps
     * @private
     */
    constructor(sourcemaps?: SourceMapObject | string) {
        if (typeof sourcemaps === "string") {
            sourcemaps = JSON.parse(sourcemaps) as SourceMapObject;
        }

        if (sourcemaps != null) {
            this.sources = sourcemaps.sources?.slice() ?? [];
            this.sourcesContent = sourcemaps.sourcesContent?.slice() ?? [];
            const decodedMappings = sourcemaps.mappings
                .split(";")
                .map((mapping) => mapping.split(",").map((mapping) => decode(mapping))) as number[][][];

            this.line = decodedMappings.length - 1;

            for (let index = 0; index < decodedMappings.length; index++) {
                if (
                    decodedMappings[index].length == 0 ||
                    (decodedMappings[index].length == 1 && decodedMappings[index][0].length == 0)
                ) {
                    continue;
                }

                this.map.set(index, decodedMappings[index]);
            }

            this.computePositions();
        }
    }

    hasSourceContent(id: number): boolean {
        return this.sourcesMap.includes(id);
    }

    addSourceContent(id: number, fileName: string | null, content: string | null): void {
        if (this.sourcesMap.includes(id)) {
            return;
        }

        this.sourcesMap[this.sourcesMap.length] = id;
        this.sources[this.sources.length] = fileName || null;
        this.sourcesContent[this.sourcesContent.length] = content || null;
    }

    /**
     * Add all location
     * @param maps
     * @throws
     */
    addAll(maps: Array<[number, number, number, number, number]>): void {
        let srcIndex: number;
        for (let [newLine, newColumn, srcId, ln, col] of maps) {
            const key = `${srcId}:${ln}:${col}:${newLine}:${newColumn}`;

            if (this.keys.has(key)) {
                continue;
            }

            this.keys.add(key);

            const line: number = newLine - 1;
            let record: number[];

            if (line > this.line) {
                this.line = line;
            }

            srcIndex = this.sourcesMap.indexOf(srcId);

            if (srcIndex == -1) {
                throw new Error(`Source file ${srcId} not added to sourcemap`);
            }

            if (!this.map.has(line)) {
                record = [Math.max(0, newColumn - 1), srcIndex, ln - 1, col - 1];

                this.map.set(line, [record]);
            } else {
                const arr: number[][] = this.map.get(line) as number[][];

                record = [Math.max(0, newColumn - 1) - arr[0][0], srcIndex - arr[0][1], ln - 1, col - 1];
                arr.push(record);
            }

            if (this.lastLocation != null) {
                record[2] -= this.lastLocation.ln - 1;
                record[3] -= this.lastLocation.col - 1;
            }

            this.lastLocation ??= { ln, col };
            this.lastLocation.ln = ln;
            this.lastLocation.col = col;
        }
    }

    /**
     * compute original positions
     */
    computePositions(): void {
        this.reverseMap.clear();
        let sourceFileIndex: number = 0; // second field
        let sourceCodeLine: number = 0; // third field
        let sourceCodeColumn: number = 0; // fourth field
        let nameIndex: number = 0; // fifth field
        let generatedCodeColumn: number;
        let result: number[];

        // mappings to original source
        for (let [i, line] of this.map.entries()) {
            if (line.length === 0 || (line.length === 1 && line[0].length === 0)) {
                continue;
            }

            generatedCodeColumn = line[0][0]; // first field - reset each time

            line = line
                .map((segment: number[], index: number, array: number[][]) => {
                    if (segment.length === 0) {
                        return [];
                    }

                    generatedCodeColumn = index == 0 ? segment[0] : segment[0] + array[0][0];

                    result = [generatedCodeColumn];

                    if (segment.length <= 1) {
                        return result;
                    }

                    sourceFileIndex = index == 0 ? segment[1] : segment[1] + array[0][1];
                    sourceCodeLine += segment[2];
                    sourceCodeColumn += segment[3];

                    result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn);

                    if (segment.length === 5) {
                        nameIndex += segment[4];
                        result.push(nameIndex);
                    }

                    return result;
                })
                .sort((a, b) => {
                    if (a[1] !== b[1]) {
                        return a[1] - b[1];
                    }

                    return a[0] - b[0];
                });

            if (line.length == 0 || (line.length == 1 && line[0].length == 0)) {
                continue;
            }

            this.reverseMap.set(i, line);
        }
    }

    /**
     * retrieve original sources, lines and columns
     * @param line generated line
     * @param column generated column
     */
    find(line: number, column: number): Array<[string | null, number, number, string | null]> | null {
        if (!this.reverseMap.has(--line)) {
            return null;
        }

        column--;
        const result: Array<[string | null, number, number, string | null]> = [];

        for (const record of this.reverseMap.get(line)!) {
            if (record.length == 0 || record[0] < column) {
                continue;
            }
            if (record[0] > column) {
                break;
            }

            result.push([
                this.sources?.[record[1]] ?? null,
                record[2] + 1,
                record[3] + 1,
                this.sourcesContent?.[record[1]] ?? null,
            ]);
        }

        return result.length == 0 ? null : result;
    }

    /**
     * Convert to URL encoded string
     */
    toUrl(): string {
        // /*# sourceMappingURL = ${url} */
        return `data:application/json;charset=utf-8;base64,${btoa(JSON.stringify(this.toJSON()))}`;
    }

    /**
     * Convert to JSON object
     */
    toJSON(): SourceMapObject {
        const mappings: string[] = [];

        let i: number = 0;

        for (; i <= this.line; i++) {
            if (!this.map.has(i)) {
                mappings.push("");
            } else {
                mappings.push(
                    (<number[][]>this.map.get(i)).reduce(
                        (acc, curr) => acc + (acc === "" ? "" : ",") + encode(curr),
                        "",
                    ),
                );
            }
        }

        return {
            version: this.version,
            sources: this.sources.slice(),
            sourcesContent: this.sourcesContent?.slice(),
            mappings: mappings.join(";"),
        };
    }

    /**
     * to string
     */
    toString(): string {
        return JSON.stringify(this);
    }
}
