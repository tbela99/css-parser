/* generate from test/specs/block.web-spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform, render, parse} from '../../dist/web/index.js';

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
        }).then(result => f(result.code).equals(`.clear,.clearfix:before{width:0;height:0}`));
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
        }).then(result => f(result.code).equals(`.clear,.clearfix:before{width:0;height:0}`));
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
        }).then(result => f(result.code).equals(`.test input[type=text],a{border-color:gold red}`));
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
    content: "— "
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
        }).then(result => f(result.code).equals(`.blockquote{margin-bottom:1rem;font-size:1.25rem}.blockquote>:last-child{margin-bottom:0}.blockquote-footer{margin-top:-1rem;margin-bottom:1rem;font-size:.875em;color:#6c757d}.blockquote-footer::before{content:"— "}.img-fluid,.img-thumbnail{max-width:100%;height:auto}.img-thumbnail{padding:.25rem;background-color:var(--bs-body-bg);border:var(--bs-border-width) solid var(--bs-border-color);border-radius:var(--bs-border-radius)}`));
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
        }).then(result => f(result.code).equals(`.nav-pills:is(.nav-link.active,.show>.nav-link){color:var(--bs-nav-pills-link-active-color);background-color:var(--bs-nav-pills-link-active-bg)}`));
    });

    it('merge selectors #6', function () {
        const file = `

.card {
    --bs-card-inner-border-radius: calc(var(--bs-border-radius) - (var(--bs-border-width)));
}

`;
        return transform(file, {
            minify: true
        }).then(result => f(result.code).equals(`.card{--bs-card-inner-border-radius:calc(var(--bs-border-radius) - (var(--bs-border-width)))}`));
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
        }).then(result => f(result.code).equals(`@media (max-width:575.98px) and (prefers-reduced-motion:reduce){.offcanvas-sm{transition:none}}`));
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
        }).then(result => f(result.code).equals(`:root:is(.fa-flip-both,.fa-flip-horizontal,.fa-flip-vertical,.fa-rotate-180,.fa-rotate-270,.fa-rotate-90){-webkit-filter:none;filter:none}`));
    });

    it('merge selectors #9', function () {
        const file = `
.bs-popover-auto[data-popper-placement^=top]>.popover-arrow,.bs-popover-top>.popover-arrow{bottom:calc(-1 * (var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))}

`;
        return transform(file, {
            minify: true
        }).then(result => f(result.code).equals(`.bs-popover-auto[data-popper-placement^=top]>.popover-arrow,.bs-popover-top>.popover-arrow{bottom:calc(-1*(var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))}`));
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
        }).then(result => f(result.code).equals(`abbr[title],abbr[data-original-title],abbr>[data-original-title]{text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`));
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
        }).then(result => f(result.code).equals(`@media (max-width:767px){.main-heading{font-size:32px;font-weight:300}.section{max-width:100vw;padding-left:16px;padding-right:16px}.hero-cta-form,.sign-in-form__third-party-container,.google-sign-in-cta-widget{margin-top:0;width:100%}.babybear\\:z-0{z-index:0}.babybear\\:mr-0{margin-right:0}.babybear\\:hidden{display:none}.babybear\\:min-h-\\[0\\]{min-height:0}}`));
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
        }).then(result => f(render(result.ast, {minify: false}).code).equals(`@media (max-width:767px) {
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
        }).then(result => f(render(result.ast, {minify: false, removeComments: true, preserveLicense: true}).code).equals(`.nav-pills {
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
        }).then(result => f(render(result.ast, {minify: false, removeComments: true, preserveLicense: true}).code).equals(`.nav-pills {
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
        }).then(result => f(render(result.ast, {
            minify: false,
            removeComments: false,
            preserveLicense: true}).code).equals(`/* this is a comment */
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
        }).then(result => f(render(result.ast, {
            minify: false,
            removeComments: false,
            preserveLicense: true}).code).equals(`/*! this is a comment */
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
        }).then(result => f(render(result.ast, {
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
        }).then(result => f(render(result.ast, {
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
        }).then(result => f(render(result.ast, {
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
transition: all 0s ease 0s; flex: 0 1 0%; position: relative; align-self: stretch; display: flex; align-items: center; }}

`;
        return parse(file, {
            minify: true,
            nestingRules: true
        }).then(result => f(render(result.ast, {
            minify: false,
            removeComments: true,
            preserveLicense: true
        }).code).equals(`.site-header .logo {
 transition: all 0s ease 0s;
 flex: 0 1 0%;
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
        }).then(result => f(render(result.ast, {
            minify: false,
            removeComments: true,
            preserveLicense: true
        }).code).equals(`a {
 overflow: hidden
}`));
    });
});
