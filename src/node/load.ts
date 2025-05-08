import {readFile} from "node:fs/promises";
import {matchUrl, resolve} from "../lib/fs/index.ts";

function parseResponse(response: Response) {

    if (!response.ok) {

        throw new Error(`${response.status} ${response.statusText} ${response.url}`)
    }

    return response.text();
}

/**
 * load file
 * @param url
 * @param currentFile
 */
export async function load(url: string, currentFile: string = '.'): Promise<string> {

    const resolved = resolve(url, currentFile);

    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then(parseResponse) : readFile(resolved.absolute, {encoding: 'utf-8'});
}