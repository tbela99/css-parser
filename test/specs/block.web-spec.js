/* generate from test/specs/block.web-spec.ts */
import {expect as f} from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import {transform} from '../../dist/web/index.js';

function readFile(path) {
    return fetch(path).then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error(`${response.status} ${response.statusText}`);
    });
}

function dirname(path) {
    path = path.replace(/[?#].*$/, '').replace(/[/]*$/, '');
    const index = path.lastIndexOf('/');
    if (index == 0) {
        return '/';
    }
    return index < 0 ? '' : path.slice(0, index);
}

const dir = dirname(new URL(import.meta.url).pathname) + '/../files';
describe('parse block', function () {
    it('parse file', function () {
        return readFile(`${dir}/css/smalli.css`).then(file => transform(file).then(async (result) => f(result.ast).deep.equals(JSON.parse((await readFile(dir + '/json/smalli.json')).toString()))));
    });
    it('parse file #2', function () {
        return readFile(`${dir}/css/small.css`).then(file => transform(file).then(async (result) => f(result.ast).deep.equals(JSON.parse((await readFile(dir + '/json/small.json')).toString()))));
    });
    it('parse file #3', function () {
        return readFile(`${dir}/css/invalid-1.css`).then(file => transform(file).then(async (result) => f(result.ast).deep.equals(JSON.parse((await readFile(dir + '/json/invalid-1.json')).toString()))));
    });
    it('parse file #4', function () {
        return readFile(`${dir}/css/invalid-2.css`).then(file => transform(file).then(async (result) => f(result.ast).deep.equals(JSON.parse((await readFile(dir + '/json/invalid-2.json')).toString()))));
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
});
