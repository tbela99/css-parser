export function run(describe, expect, transform, parse, render) {

    describe('doParse block', function () {

        it('similar rules #1', function () {
            const file = `
.clear {
  width: 0;
  height: 0;
}

.clearfix:before {

  height: 0;
  width: 0;
}`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.clear,.clearfix:before{width:0;height:0}`));
        });

        it('similar rules #2', function () {
            const file = `
.clear {
  width: 0;
  height: 0;
}

.clearfix:before {

  height: 0;
  width: 0;
}`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.clear,.clearfix:before{width:0;height:0}`));
        });

        it('duplicated selector components #3', function () {
            const file = `

:is(.test input[type="text"]), .test input[type="text"], :is(.test input[type="text"], a) {
border-top-color: gold;
border-right-color: red;
border-bottom-color: gold;
border-left-color: red;
`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.test input[type=text],a{border-color:gold red}`));
        });

        it('merge selectors #4', function () {
            const file = `

.blockquote {
    margin-bottom: 1rem;
    font-size: 1.25rem
}

.blockquote > :last-child {
    margin-bottom: 0
}

.blockquote-footer {
    margin-top: -1rem;
    margin-bottom: 1rem;
    font-size: .875em;
    color: #6c757d
}

.blockquote-footer::before {
    content: "— "
}

.img-fluid {
    max-width: 100%;
    height: auto
}

.img-thumbnail {
    padding: .25rem;
    background-color: var(--bs-body-bg);
    border: var(--bs-border-width) solid var(--bs-border-color);
    border-radius: var(--bs-border-radius);
    max-width: 100%;
    height: auto
}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.blockquote{margin-bottom:1rem;font-size:1.25rem}.blockquote>:last-child{margin-bottom:0}.blockquote-footer{margin-top:-1rem;margin-bottom:1rem;font-size:.875em;color:#6c757d}.blockquote-footer:before{content:"— "}.img-fluid,.img-thumbnail{max-width:100%;height:auto}.img-thumbnail{padding:.25rem;background-color:var(--bs-body-bg);border:var(--bs-border-width) solid var(--bs-border-color);border-radius:var(--bs-border-radius)}`));
        });

        it('merge selectors #5', function () {
            const file = `

.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.nav-pills:is(.nav-link.active,.show>.nav-link){color:var(--bs-nav-pills-link-active-color);background-color:var(--bs-nav-pills-link-active-bg)}`));
        });

        it('merge selectors #6', function () {
            const file = `

.foo-bar~div .special\\{ {
content: '\\21 now\\21';
}
.card {
    --bs-card-inner-border-radius: calc(var(--bs-border-radius) - (var(--bs-border-width)));
}

\\`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.foo-bar~div .special\\{{content:'!now!'}.card{--bs-card-inner-border-radius:calc(var(--bs-border-radius) - var(--bs-border-width))}`));
        });

        it('merge selectors #7', function () {
            const file = `

@media (max-width: 575.98px) and (prefers-reduced-motion: reduce) {
    .offcanvas-sm {
        transition: none
    }
}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`@media (max-width:575.98px) and (prefers-reduced-motion:reduce){.offcanvas-sm{transition:0s}}`));
        });

        it('merge selectors #8', function () {
            const file = `

:root .fa-flip-both, :root .fa-flip-horizontal, :root .fa-flip-vertical, :root .fa-rotate-180, :root .fa-rotate-270, :root .fa-rotate-90 {
    -webkit-filter: none;
    filter: none
}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`:root:is(.fa-flip-both,.fa-flip-horizontal,.fa-flip-vertical,.fa-rotate-180,.fa-rotate-270,.fa-rotate-90){-webkit-filter:none;filter:none}`));
        });

        it('merge selectors #9', function () {
            const file = `
.bs-popover-auto[data-popper-placement^=top]>.popover-arrow,.bs-popover-top>.popover-arrow{bottom:calc(-1 * (var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`.bs-popover-auto[data-popper-placement^=top]>.popover-arrow,.bs-popover-top>.popover-arrow{bottom:calc(-1*var(--bs-popover-arrow-height) - var(--bs-popover-border-width))}`));
        });

        it('merge selectors #10', function () {
            const file = `

abbr[title], abbr[data-original-title], abbr>[data-original-title] {
    text-decoration: underline dotted;
    -webkit-text-decoration: underline dotted;
    cursor: help;
    border-bottom: 0;
    -webkit-text-decoration-skip-ink: none;
    text-decoration-skip-ink: none
}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`abbr[title],abbr[data-original-title],abbr>[data-original-title]{text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`));
        });

        it('merge at-rule & escape sequence #11', function () {
            const file = `

@media (max-width: 767px) {.main-heading { font-size: 32px; font-weight: 300; }}
@media (max-width: 767px) {.section { max-width: 100vw; padding-left: 16px; padding-right: 16px; }}
@media (max-width: 767px) {.hero-cta-form, .sign-in-form__third-party-container, .google-sign-in-cta-widget { margin-top: 0px; width: 100%; }}
@media (max-width: 767px) {.babybear\\:z-0 { z-index: 0; }}
@media (max-width: 767px) {.babybear\\:mr-0 { margin-right: 0px; }}
@media (max-width: 767px) {.babybear\\:hidden { display: none; }}
@media (max-width: 767px) {.babybear\\:min-h-\\[0\\] { min-height: 0px; }}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(result.code).equals(`@media (max-width:767px){.main-heading{font-size:32px;font-weight:300}.section{max-width:100vw;padding-left:16px;padding-right:16px}.hero-cta-form,.sign-in-form__third-party-container,.google-sign-in-cta-widget{margin-top:0;width:100%}.babybear\\:z-0{z-index:0}.babybear\\:mr-0{margin-right:0}.babybear\\:hidden{display:none}.babybear\\:min-h-\\[0\\]{min-height:0}}`));
        });

        it('merge at-rule & escape sequence #12', function () {
            const file = `

@media (max-width: 767px) {.main-heading { font-size: 32px; font-weight: 300; }}
@media (max-width: 767px) {.section { max-width: 100vw; padding-left: 16px; padding-right: 16px; }}
@media (max-width: 767px) {.hero-cta-form, .sign-in-form__third-party-container, .google-sign-in-cta-widget { margin-top: 0px; width: 100%; }}
@media (max-width: 767px) {.babybear\\:z-0 { z-index: 0; }}
@media (max-width: 767px) {.babybear\\:mr-0 { margin-right: 0px; }}
@media (max-width: 767px) {.babybear\\:hidden { display: none; }}
@media (max-width: 767px) {.babybear\\:min-h-\\[0\\] { min-height: 0px; }}

`;
            return transform(file, {
                minify: true
            }).then(result => expect(render(result.ast, {minify: false}).code).equals(`@media (max-width:767px) {
 .main-heading {
  font-size: 32px;
  font-weight: 300
 }
 .section {
  max-width: 100vw;
  padding-left: 16px;
  padding-right: 16px
 }
 .hero-cta-form,.sign-in-form__third-party-container,.google-sign-in-cta-widget {
  margin-top: 0;
  width: 100%
 }
 .babybear\\:z-0 {
  z-index: 0
 }
 .babybear\\:mr-0 {
  margin-right: 0
 }
 .babybear\\:hidden {
  display: none
 }
 .babybear\\:min-h-\\[0\\] {
  min-height: 0
 }
}`));
        });

        it('comments #13', function () {
            const file = `
/* this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`.nav-pills {
 .nav-link.active,.show>.nav-link {
  color: var(--bs-nav-pills-link-active-color);
  background-color: var(--bs-nav-pills-link-active-bg)
 }
}`));
        });


        it('comments #14', function () {
            const file = `
/* this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`.nav-pills {
 .nav-link.active,.show>.nav-link {
  color: var(--bs-nav-pills-link-active-color);
  background-color: var(--bs-nav-pills-link-active-bg)
 }
}`));
        });

        it('comments #15', function () {
            const file = `

/* this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
/* this is a comment */
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: false,
                preserveLicense: true
            }).code).equals(`/* this is a comment */
.nav-pills {
 .nav-link.active,.show>.nav-link {
  /* this is a comment */
  color: var(--bs-nav-pills-link-active-color);
  background-color: var(--bs-nav-pills-link-active-bg)
 }
}`));
        });

        it('license comments #16', function () {
            const file = `
/*! this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
/*! this is a comment */
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: false,
                preserveLicense: true
            }).code).equals(`/*! this is a comment */
.nav-pills {
 .nav-link.active,.show>.nav-link {
  /*! this is a comment */
  color: var(--bs-nav-pills-link-active-color);
  background-color: var(--bs-nav-pills-link-active-bg)
 }
}`));
        });

        it('license comments #17', function () {
            const file = `
/*! this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
/*! this is a comment */
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`/*! this is a comment */
.nav-pills {
 .nav-link.active,.show>.nav-link {
  /*! this is a comment */
  color: var(--bs-nav-pills-link-active-color);
  background-color: var(--bs-nav-pills-link-active-bg)
 }
}`));
        });

        it('license comments #18', function () {
            const file = `
/*! this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
/*! this is a comment */
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg) /*! this is a comment */
}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`/*! this is a comment */
.nav-pills {
 .nav-link.active,.show>.nav-link {
  /*! this is a comment */
  color: var(--bs-nav-pills-link-active-color);
  background-color: var(--bs-nav-pills-link-active-bg) /*! this is a comment */
 }
}`));
        });

        it('media query #19', function () {
            const file = `
       @media (resolution >= 2dppx) and (resolution <= 5dppx) {

/*! this is a comment */
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
/*! this is a comment */
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg) /*! this is a comment */
}
}
`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`@media (resolution>=2x) and (resolution<=5x) {
 /*! this is a comment */
 .nav-pills {
  .nav-link.active,.show>.nav-link {
   /*! this is a comment */
   color: var(--bs-nav-pills-link-active-color);
   background-color: var(--bs-nav-pills-link-active-bg) /*! this is a comment */
  }
 }
}`));
        });

        it('media query #20', function () {
            const file = `
       
