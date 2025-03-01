export function run(describe, expect, transform, parse, render, dirname, readFile) {

    const css = `
:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);
}
:root {
--preferred-width: 20px;
}
.foo-bar {
    width: calc(calc(var(--preferred-width) + 1px) / 3 + 5px);
    height: calc(100% / 4);}


.foo {
 width: 12px;
 height: 25%
}


`;

    describe('minify passes', function () {
        it('single pass #1', function () {
            return transform(css, {
                beautify: true,
                inlineCssVariables: true,
                pass: 1
            }).then((result) => expect(result.code).equals(`._19_u :focus {
 color: navy
}
.foo-bar {
 width: 12px;
 height: 25%
}
.foo {
 width: 12px;
 height: 25%
}`));
        });

        it('multiple passes #2', function () {

            return transform(css, {
                beautify: true,
                inlineCssVariables: true,
                pass: 2
            }).then((result) => expect(result.code).equals(`._19_u :focus {
 color: navy
}
.foo-bar,.foo {
 width: 12px;
 height: 25%
}`));
        });
    });

}