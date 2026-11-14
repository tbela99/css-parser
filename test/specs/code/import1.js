
export function run(describe, expect, it, transform, parse, render, dirname) {

    const root = new URL(dirname(import.meta.url) + '/../../../');
    const url = new URL(dirname(import.meta.url) + '/../../files/css/color.css?v=1');
    const atRule = `
@import '${url.pathname.replace(root.pathname, '')}';
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
                resolveImport: true, nestingRules: false
            }).then((result) => expect(result.code).equals(`p{color:#8133cc26}abbr[title],abbr[data-original-title]{text-decoration:underline dotted;-webkit-text-decoration:underline dotted;cursor:help;border-bottom:0;-webkit-text-decoration-skip-ink:none;text-decoration-skip-ink:none}`));
        });

        it('custom loader #2', function () {
            const loaded = [];

            return transform(`@import 'virtual.css';.a{color:red}`, {
                minify: true,
                resolveImport: true,
                load: (url) => {
                    loaded.push(typeof url == 'string' ? url : url.relative);
                    return Promise.resolve('.virtual{color:blue}');
                }
            }).then((result) => {
                expect(loaded).deep.equals(['virtual.css']);
                expect(result.code).equals(`.virtual{color:blue}.a{color:red}`);
            });
        });
    });
}