@media all {.site-header .logo { 
transition: all 0s ease 0s; flex: 0 1 auto; position: relative; align-self: stretch; display: flex; align-items: center; }}

`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`.site-header .logo {
 transition: 0s;
 flex: initial;
 position: relative;
 align-self: stretch;
 display: flex;
 align-items: center
}`));
        });

        it('media query #20', function () {
            const file = `
      
a {
overflow-x: hidden;
overflow-y: hidden;

}
<!-- secret -->
.search-and-account a svg {
/* secret
`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`a {
 overflow: hidden
}`));
        });

        it('selector attributes #21', function () {
            const file = `

:root || E[foo$="bar" i] {

--preferred-width: 20px;
}
.foo-bar ~ div \\\\ {
content: '\\21 now\\21';
}
\\`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`:root||E[foo$=bar i] {
 --preferred-width: 20px
}
.foo-bar~div \\\\ {
 content: '!now!'
}`));
        });

        it('namespace selector attribute #22', function () {
            const file = `

@namespace foo "http://www.example.com";
[foo|att="val"] { color: blue }
 [*|att] { color: yellow }
[|att] { color: green }
[att] { color: green }
\\`;
            return parse(file, {
                minify: true,
                nestingRules: true
            }).then(result => expect(render(result.ast, {
                minify: false,
                removeComments: true,
                preserveLicense: true
            }).code).equals(`@namespace foo "http://www.example.com";
[foo|att=val] {
 color: blue
}
[*|att] {
 color: #ff0
}
[|att],[att] {
 color: green
}`));
        });
    });

    it('namespace selector attribute #23', function () {
        const file = `

.selector {
  background: repeat scroll 0% 0% / auto padding-box border-box none #0000;
  transition: none;
}

`;
        return transform(file).then(result => expect(result.code).equals(`.selector{background:0 0;transition:0s}`));
    });

    it('namespace selector attribute #24', function () {
        const file = `

.selector {
  background: repeat scroll 0% 0% / auto padding-box border-box none red;
  transition: none;
}

`;
        return transform(file).then(result => expect(result.code).equals(`.selector{background:red;transition:0s}`));
    });

    it('namespace selector attribute #25', function () {
        const file = `

.selector {
  background: repeat scroll 0% 0% / auto padding-box none red;
  transition: none;
}

`;
        return transform(file).then(result => expect(result.code).equals(`.selector{background:padding-box red;transition:0s}`));
    });

    it('namespace selector attribute #26', function () {
        const file = `

.selector {
  background: repeat scroll 0% 0% / auto border-box padding-box none red;
  transition: none;
}

`;
        return transform(file).then(result => expect(result.code).equals(`.selector{background:border-box padding-box red;transition:0s}`));
    });

    it('namespace selector attribute #27', function () {
        const file = `

.selector {
  background: repeat scroll 0% 0% / auto border-box none red;
  transition: none;
}

`;
        return transform(file).then(result => expect(result.code).equals(`.selector{background:border-box red;transition:0s}`));
    });

    it('render with parents #28', function () {
        const file = `

@media screen and (min-width: 40em) {
    .featurette-heading {
        font-size: 50px;
    }
    .a {
        color: red;
        width: 3px;
    }
}
`;
        return parse(file).then(result => expect(render(result.ast.chi[0].chi[1].chi[1], {withParents: true}).code).equals(`@media screen and (min-width:40em){.a{width:3px}}`));
    });

    it('render without parents #29', function () {
        const file = `

@media screen and (min-width: 40em) {
    .featurette-heading {
        font-size: 50px;
    }
    .a {
        color: red;
        width: 3px;
    }
}
`;
        return parse(file).then(result => expect(render(result.ast.chi[0].chi[1].chi[1], {withParents: false}).code).equals(`width:3px`));
    });

    it('do not merge pseudo class selectors #30', function () {
        const file = `

.invisible-scrollbar::-webkit-scrollbar {
  display: none;
}
.invisible-scrollbar::-moz-range-thumb {
  display: none;
}
.invisible-scrollbar:has(::-moz-range-thumb) {
  display: none;
}

`;
        return parse(file).then(result => expect(render(result.ast).code).equals(`.invisible-scrollbar::-webkit-scrollbar{display:none}.invisible-scrollbar:is(::-moz-range-thumb,:has(::-moz-range-thumb)){display:none}`));
    });

    it('do not merge pseudo class selectors #31', function () {
        const file = `

.invisible-scrollbar::-moz-range-thumb {
  display: none;
}
.invisible-scrollbar:has(::-moz-range-thumb) {
  display: none;
}

.invisible-scrollbar:is(::-moz-range-thumb) {
  display: none;
}

`;
        return parse(file).then(result => expect(render(result.ast).code).equals(`.invisible-scrollbar:is(::-moz-range-thumb,:has(::-moz-range-thumb)){display:none}`));
    });

    it('do not merge pseudo class selectors #32', function () {
        const file = `

.invisible-scrollbar::-webkit-scrollbar {
  display: none;
}
.invisible-scrollbar::-moz-range-thumb {
  display: none;
}
.invisible-scrollbar:has(::-moz-range-thumb) {
  display: none;
}

.invisible-scrollbar:is(::-moz-range-thumb) {
  display: none;
}

`;
        return parse(file, {nestingRules: true}).then(result => expect(render(result.ast).code).equals(`.invisible-scrollbar{&::-webkit-scrollbar{display:none}&::-moz-range-thumb,&:has(::-moz-range-thumb){display:none}}`));
    });

    it('compound selector #33', function () {
        const file = `

:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);
}
:root {
--preferred-width: 20px;
}
.foo-bar, div#flavor {
    width: calc(calc(var(--preferred-width) + 1px) / 3 + 5px);
    height: calc(100% / 4);}
`;
        return parse(file, {inlineCssVariables: true}).then(result => expect(render(result.ast, {minify: false}).code).equals(`:root {
 /* --color: green */
}
._19_u :focus {
 color: navy
}
:root {
 /* --preferred-width: 20px */
}
.foo-bar,div#flavor {
 width: 12px;
 height: 25%
}`));
    });
}
