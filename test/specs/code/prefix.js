
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

        it('all prefixed #5', function () {
            return transform(`

::-webkit-input-placeholder {
  color: gray;
}

::-moz-placeholder {
  color: gray;
}

:-ms-input-placeholder {
  color: gray;
}

::-ms-input-placeholder {
  color: gray;
}

::placeholder {
  color: gray;
}

@supports selector(:-ms-input-placeholder) {


:-ms-input-placeholder {
  color: gray;
}
}

.image {
  background-image: url(image@1x.png);
}
@media (-webkit-min-device-pixel-ratio: 2), (-o-min-device-pixel-ratio: 2/1), (min-resolution: 2dppx) {
  .image {
    background-image: url(image@2x.png);
  }

}


@-webkit-keyframes bar {

from, 0% {

height: 10px;
}
}

@keyframes bar {

from, 0% {

height: 10px;
}
}
.example {

    -moz-animation: bar 1s infinite;
    display: -ms-grid;
    display: grid;
    -webkit-transition: all .5s;
    -o-transition: all .5s;
    transition: all .5s;
    -webkit-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
    background: -o-linear-gradient(top, white, black);
    background: -webkit-gradient(linear, left top, left bottom, from(white), to(black));
    background: linear-gradient(to bottom, white, black);
}

.site{
   display:-ms-grid;
   display:grid;   -ms-grid-columns:2fr 1fr;
   grid-template-columns:2fr 1fr;
   grid-template-areas:"header header"
                       "title sidebar"
                       "main sidebar"
                       "footer footer";
}
.site > *{padding:30px; color:#fff; font-size:20px;}
.mastheader{
   -ms-grid-row:1;
   -ms-grid-column:1;
   -ms-grid-column-span:2;
   grid-area:header;
}
.page-title{
   -ms-grid-row:2;
   -ms-grid-column:1;
   grid-area:title;
}
.main-content{
   -ms-grid-row:3;
   -ms-grid-column:1;
   grid-area:main;
}
.sidebar{
   -ms-grid-row:2;
   -ms-grid-row-span:2;
   -ms-grid-column:2;
   grid-area:sidebar;
}
.footer{
   -ms-grid-row:4;
   -ms-grid-column:1;
   -ms-grid-column-span:2;
   grid-area:footer;
}
a {
  -webkit-transition: -webkit-transform 1s;
  transition: -ms-transform 1s;
  transition: transform 1s
}
`, {
                removePrefix: true,
                removeDuplicateDeclarations: false,
                beautify: true
            }).then(result => expect(result.code).equals(`::placeholder {
 color: grey;
 color: grey;
 color: grey;
 color: grey;
 color: grey
}
@supports selector(::placeholder) {
 ::placeholder {
  color: grey
 }
}
.image {
 background-image: url(image@1x.png)
}
@media (min-resolution:2x),(-o-min-device-pixel-ratio:2/1),(min-resolution:2x) {
 .image {
  background-image: url(image@2x.png)
 }
}
@keyframes bar {
 0% {
  height: 10px
 }
}
.example,.site {
 display: grid;
 display: grid
}
.site {
 grid-template-columns: 2fr 1fr;
 grid-template-columns: 2fr 1fr;
 grid-template-areas: "header header""title sidebar""main sidebar""footer footer"
}
.example {
 animation: bar 1s infinite;
 transition: all .5s;
 transition: all .5s;
 transition: all .5s;
 user-select: none;
 user-select: none;
 user-select: none;
 user-select: none;
 background: -o-linear-gradient(top,#fff,#000);
 background: -webkit-gradient(linear,left top,left bottom,from(#fff),to(#000));
 background: linear-gradient(to bottom,#fff,#000)
}
.site>* {
 padding: 30px;
 color: #fff;
 font-size: 20px
}
.mastheader {
 grid-row: 1;
 grid-column: 1;
 grid-column-end: 2;
 grid-area: header
}
.page-title {
 grid-row: 2;
 grid-column: 1;
 grid-area: title
}
.main-content {
 grid-row: 3;
 grid-column: 1;
 grid-area: main
}
.sidebar {
 grid-row: 2;
 grid-row-end: 2;
 grid-column: 2;
 grid-area: sidebar
}
.footer {
 grid-row: 4;
 grid-column: 1;
 grid-column-end: 2;
 grid-area: footer
}
a {
 transition: transform 1s;
 transition: transform 1s;
 transition: transform 1s
}`));
        });

    });
}