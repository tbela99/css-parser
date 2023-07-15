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

const import2 = `@import 'https://maxst.icons8.com/vue-static/landings/line-awesome/font-awesome-line-awesome/css/all.min.css'`;

describe('process import', function () {

    it('process import #3', function () {

        return fetch(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-line-awesome.css').
        then(response => response.text()).
        then(file => transform(import2, {
            compress: true,
            resolveImport: true
        }).then((result: TransformResult) => {

            // const a = document.createElement('a');
            //
            // a.download = 'web-all.css';
            // a.href = URL.createObjectURL(new Blob([result.code], {type: 'text/css'}));
            //
            // document.body.append(a);
            //
            // a.click();

            return expect(result.code).equals(file.trimEnd())
        }))

    });
});