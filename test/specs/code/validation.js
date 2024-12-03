import {ValidationLevel} from "../../../dist/lib/ast/types.js";

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
  colo: #fff
 }
`, { validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`.foo-bar {
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
`, {validation: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`@import "styles.css" bar,baz;`));
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

    });
    }