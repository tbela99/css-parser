
import * as tests from './code/index.js';
import {transform, parse, render, resolve}from '../../dist/node/index.js';

import {expect} from "@esm-bundle/chai";
import {dirname} from 'path';
import {readFile} from "fs/promises";

//
// run(describe, expect, transform, parse, render);
for (const test of Object.values(tests)) {

    test.run(describe, expect, transform, parse, render, dirname, async (path) => readFile(path, { encoding: 'utf-8' }), resolve);
}