
export function run(describe, expect, transform, parse, render, dirname, readFile) {

    const import2 = `@import 'https://maxst.icons8.com/vue-static/landings/line-awesome/font-awesome-line-awesome/css/all.min.css'`;
    describe('process import', function () {
        it('process import #3', function () {
            return readFile(dirname(new URL(import.meta.url).pathname) + '/../../files/result/font-awesome-line-awesome.css').
            then(file => transform(import2, {
                minify: true,
                resolveImport: true
            }).then((result) => expect(result.code).equals(file.trim())));
        });
    });

}