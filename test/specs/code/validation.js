export function run(describe, expect, transform, parse, render, dirname, readFile) {

    describe('selector validation', function () {

        it('selector validation #1', function () {
            return parse(`
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

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`.s:is([type=text],[type=text i],[type=text s],[type=text i]+b,:focus) {
 --animate-duration: 1s
}`));
        });

        it('keyframe selector validation #2', function () {
            return transform(`

    @-webkit-keyframes flash {
            from,
            50%,
                to {
                opacity: 1;
            }

            25%,
            75% {
                opacity: 0;
            }
        }

`).then(result => expect(render(result.ast, {minify: false, validation: true}).code).equals(`@-webkit-keyframes flash {
 from,50%,to {
  opacity: 1
 }
 25%,75% {
  opacity: 0
 }
}`));
        });

        it('selector validation #3', function () {
            return parse(`
html, body, div, span, applet, object, iframe,
            h1, h2, h3, h4, h5, h6, p, blockquote, pre,
            a, abbr, acronym, address, big, cite, code,
            del, dfn, em, img, ins, kbd, q, s, samp,
            small, strike, strong, sub, sup, tt, var,
        b, u, i, center,
            dl, dt, dd, ol, ul, li,
            fieldset, form, label, legend,
            table, caption, tbody, tfoot, thead, tr, th, td,
            article, aside, canvas, details, embed,
            figure, figcaption, footer, header, hgroup,
            menu, nav, output, ruby, section, summary,
            time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
        }
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video {
 margin: 0;
 padding: 0;
 border: 0;
 font: inherit;
 vertical-align: baseline
}`));
        });


        it('nested selector validation #4', function () {
            return parse(`

[foo="bar help" b] {
    color: red;
}

.foo-bar {
 width: 12px;
 height: 25%;
 >a {
  color: #fff
 }
 >a, + a, ~ a b {
  color: #fff
 }
& b {
  color: #fff
 }
}

 >a {
  color: #fff
 }
 >a, + a, ~ a b {
  color: #fff
 }
& b {
  color: #fff
 }
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`.foo-bar {
 width: 12px;
 height: 25%;
 >a {
  color: #fff
 }
 >a,+a,~a b {
  color: #fff
 }
 & b {
  color: #fff
 }
}`));
        });

        it('nested selector validation #5', function () {
            return transform(`

.pure-table-bordered tbody > tr:last-child > td {
    border-bottom-width: 0;
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
    border-color: #34edc7;
    border-style: medium;
}
`).then(result => expect(render(result.ast, {minify: false, validation: true}).code).equals(`.pure-table-bordered tbody>tr:last-child>td {
 border-width: 0;
 border-color: #34edc7;
 border-style: medium
}`));
        });

        it('selector without validation #6', function () {
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
`).then(result => expect(render(result.ast, {minify: false, validation: true}).code).equals(`.s:is([type=text],[type=text i],[type=text s],[type=text i]+b,:focus) {
 --animate-duration: 1s
}`));
        });


    });


    describe('at-rule validation', function () {

        it('media validation #1', function () {
            return parse(`@import "styles.css"  screen
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@import "styles.css" screen;`));
        });

        it('media validation #2', function () {
            return parse(`@import "styles.css"  "screen"
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(``));
        });

        it('media validation #3', function () {
            return parse(`@import "styles.css" bar,baz"
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(``));
        });

        it('support validation #4', function () {
            return parse(`
@supports (display: grid) {
  div {
    display: grid;
  }
}
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports (display:grid) {
 div {
  display: grid
 }
}`));
        });

        it('support validation #5', function () {
            return parse(`
@supports not (display: grid) {
  div {
    float: right;
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports not (display:grid) {
 div {
  float: right
 }
}`));

        });

        it('support validation #6', function () {
            return parse(`
@supports (display: grid) and (not (display: inline-grid)) {
  div {
    float: right;
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports (display:grid) and (not (display:inline-grid)) {
 div {
  float: right
 }
}`));
        });


        it('support validation #7', function () {
            return parse(`
@supports not (not (transform-origin: 2px)) {
  div {
    float: right;
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports not (not (transform-origin:2px)) {
 div {
  float: right
 }
}`));
        });

        it('support validation #8', function () {
            return parse(`
@supports font-format(opentype) {
  div {
    float: right;
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports font-format(opentype) {
 div {
  float: right
 }
}`));
        });

        it('support validation #9', function () {
            return parse(`
@supports font-tech(color-COLRv1) {
  div {
    float: right;
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports font-tech(color-COLRv1) {
 div {
  float: right
 }
}`));
        });

        it('support validation #10', function () {
            return parse(`
@supports (display: table-cell) and
  ((display: list-item) and (display: contents)) {
  div {
    float: right;
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@supports (display:table-cell) and ((display:list-item) and (display:contents)) {
 div {
  float: right
 }
}`));
        });

    });


    describe('declaration validation', function () {

        it('@page #11', function () {
            return parse(`
@page {
  size: 8.5in 9in;
  margin-top: 4in;
    animation: view;
}
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@page {
 size: 8.5in 9in;
 margin-top: 4in;
 animation: view
}`));
        });

        it('@page #12', function () {
            //   foo: bar;
            return parse(`
@page {
  size: 8.5in 9in;
  margin-top: 4in;
    animation: view;
}
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@page {
 size: 8.5in 9in;
 margin-top: 4in;
 animation: view
}`));
        });

        it('@page #13', function () {
            return parse(`

/* Targets all even-numbered pages */
@page :left {
  margin-top: 4in;
}
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`/* Targets all even-numbered pages */
@page :left {
 margin-top: 4in
}`));
        });

        it('@page #14', function () {
            return parse(`

@page :right {
  size: 11in;
  margin-top: 4in;
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@page :right {
 size: 11in;
 margin-top: 4in
}`));
        });

        it('@page #15', function () {
            return parse(`

@page wide {
  size: a4 landscape;
}


`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@page wide {
 size: a4 landscape
}`));
        });

        it('@page #16', function () {
            return parse(`

@page {
  /* margin box at top right showing page number */
  @top-right {
    content: "Page " counter(pageNumber);
  }
}

`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@page {
 /* margin box at top right showing page number */
 @top-right {
  content: "Page " counter(pageNumber)
 }
}`));
        });


        it('media validation #17', function () {
            return parse(`@import "styles.css" tv,all"
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@import "styles.css" tv,all;`));
        });

        it('document validation #18', function () {
            return parse(`@namespace svg url('http://www.w3.org/2000/svg')"
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@namespace svg url(http://www.w3.org/2000/svg);`));
        });
    });

}