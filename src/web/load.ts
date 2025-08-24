import {matchUrl, resolve} from "../lib/fs/index.ts";

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 */
export async function getStream(url: string, currentFile: string): Promise<ReadableStream<string>> {

    let t: URL;

    if (matchUrl.test(url)) {

        t = new URL(url);
    } else if (matchUrl.test(currentFile)) {

        t = new URL(url, currentFile);
    } else {

        const path: string = resolve(url, currentFile).absolute;
        // @ts-ignore
        t = new URL(path, self.origin);
    }

    // @ts-ignore
    return fetch(t, t.origin != self.origin ? {mode: 'cors'} : {}).then((response: Response) => {

        if (!response.ok) {

            throw new Error(`${response.status} ${response.statusText} ${response.url}`)
        }

        return response.body;
    });
}