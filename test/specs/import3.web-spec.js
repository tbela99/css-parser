/* generate from test/specs/import3.web-spec.ts */
import { expect as f } from '../../node_modules/@esm-bundle/chai/esm/chai.js';
import { transform , dirname} from '../../dist/web/index.js';

const import2 = `@import 'https://maxst.icons8.com/vue-static/landings/line-awesome/font-awesome-line-awesome/css/all.min.css'`;
describe('process import', function () {
    it('process import #3', function () {
        return fetch(dirname(new URL(import.meta.url).pathname) + '/../files/result/font-awesome-line-awesome.css').
            then(response => response.text()).
            then(file => transform(import2, {
            minify: true,
            resolveImport: true
        }).then((result) => {
            // const a = document.createElement('a');
            //
            // a.download = 'web-all.css';
            // a.href = URL.createObjectURL(new Blob([result.code], {type: 'text/css'}));
            //
            // document.body.append(a);
            //
            // a.click();
            return f(result.code).equals(file.trimEnd());
        }));
    });
});
