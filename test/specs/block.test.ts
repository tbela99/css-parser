import {parseBlock} from "../../src/parser/utils/block";
import {expect} from "@esm-bundle/chai";
// import {dirname} from "path";
const {readFile} = require("fs/promises");
import {Parser} from "../../src";
import {find} from "../../src/parser/utils/find";

const dir = __dirname + '/../files';
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

function toStringProperties(info) {

    const result = Object.entries(info).reduce((acc, curr) => {

        // @ts-ignore
        acc[curr[0]] = Array.isArray(curr[1]) ? curr[1].join('') : curr[1]

        return acc;
    }, {});

    return result;

}

describe('parse block', function () {

    it('parse at-rules block', function () {

        const info = toStringProperties(parseBlock(atRule, 0));
        const info2 = toStringProperties(parseBlock(atRule, 0, find(atRule, 1, ';{}')));

        expect(info).deep.equals({
            type: "AtRule",
            selector: "@media all ",
            body: ":root, [data-color-mode=\"light\"][data-light-theme=\"light\"], [data-color-mode=\"dark\"][data-dark-theme=\"light\"] {\n    --color-canvas-default-transparent: rgba(255,255,255,0);\n    --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;\n    --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;\n}",
            block: "@media all {:root, [data-color-mode=\"light\"][data-light-theme=\"light\"], [data-color-mode=\"dark\"][data-dark-theme=\"light\"] {\n    --color-canvas-default-transparent: rgba(255,255,255,0);\n    --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;\n    --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;\n}}"
        });

        expect(info).deep.equals(info2);
    });

    it('parse rules block', function () {

        const info = toStringProperties(parseBlock(Rule, 0));
        const info2 = toStringProperties(parseBlock(Rule, 0, find(Rule, 1, ';{}')));

        expect(info).deep.equals({
            type: "Rule",
            selector: ":root, [data-color-mode=\"light\"][data-light-theme=\"light\"], [data-color-mode=\"dark\"][data-dark-theme=\"light\"] ",
            body: "\n    --color-canvas-default-transparent: rgba(255,255,255,0);\n    --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;\n    --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;\n",
            block: ":root, [data-color-mode=\"light\"][data-light-theme=\"light\"], [data-color-mode=\"dark\"][data-dark-theme=\"light\"] {\n    --color-canvas-default-transparent: rgba(255,255,255,0);\n    --color-page-header-bg: #f6f8fa; --color-marketing-icon-primary: #218bff; --color-marketing-icon-secondary: #54aeff;\n    --color-diff-blob-addition-num-text: #24292f; --color-diff-blob-addition-fg: #24292f; --color-diff-blob-addition-num-bg: #ccffd8;\n}"
        });

        expect(info2).deep.equals(info)
    });

    it('parse file', async function () {

        const file = (await readFile(`${dir}/smalli.css`)).toString();

        expect(new Parser().parse(file).getAst()).deep.equals(JSON.parse((await readFile(dir + '/json/smalli.json')).toString()))
    });

    it('parse file #2', async function () {

        const file = (await readFile(`${dir}/small.css`)).toString();

        expect(new Parser().parse(file).getAst()).deep.equals(JSON.parse((await readFile(dir + '/json/small.json')).toString()))
    });
});