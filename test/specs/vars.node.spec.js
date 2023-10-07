/* generate from test/specs/block.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform, render} from '../../dist/node/index.js';

describe('Inline css variable', function () {

    it('inline variable #1', function () {
        return transform(`
:root {
    --animate-duration: 1s;
    --animate-delay: 1s;
    --animate-repeat: 1
}

.animate__animated.animate__repeat-1 {
    -webkit-animation-iteration-count: 1;
    animation-iteration-count: 1;
    -webkit-animation-iteration-count: var(--animate-repeat);
    animation-iteration-count: var(--animate-repeat)
}

.animate__animated.animate__repeat-2 {
    -webkit-animation-iteration-count: 2;
    animation-iteration-count: 2;
    -webkit-animation-iteration-count: calc(var(--animate-repeat)*2);
    animation-iteration-count: calc(var(--animate-repeat)*2)
}

.animate__animated.animate__delay-1s {
    -webkit-animation-delay: 1s;
    animation-delay: 1s;
    -webkit-animation-delay: var(--animate-delay);
    animation-delay: var(--animate-delay)
}

.animate__animated.animate__delay-2s {
    -webkit-animation-delay: 2s;
    animation-delay: 2s;
    -webkit-animation-delay: calc(var(--animate-delay)*2);
    animation-delay: calc(var(--animate-delay)*2)
}

.animate__animated.animate__delay-3s {
    -webkit-animation-delay: 3s;
    animation-delay: 3s;
    -webkit-animation-delay: calc(var(--animate-delay)*3);
    animation-delay: calc(var(--animate-delay)*3)
}

.animate__animated.animate__delay-4s {
    -webkit-animation-delay: 4s;
    animation-delay: 4s;
    -webkit-animation-delay: calc(var(--animate-delay)*4);
    animation-delay: calc(var(--animate-delay)*4)
}

`, {inlineCssVariables: true}).then(result => f(render(result.ast, {minify: false}).code).equals(`.animate__animated.animate__repeat-1 {
 -webkit-animation-iteration-count: 1;
 animation-iteration-count: 1
}
.animate__animated.animate__repeat-2 {
 -webkit-animation-iteration-count: 2;
 animation-iteration-count: 2
}
.animate__animated.animate__delay-1s {
 -webkit-animation-delay: 1s;
 animation-delay: 1s
}
.animate__animated.animate__delay-2s {
 -webkit-animation-delay: 2s;
 animation-delay: 2s
}
.animate__animated.animate__delay-3s {
 -webkit-animation-delay: 3s;
 animation-delay: 3s
}
.animate__animated.animate__delay-4s {
 -webkit-animation-delay: 4s;
 animation-delay: 4s
}`));
    });
});