export declare const matchUrl: RegExp;
export declare function dirname(path: string): string;
export declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};
