import type { Location, SourceMapObject } from "../../../@types/index.d.ts";
/**
 * Source map class
 * @internal
 */
export declare class SourceMap {
    #private;
    /**
     * Last location
     */
    lastLocation: Location | null;
    /**
     * Add a location
     * @param source
     * @param original
     */
    add(source: Location, original: Location): void;
    /**
     * Convert to URL encoded string
     */
    toUrl(): string;
    /**
     * Convert to JSON object
     */
    toJSON(): SourceMapObject;
}
