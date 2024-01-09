
export function run(describe, expect, transform, parse, render, dirname, readFile) {

    const import1 = `@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.css';
`;
    describe('process import', function () {
        it('process import #2', function () {
            return readFile(dirname(new URL(import.meta.url).pathname) + '/../../files/result/font-awesome-all.css').
            then(file => transform(import1, {
                minify: false,
                resolveImport: true
            }).
            then((result) => expect(result.code).equals(file.trimEnd())));
        });
    });

}