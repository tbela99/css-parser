import {expect} from "@esm-bundle/chai";
import {readFile} from "fs/promises";
import {transform} from "../../src";
import {dirname} from "path";
import {readFileSync} from "fs";

const dir = dirname(new URL(import.meta.url).pathname) + '/../files';
const atRule = `@media all {:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] {
    --color-canvas-default-transparent: rgba(255,255,255,0);
    --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;
    --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;
}}
`;

const Rule = `:root, [data-color-mode="light"][data-light-theme="light"], [data-color-mode="dark"][data-dark-theme="light"] {
    --color-canvas-default-transparent: rgba(255,255,255,0);
    --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;
    --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;
}
`;

function toStringProperties(info: { [s: string]: string | string[]; } | ArrayLike<unknown>) {

    return Object.entries(info).reduce((acc, curr) => {

        // @ts-ignore
        acc[curr[0]] = Array.isArray(curr[1]) ? curr[1].join('') : curr[1]

        return acc;
    }, {});
}

describe('parse block', function () {

    it('parse file', async function () {

        const file = (await readFile(`${dir}/css/smalli.css`)).toString();

        transform(file).then(result => expect(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/smalli.json')).toString())))
    });

    it('parse file #2', async function () {

        const file = (await readFile(`${dir}/css/small.css`)).toString();

        transform(file).then(result => expect(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/small.json')).toString())))
    });

    it('parse file #3', async function () {

        const file = (await readFile(`${dir}/css/invalid-1.css`)).toString();

        transform(file).then(result => expect(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/invalid-1.json')).toString())))
    });

    it('parse file #4', async function () {

        const file = (await readFile(`${dir}/css/invalid-2.css`)).toString();

        transform(file).then(result => expect(result.ast).deep.equals(JSON.parse((readFileSync(dir + '/json/invalid-2.json')).toString())))
    });

    it('similar rules #5', async function () {

        const file = `
.clear {
  width: 0;
  height: 0;
}

.clearfix:before {

  height: 0;
  width: 0;
}`;

        transform(file, {
            compress: true
        }).then(result => expect(result.code).equals(`.clear,.clearfix:before{width:0;height:0}`))
    });

    it('similar rules #5', async function () {

        const file = `
.clear {
  width: 0;
  height: 0;
}

.clearfix:before {

  height: 0;
  width: 0;
}`;

        transform(file, {
            compress: true
        }).then(result => expect(result.code).equals(`.clear,.clearfix:before{width:0;height:0}`))
    });

    it('duplicated selector components #6', async function () {

        const file = `

:is(.test input[type="text"]), .test input[type="text"], :is(.test input[type="text"], a) {
border-top-color: gold;
border-right-color: red;
border-bottom-color: gold;
border-left-color: red;
`;

        transform(file, {
            compress: true
        }).then(result => expect(result.code).equals(`.test input[type=text],a{border-color:gold red}`))
    });
});