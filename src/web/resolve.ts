import {matchUrl} from "./index";

export function resolve(url: string, currentFile: string) {

    if (matchUrl.test(url)) {

        return url;
    }

    if (matchUrl.test(currentFile)) {

        return new URL(url, currentFile).href;
    }

    return new URL(url, new URL(currentFile, self.location.href).href).href;
}