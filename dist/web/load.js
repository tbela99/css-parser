import { matchUrl, resolve } from '../lib/fs/resolve.js';

function parseResponse(response) {
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`);
    }
    return response.text();
}
async function load(url, currentFile) {
    if (matchUrl.test(url)) {
        return fetch(url).then(parseResponse);
    }
    if (matchUrl.test(currentFile)) {
        return fetch(new URL(url, currentFile)).then(parseResponse);
    }
    // return fetch(new URL(url, new URL(currentFile, self.location.href).href)).then(parseResponse);
    return fetch(resolve(url, currentFile).absolute).then(parseResponse);
}

export { load };
