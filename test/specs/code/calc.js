

export function run(describe, expect, transform) {

    describe('calc expression', function () {

        it('calc #1', function () {
            const css = `
`;
            return transform(`
.foo {
  width: calc(100px * 2);
  height: calc(((75.37% - 63.5px) - 900px) + (2 * 100px));
}
`).then(result => expect(result.code).equals(`.foo{width:200px;height:calc(75.37% - 763.5px)}`));
        });

        it('calc #2', function () {
            const css = `
`;
            return transform(`.foo {
        height: calc(200% / 6 + 2%/3);
  width: calc(3.5rem + calc(var(--bs-border-width) * 2));
}
`).then(result => expect(result.code).equals(`.foo{height:34%;width:calc(3.5rem + var(--bs-border-width)*2)}`));
        });

        it('calc #3', function () {
            const css = `
`;
            return transform(`.foo {
   bottom:calc(-1*(var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))
}
`).then(result => expect(result.code).equals(`.foo{bottom:calc(-1*var(--bs-popover-arrow-height) - var(--bs-popover-border-width))}`));
        });

        it('calc #4', function () {
            const css = `
`;
            return transform(`
:root {

--preferred-width: 20px;
}
.foo-bar {
    width: calc(var(--preferred-width) + 5px);
}
`, {inlineCssVariables: true}).then(result => expect(result.code).equals(`.foo-bar{width:25px}`));
        });

        it('calc #5', function () {
            const css = `
`;
            return transform(`
:root {

--preferred-width: 20px;
}
.foo-bar {
    width: calc((var(--preferred-width) + 1px) / 3 + 5px);
    height: calc(100% / 4);
}
`, {inlineCssVariables: true}).then(result => expect(result.code).equals(`.foo-bar{width:12px;height:25%}`));
        });

        it('calc #6', function () {
            const css = `
`;
            return transform(`
:root {

--preferred-width: 20px;
}
.foo-bar {
    width: calc((var(--preferred-width) + 1px) / 3 + 5px);
    height: calc(100% / 4);
}
`).then(result => expect(result.code).equals(`:root{--preferred-width:20px}.foo-bar{width:calc((var(--preferred-width) + 1px)/3 + 5px);height:25%}`));
        });

        it('calc #7', function () {
            const css = `
`;
            return transform(`

.foo {
        height: calc(100px * 2/ 15 + 2px/3);
}
`).then(result => expect(result.code).equals(`.foo{height:14px}`));
        });

        it('calc #8', function () {
            const css = `
`;
            return transform(`

.foo {
        height: calc(100px * 2/ 15 - 5% - 1px/3);
}
`).then(result => expect(result.code).equals(`.foo{height:calc(13px - 5%)}`));
        });

        it('calc #9', function () {
            const css = `
`;
            return transform(`

.foo {
        height: calc(100px * 2/ 15);
}
`).then(result => expect(result.code).equals(`.foo{height:calc(40px/3)}`));
        });

        it('calc #10', function () {
            const css = `
`;
            return transform(`

.foo {
width: calc(2px * 50%);
height: calc(80% * 50%);
}
`).then(result => expect(result.code).equals(`.foo{width:1px;height:40%}`));
        });
    });

}