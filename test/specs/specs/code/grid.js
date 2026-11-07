
export function run(describe, expect, it, transform, parse, render) {

    describe('grid', function () {

        it('grid template #1', function () {
            const css = `

._19_u :focus {
grid-template-areas: "head head"
                       "nav  main"
                       "foot ...." "bob";
}

`;
            return transform(css).then(result => expect(result.code).equals('._19_u :focus{grid-template-areas:"head head""nav main""foot.""bob"}'));
            });
        });

}
