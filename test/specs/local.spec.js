import {parse, render, resolve, transform} from '../../dist/node/index.js';
import * as tests from './local/index.js';
import {expect} from "@esm-bundle/chai";
import {readFile} from "node:fs/promises";
import {dirname} from 'node:path';


// these tests will timeout on CI
// run(describe, expect, transform, parse, render);
for (const test of Object.values(tests)) {

    test.run(describe, expect, transform, parse, render, dirname, async (path) => readFile(path, { encoding: 'utf-8' }), resolve);
}