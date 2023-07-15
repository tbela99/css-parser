import {expect} from "@esm-bundle/chai";
import {transform} from "../../src/web";
import {TransformResult} from "../../src/@types";

function dirname(path: string) {

	path = path.replace(/[?#].*$/, '').replace(/[/]*$/, '');

	const index: number = path.lastIndexOf('/');

	if (index == 0) {

		return '/';
	}

	return index < 0 ? '' : path.slice(0, index);
}

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

    it('process import #1',  function () {

       return transform(atRule, {
            compress: true,
           resolveImport: true
        }).then(result => expect(result.code).equals(`p{color:#8133cc26}abbr[title],abbr[data-original-title]{text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`))
    });
});