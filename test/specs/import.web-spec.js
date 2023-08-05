/* generate from test/specs/import.web-spec.ts */
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
    it('process import #1', function () {
        return transform(atRule, {
            minify: true,
            resolveImport: true
        }).then(result => f(result.code).equals(`p{color:#8133cc26}abbr:is([title],[data-original-title]){text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`));
    });
});
