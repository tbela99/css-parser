
export function resolve(file: string, src: string) {

    if (src === '' || file.startsWith('/') || /[a-zA-Z]+:\/\//.test(file)) {

        return file;
    }

    return dirname(src) + file
}

// relativePath('/images/janu/img01.jpg', 'css/style.css');
// -> /images/janu/img01.jpg

// relativePath('/images/janu/img01.jpg', '/css/style.css');
// -> /images/janu/img01.jpg

// relativePath('images/janu/img01.jpg', 'css/style.css');
// -> ../images/janu/img01.jpg

// relativePath('images/janu/img01.jpg', '/css/style.css');
// -> /css/images/janu/img01.jpg

export function relativePath(file: string, original: string) {

    if (file.startsWith('/') || original === '' || /[a-zA-Z]+:\/\//.test(file)) {

        return file;
    }

    const dir = dirname(original);
    return (dir.endsWith('/') ? dir : dir + '/') + file
}

function dirname(path: string) {

    path = path.replace(/\?|#.*/, '');

    if (path.endsWith('/')) {

        path = path.slice(0, -1);
    }

    const dirname = path.replace(/\/[^/]*$/, '');

    return dirname + '/';
}