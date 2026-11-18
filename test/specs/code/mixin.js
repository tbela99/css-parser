export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve, ColorType, EnumToken, ModuleCaseTransformEnum, ModuleScopeEnumOptions, transformSync) {
    describe("evaluate mixins", function () {
        it("private variables shadowing #1", function () {
            return transform(
                `
@mixin --shadowed-values(--color2: green, --color3: green) {
  @private { --color3: blue; }
  background: linear-gradient(var(--color1), var(--color2), var(--color3));
}
p {
  --color1: red;
  --color2: red;
  --color3: red;
  @apply --shadowed-values();
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`p {
 --color1: red;
 --color2: red;
 --color3: red;
 background: linear-gradient(red,green,blue)
}`),
            );
        });

        it("private variables are visible to descendants #2", function () {
            return transform(
                `
@mixin --only-descs(--arg) {
  color: var(--arg);
  &  * { color: var(--arg, red); }
}
.foo {
  @apply --only-descs(green);
}
`,
                { beautify: true, evaluateMixins: true, expandNestingRules: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --only-descs(--arg) */
.foo {
 color: green
}
.foo * {
 color: green
}`),
            );
        });

        it("private variables are not visible to siblings #3", function () {
            return transform(
                `
@mixin --only-descs(--arg) {
  color: var(--arg);
  &  + * { color: var(--arg, red); }
}
.foo {
  @apply --only-descs(green);
}
.bar {
  @apply --only-descs(green);
}
`,
                { beautify: true, evaluateMixins: true, expandNestingRules: true },
            ).then((result) =>
                expect(result.code).equals(`.foo {
 color: green
}
.foo+* {
 color: red
}
.bar {
 color: green
}
.bar+* {
 color: red
}`),
            );
        });

        it("nested rules output #4", function () {
            return transform(
                `
@mixin --only-descs(--arg) {
  color: var(--arg);
  & * { color: var(--arg, red); }
  & ~ .sibling, & > .child { color: var(--arg, red); }
}
.foo {
  @apply --only-descs(green);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.foo {
 color: green;
 & * {
  color: green
 }
 &~.sibling {
  color: red
 }
 &>.child {
  color: green
 }
}`),
            );
        });

        it("the mixin must be defined only once #5", function () {
            return transform(
                `
@mixin --m { color: red }
.a { @apply --m; }
@mixin --m { color: blue }
@layer base {
  @mixin --m { color: green }
  @mixin --m { color: yellow }
}
.b { @apply --m(); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 @apply --m
}
@mixin --m {
 color: blue
}
.b {
 @apply --m
}`),
            );
        });

        it("mixin arguments and default values #6", function () {
            return transform(
                `
@mixin --gradient-text(
  --from <color>: mediumvioletred,
  --to <color>: teal,
  --angle: to bottom right,
) {
  @private {
    --gradient: linear-gradient(var(--angle), var(--from), var(--to));
  }
  color: var(--from, var(--to));

  @supports (background-clip: text) or (-webkit-background-clip: text) {
    background-image: var(--gradient, var(--from));
    color: transparent;
  }
}

h1 {
  @apply --gradient-text(pink, powderblue);
}

h2 {
  @apply --gradient-text;
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`h1 {
 color: pink;
 @supports (background-clip:text) or (-webkit-background-clip:text) {
  background-image: linear-gradient(to bottom right,pink,#b0e0e6);
  color: #0000
 }
}
h2 {
 color: #c71585;
 @supports (background-clip:text) or (-webkit-background-clip:text) {
  background-image: linear-gradient(to bottom right,#c71585,teal);
  color: #0000
 }
}`),
            );
        });

        it("comma containing arguments #7", function () {
            return transform(
                `
@mixin --font(--family: {Arial, sans-serif}) { font-family: var(--family) }
.a { @apply --font; }
.b { @apply --font({Times, serif}); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 font-family: Arial,sans-serif
}
.b {
 font-family: Times,serif
}`),
            );
        });

        it("invalid variables #8", function () {
            return transform(
                `
@mixin --m(--a: red) {
  @private { --x: var(--y); --y: var(--x); }
  background-color: var(--x, red);
  border-color: var(--y) !important;
  & + * {
    color: var(--a);
    --custom: var(--a);
  }
}
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m(--a:red) */
.a {
 background-color: red;
 border-color: var(--y)!important;
 &+* {
  color: var(--a);
  --custom: var(--a)
 }
}`),
            );
        });

        it("custom properties of the rule #9", function () {
            return transform(
                `
@mixin --m {
  color: var(--color);
  & > * { color: var(--color) }
  & + * { color: var(--color) }
}
.a { --color: red !important; --color: blue; @apply --m; }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m */
.a {
 --color: red !important;
 --color: blue;
 color: red;
 &>* {
  color: red
 }
 &+* {
  color: var(--color)
 }
}`),
            );
        });

        it("private properties of a nested rule #10", function () {
            return transform(
                `
@mixin --m(--a: red) {
  & .child {
    @private { --b: blue }
    color: var(--b);
    & + * { color: var(--b, green); background-color: var(--a) }
  }
}
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m(--a:red) */
.a {
 & .child {
  color: blue;
  &+* {
   color: blue;
   background-color: red
  }
 }
}`),
            );
        });

        it("nested mixins #11", function () {
            return transform(
                `
@mixin --inner(--c) { border-color: var(--c) }
@mixin --outer(--a: green) {
  @private { --p: var(--a) }
  @apply --inner(var(--p));
}
@mixin --loop { color: red; @apply --loop; }
.a { @apply --outer(); }
.b { @apply --loop; }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --loop {
 color: red;
 @apply --loop
}
.a {
 border-color: green
}
.b {
 @apply --loop
}`),
            );
        });

        it("mixins that are not evaluated #12", function () {
            return transform(
                `
@mixin --image(--i <image>) { & > * { background-image: var(--i) } }
@mixin --m(--a) { color: var(--a) }
@mixin --unused { color: red }
@mixin --unused { color: blue }
.a { @apply --image(var(--img)); }
.b { @apply --unknown(); }
.c { @apply --m(red, blue); width: 1px }
.d { @apply --m; width: 1px }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --image(--i <image>) {
 &>* {
  background-image: var(--i)
 }
}
@mixin --m(--a) {
 color: var(--a)
}
.a {
 @apply --image(var(--img))
}
.b {
 @apply --unknown
}
.c {
 @apply --m(red,blue);
 width: 1px
}
.d {
 @apply --m;
 width: 1px
}`),
            );
        });

        it("@apply without arguments #13", function () {
            return transform(
                `
.a { @apply --m(); @apply --n( ); @apply --o(1px); @apply --p; @apply --q(/* comment */); }
`,
                { beautify: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 @apply --m;
 @apply --n;
 @apply --o(1px);
 @apply --p;
 @apply --q
}`),
            );
        });

        it("compute calc expression #14", function () {
            return transform(
                `
@mixin --m(--a: 2px) {
  width: calc(var(--a) + 1px);
  height: calc(1px + 2px);
}
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 width: 3px;
 height: 3px
}`),
            );
        });

        it("do not compute calc expression inside mixin #15", function () {
            return transform(
                `
@mixin --m(--a: 2px) {
  width: calc(var(--a) + 1px);
  height: calc(1px + 2px);
  & * { height: calc(1px + 2px) }
}
`,
                { beautify: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --m(--a:2px) {
 width: calc(var(--a) + 1px);
 height: calc(1px + 2px);
 & * {
  height: calc(1px + 2px)
 }
}`),
            );
        });

        it("do not inline css variables inside mixin #16", function () {
            return transform(
                `
:root { --a: 3px }
@mixin --m(--a: 2px) { width: var(--a) }
.a { width: var(--a) }
`,
                { beautify: true, inlineCssVariables: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --m(--a:2px) {
 width: var(--a)
}
.a {
 width: 3px
}`),
            );
        });

        it("mixin nested rules are preserved #17", function () {
            return transform(
                `
@mixin --m(--arg) {
  & + * { color: var(--arg, red); }
  > .child { color: var(--arg, red); }
}
`,
                { beautify: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`@mixin --m(--arg) {
 &+* {
  color: var(--arg,red)
 }
 >.child {
  color: var(--arg,red)
 }
}`),
            );
        });

        it("comma containing arguments parsing #18", function () {
            return transform(
                `
.foo { .bar { color: red } @apply --m(red, {a, b}); color: blue }
`,
                { beautify: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`.foo {
 .bar {
  color: red
 }
 @apply --m(red,{a,b});
 color: blue
}`),
            );
        });

        it("expand nesting rules keeps @apply #19", function () {
            return transform(
                `
.foo { color: red; @apply --m(blue); & .b { color: blue } }
`,
                { beautify: true, expandNestingRules: true },
            ).then((result) =>
                expect(result.code).equals(`.foo {
 color: red;
 @apply --m(blue)
}
.foo .b {
 color: blue
}`),
            );
        });

        it("@apply inside a nested rule #20", function () {
            return transform(
                `
@mixin --m(--a: red) { color: var(--a); & .c { color: var(--a) } }
.a { .b { @apply --m(blue); } }
`,
                { beautify: true, evaluateMixins: true, expandNestingRules: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m(--a:red) */
.a .b {
 color: blue
}
.a .b .c {
 color: blue
}`),
            );
        });

        it("keep the mixins #21", function () {
            return transform(
                `
@mixin --m(--a: red) { color: var(--a) }
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true, keepMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --m(--a:red) {
 color: var(--a)
}
.a {
 color: red
}`),
            );
        });

        it("evaluated mixins are replaced with a comment #22", function () {
            return transform(
                `
@mixin --m(--a: red) { color: var(--a) }
@layer base {
  @mixin --n { width: 1px }
  .b { @apply --m; @apply --n; }
}
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true, removeComments: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m(--a:red) */
@layer base {
 /* @mixin --n */
 .b {
  color: red;
  width: 1px
 }
}
.a {
 color: red
}`),
            );
        });

        it("parameter types #23", function () {
            return transform(
                `
@mixin --m(--a <color>, --b type(<length> | auto): auto) {
  color: var(--a);
  width: var(--b);
}
.a { @apply --m(1px); }
.b { @apply --m(red, 2px); }
.c { @apply --m(red, red); }
.d { @apply --m(var(--color)); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --m(--a <color>,--b type(<length>|auto):auto) {
 color: var(--a);
 width: var(--b)
}
.a {
 @apply --m(1px)
}
.b {
 color: red;
 width: 2px
}
.c {
 @apply --m(red,red)
}
.d {
 color: var(--color);
 width: auto
}`),
            );
        });

        it("comments and whitespace in the arguments #24", function () {
            return transform(
                `
@mixin --m(/* color */ --a: red) { color: var(--a) }
.a { @apply --m(/* no argument */); }
.b { @apply --m( /* a */ blue /* b */ ); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 color: red
}
.b {
 color: blue
}`),
            );
        });

        it("a mixin defined in a conditional rule is visible inside of it #25", function () {
            return transform(
                `
@media (min-width: 100px) {
  @mixin --m { color: red }
  .b { @apply --m; }
}
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@media (width>=100px) {
 .b {
  color: red
 }
}
.a {
 @apply --m
}`),
            );
        });

        it("recursive mixins are not evaluated #26", function () {
            return transform(
                `
@mixin --a { color: red; @apply --b; }
@mixin --b { width: 1px; @apply --a; }
.a { @apply --a; }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@mixin --a {
 color: red;
 @apply --b
}
@mixin --b {
 width: 1px;
 @apply --a
}
.a {
 @apply --a
}`),
            );
        });

        it("contents block #27", function () {
            return transform(
                `
@mixin --one-column() {
  @media (width <= 800px) {
    @contents;
  }
}
.a {
  @apply --one-column {
    display: flex;
    flex-flow: column;
  }
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 @media (width<=800px) {
  display: flex;
  flex-flow: column
 }
}`),
            );
        });

        it("default contents block #28", function () {
            return transform(
                `
@mixin --just-contents() {
  @contents { color: red; }
}
.foo {
  @apply --just-contents;
}
.bar {
  @apply --just-contents {};
  width: 1px;
}
.baz {
  @apply --just-contents { color: blue };
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.foo {
 color: red
}
.bar {
 width: 1px
}
.baz {
 color: blue
}`),
            );
        });

        it("the contents block is copied #29", function () {
            return transform(
                `
@mixin --m(--c: green) {
  @contents { color: var(--c); }
  & > * { @contents; }
}
@mixin --inner { & .x { @contents; } }
@mixin --outer(--x: red) { @apply --inner { color: var(--x) } }
.a { @apply --m { color: var(--brand); top: 0 } }
.b { @apply --m(blue); }
.c { @apply --outer(blue); }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m(--c:green) */
/* @mixin --inner */
/* @mixin --outer(--x:red) */
.a {
 color: var(--brand);
 top: 0;
 &>* {
  color: var(--brand);
  top: 0
 }
}
.b {
 color: blue
}
.c {
 & .x {
  color: blue
 }
}`),
            );
        });

        it("typed arguments are computed on the element #30", function () {
            return transform(
                `
@mixin --same-size(--size <length>) {
  @result {
    &, & > * {
      width: calc(10 * var(--size));
    }
  }
}
.parent {
  font-size: 10px;
  @apply --same-size(1em);
}
.parent > .child {
  font-size: 20px;
}
.other {
  @apply --same-size(2px);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@property --same-size-size-1 {
 syntax: "<length>";
 inherits: true;
 initial-value: 0px
}
.parent {
 font-size: 10px;
 --same-size-size-1: 1em;
 & {
  width: 10em
 }
 &>* {
  width: calc(10*var(--same-size-size-1))
 }
 >.child {
  font-size: 20px
 }
}
@property --same-size-size-2 {
 syntax: "<length>";
 inherits: true;
 initial-value: 0px
}
.other {
 --same-size-size-2: 2px;
 & {
  width: 20px
 }
 &>* {
  width: calc(10*var(--same-size-size-2))
 }
}`),
            );
        });

        it("registered custom property names are unique #31", function () {
            return transform(
                `
@mixin --m(--s <length>, --a <angle>: 0deg) { & > * { width: var(--s); rotate: var(--a) } }
.a { --m-s-1: 0; @apply --m(1em, var(--angle)); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@property --m-s-2 {
 syntax: "<length>";
 inherits: true;
 initial-value: 0px
}
@property --m-a-1 {
 syntax: "<angle>";
 inherits: true;
 initial-value: 0deg
}
.a {
 --m-s-1: 0;
 --m-s-2: 1em;
 --m-a-1: var(--angle);
 &>* {
  width: var(--m-s-2);
  rotate: var(--m-a-1)
 }
}`),
            );
        });

        it("empty contents block without evaluation #32", function () {
            return transform(
                `
.a { @apply --m {}; }
`,
                { beautify: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 @apply --m {
 }
}`),
            );
        });

        it("invalid mixins are ignored #33", function () {
            return transform(
                `
@mixin --ok { color: red }
@mixin --bad(--p, --p) { @apply --ok; width: var(--p) }
@mixin --bad { top: 0 }
.a { @apply --bad; @apply --ok; }
.b { @apply --bad(1px, 2px); }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`@mixin --ok {
 color: red
}
@mixin --bad(--p,--p) {
 @apply --ok;
 width: var(--p)
}
@mixin --bad {
 top: 0
}
.a {
 top: 0;
 color: red
}
.b {
 @apply --bad(1px,2px)
}`),
            );
        });

        it("each nested rule has its own context #34", function () {
            return transform(
                `
@mixin --m(--a: red) {
  & .child {
    @private { --b: blue }
    & + * { color: var(--b, green); background-color: var(--a) }
    & > .x { @private { --c: 1px } top: var(--c) }
    & > .y { top: var(--c, 2px) }
  }
  & + * { color: var(--a, yellow); & .z { color: var(--a, pink) } }
}
.a { @apply --m; }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m(--a:red) */
.a {
 & .child {
  &+* {
   color: blue;
   background-color: red
  }
  &>.x {
   top: 1px
  }
  &>.y {
   top: var(--c,2px)
  }
 }
 &+* {
  color: #ff0;
  & .z {
   color: pink
  }
 }
}`),
            );
        });

        it("the mixins that are not referenced are dropped #35", function () {
            return transform(
                `
@mixin --untyped(--size) {
  &, & > *, & > * > * {
    border-width: var(--size);
  }
}
@mixin --typed(--size <length>) {
  &, & > *, & > * > * {
    border-width: var(--size);
  }
}


section {
  @apply --untyped(2px);
}
section > h1 {
  --size: 4px;
}
section > h1 > small {
  --size: 3px;
}
`,
                { beautify: true, evaluateMixins: true, removeComments: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --untyped(--size) */
/* @mixin --typed(--size <length>) */
section {
 &,&>*,&>*>* {
  border-width: 2px
 }
 >h1 {
  --size: 4px;
  >small {
   --size: 3px
  }
 }
}`),
            );
        });

        it("mixins that contain conditional rules are evaluated #36", function () {
            return transform(
                `
@mixin --one-column() {
  @media (width <= 800px) {
    @contents;
  }
}
@mixin --gradient-text(--from <color>: mediumvioletred) {
  color: var(--from);
  @supports (background-clip: text) {
    color: transparent;
  }
}
@mixin --c { & > * { @container (width > 10px) { color: red } } }
.a {
  @apply --one-column {
    display: flex;
  }
  @apply --gradient-text(pink);
  @apply --c;
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.a {
 color: pink;
 @media (width<=800px) {
  display: flex
 }
 @supports (background-clip:text) {
  color: #0000
 }
 &>* {
  @container (width>10px) {
   color: red
  }
 }
}`),
            );
        });

        it("mixins and functions are visible in the rule or the at-rule that contains them #37", function () {
            return transform(
                `
@mixin --m { color: red }
@media (min-width: 10px) {
  @mixin --m { color: green }
  .a { @apply --m; }
}
@media (min-width: 10px) {
  .b { @apply --m; }
}
@layer base {
  @mixin --l { top: 0 }
  .c { @apply --l }
}
.d { @apply --l; @apply --m; }
@supports (display: grid) {
  @function --f() { result: 1px }
  .e { top: --f() }
}
.g { top: --f() }
@media (min-width: 10px) {
  @supports (display: grid) {
    .h { top: --f(); @apply --m }
  }
}
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @mixin --m */
@media (width>=10px) {
 /* @mixin --m */
 .a {
  color: green
 }
}
@media (width>=10px) {
 .b {
  color: red
 }
}
@layer base {
 /* @mixin --l */
 .c {
  top: 0
 }
}
.d {
 @apply --l;
 color: red
}
@supports (display:grid) {
 /* @function --f() */
 .e {
  top: 1px
 }
}
.g {
 top: --f()
}
@media (width>=10px) {
 @supports (display:grid) {
  .h {
   top: --f();
   color: red
  }
 }
}`),
            );
        });

        it("a mixin defined in an at-rule is not visible outside of it #38", function () {
            return transform(
                `
@media (min-width: 100px) {
    
@mixin --only-descs(--arg) {
  color: var(--arg);
  & + * { color: var(--arg, red); }
}
.foo {
  @apply --only-descs(green);
}
.s {
    @apply --only-descs(yellow);
}
}
.s {
    @apply --only-descs(brown);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@media (width>=100px) {
 .foo {
  color: green;
  &+* {
   color: red
  }
 }
 .s {
  color: #ff0;
  &+* {
   color: red
  }
 }
}
.s {
 @apply --only-descs(brown)
}`),
            );
        });

        it("sync api #39", function () {
            expect(
                transformSync(
                    `
@mixin --only-descs(--arg) {
  color: var(--arg);
  &  + * { color: var(--arg, red); }
}
.foo {
  @apply --only-descs(green);
}
.bar {
  @apply --only-descs(green);
}
`,
                    { beautify: true, evaluateMixins: true, expandNestingRules: true },
                ).code,
            ).equals(`.foo {
 color: green
}
.foo+* {
 color: red
}
.bar {
 color: green
}
.bar+* {
 color: red
}`);
        });
    });

    describe("evaluate custom functions", function () {
        it("custom function call #1", function () {
            return transform(
                `
@function --negative(--value) {
  result: calc(-1 * var(--value));
}
.x {
  padding: --negative(var(--gap));
  margin: 1px --negative(2px) 3px;
}
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @function --negative(--value) */
.x {
 padding: calc(-1*var(--gap));
 margin: 1px calc(-1*2px)3px
}`),
            );
        });

        it("local variables, default values and nested calls #2", function () {
            return transform(
                `
@function --double(--v <length>: 1px) returns <length> {
  --two: 2;
  result: calc(var(--two) * var(--v));
}
@function --quad(--v) {
  --inner: --double(var(--v));
  result: --double(var(--inner));
}
.x {
  width: --double();
  height: --quad(3px);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.x {
 width: 2px;
 height: 12px
}`),
            );
        });

        it("the variables of the calling function are visible #3", function () {
            return transform(
                `
@function --uses-caller() { result: var(--k, 0px); }
@function --outer(--k) { result: --uses-caller(); }
.x {
  top: --outer(5px);
  left: --uses-caller();
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.x {
 top: 5px;
 left: var(--k,0)
}`),
            );
        });

        it("calls that are not evaluated #4", function () {
            return transform(
                `
@function --t(--v <length>) returns <length> { result: var(--v); }
@function --r() returns <color> { result: 1px; }
@function --cond() { result: 1px; @media (width > 1px) { result: 2px } }
@function --rec(--n) { result: --rec(var(--n)); }
@function --twice() { result: 1px }
@function --twice() { result: 2px }
.x {
  a: --t(red);
  b: --t();
  c: --t(1px, 2px);
  d: --r();
  e: --cond();
  f: --rec(1);
  g: --twice();
  h: --unknown(1px);
  i: --t(2px);
  --j: --t(3px);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@function --t(--v <length>)returns <length> {
 result: var(--v)
}
@function --r()returns <color> {
 result: 1px
}
@function --cond() {
 @media (width>1px) {
  result: 2px
 }
 result: 1px
}
@function --rec(--n) {
 result: --rec(var(--n))
}
@function --twice() {
 result: 2px
}
.x {
 a: --t(red);
 b: --t();
 c: --t(1px,2px);
 d: --r();
 e: --cond();
 f: --rec(1);
 g: --twice();
 h: --unknown(1px);
 i: 2px;
 --j: --t(3px)
}`),
            );
        });

        it("invalid result #5", function () {
            return transform(
                `
@function --none() { --a: 1px; }
@function --cycle() { --a: var(--b); --b: var(--a); result: var(--a); }
.x {
  color: --none() !important;
  --v: --none();
  width: --cycle();
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@function --none() {
 --a: 1px
}
@function --cycle() {
 --a: var(--b);
 --b: var(--a);
 result: var(--a)
}
.x {
 color: --none()!important;
 --v: --none();
 width: --cycle()
}`),
            );
        });

        it("custom functions and mixins #6", function () {
            return transform(
                `
@function --first(--list) { result: var(--list); }
@mixin --m(--size: 4px) {
  width: --first(var(--size));
  & > * { height: calc(--first(var(--size)) + 1px) }
}
.x {
  font-family: --first({Arial, serif});
  @apply --m;
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.x {
 font-family: Arial,serif;
 width: 4px;
 &>* {
  height: 5px
 }
}`),
            );
        });

        it("the definitions referenced by a definition that is kept are kept #7", function () {
            return transform(
                `
@function --neg(--v) { result: calc(-1 * var(--v)); }
@mixin --m(--a) { margin: --neg(var(--a)); }
.a {
  top: --neg(1px);
  @apply --m;
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@function --neg(--v) {
 result: calc(-1*var(--v))
}
@mixin --m(--a) {
 margin: --neg(var(--a))
}
.a {
 top: -1px;
 @apply --m
}`),
            );
        });

        it("keep the custom functions #8", function () {
            return transform(
                `
@function --neg(--v) { result: calc(-1 * var(--v)); }
.a { top: --neg(1px) }
`,
                { beautify: true, evaluateMixins: true, keepMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@function --neg(--v) {
 result: calc(-1*var(--v))
}
.a {
 top: -1px
}`),
            );
        });

        it("do not inline css variables in a function body #9", function () {
            return transform(
                `
:root { --v: 3px }
@function --neg(--v) { result: calc(-1 * var(--v)); }
.a { top: var(--v) }
`,
                { beautify: true, inlineCssVariables: true },
            ).then((result) =>
                expect(result.code).equals(`@function --neg(--v) {
 result: calc(-1*var(--v))
}
.a {
 top: 3px
}`),
            );
        });

        it("a function whose parameters are not unique is dropped #10", function () {
            return transform(
                `
@function --f(--a, --a) { result: var(--a) }
@function --g(--a, --b: {x, --a}) { result: var(--a) }
.x { top: --f(1px); left: --g(1px); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.x {
 top: --f(1px);
 left: 1px
}`),
            );
        });

        it("the custom properties of the call site are visible #11", function () {
            return transform(
                `
@function --add-a-b-c(--b, --c) {
  --c: 300;
  result: calc(var(--a) + var(--b) + var(--c));
  /* uses the --a from the call site's custom property,
     the --b from the function parameter,
     and the --c from the local variable */
}
div {
  --a: 1;
  --b: 2;
  --c: 3;
  z-index: --add-a-b-c(20, 30); /* 321 */
  width: calc(var(--a) * 1px);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`div {
 --a: 1;
 --b: 2;
 --c: 3;
 z-index: 321;
 width: calc(var(--a)*1px)
}`),
            );
        });

        it("the custom functions are not modified when the feature is disabled #12", function () {
            return transform(
                `
@function --add-a-b-c(--b, --c) {
  --c: 300;
  result: calc(var(--a) + var(--b) + var(--c));
}
@function --f(--a, --a) { result: var(--a) }
div {
  --a: 1;
  z-index: --add-a-b-c(20, 30);
  top: --f(1px);
}
`,
                { beautify: true },
            ).then((result) =>
                expect(result.code).equals(`@function --add-a-b-c(--b,--c) {
 --c: 300;
 result: calc(var(--a) + var(--b) + var(--c))
}
@function --f(--a,--a) {
 result: var(--a)
}
div {
 --a: 1;
 z-index: --add-a-b-c(20,30);
 top: --f(1px)
}`),
            );
        });

        it("empty custom functions and mixins are rendered #13", function () {
            return transform(
                `
@function --empty() {}
@function --no-value() { result: ; }
@mixin --m {}
.a {
  top: --empty();
  left: --no-value();
  @apply --m;
}
`,
                { beautify: true },
            ).then((result) =>
                expect(result.code).equals(`@function --empty() {
}
@function --no-value() {
 result: 
}
@mixin --m {
}
.a {
 top: --empty();
 left: --no-value();
 @apply --m
}`),
            );
        });

        it("css-wide keywords of the local variables #14", function () {
            return transform(
                `
@function --body(
  --one: 10px,
  --two: 20px,
  --three: 30px,
) returns <length> {
  --one: initial;
  --two: initial;
  --three: inherit;
  --four: inherit;
  result: calc(var(--one) + var(--two) + var(--three) + var(--four));
}
.foo {
  --one: 1px;
  --two: 2px;
  --three: 3px;
  --four: 4px;
  width: --body(5px);
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.foo {
 --one: 1px;
 --two: 2px;
 --three: 3px;
 --four: 4px;
 width: 32px
}`),
            );
        });

        it("css-wide keywords of the local variables #15", function () {
            return transform(
                `
@function --a() { --x: initial; result: var(--x); }
@function --b() { --x: initial; result: var(--x, 7px); }
@function --c() { --y: inherit; result: var(--y); }
@function --inner() { --k: inherit; result: var(--k); }
@function --outer(--k) { result: --inner(); }
@function --u(--p: 1px) { --p: unset; --q: INITIAL; result: var(--p) var(--q, 2px); }
.x {
  --p: 9px;
  a: --a();
  b: --b();
  c: --c();
  d: --outer(3px);
  e: --u();
}
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`@function --a() {
 --x: initial;
 result: var(--x)
}
/* @function --b() */
/* @function --c() */
/* @function --inner() */
/* @function --outer(--k) */
/* @function --u(--p:1px) */
.x {
 --p: 9px;
 a: --a();
 b: 7px;
 c: var(--y);
 d: 3px;
 e: 9px 2px
}`),
            );
        });

        it("the invalid declarations of a function body are not evaluated #16", function () {
            return transform(
                `
@function --f(--a: 1px) {
  --a: initial --b: 2px;
  result: var(--a);
}
.x { width: --f(); }
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`.x {
 width: 1px
}`),
            );
        });

        it("the result of a function with conditional rules cannot be computed #17", function () {
            return transform(
                `
@function --suitable-font-size() {
  --size: 16px;
  @media (width > 1000px) {
    --size: 20px;
  }
  result: var(--size);
}
@function --s() { result: 1px; @supports (display: grid) { result: 2px } }
@function --c() { --x: 1px; @container (width > 10px) { --x: 2px } result: var(--x); }
@function --plain() { result: 3px; }
.a {
  font-size: --suitable-font-size();
  top: --s();
  left: --c();
  right: --plain();
}
`,
                { beautify: true, evaluateMixins: true },
            ).then((result) =>
                expect(result.code).equals(`@function --suitable-font-size() {
 --size: 16px;
 @media (width>1000px) {
  --size: 20px
 }
 result: var(--size)
}
@function --s() {
 @supports (display:grid) {
  result: 2px
 }
 result: 1px
}
@function --c() {
 --x: 1px;
 @container (width>10px) {
  --x: 2px
 }
 result: var(--x)
}
.a {
 font-size: --suitable-font-size();
 top: --s();
 left: --c();
 right: 3px
}`),
            );
        });

        it("a call that is not evaluated makes the function, the mixin and the declaration fail #18", function () {
            return transform(
                `
@function --bad() { result: 1px; @media (x) { result: 2px } }
@function --ok(--v) { result: calc(2 * var(--v)); }
@function --calls-bad() { result: calc(--bad() + 1px); }
@function --calls-ok() { --l: --ok(1px); result: var(--l); }
@mixin --m-bad(--a: 1px) { width: --bad(); height: --ok(var(--a)); }
@mixin --m-ok(--a: 1px) { height: --ok(var(--a)); & > * { top: --ok(var(--a)) } }
@mixin --m-unknown { width: --unknown(1px) }
.a {
  @apply --m-bad;
  @apply --m-ok(2px);
  @apply --m-unknown;
  left: --calls-bad();
  right: --calls-ok();
  bottom: calc(--ok(1px) + --bad());
}
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`@function --bad() {
 result: 1px;
 @media (x) {
  result: 2px
 }
}
@function --ok(--v) {
 result: calc(2*var(--v))
}
@function --calls-bad() {
 result: calc(--bad() + 1px)
}
/* @function --calls-ok() */
@mixin --m-bad(--a:1px) {
 width: --bad();
 height: --ok(var(--a))
}
/* @mixin --m-ok(--a:1px) */
/* @mixin --m-unknown */
.a {
 @apply --m-bad;
 height: calc(2*2px);
 &>* {
  top: calc(2*2px)
 }
 width: --unknown(1px);
 left: --calls-bad();
 right: calc(2*1px);
 bottom: calc(--ok(1px) + --bad())
}`),
            );
        });

        it("the custom functions called by a mixin do not see its private variables #19", function () {
            return transform(
                `
@function --f() { result: var(--a, 9px); }
@function --g(--x) { result: var(--x); }
@mixin --m(--a: 1px) { @private { --q: 3px } width: --f(); height: --g(var(--a)); top: --g(var(--q)); }
.r { --a: 7px; @apply --m; }
.s { @apply --m; }
`,
                { beautify: true, evaluateMixins: true, minify: false },
            ).then((result) =>
                expect(result.code).equals(`/* @function --f() */
/* @function --g(--x) */
/* @mixin --m(--a:1px) */
.r {
 --a: 7px;
 width: 7px;
 height: 1px;
 top: 3px
}
.s {
 width: var(--a,9px);
 height: 1px;
 top: 3px
}`),
            );
        });
    });
}
