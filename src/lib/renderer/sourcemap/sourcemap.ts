import type { SourceMapObject } from "../../../@types/index.d.ts";
import { encode } from "./lib/encode.ts";

/**
 * Source map class
 * @internal
 */
export class SourceMap {
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
     * Sources
     * @private
     */
    private sources: Array<string | null> = [];

    /**
     * Map
     * @private
     */
    private map: Map<number, number[][]> = new Map();
    /**
     * Line
     * @private
     */
    private line: number = -1;

    /**
     * Add a location
     * @param source
     * @param original
     */
    add(
        newLine: number,
        newColumn: number,
        srcId: number,
        ln: number,
        col: number,
        sourceFileName: string,
        sourceContent: string,
    ) {
        if (!this.sourcesMap.includes(srcId)) {
            if (sourceFileName == null && sourceContent != null) {
                sourceFileName = "data:text/css;charset=utf-8;base64," + btoa(sourceContent);
            }

            this.sourcesMap.push(srcId);
            this.sources.push((sourceFileName as string) || null);
        }

        const line = newLine - 1;
        let record: number[];

        if (line > this.line) {
            this.line = line;
        }

        if (!this.map.has(line)) {
            record = [Math.max(0, newColumn - 1), this.sourcesMap.indexOf(srcId), ln - 1, col - 1];

            this.map.set(line, [record]);
        } else {
            const arr: number[][] = <number[][]>this.map.get(line);

            record = [
                Math.max(0, newColumn - 1 - arr[0][0]),
                this.sourcesMap.indexOf(srcId) - arr[0][1],
                ln - 1,
                col - 1,
            ];
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
            mappings: mappings.join(";"),
        };
    }
}
