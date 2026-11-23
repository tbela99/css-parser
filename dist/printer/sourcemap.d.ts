import type { SourceMapObject } from "../@types/index.js";
/**
 * Generate and parse source map
 *
 * ```ts
 * const sourcemap = new SourceMap();
 *
 * // you can also pass an input sourcemap
 * // const sourcemap = new SourceMap(sourcemapObjectOrJSONString);
 *
 * sourcemap.addSourceContent(0, '/css/styles.css', null);
 * sourcemap.addSourceContent(1, '/css/typography.css', null);
 *
 * const maps = [];
 *
 * maps.add([
     1, 1, 0, 1, 1]);
 * maps.add([
     2, 1, 1, 1, 1
 ]);

    sourcemap.add(maps);

    // convert to inline sourcemap
    sourcemap.toUrl();

    // convert to JSON
    sourcemap.toJSON();

    // find the original file, line and column
    sourcemap.find(2, 1);
    ```
 */
export declare class SourceMap {
    /**
     *
     * @private
     */
    private keys;
    /**
     * Last location
     */
    private lastLocation;
    /**
     * Version
     * @private
     */
    private version;
    /**
     * Sources map
     * @private
     */
    private sourcesMap;
    /**
     * Sources content
     * @private
     */
    private readonly sourcesContent;
    /**
     * Sources
     * @private
     */
    private readonly sources;
    /**
     * Map
     * @private
     *
     */
    private map;
    /**
     * Map
     * @private
     *
     */
    private reverseMap;
    /**
     * Line
     * @private
     */
    private line;
    /**
     * Constructor
     */
    constructor();
    /**
     * Constructor
     * @param sourcemaps
     */
    constructor(sourcemaps: string | SourceMapObject);
    /**
     * add source
     * @param id source id
     * @param fileName source file
     * @param content source content
     * @returns
     */
    addSourceContent(id: number, fileName: string | null, content: string | null): void;
    /**
     * Add multiple sourcemaps
     * @param maps
     * @throws
     */
    add(maps: Array<[newLine: number, newColumn: number, srcId: number, ln: number, col: number]>): void;
    /**
     * compute original positions
     */
    computePositions(): void;
    /**
     * retrieve original sources, lines and columns
     * @param line generated line
     * @param column generated column
     */
    find(line: number, column: number): Array<[string | null, number, number, string | null]> | null;
    /**
     * Convert to URL encoded string
     */
    toUrl(): string;
    /**
     * Convert to JSON object
     */
    toJSON(): SourceMapObject;
}
