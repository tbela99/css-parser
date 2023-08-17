/* generate from test/specs/block.spec.ts */
import {transform, render} from '../../dist/node/index.js';
import {expect} from "@esm-bundle/chai";
import {readFile} from "fs/promises";
import {dirname} from "path";

describe('malformed tokens', function () {

    it('unclosed string #1', async function () {
        const css = `
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css`;

        return readFile(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-all.css', {encoding: 'utf-8'}).
        then(content => transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(content)));
    });

    it('bad string #2', async function () {
        const css = `
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css
;`;

        return transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(''));
    });

    it('bad string #3', async function () {
        const css = `
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css
`;

        return transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(''));
    });

    it('bad string #4', async function () {
        const css = `
        @charset "utf-8";
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css
`;

        return transform(css, {minify: false, resolveImport: true}).then(result => expect(result.code).equals(''));
    });

    it('bad comment #5', async function () {
        const css = `
        
.search-and-account a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
/* secret
`;

        return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
            minify: false,
            removeComments: true,
            preserveLicense: true
        }).code).equals(`.search-and-account a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
}`));
    });

    it('bad comment #6', async function () {
        const css = `
        
#div a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
<!-- secret
`;

        return transform(css, {minify: transform, resolveImport: true}).then(result => expect(render(result.ast, {
            minify: false,
            removeComments: true,
            preserveLicense: true
        }).code).equals(`#div a svg {
 filter: drop-shadow(#0000004d 0 2px 5px)
}`));
    });
});
