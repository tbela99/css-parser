import {dirname, parse, render, resolve, transform} from '../../dist/web.js';
import {ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions} from '../../dist/lib/ast/types.js';
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

    test.run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions);
}