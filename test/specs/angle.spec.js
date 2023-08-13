/* generate from test/specs/block.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {parse, render} from '../../dist/index.js';

describe('Parse angle', function () {

    it('angle #1', function () {
        return parse(`.transform { transform: rotate(12deg, 1.57rad, 100grad); }`).then(result => f(render(result.ast, {minify: false}).code).equals(`.transform {
 transform: rotate(12deg,1.57rad,100grad)
}`));
    });
});