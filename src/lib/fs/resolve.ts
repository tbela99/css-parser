export const matchUrl: RegExp = /^(https?:)?\/\//;

/**
 * return the directory name of a path
 * @param path
 */
export function dirname(path: string): string {

    if (path == '/' || path === '') {

        return path;
    }

    let i: number = 0;

    let parts: string[] = [''];

    for (; i < path.length; i++) {

        const chr: string = path.charAt(i);

        if (chr == '/') {

            parts.push('')
        } else if (chr == '?' || chr == '#') {

            break;
        } else {

            parts[parts.length - 1] += chr;
        }
    }

    parts.pop();

    return parts.length == 0 ? '/' : parts.join('/');
}

function splitPath(result: string): { i: number, parts: string[] } {

    const parts: string[] = [''];
    let i: number = 0;

    for (; i < result.length; i++) {

        const chr: string = result.charAt(i);

        if (chr == '/') {

            parts.push('');
        } else if (chr == '?' || chr == '#') {

            break;
        } else {

            parts[parts.length - 1] += chr;
        }
    }

    let k: number = -1;

    while (++k < parts.length) {

        if (parts[k] == '.') {
            parts.splice(k--, 1);
        } else if (parts[k] == '..') {
            parts.splice(k - 1, 2);
            k -= 2;
        }
    }

    return {parts, i};
}

/**
 * resolve path
 * @param url
 * @param currentDirectory
 * @param cwd
 */
export function resolve(url: string, currentDirectory: string, cwd?: string): { absolute: string; relative: string } {

    if (matchUrl.test(url)) {

        return {
            absolute: url,
            relative: url
        };
    }

    if (matchUrl.test(currentDirectory)) {

        const path = new URL(url, currentDirectory).href;

        return {
            absolute: path,
            relative: path
        }
    }

    let result: string = '';

    if (url.charAt(0) == '/') {

        result = url;
    } else if (currentDirectory.charAt(0) == '/') {

        result = dirname(currentDirectory) + '/' + url;
    }
    // else if (currentDirectory === '' || dirname(currentDirectory) === '') {
    //
    //     result = url;
    // } else {
    //
    //     result = dirname(currentDirectory) + '/' + url;
    // }

    let {parts, i} = splitPath(result);

    // if (parts.length == 0) {
    //
    //     const path = result.charAt(0) == '/' ? '/' : '';
    //
    //     return {
    //         absolute: path,
    //         relative: path
    //     }
    // }

    const absolute = parts.join('/');
    const {parts: dirs} = splitPath(cwd ?? currentDirectory);

    for (const p of dirs) {

        if (parts[0] == p) {

            parts.shift();
        } else {

            parts.unshift('..');
        }
    }

    return {
        absolute,
        relative: parts.join('/') + (i < result.length ? result.slice(i) : '')
    }
}