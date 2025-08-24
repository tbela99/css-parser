import { resolve, matchUrl } from '../lib/fs/resolve.js';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 */
async function getStream(url, currentFile = '.') {
    const resolved = resolve(url, currentFile);
    // @ts-ignore
    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then((response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} ${response.url}`);
        }
        return response.body;
    }) : Readable.toWeb(createReadStream(resolved.absolute));
}

export { getStream };
