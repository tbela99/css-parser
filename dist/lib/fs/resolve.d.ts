export declare const matchUrl: RegExp;
/**
 * return the directory name of a path
 * @param path
 *
 * @private
 */
export declare function dirname(path: string): string;
/**
 * resolve path
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
export declare function resolve(url: string, currentDirectory: string, cwd?: string): {
    absolute: string;
    relative: string;
};
