
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
`, {removePrefix: true, nestingRules: false}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@media screen {
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

   a:any-link {
  border: 1px solid blue;
  color: orange;
}

/* WebKit browsers */
a:-webkit-any-link {
  border: 1px solid blue;
  color: orange;
}

@media screen {
        
:root {

  --color: red;
  }
    .foo:-webkit-any-link, .foo:-webkit-any(p, span) {
            height: calc(100px * 2/ 15);
            -webkit-appearance: none;;
    }
}
`, {removePrefix: true, beautify: true}).then(result => expect(result.code).equals(`a:any-link {
 border: 1px solid blue;
 color: orange
}
@media screen {
 :root {
  --color: red
 }
 .foo {
  &:any-link,&p,&span {
   height: calc(40px/3);
   appearance: none
  }
 }
}`));
        });

    });
}