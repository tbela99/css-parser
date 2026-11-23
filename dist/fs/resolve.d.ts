/**
 * match url
 */
export declare const matchUrl: RegExp;
/**
 * return the directory name of a path
 * @param path
 *
 * @private
 */
export declare function dirname(path: string): string;
/**
 * Normalize path
 * @param path
 * @private
 */
export declare const normalize: (...args: any[]) => any;
/**
 * diff path
 * @param path1
 * @param path2
 * @private
 */
export declare const diff: (...args: any[]) => any;
/**
 * resolve path
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
export declare const resolve: (url: string, currentDirectory?: string, cwd?: string) => {
    absolute: string;
    relative: string;
};
