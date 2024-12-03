import { matchUrl, resolve } from '../lib/fs/resolve.js';

function parseResponse(response) {
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`);
    }
    return response.text();
}
async function load(url, currentFile) {
    let t;
    if (matchUrl.test(url)) {
        t = new URL(url);
    }
    else if (matchUrl.test(currentFile)) {
        t = new URL(url, currentFile);
    }
    else {
        const path = resolve(url, currentFile).absolute;
        // @ts-ignore
        t = new URL(path, self.origin);
    }
    // @ts-ignore
    return fetch(t, t.origin != self.origin ? { mode: 'cors' } : {}).then(parseResponse);
}

export { load };
