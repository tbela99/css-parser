/* generate from test/specs/nesting.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {parse, render} from '../../dist/web/index.js';

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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.header {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
 display: grid
}
@media (orientation:landscape) {
 .foo {
  grid-auto-flow: column
 }
}
@media (orientation:landscape) and (min-width >1024px) {
 .foo {
  max-inline-size: 1024px
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`@layer base {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`@layer base {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.card {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`.foo {
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
        }).then((result) => f(render(result.ast, {minify: false, expandNestingRules: true}).code).equals(`@scope (.card) to (>header) {
 :scope {
  inline-size: 40ch;
  aspect-ratio: 3/4
 }
 :scope>header {
  border-block-end: 1px solid #fff
 }
}`));
    });
});
