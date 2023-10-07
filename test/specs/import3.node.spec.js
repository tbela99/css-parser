/* generate from test/specs/import3.spec.ts */
import { expect as f } from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import { transform } from '../../dist/node/index.js';
import { dirname } from 'path';
import { readFile } from 'fs/promises';

const import2 = `@import 'https://maxst.icons8.com/vue-static/landings/line-awesome/font-awesome-line-awesome/css/all.min.css'`;
describe('process import', function () {
    it('process import #3', function () {
        return readFile(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-line-awesome.css', { encoding: 'utf-8' }).
            then(file => transform(import2, {
            minify: true,
            resolveImport: true
        }).then((result) => f(result.code).equals(file.trim())));
    });
});
