
import {transform, parse, render, resolve}from '../../dist/node/index.js';
import * as tests from './code/index.js';
import {expect} from "@esm-bundle/chai";
import {readFile} from "fs/promises";
import {dirname} from 'path';


//
// run(describe, expect, transform, parse, render);
for (const test of Object.values(tests)) {

    test.run(describe, expect, transform, parse, render, dirname, async (path) => readFile(path, { encoding: 'utf-8' }), resolve);
}