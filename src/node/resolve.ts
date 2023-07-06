import {dirname} from "path";
import {matchUrl} from "../index";

export function resolve(url: string, currentFile: string): string {

    if (matchUrl.test(url)) {

        return url;
    }

    if (matchUrl.test(currentFile)) {

        return new URL(url, currentFile).href;
    }

    if (url.charAt(0) == '/') {

        return url;
    }

    if (currentFile.charAt(0) == '/') {

        return dirname(currentFile) + '/' + url;
    }

    if (currentFile === '' || dirname(currentFile) === '') {

        return url;
    }

    return dirname(currentFile) + '/' + url;
}