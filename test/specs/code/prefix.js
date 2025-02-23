
export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('prefix removal', function () {

        it('selector prefix #1', function () {
            return transform(`

@media screen {
        
    .foo:-webkit-autofill:not(:hover) {
            height: calc(100px * 2/ 15);
    }
}
`, {removePrefix: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@media screen {
 .foo:autofill:not(:hover) {
  height: calc(40px/3)
 }
}`));
        });

        it('selector prefix #2', function () {
            return transform(`

@media screen {
        
        .foo:-webkit-autofill:not(:hover),
    .foo:-webkit-any(a, b) {
            display: none;
    }
}
`, {removePrefix: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@media screen {
 .foo:is(:autofill:not(:hover),a,b) {
  display: none
 }
}`));
        });

        it('selector unknown prefix #3', function () {
            return transform(`

@media screen {
        
    .foo:-webkit-autofill:not(:hover) {
            height: calc(100px * 2/ 15);
    }
}
`, {removePrefix: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@media screen {
 .foo:autofill:not(:hover) {
  height: calc(40px/3)
 }
}`));
        });

        it('selector invalid prefix #4', function () {
            return transform(`

@media screen {
        
    .foo:-webkit-any-link():not(:hover) {
            height: calc(100px * 2/ 15);
    }
}
`, {removePrefix: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(``));
        });

        it('prefixed properties #4', function () {
            return transform(`

@media screen {
        
:root {

  --color: red;
  }
    .foo:-webkit-any-link {
            height: calc(100px * 2/ 15);
            -webkit-appearance: none;;
  -moz-window-shadow: menu;
    }
}
`, {removePrefix: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@media screen {
 :root {
  --color: red
 }
 .foo:-webkit-any-link {
  height: calc(40px/3);
  appearance: none;
  -moz-window-shadow: menu
 }
}`));
        });

    });
}