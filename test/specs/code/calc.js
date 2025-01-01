

export function run(describe, expect, transform, parse, render) {

    describe('calc expression', function () {

        it('calc() #1', function () {
            
            return transform(`
.foo {
  width: calc(100px * 2);
  height: calc(((75.37% - 63.5px) - 900px) + (2 * 100px));
}
`).then(result => expect(result.code).equals(`.foo{width:200px;height:calc(75.37% - 763.5px)}`));
        });

        it('calc() #2', function () {
            
            return transform(`.foo {
        height: calc(200% / 6 + 2%/3);
  width: calc(3.5rem + calc(var(--bs-border-width) * 2));
}
`).then(result => expect(result.code).equals(`.foo{height:34%;width:calc(3.5rem + var(--bs-border-width)*2)}`));
        });

        it('calc() #3', function () {
            
            return transform(`.foo {
   bottom:calc(-1*(var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))
}
`).then(result => expect(result.code).equals(`.foo{bottom:calc(-1*var(--bs-popover-arrow-height) - var(--bs-popover-border-width))}`));
        });

        it('calc() #4', function () {
            
            return transform(`
:root {

--preferred-width: 20px;
}
.foo-bar {
    width: calc(var(--preferred-width) + 5px);
}
`, {inlineCssVariables: true}).then(result => expect(result.code).equals(`.foo-bar{width:25px}`));
        });

        it('calc() #5', function () {
            
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

        it('calc() #6', function () {
            
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

        it('calc() #7', function () {
            
            return transform(`

.foo {
        height: calc(100px * 2/ 15 + 2px/3);
}
`).then(result => expect(result.code).equals(`.foo{height:14px}`));
        });

        it('calc() #8', function () {
            
            return transform(`

.foo {
        height: calc(100px * 2/ 15 - 5% - 1px/3);
}
`).then(result => expect(result.code).equals(`.foo{height:calc(13px - 5%)}`));
        });

        it('calc() #9', function () {
            
            return transform(`

.foo {
        height: calc(100px * 2/ 15);
}
`).then(result => expect(result.code).equals(`.foo{height:calc(40px/3)}`));
        });

        it('calc() #10', function () {
            
            return transform(`

.foo {
width: calc(2px * 50%);
height: calc(80% * 50%);
}
`).then(result => expect(result.code).equals(`.foo{width:1px;height:40%}`));
        });

        it('calc() #11', function () {
            
            return transform(`

a {

width: calc(100px * sin(pi / 4))

`).then(result => expect(result.code).equals(`a{width:70.71067811865474px}`));
        });

        it('mod() #12', function () {
            
            return transform(`

.foo{
        margin: mod(29vmin, 6vmin);
}
`).then(result => expect(result.code).equals(`.foo{margin:5vmin}`));
        });

        it('round() #13', function () {
            
            return transform(`

.foo{
        margin: round(up, calc(100px * sin(pi / 4)), 5.5px);
}
`).then(result => expect(result.code).equals(`.foo{margin:71.5px}`));
        });

        it('round() #14', function () {
            
            return transform(`

.foo{
        margin: round(down, calc(100px * sin(pi / 4)), 5.5px);
}
`).then(result => expect(result.code).equals(`.foo{margin:66px}`));
        });

        it('round() #15', function () {
            
            return transform(`

.foo{
        margin: round(nearest, calc(100px * sin(pi / 4)), 5.5px);
}
`).then(result => expect(result.code).equals(`.foo{margin:71.5px}`));
        });

        it('round() #16', function () {
            
            return transform(`

.foo{
        margin: round(to-zero, calc(100px * sin(pi / 4)), 5.5px);
}
`).then(result => expect(result.code).equals(`.foo{margin:66px}`));
        });

        it('min()/max() #17', function () {
            
            return transform(`

.foo{

height: min(calc(100px * sin(pi / 4)), 5.5px);
width: max(calc(100px * sin(pi / 2)), 5.5px);
}
`).then(result => expect(result.code).equals(`.foo{height:5.5px;width:100px}`));
        });

        it('rem() #18', function () {
            
            return transform(`

.foo{

scale: rem(10 * 2, 1.7);
}
`).then(result => expect(result.code).equals(`.foo{scale:1.3}`));
        });

        it('pow() #19', function () {
            
            return transform(`

.foo{

 width: calc(10px * pow(5, 3));
}
`).then(result => expect(result.code).equals(`.foo{width:1250px}`));
        });

        it('pow() #20', function () {
            
            return parse(`

:root {
  --size-0: 100px;
  --size-1: hypot(var(--size-0));
  --size-2: hypot(var(--size-0), var(--size-0));
  );
  --size-3: hypot(
    calc(var(--size-0) * 1.5),
    calc(var(--size-0) * 2)
}
.one {
  width: var(--size-1);
  height: var(--size-1);
}
.two {
  width: var(--size-2);
  height: var(--size-2);
}
.three {
  width: var(--size-3);
  height: var(--size-3);
}

`, {inlineCssVariables: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`:root {
 /* --size-0: 100px */
 /* --size-1: 100px */
 /* --size-2: 141px */
 /* --size-3: 250px */
}
.one {
 width: 100px;
 height: 100px
}
.two {
 width: 141px;
 height: 141px
}
.three {
 width: 250px;
 height: 250px
}`));
        });

        it('pow() #21', function () {

            return parse(`

a {

-moz-transform: rotate(atan2(1rem, -0.5rem));
height: rotate(atan2(pi, 45));
line-height: calc(pi);
transform: rotate(atan2(e, 30));
line-height: calc(pi);
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 -moz-transform: rotate(atan2(1rem,-.5rem));
 height: rotate(atan2(pi,45));
 line-height: calc(pi);
 transform: rotate(atan2(e,30))
}`));
        });

        it('pow() #22', function () {

            return parse(`

a {

width: calc(100px * log(8, 2));
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 width: 300px
}`));
        });

        it('pow() #23', function () {

            return parse(`

a {

width: calc(100px * log(625, 5));
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 width: 400px
}`));
        });

        it('pow() #24', function () {

            return parse(`

a {

width: calc(100px * log(625, 5));
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 width: 400px
}`));
        });

        it('pow() #25', function () {

            return parse(`

a {

width: calc(100px * exp(-1));}
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 width: 36.787944117144235px
}`));
        });

        it('pow() #26', function () {

            return parse(`

a {

width: calc(2px *abs(-1);}
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 width: 2px
}`));
        });

        it('pow() #27', function () {

            return parse(`

a {

width: calc(-2px *sign(-1);}
}
`).then(result => expect(render(result.ast, {minify: false}).code).equals(`a {
 width: 2px
}`));
        });
    });

}