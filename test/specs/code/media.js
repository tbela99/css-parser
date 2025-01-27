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

        it('custom-media #7', function () {

            return transform(`
 /* --modern targets modern devices that support color or hover */
@custom-media --modern (color), (hover);

@media (--modern) and (width > 1024px) {
  .a { color: green; }
}

`).then((result) => expect(result.code).equals(`@custom-media --modern (color),(hover);@media (--modern) and (width>1024px){.a{color:green}}`));
        });

        it('when-else #8', function () {

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
    });

}
