/* generate from test/specs/import2.web-spec.ts */
import { expect as f } from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import { transform } from '../../dist/web/index.js';

function dirname(path) {
    path = path.replace(/[?#].*$/, '').replace(/[/]*$/, '');
    const index = path.lastIndexOf('/');
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
            minify: false,
            resolveImport: true
        }).then((result) => {
            // const a = document.createElement('a');
            //
            // a.download = 'web-font-awesome-all.css';
            // a.href = URL.createObjectURL(new Blob([result.code], {type: 'text/css'}));
            //
            // document.body.append(a);
            //
            // a.click();
            return f(result.code).equals(file.trimEnd());
        }));
    });
});
