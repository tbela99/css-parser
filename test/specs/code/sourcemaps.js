export function run(describe, expect, it, transform, parse, render, dirname, readFile, resolve) {

    // describe('sourcemap', function () {
    //
    //     const dir = resolve((import.meta.dirname ?? dirname(new URL(import.meta.url).pathname)) + '/../..').absolute;
    //     const file = `@import '${dir}/files/css/line-awesome.css`;
    //     const options = {
    //         // minify: true,
    //         // preserveLicense: true,
    //         src: `${dir}/files/css/line-awesome.css`,
    //         resolveImport: true,
    //         sourcemap: true,
    //         nestingRules: false
    //     };
    //
    //     it('sourcemap file #1', async () => {
    //
    //         return transform(file, options).then(async result => {
    //
    //             return readFile(`${dir}/files/sourcemap/line-awesome-sourcemap.css`, {encoding: 'utf-8'}).then(expected => expect(`/*# sourceMappingURL=${result.map.toUrl()} */`).equals(expected.trim()));
    //         });
    //     });
    // });
}