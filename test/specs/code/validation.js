
export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('selector validation', function () {

        it('selector validation #1', function () {
            return transform(`
#404 {
    --animate-duration: 1s;
}

.s, #404 {
    --animate-duration: 1s;
}

.s [type="text" {
    --animate-duration: 1s;
}

.s [type="text"]] {
    --animate-duration: 1s;
}

.s [type="text"] {
    --animate-duration: 1s;
}

.s [type="text" i] {
    --animate-duration: 1s;
}

.s [type="text" s] {
    --animate-duration: 1s;
}

.s [type="text" b] {
    --animate-duration: 1s;
}

.s [type="text" b], {
    --animate-duration: 1s;
}

.s [type="text" b]+ {
    --animate-duration: 1s;
}

.s [type="text" b]+ b {
    --animate-duration: 1s;
}

.s [type="text" i]+ b {
    --animate-duration: 1s;
}


.s [type="text"())] {
    --animate-duration: 1s;
}
.s() {
    --animate-duration: 1s;
}
.s:focus {
    --animate-duration: 1s;
}

`).then(result => expect(render(result.ast, {minify: false}).code).equals(`.s:is([type=text],[type=text i],[type=text s],[type=text i]+b,:focus) {
 --animate-duration: 1s
}`));
        });

    });
}