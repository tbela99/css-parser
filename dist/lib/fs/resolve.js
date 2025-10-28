const matchUrl = /^(https?:)?\/\//;
/**
 * return the directory name of a path
 * @param path
 *
 * @private
 */
function dirname(path) {
    // if (path == '/' || path === '') {
    //
    //     return path;
    // }
    if (path === '') {
        return '';
    }
    let i = 0;
    let parts = [''];
    for (; i < path.length; i++) {
        const chr = path.charAt(i);
        if (chr == '/') {
            parts.push('');
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
function splitPath(result) {
    if (result.length == 0) {
        return { parts: [], i: 0 };
    }
    if (result === '/') {
        return { parts: ['/'], i: 0 };
    }
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
        const absolute = normalize(url);
        const prefix = cwd == '/' ? cwd : cwd + '/';
        return {
            absolute,
            relative: absolute.startsWith(prefix) ? absolute.slice(prefix.length) : diff(absolute, cwd)
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
    const absolute = normalize(result);
    return {
        absolute,
        relative: absolute === '' ? '' : diff(absolute, cwd ?? currentDirectory),
    };
}
function diff(path1, path2) {
    let { parts } = splitPath(path1);
    const { parts: dirs } = splitPath(path2);
    for (const p of dirs) {
        if (parts[0] == p) {
            parts.shift();
        }
        else {
            parts.unshift('..');
        }
    }
    return parts.join('/');
}
function normalize(path) {
    let parts = [];
    let i = 0;
    for (; i < path.length; i++) {
        const chr = path.charAt(i);
        if (chr == '/') {
            if (parts.length == 0 || parts[parts.length - 1] !== '') {
                parts.push('');
            }
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
    return (path.charAt(0) == '/' ? '/' : '') + parts.join('/');
}

export { dirname, matchUrl, resolve };
