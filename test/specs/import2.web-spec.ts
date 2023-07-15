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


const import1 = `@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css';
`;
describe('process import', function () {


    it('process import #2', function () {

        return fetch(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-all.css').
        then(response => response.text()).
        then(file => transform(import1, {
            compress: false,
            resolveImport: true
        }).then((result: TransformResult) => {

            // const a = document.createElement('a');
            //
            // a.download = 'web-font-awesome-all.css';
            // a.href = URL.createObjectURL(new Blob([result.code], {type: 'text/css'}));
            //
            // document.body.append(a);
            //
            // a.click();

            return expect(result.code).equals(file.trimEnd())
        }))

    });
});