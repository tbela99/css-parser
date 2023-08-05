/* generate from test/specs/import2.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform} from '../../dist/node/index.js';
import {dirname} from 'path';
import {readFile} from 'fs/promises';

const import1 = `@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css';
`;
describe('process import', function () {
    it('process import #2', function () {
        return readFile(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-all.css', {encoding: 'utf-8'}).then(file => transform(import1, {
            minify: false,
            resolveImport: true
        }).then((result) => f(result.code).equals(file.trimEnd())));
    });
});
