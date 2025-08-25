const matchUrl = /^(https?:)?\/\//;
/**
 * return the directory name of a path
 * @param path
 * @internal
 */
function dirname(path) {
    if (path == '/' || path === '') {
        return path;
    }
    let i = 0;
    let parts = [''];
    for (; i < path.length; i++) {
        const chr = path.charAt(i);
        if (chr == '/') {
            parts.push('');
        }
        else if (chr == '?' || chr == '#') {
            break;
        }
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
function splitPath(result) {
    const parts = [''];
    let i = 0;
    for (; i < result.length; i++) {
        const chr = result.charAt(i);
        if (chr == '/') {
            parts.push('');
        }
        else if (chr == '?' || chr == '#') {
            break;
        }
        else {
            parts[parts.length - 1] += chr;
        }
    }
    let k = -1;
    while (++k < parts.length) {
        if (parts[k] == '.') {
            parts.splice(k--, 1);
        }
        else if (parts[k] == '..') {
            parts.splice(k - 1, 2);
            k -= 2;
        }
    }
    return { parts, i };
}
/**
 * resolve path
 * @param url url or path to resolve
 * @param currentDirectory directory used to resolve the path
 * @param cwd current working directory
 *
 * @private
 */
function resolve(url, currentDirectory, cwd) {
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
        };
    }
    let result = '';
    if (url.charAt(0) == '/') {
        result = url;
    }
    else if (currentDirectory.charAt(0) == '/') {
        result = dirname(currentDirectory) + '/' + url;
    }
    let { parts, i } = splitPath(result);
    const absolute = parts.join('/');
    const { parts: dirs } = splitPath(cwd ?? currentDirectory);
    for (const p of dirs) {
        if (parts[0] == p) {
            parts.shift();
        }
        else {
            parts.unshift('..');
        }
    }
    return {
        absolute,
        relative: parts.join('/') + (i < result.length ? result.slice(i) : '')
    };
}

export { dirname, matchUrl, resolve };
