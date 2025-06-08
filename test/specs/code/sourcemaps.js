

export function run(describe, expect, transform, parse, render, dirname, readFile, ) {

    describe('sourcemap', function () {

        const dir = import.meta.dirname + '/../..';
        const file = `@import '${dir}/files/css/line-awesome.css`;
        const options = {
            // minify: true,
            // preserveLicense: true,
            src: `${dir}/line-awesome.css`,
            resolveImport: true,
            sourcemap: true, nestingRules: false
        };

        it('sourcemap file #1', async () => {

            return parse(file, options).then(async result => {

                const output = render(result.ast, {...options, minify: false, removeComments: true});
                return readFile(`${dir}/files/sourcemap/line-awesome-sourcemap.css`, {encoding: 'utf-8'}).then(expected => expect(`/*# sourceMappingURL=data:application/json,${encodeURIComponent(JSON.stringify(output.map))} */`).equals(expected));
            });
        });
    });
}