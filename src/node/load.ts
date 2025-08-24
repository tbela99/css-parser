import {matchUrl, resolve} from "../lib/fs/index.ts";
import {createReadStream} from "node:fs";
import {Readable} from "node:stream";

/**
 * load file or url as stream
 * @param url
 * @param currentFile
 */
export async function getStream(url: string, currentFile: string = '.'): Promise<ReadableStream<string>> {

    const resolved = resolve(url, currentFile);

    // @ts-ignore
    return matchUrl.test(resolved.absolute) ? fetch(resolved.absolute).then((response: Response) => {

        if (!response.ok) {

            throw new Error(`${response.status} ${response.statusText} ${response.url}`)
        }

        return response.body;
    }) : Readable.toWeb(createReadStream(resolved.absolute));
}