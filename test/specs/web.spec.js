
import * as tests from './code/index.js';
import {transform, parse, render, dirname, resolve}from '../../dist/web/index.js';

import {expect} from "@esm-bundle/chai";

async function readFile(path) {

    return fetch(path).
    then(response => response.text())
}

//
// run(describe, expect, transform, parse, render);
for (const test of Object.values(tests)) {

    test.run(describe, expect, transform, parse, render, dirname, readFile, resolve);
}