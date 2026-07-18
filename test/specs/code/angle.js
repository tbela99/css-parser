
export function run(describe, expect, it, transform) {

    describe('Parse angle', function () {

        it('angle #1', function () {
            return transform(`
.transform { transform: rotate(0.75turn, 2.356194rad, 100grad); }`).then(result => expect(result.code).equals(`.transform{transform:rotate(270deg,.375turn,90deg)}`));
        });
        it('angle #2', function () {
            return transform(`
.transform { background: conic-gradient(black 0.75turn, green 2.356194rad, blue 100grad); }`).then(result => expect(result.code).equals(`.transform{background:conic-gradient(#000 270deg,green .375turn,blue 90deg)}`));
        });
        it('angle #3', function () {
            return transform(`
.transform { background: conic-gradient(black 0.75turn, black 2.356194rad, blue 100grad); }`).then(result => expect(result.code).equals(`.transform{background:conic-gradient(#000 270deg .375turn,blue 90deg)}`));
        });
    });
}