import { Location, SourceMapObject } from "../../../@types";
export declare class SourceMap {
    #private;
    lastLocation: Location | null;
    add(source: Location, original: Location): void;
    toUrl(): string;
    toJSON(): SourceMapObject;
}
