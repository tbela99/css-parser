
export function run(describe, expect, it, transform) {

    describe('Parse angle', function () {

        it('angle #1', function () {
            return transform(`
.transform { transform: rotate(0.75turn, 2.356194rad, 100grad); }`).then(result => expect(result.code).equals(`.transform{transform:rotate(270deg,2.356194rad,90deg)}`));
        });
    });
}