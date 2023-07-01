import {TokenStream, TransformOptions} from "./@types";
import {transform} from "./transform";
import {stream} from "./parser/stream";
import {node} from "@tbela99/workerize";

export async function worker(css: string, options: TransformOptions = {}, maxSize: number = 10000) {

    if (css.length < maxSize) {

        return transform(css, options);
    }

    let token = null;

    const queue: Array<{token: TokenStream, index: number}> = [];
    const workers = [];
    const concurrent = 10;
    let active = 0;
    let index = 0;


    function enQueue(token: TokenStream, index: number) {

        queue.push({token, index});

        //
        if (workers.length + 1 < concurrent) {

        }
    }

    function start() {

    }

    for (const part of stream(css)) {

        if (token == null) {

            token = part;
        } else {

            token.buffer += part.buffer;
        }

        if (token.buffer.length >= maxSize) {

            enQueue(token, index++);
            token = null;
        }
    }

    if (token != null) {

        enQueue(token, index);
    }
}