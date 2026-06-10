export function run(describe, expect, it, transform, parse, render) {

    describe('flatten nested css rules', function () {
        it('flatten #1', function () {
            const nesting1 = `

.foo {
        color: blue;
        &Bar { color: red; }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 color: blue
}
Bar.foo {
 color: red
}`));
        });

        it('flatten #2', function () {
            const nesting1 = `
.header {
  background-color: blue;
  & p {
    font-size: 16px;
    & span {
      &:hover {
        color: green
      }
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.header {
 background-color: blue
}
.header p {
 font-size: 16px
}
.header p span:hover {
 color: green
}`));
        });

        it('flatten with at-rule #3', function () {
            const nesting1 = `
.foo {
    display: grid;
    
    @media (orientation: landscape) {
      & {
        grid-auto-flow: column;
      }
    }
  }
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 display: grid
}
@media (orientation:landscape) {
 .foo {
  grid-auto-flow: column
 }
}`));
        });

        it('flatten with at-rule #4', function () {
            const nesting1 = `
.foo {
  display: grid;

  @media (orientation: landscape) {
    grid-auto-flow: column;
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 display: grid
}
@media (orientation:landscape) {
 .foo {
  grid-auto-flow: column
 }
}`));
        });

        it('flatten with at-rule #5', function () {
            const nesting1 = `
.foo {
  display: grid;

  @media (orientation: landscape) {
    grid-auto-flow: column;

    @media (min-width > 1024px) {
      max-inline-size: 1024px;
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 display: grid
}
@media (orientation:landscape) {
 .foo {
  grid-auto-flow: column
 }
}`));
        });

        it('flatten with at-rule #6', function () {
            const nesting1 = `
html {
  @layer base {
    block-size: 100%;

    @layer support {
      & body {
        min-block-size: 100%;
      }
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`@layer base {
 html {
  block-size: 100%
 }
}
@layer base.support {
 html body {
  min-block-size: 100%
 }
}`));
        });

        it('flatten with at-rule #7', function () {
            const nesting1 = `
html {
  @layer base {
    block-size: 100%;

    @layer support {
       body {
        min-block-size: 100%;
      }
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`@layer base {
 html {
  block-size: 100%
 }
}
@layer base.support {
 html body {
  min-block-size: 100%
 }
}`));
        });

        it('flatten with at-rule #8', function () {
            const nesting1 = `
.card {
  inline-size: 40ch;
  aspect-ratio: 3/4;

  @scope (&) {
    :scope {
      border: 1px solid white;
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.card {
 inline-size: 40ch;
 aspect-ratio: 3/4
}
@scope (.card) {
 :scope {
  border: 1px solid #fff
 }
}`));
        });

        it('flatten with at-rule #9', function () {
            const nesting1 = `
.foo {
  color: blue;
  && { padding: 2ch; }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 color: blue
}
.foo.foo {
 padding: 2ch
}`));
        });

        it('flatten with at-rule #10', function () {
            const nesting1 = `

@scope (.card) to (> header) {
  :scope {
    inline-size: 40ch;
    aspect-ratio: 3/4;

    > header {
      border-block-end: 1px solid white;
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`@scope (.card) to (>header) {
 :scope {
  inline-size: 40ch;
  aspect-ratio: 3/4
 }
 :scope>header {
  border-block-end: 1px solid #fff
 }
}`));
        });

        it('expand rule #11', function () {

            return transform(`
.parent {
  color: blue;

  @scope (& > .scope) to (& .limit) {
    & .content {
      color: red;
    }
  }
}
`, {beautify: true, expandNestingRules: true}).then((result) => expect(result.code).equals(`.parent {
 color: blue
}
@scope (.parent>.scope) to (.parent .limit) {
 .parent .content {
  color: red
 }
}`));
        });
    });

    describe('nesting selector cannot match pseudo element', () => {

        it('nesting selector cannot match pseudo element #12', function () {

            const css = `
.foo, .foo::before, .foo::after {
  color: red;

  &:hover { color: blue; }
}

        `;

            return transform(css, {
                beautify: true,
                expandNestingRules: true
            }).then(result => expect(result.code).equals(`.foo,.foo:before,.foo:after {
 color: red
}
.foo:hover {
 color: blue
}`))
        });

        it('nesting selector cannot match pseudo element #13', () => {

            const css = `
.foo, .foo::before, .foo::after {
  color: red;

 .bar { color: blue; }
}

        `;

            return transform(css, {
                beautify: true,
                expandNestingRules: true
            }).then(result => expect(result.code).equals(`.foo,.foo:before,.foo:after {
 color: red
}
.foo .bar {
 color: blue
}`))
        });

        it('nesting selector cannot match pseudo element #14', () => {

            const css = `
 .foo::before, .foo::after {
  color: red;

  .bar { color: blue; }
}

        `;

            return transform(css, {
                beautify: true,
                expandNestingRules: true
            }).then(result => expect(result.code).equals(`.foo:before,.foo:after {
 color: red
}`))
        });

        it('nesting selector cannot match pseudo element #15', () => {

            const css = `
 .foo::before, .foo::after {
  color: red;

  &:hover { color: blue; }
}

        `;

            return transform(css, {
                beautify: true,
                expandNestingRules: true
            }).then(result => expect(result.code).equals(`.foo:before,.foo:after {
 color: red
}`))
        });;

        it('nesting selector cannot match pseudo element #16', () => {

            const css = `

.foo, .foo:active, .foo:before {
  color: red;

  &:hover { color: blue; }
}


        `;

            return transform(css, {
                beautify: true,
                expandNestingRules: true
            }).then(result => expect(result.code).equals(`.foo,.foo:active,.foo:before {
 color: red
}
:hover:is(.foo,.foo:active) {
 color: blue
}`))
        });

        it('flatten with at-rule #17', function () {
            const nesting1 = `
.foo {
  display: grid;

  @media (orientation: landscape) {
    grid-auto-flow: column;

    @media (min-width : 1024px) {
      max-inline-size: 1024px;
    }
  }
}
`;
            return parse(nesting1, {
                minify: true, nestingRules: true
            }).then((result) => expect(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 display: grid
}
@media (orientation:landscape) {
 .foo {
  grid-auto-flow: column
 }
}
@media (orientation:landscape) and (min-width:1024px) {
 .foo {
  max-inline-size: 1024px
 }
}`));
        });

        it('if(media()) #18', function () {
            const nesting1 = `
button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
`;
            return transform(nesting1, {
                beautify: true, expandIfSyntax: true
            }).then((result) => expect(result.code).equals(`button {
 aspect-ratio: 1;
 width: 44px;
 @media (any-pointer:fine) {
  width: 30px
 }
}`));
        });
        
        it('if(media()) #19', function () {
            const nesting1 = `

div-1 {
  background-image: if(
    else: none;
  );
}
div-2 {
  background-image: if(
  style(--scheme: ice): linear-gradient(#caf0f8, white, #caf0f8) ;
  else: none ;
);

div-3 {
  background-image: if(
    style(--scheme: ice): linear-gradient(#caf0f8, white, #caf0f8);
    style(--scheme: fire): linear-gradient(#ffc971, white, #ffc971);
    else: none;
  );
}
div-4 {
  background-image: if(
    
  );
}
`;
            return transform(nesting1, {
                beautify: true, expandIfSyntax: true
            }).then((result) => expect(result.code).equals(`div-1,div-2 {
 background-image: none
}
div-2 {
 @container style(--scheme:ice) {
  background-image: linear-gradient(#caf0f8,#fff,#caf0f8)
 }
 div-3 {
  background-image: none;
  @container style(--scheme:ice) {
   background-image: linear-gradient(#caf0f8,#fff,#caf0f8)
  }
  @container style(--scheme:fire) {
   background-image: linear-gradient(#ffc971,#fff,#ffc971)
  }
 }
 div-4 {
  background-image: if()
 }
}`));
        });
        
    });
}
