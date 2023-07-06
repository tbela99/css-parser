import {readFile} from "fs/promises";
import {resolve} from "./resolve";
import {matchUrl} from "../index";

function parseResponse(response: Response) {

    if (!response.ok) {

        throw new Error(`${response.status} ${response.statusText} ${response.url}`)
    }

    return response.text();
}

export async function load(url: string, currentFile: string) {

    const resolved: string = resolve(url, currentFile);

    return matchUrl.test(resolved) ? fetch(resolved).then(parseResponse) : readFile(resolved, {encoding: 'utf-8'});
}