export function run(describe, expect, transform, parse, render, dirname) {

    describe('media queries level 5', function () {
        it('empty query #1', function () {
            return transform(`
@media {
    
    p .a { color: red; }
    p .b { color: red; }
    }
}

`).then((result) => expect(result.code).equals(`p .a,p .b{color:red}`));
        });

        it('error handling #2', function () {
            return transform(`
 @media &test, all, (example, all,), speech {
        
    p .a { color: red; }
    p .b { color: red; }
    }
    }

`).then((result) => expect(result.code).equals(`@media speech{p .a,p .b{color:red}}`));
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

}
