/* generate from test/specs/block.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform} from "../../dist/node/index.js";

describe('calc expression', function () {

    it('calc #1', function () {
        const css = `
`;
        return transform(`
.foo {
  width: calc(100px * 2);
  height: calc(((75.37% - 63.5px) - 900px) + (2 * 100px));
}
`).then(result => f(result.code).equals(`.foo{width:200px;height:calc(75.37% - 763.5px)}`));
    });

    it('calc #2', function () {
        const css = `
`;
        return transform(`.foo {
  width: calc(3.5rem + calc(var(--bs-border-width) * 2));
}
`).then(result => f(result.code).equals(`.foo{width:calc(3.5rem + var(--bs-border-width)*2)}`));
    });


    it('calc #3', function () {
        const css = `
`;
        return transform(`.foo {
   bottom:calc(-1*(var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))
}
`).then(result => f(result.code).equals(`.foo{bottom:calc(-1*var(--bs-popover-arrow-height) - var(--bs-popover-border-width))}`));
    });
});
