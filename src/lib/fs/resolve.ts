export const matchUrl: RegExp = /^(https?:)?\/\//;

/**
 * return the directory name of a path
 * @param path
 *
 * @private
 */
export function dirname(path: string): string {

    // if (path == '/' || path === '') {
    //
    //     return path;
    // }

    if (path === '') {

        return '';
    }

    let i: number = 0;

    let parts: string[] = [''];

    for (; i < path.length; i++) {

        const chr: string = path.charAt(i);

        if (chr == '/') {

            parts.push('')
        }
            // else if (chr == '?' || chr == '#') {
            //
            //     break;
        // }
        else {

            parts[parts.length - 1] += chr;
        }
    }

    parts.pop();

    return parts.length == 0 ? '/' : parts.join('/');
}

/**
 * split path
 * @param result
 * @private
 */
function splitPath(result: string): { i: number, parts: string[] } {

    if (result.length == 0) {

        return {parts: [], i: 0};
    }

    if (result === '/') {

        return {parts: ['/'], i: 0};
    }

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
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
export function resolve(url: string, currentDirectory: string, cwd?: string): { absolute: string; relative: string } {

    if (matchUrl.test(url)) {

        return {
            absolute: url,
            relative: url
        };
    }

    cwd ??= '';
    currentDirectory ??= '';

    if (currentDirectory !== '' && url.startsWith(currentDirectory + '/')) {

        return {
            absolute: url,
            relative: url.slice(currentDirectory.length + 1)
        };
    }

    if (currentDirectory === '' && cwd !== '' && url.startsWith(cwd == '/' ? cwd : cwd + '/')) {

        cwd = normalize(cwd);
        const absolute: string = normalize(url);
        const prefix: string = cwd == '/' ? cwd : cwd + '/';

        return {
            absolute,
            relative: absolute.startsWith(prefix) ? absolute.slice(prefix.length) : diff(absolute, cwd)
        };
    }

    if (matchUrl.test(currentDirectory)) {

        const path: string = new URL(url, currentDirectory).href;

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

    const absolute = normalize(result);

    return {
        absolute,
        relative: absolute === '' ? '' : diff(absolute, cwd ?? currentDirectory),
    }
}

function diff(path1: string, path2: string) {

    let {parts} = splitPath(path1);
    const {parts: dirs} = splitPath(path2);
    for (const p of dirs) {
        if (parts[0] == p) {
            parts.shift();
        } else {
            parts.unshift('..');
        }
    }

    return parts.join('/');
}

function normalize(path: string) {

    let parts: string[] = [];
    let i: number = 0;

    for (; i < path.length; i++) {

        const chr: string = path.charAt(i);

        if (chr == '/') {

            if (parts.length == 0 || parts[parts.length - 1] !== '') {

                parts.push('');
            }

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

    return (path.charAt(0) == '/' ? '/' : '') + parts.join('/');
}