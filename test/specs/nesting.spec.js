/* generate from test/specs/nesting.spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform} from '../../dist/node/index.js';

describe('CSS Nesting', function () {
    it('nesting #1', function () {
        const nesting1 = `
.nesting {
  color: hotpink;
}

.nesting > .is {
  color: rebeccapurple;
}

.nesting > .is > .awesome {
  color: deeppink;
}
`;
        return transform(nesting1, {
            minify: true, nestingRules: true
        }).then((result) => f(result.code).equals(`.nesting{color:hotpink;>.is{color:#639;>.awesome{color:#ff1493}}}`));
    });

    it('nesting #2', function () {
        const nesting2 = `
.nav-link:focus, .nav-link:hover {
    color: var(--bs-nav-link-hover-color)
}

`;
        return transform(nesting2, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.nav-link{&:focus,&:hover{color:var(--bs-nav-link-hover-color)}}`));
    });
    it('nesting #3', function () {
        const nesting3 = `
.nav-link:focus, .nav-link:hover {
    color: var(--bs-nav-link-hover-color)
}

.nav-link:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 .25rem rgba(13, 110, 253, .25)
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.nav-link{&:focus,&:hover{color:var(--bs-nav-link-hover-color)}&:focus-visible{outline:0;box-shadow:0 0 0 .25rem #0d6efd40}}`));
    });
    it('nesting #4', function () {
        const nesting3 = `

.nav-link:focus, .nav-link:hover {
    color: var(--bs-nav-link-hover-color)
}

.nav-link:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 .25rem rgba(13, 110, 253, .25)
}

.nav-link.disabled {
    color: var(--bs-nav-link-disabled-color);
    pointer-events: none;
    cursor: default
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.nav-link{&:focus,&:hover{color:var(--bs-nav-link-hover-color)}&:focus-visible{outline:0;box-shadow:0 0 0 .25rem #0d6efd40}&.disabled{color:var(--bs-nav-link-disabled-color);pointer-events:none;cursor:default}}`));
    });
    it('nesting #5', function () {
        const nesting3 = `

.nav-link:focus, .nav-link:hover {
    color: var(--bs-nav-link-hover-color)
}

.nav-link:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 .25rem rgba(13, 110, 253, .25)
}

.nav-link.disabled {
    color: var(--bs-nav-link-disabled-color);
    pointer-events: none;
    cursor: default
}

.nav-link:disabled {
    color: var(--bs-nav-link-disabled-color);
    pointer-events: none;
    cursor: default
}
`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.nav-link{&:focus,&:hover{color:var(--bs-nav-link-hover-color)}&:focus-visible{outline:0;box-shadow:0 0 0 .25rem #0d6efd40}&.disabled,&:disabled{color:var(--bs-nav-link-disabled-color);pointer-events:none;cursor:default}}`));
    });
    it('nesting #6', function () {
        const nesting3 = `

.form-floating > .form-control, .form-floating > .form-control-plaintext, .form-floating > .form-select {
    height: calc(3.5rem + calc(var(--bs-border-width) * 2));
}
`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.form-floating{>.form-control,>.form-control-plaintext,>.form-select{height:calc(3.5rem + calc(var(--bs-border-width) * 2))}}`));
    });
    it('nesting #7', function () {
        const nesting3 = `

.form-floating {
    position: relative
}

.form-floating > .form-control, .form-floating > .form-control-plaintext, .form-floating > .form-select {
    height: calc(3.5rem + calc(var(--bs-border-width) * 2));
    min-height: calc(3.5rem + calc(var(--bs-border-width) * 2));
    line-height: 1.25;
    z-index: 2;
    white-space: nowrap;
}

.form-floating > label {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    height: 100%;
    padding: 1rem .75rem;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
    border: var(--bs-border-width) solid transparent;
    transform-origin: 0 0;
    transition: opacity .1s ease-in-out, transform .1s ease-in-out
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.form-floating{position:relative;>.form-control,>.form-control-plaintext,>.form-select{height:calc(3.5rem + calc(var(--bs-border-width) * 2));min-height:calc(3.5rem + calc(var(--bs-border-width) * 2));line-height:1.25;z-index:2;white-space:nowrap}>label{position:absolute;top:0;left:0;z-index:2;height:100%;padding:1rem .75rem;overflow:hidden;text-align:start;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;border:var(--bs-border-width) solid #0000;transform-origin:0 0;transition:opacity .1s ease-in-out,transform .1s ease-in-out}}`));
    });

    it('nesting #8', function () {
        const nesting3 = `

.card {
    --bs-card-spacer-y: 1rem;
    --bs-card-spacer-x: 1rem;
    --bs-card-title-spacer-y: 0.5rem;
    --bs-card-title-color: ;
    --bs-card-subtitle-color: ;
    --bs-card-border-width: var(--bs-border-width);
    --bs-card-border-color: var(--bs-border-color-translucent);
    --bs-card-border-radius: var(--bs-border-radius);
    --bs-card-box-shadow: ;
    --bs-card-inner-border-radius: calc(var(--bs-border-radius) - (var(--bs-border-width)));
    --bs-card-cap-padding-y: 0.5rem;
    --bs-card-cap-padding-x: 1rem;
    --bs-card-cap-bg: rgba(var(--bs-body-color-rgb), 0.03);
    --bs-card-cap-color: ;
    --bs-card-height: ;
    --bs-card-color: ;
    --bs-card-bg: var(--bs-body-bg);
    --bs-card-img-overlay-padding: 1rem;
    --bs-card-group-margin: 0.75rem;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: var(--bs-card-height);
    color: var(--bs-body-color);
    word-wrap: break-word;
    background-color: var(--bs-card-bg);
    background-clip: border-box;
    border: var(--bs-card-border-width) solid var(--bs-card-border-color);
    border-radius: var(--bs-card-border-radius)
}

.card > hr {
    margin-right: 0;
    margin-left: 0
}
`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.card{--bs-card-spacer-y:1rem;--bs-card-spacer-x:1rem;--bs-card-title-spacer-y:.5rem;--bs-card-border-width:var(--bs-border-width);--bs-card-border-color:var(--bs-border-color-translucent);--bs-card-border-radius:var(--bs-border-radius);--bs-card-inner-border-radius:calc(var(--bs-border-radius) - (var(--bs-border-width)));--bs-card-cap-padding-y:.5rem;--bs-card-cap-padding-x:1rem;--bs-card-cap-bg:rgba(var(--bs-body-color-rgb),.03);--bs-card-bg:var(--bs-body-bg);--bs-card-img-overlay-padding:1rem;--bs-card-group-margin:.75rem;position:relative;display:flex;flex-direction:column;min-width:0;height:var(--bs-card-height);color:var(--bs-body-color);word-wrap:break-word;background-color:var(--bs-card-bg);background-clip:border-box;border:var(--bs-card-border-width) solid var(--bs-card-border-color);border-radius:var(--bs-card-border-radius);>hr{margin-right:0;margin-left:0}}`));
    });
    it('nesting #9', function () {
        const nesting3 = `
.tab-content{>.tab-pane{display:none}>.active{display:block}}.navbar{--bs-navbar-padding-x:0;--bs-navbar-padding-y:.5rem;--bs-navbar-color:rgba(var(--bs-emphasis-color-rgb),.65);--bs-navbar-hover-color:rgba(var(--bs-emphasis-color-rgb),.8);--bs-navbar-disabled-color:rgba(var(--bs-emphasis-color-rgb),.3);--bs-navbar-active-color:rgba(var(--bs-emphasis-color-rgb),1);--bs-navbar-brand-padding-y:.3125rem;--bs-navbar-brand-margin-end:1rem;--bs-navbar-brand-font-size:1.25rem;--bs-navbar-brand-color:rgba(var(--bs-emphasis-color-rgb),1);--bs-navbar-brand-hover-color:rgba(var(--bs-emphasis-color-rgb),1);--bs-navbar-nav-link-padding-x:.5rem;--bs-navbar-toggler-padding-y:.25rem;--bs-navbar-toggler-padding-x:.75rem;--bs-navbar-toggler-font-size:1.25rem;--bs-navbar-toggler-icon-bg:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2833, 37, 41, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");--bs-navbar-toggler-border-color:rgba(var(--bs-emphasis-color-rgb),.15);--bs-navbar-toggler-border-radius:var(--bs-border-radius);--bs-navbar-toggler-focus-width:.25rem;--bs-navbar-toggler-transition:box-shadow .15s ease-in-out;position:relative;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:var(--bs-navbar-padding-y) var(--bs-navbar-padding-x);>.container,>.container-fluid,>.container-lg,>.container-md,>.container-sm,>.container-xl,>.container-xxl{display:flex;flex-wrap:inherit;align-items:center;justify-content:space-between}}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.tab-content{>.tab-pane{display:none}>.active{display:block}}.navbar{--bs-navbar-padding-x:0;--bs-navbar-padding-y:.5rem;--bs-navbar-color:rgba(var(--bs-emphasis-color-rgb),.65);--bs-navbar-hover-color:rgba(var(--bs-emphasis-color-rgb),.8);--bs-navbar-disabled-color:rgba(var(--bs-emphasis-color-rgb),.3);--bs-navbar-active-color:rgba(var(--bs-emphasis-color-rgb),1);--bs-navbar-brand-padding-y:.3125rem;--bs-navbar-brand-margin-end:1rem;--bs-navbar-brand-font-size:1.25rem;--bs-navbar-brand-color:rgba(var(--bs-emphasis-color-rgb),1);--bs-navbar-brand-hover-color:rgba(var(--bs-emphasis-color-rgb),1);--bs-navbar-nav-link-padding-x:.5rem;--bs-navbar-toggler-padding-y:.25rem;--bs-navbar-toggler-padding-x:.75rem;--bs-navbar-toggler-font-size:1.25rem;--bs-navbar-toggler-icon-bg:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2833, 37, 41, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");--bs-navbar-toggler-border-color:rgba(var(--bs-emphasis-color-rgb),.15);--bs-navbar-toggler-border-radius:var(--bs-border-radius);--bs-navbar-toggler-focus-width:.25rem;--bs-navbar-toggler-transition:box-shadow .15s ease-in-out;position:relative;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:var(--bs-navbar-padding-y) var(--bs-navbar-padding-x);>.container,>.container-fluid,>.container-lg,>.container-md,>.container-sm,>.container-xl,>.container-xxl{display:flex;flex-wrap:inherit;align-items:center;justify-content:space-between}}`));
    });

    it('nesting #10', function () {
        const nesting3 = `


.navbar-text {
    padding-top: .5rem;
    padding-bottom: .5rem;
    color: var(--bs-navbar-color)
}

.navbar-text a, .navbar-text a:focus, .navbar-text a:hover {
    color: var(--bs-navbar-active-color)
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.navbar-text{padding-top:.5rem;padding-bottom:.5rem;color:var(--bs-navbar-color);a{&,&:focus,&:hover{color:var(--bs-navbar-active-color)}}}`));
    });

    it('nesting #11', function () {
        const nesting3 = `

.table-bordered > :not(caption) > * {
    border-width: var(--bs-border-width) 0
}

.table-bordered > :not(caption) > * > * {
    border-width: 0 var(--bs-border-width)
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.table-bordered>:not(caption)>*{border-width:var(--bs-border-width) 0;>*{border-width:0 var(--bs-border-width)}}`));
    });


    it('nesting #12', function () {
        const nesting3 = `

.dropdown-item {
    display: block;
    width: 100%;
    padding: var(--bs-dropdown-item-padding-y) var(--bs-dropdown-item-padding-x);
    clear: both;
    font-weight: 400;
    color: var(--bs-dropdown-link-color);
    text-align: inherit;
    text-decoration: none;
    white-space: nowrap;
    background-color: transparent;
    border: 0;
    border-radius: var(--bs-dropdown-item-border-radius, 0)
}

.dropdown-item:focus, .dropdown-item:hover {
    color: var(--bs-dropdown-link-hover-color);
    background-color: var(--bs-dropdown-link-hover-bg)
}

.dropdown-item.active, .dropdown-item:active {
    color: var(--bs-dropdown-link-active-color);
    text-decoration: none;
    background-color: var(--bs-dropdown-link-active-bg)
}

.dropdown-item.disabled, .dropdown-item:disabled {
    color: var(--bs-dropdown-link-disabled-color);
    pointer-events: none;
    background-color: transparent
}
`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.dropdown-item{display:block;width:100%;padding:var(--bs-dropdown-item-padding-y) var(--bs-dropdown-item-padding-x);clear:both;font-weight:400;color:var(--bs-dropdown-link-color);text-align:inherit;text-decoration:none;white-space:nowrap;background-color:#0000;border:0;border-radius:var(--bs-dropdown-item-border-radius,0);&:focus,&:hover{color:var(--bs-dropdown-link-hover-color);background-color:var(--bs-dropdown-link-hover-bg)}&.active,&:active{color:var(--bs-dropdown-link-active-color);text-decoration:none;background-color:var(--bs-dropdown-link-active-bg)}&.disabled,&:disabled{color:var(--bs-dropdown-link-disabled-color);pointer-events:none;background-color:#0000}}`));
    });

    it('nesting #13', function () {
        const nesting3 = `

[data-bs-theme=dark] .carousel .carousel-control-next-icon, [data-bs-theme=dark] .carousel .carousel-control-prev-icon, [data-bs-theme=dark].carousel .carousel-control-next-icon, [data-bs-theme=dark].carousel .carousel-control-prev-icon {
    filter: invert(1) grayscale(100)
}

[data-bs-theme=dark] .carousel .carousel-indicators [data-bs-target], [data-bs-theme=dark].carousel .carousel-indicators [data-bs-target] {
    background-color: #000
}

[data-bs-theme=dark] .carousel .carousel-caption, [data-bs-theme=dark].carousel .carousel-caption {
    color: #000
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`[data-bs-theme=dark]{.carousel .carousel-control-next-icon,.carousel .carousel-control-prev-icon,&.carousel .carousel-control-next-icon,&.carousel .carousel-control-prev-icon{filter:invert(1) grayscale(100)}.carousel .carousel-indicators [data-bs-target],&.carousel .carousel-indicators [data-bs-target]{background-color:#000}.carousel .carousel-caption,&.carousel .carousel-caption{color:#000}}`));
    });

    it('nesting #14', function () {
        const nesting3 = `

.demo.lg.triangle {
    opacity: .25;
    filter: blur(25px);
    }
  .demo.lg.circle {
    opacity: .25;
    filter: blur(25px);
  }
}
`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.demo.lg{&.triangle,&.circle{opacity:.25;filter:blur(25px)}}`));
    });

    it('nesting #15', function () {
        const nesting3 = `

.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
    color: var(--bs-nav-pills-link-active-color);
    background-color: var(--bs-nav-pills-link-active-bg)
}

`;
        return transform(nesting3, {
            minify: true, nestingRules: true, resolveImport: true
        }).then((result) => f(result.code).equals(`.nav-pills{.nav-link.active,.show>.nav-link{color:var(--bs-nav-pills-link-active-color);background-color:var(--bs-nav-pills-link-active-bg)}}`));
    });


    it('merge selectors #16', function () {
        const file = `

a {
    color: rgba(var(--bs-link-color-rgb), var(--bs-link-opacity, 1));
    text-decoration: underline;
}
    a :hover {
        --bs-link-color-rgb: var(--bs-link-hover-color-rgb)
    }

 a   span {
        --bs-link-color-rgb: var(--bs-link-hover-color-rgb)
    }

`;
        return transform(file, {
            nestingRules: true,
            minify: true
        }).then(result => f(result.code).equals(`a{color:rgba(var(--bs-link-color-rgb),var(--bs-link-opacity,1));text-decoration:underline;:hover,& span{--bs-link-color-rgb:var(--bs-link-hover-color-rgb)}}`));
    });

    // see https://www.w3.org/TR/css-nesting-1/#conditionals

    /*

// .parent {
//     color: red;
// }
// .parent
//
//     /*
//     Valid because it begins with a combinator, which is a
//     form of relative selector.
//     */
//     > .descendant {
//             border: 1px solid black;
//         }
//     .parent
//
//             /*
//             Valid because it's equivalent of *.img, which is a complex
//             selector. Complex selectors are also a form of relative
//             selector.
//             */
//             .nested {
//             font-style: italic;
//         }
//     .parent
//
//         /* Not valid. Type (element) selectors are not relative selectors. */
//         img {
//             box-shadow: 0 0 10px 5px rgba(0 0 0 .5);
//         }
//     }
//      */
    /*
    .foo {
  display: grid;
}

@media (width => 30em) {
  .foo {
    grid-auto-flow: column;
  }
}
     */
    /*
    @media, @supports)

@layer

@scope

@container

*/

//     it('nesting #16', function () {
//         const nesting3 = `
// .header {
//   background-color: white;
// }
//
// .dark .header {
//     background-color: blue;
// }
// `;
//         return transform(nesting3, {
//             minify: true, nestingRules: true, resolveImport: true
//         }).then((result) => f(result.code).equals(`.nav-pills{.nav-link.active,.show>.nav-link{color:var(--bs-nav-pills-link-active-color);background-color:var(--bs-nav-pills-link-active-bg)}}`));
//     });

//     it('nesting #17', function () {
//         const nesting3 = `
// .header {
//   font-size: 40px;
// }
//
// @media (max-width: 760px) {
//   .header {
//     font-size: 24px;
//   }
// }
// `;
//         return transform(nesting3, {
//             minify: true, nestingRules: true, resolveImport: true
//         }).then((result) => f(result.code).equals(`.header {
//   font-size: 40px
//
//   @media (max-width: 760px ) {
//     & {
//       font-size: 24px;
//     }
//   }
// }`));
//     });
});
