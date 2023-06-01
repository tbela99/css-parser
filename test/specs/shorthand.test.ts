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

describe('shorthand', function () {

    it('margin padding', async function () {

        expect(render(parse(marginPadding, {
            deduplicate: true,
            removeEmpty: true
        }).ast, {compress: true})).equals('.test{margin:0 0 0 5px;top:4px;padding:0;text-align:justify}')
    });

});