import { readFile } from 'node:fs/promises';
import { resolve, matchUrl } from '../lib/fs/resolve.js';

function parseResponse(response) {
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`);
    }
    return response.text();
}
async function load(url, currentFile = '.') {
    const resolved = resolve(url, currentFile);
    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then(parseResponse) : readFile(resolved.absolute, { encoding: 'utf-8' });
}

export { load };
