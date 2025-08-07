
export function run(describe, expect, it, transform, parse, render, dirname) {

    const atRule = `
@import '${(import.meta.dirname ?? dirname(new URL(import.meta.url).pathname)) + '/../../files/css/color.css?v=1'}';
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
    });
}
