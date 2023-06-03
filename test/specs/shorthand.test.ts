import {expect} from "@esm-bundle/chai";
import {readFile} from "fs/promises";
import {parse, render} from "../../src";
import {dirname} from "path";

const dir = dirname(new URL(import.meta.url).pathname) + '/../files';

const marginPadding = `

.test {
margin: 10px 0 10px 5px;
top: 4px;
padding: 2px 0 0 0;
padding-left: 25px;
padding-right: 25px;
padding-top: 25px;
}

.test {
margin-right: 0px;
padding-right: 0;
padding-top: 0
}

.test {

margin-bottom: 0px;
text-align: justify;
}

.test {

padding-left: 0px;
margin-top: 0px;
`;

const borderRadius1 = `

.test {
border-radius: 4px 3px 6px / 2px 4px;
border-top-left-radius: 4px 5px;
`;

const borderRadius2 = `

.test {border-top-left-radius: 4px 2px;
border-top-right-radius: 3px 4px;
border-bottom-right-radius: 6px 2px;
border-bottom-left-radius: 3px 4px;
`;

describe('shorthand', function () {

    it('margin padding', async function () {

        expect(render(parse(marginPadding, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true})).equals('.test{margin:0 0 0 5px;top:4px;padding:0;text-align:justify}')
    });

    it('border-radius #1', async function () {

        expect(render(parse(borderRadius1, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true})).equals('.test{border-radius:4px 3px 6px/5px 4px 2px}')
    });

    it('border-radius #2', async function () {

        expect(render(parse(borderRadius2, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true})).equals('.test{border-radius:4px 3px 6px/2px 4px}')
    });
});