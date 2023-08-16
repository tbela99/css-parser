/* generate from test/specs/block.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {parse, render} from '../../dist/node/index.js';

describe('Parse color', function () {

    it('hsl #1', function () {
        return parse(`.hsl { color: hsl(195, 100%, 50%); }`).then(result => f(render(result.ast, {minify: false}).code).equals(`.hsl {
 color: #00bfff
}`));
    });

    it('hsl #2', function () {
        return parse(`.hsl { color: hsla(195, 100%, 50%, 50%); }`).then(result => f(render(result.ast, {minify: false}).code).equals(`.hsl {
 color: #00bfff80
}`));
    });
    it('hwb #3', function () {
        return parse(`.hwb { color: hwb(195, 0%, 0%); }`).then(result => f(render(result.ast, {minify: false}).code).equals(`.hwb {
 color: #00bfff
}`));
    });

    it('hwb #4', function () {
        return parse(`.hwb { color: hwb(195, 0%, 0%, 50%); }`).then(result => f(render(result.ast, {minify: false}).code).equals(`.hwb {
 color: #00bfff80
}`));
    });
});
