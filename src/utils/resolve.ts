
export function resolve(file: string, src: string) {

    if (src === '' || file.startsWith('/') || /[a-zA-Z]+:\/\//.test(file)) {

        return file;
    }

    return dirname(src) + file
}

// relativePath('images/janu/img01.jpg', 'images/css/style.css')
export function relativePath(file: string, original: string) {

    const f = file.split('/');
    const o = original.split('/');
    const r: string[] = [];
    const length = Math.min(o.length, f.length);

    // images/janu/img01.jpg
    // images/css/style.css
    // ../janu/img01.jpg

    for (let i = 0; i < length; i++) {

        const args = o[i] == f[i] ? [o[i]] : ['..', f[i]];

        r.push(...args)
    }

    if (f.length > length) {

        r.push(...f.slice(length));
    }

    for (let i = 0; i < r.length; i++) {

        if (i > 0 && r[i] == '..') {

            if (r[i - 1] != '..') {

                r.splice(i - 1, 2);
                i--;
            }
        }
    }

    return r.join('/')
}

function dirname(path: string) {

    path = path.replace(/\?|#.*/, '');

    if (path.endsWith('/')) {

        path = path.slice(0, -1);
    }

    const dirname = path.replace(/\/[^/]*$/, '');

    return dirname + '/';
}