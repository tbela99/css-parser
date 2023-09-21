/* generate from test/specs/shorthand.spec.ts */
import { expect as f } from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import { parse , render} from "../../dist/node/index.js";
import {dirname, resolve} from "path";
import {readFile} from "fs/promises";

describe('sourcemap', function () {

    const dir = resolve(dirname(new URL(import.meta.url).pathname) + '/..');
    const file = `@import '${dir}/line-awesome.css`;
    const options = {
        // minify: true,
        // preserveLicense: true,
        src: `${dir}/line-awesome.css`,
        resolveImport: true,
        sourcemap: true
    };

    it('sourcemap file #1', async () => {


        return parse(file, options).then(result => {

            const output = render(result.ast, {...options, minify: false, removeComments: true});

            return readFile(`${dir}/files/sourcemap/line-awesome-sourcemap.css`, {encoding: 'utf-8'}).
            then(expected => f(`/*# sourceMappingURL=data:application/json,${encodeURIComponent(JSON.stringify(output.map))} */`).equals(expected));

        })
    });
});
