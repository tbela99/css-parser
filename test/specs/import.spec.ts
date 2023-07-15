import {expect} from "@esm-bundle/chai";
import {TransformResult} from "../../src/@types";
import {transform} from "../../src";
import {dirname} from "path";

const atRule = `
@import '${dirname(new URL(import.meta.url).pathname) + '/../files/css/color.css'}';
abbr[title], abbr[data-original-title] {
    text-decoration: underline dotted;
    -webkit-text-decoration: underline dotted;
    cursor: help;
    border-bottom: 0;
    -webkit-text-decoration-skip-ink: none;
    text-decoration-skip-ink: none
}

`;

describe('process import', function () {

    it('process import #1', async function () {

        transform(atRule, {
            compress: true,
            resolveImport: true
        }).then((result: TransformResult) => expect(result.code).equals(`p{color:#8133cc26}abbr[title],abbr[data-original-title]{text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`))
    });
});

