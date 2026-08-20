import { memoize } from "../parser/utils/cache.ts";

/**
 * match url
 */
export const matchUrl: RegExp = /^(https?:)?\/\//;

/**
 * return the directory name of a path
 * @param path
 *
 * @private
 */
export function dirname(path: string): string {
    if (path === "") {
        return "";
    }

    if (path.startsWith("data:")) {
        return path;
    }

    let i: number = 0;

    let parts: string[] = [""];

    for (; i < path.length; i++) {
        const chr: string = path.charAt(i);

        if (chr == "/") {
            parts.push("");
        } else {
            parts[parts.length - 1] += chr;
        }
    }

    parts.pop();

    return parts.join("/");
}

/**
 * split path
 * @param result
 * @private
 */
function splitPath(result: string): { i: number; parts: string[] } {
    if (result.length == 0) {
        return { parts: [], i: 0 };
    }

    const parts: string[] = result == "/" ? [] : [""];
    let i: number = 0;

    for (; i < result.length; i++) {
        const chr: string = result.charAt(i);

        if (chr == "/") {
            parts.push("");
        }
        // else if (chr == "?" || chr == "#") {
        //     break;
        // }
        else {
            parts[parts.length - 1] += chr;
        }
    }

    // let k: number = -1;

    // while (++k < parts.length) {
    //     if (parts[k] == ".") {
    //         parts.splice(k--, 1);
    //     } else if (parts[k] == "..") {
    //         parts.splice(k - 1, 2);
    //         k -= 2;
    //     }
    // }

    return { parts, i };
}

/**
 * Nomalize path
 * @param path
 * @private
 */
export const normalize = memoize(function (path: string) {
    let parts: string[] = [];
    let i: number = 0;

    if (path.includes("\\")) {
        path = path.replace(/(\\)/g, "/");
    }

    for (; i < path.length; i++) {
        const chr: string = path.charAt(i);

        if (chr == "/") {
            if (parts.length == 0 || parts[parts.length - 1] !== "") {
                parts.push("");
            }
        } else if (chr == "?" || chr == "#") {
            break;
        } else {
            if (parts.length == 0) {
                parts.push("");
            }

            parts[parts.length - 1] += chr;
        }
    }

    let k: number = -1;

    while (++k < parts.length) {
        // if (parts[k] == ".") {
        //     parts.splice(k--, 1);
        // } else
        if (k > 0 && parts[k] == "..") {
            parts.splice(k - 1, 2);
            k -= 2;
        }
    }

    return (path.charAt(0) == "/" ? "/" : "") + parts.join("/");
});

/**
 * diff path
 * @param path1
 * @param path2
 * @private
 */
export const diff = memoize(function (path1: string, path2: string) {
    let { parts } = splitPath(path1);
    const { parts: dirs } = splitPath(path2);

    for (const p of dirs) {
        if (parts[0] == p) {
            parts.shift();
        } else {
            parts.unshift("..");
        }
    }

    return parts.join("/");
});

/**
 * resolve path
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
export const resolve = memoize(function (
    url: string,
    currentDirectory: string,
    cwd?: string,
): { absolute: string; relative: string } {
    if (matchUrl.test(url)) {
        return {
            absolute: url,
            relative: url,
        };
    }

    cwd ??= "";
    currentDirectory ??= "";

    url = normalize(url);

    if (cwd !== "") {
        cwd = normalize(cwd);
    }

    if (currentDirectory !== "") {
        currentDirectory = normalize(currentDirectory);
    }

    const dir = cwd || currentDirectory;
    const absolute =
        dir == "" || url.startsWith("/") || url.match(/^[a-zA-Z]:/) ? resolvePath(url) : resolvePath(dir, url);

    return {
        absolute,
        relative: dir === "" ? absolute : diff(absolute, dir),
    };
}) as (url: string, currentDirectory?: string, cwd?: string) => { absolute: string; relative: string };

/**
 *
 * @param parts
 * @returns
 * @private
 */
function resolvePath(...parts: string[]): string {
    const path = parts.filter(Boolean).join("/");
    const isAbsolute: boolean = /^[\\/]/.test(path);
    const segments: string[] = path.split(/[\\/]+/);
    const resolved: string[] = [];

    for (const segment of segments) {
        if (!segment || segment === ".") {
            continue;
        }

        if (segment === "..") {
            if (resolved.length && resolved[resolved.length - 1] !== "..") {
                resolved.pop();
            } else if (!isAbsolute) {
                resolved.push("..");
            }
        } else {
            resolved.push(segment);
        }
    }

    let result = resolved.join("/");

    if (isAbsolute) {
        result = "/" + result;
    }

    return result || (isAbsolute ? "/" : ".");
}
