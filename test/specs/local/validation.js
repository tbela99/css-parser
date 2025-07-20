export function run(describe, expect, transform, parse, render, dirname, readFile) {


    it('validation #1', function (done) {

        transform(`@import '${import.meta.dirname ?? dirname(new URL(import.meta.url).pathname)}/../../files/css/full.css';
`, {validation: true, resolveImport: true}).then(result => expect(result.errors.length).equals(1)).then(() => done(), () => done());
    });

    it('validation #2', function (done) {

        transform(`@import '${import.meta.dirname ?? dirname(new URL(import.meta.url).pathname)}/../../files/css/bootstrap.css';
`, {
            validation: true,
            resolveImport: true
        }).then(result => expect(result.errors.length).equals(2)).then(() => done(), () => done());
    });
}