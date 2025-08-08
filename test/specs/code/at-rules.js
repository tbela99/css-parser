export function run(describe, expect, it, transform, parse, render, dirname) {

    describe('media queries level 5', function () {
        it('empty query #1', function () {
            return transform(`
@media {
    
    p .a { color: red; }
    p .b { color: red; }
    }
}

`, {nestingRules: false}).then((result) => expect(result.code).equals(`p .a,p .b{color:red}`));
        });

        it('error handling #2', function () {
            return transform(`
 @media &test, all, (example, all,), speech {
        
    p .a { color: red; }
    p .b { color: red; }
    }
    }

`, {nestingRules: false}).then((result) => expect(result.code).equals(`@media speech{p .a,p .b{color:red}}`));
        });

        it('error handling #3', function () {
            return transform(`
   @media (hover) and (width > 1024px) or (--modern), (color) {
       .a {
           color: green; }
       
   }
`).then((result) => expect(result.code).equals(`@media (color){.a{color:green}}`));
        });

        it('error handling #4', function () {
            return transform(`
  @media (hover) and ((width > 1024px) and (--modern) and (color)), (color) {
       .a {
           color: green; }
       
   }
`).then((result) => expect(result.code).equals(`@media (hover) and ((width>1024px) and (--modern) and (color)),(color){.a{color:green}}`));
        });

        it('error handling #5', function () {
            return transform(`
  @media (hover) and ((width > 1024px) and (--modern) or (color)), (color) {
       .a {
           color: green; }
       
   }
`).then((result) => expect(result.code).equals(`@media (color){.a{color:green}}`));
        });

        it('error handling #6', function () {
            return transform(`
@when media(width >= 400px) and media(pointer: fine) and supports(display: flex) {

.a {
      color: green; }
}
@else  {
  
.a {
      color: red; }
}
@else supports(caret-color: pink) and supports(background: double-rainbow()){

.a {
      color: green; }
}
`, {beautify: true}).then((result) => expect(result.code).equals(`@when media(width>=400px) and media(pointer:fine) and supports(display:flex) {
 .a {
  color: green
 }
}
@else {
 .a {
  color: red
 }
}`));
        });

        it('support font-tech, font-format #7', function () {
            return transform(`

@when font-tech(color-COLRv1) and font-tech(variations) {
  @font-face { font-family: icons; src: url(icons-gradient-var.woff2); }
}
@else font-tech(color-SVG) {
  @font-face { font-family: icons; src: url(icons-gradient.woff2); }
}
@else font-tech(color-COLRv0) {
  @font-face { font-family: icons; src: url(icons-flat.woff2); }
}
@else {
  @font-face { font-family: icons; src: url(icons-fallback.woff2); }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@when font-tech(color-COLRv1) and font-tech(variations) {
 @font-face {
  font-family: icons;
  src: url(icons-gradient-var.woff2)
 }
}
@else font-tech(color-SVG) {
 @font-face {
  font-family: icons;
  src: url(icons-gradient.woff2)
 }
}
@else font-tech(color-COLRv0) {
 @font-face {
  font-family: icons;
  src: url(icons-flat.woff2)
 }
}
@else {
 @font-face {
  font-family: icons;
  src: url(icons-fallback.woff2)
 }
}`));
        });

        it('font-face #8', function () {

            return transform(`

@font-face { font-family: icons; src: url(icons-fallback.woff2);
@supports font-tech(color-COLRv1) {
  @font-face { font-family: icons; src: url(icons-gradient-var.woff2); }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@font-face {
 font-family: icons;
 src: url(icons-fallback.woff2);
 @supports font-tech(color-COLRv1) {
  @font-face {
   font-family: icons;
   src: url(icons-gradient-var.woff2)
  }
 }
}`));
        });

        it('container #9', function () {

            return transform(`

/* condition list */
@container card scroll-state(stuck: top) and
    style(--themeBackground),
    not style(background-color: red),
     style(color: green) and style(background-color: transparent),
     style(--themeColor: blue) or style(--themeColor: purple){
  h2 {
    font-size: 1.5em;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@container card scroll-state(stuck:top) and style(--themeBackground),not style(background-color:red),style(color:green) and style(background-color:transparent),style(--themeColor:blue) or style(--themeColor:purple) {
 h2 {
  font-size: 1.5em
 }
}`));
        });

        it('container #10', function () {

            return transform(`

/* condition list */
@container {
  h2 {
    font-size: 1.5em;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('container #11', function () {

            return transform(`

/* condition list */
@container card {
  h2 {
    font-size: 1.5em;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@container card {
 h2 {
  font-size: 1.5em
 }
}`));
        });

        it('container #12', function () {

            return transform(`

/* condition list */
@container card  card{
  h2 {
    font-size: 1.5em;
  }
}
@container card  style() {
  h2 {
    font-size: 1.5em;
  }
}
@container card  (()) {
  h2 {
    font-size: 1.5em;
  }
}

@container card  ((--themeBackground) and (--themeColor),) {
  h2 {
    font-size: 1.5em;
  }
}

@container card  ((--themeBackground) not (--themeColor)) {
  h2 {
    font-size: 1.5em;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('container #13', function () {

            return transform(`

/* condition list */
@container card ;

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('custom-media #14', function () {

            return transform(`
 /* --modern targets modern devices that support color or hover */
@custom-media --modern (color), (hover);

@media (--modern) and (width > 1024px) {
  .a { color: green; }
}

`).then((result) => expect(result.code).equals(`@custom-media --modern (color),(hover);@media (--modern) and (width>1024px){.a{color:green}}`));
        });

        it('when-else #15', function () {

            return transform(`
@when media(width >= 400px) and media(pointer: fine) and supports(display: flex) {

.a {
      color: green; }
}
@else supports(caret-color: pink) and supports(background: double-rainbow()) {
  
.a {
      color: green; }
}
@else {

.a {
      color: green; }
}
`, {beautify: true}).then((result) => expect(result.code).equals(`@when media(width>=400px) and media(pointer:fine) and supports(display:flex) {
 .a {
  color: green
 }
}
@else supports(caret-color:pink) and supports(background:double-rainbow()) {
 .a {
  color: green
 }
}
@else {
 .a {
  color: green
 }
}`));
        });

        it('counter-syle #16', function () {

            return transform(`

/* condition list */@counter-style thumbs {
  system: cyclic;
  symbols: "\\1F44D";
  suffix: " ";
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@counter-style thumbs {
 system: cyclic;
 symbols: "👍";
 suffix: " "
}`));
        });

        it('counter-style #17', function () {

            return transform(`

/* condition list */
@counter-style  {
  system: cyclic;
  symbols: "\\1F44D";
  suffix: " ";
}

@counter-style thumbs;
@counter-style thumbs thumbs;
@counter-style /* thumbs thumbs */;
@counter-style var();

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('at-rule #18', function () {

            return transform(`@charset  "UTF-8"
`, {beautify: true, removeCharset: false}).then((result) => expect(result.code).equals(``));
        });

        it('at-rule #19', function () {

            return transform(`@charset "UTF-8"
`, {beautify: true, removeCharset: false}).then((result) => expect(result.code).equals(`@charset "UTF-8";`));
        });

        it('at-rule #20', function () {

            return transform(`@charset 'UTF-8'
`, {beautify: true, removeCharset: false}).then((result) => expect(result.code).equals(``));
        });

        it('at-rule #21', function () {

            return transform(`@charset /* erw */ 'UTF-8';
`, {beautify: true, removeCharset: false}).then((result) => expect(result.code).equals(``));
        });

        it('at-rule #22', function () {

            return transform(`@charset /* erw */ "UTF-8";
`, {beautify: true, removeCharset: false}).then((result) => expect(result.code).equals(``));
        });

        it('at-rule #23', function () {

            return transform(`@charset /* erw */"UTF-8";
`, {beautify: true, removeCharset: false}).then((result) => expect(result.code).equals(`@charset "UTF-8";`));
        });
    });

    describe('@import', function () {
        it('import #24', function () {
            return transform(`
@import "custom.css
";
@import url("chrome://communicator/skin/
");

`).then((result) => expect(result.code).equals(``));
        });
        it('import #25', function () {
            return transform(`

@import url("landscape.css") screen and (orientation: landscape);

`).then((result) => expect(result.code).equals(`@import "landscape.css" screen and (orientation:landscape);`));
        });

        it('import #26', function () {
            return transform(`

@import url("gridy.css") supports((not (display: grid)) and (display: flex))
  screen and (max-width: 400px)

`).then((result) => expect(result.code).equals(`@import "gridy.css" supports((not (display:grid)) and (display:flex)) screen and (max-width:400px);`));
        });

        it('import #27', function () {
            return transform(`


@import url("whatever.css")
supports((selector(h2 > p)) and (font-tech(color-COLRv1)));


`).then((result) => expect(result.code).equals(`@import "whatever.css" supports((selector(h2>p)) and (font-tech(color-COLRv1)));`));
        });

        it('import #28', function () {
            return transform(`


@import url("whatever.css")
supports((selector(h2 > p)) and (font-tech(color-COLRv1))) {

}

`).then((result) => expect(result.code).equals(``));
        });

        it('import #28', function () {
            return transform(`

@import "theme.css" layer("bar");
@import "theme.css" layer();
@import "style.css" layer;

`, {beautify: true}).then((result) => expect(result.code).equals(`@import "style.css" layer;`));
        });
    });


    describe('@document', function () {
        it('document #30', function () {
            return transform(`
@document url("https://www.example.com/")
{
  h1 {
    color: green;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@document url(https://www.example.com/) {
 h1 {
  color: green
 }
}`));
        });
        it('document #31', function () {
            return transform(`

@document url("http://www.w3.org/"),
          url-prefix("http://www.w3.org/Style/"),
          domain("mozilla.org"),
          media-document("video"),
          regexp("https:.*") {
  /* CSS rules here apply to:
     - The page "http://www.w3.org/"
     - Any page whose URL begins with "http://www.w3.org/Style/"
     - Any page whose URL's host is "mozilla.org"
       or ends with ".mozilla.org"
     - Any standalone video
     - Any page whose URL starts with "https:" */

  /* Make the above-mentioned pages really ugly */
  body {
    color: purple;
    background: yellow;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@document url(http://www.w3.org/),url-prefix("http://www.w3.org/Style/"),domain("mozilla.org"),media-document("video"),regexp("https:.*") {
 body {
  color: purple;
  background: #ff0
 }
}`));
        });
    });


    describe('@keyframes', function () {
        it('keyframes #32', function () {
            return transform(`

    @-webkit-keyframes flash {
            from,
            50%,
                100% {
                opacity: 1;
            }

            25%,
            75% {
                opacity: 0;
            }
        }
`, {beautify: true}).then((result) => expect(result.code).equals(`@-webkit-keyframes flash {
 0%,50%,to {
  opacity: 1
 }
 25%,75% {
  opacity: 0
 }
}`));
        });

        it('keyframes #33', function () {
            return transform(`

@keyframes slide-right {

  from {
    margin-left: 0px;
  }

  50% {
    margin-left: 110px;
    opacity: 1;
  }

  50% {
    opacity: 0.9;
  }

  to {
    margin-left: 200px;
  }

}

@keyframes slide-right {

  50% {
    margin-left: 110px;
    opacity: 1;
  }

  50% {
    opacity: 0.9;
    margin-left: 100px;
  }

  100% {
    margin-left: 250px;
  }

}
`, {beautify: true}).then((result) => expect(result.code).equals(`@keyframes slide-right {
 50% {
  margin-left: 100px;
  opacity: .9
 }
 to {
  margin-left: 250px
 }
}`));
        });

        it('keyframes #34', function () {
            return transform(`

@keyframes slide-right {

  from {
    margin-left: 0px;
  }

  50% {
    margin-left: 110px;
    opacity: 1;
  }

  50% {
    opacity: 0.9;
  }

  to {
    margin-left: 200px;
  }

}

@keyframes slide-right {

  50% {
    margin-left: 110px;
    opacity: 1;
  }

  50% {
    opacity: 0.9;
    margin-left: 100px;
  }

  100% {
    margin-left: 250px;
  }

}


            @keyframes slide-in {
  from, 13%, 0% {
    transform: translateX(0%);
  }

  to, 100% {
    transform: translateX(100%);
  }
}


@keyframes important1 {
  from {
    margin-top: 50px;
  }
  50% {
    margin-right: 150px !important; /* ignored */
  }
  to {
    margin-top: 100px;
  }
}

@keyframes important2 {
  from {
    margin-top: 50px;
  }
  0% {
    margin-bottom: 100px;
  }
  to {
    margin-top: 150px !important; /* ignored */
    margin-bottom: 50px;
  }
}
`, {beautify: true}).then((result) => expect(result.code).equals(`@keyframes slide-right {
 50% {
  margin-left: 100px;
  opacity: .9
 }
 to {
  margin-left: 250px
 }
}
@keyframes slide-in {
 0%,13% {
  transform: translateX(0)
 }
 to {
  transform: translateX(100%)
 }
}
@keyframes important1 {
 0% {
  margin-top: 50px
 }
 to {
  margin-top: 100px
 }
}
@keyframes important2 {
 0% {
  margin-top: 50px;
  margin-bottom: 100px
 }
 to {
  margin-bottom: 50px
 }
}`));
        });
    });


    describe('other', function () {
        it('font-palette-values #33', function () {
            return transform(`
@font-palette-values --identifier {
  font-family: Bixa;
}
.my-class {
  font-palette: --identifier;
}
`, {beautify: true}).then((result) => expect(result.code).equals(`@font-palette-values --identifier {
 font-family: Bixa
}
.my-class {
 font-palette: --identifier
}`));
        });

        it('font-palette-values #34', function () {
            return transform(`
@font-palette-values identifier {
  font-family: Bixa;
}
.my-class {
  font-palette: --identifier;
}
`, {beautify: true}).then((result) => expect(result.code).equals(`.my-class {
 font-palette: --identifier
}`));
        });

        it('font-palette-values #35', function () {
            return transform(`
@font-palette-values identifier unexpected {
  font-family: Bixa;
}
.my-class {
  font-palette: --identifier;
}
`, {beautify: true}).then((result) => expect(result.code).equals(`.my-class {
 font-palette: --identifier
}`));
        });

        it('font-palette-values #36', function () {
            return transform(`
@font-palette-values identifier;
.my-class {
  font-palette: --identifier;
}
`, {beautify: true}).then((result) => expect(result.code).equals(`.my-class {
 font-palette: --identifier
}`));
        });

        it('font-palette-values #37', function () {
            return transform(`
@font-palette-values {

  font-family: Bixa;
}
.my-class {
  font-palette: --identifier;
}
`, {beautify: true}).then((result) => expect(result.code).equals(`.my-class {
 font-palette: --identifier
}`));
        });

        it('font-palette-values #38', function () {
            return transform(`
@font-feature-values Font Name {
  font-display: swap;
  @styleset {
    nice-style: 12;
  }
  @swash {
    fancy: 2;
  }
}

`, {beautify: true}).then((result) => expect(result.code).equals(`@font-feature-values Font Name {
 font-display: swap;
 @styleset {
  nice-style: 12
 }
 @swash {
  fancy: 2
 }
}`));
        });

        it('font-palette-values #39', function () {
            return transform(`
/* Targets all the pages */
@page {
  size: 8.5in 9in;
  margin-top: 4in;
}

/* Targets all even-numbered pages */
@page :left {
  margin-top: 4in;
}

/* Targets all odd-numbered pages */
@page :right {
  size: 11in;
  margin-top: 4in;
}

/* Targets all selectors with \`page: wide;\` set */
@page wide {
  size: a4 landscape;
}

@page {
  /* margin box at top right showing page number */
  @top-right {
    content: "Page " counter(pageNumber);
  }
}


`, {beautify: true}).then((result) => expect(result.code).equals(`@page {
 size: 8.5in 9in;
 margin-top: 4in
}
@page :left {
 margin-top: 4in
}
@page :right {
 size: 11in;
 margin-top: 4in
}
@page wide {
 size: a4 landscape
}
@page {
 @top-right {
  content: "Page " counter(pageNumber)
 }
}`));
        });

        it('font-palette-values #40', function () {
            return transform(`
  /* margin box at top right showing page number */
  @top-right {
    content: "Page " counter(pageNumber);
  }
}


`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('font-palette-values #41', function () {
            return transform(`
  /* margin box at top right showing page number */
  @top-right no;
}


`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('font-palette-values #40', function () {
            return transform(`
  /* margin box at top right showing page number */
  @top-right {
    content: "Page " counter(pageNumber);
  }
}


`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('keyframes #42', function () {
            return transform(`

    @keyframes {

            from {
                margin-left: 0px;
            }

            50% {
                margin-left: 110px;
            opacity: 1;
        }

            50% {
                opacity: 0.9;
            }

            to {
                margin-left: 200px;
            }

        }

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('keyframes #43', function () {
            return transform(`

    @keyframes /* 1 */ {

            from {
                margin-left: 0px;
            }

            50% {
                margin-left: 110px;
            opacity: 1;
        }

            50% {
                opacity: 0.9;
            }

            to {
                margin-left: 200px;
            }

        }

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

        it('keyframes #44', function () {
            return transform(`

    @keyframes /* 1 */ test test1 {

            from {
                margin-left: 0px;
            }

            50% {
                margin-left: 110px;
            opacity: 1;
        }

            50% {
                opacity: 0.9;
            }

            to {
                margin-left: 200px;
            }

        }

`, {beautify: true}).then((result) => expect(result.code).equals(``));
        });

    });
    }
