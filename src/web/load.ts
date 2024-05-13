import {matchUrl, resolve} from "../lib/fs";

function parseResponse(response: Response) {

    if (!response.ok) {

        throw new Error(`${response.status} ${response.statusText} ${response.url}`)
    }

    return response.text();
}

export async function load(url: string, currentFile: string): Promise<string> {

    let t: URL;

    if (matchUrl.test(url)) {

        t = new URL(url);
    } else if (matchUrl.test(currentFile)) {

        t = new URL(url, currentFile);
    } else {

        const path: string = resolve(url, currentFile).absolute;
        t = new URL(path, self.origin);
    }

    return fetch(t, t.origin != self.origin ? {mode: 'cors'} : {}).then(parseResponse);
}