import {parse, render, resolve, transform, transformSync, parseSync} from '../../dist/node.js';
import {ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions} from '../../dist/lib/ast/types.js'
import * as tests from './code/index.js';
import {expect, use} from "chai";
import {readFile} from "node:fs/promises";
import {dirname} from 'node:path';
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

//
// run(describe, expect, transform, parse, render);
for (const test of Object.values(tests)) {

    test.run(describe, expect, it, transform, parse, render, dirname, async (path) => readFile(path, { encoding: 'utf-8' }), resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync, parseSync);
}