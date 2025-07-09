import {dirname, parse, render, resolve, transform} from '../../dist/web/index.js';
import {expect} from "@esm-bundle/chai";
import * as tests from './code/index.js';


async function readFile(path) {

    return fetch(path).then(response => response.text())
}

//
// run(describe, expect, transform, parse, render);
for (const [name,test] of Object.entries(tests)) {

    if (name === 'sourceMap') {
        continue;
    }

    test.run(describe, expect, transform, parse, render, dirname, readFile, resolve);
}