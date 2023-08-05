/* generate from test/specs/block.spec.ts */
import { expect as f } from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import { readFile } from 'fs/promises';
import { transform } from '../../dist/node/index.js';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const dir = dirname(new URL(import.meta.url).pathname) + '/../files';
describe('parse block', function () {

    it('parse file', function () {
        return readFile(`${dir}/css/smalli.css`, { encoding: 'utf-8' }).then(file => transform(file).then(result => f(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/smalli.json')).toString()))));
    });

    it('parse file #2', function () {
        return readFile(`${dir}/css/small.css`, { encoding: 'utf-8' }).then(file => transform(file).then(result => f(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/small.json')).toString()))));
    });

    it('parse file #3', function () {
        readFile(`${dir}/css/invalid-1.css`, { encoding: 'utf-8' }).then(file => transform(file).then(result => f(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/invalid-1.json')).toString()))));
    });

    it('parse file #4', function () {
        return readFile(`${dir}/css/invalid-2.css`, { encoding: 'utf-8' }).then(file => transform(file).then(result => f(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/invalid-2.json')).toString()))));
    });

    it('similar rules #5', function () {
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

    it('similar rules #5', function () {
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

    it('duplicated selector components #6', function () {
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

    it('merge selectors #7', function () {
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

    it('merge selectors #8', function () {
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

    it('merge selectors #9', function () {
        const file = `

.card {
    --bs-card-inner-border-radius: calc(var(--bs-border-radius) - (var(--bs-border-width)));
}

`;
        return transform(file, {
            minify: true
        }).then(result => f(result.code).equals(`.card{--bs-card-inner-border-radius:calc(var(--bs-border-radius) - (var(--bs-border-width)))}`));
    });

    it('merge selectors #10', function () {
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

    it('merge selectors #11', function () {
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

    it('merge selectors #12', function () {
        const file = `
.bs-popover-auto[data-popper-placement^=top]>.popover-arrow,.bs-popover-top>.popover-arrow{bottom:calc(-1 * (var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))}

`;
        return transform(file, {
            minify: true
        }).then(result => f(result.code).equals(`.bs-popover-auto[data-popper-placement^=top]>.popover-arrow,.bs-popover-top>.popover-arrow{bottom:calc(-1 * (var(--bs-popover-arrow-height)) - var(--bs-popover-border-width))}`));
    });

    it('merge selectors #13', function () {
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
        }).then(result => f(result.code).equals(`abbr:is([title],[data-original-title],abbr>[data-original-title]){text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`));
    });
});
