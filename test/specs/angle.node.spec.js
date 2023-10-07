/* generate from test/specs/block.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform} from '../../dist/node/index.js';

describe('Parse angle', function () {

    it('angle #1', function () {
        return transform(`
.transform { transform: rotate(0.75turn, 2.356194rad, 100grad); }`).then(result => f(result.code).equals(`.transform{transform:rotate(270deg,2.356194rad,90deg)}`));
    });
});